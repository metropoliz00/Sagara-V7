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
  console.log("Checking and updating user_profiles table...");
  
  // We'll try to rename avatar_url to foto if it exists and foto doesn't
  const { error: renameError } = await supabase.rpc('execute_sql', {
    sql: `
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='avatar_url') 
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='foto') THEN
          ALTER TABLE public.user_profiles RENAME COLUMN avatar_url TO foto;
        ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='foto') THEN
          ALTER TABLE public.user_profiles ADD COLUMN foto TEXT;
        END IF;
      END $$;
    `
  });

  if (renameError) {
     console.error("RPC failed, attempting direct query via rest if possible (though unlikely to work for DDL)...");
     console.log(renameError);
  } else {
    console.log("Successfully updated schema.");
  }
}

run();
