const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, '..', 'components', 'layout', 'Header.tsx');
let content = fs.readFileSync(headerPath, 'utf8');

content = content.replace(
  '<div className={`flex items-center gap-2.5 shrink-0 ${isSidebarCollapsed ? "lg:flex" : "lg:hidden"}`}\n          <img',
  '<div className={`flex items-center gap-2.5 shrink-0 ${isSidebarCollapsed ? "lg:flex" : "lg:hidden"}`}>\n          <img'
);
content = content.replace(
  '<div className={`flex items-center gap-2.5 shrink-0 ${isSidebarCollapsed ? "lg:flex" : "lg:hidden"}`}\r\n          <img',
  '<div className={`flex items-center gap-2.5 shrink-0 ${isSidebarCollapsed ? "lg:flex" : "lg:hidden"}`}>\r\n          <img'
);

fs.writeFileSync(headerPath, content, 'utf8');
console.log('Fixed missing > in Header.tsx');

