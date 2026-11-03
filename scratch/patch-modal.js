const fs = require('fs');
const path = require('path');

const modalPath = path.join(__dirname, '..', 'components', 'onboarding', 'DealerRegistrationModal.tsx');
let modalContent = fs.readFileSync(modalPath, 'utf8');

const oldModalHeader = `<div className="bg-[#0A1322] px-6 py-5 text-white flex items-center justify-between border-b border-[#1B2A42]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-crimson-600 flex items-center justify-center font-bold text-lg text-white shadow-soft">
              D
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Nissan Dealer Onboarding Application</h3>
              <p className="text-xs text-slate-400">Dealer Order Platform · New Zealand</p>
            </div>
          </div>`;

const newModalHeader = `<div className="bg-[#000000] px-6 py-5 text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img
                src="/nissan-logo.png"
                alt="Nissan Logo"
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Nissan Dealer Onboarding Application</h3>
              <p className="text-xs text-slate-400">Nissan New Zealand · Powered by AutoHub</p>
            </div>
          </div>`;

modalContent = modalContent.replace(oldModalHeader, newModalHeader);
fs.writeFileSync(modalPath, modalContent, 'utf8');
console.log('DealerRegistrationModal.tsx updated successfully.');

