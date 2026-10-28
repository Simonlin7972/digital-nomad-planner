/*
  # nomad schema: cloud copy of the digital nomad planner's browser data

  The planner (simonlin7972.github.io/digital-nomad-planner) shares this Supabase
  project with Wordrobe but keeps everything in its own schema so it can be moved
  out later with `pg_dump -n nomad`. Nothing here references public.*.

  This file is a read-only copy for reference. The migration itself lives in the
  Wordrobe repository (supabase/migrations/20261027234255_nomad_schema.sql), the one
  place that pushes migrations to the shared project; it was applied on 2026-10-28.

  Outside this file (dashboard settings, not in any repo):
    - Settings → API → Exposed schemas: add `nomad`
    - Authentication → URL Configuration → Additional Redirect URLs:
      https://simonlin7972.github.io/digital-nomad-planner/app/
      https://simonlin7972.github.io/digital-nomad-planner/profile/
      http://localhost:5173/app/
      http://localhost:5173/profile/

  1. Tables
    - `nomad.plans`    one row per (user, year): the planner's single-year export object
    - `nomad.settings` one row per user: the "about me" profile including the avatar

  2. Security
    - RLS on both; authenticated users read and write only their own rows.
    - anon gets schema USAGE only (PostgREST introspection), no table rights.

  3. Realtime
    - Both tables are in the supabase_realtime publication so a second device
      can follow changes live (RLS applies to the change feed too).

  Idempotent: safe to run again.
*/

CREATE SCHEMA IF NOT EXISTS nomad;

GRANT USAGE ON SCHEMA nomad TO anon, authenticated, service_role;

-- updated_at is set by the database, never trusted from the client
CREATE OR REPLACE FUNCTION nomad.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS nomad.plans (
  user_id    uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  year       smallint NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, year),
  CHECK (jsonb_typeof(data) = 'object'),
  CHECK ((data->>'year')::int = year),
  CHECK (pg_column_size(data) < 512 * 1024)
);

DROP TRIGGER IF EXISTS plans_touch_updated_at ON nomad.plans;
CREATE TRIGGER plans_touch_updated_at
  BEFORE UPDATE ON nomad.plans
  FOR EACH ROW EXECUTE FUNCTION nomad.touch_updated_at();

ALTER TABLE nomad.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own plans" ON nomad.plans;
CREATE POLICY "Users can view own plans"
  ON nomad.plans FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own plans" ON nomad.plans;
CREATE POLICY "Users can create own plans"
  ON nomad.plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own plans" ON nomad.plans;
CREATE POLICY "Users can update own plans"
  ON nomad.plans FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own plans" ON nomad.plans;
CREATE POLICY "Users can delete own plans"
  ON nomad.plans FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS nomad.settings (
  user_id    uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  data       jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (jsonb_typeof(data) = 'object'),
  CHECK (pg_column_size(data) < 64 * 1024)
);

DROP TRIGGER IF EXISTS settings_touch_updated_at ON nomad.settings;
CREATE TRIGGER settings_touch_updated_at
  BEFORE UPDATE ON nomad.settings
  FOR EACH ROW EXECUTE FUNCTION nomad.touch_updated_at();

ALTER TABLE nomad.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON nomad.settings;
CREATE POLICY "Users can view own settings"
  ON nomad.settings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own settings" ON nomad.settings;
CREATE POLICY "Users can create own settings"
  ON nomad.settings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own settings" ON nomad.settings;
CREATE POLICY "Users can update own settings"
  ON nomad.settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own settings" ON nomad.settings;
CREATE POLICY "Users can delete own settings"
  ON nomad.settings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA nomad TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nomad
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

-- Realtime: add the tables to the publication once
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'nomad' AND tablename = 'plans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE nomad.plans;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'nomad' AND tablename = 'settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE nomad.settings;
  END IF;
END $$;
