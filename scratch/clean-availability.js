const fs = require('fs');
const path = require('path');

const filePath = path.resolve('components/dealer/DealerStockCatalog.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Remove getVehicleAvailability definition
const defRegex = /\/\/ Realistic Vehicle Availability generator[\s\S]*?^};\n/m;
content = content.replace(defRegex, '');

// Remove lines: const availability = getVehicleAvailability(vehicle, index);
content = content.replace(/const availability = getVehicleAvailability\(vehicle, index\);\n/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned up unused availability code.');

