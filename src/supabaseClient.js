import { createClient } from '@supabase/supabase-js'

// 1. Go to Supabase Dashboard -> Settings (Gear icon) -> API
// 2. Copy "Project URL" and paste it below
const supabaseUrl = 'https://hqbyqzqdphqgjrtphfeg.supabase.co'

// 3. Copy "anon" / "public" key and paste it below
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxYnlxenFkcGhxZ2pydHBoZmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NzI2MTksImV4cCI6MjA4MjU0ODYxOX0.o2ej0xpJyDrAyBoP1fHvJr2VYkssO9xBDw7C-fzMb3E'

export const supabase = createClient(supabaseUrl, supabaseKey)