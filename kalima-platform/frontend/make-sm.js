const fs = require('fs');
const files = ['src/pages/signup/step1.jsx', 'src/pages/signup/Step2.jsx', 'src/pages/signup/StepTeacher.jsx', 'src/pages/signup/StepParent.jsx'];
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/<span className="label-text">/g, '<span className="label-text text-xs">');
  code = code.replace(/input input-bordered(?!\sinput-sm)/g, 'input input-bordered input-sm');
  code = code.replace(/select select-bordered(?!\sselect-sm)/g, 'select select-bordered select-sm');
  code = code.replace(/file-input file-input-bordered(?!\sfile-input-sm)/g, 'file-input file-input-bordered file-input-sm');
  code = code.replace(/space-y-4/g, 'space-y-2');
  fs.writeFileSync(file, code);
}
