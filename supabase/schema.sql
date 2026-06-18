create extension if not exists pgcrypto;

create schema if not exists private;

create type part_status as enum (
  'Missing',
  'Ordered',
  'ETA Set',
  'En Route',
  'Received',
  'Delivered to Stall',
  'Installed/Closed',
  'Entered by Mistake'
);

create type criticality_level as enum ('Normal', 'Critical');

create type kit_context as enum ('Kit', 'Subassembly', 'Part Only', 'Unknown');

create type improvement_area as enum ('Missing Part Flow', 'Monitor Screen', 'Dashboard', 'History', 'Other');

create type improvement_status as enum ('New', 'Reviewing', 'Accepted', 'Added', 'Declined');

create table if not exists missing_parts (
  id uuid primary key default gen_random_uuid(),
  eso text not null check (eso ~ '^[A-Z0-9]{5}$'),
  stall text not null check (stall in ('Stall 1', 'Stall 2', 'Stall 3', 'Stall 4', 'Stall 5', 'Stall 6', 'Stall 7', 'Head Stall')),
  kit_context kit_context not null default 'Kit',
  kit_no text,
  part_no text not null,
  quantity integer not null default 1 check (quantity > 0),
  criticality criticality_level not null default 'Normal',
  status part_status not null default 'Missing',
  eta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists part_events (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references missing_parts(id) on delete cascade,
  event_type text not null,
  from_status part_status,
  to_status part_status,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists improvement_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  area improvement_area not null default 'Other',
  description text not null check (char_length(trim(description)) >= 10),
  submitted_by text,
  contact text,
  status improvement_status not null default 'New',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function set_missing_parts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  if new.status in ('Installed/Closed', 'Entered by Mistake') and old.status is distinct from new.status then
    new.closed_at = now();
  elsif new.status not in ('Installed/Closed', 'Entered by Mistake') then
    new.closed_at = null;
  end if;
  return new;
end;
$$ language plpgsql
set search_path = public, pg_temp;

drop trigger if exists missing_parts_updated_at on missing_parts;
create trigger missing_parts_updated_at
before update on missing_parts
for each row execute function set_missing_parts_updated_at();

create or replace function private.log_missing_part_status_event()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.part_events (part_id, event_type, to_status, details)
    values (new.id, 'created', new.status, jsonb_build_object('eso', new.eso, 'part_no', new.part_no));
  elsif old.status is distinct from new.status or old.eta is distinct from new.eta then
    insert into public.part_events (part_id, event_type, from_status, to_status, details)
    values (
      new.id,
      'updated',
      old.status,
      new.status,
      jsonb_build_object('eta', new.eta, 'previous_eta', old.eta)
    );
  end if;
  return new;
end;
$$ language plpgsql
security definer
set search_path = public, pg_temp;

revoke all on schema private from public;
revoke all on function private.log_missing_part_status_event() from public, anon, authenticated;

drop trigger if exists missing_parts_event_log on missing_parts;
create trigger missing_parts_event_log
after insert or update on missing_parts
for each row execute function private.log_missing_part_status_event();

drop function if exists public.log_missing_part_status_event();

create index if not exists part_events_part_id_idx on part_events(part_id);

alter table missing_parts enable row level security;
alter table part_events enable row level security;
alter table improvement_requests enable row level security;

grant usage on schema public to anon;
grant usage on type improvement_area to anon;
grant usage on type improvement_status to anon;
grant insert on table improvement_requests to anon;

drop policy if exists "public read missing parts" on missing_parts;
create policy "public read missing parts"
on missing_parts for select
to anon
using (true);

drop policy if exists "public insert missing parts" on missing_parts;
create policy "public insert missing parts"
on missing_parts for insert
to anon
with check (true);

drop policy if exists "public update missing parts" on missing_parts;
create policy "public update missing parts"
on missing_parts for update
to anon
using (true)
with check (true);

drop policy if exists "public read part events" on part_events;
create policy "public read part events"
on part_events for select
to anon
using (true);

drop policy if exists "public insert improvement requests" on improvement_requests;
create policy "public insert improvement requests"
on improvement_requests for insert
to anon
with check (true);

alter publication supabase_realtime add table missing_parts;
alter publication supabase_realtime add table part_events;
