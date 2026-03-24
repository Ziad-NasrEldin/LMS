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

  // Replace pb-5 with an empty string or smaller padding, because gap-4 in grid will handle spacing
  code = code.replace(/className="form-control relative pb-5"/g, 'className="form-control relative"');
  code = code.replace(/className="flex flex-col gap-2"/g, 'className="flex flex-col gap-1"');
  code = code.replace(/w-full sm:w-2\/3 lg:w-1\/2/g, 'w-full');
  
  // Pack labels tightly
  code = code.replace(/<label className="label">/g, '<label className="label py-1">');

  // step1 layout
  if (file.includes('step1.jsx')) {
    code = code.replace(
      /<div className="space-y-2">\s*<p className="text-xl sm:text-2xl font-semibold">.*?<\/p>/,
      '<div className="space-y-4">\n      <p className="text-xl sm:text-2xl font-semibold">{t(\'form.personalDetails\')}</p>\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">'
    );
    code = code.replace(
      /<div className="space-y-2">\s*<p className="text-2xl font-semibold">\{t\('form.personalDetails'\)\}<\/p>/,
      '<div className="space-y-4">\n      <p className="text-xl sm:text-2xl font-semibold">{t(\'form.personalDetails\')}</p>\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">'
    );
    // Find last </div> and replace closing
    code = code.replace(/<\/div>\s*$/, '  </div>\n    </div>\n  );\n}\n');
  }

  if (file.includes('Step2.jsx')) {
    code = code.replace(
      /<div className="space-y-2">\s*<p className="text-2xl font-semibold">\{t\('form.parentDetails'\)\}<\/p>/,
      '<div className="space-y-4">\n      <p className="text-xl sm:text-2xl font-semibold">{t(\'form.parentDetails\')}</p>\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">'
    );
    code = code.replace(/<\/div>\s*$/, '  </div>\n    </div>\n  );\n}\n');
  }

  if (file.includes('StepTeacher.jsx')) {
    code = code.replace(
      /<div className="space-y-2">\s*<p className="text-2xl font-semibold">\{t\('form.accountDetails'\)\}<\/p>/,
      '<div className="space-y-4">\n      <p className="text-xl sm:text-2xl font-semibold">{t(\'form.accountDetails\')}</p>\n      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">'
    );
    code = code.replace(/<\/div>\s*$/, '  </div>\n    </div>\n  );\n}\n');
  }

  fs.writeFileSync(file, code);
  console.log('Refactored:', file);
}
