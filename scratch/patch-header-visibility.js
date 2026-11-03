const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, '..', 'components', 'layout', 'Header.tsx');
let headerContent = fs.readFileSync(headerPath, 'utf8');

headerContent = headerContent.replace(
  '<div className="flex items-center gap-2.5 shrink-0">',
  '<div className={`flex items-center gap-2.5 shrink-0 ${isSidebarCollapsed ? "lg:flex" : "lg:hidden"}`}'
);

fs.writeFileSync(headerPath, headerContent, 'utf8');
console.log('Header.tsx responsive visibility updated.');

