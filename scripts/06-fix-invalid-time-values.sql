-- File: scripts/06-fix-invalid-time-values.sql
-- Purpose: Find and correct invalid time values (e.g., '24:00:00') in the database
-- that are causing client-side RangeError.

-- Step 1: Identify the problematic rows in availability_settings before changing them.
-- This helps confirm what we are about to fix.
SELECT
    id,
    service_type_id,
    day_of_week,
    specific_date,
    start_time,
    end_time,
    is_available
FROM
    public.availability_settings
WHERE
    start_time = '24:00:00' OR end_time = '24:00:00';

-- Step 2: Update the invalid '24:00:00' time to a valid '23:59:59'.
-- This is a safe correction that preserves the "end of day" intent.
UPDATE public.availability_settings
SET
    start_time = '23:59:59'
WHERE
    start_time = '24:00:00';

UPDATE public.availability_settings
SET
    end_time = '23:59:59'
WHERE
    end_time = '24:00:00';

-- Step 3: Verify that the problematic rows have been fixed.
-- This query should now return no results.
SELECT
    id,
    start_time,
    end_time
FROM
    public.availability_settings
WHERE
    start_time = '24:00:00' OR end_time = '24:00:00';
