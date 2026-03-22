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

const getByPath = (obj, keyPath) => keyPath.split('.').reduce((a, k) => (a && Object.prototype.hasOwnProperty.call(a, k) ? a[k] : undefined), obj);

const enFiles = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));
const arFiles = new Set(fs.readdirSync(arDir).filter((f) => f.endsWith('.json')));

for (const f of enFiles) {
  const enPath = path.join(enDir, f);
  const arPath = path.join(arDir, f);
  if (!arFiles.has(f)) {
    console.log(`\n[${f.replace('.json', '')}] missing locale file in ar`);
    continue;
  }

  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

  const enKeys = new Set(flatten(en));
  const arKeys = new Set(flatten(ar));

  const missingInAr = [...enKeys].filter((k) => !arKeys.has(k));
  const missingInEn = [...arKeys].filter((k) => !enKeys.has(k));

  if (missingInAr.length || missingInEn.length) {
    console.log(`\n[${f.replace('.json', '')}]`);
    if (missingInAr.length) {
      console.log('missingInAr:');
      for (const k of missingInAr) {
        console.log(`  - ${k} = ${JSON.stringify(getByPath(en, k))}`);
      }
    }
    if (missingInEn.length) {
      console.log('missingInEn:');
      for (const k of missingInEn) {
        console.log(`  - ${k} = ${JSON.stringify(getByPath(ar, k))}`);
      }
    }
  }
}
