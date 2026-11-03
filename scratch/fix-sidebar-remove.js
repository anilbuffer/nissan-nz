const fs = require('fs');
const path = require('path');

const sidebarPath = path.join(__dirname, '..', 'components', 'layout', 'Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

const targetBlock = `          {/* Powered by AutoHub Credit in Sidebar */}
          {!collapsed ? (
            <div className="px-4 py-2.5 text-[11px] text-slate-400 flex items-center justify-between border-t border-white/10 font-sans mt-2">
              <span className="text-slate-400">Nissan NZ © 2026</span>
              <span className="text-slate-400">
                Powered by <strong className="text-slate-200 font-semibold tracking-wide">AutoHub</strong>
              </span>
            </div>
          ) : (
            <div className="py-2 text-center border-t border-white/10 mt-2">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider" title="Powered by AutoHub">
                AUTOHUB
              </span>
            </div>
          )}`;

const normSidebar = sidebarContent.replace(/\r\n/g, '\n');
const normTarget = targetBlock.replace(/\r\n/g, '\n');

if (normSidebar.includes(normTarget)) {
  fs.writeFileSync(sidebarPath, normSidebar.replace(normTarget, ''), 'utf8');
  console.log('Sidebar credit removed successfully!');
} else {
  console.log('Could not find targetBlock in Sidebar.tsx');
}

