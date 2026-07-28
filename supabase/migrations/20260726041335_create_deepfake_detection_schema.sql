/*
# Deepfake Detection System - Core Schema

## Purpose
Multi-user AI deepfake detection platform. Users register/log in (Supabase built-in
auth provides JWT + password hashing), upload images/videos, run detection, view
history, and download PDF reports. Admins manage users and view analytics.

## New Tables
1. profiles - extends auth.users with role (user/admin), display name, avatar
2. predictions - every detection result (filename, prediction, confidence, etc.)
3. reports - generated PDF report records linked to predictions
4. logs - audit log of user actions
5. settings - per-user app settings (JSONB)

## Security (RLS)
- profiles: each user reads/updates own profile; admins read all profiles
- predictions: owner-scoped CRUD; admins read all (for analytics)
- reports: owner-scoped CRUD; admins read all
- logs: owner can read own; admins read all; inserts allowed for own rows
- settings: owner-scoped CRUD
- All policies use auth.uid(); admin checks via a subquery on profiles.role
*/

-- profiles: extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text DEFAULT '',
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- predictions: detection results
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  prediction text NOT NULL,
  confidence numeric(5,2) NOT NULL DEFAULT 0,
  probability numeric(5,2) NOT NULL DEFAULT 0,
  model_used text NOT NULL DEFAULT 'EfficientNet',
  processing_time numeric(10,3) NOT NULL DEFAULT 0,
  analysis_summary text DEFAULT '',
  recommendations text DEFAULT '',
  thumbnail text DEFAULT '',
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at DESC);

DROP POLICY IF EXISTS "select_own_predictions" ON predictions;
CREATE POLICY "select_own_predictions" ON predictions FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_own_predictions" ON predictions;
CREATE POLICY "insert_own_predictions" ON predictions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_predictions" ON predictions;
CREATE POLICY "update_own_predictions" ON predictions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_predictions" ON predictions;
CREATE POLICY "delete_own_predictions" ON predictions FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- reports: PDF report records
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id text UNIQUE NOT NULL,
  prediction_id uuid NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

DROP POLICY IF EXISTS "select_own_reports" ON reports;
CREATE POLICY "select_own_reports" ON reports FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- logs: audit log
CREATE TABLE IF NOT EXISTS logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

DROP POLICY IF EXISTS "select_own_logs" ON logs;
CREATE POLICY "select_own_logs" ON logs FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
DROP POLICY IF EXISTS "insert_own_logs" ON logs;
CREATE POLICY "insert_own_logs" ON logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- settings: per-user settings
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences jsonb DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON settings;
CREATE POLICY "select_own_settings" ON settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_settings" ON settings;
CREATE POLICY "insert_own_settings" ON settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_settings" ON settings;
CREATE POLICY "update_own_settings" ON settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_settings" ON settings;
CREATE POLICY "delete_own_settings" ON settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
