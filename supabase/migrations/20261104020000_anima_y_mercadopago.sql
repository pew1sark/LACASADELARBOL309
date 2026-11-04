-- ============================================================
-- Plataforma ANIMA COMPANY + pagos con Mercado Pago
--
-- Roles (admin_users.role):
--   admin  → dueño del negocio: panel /admin
--   anima  → ANIMA COMPANY: consola /anima con acceso total al negocio
-- is_admin() sigue siendo true para ambos (las políticas RLS no cambian).
--
-- Pagos en línea: el cliente paga el abono o el total desde la web.
-- El token de Mercado Pago vive SOLO en los secretos de las Edge Functions
-- (MP_ACCESS_TOKEN). La base guarda cada intento de pago y, cuando Mercado
-- Pago lo aprueba, el webhook registra el pago y confirma la reserva.
-- ============================================================

-- ---------- Roles ----------
alter table public.admin_users drop constraint if exists admin_users_role_check;
alter table public.admin_users add constraint admin_users_role_check check (role in ('admin', 'anima'));

create or replace function public.is_anima()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid() and role = 'anima');
$$;
revoke all on function public.is_anima() from anon, public;
grant execute on function public.is_anima() to authenticated;

-- Alta, cambio de rol o baja de un acceso. Solo ANIMA puede usarla.
-- El usuario debe existir antes en Authentication (Supabase → Add user).
create or replace function public.anima_set_access(p_email text, p_role text, p_name text default null)
returns text language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_anima() then raise exception 'SOLO_ANIMA'; end if;
  select id into v_user from auth.users where lower(email) = lower(btrim(p_email));
  if v_user is null then raise exception 'USUARIO_NO_EXISTE'; end if;
  if p_role is null or p_role = '' then
    if v_user = auth.uid() then raise exception 'NO_PUEDES_QUITARTE'; end if;
    delete from public.admin_users where user_id = v_user;
    return 'removed';
  end if;
  if p_role not in ('admin', 'anima') then raise exception 'ROL_INVALIDO'; end if;
  insert into public.admin_users (user_id, email, full_name, role)
  values (v_user, lower(btrim(p_email)), nullif(btrim(coalesce(p_name, '')), ''), p_role)
  on conflict (user_id) do update set role = excluded.role,
    full_name = coalesce(excluded.full_name, public.admin_users.full_name);
  return 'ok';
end; $$;
revoke all on function public.anima_set_access(text, text, text) from anon, public;
grant execute on function public.anima_set_access(text, text, text) to authenticated;

-- ---------- Configuración de pagos (pública: la web decide qué botones mostrar) ----------
alter table public.settings
  add column if not exists mercadopago_enabled boolean not null default false,
  add column if not exists online_payment_mode text not null default 'both'
    check (online_payment_mode in ('deposit', 'full', 'both'));

-- ---------- Pagos: origen y referencia del proveedor ----------
alter table public.payments
  add column if not exists provider text not null default 'manual',
  add column if not exists provider_payment_id text;
create unique index if not exists payments_provider_payment_uidx
  on public.payments (provider, provider_payment_id) where provider_payment_id is not null;

-- ---------- Intentos de pago en línea ----------
create table if not exists public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  provider text not null default 'mercadopago',
  kind text not null check (kind in ('deposit', 'full', 'balance')),
  amount numeric(12,0) not null check (amount > 0),
  status text not null default 'created'
    check (status in ('created', 'pending', 'approved', 'rejected', 'cancelled', 'refund_needed')),
  preference_id text,
  provider_payment_id text,
  status_detail text,
  payer_email text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payment_intents_reservation_idx on public.payment_intents (reservation_id);
create index if not exists payment_intents_created_idx on public.payment_intents (created_at desc);

drop trigger if exists payment_intents_touch on public.payment_intents;
create trigger payment_intents_touch before update on public.payment_intents
  for each row execute function public.touch_updated_at();

alter table public.payment_intents enable row level security;
drop policy if exists a_payment_intents on public.payment_intents;
create policy a_payment_intents on public.payment_intents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- El portal de clientes muestra si hay un pago en línea en curso.
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
    'online_payment', jsonb_build_object(
      'enabled', cfg.mercadopago_enabled,
      'mode', cfg.online_payment_mode,
      'last_status', (select pi.status from public.payment_intents pi
                       where pi.reservation_id = r.id order by pi.created_at desc limit 1)),
    'addons', coalesce((select jsonb_agg(jsonb_build_object('name', ra.name, 'quantity', ra.quantity,
                        'subtotal', ra.subtotal) order by ra.name)
                        from public.reservation_addons ra where ra.reservation_id = r.id), '[]'::jsonb));

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
grant execute on function public.get_reservation_public(text) to anon, authenticated;
