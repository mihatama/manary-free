-- 1. Enable RLS on the clinics table if it's not already enabled.
-- This is idempotent and will not cause an error if it's already on.
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing select policy to avoid conflicts.
-- This makes the script re-runnable.
DROP POLICY IF EXISTS "Allow authenticated users to read clinics" ON public.clinics;

-- 3. Create a new policy.
-- This policy allows any user who is authenticated to read all rows from the clinics table.
CREATE POLICY "Allow authenticated users to read clinics"
ON public.clinics
FOR SELECT
TO authenticated
USING (true);
