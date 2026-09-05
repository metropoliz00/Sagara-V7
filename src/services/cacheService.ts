// src/services/cacheService.ts

export const CACHE_DURATIONS = {
  ONE_HOUR: 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  TWELVE_HOURS: 12 * 60 * 60 * 1000,
  TWENTY_FOUR_HOURS: 24 * 60 * 60 * 1000, // 24 jam (standar interval data master)
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
} as const;

// Default TTL untuk data master (seperti siswa dan pengguna): 24 jam
export const DEFAULT_MASTER_DATA_TTL = CACHE_DURATIONS.TWENTY_FOUR_HOURS;
export const DEFAULT_TTL = CACHE_DURATIONS.TWENTY_FOUR_HOURS;

// Daftar key yang tergolong data master yang diperbarui berkala
export const MASTER_DATA_KEYS: readonly string[] = [
  'students',
  'users',
  'gtkData',
  'gtk_data',
  'extracurriculars',
  'holidays',
  'schoolAssets',
  'inventory',
  'employmentLinks'
] as const;

export interface CachePayload<T> {
  value: T;
  cachedAt: number;
  expiry: number;
  ttl: number;
  version?: number;
}

export const getTtlForKey = (key: string, customTtl?: number): number => {
  if (typeof customTtl === 'number' && customTtl > 0) {
    return customTtl;
  }
  if (MASTER_DATA_KEYS.includes(key)) {
    return DEFAULT_MASTER_DATA_TTL;
  }
  return DEFAULT_TTL;
};

export const cacheService = {
  /**
   * Mengambil data dari cache. Jika data sudah kadaluwarsa (> 24 jam untuk master data),
   * otomatis menghapus data dari cache dan mengembalikan null agar data segar di-fetch ulang.
   */
  get<T>(key: string, returnStaleIfExpired = false): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;

      const cachedData = JSON.parse(item);
      if (!cachedData || typeof cachedData !== 'object') {
        localStorage.removeItem(key);
        return null;
      }

      const now = Date.now();
      const defaultTtlForKey = getTtlForKey(key);

      // Cek apakah data sudah kadaluwarsa berdasarkan expiry atau umur cachedAt
      const hasExpiredByExpiry = cachedData.expiry ? now > cachedData.expiry : false;
      const hasExpiredByAge = cachedData.cachedAt ? (now - cachedData.cachedAt > (cachedData.ttl || defaultTtlForKey)) : false;
      const isExpired = hasExpiredByExpiry || hasExpiredByAge;

      if (isExpired) {
        if (returnStaleIfExpired) {
          return (cachedData.value !== undefined) ? cachedData.value : cachedData;
        }
        localStorage.removeItem(key);
        return null;
      }

      return (cachedData.value !== undefined) ? cachedData.value : cachedData;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage`, error);
      return null;
    }
  },

  /**
   * Menyimpan data ke cache dengan metadata umur (cachedAt) dan waktu kadaluwarsa (expiry).
   * Default TTL untuk data master adalah 24 jam.
   */
  set<T>(key: string, value: T, customTtl?: number): boolean {
    try {
      // Lewati caching 'materials' untuk mencegah QuotaExceededError
      if (key === 'materials') return true;

      const effectiveTtl = getTtlForKey(key, customTtl);
      const now = Date.now();
      const item: CachePayload<T> = {
        value,
        cachedAt: now,
        expiry: now + effectiveTtl,
        ttl: effectiveTtl,
        version: 1
      };

      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error: any) {
      console.warn(`Error setting item ${key} in localStorage, attempting cleanup...`, error);
      try {
        cacheService.cleanExpired();
        const effectiveTtl = getTtlForKey(key, customTtl);
        const now = Date.now();
        localStorage.setItem(key, JSON.stringify({
          value,
          cachedAt: now,
          expiry: now + effectiveTtl,
          ttl: effectiveTtl,
          version: 1
        }));
        return true;
      } catch (retryError) {
        return false;
      }
    }
  },

  /**
   * Mengecek apakah suatu key dalam cache telah kadaluwarsa atau belum ada.
   */
  isExpired(key: string): boolean {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return true;

      const cachedData = JSON.parse(item);
      if (!cachedData || typeof cachedData !== 'object') return true;

      const now = Date.now();
      const defaultTtlForKey = getTtlForKey(key);

      if (cachedData.expiry && now > cachedData.expiry) return true;
      if (cachedData.cachedAt && (now - cachedData.cachedAt > (cachedData.ttl || defaultTtlForKey))) return true;

      return false;
    } catch (e) {
      return true;
    }
  },

  /**
   * Mendapatkan sisa waktu kadaluwarsa (dalam milidetik).
   */
  getRemainingTtl(key: string): number {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return 0;

      const cachedData = JSON.parse(item);
      if (!cachedData || typeof cachedData !== 'object') return 0;

      const now = Date.now();
      if (cachedData.expiry) {
        return Math.max(0, cachedData.expiry - now);
      }
      return 0;
    } catch (e) {
      return 0;
    }
  },

  /**
   * Mendapatkan timestamp saat data disimpan.
   */
  getCachedAt(key: string): number | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      return parsed.cachedAt || null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Membaca data tanpa menghapusnya meskipun sudah kadaluwarsa (untuk fallback offline darurat).
   */
  peek<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      const cachedData = JSON.parse(item);
      return (cachedData && cachedData.value !== undefined) ? cachedData.value : cachedData;
    } catch (error) {
      return null;
    }
  },

  /**
   * Memperpanjang masa aktif cache yang masih ada.
   */
  touch(key: string, customTtl?: number): boolean {
    try {
      const item = localStorage.getItem(key);
      if (!item) return false;
      const parsed = JSON.parse(item);
      if (!parsed || parsed.value === undefined) return false;
      return this.set(key, parsed.value, customTtl);
    } catch (e) {
      return false;
    }
  },

  /**
   * Menghapus key spesifik dari cache.
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage`, error);
    }
  },

  /**
   * Alias untuk remove.
   */
  invalidate(key: string): void {
    this.remove(key);
  },

  /**
   * Menghapus seluruh data master agar dipaksa refresh pada pemanggilan berikutnya.
   */
  invalidateMasterData(): void {
    MASTER_DATA_KEYS.forEach(k => {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    });
  },

  /**
   * Membersihkan entri-entri yang sudah kadaluwarsa di seluruh localStorage untuk membebaskan kuota.
   */
  cleanExpired(): number {
    let cleaned = 0;
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      const protectedKeys = [
        'sagara_user',
        'sagara_classId',
        'CUSTOM_SUPABASE_URL',
        'CUSTOM_SUPABASE_ANON_KEY',
        'CENTRAL_SUPABASE_URL',
        'CENTRAL_SUPABASE_ANON_KEY',
        'school_profile_cache'
      ];

      keys.forEach(k => {
        if (protectedKeys.includes(k)) return;
        try {
          const item = localStorage.getItem(k);
          if (!item) return;
          const parsed = JSON.parse(item);
          if (parsed && typeof parsed === 'object') {
            const hasExpired = (parsed.expiry && now > parsed.expiry) ||
              (parsed.cachedAt && parsed.ttl && (now - parsed.cachedAt > parsed.ttl));
            if (hasExpired) {
              localStorage.removeItem(k);
              cleaned++;
            }
          }
        } catch (e) {
          // Bukan format cache JSON kita, lewati
        }
      });
    } catch (error) {
      console.error('Error cleaning expired cache', error);
    }
    return cleaned;
  },

  /**
   * Membersihkan semua cache data aplikasi dengan tetap mempertahankan session pengguna dan konfigurasi database.
   */
  clear(): void {
    try {
      const keysToKeep = [
        'sagara_user',
        'sagara_classId',
        'CUSTOM_SUPABASE_URL',
        'CUSTOM_SUPABASE_ANON_KEY',
        'CENTRAL_SUPABASE_URL',
        'CENTRAL_SUPABASE_ANON_KEY',
        'school_profile_cache'
      ];
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cacheService', error);
    }
  }
};

