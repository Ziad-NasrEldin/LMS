const fs = require('fs');
const file = 'src/pages/Login/login.jsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/<span className="label-text">/g, '<span className="label-text text-xs">');
  code = code.replace(/input input-bordered(?!\sinput-sm)/g, 'input input-bordered input-sm');
  code = code.replace(/space-y-4/g, 'space-y-2');
  fs.writeFileSync(file, code);
}
