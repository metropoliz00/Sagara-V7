/**
 * Mengkompres dan mengubah ukuran gambar (Resize) di sisi klien.
 * 
 * UPDATE V2: Smart Compression untuk Google Sheets Storage.
 * Batas aman penyimpanan sel adalah ~45.000 karakter.
 * Fungsi ini akan berusaha keras agar string base64 di bawah batas tersebut.
 * 
 * @param file File gambar asli dari input
 * @param maxWidth Lebar maksimal target
 * @param quality Kualitas gambar (0.0 - 1.0)
 * @returns Promise string base64 yang aman untuk Sheet
 */
export const compressImage = (file: File, maxWidth = 300, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        // 1. Hitung aspek rasio awal
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // 2. Buat Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Gagal membuat context canvas"));
          return;
        }

        // 3. Gambar ulang di canvas dengan teknik Progressive Downscaling (Canvas Stepping) untuk ketajaman maksimal
        let curWidth = img.width;
        let curHeight = img.height;
        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = curWidth;
        tempCanvas.height = curHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0);
        }

        while (curWidth > width * 1.5) {
          const nextWidth = Math.floor(curWidth / 2);
          const nextHeight = Math.floor(curHeight / 2);

          const stepCanvas = document.createElement('canvas');
          stepCanvas.width = nextWidth;
          stepCanvas.height = nextHeight;
          const stepCtx = stepCanvas.getContext('2d');
          if (stepCtx) {
            stepCtx.imageSmoothingEnabled = true;
            stepCtx.imageSmoothingQuality = 'high';
            stepCtx.drawImage(tempCanvas, 0, 0, curWidth, curHeight, 0, 0, nextWidth, nextHeight);
          }
          tempCanvas = stepCanvas;
          curWidth = nextWidth;
          curHeight = nextHeight;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, 0, 0, curWidth, curHeight, 0, 0, width, height);

        // 4. Tentukan tipe output awal dengan prioritas WebP jika didukung (paling hemat ukuran & sangat tajam)
        const testCanvas = document.createElement('canvas');
        const isWebpSupported = testCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        
        let outputType = file.type;
        if (isWebpSupported) {
            outputType = 'image/webp';
        } else if (file.type !== 'image/png') {
            outputType = 'image/jpeg';
        }
        
        let currentWidth = width;
        let currentHeight = height;
        let currentQuality = quality;
        let currentType = outputType;
        
        // 5. Percobaan 1: Kompresi Standard
        let base64 = canvas.toDataURL(currentType, currentQuality);
        const MAX_SAFE_LENGTH = 45000;

        // 6. SMART ITERATIVE OPTIMIZATION
        // Jika base64 terlalu besar untuk Google Sheets/database (~45k), kurangi secara cerdas
        if (base64.length > MAX_SAFE_LENGTH) {
            console.warn(`Gambar terlalu besar (${base64.length} chars). Melakukan optimasi resolusi/kualitas...`);
            
            // Strategi A: Jika format PNG, coba ubah ke WebP / JPEG karena kompresinya jauh lebih efisien untuk gambar kompleks
            if (currentType === 'image/png') {
                currentType = isWebpSupported ? 'image/webp' : 'image/jpeg';
                base64 = canvas.toDataURL(currentType, currentQuality);
            }
            
            // Strategi B: Kurangi kualitas & ukuran secara iteratif
            let attempt = 0;
            const loopCanvas = document.createElement('canvas');
            
            while (base64.length > MAX_SAFE_LENGTH && attempt < 8) {
                attempt++;
                if (currentQuality > 0.45) {
                    // Turunkan kualitas terlebih dahulu untuk mempertahankan resolusi tajam
                    currentQuality -= 0.15;
                } else {
                    // Jika kualitas sudah rendah, perkecil dimensi gambar (kurangi 15% setiap kali)
                    // PENTING: Batas minimal lebar adalah 750px untuk question image agar tidak pecah/buram saat dizoom
                    const minWidth = maxWidth >= 800 ? 750 : 350;
                    currentWidth = Math.max(minWidth, Math.floor(currentWidth * 0.85));
                    currentHeight = Math.max(200, Math.round((img.height * currentWidth) / img.width));
                }
                
                loopCanvas.width = currentWidth;
                loopCanvas.height = currentHeight;
                const loopCtx = loopCanvas.getContext('2d');
                if (loopCtx) {
                    loopCtx.imageSmoothingEnabled = true;
                    loopCtx.imageSmoothingQuality = 'high';
                    loopCtx.drawImage(img, 0, 0, currentWidth, currentHeight);
                    base64 = loopCanvas.toDataURL(currentType, currentQuality);
                }
                console.log(`Optimasi #${attempt}: Lebar=${currentWidth}, Kualitas=${currentQuality.toFixed(2)}, Ukuran=${base64.length}`);
            }
        }
        
        console.log(`Final Size: ${base64.length} chars (Limit: 50000)`);
        
        // Jika setelah optimasi keras masih sedikit di atas limit (sangat langka), potong secara paksa ke kualitas lebih rendah
        if (base64.length > 49000) {
            const finalCanvas = document.createElement('canvas');
            const minWidth = maxWidth >= 800 ? 650 : 250;
            currentWidth = Math.max(minWidth, Math.floor(currentWidth * 0.75));
            currentHeight = Math.round((img.height * currentWidth) / img.width);
            finalCanvas.width = currentWidth;
            finalCanvas.height = currentHeight;
            const finalCtx = finalCanvas.getContext('2d');
            if (finalCtx) {
                finalCtx.imageSmoothingEnabled = true;
                finalCtx.imageSmoothingQuality = 'high';
                finalCtx.drawImage(img, 0, 0, currentWidth, currentHeight);
                base64 = finalCanvas.toDataURL(currentType, 0.4);
            }
        }

        resolve(base64);
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};