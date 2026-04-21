-- Run this if camp_master table already exists but needs RLS policies
-- This adds RLS policies to allow authenticated users to add and select camps

alter table public.camp_master enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Allow anon users to select camps" on public.camp_master;
drop policy if exists "Allow authenticated users to select camps" on public.camp_master;
drop policy if exists "Allow authenticated users to insert camps" on public.camp_master;

-- Create new RLS policies
create policy "Allow anon users to select camps" on public.camp_master
  for select using (true);

create policy "Allow authenticated users to select camps" on public.camp_master
  for select using (true);

create policy "Allow authenticated users to insert camps" on public.camp_master
  for insert with check (true);
