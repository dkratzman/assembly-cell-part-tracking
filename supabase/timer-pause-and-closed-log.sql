alter table public.missing_parts add column if not exists timer_paused_at timestamptz;
alter table public.missing_parts add column if not exists paused_seconds integer not null default 0;

create or replace function public.set_missing_parts_updated_at()
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

update public.missing_parts
set timer_paused_at = coalesce(
  timer_paused_at,
  (
    select public.part_events.created_at
    from public.part_events
    where public.part_events.part_id = public.missing_parts.id
      and public.part_events.to_status in ('Delivered to Stall', 'Installed/Closed')
    order by public.part_events.created_at desc
    limit 1
  ),
  closed_at,
  updated_at
)
where status in ('Delivered to Stall', 'Installed/Closed')
  and timer_paused_at is null;

notify pgrst, 'reload schema';
