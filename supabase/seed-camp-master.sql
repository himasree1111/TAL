-- Seed camp master entries requested by the user.
-- Run this in Supabase SQL editor if you want to preload these camps.

insert into public.camp_master (camp_name, camp_date, created_by)
values
  ('Moosapet', '2025-10-12', null),
  ('Moosapet', '2026-03-11', null),
  ('NBT nagar', '2025-10-12', null),
  ('KPHP', '2026-04-09', null)
on conflict (camp_name, camp_date) do nothing;
