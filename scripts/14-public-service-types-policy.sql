-- Drop existing policy if it exists to ensure this script is rerunnable
DROP POLICY IF EXISTS "Allow public read access to service_types" ON "public"."service_types";

-- Create a policy to allow public read access to service_types
CREATE POLICY "Allow public read access to service_types"
ON "public"."service_types"
FOR SELECT
TO authenticated, anon
USING (true);
