-- =================================================================
-- FIX PATIENT TABLE PERMISSIONS (v2 - Comprehensive)
-- =================================================================
-- This script provides a more robust fix for the "permission denied"
-- error on the 'patients' table for anonymous users. It ensures
-- both table-level GRANTs and Row Level Security (RLS) policies
-- are correctly configured.
-- =================================================================

-- Step 1: Grant basic table-level permissions to the 'anon' role.
-- While Supabase does this by default, these can be accidentally
-- revoked. This command explicitly re-grants them, ensuring the
-- RLS policies can function.
GRANT SELECT, INSERT, UPDATE ON TABLE public.patients TO anon;

-- Step 2: Ensure RLS is enabled on the table.
-- This is critical for security. All access must go through a policy.
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Step 3: Remove any previous, potentially conflicting policies.
-- This cleans up the state before applying the correct policy.
DROP POLICY IF EXISTS "Allow anon to create patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public access to manage patients for reservations" ON public.patients;

-- Step 4: Create the definitive RLS policy for anonymous users.
-- This policy allows any anonymous user to perform any action
-- (SELECT, INSERT, UPDATE). The `USING (true)` and `WITH CHECK (true)`
-- clauses effectively open up the table for the 'anon' role, which
-- is required for the public reservation form.
CREATE POLICY "Allow anon full access for reservation creation"
ON public.patients
FOR ALL -- Covers SELECT, INSERT, UPDATE, DELETE
TO anon
USING (true)
WITH CHECK (true);

-- Step 5: Notify PostgREST to reload its schema cache to apply changes immediately.
NOTIFY pgrst, 'reload schema';

-- Final check: You can verify the policies on your table with this query in the Supabase SQL Editor:
-- SELECT * FROM pg_policies WHERE tablename = 'patients';
