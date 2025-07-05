-- clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- service_types table
CREATE TABLE IF NOT EXISTS public.service_types (
    id SERIAL PRIMARY KEY,
    clinic_id INTEGER REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- patients table
CREATE TABLE IF NOT EXISTS public.patients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    kana TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- reservations table
CREATE TABLE IF NOT EXISTS public.reservations (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES public.patients(id) ON DELETE CASCADE,
    clinic_id INTEGER REFERENCES public.clinics(id) ON DELETE CASCADE,
    service_type_id INTEGER REFERENCES public.service_types(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    note TEXT,
    access_token UUID DEFAULT gen_random_uuid() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- availability_settings table
CREATE TABLE IF NOT EXISTS public.availability_settings (
    id SERIAL PRIMARY KEY,
    service_type_id INTEGER REFERENCES public.service_types(id) ON DELETE CASCADE,
    day_of_week INTEGER, -- 0 for Sunday, 1 for Monday, etc.
    specific_date DATE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_day_or_date CHECK (day_of_week IS NOT NULL OR specific_date IS NOT NULL)
);

-- Add some initial data for testing
-- This is important because the app expects some data to exist.
-- For example, clinics and service types.

-- Check if clinics exist before inserting
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM public.clinics) THEN
      INSERT INTO public.clinics (id, name) VALUES
      (1, '助産院1'),
      (2, '助産院2'),
      (3, '助産院3')
      ON CONFLICT (id) DO NOTHING;
   END IF;
END $$;

-- Check if service_types exist before inserting
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM public.service_types) THEN
      INSERT INTO public.service_types (id, clinic_id, name, duration, color) VALUES
      (10, 1, '産後ケア', 60, '#FFB6C1'),
      (11, 1, '母乳相談', 30, '#ADD8E6'),
      (12, 2, '産後ケア', 60, '#FFB6C1'),
      (13, 3, '産後ケア', 60, '#FFB6C1')
      ON CONFLICT (id) DO NOTHING;
   END IF;
END $$;

-- Check if availability_settings exist before inserting
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM public.availability_settings) THEN
      -- General availability for service type 10 (Clinic 1, 産後ケア)
      INSERT INTO public.availability_settings (service_type_id, day_of_week, start_time, end_time, is_available) VALUES
      (10, 1, '09:00', '17:00', true), -- Monday
      (10, 2, '09:00', '17:00', true), -- Tuesday
      (10, 3, '09:00', '17:00', true), -- Wednesday
      (10, 4, '09:00', '17:00', true), -- Thursday
      (10, 5, '09:00', '17:00', true); -- Friday

      -- General availability for service type 13 (Clinic 3, 産後ケア)
      INSERT INTO public.availability_settings (service_type_id, day_of_week, start_time, end_time, is_available) VALUES
      (13, 1, '10:00', '18:00', true), -- Monday
      (13, 2, '10:00', '18:00', true), -- Tuesday
      (13, 3, '10:00', '18:00', true), -- Wednesday
      (13, 4, '10:00', '18:00', true), -- Thursday
      (13, 5, '10:00', '18:00', true); -- Friday
   END IF;
END $$;
