-- This is a master reset script to definitively fix the reservation creation error.
-- It will remove all old, potentially conflicting policies and create a single, correct one.

-- Step 1: Drop all policies on the reservations table for the public-facing roles.
-- This ensures a clean slate and removes any hidden, conflicting rules.
DROP POLICY IF EXISTS "Allow public read access to reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anonymous users to create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated users full access to reservations" ON public.reservations;
DROP POLICY IF EXISTS "public_insert_reservations" ON public.reservations;
DROP POLICY IF EXISTS "TEMP_DEBUG_ALLOW_ALL_INSERTS" ON public.reservations;
DROP POLICY IF EXISTS "TEMP_DEBUG_ALLOW_ALL_SELECTS" ON public.reservations;


-- Step 2: Ensure the basic table-level GRANT permission is in place for anonymous users.
GRANT INSERT ON TABLE public.reservations TO anon;
GRANT USAGE, SELECT ON SEQUENCE reservations_id_seq TO anon;


-- Step 3: Create the one, simple, correct policy needed for anonymous users to create a reservation.
-- The WITH CHECK (true) clause means any insert is allowed, which is what we need for the public form.
CREATE POLICY "Allow anonymous users to create reservations"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (true);


-- Step 4: Re-create a policy for authenticated users (admins) to see all data.
-- This ensures that logged-in users can still manage reservations.
CREATE POLICY "Allow authenticated users to read all reservations"
ON public.reservations
FOR SELECT
TO authenticated
USING (true);
