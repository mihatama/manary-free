-- This script ensures the 'reservations' table has the necessary columns and permissions.

-- Step 1: Add 'clinic_id' and 'end_time' columns if they don't exist.
DO $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.reservations ADD COLUMN clinic_id INT;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reservations' AND column_name = 'end_time') THEN
    ALTER TABLE public.reservations ADD COLUMN end_time TIME;
  END IF;
END $$;

-- Step 2: Add the foreign key constraint to 'clinic_id' if it doesn't exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reservations_clinic_id_fkey' AND conrelid = 'public.reservations'::regclass
  ) THEN
    ALTER TABLE public.reservations 
    ADD CONSTRAINT reservations_clinic_id_fkey 
    FOREIGN KEY (clinic_id) 
    REFERENCES public.clinics(id);
  END IF;
END $$;

-- Step 3: Grant permissions to the API roles. This is the most likely fix.
-- These commands are safe to run multiple times.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reservations TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.reservations_id_seq TO anon, authenticated;

-- Step 4: Notify PostgREST to reload its schema cache.
NOTIFY pgrst, 'reload schema';
