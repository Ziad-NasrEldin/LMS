const fs = require('fs');

function processFile(file, wrapPointRegex, wrapHeader) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Generic adjustments for compactness:
  code = code.replace(/className="form-control relative pb-5"/g, 'className="form-control relative"');
  code = code.replace(/className="flex flex-col gap-2"/g, 'className="flex flex-col gap-1"');
  
  // Make inputs full width (they will be constrained by the grid)
  code = code.replace(/w-full sm:w-2\/3 lg:w-1\/2/g, 'w-full');

  // Smaller label padding
  code = code.replace(/<label className="label">/g, '<label className="label py-1">');

  if (wrapPointRegex && wrapHeader) {
     const parts = code.split(wrapHeader);
     if (parts.length > 1) {
        let bottom = parts[1];
        // find last </div>
        let lastDiv = bottom.lastIndexOf('</div>');
        if (lastDiv !== -1) {
           bottom = bottom.substring(0, lastDiv) + '      </div>\n    ' + bottom.substring(lastDiv);
        }
        
        code = parts[0] + wrapHeader + '\n      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">\n' + bottom;
     }
  }

  // Same thing for StepTeacher, but it doesn't have a header. The first <div className="form-control"> we can split at
  if (file.includes('StepTeacher.jsx')) {
     const header2 = '<div className="space-y-4">';
     const parts = code.split(header2);
     if (parts.length > 1) {
         let bottom = parts[1];
         let lastDiv = bottom.lastIndexOf('</div>');
         if (lastDiv !== -1) {
            bottom = bottom.substring(0, lastDiv) + '      </div>\n    ' + bottom.substring(lastDiv);
         }
         code = parts[0] + header2 + '\n      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">' + bottom;
     }
  }

  fs.writeFileSync(file, code);
  console.log('Processed', file);
}

processFile('src/pages/signup/step1.jsx', true, '<p className="text-2xl font-semibold">{t(\'form.personalDetails\')}</p>');
processFile('src/pages/signup/Step2.jsx', true, '<p className="text-lg font-semibold">{t(\'form.parentDetails\')}</p>');
processFile('src/pages/signup/StepTeacher.jsx', false, null); // custom handling above
processFile('src/pages/signup/StepParent.jsx', false, null); // skipping grid wrapping for dynamic
