-- Add the clinic_id column to the reservations table
ALTER TABLE public.reservations
ADD COLUMN clinic_id BIGINT;

-- Add a foreign key constraint to link to the clinics table
-- This assumes the 'clinics' table has an 'id' column as its primary key.
ALTER TABLE public.reservations
ADD CONSTRAINT fk_reservations_clinic_id
FOREIGN KEY (clinic_id)
REFERENCES public.clinics(id)
ON DELETE SET NULL; -- Using SET NULL is safer. Change to ON DELETE CASCADE if you want reservations to be deleted when a clinic is.

-- Add the end_time column which was not being saved
ALTER TABLE public.reservations
ADD COLUMN end_time TIME WITHOUT TIME ZONE;

-- Add comments to the new columns for clarity
COMMENT ON COLUMN public.reservations.clinic_id IS 'Reference to the clinic where the reservation is made.';
COMMENT ON COLUMN public.reservations.end_time IS 'The end time of the reservation.';
