-- =================================================================
-- WARNING: SECURITY RISK - GRANTING FULL ACCESS TO ALL USERS
-- =================================================================
-- This script modifies your database security rules to grant ALL
-- permissions (read, write, update, delete) on all tables to
-- EVERYONE, including anonymous visitors (`anon` role) and logged-in
-- users (`authenticated` role).

-- This is a significant security risk and is NOT recommended for a
-- production application, as it would allow any visitor to your
-- website to view, modify, or delete all patient and reservation data.
-- Please proceed only if you understand and accept this risk.
-- =================================================================

-- Step 1: Drop all existing RLS policies on all tables to ensure a clean slate.
-- This prevents conflicts with any old, restrictive rules.

-- Drop policies on 'clinics'
DROP POLICY IF EXISTS "Allow anon read access on clinics" ON public.clinics;
DROP POLICY IF EXISTS "Allow authenticated full access on clinics" ON public.clinics;
DROP POLICY IF EXISTS "Allow full access to anon and authenticated users on clinics" ON public.clinics;

-- Drop policies on 'service_types'
DROP POLICY IF EXISTS "Allow anon read access on service_types" ON public.service_types;
DROP POLICY IF EXISTS "Allow authenticated full access on service_types" ON public.service_types;
DROP POLICY IF EXISTS "Allow public read access to service_types" ON public.service_types;
DROP POLICY IF EXISTS "Allow full access to anon and authenticated users on service_types" ON public.service_types;

-- Drop policies on 'patients'
DROP POLICY IF EXISTS "Allow anon to create patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated to manage patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public access to manage patients for reservations" ON public.patients;
DROP POLICY IF EXISTS "Allow anon full access for reservation creation" ON public.patients;
DROP POLICY IF EXISTS "Allow anon to manage their own records" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users full access to patients" ON public.patients;
DROP POLICY IF EXISTS "Allow full access to anon and authenticated users on patients" ON public.patients;

-- Drop policies on 'reservations'
DROP POLICY IF EXISTS "Allow anon to create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated to manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anonymous inserts on reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated users to read all reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated users full access to reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow full access to anon and authenticated users on reservations" ON public.reservations;

-- Drop policies on 'availability_settings'
DROP POLICY IF EXISTS "Allow anon read access on availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Allow authenticated full access on availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Allow public read access to availability settings" ON public.availability_settings;
DROP POLICY IF EXISTS "Allow full access to anon and authenticated users on availability_settings" ON public.availability_settings;

-- Drop policies on 'breast_care_charts'
DROP POLICY IF EXISTS "Allow authenticated to manage breast_care_charts" ON public.breast_care_charts;
DROP POLICY IF EXISTS "Allow full access to anon and authenticated users on breast_care_charts" ON public.breast_care_charts;

-- Drop policies on 'postpartum_care_charts'
DROP POLICY IF EXISTS "Allow authenticated to manage postpartum_care_charts" ON public.postpartum_care_charts;
DROP POLICY IF EXISTS "Allow full access to anon and authenticated users on postpartum_care_charts" ON public.postpartum_care_charts;

-- Drop policies on 'questionnaires'
DROP POLICY IF EXISTS "Allow anon to create questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Allow authenticated to manage questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Allow full access to anon and authenticated users on questionnaires" ON public.questionnaires;


-- Step 2: Grant all table-level permissions to both 'anon' and 'authenticated' roles.
-- This is the first layer of security.
GRANT ALL ON TABLE public.clinics TO anon, authenticated;
GRANT ALL ON TABLE public.service_types TO anon, authenticated;
GRANT ALL ON TABLE public.patients TO anon, authenticated;
GRANT ALL ON TABLE public.reservations TO anon, authenticated;
GRANT ALL ON TABLE public.availability_settings TO anon, authenticated;
GRANT ALL ON TABLE public.breast_care_charts TO anon, authenticated;
GRANT ALL ON TABLE public.postpartum_care_charts TO anon, authenticated;
GRANT ALL ON TABLE public.questionnaires TO anon, authenticated;

-- Also grant permissions on sequences for auto-incrementing IDs.
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;


-- Step 3: Create a single, permissive RLS policy for each table.
-- This policy grants full access (SELECT, INSERT, UPDATE, DELETE) to both roles.
-- The `USING (true)` and `WITH CHECK (true)` clauses mean no restrictions are applied.

CREATE POLICY "Allow full access to anon and authenticated users on clinics"
ON public.clinics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to anon and authenticated users on service_types"
ON public.service_types FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to anon and authenticated users on patients"
ON public.patients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to anon and authenticated users on reservations"
ON public.reservations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to anon and authenticated users on availability_settings"
ON public.availability_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to anon and authenticated users on breast_care_charts"
ON public.breast_care_charts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to anon and authenticated users on postpartum_care_charts"
ON public.postpartum_care_charts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to anon and authenticated users on questionnaires"
ON public.questionnaires FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


-- Step 4: Ensure RLS is enabled on all tables.
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breast_care_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postpartum_care_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;


-- Step 5: Notify PostgREST to reload its schema cache to apply all changes immediately.
NOTIFY pgrst, 'reload schema';
