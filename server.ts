import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

function parseGeminiError(error: any): string {
  if (!error) return "Terjadi kesalahan saat memproses permintaan AI.";

  const raw = error?.message || (typeof error === "string" ? error : JSON.stringify(error));

  // Quick check for Rate Limit / Quota Exceeded across any error format (raw string or JSON)
  const isRateLimit = /rate\s*exceeded|resource_exhausted|429|quota\s*exceeded|too\s*many\s*requests/i.test(raw);
  if (isRateLimit) {
    return "Batas frekuensi request Google AI tercapai (429: Rate Exceeded). Akun Google AI Studio gratis memiliki batas 15 request per menit. Sistem telah mencoba beralih ke model cadangan. Solusi: Silakan tunggu 10–20 detik agar kuota Google AI pulih otomatis lalu klik tombol 'Coba Generate Lagi', atau gunakan API Key alternatif.";
  }
  
  try {
    const jsonStart = raw.indexOf('{');
    if (jsonStart !== -1) {
      const parsed = JSON.parse(raw.slice(jsonStart));
      if (parsed?.error) {
        const code = parsed.error.code;
        const status = parsed.error.status;
        const reason = parsed.error.details?.[0]?.reason;
        const message = parsed.error.message || "";

        if (code === 401 || status === "UNAUTHENTICATED") {
          if (reason === "ACCESS_TOKEN_TYPE_UNSUPPORTED" || reason === "API_KEY_INVALID" || message.includes("invalid authentication")) {
            return "API Key Gemini ditolak oleh Google (401 UNAUTHENTICATED: ACCESS_TOKEN_TYPE_UNSUPPORTED). Hal ini biasanya terjadi karena: (1) API Key tidak valid / salah salin, (2) 'Generative Language API' belum diaktifkan di Google Cloud Project, atau (3) API Key memiliki batasan (restriction) yang memblokir Gemini. Silakan buat API Key baru gratis di Google AI Studio (https://aistudio.google.com/apikey).";
          }
          return `Autentikasi gagal (401): ${message || "Periksa kembali API Key Gemini Anda."}`;
        }

        if (code === 403 || reason === "API_KEY_SERVICE_BLOCKED") {
          return "API Key diblokir atau memiliki pembatasan layanan (403 Forbidden: API_KEY_SERVICE_BLOCKED). Pastikan 'Generative Language API' diizinkan di Google Cloud Console pada menu Credentials.";
        }

        if (code === 429 || status === "RESOURCE_EXHAUSTED" || /rate\s*exceeded|quota|too\s*many/i.test(message)) {
          return "Batas frekuensi request Google AI tercapai (429: Rate Exceeded). Akun Google AI Studio gratis memiliki batas 15 request per menit. Sistem telah mencoba beralih ke model cadangan. Solusi: Silakan tunggu 10–20 detik agar kuota Google AI pulih otomatis lalu klik tombol 'Coba Generate Lagi', atau gunakan API Key alternatif.";
        }

        if (code === 503 || status === "UNAVAILABLE" || message.includes("high demand") || message.includes("overloaded") || message.includes("try again later")) {
          return "Server Google AI sedang mengalami lonjakan beban trafik tinggi (503 Service Unavailable / High Demand). Sistem telah mencoba beralih ke model cadangan. Silakan coba klik kembali beberapa saat lagi.";
        }

        if (code === 404) {
          return `Model Gemini tidak ditemukan (404): ${message}`;
        }

        if (message) {
          return `Error Google AI: ${message}`;
        }
      }
    }
  } catch {
    // If parsing fails, fall back to string pattern check
  }

  if (raw.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED")) {
    return "API Key Gemini ditolak oleh Google (401 UNAUTHENTICATED: ACCESS_TOKEN_TYPE_UNSUPPORTED). Silakan dapatkan API Key baru langsung dari Google AI Studio: https://aistudio.google.com/apikey";
  }

  if (raw.includes("API_KEY_SERVICE_BLOCKED")) {
    return "API Key diblokir (API_KEY_SERVICE_BLOCKED). Pastikan Generative Language API aktif pada project Anda.";
  }

  if (raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE")) {
    return "Server Google AI sedang mengalami lonjakan beban trafik tinggi (503 High Demand). Silakan coba lagi dalam beberapa detik.";
  }

  return raw;
}

const FALLBACK_MODELS = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

async function generateWithFallback(
  ai: GoogleGenAI, 
  prompt: string, 
  options?: { isQuickCheck?: boolean }
): Promise<{ text: string; modelUsed: string }> {
  let lastError: any = null;

  for (let i = 0; i < FALLBACK_MODELS.length; i++) {
    const model = FALLBACK_MODELS[i];
    // Allow an automatic retry on rate limit or 503 for non-quick-check calls
    const maxAttempts = options?.isQuickCheck ? 1 : 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = response.text || "";
        if (text || options?.isQuickCheck) {
          return { text, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const raw = err?.message || (typeof err === "string" ? err : JSON.stringify(err));

        // If authentication or permission fails, switching models or retrying won't resolve it; throw immediately
        if (
          raw.includes("401") ||
          raw.includes("UNAUTHENTICATED") ||
          raw.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
          raw.includes("403") ||
          raw.includes("API_KEY_SERVICE_BLOCKED")
        ) {
          throw err;
        }

        const isRateLimit = /rate\s*exceeded|resource_exhausted|429|quota|too\s*many\s*requests/i.test(raw);
        const isServerBusy = raw.includes("503") || raw.includes("high demand") || raw.includes("UNAVAILABLE") || raw.includes("overloaded");

        const statusLabel = isRateLimit ? '429 Rate Limit' : (isServerBusy ? '503 High Demand' : raw.slice(0, 80));
        console.warn(`[AI Fallback] Model '${model}' (Percobaan ${attempt}) mengalami kendala (${statusLabel}).`);

        // If rate limited or server overloaded on this model, wait with backoff before retry attempt
        if (attempt < maxAttempts && (isRateLimit || isServerBusy)) {
          const retryWait = isRateLimit ? 2000 : 1200;
          await new Promise(res => setTimeout(res, retryWait));
          continue;
        }

        // When switching to the next model, pause so rate limit token bucket or server queue has time to recover
        if (i < FALLBACK_MODELS.length - 1) {
          const switchWait = isRateLimit ? 1500 : (isServerBusy ? 1000 : 350);
          await new Promise(res => setTimeout(res, switchWait));
        }
        break; // break inner attempt loop to proceed to next model
      }
    }
  }

  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Status Route
  app.get("/api/ai/status", (req, res) => {
    const hasEnvKey = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
    res.json({ configured: hasEnvKey });
  });

  // AI Verify Route (Test connection)
  app.post("/api/ai/verify", async (req, res) => {
    const { apiKey } = req.body || {};
    const effectiveKey = (apiKey && typeof apiKey === "string" && apiKey.trim().length > 0)
      ? apiKey.trim()
      : process.env.GEMINI_API_KEY;

    if (!effectiveKey) {
      return res.status(400).json({ 
        success: false, 
        error: "API Key Gemini belum diisi. Masukkan API Key dari Google AI Studio." 
      });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: effectiveKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Multi-model resilient test ping
      const { text, modelUsed } = await generateWithFallback(
        ai, 
        "Tes koneksi. Jawab dengan satu kata: OK.", 
        { isQuickCheck: true }
      );

      res.json({ 
        success: true, 
        message: `Koneksi berhasil! Model Gemini (${modelUsed}) aktif dan siap digunakan.`, 
        modelUsed,
        reply: text?.trim() || "OK" 
      });
    } catch (error: any) {
      console.error("Gemini Verify Error:", error);
      const friendlyMessage = parseGeminiError(error);
      const raw = error?.message || (typeof error === "string" ? error : JSON.stringify(error));
      const isRateLimit = /rate\s*exceeded|resource_exhausted|429|quota|too\s*many\s*requests/i.test(raw);
      res.status(isRateLimit ? 429 : 400).json({ 
        success: false, 
        error: friendlyMessage,
        isRateLimit
      });
    }
  });

  // AI Generation Route
  app.post("/api/generate", async (req, res) => {
    const { prompt, apiKey } = req.body;
    const effectiveKey = (apiKey && typeof apiKey === "string" && apiKey.trim().length > 0)
      ? apiKey.trim()
      : process.env.GEMINI_API_KEY;
    
    if (!effectiveKey) {
      return res.status(400).json({ 
        error: "API Key Gemini belum dikonfigurasi. Anda dapat memasukkannya di Pengaturan Sekolah, panel AI di editor lampiran, atau di menu Secrets AI Studio (GEMINI_API_KEY)." 
      });
    }

    try {
      const ai = new GoogleGenAI({ 
        apiKey: effectiveKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const { text, modelUsed } = await generateWithFallback(ai, prompt);
      res.json({ text, modelUsed });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const friendlyError = parseGeminiError(error);
      const raw = error?.message || (typeof error === "string" ? error : JSON.stringify(error));
      const isRateLimit = /rate\s*exceeded|resource_exhausted|429|quota|too\s*many\s*requests/i.test(raw);
      res.status(isRateLimit ? 429 : 500).json({ 
        error: friendlyError,
        isRateLimit
      });
    }
  });

  // API Health Route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
