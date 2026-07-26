import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = "https://mziqyqkmmmkccawzvojj.supabase.co";
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16aXF5cWttbW1rY2Nhd3p2b2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjQzNzYsImV4cCI6MjA5Mzc0MDM3Nn0.tdgWNb7oc6-oMxvIel0yLvQSzujZDoGY6-n4tHY4gno";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isValidUrl = (url: string | undefined) => {
  if (!url || url === 'YOUR_SUPABASE_URL' || url === '' || (url && url.startsWith('eyJ'))) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidKey = (key: string | undefined) => {
  return key && key !== 'YOUR_SUPABASE_ANON_KEY' && key !== '' && key.length > 50;
};

const supabaseUrl = isValidUrl(rawUrl) ? rawUrl! : DEFAULT_URL;
const supabaseAnonKey = isValidKey(rawAnonKey) ? rawAnonKey! : DEFAULT_ANON_KEY;

export const supabase: SupabaseClient | null = createClient(supabaseUrl, supabaseAnonKey);


if (!supabase) {
  if (supabaseUrl && supabaseUrl.startsWith('eyJ')) {
    console.error("KRITIKAL: VITE_SUPABASE_URL terdeteksi sebagai Token/Key (JWT), bukan URL. Harap periksa Secrets panel.");
  } else {
    console.warn("Supabase client not initialized. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly in the Secrets panel.");
  }
}
