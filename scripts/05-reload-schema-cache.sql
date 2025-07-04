-- This command notifies the PostgREST service to reload its schema cache.
-- It's a safe operation and is often necessary after making schema changes like adding columns.
NOTIFY pgrst, 'reload schema';
