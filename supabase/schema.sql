-- Mi Jardín - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PLANTS TABLE
-- ============================================
CREATE TABLE public.plants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  local_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type_id TEXT NOT NULL,
  type_name TEXT NOT NULL,
  icon TEXT NOT NULL,
  water_every INTEGER NOT NULL,
  sun_hours INTEGER NOT NULL,
  sun_days INTEGER[] DEFAULT '{}',
  outdoor_days INTEGER[] DEFAULT '{}',
  last_watered DATE,
  sun_done_date DATE,
  outdoor_done_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, local_id)
);

-- Enable RLS
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;

-- Plants policies
CREATE POLICY "Users can view own plants" ON public.plants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plants" ON public.plants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plants" ON public.plants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plants" ON public.plants
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_plants_user_id ON public.plants(user_id);

-- ============================================
-- NOTES TABLE
-- ============================================
CREATE TABLE public.notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  local_id TEXT NOT NULL,
  date TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, local_id)
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Users can view own notes" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_notes_user_id ON public.notes(user_id);
CREATE INDEX idx_notes_date ON public.notes(date);

-- ============================================
-- REMINDERS TABLE
-- ============================================
CREATE TABLE public.reminders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  local_id TEXT NOT NULL,
  date TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, local_id)
);

-- Enable RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Reminders policies
CREATE POLICY "Users can view own reminders" ON public.reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders" ON public.reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON public.reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON public.reminders
  FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX idx_reminders_date ON public.reminders(date);

-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE public.user_settings (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  location_lat DOUBLE PRECISION,
  location_lon DOUBLE PRECISION,
  location_name TEXT,
  location_country TEXT,
  location_admin1 TEXT,
  notification_enabled BOOLEAN DEFAULT FALSE,
  notification_morning_time TEXT DEFAULT '08:00',
  notification_weather_alerts BOOLEAN DEFAULT FALSE,
  notification_care_reminders BOOLEAN DEFAULT FALSE,
  notification_morning_reminder BOOLEAN DEFAULT FALSE,
  plantnet_api_key TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- User settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- HELPFUL VIEWS
-- ============================================

-- View for users to see their data summary
CREATE OR REPLACE VIEW public.user_data_summary AS
SELECT
  auth.uid() as user_id,
  (SELECT COUNT(*) FROM public.plants WHERE user_id = auth.uid()) as plant_count,
  (SELECT COUNT(*) FROM public.notes WHERE user_id = auth.uid()) as note_count,
  (SELECT COUNT(*) FROM public.reminders WHERE user_id = auth.uid()) as reminder_count;

-- ============================================
-- OAUTH SETUP NOTES
-- ============================================
-- After running this schema, configure OAuth providers in Supabase Dashboard:
--
-- 1. Go to Authentication > Providers
--
-- 2. Enable Google:
--    - Get Client ID and Secret from Google Cloud Console
--    - Add authorized redirect URI: https://YOUR_PROJECT.supabase.co/auth/v1/callback
--    - Enable in Supabase
--
-- 3. Enable Apple (required for App Store if offering social login):
--    - Get Service ID from Apple Developer Portal
--    - Generate a secret key
--    - Add authorized redirect URI
--    - Enable in Supabase
--
-- 4. Update your app's redirect URLs:
--    - Development: exp://localhost:8081/--/auth/callback
--    - Production: mijardin://auth/callback
