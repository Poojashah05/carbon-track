-- ============================================================
-- CO2Track — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES (extends auth.users)
create table if not exists profiles (
  id            uuid references auth.users on delete cascade primary key,
  name          text,
  avatar_url    text,
  location      text default 'india',
  transport     text,
  weekly_km     numeric,
  diet          text,
  energy_source text,
  electricity_kwh numeric,
  household_size  int default 1,
  onboarding_done boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 2. EMISSION LOGS
create table if not exists emission_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  category    text not null,
  subcategory text not null,
  quantity    numeric not null,
  co2_kg      numeric not null,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

-- 3. CHALLENGE STATE
create table if not exists challenge_state (
  user_id      uuid references profiles(id) on delete cascade not null,
  challenge_id int not null,
  status       text default 'none', -- 'none' | 'accepted' | 'completed'
  completed_at timestamptz,
  primary key  (user_id, challenge_id)
);

-- 4. AI USAGE (rate limiting — 2 per calendar month)
create table if not exists ai_usage (
  user_id  uuid references profiles(id) on delete cascade not null,
  month    text not null,           -- format: 'YYYY-MM'
  count    int default 0,
  primary key (user_id, month)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles       enable row level security;
alter table emission_logs  enable row level security;
alter table challenge_state enable row level security;
alter table ai_usage       enable row level security;

-- PROFILES policies
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- EMISSION_LOGS policies
create policy "Users can view own logs"
  on emission_logs for select using (auth.uid() = user_id);

create policy "Users can insert own logs"
  on emission_logs for insert with check (auth.uid() = user_id);

create policy "Users can delete own logs"
  on emission_logs for delete using (auth.uid() = user_id);

-- CHALLENGE_STATE policies
create policy "Users can view own challenges"
  on challenge_state for select using (auth.uid() = user_id);

create policy "Users can upsert own challenges"
  on challenge_state for insert with check (auth.uid() = user_id);

create policy "Users can update own challenges"
  on challenge_state for update using (auth.uid() = user_id);

-- AI_USAGE policies
create policy "Users can view own usage"
  on ai_usage for select using (auth.uid() = user_id);

create policy "Users can upsert own usage"
  on ai_usage for insert with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on ai_usage for update using (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (trigger)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. AI INSIGHTS HISTORY
create table if not exists ai_insights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade not null,
  content     text not null,
  created_at  timestamptz default now()
);

alter table ai_insights enable row level security;

create policy "Users can view own insights"
  on ai_insights for select using (auth.uid() = user_id);

create policy "Users can insert own insights"
  on ai_insights for insert with check (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_emission_logs_user_date
  on emission_logs(user_id, date desc);

create index if not exists idx_challenge_state_user
  on challenge_state(user_id);

create index if not exists idx_ai_insights_user
  on ai_insights(user_id, created_at desc);
