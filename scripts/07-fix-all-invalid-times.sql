-- This script finds and corrects invalid time values ('24:00:00') across all relevant tables.

-- Step 1: Find problematic rows in 'availability_settings' before updating
SELECT id, start_time, end_time
FROM public.availability_settings
WHERE start_time = '24:00:00' OR end_time = '24:00:00';

-- Step 2: Update 'availability_settings' to fix invalid times
UPDATE public.availability_settings
SET
  start_time = CASE WHEN start_time = '24:00:00' THEN '23:59:59' ELSE start_time END,
  end_time = CASE WHEN end_time = '24:00:00' THEN '23:59:59' ELSE end_time END
WHERE start_time = '24:00:00' OR end_time = '24:00:00';

-- Step 3: Find problematic rows in 'reservations' before updating
SELECT id, start_time, end_time
FROM public.reservations
WHERE start_time = '24:00:00' OR end_time = '24:00:00';

-- Step 4: Update 'reservations' to fix invalid times
UPDATE public.reservations
SET
  start_time = CASE WHEN start_time = '24:00:00' THEN '23:59:59' ELSE start_time END,
  end_time = CASE WHEN end_time = '24:00:00' THEN '23:59:59' ELSE end_time END
WHERE start_time = '24:00:00' OR end_time = '24:00:00';

-- Step 5: Verify that no invalid times remain
SELECT 'availability_settings' as table_name, id, start_time, end_time
FROM public.availability_settings
WHERE start_time = '24:00:00' OR end_time = '24:00:00'
UNION ALL
SELECT 'reservations' as table_name, id, start_time, end_time
FROM public.reservations
WHERE start_time = '24:00:00' OR end_time = '24:00:00';
