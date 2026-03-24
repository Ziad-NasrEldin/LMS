
const fs = require('fs');
let code = fs.readFileSync('src/components/navbar.jsx', 'utf8');
code = code.replace(/{ key: \"aboutPlatform\", path: \"\/\" },/g, '');
fs.writeFileSync('src/components/navbar.jsx', code);

