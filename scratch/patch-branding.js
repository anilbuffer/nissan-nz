const fs = require('fs');
const path = require('path');

// 1. Fix Sidebar.tsx
const sidebarPath = path.join(__dirname, '..', 'components', 'layout', 'Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

// Replace top branding section in Sidebar
const oldSidebarTopRegex = /\{\/\* Top Branding Section \*\/\}[\s\S]*?\{\/\* Mobile Drawer Close Button \*\/\}/;
const newSidebarTop = `{/* Top Branding Section */}
        <div className="relative z-10">
          <div className="h-[64px] flex items-center justify-between px-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/nissan-logo.png"
                  alt="Nissan Logo"
                  className="w-9 h-9 object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]"
                />
              </div>
              {!collapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <h1 className="font-extrabold text-sm tracking-tight text-white truncate leading-tight">
                    Nissan
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">Dealer Order Platform</p>
                </div>
              )}
            </div>

            {/* Mobile Drawer Close Button */}`;

sidebarContent = sidebarContent.replace(oldSidebarTopRegex, newSidebarTop);

// Replace sidebar background to Nissan corporate deep black
sidebarContent = sidebarContent.replace(/bg-\[#070D18\]/g, 'bg-[#000000]');

// Add "Powered by AutoHub" in the bottom of Sidebar
if (!sidebarContent.includes('Powered by AutoHub')) {
  const oldProfileSection = `            </div>
          )}
        </div>
      </div>
    );
  };`;

  const newProfileSection = `            </div>
          )}

          {/* Powered by AutoHub Credit in Sidebar */}
          {!collapsed ? (
            <div className="px-4 py-2.5 text-[10px] text-slate-400 flex items-center justify-between border-t border-white/10 font-sans mt-1">
              <span className="text-slate-400">Nissan NZ © 2026</span>
              <span className="text-slate-400">
                Powered by <strong className="text-slate-200 font-semibold tracking-wide">AutoHub</strong>
              </span>
            </div>
          ) : (
            <div className="py-2 text-center border-t border-white/10 mt-1">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider" title="Powered by AutoHub">
                AUTOHUB
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };`;

  sidebarContent = sidebarContent.replace(oldProfileSection, newProfileSection);
}

fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
console.log('Sidebar.tsx updated successfully.');

// 2. Fix Header.tsx
const headerPath = path.join(__dirname, '..', 'components', 'layout', 'Header.tsx');
let headerContent = fs.readFileSync(headerPath, 'utf8');

// Replace mobile branding / collapsed branding in Header
const oldHeaderBranding = `{/* Mobile App Branding Mark on small screens */}
        <div className="lg:hidden flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#881337] flex items-center justify-center font-black text-white text-xs shadow-xs">
            D
          </div>
        </div>`;

const newHeaderBranding = `{/* Top-Left Nissan Branding (Mobile & Collapsed Desktop) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <img
            src="/nissan-logo.png"
            alt="Nissan"
            className="w-7 h-7 object-contain drop-shadow-xs"
          />
          <span className="font-extrabold text-xs sm:text-sm tracking-tight text-slate-900 leading-none">
            Nissan
          </span>
        </div>`;

if (headerContent.includes(oldHeaderBranding)) {
  headerContent = headerContent.replace(oldHeaderBranding, newHeaderBranding);
}

fs.writeFileSync(headerPath, headerContent, 'utf8');
console.log('Header.tsx updated successfully.');

// 3. Fix LoginPage.tsx
const loginPath = path.join(__dirname, '..', 'components', 'login', 'LoginPage.tsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Replace left branding in LoginPage
const oldLoginBranding = `<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#9F1239] flex items-center justify-center font-bold text-lg text-white shadow-soft shadow-crimson-600/30">
            D
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block leading-tight">
              Nissan
            </span>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">
              Dealer Order Platform
            </h1>
          </div>`;

const newLoginBranding = `<div className="w-11 h-11 flex items-center justify-center shrink-0">
            <img
              src="/nissan-logo.png"
              alt="Nissan"
              className="w-10 h-10 object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]"
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block leading-tight">
              Nissan
            </span>
            <h1 className="font-extrabold text-base tracking-tight text-white leading-tight mt-0.5">
              Dealer Order Platform
            </h1>
          </div>`;

loginContent = loginContent.replace(oldLoginBranding, newLoginBranding);

// Left side background to clean corporate black
loginContent = loginContent.replace(/bg-\[#070D18\]/g, 'bg-[#000000]');

// Update left footer with "Powered by AutoHub"
const oldLoginFooter = `<div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-white/10 font-mono">
          <span>Nissan NZ Used Vehicle Programme</span>
          <span>© 2026</span>
        </div>`;

const newLoginFooter = `<div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10 font-sans">
          <span>Nissan · Used Vehicle Programme</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by</span>
            <strong className="text-slate-200 font-semibold tracking-wide">AutoHub</strong>
          </span>
        </div>`;

loginContent = loginContent.replace(oldLoginFooter, newLoginFooter);

// Update right form side with subtle "Powered by AutoHub" credit below register link
const oldRegisterLink = `<div className="pt-4 border-t border-slate-100 space-y-2.5 text-center">
            <span className="text-xs text-slate-400 block font-medium">
              New Nissan NZ Dealership or Franchisee?
            </span>
            <Link
              href="/register"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-[0.99] group cursor-pointer"
            >
              <span>Register Dealership Application</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E11D48] transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>`;

const newRegisterLink = `<div className="pt-4 border-t border-slate-100 space-y-2.5 text-center">
            <span className="text-xs text-slate-400 block font-medium">
              New Nissan NZ Dealership or Franchisee?
            </span>
            <Link
              href="/register"
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-[0.99] group cursor-pointer"
            >
              <span>Register Dealership Application</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E11D48] transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="pt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-sans">
            <span>Powered by</span>
            <strong className="text-slate-700 font-semibold tracking-wide">AutoHub</strong>
          </div>`;

loginContent = loginContent.replace(oldRegisterLink, newRegisterLink);

fs.writeFileSync(loginPath, loginContent, 'utf8');
console.log('LoginPage.tsx updated successfully.');

// 4. Add subtle footer to DashboardShell.tsx
const shellPath = path.join(__dirname, '..', 'components', 'layout', 'DashboardShell.tsx');
let shellContent = fs.readFileSync(shellPath, 'utf8');

const oldShellMain = `<main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-8 touch-scroll">
          <div className="max-w-[1680px] 2xl:max-w-[1960px] w-full mx-auto">
            {renderViewContent()}
          </div>
        </main>`;

const newShellMain = `<main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 lg:p-8 pb-24 lg:pb-6 touch-scroll flex flex-col justify-between">
          <div className="max-w-[1680px] 2xl:max-w-[1960px] w-full mx-auto flex-1">
            {renderViewContent()}
          </div>

          <footer className="mt-8 pt-4 pb-2 border-t border-slate-200 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-[1680px] 2xl:max-w-[1960px] w-full mx-auto font-sans">
            <div className="flex items-center gap-2">
              <img src="/nissan-logo.png" alt="Nissan" className="w-4 h-4 object-contain opacity-70" />
              <span>Nissan · Dealer Order Platform</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Powered by</span>
              <strong className="text-slate-600 font-semibold">AutoHub</strong>
            </div>
          </footer>
        </main>`;

shellContent = shellContent.replace(oldShellMain, newShellMain);
fs.writeFileSync(shellPath, shellContent, 'utf8');
console.log('DashboardShell.tsx updated successfully.');

