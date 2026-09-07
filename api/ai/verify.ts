import { GoogleGenAI } from "@google/genai";

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

export default async function handler(req: any, res: any) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const { apiKey } = req.body || {};
  const effectiveKey = (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0)
    ? apiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    res.status(400).json({
      success: false,
      error: 'API Key Gemini belum diisi. Masukkan API Key dari Google AI Studio.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    let successModel = '';
    let lastError: any = null;

    for (const model of FALLBACK_MODELS) {
      try {
        const result = await ai.models.generateContent({
          model,
          contents: 'Ping test. Jawab: OK',
        });
        if (result.text) {
          successModel = model;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err);
        if (msg.includes('API_KEY_INVALID') || msg.includes('401') || msg.includes('403')) {
          throw err;
        }
      }
    }

    if (!successModel) {
      throw lastError || new Error('Gagal terhubung ke model Gemini.');
    }

    res.status(200).json({
      success: true,
      message: `Koneksi berhasil! Model Gemini (${successModel}) aktif dan siap digunakan.`,
      modelUsed: successModel,
    });
  } catch (error: any) {
    const raw = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    const isRateLimit = /rate\s*exceeded|resource_exhausted|429|quota|too\s*many\s*requests/i.test(raw);
    let friendlyError = raw;

    if (isRateLimit) {
      friendlyError = 'Batas frekuensi Google AI tercapai (429: Quota Exceeded). Mohon tunggu 10–20 detik lalu klik coba kembali.';
    } else if (raw.includes('API_KEY_INVALID') || raw.includes('400') || raw.includes('401') || raw.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED')) {
      friendlyError = 'API Key Gemini tidak valid atau salah salin. Pastikan menyalin dari Google AI Studio (aistudio.google.com/apikey).';
    } else if (raw.includes('PERMISSION_DENIED') || raw.includes('403') || raw.includes('API_KEY_SERVICE_BLOCKED')) {
      friendlyError = 'Akses API ditolak (403). Pastikan Generative Language API diaktifkan pada Google Cloud Project Anda.';
    }

    res.status(isRateLimit ? 429 : 400).json({
      success: false,
      error: friendlyError,
      isRateLimit,
    });
  }
}
