-- File: scripts/04-inspect-availability-data.sql (Corrected Version)
-- Purpose: Inspect the availability_settings table for potentially invalid data that could cause date/time parsing errors.
--
-- This script will help identify common data issues. Please review the results and correct any invalid entries in your Supabase dashboard.
-- Correction: Added explicit type casting (::text) to time/date columns before applying regex operators to fix the "operator does not exist" error.

-- Selecting all columns for context
SELECT
    id,
    service_type_id,
    day_of_week,
    specific_date,
    start_time,
    end_time,
    is_available,
    created_at,
    end_date,
    -- Adding a 'notes' column to explain why a row might be problematic
    CASE
        WHEN start_time IS NULL OR end_time IS NULL THEN 'start_time or end_time is NULL.'
        WHEN start_time::text !~ '^\d{2}:\d{2}(:\d{2})?$' THEN 'start_time format is invalid. Expected HH:MM or HH:MM:SS.'
        WHEN end_time::text !~ '^\d{2}:\d{2}(:\d{2})?$' THEN 'end_time format is invalid. Expected HH:MM or HH:MM:SS.'
        WHEN specific_date IS NOT NULL AND specific_date::text !~ '^\d{4}-\d{2}-\d{2}$' THEN 'specific_date format is invalid. Expected YYYY-MM-DD.'
        WHEN end_date IS NOT NULL AND end_date::text !~ '^\d{4}-\d{2}-\d{2}$' THEN 'end_date format is invalid. Expected YYYY-MM-DD.'
        WHEN start_time >= end_time THEN 'start_time is after or the same as end_time.'
        ELSE 'OK'
    END AS data_check_notes
FROM
    public.availability_settings
WHERE
    -- Filter for rows that have potential issues
    start_time IS NULL
    OR end_time IS NULL
    OR start_time::text !~ '^\d{2}:\d{2}(:\d{2})?$'
    OR end_time::text !~ '^\d{2}:\d{2}(:\d{2})?$'
    OR (specific_date IS NOT NULL AND specific_date::text !~ '^\d{4}-\d{2}-\d{2}$')
    OR (end_date IS NOT NULL AND end_date::text !~ '^\d{4}-\d{2}-\d{2}$')
    OR start_time >= end_time
ORDER BY
    id;

-- If the query above returns no rows, it means the basic format checks passed.
-- However, there could still be invalid values like '99:99:99'.
-- The following query checks for times that are technically correctly formatted but have impossible values.
SELECT
    id,
    start_time,
    end_time,
    'Invalid time value (e.g., hour > 23 or minute > 59)' as data_check_notes
FROM
    public.availability_settings
WHERE
    (start_time::text ~ '^\d{2}:\d{2}(:\d{2})?$' AND (
        SUBSTRING(start_time::text, 1, 2)::int > 23 OR
        SUBSTRING(start_time::text, 4, 2)::int > 59
    ))
    OR
    (end_time::text ~ '^\d{2}:\d{2}(:\d{2})?$' AND (
        SUBSTRING(end_time::text, 1, 2)::int > 23 OR
        SUBSTRING(end_time::text, 4, 2)::int > 59
    ));
