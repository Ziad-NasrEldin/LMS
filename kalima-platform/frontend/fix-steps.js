
const fs = require('fs');
let code = fs.readFileSync('src/pages/signup/StepsIndicator.jsx', 'utf8');
code = code.replace(/text-xs sm:text-lg/g, 'text-[11px] sm:text-[13px]');
fs.writeFileSync('src/pages/signup/StepsIndicator.jsx', code);

