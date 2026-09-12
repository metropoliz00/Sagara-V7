/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Ambil konfigurasi database SAGARA yang tersimpan di browser/laptop
const savedUrl = typeof window !== 'undefined' ? (localStorage.getItem('CUSTOM_SUPABASE_URL') || localStorage.getItem('CENTRAL_SUPABASE_URL')) : null;
const savedKey = typeof window !== 'undefined' ? (localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY') || localStorage.getItem('CENTRAL_SUPABASE_ANON_KEY')) : null;

// Default credentials Database SAGARA
const DEFAULT_SUPABASE_URL = 'https://vivqbxddlsszgatspicf.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_q2inPGa_weLic6CD9OyhbQ_m9DZKxSP';

// URL & Key Database SAGARA Tunggal
const supabaseUrl = savedUrl || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = savedKey || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

export const defaultSupabaseUrl = supabaseUrl;
export const defaultSupabaseKey = supabaseAnonKey;

let activeSupabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

// masterSupabase dan supabase keduanya mengarah ke Database SAGARA yang sama
export const masterSupabase = new Proxy({}, {
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

export const getActiveSupabase = () => activeSupabase;

export const setTemporarySupabase = (url?: string, key?: string) => {
  if (url && key) {
    activeSupabase = createClient(url, key);
  } else {
    activeSupabase = (supabaseUrl && supabaseAnonKey)
      ? createClient(supabaseUrl, supabaseAnonKey)
      : null as any;
  }
};

// Fungsi untuk menyimpan konfigurasi baru Database SAGARA
export const saveDatabaseConfig = (url: string, key: string) => {
  localStorage.setItem('CUSTOM_SUPABASE_URL', url.trim());
  localStorage.setItem('CUSTOM_SUPABASE_ANON_KEY', key.trim());
  localStorage.setItem('CENTRAL_SUPABASE_URL', url.trim());
  localStorage.setItem('CENTRAL_SUPABASE_ANON_KEY', key.trim());
  window.location.reload();
};

// Fungsi untuk menyimpan konfigurasi database pusat (kompatibilitas)
export const saveCentralDatabaseConfig = (url: string, key: string) => {
  saveDatabaseConfig(url, key);
};

// Fungsi untuk mereset konfigurasi ke default Database SAGARA
export const resetDatabaseConfig = () => {
  localStorage.removeItem('CUSTOM_SUPABASE_URL');
  localStorage.removeItem('CUSTOM_SUPABASE_ANON_KEY');
  localStorage.removeItem('CENTRAL_SUPABASE_URL');
  localStorage.removeItem('CENTRAL_SUPABASE_ANON_KEY');
  window.location.reload();
};

