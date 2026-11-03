const fs = require('fs');
const path = require('path');

// 1. Update app/globals.css
const globalsCssPath = path.join(__dirname, '..', 'app', 'globals.css');
let css = fs.readFileSync(globalsCssPath, 'utf8');

// Replace crimson scale with official Nissan Red #C3002F
css = css.replace(/--color-crimson-50: #fff1f2;/g, '--color-crimson-50: #fff5f5;');
css = css.replace(/--color-crimson-100: #ffe4e6;/g, '--color-crimson-100: #ffe3e3;');
css = css.replace(/--color-crimson-200: #fecdd3;/g, '--color-crimson-200: #ffc9c9;');
css = css.replace(/--color-crimson-300: #fda4af;/g, '--color-crimson-300: #ffa8a8;');
css = css.replace(/--color-crimson-400: #fb7185;/g, '--color-crimson-400: #ff8787;');
css = css.replace(/--color-crimson-500: #f43f5e;/g, '--color-crimson-500: #e60037;');
css = css.replace(/--color-crimson-600: #e11d48;/g, '--color-crimson-600: #c3002f;');
css = css.replace(/--color-crimson-700: #be123c;/g, '--color-crimson-700: #a10026;');
css = css.replace(/--color-crimson-800: #9f1239;/g, '--color-crimson-800: #85001f;');
css = css.replace(/--color-crimson-900: #881337;/g, '--color-crimson-900: #680018;');
css = css.replace(/--color-crimson-950: #4c0519;/g, '--color-crimson-950: #3b000d;');

// Replace navy scale with Nissan corporate black/charcoals
css = css.replace(/--color-navy-950: #070d18;/g, '--color-navy-950: #000000;');
css = css.replace(/--color-navy-900: #0a1322;/g, '--color-navy-900: #0a0a0a;');
css = css.replace(/--color-navy-850: #0f1b2e;/g, '--color-navy-850: #121212;');
css = css.replace(/--color-navy-800: #142239;/g, '--color-navy-800: #18181b;');
css = css.replace(/--color-navy-700: #1b2a42;/g, '--color-navy-700: #27272a;');
css = css.replace(/--color-navy-600: #253957;/g, '--color-navy-600: #3f3f46;');

// Foreground to #0a0a0a
css = css.replace(/--foreground: #0a1322;/g, '--foreground: #0a0a0a;');

// Active nav glow and focus rings
css = css.replace(/background: #e11d48;/g, 'background: #c3002f;');
css = css.replace(/box-shadow: 0 0 10px 2px rgba\(225, 29, 72, 0.7\);/g, 'box-shadow: 0 0 10px 2px rgba(195, 0, 47, 0.7);');
css = css.replace(/0 0 0 4px #e11d48/g, '0 0 0 4px #c3002f');

fs.writeFileSync(globalsCssPath, css, 'utf8');
console.log('globals.css updated with Nissan Corporate palette.');

// 2. Global search and replace of hardcoded colors across app, components, lib
const dirs = ['app', 'components', 'lib'];
const replacements = [
  // Deep navy -> Nissan Black/Charcoals
  { from: /#0A1322/gi, to: '#0A0A0A' },
  { from: /#070D18/gi, to: '#000000' },
  { from: /#1B2A42/gi, to: '#27272A' },
  { from: /#0F1B2E/gi, to: '#121212' },
  { from: /#142239/gi, to: '#18181B' },
  { from: /#253957/gi, to: '#27272A' },

  // Pinkish Red -> Nissan Official Brand Red
  { from: /#E11D48/gi, to: '#C3002F' },
  { from: /#BE123C/gi, to: '#A10026' },
  { from: /#9F1239/gi, to: '#85001F' },
  { from: /#881337/gi, to: '#680018' },
];

let totalModifiedFiles = 0;

function processDirectory(dir) {
  const fullPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(fullPath)) return;
  const entries = fs.readdirSync(fullPath, { withFileTypes: true });

  for (const entry of entries) {
    const resPath = path.join(fullPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        processDirectory(path.join(dir, entry.name));
      }
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css')) {
      let content = fs.readFileSync(resPath, 'utf8');
      let changed = false;

      for (const r of replacements) {
        if (r.from.test(content)) {
          content = content.replace(r.from, r.to);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(resPath, content, 'utf8');
        totalModifiedFiles++;
      }
    }
  }
}

for (const d of dirs) processDirectory(d);
console.log(`Updated color codes across ${totalModifiedFiles} files.`);

