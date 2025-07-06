-- Alter service_types table to add interval_minutes
ALTER TABLE public.service_types
ADD COLUMN interval_minutes integer NOT NULL DEFAULT 0;
