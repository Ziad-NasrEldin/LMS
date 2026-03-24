const fs = require('fs');

const files = [
  'src/pages/signup/step1.jsx',
  'src/pages/signup/Step2.jsx',
  'src/pages/signup/StepTeacher.jsx',
  'src/pages/signup/StepParent.jsx',
  'src/pages/Login/login.jsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');

  // Universal compactness
  code = code.replace(/className="form-control relative pb-5"/g, 'className="form-control relative"');
  code = code.replace(/className="flex flex-col gap-2"/g, 'className="flex flex-col gap-1"');
  code = code.replace(/<label className="label">/g, '<label className="label py-1">');
  
  if (file.includes('login.jsx')) {
    code = code.replace(/className="flex flex-col gap-2"/g, 'className="flex flex-col gap-1"');
    code = code.replace(/<label className="label">/g, '<label className="label py-1">');
  }

  // Specifically for Step1, Step2, StepTeacher let's wrap the inputs inside a grid
  // We'll replace the first common field <div className="form-control..."> with <div className="grid..."><div className="form-control...">
  // But wait, the role checks and conditionals might break a simple `</div>` append.
  // Instead of a wrapper grid, what if we use CSS to tell `<div className="space-y-2">` to be a grid?
  // `<div className="space-y-[-...]" >` No, `space-y-` is for flow.
  
  fs.writeFileSync(file, code);
}
