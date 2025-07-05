-- =================================================================
-- MANARY DATABASE SCHEMA SCRIPT (v3 - Aligned with Code)
-- =================================================================
-- This script aligns the database schema with the application code.
-- It drops all existing policies and tables before recreating them.
-- =================================================================

-- Step 1: Drop all known RLS policies to prevent conflicts
DROP POLICY IF EXISTS "Allow anon read access on clinics" ON public.clinics;
DROP POLICY IF EXISTS "Allow authenticated full access on clinics" ON public.clinics;
DROP POLICY IF EXISTS "Allow anon read access on service_types" ON public.service_types;
DROP POLICY IF EXISTS "Allow authenticated full access on service_types" ON public.service_types;
DROP POLICY IF EXISTS "Allow anon read access on availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Allow authenticated full access on availability" ON public.availability_settings;
DROP POLICY IF EXISTS "Allow anon to create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated to manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anon to create patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated to manage patients" ON public.patients;
DROP POLICY IF EXISTS "Allow authenticated to manage breast_care_charts" ON public.breast_care_charts;
DROP POLICY IF EXISTS "Allow authenticated to manage postpartum_care_charts" ON public.postpartum_care_charts;
DROP POLICY IF EXISTS "Allow anon to create questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "Allow authenticated to manage questionnaires" ON public.questionnaires;


-- Step 2: Drop tables in reverse order of dependency
DROP TABLE IF EXISTS public.questionnaires CASCADE;
DROP TABLE IF EXISTS public.reservations CASCADE;
DROP TABLE IF EXISTS public.availability_settings CASCADE;
DROP TABLE IF EXISTS public.breast_care_charts CASCADE;
DROP TABLE IF EXISTS public.postpartum_care_charts CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.service_types CASCADE;
DROP TABLE IF EXISTS public.clinics CASCADE;

-- Step 3: Re-create tables with the correct schema

CREATE TABLE public.clinics (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(255),
  phone_number VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.service_types (
  id SERIAL PRIMARY KEY,
  clinic_id INT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration INT NOT NULL,
  price INT NOT NULL,
  color VARCHAR(7) DEFAULT '#808080',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  kana VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reservations (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id INT NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  service_type_id INT NOT NULL REFERENCES public.service_types(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'confirmed',
  note TEXT,
  access_token UUID UNIQUE DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.availability_settings (
  id SERIAL PRIMARY KEY,
  service_type_id INT NOT NULL REFERENCES public.service_types(id) ON DELETE CASCADE,
  day_of_week INT,
  specific_date DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (day_of_week IS NOT NULL OR specific_date IS NOT NULL)
);

CREATE TABLE public.breast_care_charts (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    practitioner_name VARCHAR(255),
    concerns TEXT,
    left_breast_condition JSONB,
    right_breast_condition JSONB,
    care_details TEXT,
    recommendations TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.postpartum_care_charts (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    practitioner_name VARCHAR(255),
    weeks_postpartum INT,
    physical_condition TEXT,
    mental_condition TEXT,
    care_provided TEXT,
    guidance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.questionnaires (
    id SERIAL PRIMARY KEY,
    reservation_id INT REFERENCES public.reservations(id) ON DELETE SET NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Enable Row Level Security (RLS) for all tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.breast_care_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postpartum_care_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

-- Step 5: Create explicit RLS policies for 'anon' and 'authenticated' roles
-- clinics:
CREATE POLICY "Allow anon read access on clinics" ON public.clinics FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated full access on clinics" ON public.clinics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- service_types:
CREATE POLICY "Allow anon read access on service_types" ON public.service_types FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated full access on service_types" ON public.service_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- availability_settings:
CREATE POLICY "Allow anon read access on availability" ON public.availability_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated full access on availability" ON public.availability_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- reservations:
CREATE POLICY "Allow anon to create reservations" ON public.reservations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated to manage reservations" ON public.reservations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- patients:
CREATE POLICY "Allow anon to create patients" ON public.patients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated to manage patients" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- charts (only authenticated):
CREATE POLICY "Allow authenticated to manage breast_care_charts" ON public.breast_care_charts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated to manage postpartum_care_charts" ON public.postpartum_care_charts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- questionnaires:
CREATE POLICY "Allow anon to create questionnaires" ON public.questionnaires FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow authenticated to manage questionnaires" ON public.questionnaires FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- Step 6: Insert initial data
INSERT INTO public.clinics (name, address, phone_number) VALUES
('助産院マナリー', '東京都渋谷区', '03-1111-1111');

INSERT INTO public.service_types (clinic_id, name, description, duration, price, color) VALUES
(1, '初回相談', '初めての方の相談メニュー', 60, 5000, '#3498db'),
(1, '産後ケア', '産後の体と心のケア', 90, 8000, '#2ecc71'),
(1, '母乳相談', '母乳育児に関する相談', 60, 6000, '#f1c40f'),
(1, '沐浴指導', '赤ちゃんの沐浴指導', 45, 4000, '#e74c3c'),
(1, '育児相談', '育児全般に関する相談', 60, 5000, '#9b59b6');

INSERT INTO public.availability_settings (service_type_id, day_of_week, start_time, end_time, is_available) VALUES
(1, 1, '09:00:00', '17:00:00', TRUE),
(1, 2, '09:00:00', '17:00:00', TRUE),
(1, 3, '09:00:00', '17:00:00', TRUE),
(1, 4, '09:00:00', '17:00:00', TRUE),
(1, 5, '09:00:00', '17:00:00', TRUE);

INSERT INTO public.availability_settings (service_type_id, specific_date, start_time, end_time, is_available) VALUES
(2, '2025-07-26', '10:00:00', '16:00:00', TRUE);

-- Step 7: Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
