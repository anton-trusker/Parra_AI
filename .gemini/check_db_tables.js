import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

const supabaseUrl = 'https://aysdomtvoxixusmmxfug.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5c2RvbXR2b3hpenVzbW14ZnVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NjI0MjUsImV4cCI6MjA4NjUzODQyNX0.CzINiqrsvv3vfbUf3k1UDDGJXSpZ8zAGZY3pxqhsBZg'

const supabase = createClient(supabaseUrl, supabaseKey)

// Query to get all tables from public schema
const { data, error } = await supabase.rpc('exec_sql', {
    query: `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `
})

if (error) {
    console.error('Error:', error)
} else {
    console.log('Tables in database:')
    console.log(JSON.stringify(data, null, 2))
}
