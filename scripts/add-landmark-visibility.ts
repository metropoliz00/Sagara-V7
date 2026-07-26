import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_URL = "https://mziqyqkmmmkccawzvojj.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aXF5cWttbW1rY2Nhd3p2b2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NDM3NiwiZXhwIjoyMDkzNzQwMzc2fQ.9BNcOFSbnV3_GaJFYIXTSqcFIpqrFjnvmPhWobpwKhQ";

const url = process.env.VITE_SUPABASE_URL || DEFAULT_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_KEY;

const supabase = createClient(url, key);

async function run() {
  console.log("Checking and adding is_visible to public.landmarks table...");
  
  const sql = `
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema='public' 
          AND table_name='landmarks' 
          AND column_name='is_visible'
      ) THEN
        ALTER TABLE public.landmarks ADD COLUMN is_visible BOOLEAN DEFAULT TRUE;
      END IF;
    END $$;
  `;

  // Try both rpcs
  const { error } = await supabase.rpc('execute_sql', { sql });
  if (error) {
    console.warn("execute_sql failed, trying run_sql...", error);
    const { error: error2 } = await supabase.rpc('run_sql', { sql });
    if (error2) {
      console.error("run_sql also failed:", error2);
    } else {
      console.log("Added column via run_sql successfully!");
    }
  } else {
    console.log("Added column via execute_sql successfully!");
  }
}

run();
