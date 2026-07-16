alter table public.missing_parts
add column if not exists replacement_for_defective_part boolean not null default false;

notify pgrst, 'reload schema';
