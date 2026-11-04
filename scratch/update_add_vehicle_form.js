const fs = require('fs');

const filePath = 'components/japan/AddVehicleForm.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
if (!content.includes('getModelAngleImages')) {
  content = content.replace(
    'import { audio } from "@/lib/sound";',
    'import { audio } from "@/lib/sound";\nimport { getModelAngleImages } from "@/lib/vehicle-media";'
  );
}

// 2. getModelDefaultImages function
const targetFn = `  const getModelDefaultImages = (modelName: string): string[] => {
    const m = modelName.toLowerCase();
    if (m.includes("note")) return ["/images/cars/note.png", "/images/cars/angles/note-front.jpg", "/images/cars/angles/note-side.jpg", "/images/cars/angles/note-rear-quarter.jpg", "/images/cars/angles/note-interior.jpg"];
    if (m.includes("x-trail") || m.includes("xtrail")) return ["/images/cars/xtrail.png"];
    if (m.includes("leaf")) return ["/images/cars/leaf.png"];
    if (m.includes("serena")) return ["/images/cars/serena.png"];
    if (m.includes("ariya")) return ["/images/cars/ariya.png"];
    if (m.includes("kicks")) return ["/images/cars/kicks.png"];
    if (m.includes("dayz")) return ["/images/cars/dayz.png"];
    if (m.includes("elgrand")) return ["/images/cars/elgrand.png"];
    if (m.includes("navara")) return ["/images/cars/navara.png"];
    return ["/images/cars/note.png"];
  };`;

const replacementFn = `  const getModelDefaultImages = (modelName: string): string[] => {
    return getModelAngleImages(modelName);
  };`;

content = content.replace(targetFn.replace(/\n/g, '\r\n'), replacementFn.replace(/\n/g, '\r\n'));
if (!content.includes('return getModelAngleImages(modelName);')) {
  content = content.replace(targetFn, replacementFn);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated AddVehicleForm.tsx');

