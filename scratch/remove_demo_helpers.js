const fs = require('fs');

let code = fs.readFileSync('components/japan/AddVehicleForm.tsx', 'utf8');

// 1. Remove Sparkles import
code = code.replace(/  Sparkles,\r?\n/, '');

// 2. Remove handleAutoFillDemo function
const handleAutoFillRegex = /\r?\n  const handleAutoFillDemo = \(\) => \{[\s\S]*?\};\r?\n/;
code = code.replace(handleAutoFillRegex, '\n');

// 3. Remove Auto-fill Demo Vehicle button container
const autoFillBtnRegex = /\r?\n\s*<div className="flex items-center gap-2">\s*<button\s*type="button"\s*onClick=\{handleAutoFillDemo\}[\s\S]*?<\/button>\s*<\/div>/;
code = code.replace(autoFillBtnRegex, '');

// 4. Remove Quick Sample Photos section
const quickSamplePhotosRegex = /\r?\n\s*{\/\* Quick Sample Photos for Instant Testing \*\/}[\s\S]*?<\/div>\r?\n\r?\n\s*{\/\* Upload Supporting Documents/;
code = code.replace(quickSamplePhotosRegex, '\n\n              {/* Upload Supporting Documents');

fs.writeFileSync('components/japan/AddVehicleForm.tsx', code, 'utf8');
console.log('Successfully removed Auto-fill Demo Vehicle and Quick Sample Photos!');

