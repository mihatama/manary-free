-- =================================================================
-- CONSOLIDATED PERMISSIONS FIX FOR PUBLIC RESERVATIONS
-- =================================================================
-- This script provides a definitive fix for the entire public
-- reservation workflow. It correctly configures permissions for
-- both the 'patients' and 'reservations' tables, addressing
-- "permission denied" and "violates row-level security policy" errors.
--
-- It ensures the 'anon' role can:
-- 1. Create or update a patient record.
-- 2. Create a reservation record linked to that patient.
-- =================================================================

-- PART 1: CONFIGURE PERMISSIONS FOR 'patients' TABLE

-- Step 1.1: Grant table-level permissions to the 'anon' role.
GRANT SELECT, INSERT, UPDATE ON TABLE public.patients TO anon;

-- Step 1.2: Ensure RLS is enabled.
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Step 1.3: Remove old policies to prevent conflicts.
DROP POLICY IF EXISTS "Allow anon to create and update their own records" ON public.patients;
DROP POLICY IF EXISTS "Allow anon to manage their own records" ON public.patients;


-- Step 1.4: Create a single, permissive policy for anonymous users.
-- This allows any anonymous user to read, insert, or update any patient record.
-- This is necessary for the "find or create" logic in the reservation form.
CREATE POLICY "Allow anon to manage their own records"
ON public.patients
FOR ALL
TO anon
USING (true)
WITH CHECK (true);


-- PART 2: CONFIGURE PERMISSIONS FOR 'reservations' TABLE

-- Step 2.1: Grant table-level permissions to the 'anon' role.
GRANT SELECT, INSERT ON TABLE public.reservations TO anon;

-- Step 2.2: Ensure RLS is enabled.
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Step 2.3: Remove old policies to prevent conflicts.
DROP POLICY IF EXISTS "Allow anon to create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anon to manage reservations" ON public.reservations;

-- Step 2.4: Create a single, permissive policy for anonymous users.
-- This allows any anonymous user to insert a new reservation.
CREATE POLICY "Allow anon to create reservations"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (true);


-- PART 3: APPLY CHANGES

-- Step 3.1: Notify PostgREST to reload its schema cache to apply all changes immediately.
NOTIFY pgrst, 'reload schema';
