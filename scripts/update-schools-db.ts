import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Adding image_url column to schools table...");
  const { error } = await supabase.rpc('execute_sql', {
    sql: 'ALTER TABLE public.schools ADD COLUMN IF NOT EXISTS image_url TEXT;'
  });

  if (error) {
    // If rpc fails, we can't easily run SQL unless we have a custom function
    console.error("Error adding column (RPC might not be enabled):", error);
    console.log("Attempting direct query if possible...");
    // Supabase JS doesn't support raw SQL easily unless you have an RPC function
  } else {
    console.log("Successfully added column.");
  }
}

run();
