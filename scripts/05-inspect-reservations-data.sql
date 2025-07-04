-- File: scripts/05-inspect-reservations-data.sql
-- Purpose: Inspect the reservations table for potentially invalid date/time data.
-- This is the next step after confirming availability_settings is clean.

SELECT
    id,
    reservation_date,
    start_time,
    status,
    patient_name,
    -- Add a 'notes' column to explain why a row might be problematic
    CASE
        WHEN reservation_date IS NULL THEN 'reservation_date is NULL.'
        WHEN start_time IS NULL THEN 'start_time is NULL.'
        WHEN reservation_date::text !~ '^\d{4}-\d{2}-\d{2}$' THEN 'reservation_date format is invalid. Expected YYYY-MM-DD.'
        WHEN start_time::text !~ '^\d{2}:\d{2}(:\d{2})?$' THEN 'start_time format is invalid. Expected HH:MM or HH:MM:SS.'
        ELSE 'OK'
    END AS data_check_notes
FROM
    public.reservations
WHERE
    -- Filter for rows that have potential issues, focusing on those used for slot calculation
    status IN ('confirmed', 'pending') AND (
        reservation_date IS NULL
        OR start_time IS NULL
        OR reservation_date::text !~ '^\d{4}-\d{2}-\d{2}$'
        OR start_time::text !~ '^\d{2}:\d{2}(:\d{2})?$'
    )
ORDER BY
    id;

-- Also check for impossible time values in the reservations table
SELECT
    id,
    reservation_date,
    start_time,
    'Invalid time value (e.g., hour > 23 or minute > 59)' as data_check_notes
FROM
    public.reservations
WHERE
    status IN ('confirmed', 'pending') AND (
        start_time::text ~ '^\d{2}:\d{2}(:\d{2})?$' AND (
            SUBSTRING(start_time::text, 1, 2)::int > 23 OR
            SUBSTRING(start_time::text, 4, 2)::int > 59
        )
    );
