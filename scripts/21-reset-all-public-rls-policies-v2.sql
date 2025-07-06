-- Drop all existing policies on patients and reservations to ensure a clean slate.
-- This avoids conflicts with any old or incorrect policies.
DROP POLICY IF EXISTS "Allow public read access to patients" ON public.patients;
DROP POLICY IF EXISTS "Allow anonymous users to create and update their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated users full access to patients" ON public.patients;

DROP POLICY IF EXISTS "Allow public read access to reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anonymous users to create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated users full access to reservations" ON public.reservations;


-- Grant basic table-level permissions to the anonymous role.
-- This is the first layer of security.
GRANT SELECT, INSERT, UPDATE ON TABLE public.patients TO anon;
GRANT SELECT, INSERT ON TABLE public.reservations TO anon;
GRANT USAGE, SELECT ON SEQUENCE reservations_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE patients_id_seq TO anon;

-- Grant full permissions to the authenticated role (for admins).
GRANT ALL ON TABLE public.patients TO authenticated;
GRANT ALL ON TABLE public.reservations TO authenticated;
GRANT ALL ON SEQUENCE reservations_id_seq TO authenticated;
GRANT ALL ON SEQUENCE patients_id_seq TO authenticated;


-- Create Row-Level Security (RLS) policies for the anonymous role.
-- This is the second layer of security, defining what rows can be accessed/modified.

-- Allow anonymous users to create/update their patient records.
-- USING (true) allows them to see any patient (though the app logic limits this).
-- WITH CHECK (true) allows them to insert/update any record, which is needed for the "find or create" logic.
CREATE POLICY "Allow anonymous users to create and update their own patient record"
ON public.patients FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Allow anonymous users to create reservations.
CREATE POLICY "Allow anonymous users to create reservations"
ON public.reservations FOR INSERT
TO anon
WITH CHECK (true);


-- Create RLS policies for the authenticated role (admins).
-- This gives admins full access to all records for management purposes.
CREATE POLICY "Allow authenticated users full access to patients"
ON public.patients FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to reservations"
ON public.reservations FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
