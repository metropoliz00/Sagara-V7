import { createClient } from "@supabase/supabase-js";
const DEFAULT_URL = "https://mziqyqkmmmkccawzvojj.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aXF5cWttbW1rY2Nhd3p2b2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NDM3NiwiZXhwIjoyMDkzNzQwMzc2fQ.9BNcOFSbnV3_GaJFYIXTSqcFIpqrFjnvmPhWobpwKhQ";

const supabaseAdmin = createClient(DEFAULT_URL, DEFAULT_KEY);

async function run() {
  console.log("Starting to fix users...");
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const authUsers: any[] = usersData?.users || [];
  console.log('Auth users count:', authUsers.length);
  
  const { data: profiles } = await supabaseAdmin.from('user_profiles').select('*');
  console.log('User profiles count:', profiles?.length);

  for (const profile of profiles || []) {
    const isAuthFound = authUsers.find(u => u.id === profile.id);
    if (!isAuthFound) {
      console.log(`Profile ${profile.username} (id: ${profile.id}) not found in Auth. Deleting profile to prevent conflicts.`);
      await supabaseAdmin.from('user_profiles').delete().eq('id', profile.id);
    }
  }

  // Ensure admin is created
  console.log("Re-creating root admin");
  const adminEmail = "admin@gugus3.com";
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: "Admin123!",
    email_confirm: true,
    user_metadata: {
      username: "admin",
      nama: "Administrator",
      role: "admin",
      password_text: "Admin123!"
    }
  });

  if (error) {
    if (error.message.includes("already registered")) {
       console.log("Admin email already registered, updating password to Admin123!");
       const existingUser = authUsers.find(u => u.email === adminEmail);
       if (existingUser) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: "Admin123!" });
          await supabaseAdmin.from('user_profiles').update({ password_text: "Admin123!", username: "admin" }).eq('id', existingUser.id);
       }
    } else {
       console.error("Failed to re-create admin:", error.message);
    }
  } else {
    // Check if trigger fired
    await new Promise(r => setTimeout(r, 1000));
    const { data: p } = await supabaseAdmin.from('user_profiles').select('username').eq('id', data.user.id).single();
    if (!p) {
       console.log("Trigger didn't fire, manually inserting...");
       await supabaseAdmin.from('user_profiles').insert([{
         id: data.user.id,
         username: "admin",
         email: adminEmail,
         role: "admin",
         nama: "Administrator",
         password_text: "Admin123!"
       }]);
    } else if (p.username !== "admin") {
       await supabaseAdmin.from('user_profiles').update({ username: "admin" }).eq('id', data.user.id);
    }
    console.log("Root admin created. Credentials: [admin / Admin123!]");
  }
}
run();
