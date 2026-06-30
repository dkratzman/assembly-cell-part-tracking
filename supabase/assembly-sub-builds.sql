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

create index if not exists assembly_sub_builds_build_date_idx on assembly_sub_builds(build_date);

alter table assembly_sub_builds enable row level security;

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

do $$
begin
  alter publication supabase_realtime add table assembly_sub_builds;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

notify pgrst, 'reload schema';
