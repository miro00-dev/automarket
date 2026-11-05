-- AutoMarket public seller-contact setup
-- Run this script manually in the Supabase SQL Editor.
-- It does not expose auth.users or any seller email address.

alter table public.profiles enable row level security;

-- Fail clearly if the ownership setup has not been applied to public.cars.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cars' and column_name = 'owner_id'
  ) then
    raise exception 'public.cars.owner_id is required; run supabase-owner-setup.sql first';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cars' and column_name = 'status'
  ) then
    raise exception 'public.cars.status is required';
  end if;
end
$$;

-- Use grants and RLS together. Anonymous users receive no direct permission on
-- public.profiles; public seller data is available only through the restricted
-- seller_profiles view created below.
revoke all privileges on table public.profiles from public, anon, authenticated;

-- updated_at is private and is not exposed by seller_profiles. Authenticated
-- owners need SELECT on it only because PostgreSQL ON CONFLICT DO UPDATE reads
-- every submitted excluded column during the profile upsert.
grant select (id, full_name, phone, city, avatar_url, updated_at)
on public.profiles to authenticated;

grant insert (id, full_name, phone, city, avatar_url, updated_at)
on public.profiles to authenticated;

-- PostgREST includes the primary-key id in the upsert conflict update because
-- id is present in the payload. Owner-only RLS prevents changing it to any ID
-- other than auth.uid().
grant update (id, full_name, phone, city, avatar_url, updated_at)
on public.profiles to authenticated;

-- Keep profile creation and editing restricted to the authenticated owner.
drop policy if exists "Public can view seller profiles" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Users can view their own profile"
on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "Users can create their own profile"
on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- This read-only view exposes only the fields needed on active car listings.
-- It intentionally uses the view owner's privileges so callers do not need any
-- direct permission on public.profiles. The fixed query is the security
-- boundary: only five columns and owners of active listings can be returned.
create or replace view public.seller_profiles
with (security_barrier = true, security_invoker = false)
as
select
  profile.id,
  profile.full_name,
  profile.phone,
  profile.city,
  profile.avatar_url
from public.profiles as profile
where exists (
  select 1
  from public.cars as car
  where car.owner_id = profile.id
    and car.status = 'active'
);

revoke all on table public.seller_profiles from public, anon, authenticated;
grant select on table public.seller_profiles to anon, authenticated;

-- SECURITY INVOKER is deliberately false. This narrowly scoped view is the
-- only public interface to seller contact data, so anon never receives direct
-- public.profiles privileges. SECURITY BARRIER prevents caller predicates from
-- being evaluated before the active-listing filter. The view contains no email
-- or auth.users data, is non-updatable because of EXISTS, and callers receive
-- SELECT permission only. Never add private columns to this view.
