// src/services/cacheService.ts

export const cacheService = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return null;

      const cachedData = JSON.parse(item);
      // Basic check for expiration, can be made more robust
      if (cachedData.expiry && new Date().getTime() > cachedData.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return cachedData.value;

    } catch (error) {
      console.error(`Error getting item ${key} from localStorage`, error);
      return null;
    }
  },

  set<T>(key: string, value: T, ttl: number = 24 * 60 * 60 * 1000): boolean { // Default TTL: 24 hours
    try {
      // Skip caching materials to avoid QuotaExceededError
      if (key === 'materials') return true;

      const expiry = new Date().getTime() + ttl;
      const item = {
        value,
        expiry,
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error: any) {
      console.error(`Error setting item ${key} in localStorage`, error);
      if (error && (error.name === 'QuotaExceededError' || error.message?.includes('exceeded the quota'))) {
         alert(`Penyimpanan lokal browser penuh (Quota Exceeded).\nData tidak dapat disimpan. Harap hapus beberapa file dokumen/gambar, atau bersihkan cache browser Anda.`);
      }
      return false;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage`, error);
    }
  },

  clear(): void {
    try {
      const keysToKeep = ['sagara_user', 'CUSTOM_SUPABASE_URL', 'CUSTOM_SUPABASE_ANON_KEY'];
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
