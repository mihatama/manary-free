-- =================================================================
-- MASTER SCRIPT: RESET AND REBUILD ALL PUBLIC RLS POLICIES
-- =================================================================
-- This script provides a definitive fix for the entire public
-- reservation workflow by resetting all RLS policies on the relevant
-- tables to prevent conflicts.
--
-- It will:
-- 1. Programmatically find and DROP ALL existing RLS policies on
--    the 'patients' and 'reservations' tables.
-- 2. Re-create the correct, non-conflicting policies from scratch
--    for both anonymous and authenticated users.
-- =================================================================

-- PART 1: RESET AND CONFIGURE 'patients' TABLE

-- Step 1.1: Drop all existing policies on 'patients' to ensure a clean slate.
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN
        SELECT policyname FROM pg_policies WHERE tablename = 'patients' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.patients;';
    END LOOP;
END
$$;

-- Step 1.2: Grant necessary table-level permissions.
GRANT SELECT, INSERT, UPDATE ON TABLE public.patients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.patients TO authenticated;

-- Step 1.3: Create the correct policy for anonymous users to create/update a patient during booking.
CREATE POLICY "Allow anonymous users to create/update patient records"
ON public.patients
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Step 1.4: Create a secure policy for logged-in users (good practice).
-- This assumes a user might be linked to a patient record via a future 'user_id' column on patients.
-- For now, we will restrict it, as the primary use case is admin management.
-- If you have a user-facing profile, this would be more permissive.
CREATE POLICY "Allow authenticated users to view all patients for now"
ON public.patients
FOR SELECT
TO authenticated
USING (true);


-- PART 2: RESET AND CONFIGURE 'reservations' TABLE

-- Step 2.1: Drop all existing policies on 'reservations' to ensure a clean slate.
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN
        SELECT policyname FROM pg_policies WHERE tablename = 'reservations' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON public.reservations;';
    END LOOP;
END
$$;

-- Step 2.2: Grant necessary table-level permissions.
GRANT SELECT, INSERT ON TABLE public.reservations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reservations TO authenticated;


-- Step 2.3: Create the correct policy for anonymous users to create a reservation.
CREATE POLICY "Allow anonymous users to create reservations"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (true);

-- Step 2.4: Create a secure policy for logged-in users to manage their own reservations.
CREATE POLICY "Allow authenticated users to manage their own reservations"
ON public.reservations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Step 2.5: Allow anonymous users to view their own reservation via the confirmation page link.
-- This requires a specific RLS policy that checks the access_token.
-- This is a placeholder for now, as the confirmation flow is separate.
-- The INSERT policy is the critical one for the current error.


-- PART 3: APPLY CHANGES
-- Notify PostgREST to reload its schema cache to apply all changes immediately.
NOTIFY pgrst, 'reload schema';
