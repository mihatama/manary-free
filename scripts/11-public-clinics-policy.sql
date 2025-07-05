-- 1. Enable RLS on the clinics table if it's not already enabled.
-- This is idempotent and will not cause an error if it's already on.
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 2. Drop previous policies to start fresh and avoid conflicts.
DROP POLICY IF EXISTS "Allow authenticated users to read clinics" ON public.clinics;
DROP POLICY IF EXISTS "Allow public read access to clinics" ON public.clinics;

-- 3. Create a new, more permissive policy.
-- This policy allows ANYONE (including anonymous and authenticated users) to read all rows from the clinics table.
-- This is generally safe for non-sensitive data like a list of clinic names and addresses.
CREATE POLICY "Allow public read access to clinics"
ON public.clinics
FOR SELECT
USING (true);

-- 4. Grant usage on the schema and select on the table to the anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.clinics TO anon;
