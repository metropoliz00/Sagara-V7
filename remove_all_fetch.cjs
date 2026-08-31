const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

// We just replace all occurrences of `await fetchData();` (with optional comments)
// with nothing!
code = code.replace(/await fetchData\(\);.*?$/gm, '');

fs.writeFileSync('App.tsx', code);
