-- Minimal AutoMarket My Profile permission repair
-- Run this manually in the Supabase SQL Editor. It is safe to run repeatedly.

alter table public.profiles enable row level security;

-- Never expose the base profiles table to signed-out users. Public seller
-- contact data remains available only through public.seller_profiles.
revoke all privileges on table public.profiles from public, anon;

-- My Profile loading and the upsert RETURNING clause request exactly these
-- five columns. updated_at is additionally required by ON CONFLICT DO UPDATE
-- because the upsert submits and reads the proposed updated_at value.
grant select (id, full_name, phone, city, avatar_url, updated_at)
on table public.profiles
to authenticated;

-- The upsert inserts these columns when the user's profile does not exist.
grant insert (id, full_name, phone, city, avatar_url, updated_at)
on table public.profiles
to authenticated;

-- PostgREST derives the ON CONFLICT update set from every key in the upsert
-- payload. Because the payload includes the primary-key id, UPDATE(id) is also
-- required even though its value remains the authenticated user's own ID.
grant update (id, full_name, phone, city, avatar_url, updated_at)
on table public.profiles
to authenticated;

-- These grants do not make other users' rows visible or writable. The existing
-- owner-only SELECT, INSERT, and UPDATE RLS policies still require
-- profiles.id = auth.uid(), so UPDATE(id) cannot transfer a profile to another
-- user. No permission is granted for created_at, DELETE,
-- TRUNCATE, REFERENCES, or TRIGGER, and no seller view columns are changed.
