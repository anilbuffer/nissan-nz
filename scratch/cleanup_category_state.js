const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'admin', 'AuditExportView.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

content = content.replace('  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");\n', '');
content = content.replace(`      if (categoryFilter !== "ALL" && log.category !== categoryFilter) {
        return false;
      }

`, '');
content = content.replace(', categoryFilter,', ',');

fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log("Cleaned up categoryFilter state!");

