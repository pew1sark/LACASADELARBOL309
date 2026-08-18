-- ============================================================
-- API pública (SECURITY DEFINER) + Row Level Security
-- El cliente anónimo nunca lee ni escribe directamente las tablas
-- de reservas: solo puede llamar a estas tres funciones.
-- ============================================================

create or replace function public.get_availability(p_from date, p_to date)
returns table (day date, slot_id uuid, slot_name text, start_time time, end_time time, status text)
language sql stable security definer set search_path = public as $$
  with cfg as (select * from public.settings where id = 1),
  days as (
    select generate_series(
      greatest(p_from, current_date),
      least(p_to, current_date + (select max_advance_days from cfg)),
      interval '1 day')::date as d
  ),
  slots as (select * from public.time_slots where active)
  select d.d, s.id, s.name, s.start_time, s.end_time,
    case
      when d.d < current_date + (select lead_time_days from cfg) then 'too_soon'
      when extract(dow from d.d)::smallint <> all (s.weekdays) then 'closed'
      when exists (select 1 from public.blocked_dates b
                    where b.date = d.d and (b.time_slot_id is null or b.time_slot_id = s.id)) then 'blocked'
      when exists (select 1 from public.reservations r
                    where r.status in ('AWAITING_PAYMENT','CONFIRMED')
                      and r.period && public.slot_period(d.d, s.start_time, s.end_time)) then 'reserved'
      when exists (select 1 from public.reservations r
                    where r.status = 'PENDING' and r.event_date = d.d and r.time_slot_id = s.id) then 'pending'
      else 'available'
    end as status
  from days d cross join slots s
  order by d.d, s.sort_order;
$$;

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
    v_pkg_price := v_pkg.price;
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
    event_date, starts_at, ends_at, guests, status, package_price, customer_notes, source
  ) values (
    v_code, v_customer_id,
    nullif(payload->>'event_type_id','')::uuid,
    nullif(payload->>'package_id','')::uuid,
    v_slot.id, v_date, lower(v_period), upper(v_period), v_guests, 'PENDING',
    v_pkg_price, nullif(btrim(coalesce(payload->>'notes','')),''), 'web'
  ) returning id into v_res_id;

  for item in select * from jsonb_array_elements(coalesce(payload->'addons','[]'::jsonb))
  loop
    select * into v_addon from public.addons where id = (item->>'addon_id')::uuid and active;
    if found then
      v_qty := greatest(coalesce(nullif(item->>'quantity','')::int, 1), 1);
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
    'total_amount', v_pkg_price + v_addons_total);
end; $$;

create or replace function public.get_reservation_public(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r record; pay public.settings_payment%rowtype; cfg public.settings%rowtype; result jsonb;
begin
  select res.*, c.first_name, c.last_name, p.name as package_name,
         ts.name as slot_name, ts.start_time, ts.end_time, et.name as event_type_name
    into r
    from public.reservations res
    join public.customers c on c.id = res.customer_id
    left join public.packages p on p.id = res.package_id
    left join public.time_slots ts on ts.id = res.time_slot_id
    left join public.event_types et on et.id = res.event_type_id
   where upper(res.code) = upper(btrim(p_code));

  if not found then return null; end if;
  select * into cfg from public.settings where id = 1;

  result := jsonb_build_object(
    'code', r.code, 'status', r.status, 'first_name', r.first_name,
    'event_type', r.event_type_name, 'package_name', r.package_name,
    'event_date', r.event_date, 'slot_name', r.slot_name,
    'start_time', to_char(r.start_time,'HH24:MI'),
    'end_time', to_char(r.end_time,'HH24:MI'),
    'guests', r.guests, 'total_amount', r.total_amount, 'paid_amount', r.paid_amount,
    'deposit_percent', cfg.deposit_percent, 'created_at', r.created_at,
    'addons', coalesce((select jsonb_agg(jsonb_build_object('name', ra.name, 'quantity', ra.quantity,
                        'subtotal', ra.subtotal) order by ra.name)
                        from public.reservation_addons ra where ra.reservation_id = r.id), '[]'::jsonb));

  -- Los datos bancarios solo se entregan cuando corresponde pagar.
  if r.status in ('AWAITING_PAYMENT','CONFIRMED') then
    select * into pay from public.settings_payment where id = 1;
    result := result || jsonb_build_object('payment', jsonb_build_object(
      'instructions', pay.payment_instructions, 'bank_name', pay.bank_name,
      'account_type', pay.bank_account_type, 'account_number', pay.bank_account_number,
      'account_holder', pay.bank_account_holder, 'account_rut', pay.bank_account_rut,
      'email', pay.bank_email));
  end if;

  return result;
end; $$;

grant execute on function public.get_availability(date, date) to anon, authenticated;
grant execute on function public.create_reservation_request(jsonb) to anon, authenticated;
grant execute on function public.get_reservation_public(text) to anon, authenticated;

-- Las funciones internas y de trigger no se exponen en la API REST.
revoke all on function public.touch_updated_at() from anon, authenticated, public;
revoke all on function public.on_reservation_status_change() from anon, authenticated, public;
revoke all on function public.recalc_reservation_paid() from anon, authenticated, public;
revoke all on function public.check_reservation_not_blocked() from anon, authenticated, public;
revoke all on function public.check_block_free() from anon, authenticated, public;
revoke all on function public.is_admin() from anon, public;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.gen_reservation_code() from anon, public;
grant execute on function public.gen_reservation_code() to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.settings              enable row level security;
alter table public.settings_payment      enable row level security;
alter table public.event_types           enable row level security;
alter table public.time_slots            enable row level security;
alter table public.packages              enable row level security;
alter table public.package_services      enable row level security;
alter table public.addons                enable row level security;
alter table public.gallery_images        enable row level security;
alter table public.faqs                  enable row level security;
alter table public.customers             enable row level security;
alter table public.admin_users           enable row level security;
alter table public.blocked_dates         enable row level security;
alter table public.reservations          enable row level security;
alter table public.reservation_addons    enable row level security;
alter table public.payments              enable row level security;
alter table public.reservation_status_history enable row level security;
alter table public.notifications         enable row level security;

-- Catálogo público: lectura para cualquiera
create policy p_settings_read      on public.settings         for select to anon, authenticated using (true);
create policy p_event_types_read   on public.event_types      for select to anon, authenticated using (active);
create policy p_time_slots_read    on public.time_slots       for select to anon, authenticated using (active);
create policy p_packages_read      on public.packages         for select to anon, authenticated using (active);
create policy p_pkg_services_read  on public.package_services for select to anon, authenticated using (true);
create policy p_addons_read        on public.addons           for select to anon, authenticated using (active);
create policy p_gallery_read       on public.gallery_images   for select to anon, authenticated using (active);
create policy p_faqs_read          on public.faqs             for select to anon, authenticated using (active);

-- Administración total solo para usuarios registrados en admin_users
create policy a_settings      on public.settings              for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_settings_pay  on public.settings_payment      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_event_types   on public.event_types           for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_time_slots    on public.time_slots            for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_packages      on public.packages              for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_pkg_services  on public.package_services      for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_addons        on public.addons                for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_gallery       on public.gallery_images        for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_faqs          on public.faqs                  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_customers     on public.customers             for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_blocked       on public.blocked_dates         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_reservations  on public.reservations          for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_res_addons    on public.reservation_addons    for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_payments      on public.payments              for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_history       on public.reservation_status_history for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_notifications on public.notifications         for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy a_admin_users   on public.admin_users           for select to authenticated using (user_id = auth.uid() or public.is_admin());
