/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Ambil konfigurasi database sekolah yang disimpan di laptop
const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_SUPABASE_URL') : null;
const savedKey = typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') : null;

const centralSavedUrl = typeof window !== 'undefined' ? localStorage.getItem('CENTRAL_SUPABASE_URL') : null;
const centralSavedKey = typeof window !== 'undefined' ? localStorage.getItem('CENTRAL_SUPABASE_ANON_KEY') : null;

// Fallback default credentials from environment template
const DEFAULT_SUPABASE_URL = 'https://vivqbxddlsszgatspicf.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_q2inPGa_weLic6CD9OyhbQ_m9DZKxSP';

// Jika sudah diatur oleh sekolah, gunakan milik mereka. Jika belum, gunakan default Anda.
const supabaseUrl = savedUrl || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = savedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

const masterUrl = centralSavedUrl || import.meta.env.VITE_SUPABASE_URL || supabaseUrl || DEFAULT_SUPABASE_URL;
const masterKey = centralSavedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey || DEFAULT_SUPABASE_KEY;

let activeSupabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export const masterSupabase = (masterUrl && masterKey)
  ? createClient(masterUrl, masterKey)
  : activeSupabase;

export const defaultSupabaseUrl = masterUrl;
export const defaultSupabaseKey = masterKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. App may not function correctly without database configuration.');
}

export const setTemporarySupabase = (url?: string, key?: string) => {
  if (url && key) {
    activeSupabase = createClient(url, key);
  } else {
    // Reset back to normal saved or default
    activeSupabase = (supabaseUrl && supabaseAnonKey)
      ? createClient(supabaseUrl, supabaseAnonKey)
      : null as any;
  }
};

export const getActiveSupabase = () => activeSupabase;

export const supabase = new Proxy({}, {
  get: (target, prop) => {
    if (!activeSupabase) {
      console.warn('No active Supabase client initialized.');
      return undefined;
    }
    const val = activeSupabase[prop];
    if (typeof val === 'function') {
      return val.bind(activeSupabase);
    }
    return val;
  }
}) as any;

// Fungsi untuk menyimpan konfigurasi baru saat aktivasi awal
export const saveDatabaseConfig = (url: string, key: string) => {
  localStorage.setItem('CUSTOM_SUPABASE_URL', url.trim());
  localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', key.trim());
  window.location.reload(); // Reload aplikasi agar database baru aktif
};

// Fungsi untuk menyimpan konfigurasi database pusat
export const saveCentralDatabaseConfig = (url: string, key: string) => {
  localStorage.setItem('CENTRAL_SUPABASE_URL', url.trim());
  localStorage.setItem('CENTRAL_SUPABASE_ANON_KEY', key.trim());
  window.location.reload();
};

// Fungsi untuk menghapus konfigurasi jika ingin ganti database
export const resetDatabaseConfig = () => {
  localStorage.removeItem('CUSTOM_SUPABASE_URL');
  localStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
  localStorage.removeItem('CENTRAL_SUPABASE_URL');
  localStorage.removeItem('CENTRAL_SUPABASE_ANON_KEY');
  window.location.reload();
};
