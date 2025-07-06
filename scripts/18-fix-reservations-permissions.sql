-- =================================================================
-- FIX RESERVATIONS TABLE PERMISSIONS
-- =================================================================
-- This script fixes the "permission denied" error that occurs when
-- an anonymous user tries to create a new reservation. It ensures
-- both table-level GRANTs and Row Level Security (RLS) policies
-- are correctly configured for the 'reservations' table.
-- =================================================================

-- Step 1: Grant basic table-level permissions to the 'anon' role.
-- This explicitly grants the ability to insert data into the table.
GRANT INSERT ON TABLE public.reservations TO anon;
-- Also grant SELECT to allow reading data if needed in other parts of the app for anon users.
GRANT SELECT ON TABLE public.reservations TO anon;


-- Step 2: Ensure RLS is enabled on the table.
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Step 3: Remove any previous, potentially conflicting policies for the 'anon' role.
DROP POLICY IF EXISTS "Allow anon to create reservations" ON public.reservations;

-- Step 4: Create the definitive RLS policy for anonymous users.
-- This policy allows any anonymous user to insert a new reservation.
-- The `WITH CHECK (true)` clause enforces this for INSERT operations.
CREATE POLICY "Allow anon to create reservations"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (true);

-- Step 5: Notify PostgREST to reload its schema cache to apply changes immediately.
NOTIFY pgrst, 'reload schema';
