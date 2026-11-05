-- AutoMarket profiles and profile-picture Storage setup
-- Run this script manually in the Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  city text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_length check (char_length(full_name) <= 120),
  constraint profiles_phone_length check (char_length(phone) <= 40),
  constraint profiles_city_length check (char_length(city) <= 100)
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
grant select, insert, update on table public.profiles to authenticated;

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Create or configure the public bucket. Files remain publicly readable so
-- their public URLs can be displayed, while writes are restricted by RLS.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-pictures',
  'profile-pictures',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can view profile pictures" on storage.objects;
drop policy if exists "Users can upload their own profile pictures" on storage.objects;
drop policy if exists "Users can update their own profile pictures" on storage.objects;
drop policy if exists "Users can delete their own profile pictures" on storage.objects;

create policy "Public can view profile pictures"
on storage.objects for select to anon, authenticated
using (bucket_id = 'profile-pictures');

create policy "Users can upload their own profile pictures"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update their own profile pictures"
on storage.objects for update to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete their own profile pictures"
on storage.objects for delete to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Review and remove older permissive policies on public.profiles or
-- storage.objects. PostgreSQL RLS policies are permissive by default.
