const fs = require('fs');
const path = require('path');

const wizardPath = path.join(__dirname, '..', 'components', 'onboarding', 'DealerRegistrationWizard.tsx');
let wizardContent = fs.readFileSync(wizardPath, 'utf8');

// Replace left brand header in wizard
const oldWizardHeader = `<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D48] via-[#BE123C] to-[#881337] flex items-center justify-center font-black text-lg text-white shadow-soft shadow-crimson-600/30 ring-1 ring-white/20">
              D
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block leading-tight">
                Nissan New Zealand
              </span>
              <h1 className="font-bold text-base text-white tracking-tight leading-tight">
                Dealer Onboarding
              </h1>
            </div>`;

const newWizardHeader = `<div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img
                src="/nissan-logo.png"
                alt="Nissan Logo"
                className="w-9 h-9 object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block leading-tight">
                Nissan New Zealand
              </span>
              <h1 className="font-extrabold text-base text-white tracking-tight leading-tight mt-0.5">
                Dealer Onboarding
              </h1>
            </div>`;

wizardContent = wizardContent.replace(oldWizardHeader, newWizardHeader);
wizardContent = wizardContent.replace(/bg-\[#070D18\]/g, 'bg-[#000000]');

// Add Powered by AutoHub to wizard footer
const oldWizardFooter = `<div className="text-center text-[10px] text-slate-500 font-mono">
            256-bit Encrypted · Nissan NZ v2026.2
          </div>`;

const newWizardFooter = `<div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-sans">
            <span>Nissan NZ © 2026</span>
            <span className="flex items-center gap-1.5">
              <span>Powered by</span>
              <strong className="text-slate-200 font-semibold">AutoHub</strong>
            </span>
          </div>
          <div className="text-center text-[10px] text-slate-500 font-mono">
            256-bit Encrypted · Secure Dealer Portal
          </div>`;

wizardContent = wizardContent.replace(oldWizardFooter, newWizardFooter);

fs.writeFileSync(wizardPath, wizardContent, 'utf8');
console.log('DealerRegistrationWizard.tsx updated successfully.');

