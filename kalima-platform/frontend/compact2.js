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

  // Generic adjustments for compactness across all of them:
  // Remove big bottom padding
  code = code.replace(/className="form-control relative pb-5"/g, 'className="form-control relative"');
  // Reduce gap between label and input
  code = code.replace(/className="flex flex-col gap-2"/g, 'className="flex flex-col gap-1"');
  // Make inputs take full width of container (grid will constrain them)
  code = code.replace(/w-full sm:w-2\/3 lg:w-1\/2/g, 'w-full');
  // Make labels smaller padding
  code = code.replace(/<label className="label">/g, '<label className="label py-1">');

  // Wrap internal fields in grid for step 1
  if (file.includes('step1.jsx') && !code.includes('grid-cols-1 sm:grid-cols-2')) {
     const splitTarget = `<p className="text-2xl font-semibold">{t('form.personalDetails')}</p>`;
     const parts = code.split(splitTarget);
     if (parts.length > 2) { // There might be early returns with this text. The last one is the real deal
         let bottom = parts[parts.length - 1]; // The main form fields
         
         let lastDiv = bottom.lastIndexOf('</div>');
         if (lastDiv !== -1) {
            bottom = bottom.substring(0, lastDiv) + '\n      </div>\n    ' + bottom.substring(lastDiv);
         }
         
         parts[parts.length - 1] = '\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">' + bottom;
         
         code = parts.join(`<p className="text-xl sm:text-2xl font-semibold mb-2">{t('form.personalDetails')}</p>`);
     }
  }

  // Wrap internal fields in grid for step 2
  if (file.includes('Step2.jsx') && !code.includes('grid-cols-1 sm:grid-cols-2')) {
     const splitTarget = `<p className="text-lg font-semibold">{t('form.parentDetails')}</p>`;
     const parts = code.split(splitTarget);
     if (parts.length > 1) {
         let bottom = parts[parts.length - 1];
         let lastDiv = bottom.lastIndexOf('</div>');
         if (lastDiv !== -1) {
            bottom = bottom.substring(0, lastDiv) + '\n      </div>\n    ' + bottom.substring(lastDiv);
         }
         parts[parts.length - 1] = '\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">' + bottom;
         
         code = parts.join(`<p className="text-xl sm:text-2xl font-semibold mb-2">{t('form.parentDetails')}</p>`);
     }
  }

  // Wrap internal fields in grid for step teacher
  if (file.includes('StepTeacher.jsx') && !code.includes('grid-cols-1 sm:grid-cols-2')) {
     const topWrap = `<div className="space-y-4">`;
     const parts = code.split(topWrap);
     if (parts.length > 1) {
         let bottom = parts[parts.length - 1];
         let lastDiv = bottom.lastIndexOf('</div>');
         if (lastDiv !== -1) {
            bottom = bottom.substring(0, lastDiv) + '\n      </div>\n    ' + bottom.substring(lastDiv);
         }
         
         parts[parts.length - 1] = '\n      <p className="text-xl sm:text-2xl font-semibold mb-2">{t(\'form.accountDetails\') || \'Account Details\'}</p>\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">' + bottom;
         
         code = parts.join(topWrap);
     }
  }

  fs.writeFileSync(file, code);
}
