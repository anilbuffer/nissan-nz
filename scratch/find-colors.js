const fs = require('fs');
const path = require('path');

const dirs = ['app', 'components', 'lib'];
const patterns = [
  /#0A1322/gi,
  /#070D18/gi,
  /#1B2A42/gi,
  /#0F1B2E/gi,
  /#142239/gi,
  /#E11D48/gi,
  /#BE123C/gi,
  /#9F1239/gi,
  /#881337/gi
];

function scanDir(dir, results = {}) {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) return results;
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });
  for (const entry of entries) {
    const resPath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        scanDir(path.join(dir, entry.name), results);
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css')) {
      const content = fs.readFileSync(resPath, 'utf8');
      const matches = [];
      for (const p of patterns) {
        const m = content.match(p);
        if (m) matches.push({ pattern: p.source, count: m.length });
      }
      if (matches.length > 0) {
        results[path.join(dir, entry.name)] = matches;
      }
    }
  }
  return results;
}

const found = {};
for (const d of dirs) scanDir(d, found);
console.log(JSON.stringify(found, null, 2));

