/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Ambil konfigurasi database sekolah yang disimpan di laptop
const savedUrl = localStorage.getItem('CUSTOM_SUPABASE_URL');
const savedKey = localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY');

// Jika sudah diatur oleh sekolah, gunakan milik mereka. Jika belum, gunakan default Anda.
const supabaseUrl = savedUrl || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = savedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const masterUrl = import.meta.env.VITE_SUPABASE_URL || '';
const masterKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const masterSupabase = (masterUrl && masterKey)
  ? createClient(masterUrl, masterKey)
  : null as any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. App may not function correctly without database configuration.');
}

let activeSupabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

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

// Fungsi untuk menghapus konfigurasi jika ingin ganti database
export const resetDatabaseConfig = () => {
  localStorage.removeItem('CUSTOM_SUPABASE_URL');
  localStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
  window.location.reload();
};
