-- ============================================================
-- Overlapse — Initial Schema Migration
-- Run this in Supabase → SQL Editor → New Query → Paste → Run
-- ============================================================
-- Creates 7 tables + RLS policies + indexes per PRD Section 9
-- Plus the world_clock_cities column added for Phase 3
-- ============================================================


-- ============================================================
-- 1. profiles — one row per authenticated user
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  home_timezone text not null default 'UTC',
  is_premium boolean not null default false,
  push_token text,
  world_clock_cities text[] default array['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'],
  created_at timestamptz not null default now(),
  last_active_at timestamptz default now()
);


comment on table public.profiles is 'User profiles — extends Supabase auth.users with Overlapse-specific fields';


-- ============================================================
-- 2. groups — a coordination circle
-- ============================================================
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.profiles(id) on delete set null,
  is_recurring boolean not null default false,
  recurrence_rule text, -- RRULE string, e.g. "FREQ=WEEKLY;BYDAY=MO;BYHOUR=14"
  created_at timestamptz not null default now()
);


comment on table public.groups is 'Coordination groups — circle of friends/collaborators sharing meeting coordination';


-- ============================================================
-- 3. group_members — per-member timezone + work/home hours
-- ============================================================
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  timezone text not null,
  work_start time not null default '09:00',
  work_end time not null default '17:00',
  role text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);


comment on table public.group_members is 'Group membership with member timezone and work hours for Golden Hours computation';


-- ============================================================
-- 4. meeting_blocks — proposed or confirmed meeting windows
-- ============================================================
create table if not exists public.meeting_blocks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_draggable_proposal boolean not null default true,
  is_confirmed boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);


comment on table public.meeting_blocks is 'Meeting time proposals — draggable or fixed, confirmed or pending';


-- ============================================================
-- 5. suggestions — real-time time-change proposals with reasons
-- ============================================================
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  meeting_block_id uuid not null references public.meeting_blocks(id) on delete cascade,
  suggested_by uuid references public.profiles(id) on delete set null,
  new_start timestamptz not null,
  new_end timestamptz not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);


comment on table public.suggestions is 'Real-time meeting time-change suggestions with reason field';


-- ============================================================
-- 6. notifications — in-app notification log
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);


comment on table public.notifications is 'In-app notification log — used for the bell-icon dropdown';


-- ============================================================
-- 7. saved_locations — pins on the hero globe
-- ============================================================
create table if not exists public.saved_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  timezone text not null,
  pin_color text default '#ff6a1a',
  created_at timestamptz not null default now()
);


comment on table public.saved_locations is 'User-saved globe pin locations';


-- ============================================================
-- Indexes for performance
-- ============================================================
create index if not exists idx_group_members_user on public.group_members(user_id);
create index if not exists idx_group_members_group on public.group_members(group_id);
create index if not exists idx_meeting_blocks_group on public.meeting_blocks(group_id);
create index if not exists idx_meeting_blocks_start on public.meeting_blocks(start_time);
create index if not exists idx_suggestions_meeting on public.suggestions(meeting_block_id);
create index if not exists idx_suggestions_status on public.suggestions(status);
create index if not exists idx_notifications_user_unread on public.notifications(user_id) where read_at is null;
create index if not exists idx_saved_locations_user on public.saved_locations(user_id);
create index if not exists idx_profiles_last_active on public.profiles(last_active_at);


-- ============================================================
-- Row Level Security
-- ============================================================


alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.meeting_blocks enable row level security;
alter table public.suggestions enable row level security;
alter table public.notifications enable row level security;
alter table public.saved_locations enable row level security;


-- ============================================================
-- RLS Policies
-- ============================================================


-- profiles: users can read/update only their own profile
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select using (auth.uid() = id);


drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update using (auth.uid() = id);


drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
  for insert with check (auth.uid() = id);


-- groups: members can read groups they belong to; creators can insert/update
drop policy if exists "members read own groups" on public.groups;
create policy "members read own groups" on public.groups
  for select using (
    id in (select group_id from public.group_members where user_id = auth.uid())
    or created_by = auth.uid()
  );


drop policy if exists "creators insert groups" on public.groups;
create policy "creators insert groups" on public.groups
  for insert with check (created_by = auth.uid());


drop policy if exists "creators update groups" on public.groups;
create policy "creators update groups" on public.groups
  for update using (created_by = auth.uid());


drop policy if exists "creators delete groups" on public.groups;
create policy "creators delete groups" on public.groups
  for delete using (created_by = auth.uid());


-- group_members: members can read membership rows for their groups; can update own; admins can manage
drop policy if exists "members read own membership rows" on public.group_members;
create policy "members read own membership rows" on public.group_members
  for select using (
    user_id = auth.uid()
    or group_id in (select group_id from public.group_members where user_id = auth.uid())
  );


drop policy if exists "users insert own membership" on public.group_members;
create policy "users insert own membership" on public.group_members
  for insert with check (user_id = auth.uid());


drop policy if exists "users update own membership" on public.group_members;
create policy "users update own membership" on public.group_members
  for update using (user_id = auth.uid());


drop policy if exists "users delete own membership" on public.group_members;
create policy "users delete own membership" on public.group_members
  for delete using (user_id = auth.uid());


-- meeting_blocks: members can read meetings for their groups; creators can insert/update
drop policy if exists "members read group meetings" on public.meeting_blocks;
create policy "members read group meetings" on public.meeting_blocks
  for select using (
    group_id in (select group_id from public.group_members where user_id = auth.uid())
  );


drop policy if exists "members insert group meetings" on public.meeting_blocks;
create policy "members insert group meetings" on public.meeting_blocks
  for insert with check (
    created_by = auth.uid()
    and group_id in (select group_id from public.group_members where user_id = auth.uid())
  );


drop policy if exists "creators update meetings" on public.meeting_blocks;
create policy "creators update meetings" on public.meeting_blocks
  for update using (
    created_by = auth.uid()
    or group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );


drop policy if exists "creators delete meetings" on public.meeting_blocks;
create policy "creators delete meetings" on public.meeting_blocks
  for delete using (
    created_by = auth.uid()
    or group_id in (
      select group_id from public.group_members
      where user_id = auth.uid() and role = 'admin'
    )
  );


-- suggestions: members can read suggestions for meetings in their groups; members can insert
drop policy if exists "members read group suggestions" on public.suggestions;
create policy "members read group suggestions" on public.suggestions
  for select using (
    meeting_block_id in (
      select id from public.meeting_blocks
      where group_id in (
        select group_id from public.group_members where user_id = auth.uid()
      )
    )
  );


drop policy if exists "members insert suggestions" on public.suggestions;
create policy "members insert suggestions" on public.suggestions
  for insert with check (
    suggested_by = auth.uid()
    and meeting_block_id in (
      select id from public.meeting_blocks
      where group_id in (
        select group_id from public.group_members where user_id = auth.uid()
      )
    )
  );


drop policy if exists "suggesters update own suggestions" on public.suggestions;
create policy "suggesters update own suggestions" on public.suggestions
  for update using (suggested_by = auth.uid());


drop policy if exists "suggesters delete own suggestions" on public.suggestions;
create policy "suggesters delete own suggestions" on public.suggestions
  for delete using (suggested_by = auth.uid());


-- notifications: users read/manage only their own
drop policy if exists "users read own notifications" on public.notifications;
create policy "users read own notifications" on public.notifications
  for select using (user_id = auth.uid());


drop policy if exists "users update own notifications" on public.notifications;
create policy "users update own notifications" on public.notifications
  for update using (user_id = auth.uid());


drop policy if exists "users delete own notifications" on public.notifications;
create policy "users delete own notifications" on public.notifications
  for delete using (user_id = auth.uid());


-- saved_locations: users manage only their own pins
drop policy if exists "users manage own saved locations" on public.saved_locations;
create policy "users manage own saved locations" on public.saved_locations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ============================================================
-- Trigger: auto-create profile on user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, home_timezone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'home_timezone', 'UTC')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- NOTE: The original "update last_active_at on profile read" trigger
-- has been REMOVED. PostgreSQL does NOT support AFTER SELECT triggers —
-- SELECT is not a valid trigger event (only INSERT, UPDATE, DELETE,
-- TRUNCATE are). That was the root cause of the 42601 syntax error.
--
-- Recommended replacement: update last_active_at from your application
-- layer (e.g. an RPC call or Edge Function on login/session refresh),
-- for example:
--
--   create or replace function public.touch_last_active()
--   returns void
--   language plpgsql
--   security definer set search_path = public
--   as $$
--   begin
--     update public.profiles set last_active_at = now() where id = auth.uid();
--   end;
--   $$;
--
-- Then call it from the client via supabase.rpc('touch_last_active')
-- whenever the user opens the app or their session refreshes.
-- ============================================================


-- ============================================================
-- Realtime: enable for key tables
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'suggestions'
  ) then
    alter publication supabase_realtime add table public.suggestions;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'meeting_blocks'
  ) then
    alter publication supabase_realtime add table public.meeting_blocks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;


-- ============================================================
-- Done. Verify with:
--   select * from profiles limit 1;          -- should return 0 rows (no error)
--   select * from groups limit 1;
--   select * from group_members limit 1;
--   select * from meeting_blocks limit 1;
--   select * from suggestions limit 1;
--   select * from notifications limit 1;
--   select * from saved_locations limit 1;
-- ============================================================