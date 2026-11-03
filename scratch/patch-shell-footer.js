const fs = require('fs');
const path = require('path');

const shellPath = path.join(__dirname, '..', 'components', 'layout', 'DashboardShell.tsx');
let content = fs.readFileSync(shellPath, 'utf8');

const oldMain = `<main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-8 touch-scroll">
          <div className="max-w-[1680px] 2xl:max-w-[1960px] w-full mx-auto">
            {renderViewContent()}
          </div>
        </main>`;

const newMain = `<main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-6 touch-scroll flex flex-col justify-between">
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

const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldMain.replace(/\r\n/g, '\n');
const normNew = newMain.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  fs.writeFileSync(shellPath, normContent.replace(normOld, normNew), 'utf8');
  console.log('DashboardShell.tsx footer added successfully!');
} else {
  console.log('Could not find oldMain block in DashboardShell.tsx');
}

