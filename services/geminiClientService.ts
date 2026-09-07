import { cleanAiText } from '../utils/textParser';

export interface VerifyResult {
  success: boolean;
  message: string;
  isRateLimit?: boolean;
  modelUsed?: string;
}

export interface GenerateResult {
  text: string;
  modelUsed?: string;
}

const VALID_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

export const getStoredGeminiApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const custom = localStorage.getItem('gemini_custom_api_key');
    if (custom && custom.trim().length > 0) return custom.trim();

    const schoolCached = localStorage.getItem('school_profile_cache');
    if (schoolCached) {
      const parsed = JSON.parse(schoolCached);
      if (parsed?.geminiApiKey && typeof parsed.geminiApiKey === 'string' && parsed.geminiApiKey.trim().length > 0) {
        return parsed.geminiApiKey.trim();
      }
    }
  } catch {}
  return '';
};

export const setStoredGeminiApiKey = (key: string): void => {
  if (typeof window === 'undefined') return;
  const trimmed = (key || '').trim();
  try {
    if (trimmed) {
      localStorage.setItem('gemini_custom_api_key', trimmed);
    } else {
      localStorage.removeItem('gemini_custom_api_key');
    }

    const schoolCached = localStorage.getItem('school_profile_cache');
    if (schoolCached) {
      const parsed = JSON.parse(schoolCached);
      parsed.geminiApiKey = trimmed;
      localStorage.setItem('school_profile_cache', JSON.stringify(parsed));
    }
  } catch {}
};

export const parseGoogleApiError = (error: any, status?: number): { message: string; isRateLimit: boolean } => {
  const raw = error?.message || (typeof error === 'string' ? error : JSON.stringify(error || ''));
  const isRate = status === 429 || /rate\s*exceeded|resource_exhausted|429|quota|too\s*many\s*requests/i.test(raw);

  if (isRate) {
    return {
      message: 'Batas frekuensi Google AI tercapai (429: Quota Exceeded). Akun gratis memiliki batas 15 request per menit. Mohon tunggu 10–20 detik lalu coba kembali.',
      isRateLimit: true,
    };
  }

  if (status === 400 || status === 401 || raw.includes('API_KEY_INVALID') || raw.includes('INVALID_ARGUMENT') || raw.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
    return {
      message: 'API Key Gemini tidak valid atau salah salin. Pastikan menyalin seluruh karakter API Key dari Google AI Studio (aistudio.google.com/apikey).',
      isRateLimit: false,
    };
  }

  if (status === 403 || raw.includes('PERMISSION_DENIED') || raw.includes('API_KEY_SERVICE_BLOCKED')) {
    return {
      message: 'Akses API ditolak (403 Forbidden). Pastikan "Generative Language API" aktif pada Google Cloud Console dan tidak dibatasi IP/domain.',
      isRateLimit: false,
    };
  }

  if (status === 503 || raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return {
      message: 'Server Google AI sedang mengalami beban trafik tinggi (503 High Demand). Silakan coba lagi dalam beberapa detik.',
      isRateLimit: false,
    };
  }

  return {
    message: raw || 'Terjadi kesalahan saat memproses permintaan AI.',
    isRateLimit: false,
  };
};

/**
 * Check if the server or deployment has GEMINI_API_KEY preconfigured
 */
export const checkAiStatus = async (): Promise<{ configured: boolean }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch('/api/ai/status', { signal: controller.signal });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      return { configured: !!data?.configured };
    }
  } catch {}
  return { configured: false };
};

/**
 * Direct call to Google Generative Language REST API.
 * Works seamlessly in client browser even when deployed as a static SPA on Vercel.
 */
async function callDirectGoogleGenAi(
  apiKey: string,
  prompt: string,
  timeoutMs = 15000
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;
  let lastStatus = 0;

  for (const model of VALID_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      const data = await response.json();

      if (!response.ok) {
        lastError = data?.error || new Error(`Google API Error ${response.status}`);
        // If authentication failed, do not loop over other models
        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw lastError;
        }
        continue;
      }

      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (candidateText) {
        return { text: candidateText, modelUsed: model };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      if (err?.name === 'AbortError') {
        throw new Error('Permintaan ke Google AI melampaui batas waktu (timeout). Periksa koneksi internet Anda.');
      }
      const raw = String(err?.message || err);
      if (raw.includes('API_KEY_INVALID') || lastStatus === 400 || lastStatus === 401 || lastStatus === 403) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Gagal mendapatkan respons dari Google AI.');
}

/**
 * Verify Gemini API Connection with dual-layer fallback (Backend/Serverless -> Direct REST API)
 * Guaranteed to never hang or spin endlessly on Vercel.
 */
export const verifyGeminiConnection = async (inputKey?: string): Promise<VerifyResult> => {
  const effectiveKey = (inputKey || getStoredGeminiApiKey()).trim();

  // 1. Try server backend endpoint first with a tight 4-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('/api/ai/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: effectiveKey || undefined }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    // If it's valid JSON from Express server or Vercel serverless function
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Koneksi Berhasil! Model Gemini aktif dan siap digunakan.',
          modelUsed: data.modelUsed,
        };
      } else {
        const parsed = parseGoogleApiError(data.error || 'Verifikasi gagal.', res.status);
        return {
          success: false,
          message: parsed.message,
          isRateLimit: data.isRateLimit ?? parsed.isRateLimit,
        };
      }
    }
  } catch {}

  // 2. If backend is not available (e.g. Vercel static hosting, rewrite to index.html, timeout):
  // Fall back to Direct Google Generative Language REST API
  if (!effectiveKey) {
    return {
      success: false,
      message: 'Masukkan Gemini API Key terlebih dahulu pada kolom input di bawah.',
    };
  }

  try {
    const { modelUsed } = await callDirectGoogleGenAi(effectiveKey, 'Tes koneksi. Jawab singkat: OK', 8000);
    return {
      success: true,
      message: `Koneksi Berhasil! Model Gemini (${modelUsed}) aktif dan siap digunakan.`,
      modelUsed,
    };
  } catch (err: any) {
    const parsed = parseGoogleApiError(err);
    return {
      success: false,
      message: parsed.message,
      isRateLimit: parsed.isRateLimit,
    };
  }
};

/**
 * Generate AI content with dual-layer fallback (Backend/Serverless -> Direct REST API)
 */
export const generateWithGemini = async (
  prompt: string,
  inputKey?: string
): Promise<GenerateResult> => {
  const effectiveKey = (inputKey || getStoredGeminiApiKey()).trim();

  // 1. Try backend serverless/Express route with 15s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        apiKey: effectiveKey || undefined,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (response.ok && data.text) {
        return {
          text: cleanAiText(data.text),
          modelUsed: data.modelUsed,
        };
      }
      if (!response.ok) {
        const parsed = parseGoogleApiError(data.error, response.status);
        throw new Error(parsed.message);
      }
    }
  } catch (backendErr: any) {
    clearTimeout(timeoutId);
    // If it was an explicit API error returned from server, rethrow unless it's a network/route missing failure
    if (backendErr?.message && !backendErr.message.includes('Failed to fetch') && !backendErr.message.includes('Unexpected token')) {
      if (backendErr.message.includes('API Key') || backendErr.message.includes('429')) {
        throw backendErr;
      }
    }
  }

  // 2. Fallback to direct client-side Google API
  if (!effectiveKey) {
    throw new Error('API Key Gemini belum dikonfigurasi. Silakan masukkan API Key di Pengaturan Profil Sekolah atau lampiran.');
  }

  const { text, modelUsed } = await callDirectGoogleGenAi(effectiveKey, prompt, 20000);
  return {
    text: cleanAiText(text),
    modelUsed,
  };
};
