-- Drop leftover tables from previous versions if they exist, using CASCADE to handle dependencies
DROP TABLE IF EXISTS "bookings" CASCADE;
DROP TABLE IF EXISTS "appointments" CASCADE;

-- Drop existing tables in reverse order of dependency to avoid foreign key constraints errors
DROP TABLE IF EXISTS "reservations" CASCADE;
DROP TABLE IF EXISTS "availability_settings" CASCADE;
DROP TABLE IF EXISTS "breast_care_charts" CASCADE;
DROP TABLE IF EXISTS "postpartum_care_charts" CASCADE;
DROP TABLE IF EXISTS "patients" CASCADE;
DROP TABLE IF EXISTS "service_types" CASCADE;
DROP TABLE IF EXISTS "clinics" CASCADE;

-- Create clinics table
CREATE TABLE "clinics" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "address" VARCHAR(255),
  "phone_number" VARCHAR(20),
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_types table
CREATE TABLE "service_types" (
  "id" SERIAL PRIMARY KEY,
  "clinic_id" INT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "duration" INT NOT NULL,
  "price" INT NOT NULL,
  "color" VARCHAR(7) DEFAULT '#808080',
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create patients table
CREATE TABLE "patients" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "kana" VARCHAR(255) NOT NULL,
  "phone_number" VARCHAR(20) UNIQUE NOT NULL,
  "email" VARCHAR(255) UNIQUE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create reservations table
CREATE TABLE "reservations" (
  "id" SERIAL PRIMARY KEY,
  "patient_id" INT NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "clinic_id" INT NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "service_type_id" INT NOT NULL REFERENCES "service_types"("id") ON DELETE CASCADE,
  "reservation_date" DATE NOT NULL,
  "start_time" TIME NOT NULL,
  "end_time" TIME NOT NULL,
  "status" VARCHAR(50) DEFAULT 'confirmed',
  "note" TEXT,
  "access_token" UUID UNIQUE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create availability_settings table
CREATE TABLE "availability_settings" (
  "id" SERIAL PRIMARY KEY,
  "service_type_id" INT NOT NULL REFERENCES "service_types"("id") ON DELETE CASCADE,
  "day_of_week" INT,
  "specific_date" DATE,
  "start_time" TIME NOT NULL,
  "end_time" TIME NOT NULL,
  "is_available" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMPTZ DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ DEFAULT NOW(),
  CHECK (day_of_week IS NOT NULL OR specific_date IS NOT NULL)
);

-- Create breast_care_charts table
CREATE TABLE "breast_care_charts" (
    "id" SERIAL PRIMARY KEY,
    "patient_id" INT NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
    "visit_date" DATE NOT NULL,
    "practitioner_name" VARCHAR(255),
    "concerns" TEXT,
    "left_breast_condition" JSONB,
    "right_breast_condition" JSONB,
    "care_details" TEXT,
    "recommendations" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Create postpartum_care_charts table
CREATE TABLE "postpartum_care_charts" (
    "id" SERIAL PRIMARY KEY,
    "patient_id" INT NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
    "visit_date" DATE NOT NULL,
    "practitioner_name" VARCHAR(255),
    "weeks_postpartum" INT,
    "physical_condition" TEXT,
    "mental_condition" TEXT,
    "care_provided" TEXT,
    "guidance" TEXT,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);


-- Insert initial data
INSERT INTO "clinics" ("name", "address", "phone_number") VALUES
('助産院マナリー', '東京都渋谷区', '03-1111-1111');

INSERT INTO "service_types" ("clinic_id", "name", "description", "duration", "price", "color") VALUES
(1, '初回相談', '初めての方の相談メニュー', 60, 5000, '#3498db'),
(1, '産後ケア', '産後の体と心のケア', 90, 8000, '#2ecc71'),
(1, '母乳相談', '母乳育児に関する相談', 60, 6000, '#f1c40f'),
(1, '沐浴指導', '赤ちゃんの沐浴指導', 45, 4000, '#e74c3c'),
(1, '育児相談', '育児全般に関する相談', 60, 5000, '#9b59b6');

-- Add some availability for service_type_id 1 (初回相談) (Monday to Friday, 9am to 5pm)
INSERT INTO "availability_settings" ("service_type_id", "day_of_week", "start_time", "end_time", "is_available") VALUES
(1, 1, '09:00:00', '17:00:00', TRUE),
(1, 2, '09:00:00', '17:00:00', TRUE),
(1, 3, '09:00:00', '17:00:00', TRUE),
(1, 4, '09:00:00', '17:00:00', TRUE),
(1, 5, '09:00:00', '17:00:00', TRUE);

-- Add a specific date availability
INSERT INTO "availability_settings" ("service_type_id", "specific_date", "start_time", "end_time", "is_available") VALUES
(2, '2025-07-26', '10:00:00', '16:00:00', TRUE);
