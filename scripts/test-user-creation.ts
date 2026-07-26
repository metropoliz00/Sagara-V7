
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_URL = "https://mziqyqkmmmkccawzvojj.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aXF5cWttbW1rY2Nhd3p2b2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NDM3NiwiZXhwIjoyMDkzNzQwMzc2fQ.9BNcOFSbnV3_GaJFYIXTSqcFIpqrFjnvmPhWobpwKhQ";

const url = process.env.VITE_SUPABASE_URL || DEFAULT_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_KEY;

const supabase = createClient(url, key);

async function testCreate() {
  console.log("Testing minimal user creation...");
  const timestamp = Date.now();
  const { data, error } = await supabase.auth.admin.createUser({
    email: `test_${timestamp}@example.com`,
    password: "Password123!",
    email_confirm: true,
    user_metadata: {
        username: `testuser_${timestamp}`
    }
  });

  if (error) {
    console.error("❌ Minimal creation FAILED:", error.message);
  } else {
    console.log("✅ Minimal creation SUCCESS!");
    // Clean up
    await supabase.auth.admin.deleteUser(data.user.id);
  }

  console.log("\nTesting with 'nama' and 'role'...");
  const { data: data2, error: error2 } = await supabase.auth.admin.createUser({
    email: `test2_${timestamp}@example.com`,
    password: "Password123!",
    email_confirm: true,
    user_metadata: {
        username: `testuser2_${timestamp}`,
        nama: "Test User",
        role: "guru"
    }
  });

  if (error2) {
    console.error("❌ Creation with metadata FAILED:", error2.message);
  } else {
    console.log("✅ Creation with metadata SUCCESS!");
    await supabase.auth.admin.deleteUser(data2.user.id);
  }
}

testCreate();
