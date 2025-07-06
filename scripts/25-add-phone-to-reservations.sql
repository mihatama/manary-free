ALTER TABLE public.reservations
ADD COLUMN patient_phone TEXT;

COMMENT ON COLUMN public.reservations.patient_phone IS 'The phone number of the patient who made the reservation, used for SMS auth lookup.';
