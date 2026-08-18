-- ============================================================
-- La Casa del Árbol 309 — Esquema inicial
-- ============================================================
create extension if not exists pgcrypto;

create type reservation_status as enum (
  'PENDING','AWAITING_PAYMENT','CONFIRMED','COMPLETED','CANCELLED','REJECTED'
);

-- ---------- Configuración pública ----------
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  business_name text not null default 'La Casa del Árbol 309',
  tagline text not null default 'El lugar perfecto para celebrar momentos inolvidables',
  about text, address text, city text, region text, country text default 'Chile',
  phone text, whatsapp text, email text,
  instagram_url text, facebook_url text, tiktok_url text, google_maps_url text,
  opening_hours text,
  min_guests int not null default 10,
  max_capacity int not null default 60,
  standard_duration_hours numeric(4,1) not null default 3.5,
  lead_time_days int not null default 3,
  max_advance_days int not null default 365,
  deposit_percent int not null default 30,
  currency text not null default 'CLP',
  cancellation_policy text,
  hero_image_url text,
  updated_at timestamptz not null default now()
);

-- ---------- Configuración privada (datos bancarios) ----------
create table public.settings_payment (
  id smallint primary key default 1 check (id = 1),
  payment_instructions text,
  bank_name text, bank_account_type text, bank_account_number text,
  bank_account_holder text, bank_account_rut text, bank_email text,
  accepts_transfer boolean not null default true,
  accepts_cash boolean not null default true,
  accepts_card boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------- Catálogo ----------
create table public.event_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_description text, long_description text,
  image_url text, icon text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.time_slots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_time time not null,
  end_time time not null,
  weekdays smallint[] not null default '{0,1,2,3,4,5,6}',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  subtitle text, description text,
  event_type_id uuid references public.event_types(id) on delete set null,
  price numeric(12,0) not null default 0,
  price_is_from boolean not null default true,
  duration_hours numeric(4,1) not null default 3.5,
  max_guests int not null default 40,
  image_url text, badge text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.package_services (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);
create index on public.package_services (package_id);

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(12,0) not null default 0,
  unit text not null default 'servicio',
  per_guest boolean not null default false,
  image_url text, icon text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null, alt text, caption text,
  sort_order int not null default 0,
  active boolean not null default true
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null, answer text not null,
  sort_order int not null default 0,
  active boolean not null default true
);

-- ---------- Clientes ----------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null, last_name text,
  phone text not null, whatsapp text, email text, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customers_phone_key on public.customers (phone);
create index customers_email_idx on public.customers (lower(email));

-- ---------- Administradores ----------
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text, email text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

-- ---------- Bloqueos de agenda ----------
create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time_slot_id uuid references public.time_slots(id) on delete cascade,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index blocked_dates_unique on public.blocked_dates (date, time_slot_id) nulls not distinct;

-- ---------- Reservas ----------
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  event_type_id uuid references public.event_types(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  time_slot_id uuid references public.time_slots(id) on delete set null,
  event_date date not null,
  starts_at timestamp not null,
  ends_at timestamp not null,
  period tsrange generated always as (tsrange(starts_at, ends_at, '[)')) stored,
  guests int not null check (guests > 0),
  status reservation_status not null default 'PENDING',
  package_price numeric(12,0) not null default 0,
  addons_total numeric(12,0) not null default 0,
  total_amount numeric(12,0) not null default 0,
  paid_amount numeric(12,0) not null default 0,
  customer_notes text, admin_notes text,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz, cancelled_at timestamptz,
  constraint reservations_time_check check (ends_at > starts_at)
);
create index reservations_date_idx on public.reservations (event_date);
create index reservations_status_idx on public.reservations (status);
create index reservations_customer_idx on public.reservations (customer_id);

-- *** Garantía anti doble-reserva a nivel de motor de base de datos ***
-- Dos reservas en estado bloqueante NO pueden solaparse en el tiempo.
-- Ninguna condición de carrera ni error del panel puede saltarse esto.
alter table public.reservations
  add constraint reservations_no_overlap
  exclude using gist (period with &&)
  where (status in ('AWAITING_PAYMENT','CONFIRMED'));

create table public.reservation_addons (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  addon_id uuid references public.addons(id) on delete set null,
  name text not null,
  unit_price numeric(12,0) not null default 0,
  quantity int not null default 1 check (quantity > 0),
  subtotal numeric(12,0) generated always as (unit_price * quantity) stored
);
create index on public.reservation_addons (reservation_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  amount numeric(12,0) not null check (amount > 0),
  method text not null default 'transferencia',
  reference text, notes text,
  paid_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.payments (reservation_id);

create table public.reservation_status_history (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  from_status reservation_status,
  to_status reservation_status not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.reservation_status_history (reservation_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null, title text not null, body text,
  reservation_id uuid references public.reservations(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_unread_idx on public.notifications (created_at desc) where read_at is null;

-- ============================================================
-- Funciones auxiliares
-- ============================================================
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end; $$;

-- Rango de un bloque horario; soporta bloques que cruzan medianoche.
create or replace function public.slot_period(p_date date, p_start time, p_end time)
returns tsrange language sql immutable set search_path = public as $$
  select tsrange(
    (p_date + p_start),
    (p_date + p_end) + (case when p_end <= p_start then interval '1 day' else interval '0 day' end),
    '[)'
  );
$$;

create or replace function public.gen_reservation_code()
returns text language plpgsql set search_path = public as $$
declare
  alphabet text := 'ACDEFGHJKLMNPQRTUVWXY34679';
  candidate text; i int;
begin
  loop
    candidate := 'CA-';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.reservations where code = candidate);
  end loop;
  return candidate;
end; $$;

-- ============================================================
-- Triggers
-- ============================================================
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();
create trigger settings_payment_touch before update on public.settings_payment
  for each row execute function public.touch_updated_at();
create trigger packages_touch before update on public.packages
  for each row execute function public.touch_updated_at();
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();
create trigger reservations_touch before update on public.reservations
  for each row execute function public.touch_updated_at();

create or replace function public.on_reservation_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_name text;
begin
  if new.status is distinct from old.status then
    insert into public.reservation_status_history (reservation_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());

    select coalesce(c.first_name,'') || ' ' || coalesce(c.last_name,'') into v_name
    from public.customers c where c.id = new.customer_id;

    if new.status = 'CONFIRMED' and new.confirmed_at is null then new.confirmed_at := now(); end if;
    if new.status in ('CANCELLED','REJECTED') and new.cancelled_at is null then new.cancelled_at := now(); end if;

    insert into public.notifications (type, title, body, reservation_id)
    values ('status_change',
      case new.status
        when 'AWAITING_PAYMENT' then 'Reserva ' || new.code || ' esperando pago'
        when 'CONFIRMED' then 'Reserva ' || new.code || ' confirmada'
        when 'CANCELLED' then 'Reserva ' || new.code || ' cancelada'
        when 'REJECTED' then 'Solicitud ' || new.code || ' rechazada'
        when 'COMPLETED' then 'Evento ' || new.code || ' completado'
        else 'Reserva ' || new.code || ' actualizada'
      end,
      trim(v_name) || ' · ' || to_char(new.event_date, 'DD/MM/YYYY'),
      new.id);
  end if;
  return new;
end; $$;

create trigger reservations_status_change before update on public.reservations
  for each row execute function public.on_reservation_status_change();

create or replace function public.recalc_reservation_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_res uuid := coalesce(new.reservation_id, old.reservation_id);
begin
  update public.reservations r
     set paid_amount = coalesce((select sum(p.amount) from public.payments p where p.reservation_id = v_res), 0)
   where r.id = v_res;
  return null;
end; $$;

create trigger payments_recalc after insert or update or delete on public.payments
  for each row execute function public.recalc_reservation_paid();

create or replace function public.check_reservation_not_blocked()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('AWAITING_PAYMENT','CONFIRMED') then
    if exists (
      select 1 from public.blocked_dates b
      where b.date = new.event_date
        and (b.time_slot_id is null or b.time_slot_id = new.time_slot_id)
    ) then
      raise exception 'FECHA_BLOQUEADA' using hint = 'La fecha u horario está bloqueado en la agenda.';
    end if;
  end if;
  return new;
end; $$;

create trigger reservations_check_blocked before insert or update on public.reservations
  for each row execute function public.check_reservation_not_blocked();

create or replace function public.check_block_free()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.reservations r
    where r.event_date = new.date
      and r.status in ('AWAITING_PAYMENT','CONFIRMED')
      and (new.time_slot_id is null or r.time_slot_id = new.time_slot_id)
  ) then
    raise exception 'AGENDA_OCUPADA' using hint = 'Ya existe una reserva activa en esa fecha/horario.';
  end if;
  return new;
end; $$;

create trigger blocked_dates_check before insert on public.blocked_dates
  for each row execute function public.check_block_free();
