import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { throw new Error("No keys"); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const [{ data: schoolsData, error: sErr }, { count: teacherCount, error: tErr }] = await Promise.all([
    supabase.from('schools').select('student_count, teacher_count, jenis_sekolah'),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'guru')
  ]);
  console.log("schools:", schoolsData, "err:", sErr);
  console.log("teacherCount:", teacherCount, "err:", tErr);
}
run();
