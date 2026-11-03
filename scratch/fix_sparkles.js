const fs = require('fs');
let code = fs.readFileSync('components/japan/AddVehicleForm.tsx', 'utf8');
code = code.replace(/Trash2,/, 'Trash2,\n  Sparkles,');
if (code.includes('\r\n')) {
  code = code.replace(/Trash2,\n  Sparkles,/, 'Trash2,\r\n  Sparkles,');
}
fs.writeFileSync('components/japan/AddVehicleForm.tsx', code, 'utf8');
console.log('Sparkles import fixed successfully');

