-- SmarTubig Supabase schema. Run this file in the Supabase SQL editor.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'operator' check (role in ('administrator','operator','viewer')),
  created_at timestamptz not null default now()
);
create table if not exists public.tanks (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null,
  capacity_liters integer not null check (capacity_liters > 0), location text, is_active boolean not null default true
);
create table if not exists public.sensor_readings (
  id bigint generated always as identity primary key, tank_id uuid not null references public.tanks(id) on delete cascade,
  water_level_percent numeric(5,2) not null check (water_level_percent between 0 and 100), volume_liters numeric(10,2),
  ph numeric(4,2), tds_ppm numeric(8,2), turbidity_ntu numeric(8,2), device_id text not null,
  recorded_at timestamptz not null default now()
);
create index if not exists sensor_readings_tank_time_idx on public.sensor_readings(tank_id, recorded_at desc);
create table if not exists public.valves (
  id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, service_area text not null,
  current_state text not null default 'closed' check (current_state in ('open','closed','unknown')), updated_at timestamptz not null default now()
);
create table if not exists public.distribution_schedules (
  id uuid primary key default gen_random_uuid(), valve_id uuid not null references public.valves(id) on delete cascade,
  purok text not null, day_of_week smallint not null check (day_of_week between 0 and 6), start_time time not null,
  end_time time not null, is_active boolean not null default true
);
create table if not exists public.valve_commands (
  id bigint generated always as identity primary key, valve_slug text not null references public.valves(slug),
  requested_state text not null check (requested_state in ('open','closed')), status text not null default 'pending' check (status in ('pending','sent','confirmed','failed')),
  source text not null default 'dashboard', requested_by uuid references auth.users(id), requested_at timestamptz not null default now(), confirmed_at timestamptz
);
create table if not exists public.alerts (
  id bigint generated always as identity primary key, tank_id uuid references public.tanks(id) on delete cascade,
  severity text not null check (severity in ('info','warning','critical')), alert_type text not null, message text not null,
  acknowledged_at timestamptz, acknowledged_by uuid references auth.users(id), created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tanks enable row level security;
alter table public.sensor_readings enable row level security;
alter table public.valves enable row level security;
alter table public.distribution_schedules enable row level security;
alter table public.valve_commands enable row level security;
alter table public.alerts enable row level security;

create policy "authenticated users read tanks" on public.tanks for select to authenticated using (true);
create policy "authenticated users read readings" on public.sensor_readings for select to authenticated using (true);
create policy "authenticated users read valves" on public.valves for select to authenticated using (true);
create policy "authenticated users read schedules" on public.distribution_schedules for select to authenticated using (true);
create policy "authenticated users read alerts" on public.alerts for select to authenticated using (true);
create policy "operators issue commands" on public.valve_commands for insert to authenticated with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('administrator','operator'))
);
create policy "users read own commands" on public.valve_commands for select to authenticated using (requested_by = auth.uid());

insert into public.tanks (slug,name,capacity_liters,location) values ('main-reservoir','Main Reservoir',4000,'Barangay Hinanggayon') on conflict (slug) do nothing;
insert into public.valves (slug,name,service_area,current_state) values
  ('distribution-line-a','Distribution Line A','Purok 3','open'),
  ('distribution-line-b','Distribution Line B','Purok 1 & 2','closed'),
  ('distribution-line-c','Distribution Line C','Purok 4–6','closed')
on conflict (slug) do nothing;
