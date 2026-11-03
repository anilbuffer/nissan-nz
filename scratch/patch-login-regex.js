const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, '..', 'components', 'login', 'LoginPage.tsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');

// 1. Top left branding
const topBrandRegex = /\{\/\* Top: Project Name & Programme Badge \*\/\}[\s\S]*?<\/h1>\s*<\/div>\s*<\/div>/;
const topBrandReplacement = `{/* Top: Project Name & Programme Badge */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-11 h-11 flex items-center justify-center shrink-0">
            <img
              src="/nissan-logo.png"
              alt="Nissan Logo"
              className="w-10 h-10 object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]"
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block leading-tight">
              Nissan New Zealand
            </span>
            <h1 className="font-extrabold text-base tracking-tight text-white leading-tight mt-0.5">
              Dealer Order Platform
            </h1>
          </div>
        </div>`;

loginContent = loginContent.replace(topBrandRegex, topBrandReplacement);

// 2. Left side footer
const footerRegex = /\{\/\* Minimal Footer \*\/\}[\s\S]*?<span>© 2026<\/span>\s*<\/div>/;
const footerReplacement = `{/* Minimal Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-white/10 font-sans">
          <span>Nissan New Zealand · Used Vehicle Programme</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by</span>
            <strong className="text-slate-200 font-semibold tracking-wide">AutoHub</strong>
          </span>
        </div>`;

loginContent = loginContent.replace(footerRegex, footerReplacement);

// 3. Right side card footer credit
const rightCardFooterRegex = /\{\/\* Dealer Registration Action \(US-01 \/ AC-01\) - Outline with Soft Shadow \*\/\}[\s\S]*?<\/Link>\s*<\/div>/;
const rightCardFooterReplacement = `{/* Dealer Registration Action (US-01 / AC-01) - Outline with Soft Shadow */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5 text-center">
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

loginContent = loginContent.replace(rightCardFooterRegex, rightCardFooterReplacement);

fs.writeFileSync(loginPath, loginContent, 'utf8');
console.log('LoginPage.tsx updated successfully with Nissan logo & Powered by AutoHub.');

