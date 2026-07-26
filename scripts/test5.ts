import { createClient } from "@supabase/supabase-js";
const DEFAULT_URL = "https://mziqyqkmmmkccawzvojj.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aXF5cWttbW1rY2Nhd3p2b2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NDM3NiwiZXhwIjoyMDkzNzQwMzc2fQ.9BNcOFSbnV3_GaJFYIXTSqcFIpqrFjnvmPhWobpwKhQ";

const supabaseAdmin = createClient(DEFAULT_URL, DEFAULT_KEY);
async function run() {
  console.log("Creating admin@gugus3.com");
  const res = await supabaseAdmin.auth.admin.createUser({
    email: 'admin@gugus3.com',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: {
      username: 'admin',
    }
  });
  console.log('Result:', res.error?.message || 'Success');
}
run();
