-- AutoMarket secure admin dashboard setup
-- Run this file manually in the Supabase SQL Editor after reviewing it.
-- It does not expose a service-role key and does not grant browser access to auth.users.

begin;

-- Fail early if the ownership/moderation columns expected by the application are absent.
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

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.user_account_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'suspended')),
  reason text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- A durable deletion marker makes the two-system deletion workflow retryable.
-- The listing is rejected and locked before any Storage object is removed.
create table if not exists public.admin_listing_deletions (
  car_id text primary key,
  image_folder text,
  requested_at timestamptz not null default now(),
  requested_by uuid not null references auth.users(id) on delete restrict
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_account_status'::regclass
      and conname = 'user_account_status_reason_length'
  ) then
    alter table public.user_account_status
      add constraint user_account_status_reason_length
      check (reason is null or char_length(reason) <= 500);
  end if;
end
$$;

alter table public.user_roles enable row level security;
alter table public.user_account_status enable row level security;
alter table public.admin_listing_deletions enable row level security;

revoke all on table public.user_roles from public, anon, authenticated;
revoke all on table public.user_account_status from public, anon, authenticated;
revoke all on table public.admin_listing_deletions from public, anon, authenticated;
grant select (user_id, role) on public.user_roles to authenticated;
grant select (user_id, status, reason, updated_at) on public.user_account_status to authenticated;

drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
on public.user_roles for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can read their own account status" on public.user_account_status;
create policy "Users can read their own account status"
on public.user_account_status for select to authenticated
using (user_id = (select auth.uid()));

-- Own privileged functions with a dedicated, non-login role instead of the
-- SQL Editor's broadly privileged role. Nobody using the API can assume it.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'automarket_admin_executor') then
    create role automarket_admin_executor nologin noinherit nosuperuser nocreatedb nocreaterole noreplication;
  end if;
end
$$;

revoke automarket_admin_executor from anon, authenticated;
grant usage on schema public, private, auth, storage to automarket_admin_executor;
grant select (user_id, role) on public.user_roles to automarket_admin_executor;
grant select (user_id, status, reason) on public.user_account_status to automarket_admin_executor;
grant insert (user_id, status, reason, updated_at, updated_by),
      update (status, reason, updated_at, updated_by)
on public.user_account_status to automarket_admin_executor;
grant select (id, created_at, make, model, year, price, status, owner_id, image_url)
on public.cars to automarket_admin_executor;
grant update (status), delete on public.cars to automarket_admin_executor;
grant select (id, full_name, city) on public.profiles to automarket_admin_executor;
grant select (id, email, created_at, last_sign_in_at) on auth.users to automarket_admin_executor;
grant select (bucket_id, name) on storage.objects to automarket_admin_executor;
grant select, insert, update, delete on public.admin_listing_deletions to automarket_admin_executor;

drop policy if exists "Admin executor can read roles" on public.user_roles;
create policy "Admin executor can read roles" on public.user_roles
for select to automarket_admin_executor using (true);
drop policy if exists "Admin executor can read account status" on public.user_account_status;
drop policy if exists "Admin executor can insert account status" on public.user_account_status;
drop policy if exists "Admin executor can update account status" on public.user_account_status;
create policy "Admin executor can read account status" on public.user_account_status
for select to automarket_admin_executor using (true);
create policy "Admin executor can insert account status" on public.user_account_status
for insert to automarket_admin_executor with check (true);
create policy "Admin executor can update account status" on public.user_account_status
for update to automarket_admin_executor using (true) with check (true);

drop policy if exists "Admin executor can read cars" on public.cars;
drop policy if exists "Admin executor can update cars" on public.cars;
drop policy if exists "Admin executor can delete cars" on public.cars;
create policy "Admin executor can read cars" on public.cars
for select to automarket_admin_executor using (true);
create policy "Admin executor can update cars" on public.cars
for update to automarket_admin_executor using (true) with check (true);
create policy "Admin executor can delete cars" on public.cars
for delete to automarket_admin_executor using (true);

drop policy if exists "Admin executor can read profiles" on public.profiles;
create policy "Admin executor can read profiles" on public.profiles
for select to automarket_admin_executor using (true);

drop policy if exists "Admin executor can inspect image objects" on storage.objects;
create policy "Admin executor can inspect image objects" on storage.objects
for select to automarket_admin_executor using (bucket_id = 'car-images');

drop policy if exists "Admin executor can manage deletion markers" on public.admin_listing_deletions;
create policy "Admin executor can manage deletion markers" on public.admin_listing_deletions
for all to automarket_admin_executor using (true) with check (true);

-- These helpers run with the migration owner's privileges, use an empty search
-- path, fully qualify every object, and expose only boolean authorization checks.
create or replace function private.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id and role = 'admin'
  );
$$;

create or replace function private.is_account_active(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select check_user_id is not null and coalesce((
    select status = 'active'
    from public.user_account_status
    where user_id = check_user_id
  ), true);
$$;

create or replace function private.car_image_folder(public_url text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    regexp_replace(
      split_part(
        split_part(public_url, '/storage/v1/object/public/car-images/', 2),
        '?', 1
      ),
      '/[^/]+$', ''
    ),
    ''
  );
$$;

create or replace function private.is_listing_deletion_pending(check_car_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_listing_deletions
    where car_id = check_car_id
  );
$$;

create or replace function private.is_image_folder_deletion_pending(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_listing_deletions
    where image_folder = regexp_replace(object_name, '/[^/]+$', '')
  );
$$;

-- Storage DELETE policies call this function. A path is authorized only when
-- one listing references its folder and that folder begins with the owner UUID.
create or replace function private.can_admin_delete_car_image(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin((select auth.uid()))
    and private.is_account_active((select auth.uid()))
    and exists (
      select 1
      from public.cars as car
      join public.admin_listing_deletions as deletion on deletion.car_id = car.id::text
      where deletion.image_folder = regexp_replace(object_name, '/[^/]+$', '')
        and private.car_image_folder(car.image_url) = deletion.image_folder
        and split_part(private.car_image_folder(car.image_url), '/', 1) = car.owner_id::text
      group by private.car_image_folder(car.image_url)
      having count(*) = 1
    );
$$;

revoke all on function private.is_admin(uuid) from public, anon, authenticated;
revoke all on function private.is_account_active(uuid) from public, anon, authenticated;
revoke all on function private.car_image_folder(text) from public, anon, authenticated;
revoke all on function private.is_listing_deletion_pending(text) from public, anon, authenticated;
revoke all on function private.is_image_folder_deletion_pending(text) from public, anon, authenticated;
revoke all on function private.can_admin_delete_car_image(text) from public, anon, authenticated;
grant execute on function private.is_admin(uuid) to authenticated;
grant execute on function private.is_account_active(uuid) to authenticated;
grant execute on function private.is_listing_deletion_pending(text) to authenticated;
grant execute on function private.is_image_folder_deletion_pending(text) to authenticated;
grant execute on function private.can_admin_delete_car_image(text) to authenticated;

-- A small public RPC is used only to decide whether to show the Admin link.
-- Every sensitive RPC below independently repeats the authorization check.
create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin((select auth.uid()))
    and private.is_account_active((select auth.uid()));
$$;

-- Returns only the fields needed by the dashboard. auth.users remains unavailable
-- through PostgREST and password/token columns are never selected or returned.
drop function if exists public.admin_get_dashboard_data();
create or replace function public.admin_get_dashboard_data(
  p_cars_page integer default 1,
  p_users_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  result jsonb;
begin
  if not private.is_admin(caller_id) or not private.is_account_active(caller_id) then
    raise insufficient_privilege using message = 'Administrator access is required';
  end if;
  if p_cars_page < 1 or p_users_page < 1 or p_page_size < 1 or p_page_size > 100 then
    raise exception 'Invalid pagination parameters';
  end if;

  select jsonb_build_object(
    'statistics', jsonb_build_object(
      'totalUsers', (select count(*) from auth.users),
      'totalListings', (select count(*) from public.cars),
      'pendingListings', (select count(*) from public.cars where status = 'pending'),
      'approvedListings', (select count(*) from public.cars where status = 'active')
    ),
    'cars', coalesce((
      select jsonb_agg(to_jsonb(car_rows) order by car_rows.created_at desc)
      from (
        select id, created_at, make, model, year, price, status, owner_id
        from public.cars
        order by created_at desc
        limit p_page_size offset ((p_cars_page - 1) * p_page_size)
      ) as car_rows
    ), '[]'::jsonb),
    'users', coalesce((
      select jsonb_agg(to_jsonb(user_rows) order by user_rows.created_at desc)
      from (
        select
          account.id,
          account.email,
          account.created_at,
          account.last_sign_in_at,
          profile.full_name,
          profile.city,
          coalesce(account_status.status, 'active') as status,
          account_status.reason,
          coalesce(role.role = 'admin', false) as is_admin
        from auth.users as account
        left join public.profiles as profile on profile.id = account.id
        left join public.user_account_status as account_status on account_status.user_id = account.id
        left join public.user_roles as role on role.user_id = account.id
        order by account.created_at desc
        limit p_page_size offset ((p_users_page - 1) * p_page_size)
      ) as user_rows
    ), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'carsPage', p_cars_page,
      'usersPage', p_users_page,
      'pageSize', p_page_size,
      'carsTotal', (select count(*) from public.cars),
      'usersTotal', (select count(account.id) from auth.users as account)
    )
  ) into result;

  return result;
end;
$$;

drop function if exists public.admin_get_car_image_paths(text);
create or replace function public.admin_prepare_car_deletion(p_car_id text)
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  folder text;
  listing_owner uuid;
  reference_count bigint;
  paths text[];
begin
  if not private.is_admin((select auth.uid())) or not private.is_account_active((select auth.uid())) then
    raise insufficient_privilege using message = 'Administrator access is required';
  end if;

  select private.car_image_folder(image_url), owner_id
  into folder, listing_owner
  from public.cars
  where id::text = p_car_id;

  if not found then raise exception 'Listing not found'; end if;
  if folder is not null and split_part(folder, '/', 1) <> listing_owner::text then
    raise exception 'The listing image folder does not match its owner';
  end if;

  update public.cars set status = 'rejected' where id::text = p_car_id;
  insert into public.admin_listing_deletions (car_id, image_folder, requested_at, requested_by)
  values (p_car_id, folder, now(), (select auth.uid()))
  on conflict (car_id) do update
  set image_folder = excluded.image_folder,
      requested_at = excluded.requested_at,
      requested_by = excluded.requested_by;

  if folder is null then return array[]::text[]; end if;

  select count(*) into reference_count
  from public.cars
  where private.car_image_folder(image_url) = folder;
  if reference_count <> 1 then
    raise exception 'The image folder is not uniquely associated with this listing';
  end if;

  select coalesce(array_agg(name order by name), array[]::text[])
  into paths
  from storage.objects
  where bucket_id = 'car-images'
    and regexp_replace(name, '/[^/]+$', '') = folder;

  return paths;
end;
$$;

create or replace function public.admin_set_car_status(p_car_id text, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin((select auth.uid())) or not private.is_account_active((select auth.uid())) then
    raise insufficient_privilege using message = 'Administrator access is required';
  end if;
  if p_status not in ('pending', 'active', 'rejected') then
    raise exception 'Invalid listing status';
  end if;
  if private.is_listing_deletion_pending(p_car_id) then
    raise exception 'Listing deletion is already in progress';
  end if;

  update public.cars set status = p_status where id::text = p_car_id;
  if not found then raise exception 'Listing not found'; end if;
end;
$$;

create or replace function public.admin_delete_car(p_car_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  folder text;
begin
  if not private.is_admin((select auth.uid())) or not private.is_account_active((select auth.uid())) then
    raise insufficient_privilege using message = 'Administrator access is required';
  end if;

  select deletion.image_folder into folder
  from public.admin_listing_deletions as deletion
  where deletion.car_id = p_car_id;
  if not found then raise exception 'Listing not found'; end if;

  if folder is not null and exists (
    select 1 from storage.objects
    where bucket_id = 'car-images'
      and regexp_replace(name, '/[^/]+$', '') = folder
  ) then
    raise exception 'Listing images must be deleted before the listing';
  end if;

  delete from public.cars where id::text = p_car_id;
  if not found then raise exception 'Listing not found'; end if;
  delete from public.admin_listing_deletions where car_id = p_car_id;
end;
$$;

create or replace function public.admin_set_user_status(
  p_user_id uuid,
  p_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
begin
  if not private.is_admin(caller_id) or not private.is_account_active(caller_id) then
    raise insufficient_privilege using message = 'Administrator access is required';
  end if;
  if p_status not in ('active', 'suspended') then
    raise exception 'Invalid account status';
  end if;
  if p_user_id = caller_id and p_status = 'suspended' then
    raise exception 'Administrators cannot suspend their own account';
  end if;
  if p_status = 'suspended' and private.is_admin(p_user_id) then
    raise exception 'Administrator accounts cannot be suspended through this function';
  end if;
  if p_reason is not null and char_length(p_reason) > 500 then
    raise exception 'Suspension reason cannot exceed 500 characters';
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'User not found';
  end if;

  insert into public.user_account_status (user_id, status, reason, updated_at, updated_by)
  values (p_user_id, p_status, nullif(trim(p_reason), ''), now(), caller_id)
  on conflict (user_id) do update
  set status = excluded.status,
      reason = excluded.reason,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;
end;
$$;

-- Transfer only the privileges required by these functions to a dedicated
-- NOLOGIN role. Normal API roles cannot become or inherit this role.
grant create on schema public, private to automarket_admin_executor;
alter function private.is_admin(uuid) owner to automarket_admin_executor;
alter function private.is_account_active(uuid) owner to automarket_admin_executor;
alter function private.car_image_folder(text) owner to automarket_admin_executor;
alter function private.is_listing_deletion_pending(text) owner to automarket_admin_executor;
alter function private.is_image_folder_deletion_pending(text) owner to automarket_admin_executor;
alter function private.can_admin_delete_car_image(text) owner to automarket_admin_executor;
alter function public.is_current_user_admin() owner to automarket_admin_executor;
alter function public.admin_get_dashboard_data(integer, integer, integer) owner to automarket_admin_executor;
alter function public.admin_prepare_car_deletion(text) owner to automarket_admin_executor;
alter function public.admin_set_car_status(text, text) owner to automarket_admin_executor;
alter function public.admin_delete_car(text) owner to automarket_admin_executor;
alter function public.admin_set_user_status(uuid, text, text) owner to automarket_admin_executor;
revoke create on schema public, private from automarket_admin_executor;

-- Postgres functions are executable by PUBLIC by default. Restrict every RPC.
revoke all on function public.is_current_user_admin() from public, anon, authenticated;
revoke all on function public.admin_get_dashboard_data(integer, integer, integer) from public, anon, authenticated;
revoke all on function public.admin_prepare_car_deletion(text) from public, anon, authenticated;
revoke all on function public.admin_set_car_status(text, text) from public, anon, authenticated;
revoke all on function public.admin_delete_car(text) from public, anon, authenticated;
revoke all on function public.admin_set_user_status(uuid, text, text) from public, anon, authenticated;

grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.admin_get_dashboard_data(integer, integer, integer) to authenticated;
grant execute on function public.admin_prepare_car_deletion(text) to authenticated;
grant execute on function public.admin_set_car_status(text, text) to authenticated;
grant execute on function public.admin_delete_car(text) to authenticated;
grant execute on function public.admin_set_user_status(uuid, text, text) to authenticated;

-- Moderation status is database-controlled. Authenticated listing owners can
-- edit listing content but cannot insert or update owner_id/status directly.
alter table public.cars alter column status set default 'pending';
revoke insert, update on table public.cars from public, anon, authenticated;
revoke insert (status, owner_id), update (status, owner_id) on public.cars from authenticated;
grant insert (make, model, year, price, mileage, fuel_type, transmission, engine,
  power_hp, location, description, image_url, owner_id)
on public.cars to authenticated;
grant update (make, model, year, price, mileage, fuel_type, transmission, engine,
  power_hp, location, description, image_url)
on public.cars to authenticated;

create or replace function private.send_edited_car_to_review()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    new.status := 'pending';
    new.owner_id := old.owner_id;
  end if;
  return new;
end;
$$;
revoke all on function private.send_edited_car_to_review() from public, anon, authenticated;
grant create on schema private to automarket_admin_executor;
alter function private.send_edited_car_to_review() owner to automarket_admin_executor;
revoke create on schema private from automarket_admin_executor;
drop trigger if exists send_edited_car_to_review on public.cars;
create trigger send_edited_car_to_review
before update on public.cars
for each row execute function private.send_edited_car_to_review();

-- Replace the owner mutation policies so a deletion prepared by an admin is
-- locked against concurrent owner update/delete operations.
drop policy if exists "Users can update their own cars" on public.cars;
drop policy if exists "Users can delete their own cars" on public.cars;
create policy "Users can update their own cars" on public.cars
for update to authenticated
using (
  owner_id = (select auth.uid())
  and not private.is_listing_deletion_pending(id::text)
)
with check (owner_id = (select auth.uid()));
create policy "Users can delete their own cars" on public.cars
for delete to authenticated
using (
  owner_id = (select auth.uid())
  and not private.is_listing_deletion_pending(id::text)
);

-- Suspension semantics: suspended accounts may still authenticate and read
-- public marketplace data, but cannot mutate listings, profiles, favorites,
-- or AutoMarket images and cannot call admin RPCs. This is deliberately an
-- application-level read-only suspension, not a Supabase Auth ban or session
-- revocation. A true Auth ban must be performed by a trusted backend using the
-- Auth Admin API; a service-role key must never be shipped to this frontend.
drop policy if exists "Active accounts can insert cars" on public.cars;
drop policy if exists "Active accounts can update cars" on public.cars;
drop policy if exists "Active accounts can delete cars" on public.cars;
create policy "Active accounts can insert cars" on public.cars as restrictive
for insert to authenticated with check (private.is_account_active((select auth.uid())));
create policy "Active accounts can update cars" on public.cars as restrictive
for update to authenticated
using (
  private.is_account_active((select auth.uid()))
  and not private.is_listing_deletion_pending(id::text)
)
with check (
  private.is_account_active((select auth.uid()))
  and not private.is_listing_deletion_pending(id::text)
);
create policy "Active accounts can delete cars" on public.cars as restrictive
for delete to authenticated
using (
  private.is_account_active((select auth.uid()))
  and not private.is_listing_deletion_pending(id::text)
);

drop policy if exists "Active accounts can insert profiles" on public.profiles;
drop policy if exists "Active accounts can update profiles" on public.profiles;
create policy "Active accounts can insert profiles" on public.profiles as restrictive
for insert to authenticated with check (private.is_account_active((select auth.uid())));
create policy "Active accounts can update profiles" on public.profiles as restrictive
for update to authenticated using (private.is_account_active((select auth.uid())))
with check (private.is_account_active((select auth.uid())));

-- Favorites exists in the established AutoMarket schema. These checks fail
-- clearly if that setup has not been applied yet.
drop policy if exists "Active accounts can insert favorites" on public.favorites;
drop policy if exists "Active accounts can delete favorites" on public.favorites;
create policy "Active accounts can insert favorites" on public.favorites as restrictive
for insert to authenticated with check (private.is_account_active((select auth.uid())));
create policy "Active accounts can delete favorites" on public.favorites as restrictive
for delete to authenticated using (private.is_account_active((select auth.uid())));

drop policy if exists "Active accounts can upload AutoMarket images" on storage.objects;
drop policy if exists "Active accounts can update AutoMarket images" on storage.objects;
drop policy if exists "Active accounts can delete AutoMarket images" on storage.objects;
create policy "Active accounts can upload AutoMarket images" on storage.objects as restrictive
for insert to authenticated
with check (
  (bucket_id not in ('car-images', 'profile-pictures') or private.is_account_active((select auth.uid())))
  and (bucket_id <> 'car-images' or not private.is_image_folder_deletion_pending(name))
);
create policy "Active accounts can update AutoMarket images" on storage.objects as restrictive
for update to authenticated
using (
  (bucket_id not in ('car-images', 'profile-pictures') or private.is_account_active((select auth.uid())))
  and (bucket_id <> 'car-images' or not private.is_image_folder_deletion_pending(name))
)
with check (
  (bucket_id not in ('car-images', 'profile-pictures') or private.is_account_active((select auth.uid())))
  and (bucket_id <> 'car-images' or not private.is_image_folder_deletion_pending(name))
);
create policy "Active accounts can delete AutoMarket images" on storage.objects as restrictive
for delete to authenticated
using (
  (bucket_id not in ('car-images', 'profile-pictures') or private.is_account_active((select auth.uid())))
  and (
    bucket_id <> 'car-images'
    or not private.is_image_folder_deletion_pending(name)
    or private.is_admin((select auth.uid()))
  )
);

-- This is permissive only for DELETE and only for an active administrator.
-- The helper additionally binds the object to exactly one existing listing,
-- verifies the owner folder, and therefore rejects arbitrary Storage paths.
drop policy if exists "Admins can delete moderated car images" on storage.objects;
create policy "Admins can delete moderated car images" on storage.objects
for delete to authenticated
using (
  bucket_id = 'car-images'
  and private.can_admin_delete_car_image(name)
);

commit;

-- FIRST ADMIN (run separately after this migration):
-- Replace the placeholder email and execute this entire DO block in the SQL
-- Editor. It aborts unless exactly one account matches and never assigns roles
-- through the browser application.
--
-- do $$
-- declare
--   matching_user_ids uuid[];
--   selected_user_id uuid;
-- begin
--   select array_agg(id), min(id::text)::uuid
--   into matching_user_ids, selected_user_id
--   from auth.users
--   where lower(email) = lower('miro.softev@abv.bg');
--
--   if coalesce(cardinality(matching_user_ids), 0) <> 1 then
--     raise exception 'Expected exactly one matching account, found %',
--       coalesce(cardinality(matching_user_ids), 0);
--   end if;
--
--   insert into public.user_roles (user_id, role, created_by)
--   values (selected_user_id, 'admin', selected_user_id)
--   on conflict (user_id) do update set role = excluded.role;
-- end
-- $$;
