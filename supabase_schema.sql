-- CO2Track Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- ─── Profiles ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  location        TEXT DEFAULT 'India',
  primary_transport TEXT DEFAULT 'car_petrol',
  weekly_km       NUMERIC DEFAULT 0,
  diet_type       TEXT DEFAULT 'veg_thali',
  energy_source   TEXT DEFAULT 'electricity_india',
  monthly_kwh     NUMERIC DEFAULT 0,
  household_size  INTEGER DEFAULT 3,
  onboarded       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Emission Logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emission_logs (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('transport','food','energy','shopping')),
  subcategory   TEXT NOT NULL,
  quantity      NUMERIC NOT NULL CHECK (quantity >= 0),
  kg_co2        NUMERIC NOT NULL CHECK (kg_co2 >= 0),
  note          TEXT,
  logged_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS emission_logs_user_logged ON emission_logs(user_id, logged_at DESC);

-- ─── AI Usage ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key   TEXT NOT NULL,  -- e.g. '2026-06'
  count       INTEGER DEFAULT 0,
  UNIQUE (user_id, month_key)
);

-- ─── AI Insights ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_insights (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content           TEXT NOT NULL,
  emission_snapshot JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_insights_user_date ON ai_insights(user_id, created_at DESC);

-- ─── Challenge State ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS challenge_state (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state       JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE emission_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_state ENABLE ROW LEVEL SECURITY;

-- Users can only access their own rows
CREATE POLICY "profiles_own"       ON profiles       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "emission_logs_own"  ON emission_logs  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_usage_own"       ON ai_usage       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "ai_insights_own"    ON ai_insights    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "challenge_state_own" ON challenge_state FOR ALL USING (auth.uid() = user_id);
