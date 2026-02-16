#!/bin/bash

# Connect to Supabase and dump the public schema
# This script uses pg_dump to export the schema from Supabase

echo "Fetching database URL from Supabase dashboard..."
echo ""
echo "To get your database connection string:"
echo "1. Go to https://supabase.com/dashboard/project/aysdomtvoxizusmmxfug/settings/database"
echo "2. Copy the 'Connection string' under 'Connection pooling'"
echo "3. Replace [YOUR-PASSWORD] with your actual database password"
echo ""
echo "Then run:"
echo "pg_dump -h db.aysdomtvoxizusmmxfug.supabase.co -U postgres -d postgres -n public --schema-only -f supabase/migrations/20260216155800_baseline_schema.sql"
echo ""
echo "Or if you have the full connection string:"
echo "pg_dump 'postgresql://postgres:[PASSWORD]@db.aysdomtvoxizusmmxfug.supabase.co:5432/postgres' -n public --schema-only -f supabase/migrations/20260216155800_baseline_schema.sql"
