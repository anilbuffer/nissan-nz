const fs = require('fs');
const path = require('path');

const headerPath = path.join(__dirname, '..', 'components', 'layout', 'Header.tsx');
let headerContent = fs.readFileSync(headerPath, 'utf8');

const regex = /\{\/\* Mobile App Branding Mark on small screens \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
const replacement = `{/* Top-Left Nissan Branding (Mobile & Collapsed Desktop) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/nissan-logo.png"
            alt="Nissan"
            className="w-7 h-7 object-contain drop-shadow-xs"
          />
          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 leading-none">
            Nissan New Zealand
          </span>
        </div>`;

headerContent = headerContent.replace(regex, replacement);
fs.writeFileSync(headerPath, headerContent, 'utf8');
console.log('Header.tsx branding updated successfully.');

