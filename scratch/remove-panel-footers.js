const fs = require('fs');
const path = require('path');

// 1. Remove from Sidebar.tsx
const sidebarPath = path.join(__dirname, '..', 'components', 'layout', 'Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

const sidebarCreditRegex = /\{\/\* Powered by AutoHub Credit in Sidebar \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};/;
const sidebarReplacement = `</div>
      </div>
    );
  };`;

sidebarContent = sidebarContent.replace(sidebarCreditRegex, sidebarReplacement);
fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
console.log('Sidebar.tsx: Powered by AutoHub and footer credit removed.');

// 2. Remove from DashboardShell.tsx
const shellPath = path.join(__dirname, '..', 'components', 'layout', 'DashboardShell.tsx');
let shellContent = fs.readFileSync(shellPath, 'utf8');

const oldShellMain = `<main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-6 touch-scroll flex flex-col justify-between">
          <div className="max-w-[1680px] 2xl:max-w-[1960px] w-full mx-auto flex-1">
            {renderViewContent()}
          </div>

          <footer className="mt-10 pt-4 pb-2 border-t border-slate-200 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1680px] 2xl:max-w-[1960px] w-full mx-auto font-sans">
            <div className="flex items-center gap-2">
              <img src="/nissan-logo.png" alt="Nissan" className="w-4 h-4 object-contain opacity-70" />
              <span>Nissan · Dealer Order Platform</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Powered by</span>
              <strong className="text-slate-600 font-semibold tracking-wide">AutoHub</strong>
            </div>
          </footer>
        </main>`;

const newShellMain = `<main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-8 touch-scroll">
          <div className="max-w-[1680px] 2xl:max-w-[1960px] w-full mx-auto">
            {renderViewContent()}
          </div>
        </main>`;

const normShell = shellContent.replace(/\r\n/g, '\n');
const normOldShell = oldShellMain.replace(/\r\n/g, '\n');
const normNewShell = newShellMain.replace(/\r\n/g, '\n');

if (normShell.includes(normOldShell)) {
  fs.writeFileSync(shellPath, normShell.replace(normOldShell, normNewShell), 'utf8');
  console.log('DashboardShell.tsx: footer removed cleanly.');
} else {
  console.log('Could not find old footer in DashboardShell.tsx');
}

