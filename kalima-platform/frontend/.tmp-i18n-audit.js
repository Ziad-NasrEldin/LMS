const fs = require('fs');
const path = require('path');

const root = process.cwd();
const enDir = path.join(root, 'public/locales/en');
const arDir = path.join(root, 'public/locales/ar');

const flatten = (obj, prefix = '') =>
  Object.entries(obj || {}).flatMap(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, key) : [key];
  });

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));
const arFiles = new Set(fs.readdirSync(arDir).filter((f) => f.endsWith('.json')));
const report = [];

for (const f of enFiles) {
  const enPath = path.join(enDir, f);
  const arPath = path.join(arDir, f);

  if (!arFiles.has(f)) {
    report.push({ ns: f.replace('.json', ''), missingInAr: '<file missing>', missingInEn: '', countAr: 1, countEn: 0 });
    continue;
  }

  const enKeys = new Set(flatten(readJson(enPath)));
  const arKeys = new Set(flatten(readJson(arPath)));

  const missingInAr = [...enKeys].filter((k) => !arKeys.has(k));
  const missingInEn = [...arKeys].filter((k) => !enKeys.has(k));

  if (missingInAr.length || missingInEn.length) {
    report.push({
      ns: f.replace('.json', ''),
      missingInAr: missingInAr.slice(0, 20),
      missingInEn: missingInEn.slice(0, 20),
      countAr: missingInAr.length,
      countEn: missingInEn.length,
    });
  }
}

console.log('=== Locale Parity Audit (en vs ar) ===');
if (!report.length) {
  console.log('No key parity issues found.');
} else {
  for (const r of report) {
    console.log(`\n[${r.ns}] missingInAr=${r.countAr}, missingInEn=${r.countEn}`);
    if (Array.isArray(r.missingInAr) && r.missingInAr.length) {
      console.log('  sample missingInAr:', r.missingInAr.join(', '));
    } else if (typeof r.missingInAr === 'string') {
      console.log('  ', r.missingInAr);
    }
    if (Array.isArray(r.missingInEn) && r.missingInEn.length) {
      console.log('  sample missingInEn:', r.missingInEn.join(', '));
    }
  }
}
