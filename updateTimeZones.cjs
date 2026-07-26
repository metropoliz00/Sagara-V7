const fs = require('fs');
const files = [
  'src/pages/KegiatanPage.tsx',
  'src/pages/KeuanganPage.tsx',
  'src/pages/Dashboard.tsx',
  'src/components/MediaInformasi.tsx',
  'src/components/AdminCertificateEditor.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Pattern 1: toLocaleDateString('id-ID', { ... }) -> insert timeZone
    content = content.replace(/toLocaleDateString\((['\"])id-ID\1,\s*\{/g, 'toLocaleDateString($1id-ID$1, { timeZone: "Asia/Jakarta", ');
    
    // Pattern 2: toLocaleTimeString('id-ID', { ... }) -> insert timeZone
    content = content.replace(/toLocaleTimeString\((['\"])id-ID\1,\s*\{/g, 'toLocaleTimeString($1id-ID$1, { timeZone: "Asia/Jakarta", ');
    
    // Pattern 3: toLocaleString('id-ID', { ... }) -> insert timeZone
    content = content.replace(/toLocaleString\((['\"])id-ID\1,\s*\{/g, 'toLocaleString($1id-ID$1, { timeZone: "Asia/Jakarta", ');

    // Pattern 4: toLocaleDateString('id-ID') -> toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })
    content = content.replace(/toLocaleDateString\((['\"])id-ID\1\)/g, 'toLocaleDateString($1id-ID$1, { timeZone: "Asia/Jakarta" })');

    // Pattern 5: toLocaleTimeString('id-ID') -> toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })
    content = content.replace(/toLocaleTimeString\((['\"])id-ID\1\)/g, 'toLocaleTimeString($1id-ID$1, { timeZone: "Asia/Jakarta" })');

    // Pattern 6: toLocaleString('id-ID') -> toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    content = content.replace(/toLocaleString\((['\"])id-ID\1\)/g, 'toLocaleString($1id-ID$1, { timeZone: "Asia/Jakarta" })');

    fs.writeFileSync(file, content);
  }
});
