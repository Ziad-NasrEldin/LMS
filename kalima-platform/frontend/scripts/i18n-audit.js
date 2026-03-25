const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const localesDir = path.join(rootDir, 'public', 'locales');
const outputPath = path.join(rootDir, 'translation-audit-report.json');

const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const defaultNamespace = 'common';

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const flattenEntries = (value, prefix = '') => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [{ key: prefix, value }] : [];
  }

  return Object.entries(value).flatMap(([key, childValue]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (childValue && typeof childValue === 'object' && !Array.isArray(childValue)) {
      return flattenEntries(childValue, nextKey);
    }
    return [{ key: nextKey, value: childValue }];
  });
};

const collectSourceFiles = (dir) => {
  const files = [];
  const stack = [dir];

  while (stack.length) {
    const currentDir = stack.pop();
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
          continue;
        }
        stack.push(entryPath);
        continue;
      }

      if (sourceExtensions.has(path.extname(entry.name))) {
        files.push(entryPath);
      }
    }
  }

  return files;
};

const parseNamespaceArgument = (rawArgument) => {
  const text = String(rawArgument || '').trim();

  if (!text) {
    return [defaultNamespace];
  }

  if (text.startsWith('[')) {
    const matches = [...text.matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
    return matches.length ? matches : [defaultNamespace];
  }

  const singleMatch = text.match(/^['"]([^'"]+)['"]$/);
  if (singleMatch) {
    return [singleMatch[1]];
  }

  return [defaultNamespace];
};

const parseTranslationAliases = (sourceText) => {
  const aliasMap = new Map();
  const destructuringRe = /(?:const|let|var)\s*\{([\s\S]*?)\}\s*=\s*useTranslation\s*\(\s*([\s\S]*?)\s*\)/g;

  for (const match of sourceText.matchAll(destructuringRe)) {
    const destructured = match[1];
    const namespaces = parseNamespaceArgument(match[2]);

    for (const part of destructured.split(',')) {
      const name = part.trim();
      const aliasMatch = name.match(/^t(?:\s*:\s*([A-Za-z_$][\w$]*))?$/);
      if (!aliasMatch) {
        continue;
      }

      aliasMap.set(aliasMatch[1] || 't', namespaces);
    }
  }

  return aliasMap;
};

const parseOptionsNamespace = (optionsText) => {
  const raw = String(optionsText || '');
  const explicitNamespaceArray = raw.match(/\bns\s*:\s*\[([\s\S]*?)\]/);

  if (explicitNamespaceArray) {
    const namespaces = [...explicitNamespaceArray[1].matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);
    if (namespaces.length) {
      return namespaces;
    }
  }

  const explicitNamespace = raw.match(/\bns\s*:\s*['"]([^'"]+)['"]/);
  if (explicitNamespace) {
    return [explicitNamespace[1]];
  }

  return null;
};

const makeTemplatePattern = (templateLiteral) => {
  const chunks = String(templateLiteral).split(/\$\{[^}]+\}/g).map(escapeRegExp);
  return new RegExp(`^${chunks.join('.*?')}$`);
};

const normalizeKeyNamespace = (key, namespaces) => {
  const prefix = String(key).match(/^([A-Za-z0-9_-]+):(.+)$/);
  if (prefix && namespaces.includes(prefix[1])) {
    return { namespace: prefix[1], key: prefix[2] };
  }

  return { namespace: namespaces[0] || defaultNamespace, key };
};

const collectSourceUsages = (sourceFiles) => {
  const usages = [];

  for (const filePath of sourceFiles) {
    const sourceText = fs.readFileSync(filePath, 'utf8');
    const aliasMap = parseTranslationAliases(sourceText);

    for (const [alias, defaultNamespaces] of aliasMap.entries()) {
      const escapedAlias = escapeRegExp(alias);
      const literalCallRe = new RegExp(`\\b${escapedAlias}\\s*\\(\\s*(['\"])([\\s\\S]*?)\\1\\s*(?:,\\s*([\\s\\S]*?))?\\)`, 'g');
      const templateCallRe = new RegExp(`\\b${escapedAlias}\\s*\\(\\s*\\\`([\\s\\S]*?)\\\`\\s*(?:,\\s*([\\s\\S]*?))?\\)`, 'g');

      for (const match of sourceText.matchAll(literalCallRe)) {
        const keyText = match[2].trim();
        const namespaces = parseOptionsNamespace(match[3]) || defaultNamespaces;
        const { namespace, key } = normalizeKeyNamespace(keyText, namespaces);

        usages.push({
          file: path.relative(srcDir, filePath).split(path.sep).join('/'),
          ns: namespace,
          key,
          fn: alias,
        });
      }

      for (const match of sourceText.matchAll(templateCallRe)) {
        const keyText = match[1].trim();
        const namespaces = parseOptionsNamespace(match[2]) || defaultNamespaces;

        if (keyText.includes('${')) {
          usages.push({
            file: path.relative(srcDir, filePath).split(path.sep).join('/'),
            ns: namespaces[0] || defaultNamespace,
            key: keyText,
            fn: alias,
            pattern: makeTemplatePattern(keyText).source,
          });
          continue;
        }

        const { namespace, key } = normalizeKeyNamespace(keyText, namespaces);
        usages.push({
          file: path.relative(srcDir, filePath).split(path.sep).join('/'),
          ns: namespace,
          key,
          fn: alias,
        });
      }
    }
  }

  return usages;
};

const loadLocaleNamespaces = () => {
  const langs = ['en', 'ar'];
  const locales = {};

  for (const lang of langs) {
    const langDir = path.join(localesDir, lang);
    const entries = fs.existsSync(langDir) ? fs.readdirSync(langDir).filter((file) => file.endsWith('.json')) : [];
    locales[lang] = new Map();

    for (const fileName of entries) {
      const namespace = fileName.replace(/\.json$/, '');
      const filePath = path.join(langDir, fileName);
      const parsed = readJson(filePath);
      const flatEntries = flattenEntries(parsed);

      locales[lang].set(namespace, {
        filePath,
        data: parsed,
        flatEntries,
        flatMap: new Map(flatEntries.map((entry) => [entry.key, entry.value])),
      });
    }
  }

  return locales;
};

const resolveTemplateMatches = (usage, localeNamespaceKeys) => {
  const matcher = new RegExp(usage.pattern);
  return localeNamespaceKeys.filter((key) => matcher.test(key));
};

const buildReport = () => {
  const locales = loadLocaleNamespaces();
  const sourceFiles = collectSourceFiles(srcDir);
  const sourceUsages = collectSourceUsages(sourceFiles);

  const namespaceNames = new Set([
    ...locales.en.keys(),
    ...locales.ar.keys(),
    ...sourceUsages.map((usage) => usage.ns),
  ]);

  const byNamespace = {};
  const missingArNamespaces = [];
  const missingEnNamespaces = [];

  for (const namespace of [...namespaceNames].sort()) {
    const enNamespace = locales.en.get(namespace);
    const arNamespace = locales.ar.get(namespace);
    const enEntries = enNamespace?.flatEntries || [];
    const arEntries = arNamespace?.flatEntries || [];
    const enKeys = new Set(enEntries.map((entry) => entry.key));
    const arKeys = new Set(arEntries.map((entry) => entry.key));

    if (!enNamespace) {
      missingEnNamespaces.push(namespace);
    }
    if (!arNamespace) {
      missingArNamespaces.push(namespace);
    }

    const missingInAr = [...enKeys].filter((key) => !arKeys.has(key));
    const missingInEn = [...arKeys].filter((key) => !enKeys.has(key));

    const suspiciousSame = [];
    for (const key of [...enKeys].filter((entryKey) => arKeys.has(entryKey))) {
      const enValue = enNamespace.flatMap.get(key);
      const arValue = arNamespace.flatMap.get(key);
      if (typeof enValue === 'string' && typeof arValue === 'string' && enValue === arValue) {
        suspiciousSame.push(key);
      }
    }

    byNamespace[namespace] = {
      enCount: enKeys.size,
      arCount: arKeys.size,
      missingInAr,
      missingInEn,
      suspiciousSame,
    };
  }

  const missingUsedInEn = [];
  const missingUsedInAr = [];

  for (const usage of sourceUsages) {
    const enNamespace = locales.en.get(usage.ns);
    const arNamespace = locales.ar.get(usage.ns);

    if (usage.pattern) {
      const enMatches = enNamespace ? resolveTemplateMatches(usage, [...enNamespace.flatMap.keys()]) : [];
      const arMatches = arNamespace ? resolveTemplateMatches(usage, [...arNamespace.flatMap.keys()]) : [];

      if (!enMatches.length) {
        missingUsedInEn.push({ file: usage.file, ns: usage.ns, key: usage.key, fn: usage.fn });
      }
      if (!arMatches.length) {
        missingUsedInAr.push({ file: usage.file, ns: usage.ns, key: usage.key, fn: usage.fn });
      }
      continue;
    }

    if (!enNamespace || !enNamespace.flatMap.has(usage.key)) {
      missingUsedInEn.push({ file: usage.file, ns: usage.ns, key: usage.key, fn: usage.fn });
    }

    if (!arNamespace || !arNamespace.flatMap.has(usage.key)) {
      missingUsedInAr.push({ file: usage.file, ns: usage.ns, key: usage.key, fn: usage.fn });
    }
  }

  return {
    summary: {
      namespaceCountEn: locales.en.size,
      namespaceCountAr: locales.ar.size,
      missingArNamespacesCount: missingArNamespaces.length,
      missingEnNamespacesCount: missingEnNamespaces.length,
      missingUsedKeysInEnCount: missingUsedInEn.length,
      missingUsedKeysInArCount: missingUsedInAr.length,
    },
    missingArNamespaces,
    missingEnNamespaces,
    byNamespace,
    missingUsedInEn,
    missingUsedInAr,
  };
};

const report = buildReport();
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('=== Translation Audit Report ===');
console.log(JSON.stringify(report.summary, null, 2));
console.log(`Report written to ${path.relative(rootDir, outputPath).split(path.sep).join('/')}`);