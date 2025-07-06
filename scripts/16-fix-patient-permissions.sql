-- =================================================================
-- FIX PATIENT TABLE PERMISSIONS (v1)
-- =================================================================
-- This script grants anonymous users the necessary permissions to
-- create or update patient records during the public reservation flow.
-- =================================================================

-- Step 1: Drop the old, overly restrictive policy that only allowed INSERT.
DROP POLICY IF EXISTS "Allow anon to create patients" ON public.patients;

-- Step 2: Create a new, more comprehensive policy.
-- This policy allows anonymous users to SELECT (to check for existence),
-- INSERT (for new patients), and UPDATE (for returning patients).
-- This is crucial for the "find or create" logic in the reservation action.
CREATE POLICY "Allow public access to manage patients for reservations"
ON public.patients
FOR ALL -- This covers SELECT, INSERT, UPDATE, DELETE
TO anon   -- This policy applies to anonymous users
USING (true)
WITH CHECK (true);

-- Step 3: Notify PostgREST to reload the schema cache to apply changes immediately.
NOTIFY pgrst, 'reload schema';
