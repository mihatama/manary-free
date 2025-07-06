-- Enable Row Level Security on the availability_settings table
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it already exists to prevent errors on re-running the script
DROP POLICY IF EXISTS "Allow public read access to availability settings" ON public.availability_settings;

-- Create a new policy that allows anyone to read from the availability_settings table
CREATE POLICY "Allow public read access to availability settings"
ON public.availability_settings
FOR SELECT
USING (true);

-- Grant the SELECT permission to the anonymous and authenticated user roles
GRANT SELECT ON TABLE public.availability_settings TO anon;
GRANT SELECT ON TABLE public.availability_settings TO authenticated;
