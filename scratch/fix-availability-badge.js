const fs = require('fs');
const path = require('path');

const filePath = path.resolve('components/dealer/DealerStockCatalog.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 1. In Grid View: remove "Vehicle Availability Label" block
const targetGridBadge = `                      {/* Vehicle Availability Label */}
                      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200/90 text-[10px]">
                        <span className={\`w-1.5 h-1.5 rounded-full \${availability.dot} shrink-0\`} />
                        <span className="text-slate-400 font-medium">Vehicle Availability:</span>
                        <span className="font-bold text-slate-800">{availability.status}</span>
                      </div>`;

if (content.includes(targetGridBadge)) {
  content = content.replace(targetGridBadge, '');
  console.log('Removed Grid View Vehicle Availability label successfully.');
} else {
  console.log('Target Grid badge not found, checking regex/loose match...');
  const regexGrid = /\{\/\* Vehicle Availability Label \*\/\}[\s\S]*?\{availability\.status\}<\/span>\s*<\/div>/;
  content = content.replace(regexGrid, '');
}

// 2. In List View: remove "Vehicle Availability Label" block
const regexList = /<div className="inline-flex items-center gap-1\.5 px-2 py-0\.5 rounded-full bg-slate-50 border border-slate-200\/90 text-\[10px\]">[\s\S]*?\{availability\.status\}<\/span>\s*<\/div>/;
if (regexList.test(content)) {
  content = content.replace(regexList, '');
  console.log('Removed List View Vehicle Availability label successfully.');
} else {
  console.log('List regex did not match');
}

// 3. Update floating pill text on car image:
// Instead of "24h Exclusivity Lock Active", use "On Exclusivity Hold (18h left)"
content = content.replace(
  `: "24h Exclusivity Lock Active"}`,
  `: "On Exclusivity Hold (18h left)"}`
);

// In List View floating badge:
content = content.replace(
  `<span>{vehicle.reservedByDealerId === currentDealer?.id ? "Your Hold" : "Locked"}</span>`,
  `<span>{vehicle.reservedByDealerId === currentDealer?.id ? "Your Active Hold (18h left)" : "On Exclusivity Hold (18h left)"}</span>`
);

// In button labels:
content = content.replace(
  `<span>Unavailable</span>`,
  `<span>On Exclusivity Hold</span>`
);

content = content.replace(
  `<span>Locked</span>`,
  `<span>On Exclusivity Hold</span>`
);

// Remove unused availability variables if not needed
// Keep getVehicleAvailability or clean up
fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated DealerStockCatalog.tsx successfully.');

