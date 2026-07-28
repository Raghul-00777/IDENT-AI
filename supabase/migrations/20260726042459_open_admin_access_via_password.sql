/*
# Open-source admin access via password (relaxed RLS)

## Purpose
This project is open-source and the admin panel is now gated by a client-side
admin password instead of a per-user admin role. To let the password-gated
admin panel read system-wide analytics and manage roles, read access on
profiles / predictions / logs / reports is opened to all authenticated users,
and profile role updates are allowed for any authenticated user.

## Security changes
- profiles SELECT: any authenticated user (admin panel lists all users)
- profiles UPDATE: any authenticated user (admin panel promotes/demotes)
- predictions SELECT: any authenticated user (admin analytics)
- logs SELECT: any authenticated user (admin audit log)
- reports SELECT: any authenticated user (admin report listing)
- Owner-scoped INSERT/UPDATE/DELETE on predictions/reports remain unchanged.
- logs INSERT remains owner-scoped.

## Important notes
1. This is demo-grade security appropriate for an open-source educational
   project. The admin panel itself is protected by an admin password
   (see frontend/js/config.js, default "admin123" — change before deploy).
2. For production, replace client-side password gating with server-side
   auth (Supabase Edge Function + service role key) and restore owner-only
   RLS policies.
*/

-- profiles SELECT: any authenticated user
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- profiles UPDATE: any authenticated user (role management via admin panel)
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_any_profile" ON profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- predictions SELECT: any authenticated user (admin analytics)
DROP POLICY IF EXISTS "select_own_predictions" ON predictions;
CREATE POLICY "select_all_predictions" ON predictions FOR SELECT
  TO authenticated USING (true);

-- logs SELECT: any authenticated user (admin audit log)
DROP POLICY IF EXISTS "select_own_logs" ON logs;
CREATE POLICY "select_all_logs" ON logs FOR SELECT
  TO authenticated USING (true);

-- reports SELECT: any authenticated user (admin report listing)
DROP POLICY IF EXISTS "select_own_reports" ON reports;
CREATE POLICY "select_all_reports" ON reports FOR SELECT
  TO authenticated USING (true);
