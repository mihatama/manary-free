-- This script resets and grants the necessary permissions for all tables.
-- It ensures the admin role (service_role) has full control and other roles have appropriate access.

-- Grant usage on the public schema to all relevant roles.
-- This is necessary for them to "see" the tables within the schema.
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges on all tables in the schema to the admin roles.
-- This ensures the service_role key can perform any action, bypassing RLS.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, service_role;

-- Grant select permissions for the anonymous and authenticated roles.
-- This allows them to read data, which will then be filtered by RLS policies.
-- We are granting it on all tables for consistency.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Grant permissions for INSERT, UPDATE, DELETE to the authenticated role.
-- This allows logged-in users to modify data, which will be controlled by RLS.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant usage on all sequences. This is crucial for tables with auto-incrementing IDs.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Re-apply the public read policy for clinics for good measure.
-- This ensures that even if RLS is on, there's a policy allowing reads.
DROP POLICY IF EXISTS "Allow public read access to clinics" ON public.clinics;
CREATE POLICY "Allow public read access to clinics"
ON public.clinics
FOR SELECT
USING (true);

-- Ensure RLS is enabled on the clinics table.
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- Force RLS for other key tables as a security best practice.
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add a basic policy for service_types to be readable by everyone.
DROP POLICY IF EXISTS "Allow public read access to service_types" ON public.service_types;
CREATE POLICY "Allow public read access to service_types"
ON public.service_types
FOR SELECT
USING (true);
