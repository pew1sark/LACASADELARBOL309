-- ============================================================
-- Precios detallados (editables desde el panel → Precios y servicios)
--
--  * Paquete:  precio base, precio de fin de semana, invitados incluidos y
--              valor por invitado adicional.
--  * Horario:  recargo por bloque (ej. la noche cuesta más).
--  * Extras:   categoría, cantidad máxima.
--  * Ajustes:  qué días cuentan como fin de semana.
--
-- El total siempre lo calcula la base de datos: el navegador muestra una
-- estimación con la misma fórmula, pero nunca decide el precio final.
-- ============================================================

alter table public.packages
  add column if not exists weekend_price numeric(12,0),
  add column if not exists included_guests int,
  add column if not exists extra_guest_price numeric(12,0) not null default 0;

alter table public.time_slots
  add column if not exists surcharge numeric(12,0) not null default 0;

alter table public.addons
  add column if not exists category text not null default 'Otros',
  add column if not exists max_quantity int;

alter table public.settings
  add column if not exists weekend_days smallint[] not null default '{5,6}';

alter table public.reservations
  add column if not exists pricing_detail jsonb;

-- Categorías iniciales para los extras sembrados.
update public.addons set category = case
  when name in ('Decoración temática','Globos y ambientación') then 'Decoración'
  when name in ('Animador infantil','DJ','Piñata') then 'Entretención'
  when name in ('Torta personalizada','Candy bar','Catering por persona') then 'Comida'
  when name in ('Fotografía') then 'Registro'
  when name in ('Hora extra') then 'Tiempo'
  else category end;

-- ------------------------------------------------------------
-- Cálculo del precio del paquete (base + invitados extra + recargo)
-- ------------------------------------------------------------
create or replace function public.package_quote(p_pkg public.packages, p_slot public.time_slots, p_date date, p_guests int)
returns jsonb language sql stable set search_path = public as $$
  with cfg as (select weekend_days from public.settings where id = 1),
  calc as (
    select
      extract(dow from p_date)::smallint = any (((select weekend_days from cfg))::smallint[]) as weekend,
      greatest(p_guests - coalesce(p_pkg.included_guests, p_guests), 0) as extra_guests
  )
  select jsonb_build_object(
    'weekend', c.weekend,
    'base', case when c.weekend and p_pkg.weekend_price is not null then p_pkg.weekend_price else p_pkg.price end,
    'extra_guests', c.extra_guests,
    'extra_guest_price', p_pkg.extra_guest_price,
    'extra_guests_total', c.extra_guests * p_pkg.extra_guest_price,
    'slot_surcharge', coalesce(p_slot.surcharge, 0),
    'package_total',
      (case when c.weekend and p_pkg.weekend_price is not null then p_pkg.weekend_price else p_pkg.price end)
      + c.extra_guests * p_pkg.extra_guest_price + coalesce(p_slot.surcharge, 0)
  ) from calc c;
$$;
revoke all on function public.package_quote(public.packages, public.time_slots, date, int) from anon, public;

-- ------------------------------------------------------------
-- create_reservation_request: igual que antes, con el precio detallado.
-- ------------------------------------------------------------
create or replace function public.create_reservation_request(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  cfg public.settings%rowtype;
  v_slot public.time_slots%rowtype;
  v_pkg public.packages%rowtype;
  v_date date; v_guests int;
  v_phone text; v_first text; v_last text; v_email text; v_whatsapp text;
  v_customer_id uuid; v_period tsrange; v_code text; v_res_id uuid;
  v_addons_total numeric(12,0) := 0; v_pkg_price numeric(12,0) := 0;
  v_quote jsonb := '{}'::jsonb;
  item jsonb; v_addon public.addons%rowtype; v_qty int; v_line numeric(12,0);
begin
  select * into cfg from public.settings where id = 1;

  v_date     := nullif(payload->>'event_date','')::date;
  v_guests   := coalesce(nullif(payload->>'guests','')::int, 0);
  v_first    := btrim(coalesce(payload->>'first_name',''));
  v_last     := btrim(coalesce(payload->>'last_name',''));
  v_phone    := regexp_replace(coalesce(payload->>'phone',''), '[^0-9+]', '', 'g');
  v_whatsapp := regexp_replace(coalesce(payload->>'whatsapp', payload->>'phone', ''), '[^0-9+]', '', 'g');
  v_email    := lower(btrim(coalesce(payload->>'email','')));

  if length(v_first) < 2 then raise exception 'NOMBRE_INVALIDO'; end if;
  if length(v_phone) < 8 then raise exception 'TELEFONO_INVALIDO'; end if;
  if v_email <> '' and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'EMAIL_INVALIDO'; end if;
  if v_date is null then raise exception 'FECHA_INVALIDA'; end if;
  if v_date < current_date + cfg.lead_time_days then raise exception 'FECHA_MUY_PRONTO'; end if;
  if v_date > current_date + cfg.max_advance_days then raise exception 'FECHA_MUY_LEJANA'; end if;
  if v_guests < 1 or v_guests > cfg.max_capacity then raise exception 'INVITADOS_INVALIDO'; end if;

  select * into v_slot from public.time_slots
   where id = nullif(payload->>'time_slot_id','')::uuid and active;
  if not found then raise exception 'HORARIO_INVALIDO'; end if;

  if extract(dow from v_date)::smallint <> all (v_slot.weekdays) then
    raise exception 'HORARIO_NO_DISPONIBLE';
  end if;

  v_period := public.slot_period(v_date, v_slot.start_time, v_slot.end_time);

  if exists (select 1 from public.blocked_dates b
              where b.date = v_date and (b.time_slot_id is null or b.time_slot_id = v_slot.id)) then
    raise exception 'HORARIO_NO_DISPONIBLE';
  end if;

  if exists (select 1 from public.reservations r
              where r.status in ('AWAITING_PAYMENT','CONFIRMED') and r.period && v_period) then
    raise exception 'HORARIO_NO_DISPONIBLE';
  end if;

  if nullif(payload->>'package_id','') is not null then
    select * into v_pkg from public.packages where id = (payload->>'package_id')::uuid and active;
    if not found then raise exception 'PAQUETE_INVALIDO'; end if;
    if v_guests > v_pkg.max_guests then raise exception 'INVITADOS_INVALIDO'; end if;
    v_quote := public.package_quote(v_pkg, v_slot, v_date, v_guests);
    v_pkg_price := (v_quote->>'package_total')::numeric;
  end if;

  select id into v_customer_id from public.customers where phone = v_phone;
  if v_customer_id is null then
    insert into public.customers (first_name, last_name, phone, whatsapp, email)
    values (v_first, nullif(v_last,''), v_phone, nullif(v_whatsapp,''), nullif(v_email,''))
    returning id into v_customer_id;
  else
    update public.customers
       set first_name = v_first,
           last_name  = coalesce(nullif(v_last,''), last_name),
           whatsapp   = coalesce(nullif(v_whatsapp,''), whatsapp),
           email      = coalesce(nullif(v_email,''), email)
     where id = v_customer_id;
  end if;

  if (select count(*) from public.reservations
       where customer_id = v_customer_id and status = 'PENDING') >= 3 then
    raise exception 'DEMASIADAS_SOLICITUDES';
  end if;

  v_code := public.gen_reservation_code();

  insert into public.reservations (
    code, customer_id, event_type_id, package_id, time_slot_id,
    event_date, starts_at, ends_at, guests, status, package_price, customer_notes, source, pricing_detail
  ) values (
    v_code, v_customer_id,
    nullif(payload->>'event_type_id','')::uuid,
    nullif(payload->>'package_id','')::uuid,
    v_slot.id, v_date, lower(v_period), upper(v_period), v_guests, 'PENDING',
    v_pkg_price, nullif(btrim(coalesce(payload->>'notes','')),''), 'web', v_quote
  ) returning id into v_res_id;

  for item in select * from jsonb_array_elements(coalesce(payload->'addons','[]'::jsonb))
  loop
    select * into v_addon from public.addons where id = (item->>'addon_id')::uuid and active;
    if found then
      v_qty := greatest(coalesce(nullif(item->>'quantity','')::int, 1), 1);
      if v_addon.max_quantity is not null then v_qty := least(v_qty, v_addon.max_quantity); end if;
      if v_addon.per_guest then v_qty := v_guests; end if;
      v_line := v_addon.price * v_qty;
      insert into public.reservation_addons (reservation_id, addon_id, name, unit_price, quantity)
      values (v_res_id, v_addon.id, v_addon.name, v_addon.price, v_qty);
      v_addons_total := v_addons_total + v_line;
    end if;
  end loop;

  update public.reservations
     set addons_total = v_addons_total, total_amount = v_pkg_price + v_addons_total
   where id = v_res_id;

  insert into public.notifications (type, title, body, reservation_id)
  values ('new_request', 'Nueva solicitud de reserva ' || v_code,
    v_first || ' ' || coalesce(v_last,'') || ' · ' || to_char(v_date,'DD/MM/YYYY')
      || ' · ' || v_slot.name || ' · ' || v_guests || ' personas', v_res_id);

  return jsonb_build_object(
    'code', v_code, 'status', 'PENDING', 'event_date', v_date,
    'slot_name', v_slot.name,
    'start_time', to_char(v_slot.start_time,'HH24:MI'),
    'end_time', to_char(v_slot.end_time,'HH24:MI'),
    'guests', v_guests, 'package_name', v_pkg.name,
    'package_price', v_pkg_price,
    'addons_total', v_addons_total,
    'pricing', v_quote,
    'total_amount', v_pkg_price + v_addons_total);
end; $$;

grant execute on function public.create_reservation_request(jsonb) to anon, authenticated;
