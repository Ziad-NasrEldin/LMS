import fs from 'fs';

const files = [
  'src/pages/signup/step1.jsx',
  'src/pages/signup/Step2.jsx',
  'src/pages/signup/StepTeacher.jsx',
  'src/pages/signup/StepParent.jsx',
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');

  // Replace pb-5 with an empty string or smaller padding
  code = code.replace(/className="form-control relative pb-5"/g, 'className="form-control relative"');
  code = code.replace(/className="flex flex-col gap-2"/g, 'className="flex flex-col gap-1"');
  // inputs take full width of grid cell
  code = code.replace(/w-full sm:w-2\/3 lg:w-1\/2/g, 'w-full');
  
  // Pack labels tightly
  code = code.replace(/<label className="label">/g, '<label className="label py-1">');

  // Replace main wrapper
  code = code.replace(
    /return \([\s\S]*?<div className="space-y-2">\s*<p className="text-2xl font-semibold">\{t\('form\.(personalDetails|parentDetails|accountDetails)'\)\}<\/p>/,
    `return (\n    <div className="space-y-4">\n      <p className="text-xl sm:text-2xl font-semibold mb-2">{t('form.$1')}</p>\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">`
  );

  // Close the grid correctly before the end of the file.
  // We can do this by finding the last "</div>" that closes the wrapper and adding another </div>.
  // Actually, replace the last "</div>\n  );\n}" with "  </div>\n    </div>\n  );\n}"
  if (code.includes('grid grid-cols-1')) {
    code = code.replace(/<\/div>\s*\);\s*\}\s*$/, '    </div>\n    </div>\n  );\n}\n');
  }

  // Same thing for StepParent.jsx
  if (file.includes('StepParent.jsx')) {
     code = code.replace(
       /return \([\s\S]*?<div className="space-y-2">\s*<p className="text-2xl font-semibold">\{t\('form\.parentChildrenDetails'\)\}<\/p>/,
       `return (\n    <div className="space-y-4">\n      <p className="text-xl sm:text-2xl font-semibold">{t('form.parentChildrenDetails')}</p>\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">`
     );
  }

  fs.writeFileSync(file, code);
  console.log('Refactored:', file);
}
