do $$
begin
  create type improvement_area as enum ('Missing Part Flow', 'Monitor Screen', 'Dashboard', 'History', 'Other');
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  create type improvement_status as enum ('New', 'Reviewing', 'Accepted', 'Added', 'Declined');
exception
  when duplicate_object then null;
end;
$$;

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

alter table improvement_requests enable row level security;

grant usage on schema public to anon;
grant usage on type improvement_area to anon;
grant usage on type improvement_status to anon;
grant insert on table improvement_requests to anon;

drop policy if exists "public insert improvement requests" on improvement_requests;
create policy "public insert improvement requests"
on improvement_requests for insert
to anon
with check (true);
