const fs = require('fs');

const modelAngles = {
  note: [
    "/images/cars/note.png",
    "/images/cars/angles/note-front.jpg",
    "/images/cars/angles/note-side.jpg",
    "/images/cars/angles/note-rear-quarter.jpg",
    "/images/cars/angles/note-interior.jpg"
  ],
  xtrail: [
    "/images/cars/xtrail.png",
    "/images/cars/angles/xtrail-rear.jpg",
    "/images/cars/angles/xtrail-interior.jpg"
  ],
  leaf: [
    "/images/cars/leaf.png",
    "/images/cars/angles/leaf-rear.jpg",
    "/images/cars/angles/leaf-interior.jpg"
  ],
  ariya: [
    "/images/cars/ariya.png",
    "/images/cars/angles/ariya-rear.jpg",
    "/images/cars/angles/ariya-interior.jpg"
  ],
  kicks: [
    "/images/cars/kicks.png",
    "/images/cars/angles/kicks-rear.jpg",
    "/images/cars/angles/kicks-interior.jpg"
  ],
  serena: [
    "/images/cars/serena.png",
    "/images/cars/angles/serena-interior.jpg"
  ],
  elgrand: [
    "/images/cars/elgrand.png",
    "/images/cars/angles/elgrand-interior.jpg"
  ],
  navara: [
    "/images/cars/navara.png",
    "/images/cars/angles/navara-interior.jpg"
  ],
  dayz: [
    "/images/cars/dayz.png",
    "/images/cars/angles/dayz-interior.jpg"
  ]
};

function getAnglesForModel(model) {
  const m = model.toLowerCase();
  if (m.includes('note') || m.includes('aura')) return modelAngles.note;
  if (m.includes('x-trail') || m.includes('xtrail')) return modelAngles.xtrail;
  if (m.includes('leaf')) return modelAngles.leaf;
  if (m.includes('ariya')) return modelAngles.ariya;
  if (m.includes('kicks')) return modelAngles.kicks;
  if (m.includes('serena')) return modelAngles.serena;
  if (m.includes('elgrand')) return modelAngles.elgrand;
  if (m.includes('navara')) return modelAngles.navara;
  if (m.includes('dayz') || m.includes('roox') || m.includes('sakura')) return modelAngles.dayz;
  return modelAngles.note;
}

let content = fs.readFileSync('lib/mock-data.ts', 'utf8');

// Find the MOCK_VEHICLES array
const startIdx = content.indexOf('export const MOCK_VEHICLES: Vehicle[] = [');
const endIdx = content.indexOf('export const MOCK_ORDERS: Order[] = [');

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find boundaries!");
  process.exit(1);
}

let vehiclesSection = content.substring(startIdx, endIdx);

// Replace images blocks within vehicles
// Regex matches: "model": "...", ... "images": [\s*".*?"\s*]
vehiclesSection = vehiclesSection.replace(
  /("model":\s*"([^"]+)"[\s\S]*?"images":\s*\[)([\s\S]*?)(\])/g,
  (match, p1, model, p3, p4) => {
    const angles = getAnglesForModel(model);
    const formatted = '\n' + angles.map(a => `      "${a}"`).join(',\n') + '\n    ';
    return `${p1}${formatted}${p4}`;
  }
);

content = content.substring(0, startIdx) + vehiclesSection + content.substring(endIdx);
fs.writeFileSync('lib/mock-data.ts', content, 'utf8');
console.log('Successfully enriched MOCK_VEHICLES in lib/mock-data.ts');

