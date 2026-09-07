import { GoogleGenAI } from "@google/genai";
import { cleanAiText } from "../utils/textParser";

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
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { prompt, apiKey } = req.body || {};
  const effectiveKey = (apiKey && typeof apiKey === 'string' && apiKey.trim().length > 0)
    ? apiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    res.status(400).json({
      error: 'API Key Gemini belum dikonfigurasi. Anda dapat mengisinya di Pengaturan Sekolah atau lampiran.',
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

    let generatedText = '';
    let successModel = '';
    let lastError: any = null;

    for (const model of FALLBACK_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        if (response.text) {
          generatedText = response.text;
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

    if (!generatedText) {
      throw lastError || new Error('Gagal memproses pembuatan konten AI.');
    }

    const cleanedText = cleanAiText(generatedText);
    res.status(200).json({
      text: cleanedText,
      modelUsed: successModel,
    });
  } catch (error: any) {
    const raw = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    const isRateLimit = /rate\s*exceeded|resource_exhausted|429|quota|too\s*many\s*requests/i.test(raw);
    let friendlyError = raw;

    if (isRateLimit) {
      friendlyError = 'Batas frekuensi Google AI tercapai (429: Quota Exceeded). Mohon tunggu 10–20 detik lalu coba generate kembali.';
    } else if (raw.includes('API_KEY_INVALID') || raw.includes('400') || raw.includes('401')) {
      friendlyError = 'API Key Gemini tidak valid atau salah salin.';
    } else if (raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
      friendlyError = 'Akses API ditolak (403). Pastikan Generative Language API aktif.';
    }

    res.status(isRateLimit ? 429 : 500).json({
      error: friendlyError,
      isRateLimit,
    });
  }
}
