-- This is the definitive fix based on the user's screenshot.
-- It removes the two conflicting INSERT policies and creates a single correct one.

-- Step 1: Drop the two conflicting policies by their exact names.
DROP POLICY IF EXISTS "Allow anon to create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anonymous users to create reservations" ON public.reservations;

-- Step 2: Ensure the basic table-level GRANT permission is in place.
GRANT INSERT ON TABLE public.reservations TO anon;
GRANT USAGE, SELECT ON SEQUENCE reservations_id_seq TO anon;

-- Step 3: Create the single, correct policy for anonymous users to create a reservation.
-- The WITH CHECK (true) clause means any insert is allowed, which is what we need.
CREATE POLICY "Allow anonymous inserts on reservations"
ON public.reservations
FOR INSERT
TO anon
WITH CHECK (true);
