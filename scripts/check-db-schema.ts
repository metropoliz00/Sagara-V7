
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function checkSchema() {
  const DEFAULT_URL = "https://mziqyqkmmmkccawzvojj.supabase.co";
  const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aXF5cWttbW1rY2Nhd3p2b2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NDM3NiwiZXhwIjoyMDkzNzQwMzc2fQ.9BNcOFSbnV3_GaJFYIXTSqcFIpqrFjnvmPhWobpwKhQ";

  const url = process.env.VITE_SUPABASE_URL || DEFAULT_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_KEY;

  const supabase = createClient(url, key);

  console.log("Checking columns for user_profiles...");
  const { data: profileCheck, error: pError } = await supabase.from('user_profiles').select('*').limit(1);
  if (profileCheck) {
      console.log("Columns found:", Object.keys(profileCheck[0] || {}));
  }

  console.log("\nChecking for admin RPCs...");
  const rpcs = ['execute_sql', 'run_sql', 'admin_run_sql', 'exec_sql', 'query'];
  for (const rpc of rpcs) {
    const { data, error } = await supabase.rpc(rpc, { sql: 'SELECT 1' });
    if (!error) {
        console.log(`✅ Found working RPC: ${rpc}`);
    } else {
        if (error.code !== 'PGRST202') {
            console.log(`❓ RPC ${rpc} exists but failed:`, error.message);
        }
    }
  }

  console.log("\nChecking for triggers on auth.users...");
  // This is hard to do via REST without a specialized RPC.
}

checkSchema();
