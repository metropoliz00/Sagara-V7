const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace(/fetchData\(false, true\);/g, 'fetchData(true, true);');

fs.writeFileSync('App.tsx', code);
