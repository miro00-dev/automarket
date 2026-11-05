-- AutoMarket ownership and Row Level Security setup
-- Run this script manually in the Supabase SQL Editor.
-- Existing cars will have owner_id = NULL until manually assigned.

alter table public.cars
add column if not exists owner_id uuid
references auth.users(id) on delete cascade;

create index if not exists cars_owner_id_idx
on public.cars(owner_id);

alter table public.cars enable row level security;

-- Drop only the policies managed by this script so it can be run again safely.
drop policy if exists "Public can view active cars" on public.cars;
drop policy if exists "Users can view their own cars" on public.cars;
drop policy if exists "Users can insert their own cars" on public.cars;
drop policy if exists "Users can update their own cars" on public.cars;
drop policy if exists "Users can delete their own cars" on public.cars;

create policy "Public can view active cars"
on public.cars
for select
to anon, authenticated
using (status = 'active');

create policy "Users can view their own cars"
on public.cars
for select
to authenticated
using (owner_id = auth.uid());

create policy "Users can insert their own cars"
on public.cars
for insert
to authenticated
with check (owner_id = auth.uid());

create policy "Users can update their own cars"
on public.cars
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "Users can delete their own cars"
on public.cars
for delete
to authenticated
using (owner_id = auth.uid());

-- Storage policies for the public car-images bucket.
-- New uploads use the path: <authenticated-user-id>/<listing-folder>/<file>.

drop policy if exists "Public can view car images" on storage.objects;
drop policy if exists "Users can upload their own car images" on storage.objects;
drop policy if exists "Users can update their own car images" on storage.objects;
drop policy if exists "Users can delete their own car images" on storage.objects;

create policy "Public can view car images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'car-images');

create policy "Users can upload their own car images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'car-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own car images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'car-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'car-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own car images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'car-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Important: review and remove older permissive policies on public.cars or
-- storage.objects. PostgreSQL RLS policies are permissive by default, so an
-- older broad policy can grant access in addition to the policies above.
