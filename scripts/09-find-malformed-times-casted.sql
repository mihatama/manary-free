-- This script finds any time values that do not conform to the 'HH:mm:ss' format.
-- It casts the time columns to TEXT to allow for regex comparison.
-- This is for diagnosis and will not change any data.

-- Check the 'availability_settings' table
SELECT
  id,
  start_time,
  end_time,
  'availability_settings' AS table_name
FROM
  public.availability_settings
WHERE
  -- Cast the time column to TEXT before applying the regex operator
  start_time IS NOT NULL AND start_time::TEXT !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$'
  OR
  end_time IS NOT NULL AND end_time::TEXT !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$';

-- Check the 'reservations' table
SELECT
  id,
  start_time,
  end_time,
  'reservations' AS table_name
FROM
  public.reservations
WHERE
  start_time IS NOT NULL AND start_time::TEXT !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$'
  OR
  end_time IS NOT NULL AND end_time::TEXT !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$';
