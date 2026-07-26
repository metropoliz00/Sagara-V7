
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const DEFAULT_URL = "https://mziqyqkmmmkccawzvojj.supabase.co";
const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aXF5cWttbW1rY2Nhd3p2b2pqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE2NDM3NiwiZXhwIjoyMDkzNzQwMzc2fQ.9BNcOFSbnV3_GaJFYIXTSqcFIpqrFjnvmPhWobpwKhQ";

const url = process.env.VITE_SUPABASE_URL || DEFAULT_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_KEY;

const supabase = createClient(url, key);

async function applyFix() {
  console.log("Applying Final Database Fix...");

  const sql = `
    -- 1. Table Schema Cleanup
    DO $$ 
    BEGIN 
      -- Rename avatar_url to foto if needed
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='avatar_url') 
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='foto') THEN
        ALTER TABLE public.user_profiles RENAME COLUMN avatar_url TO foto;
      ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='foto') THEN
        ALTER TABLE public.user_profiles ADD COLUMN foto TEXT;
      END IF;

      -- Ensure other columns exist
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='nip') THEN
        ALTER TABLE public.user_profiles ADD COLUMN nip VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='kepegawaian') THEN
        ALTER TABLE public.user_profiles ADD COLUMN kepegawaian VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='pangkat') THEN
        ALTER TABLE public.user_profiles ADD COLUMN pangkat VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='jabatan') THEN
        ALTER TABLE public.user_profiles ADD COLUMN jabatan VARCHAR(255);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='sekolah') THEN
        ALTER TABLE public.user_profiles ADD COLUMN sekolah VARCHAR(255);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='password_text') THEN
        ALTER TABLE public.user_profiles ADD COLUMN password_text VARCHAR(255);
      END IF;
    END $$;

    -- 2. Improved Trigger Function
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    DECLARE
      default_username TEXT;
      target_role TEXT;
      final_username TEXT;
      counter INTEGER := 0;
    BEGIN
      -- Generate initial username
      default_username := LEFT(COALESCE(NULLIF(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1)), 50);
      final_username := default_username;

      -- Resolve username conflict (EXTREMELY IMPORTANT)
      WHILE EXISTS (SELECT 1 FROM public.user_profiles WHERE username = final_username AND id != new.id) LOOP
        counter := counter + 1;
        final_username := LEFT(default_username, 40) || '_' || counter || '_' || SUBSTRING(new.id::text, 1, 4);
      END LOOP;

      -- Determine role
      IF (new.raw_user_meta_data->>'role' = 'admin') THEN
        target_role := 'admin';
      ELSE
        target_role := 'guru';
      END IF;

      -- Safe Insert
      INSERT INTO public.user_profiles (
        id, username, email, role, nama, foto,
        nip, kepegawaian, pangkat, jabatan, sekolah, password_text, created_at
      )
      VALUES (
        new.id, 
        final_username,
        new.email,
        target_role::public.user_role,
        COALESCE(new.raw_user_meta_data->>'nama', new.raw_user_meta_data->>'full_name', final_username),
        COALESCE(new.raw_user_meta_data->>'foto', new.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(new.raw_user_meta_data->>'nip', ''),
        COALESCE(new.raw_user_meta_data->>'kepegawaian', ''),
        COALESCE(new.raw_user_meta_data->>'pangkat', ''),
        COALESCE(new.raw_user_meta_data->>'jabatan', ''),
        COALESCE(new.raw_user_meta_data->>'sekolah', ''),
        new.raw_user_meta_data->>'password_text',
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        nama = EXCLUDED.nama,
        role = EXCLUDED.role,
        nip = EXCLUDED.nip,
        kepegawaian = EXCLUDED.kepegawaian,
        pangkat = EXCLUDED.pangkat,
        jabatan = EXCLUDED.jabatan,
        sekolah = EXCLUDED.sekolah,
        foto = EXCLUDED.foto,
        password_text = COALESCE(EXCLUDED.password_text, public.user_profiles.password_text);

      RETURN new;
    EXCEPTION
      WHEN OTHERS THEN
        -- Fallback to the absolute minimum to avoid blocking Auth
        BEGIN
          INSERT INTO public.user_profiles (id, username, email, role)
          VALUES (new.id, 'user_' || SUBSTRING(new.id::text, 1, 8), new.email, 'guru'::public.user_role)
          ON CONFLICT (id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
          -- Last resort: do nothing
        END;
        RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  const { error } = await supabase.rpc('execute_sql', { sql });

  if (error) {
    console.error("Failed to apply fix via RPC 'execute_sql':", error);
    
    // Try workaround: The error might be because we're using a reserved word or something.
    // Or maybe we should try 'run_sql'
    const { error: error2 } = await supabase.rpc('run_sql', { sql });
    if (error2) {
       console.error("Failed to apply fix via RPC 'run_sql':", error2);
       console.log("\nTIP: Silakan jalankan SQL FIX secara manual di SQL Editor Supabase.");
    } else {
       console.log("Successfully fixed schema via 'run_sql'.");
    }
  } else {
    console.log("Successfully fixed schema via 'execute_sql'.");
  }
}

applyFix();
