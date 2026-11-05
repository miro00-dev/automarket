-- AutoMarket favorites table and Row Level Security setup
-- Run this file manually in the Supabase SQL Editor. Do not place credentials here.

-- Detect the existing public.cars.id type so this works whether that primary
-- key is bigint, uuid, or another PostgreSQL type.
do $$
declare
  car_id_type text;
begin
  select format_type(attribute.atttypid, attribute.atttypmod)
  into car_id_type
  from pg_attribute as attribute
  where attribute.attrelid = 'public.cars'::regclass
    and attribute.attname = 'id'
    and not attribute.attisdropped;

  if car_id_type is null then
    raise exception 'public.cars.id was not found';
  end if;

  execute format(
    'create table if not exists public.favorites (
      user_id uuid not null references auth.users(id) on delete cascade,
      car_id %s not null,
      created_at timestamptz not null default now(),
      constraint favorites_pkey primary key (user_id, car_id),
      constraint favorites_car_id_fkey foreign key (car_id)
        references public.cars(id) on delete cascade
    )',
    car_id_type
  );
end
$$;

create index if not exists favorites_car_id_idx on public.favorites(car_id);
create index if not exists favorites_user_created_at_idx on public.favorites(user_id, created_at desc);

alter table public.favorites enable row level security;

revoke all on table public.favorites from anon;
grant select, insert, delete on table public.favorites to authenticated;

drop policy if exists "Users can view their own favorites" on public.favorites;
drop policy if exists "Users can add their own favorites" on public.favorites;
drop policy if exists "Users can delete their own favorites" on public.favorites;

create policy "Users can view their own favorites"
on public.favorites for select to authenticated
using (user_id = auth.uid());

create policy "Users can add their own favorites"
on public.favorites for insert to authenticated
with check (user_id = auth.uid());

create policy "Users can delete their own favorites"
on public.favorites for delete to authenticated
using (user_id = auth.uid());
