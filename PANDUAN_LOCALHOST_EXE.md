# Panduan Distribusi Aplikasi SAGARA (Sistem Akademik & Administrasi Terintegrasi)

Panduan ini adalah cara **paling mudah dan otomatis** untuk mendistribusikan SAGARA ke sekolah-sekolah. Metode ini memastikan **sekolah bisa mengatur database sendiri** dan **aplikasi terupdate otomatis** saat Anda merilis fitur baru.

---

## 🚀 Strategi: Hybrid (Frontend Online + Wrapper Desktop)

1.  **Frontend (UI) Online**: Anda hosting kode frontend SAGARA di Vercel atau Netlify.
2.  **Wrapper (.exe)**: Anda membuat aplikasi `.exe` kecil (Electron) yang tugasnya hanya membuka website SAGARA Anda tersebut.
3.  **Database Sekolah**: Setiap sekolah memiliki database Supabase sendiri (gratis).

**Keuntungan**:
-   **Update Otomatis**: Setiap kali Anda update kode, cukup deploy ke Vercel/Netlify. Aplikasi `.exe` di laptop sekolah otomatis mendapatkan fitur baru tanpa perlu diinstal ulang.
-   **Kemandirian Data**: Sekolah memasukkan API Key Supabase mereka sendiri. Data aman, privasi terjaga.

---

## 🛠️ Langkah-langkah Praktis

### Langkah 1: Hosting Frontend SAGARA
1.  Deploy kode aplikasi Anda (frontend) ke platform hosting gratis seperti [Vercel](https://vercel.com/) atau [Netlify](https://netlify.com/).
2.  Setelah berhasil, Anda akan mendapatkan URL website, contoh: `https://sagara-sekolah.vercel.app`.

### Langkah 2: Buat Aplikasi .exe (Electron)
Aplikasi `.exe` ini fungsinya hanya membuka website SAGARA Anda.

1.  Install Electron di laptop Anda:
    ```bash
    npm install --save-dev electron electron-builder
    ```
2.  Buat file `main.js` di folder proyek:
    ```javascript
    const { app, BrowserWindow } = require('electron');
    const path = require('path');

    function createWindow () {
      const win = new BrowserWindow({
        width: 1280, height: 800,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
      });

      // Load website SAGARA Anda
      win.loadURL('https://sagara-sekolah.vercel.app'); 
      win.setMenuBarVisibility(false);
    }
    app.whenReady().then(createWindow);
    ```
3.  Build menjadi `.exe`:
    ```bash
    npx electron-builder build --win --portable
    ```
    (Hasilnya ada di folder `dist`).

### Langkah 3: Setup Database di Sekolah
1.  Sekolah mendaftar Supabase (gratis) dan membuat proyek baru.
2.  Di menu **SQL Editor** Supabase, jalankan script dari file `master_schema.sql` yang Anda sediakan.
3.  Buka aplikasi SAGARA, klik **ikon Pengaturan (Gerigi)** di pojok kanan atas halaman Login.
4.  Masukkan **Supabase URL** dan **Anon Key** milik sekolah tersebut.
5.  Klik **Simpan & Aktifkan**. Aplikasi akan otomatis restart dan terhubung ke database sekolah. Selesai!

---

## 🔄 Cara Update Fitur (Sangat Mudah)
1.  Anda melakukan perubahan fitur di laptop Anda.
2.  Deploy ulang ke Vercel/Netlify.
3.  **Selesai**. Semua sekolah yang membuka aplikasi `.exe` mereka langsung mendapatkan fitur terbaru. Tidak perlu kirim file `.exe` baru.
