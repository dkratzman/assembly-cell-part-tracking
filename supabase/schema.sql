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

create table if not exists assembly_sub_builds (
  id uuid primary key default gen_random_uuid(),
  build_date date not null,
  eso text not null check (eso ~ '^[A-Z0-9]{5}$'),
  front_fuel_filters text not null default 'Open' check (front_fuel_filters in ('Open', 'Complete', 'N/A')),
  amots text not null default 'Open' check (amots in ('Open', 'Complete', 'N/A')),
  snake_coffin text not null default 'Open' check (snake_coffin in ('Open', 'Complete', 'N/A')),
  water_manifolds text not null default 'Open' check (water_manifolds in ('Open', 'Complete', 'N/A')),
  water_regulators text not null default 'Open' check (water_regulators in ('Open', 'Complete', 'N/A')),
  oil_coolers text not null default 'Open' check (oil_coolers in ('Open', 'Complete', 'N/A')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (build_date, eso)
);

create table if not exists missing_parts (
  id uuid primary key default gen_random_uuid(),
  eso text not null check (eso ~ '^[A-Z0-9]{5}$'),
  stall text not null check (stall in ('Stall 1', 'Stall 2', 'Stall 3', 'Stall 4', 'Stall 5', 'Stall 6', 'Stall 7', 'Head Stall')),
  kit_context kit_context not null default 'Kit',
  kit_no text,
  part_no text not null,
  quantity integer not null default 1 check (quantity > 0),
  criticality criticality_level not null default 'Normal',
  replacement_for_defective_part boolean not null default false,
  status part_status not null default 'Missing',
  eta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  timer_paused_at timestamptz,
  paused_seconds integer not null default 0
);

alter table missing_parts add column if not exists timer_paused_at timestamptz;
alter table missing_parts add column if not exists paused_seconds integer not null default 0;
alter table missing_parts add column if not exists replacement_for_defective_part boolean not null default false;

create table if not exists part_events (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references missing_parts(id) on delete cascade,
  event_type text not null,
  from_status part_status,
  to_status part_status,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
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

  if new.status in ('Delivered to Stall', 'Installed/Closed') then
    if old.status not in ('Delivered to Stall', 'Installed/Closed') then
      new.timer_paused_at = coalesce(new.timer_paused_at, now());
    else
      new.timer_paused_at = coalesce(new.timer_paused_at, old.timer_paused_at, now());
    end if;
  elsif old.status in ('Delivered to Stall', 'Installed/Closed') then
    new.paused_seconds =
      coalesce(old.paused_seconds, 0) +
      greatest(0, extract(epoch from (now() - coalesce(old.timer_paused_at, old.updated_at)))::integer);
    new.timer_paused_at = null;
  else
    new.timer_paused_at = null;
  end if;

  return new;
end;
$$ language plpgsql
set search_path = public, pg_temp;

drop trigger if exists missing_parts_updated_at on missing_parts;
create trigger missing_parts_updated_at
before update on missing_parts
for each row execute function set_missing_parts_updated_at();

create or replace function set_assembly_sub_builds_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql
set search_path = public, pg_temp;

drop trigger if exists assembly_sub_builds_updated_at on assembly_sub_builds;
create trigger assembly_sub_builds_updated_at
before update on assembly_sub_builds
for each row execute function set_assembly_sub_builds_updated_at();

create or replace function private.log_missing_part_status_event()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    insert into public.part_events (part_id, event_type, to_status, details)
    values (
      new.id,
      'created',
      new.status,
      jsonb_build_object(
        'eso',
        new.eso,
        'part_no',
        new.part_no,
        'replacement_for_defective_part',
        new.replacement_for_defective_part
      )
    );
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
create index if not exists assembly_sub_builds_build_date_idx on assembly_sub_builds(build_date);

update missing_parts
set timer_paused_at = coalesce(
  timer_paused_at,
  (
    select part_events.created_at
    from part_events
    where part_events.part_id = missing_parts.id
      and part_events.to_status in ('Delivered to Stall', 'Installed/Closed')
    order by part_events.created_at desc
    limit 1
  ),
  closed_at,
  updated_at
)
where status in ('Delivered to Stall', 'Installed/Closed')
  and timer_paused_at is null;

notify pgrst, 'reload schema';

alter table missing_parts enable row level security;
alter table part_events enable row level security;
alter table assembly_sub_builds enable row level security;

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

drop policy if exists "public read assembly sub builds" on assembly_sub_builds;
create policy "public read assembly sub builds"
on assembly_sub_builds for select
to anon
using (true);

drop policy if exists "public insert assembly sub builds" on assembly_sub_builds;
create policy "public insert assembly sub builds"
on assembly_sub_builds for insert
to anon
with check (true);

drop policy if exists "public update assembly sub builds" on assembly_sub_builds;
create policy "public update assembly sub builds"
on assembly_sub_builds for update
to anon
using (true)
with check (true);

alter publication supabase_realtime add table missing_parts;
alter publication supabase_realtime add table part_events;
alter publication supabase_realtime add table assembly_sub_builds;
