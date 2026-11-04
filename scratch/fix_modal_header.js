const fs = require('fs');

// 1. Fix DealerDetailsModal.tsx
let dealerModal = fs.readFileSync('components/admin/DealerDetailsModal.tsx', 'utf8');
dealerModal = dealerModal.replace(
  /\{\/\* Header - Nissan Obsidian Black \*\/\}[\s\S]*?<\/button>\s*<\/div>/,
  `{/* Clean Executive Light Header */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-600">
                  {dealer.dealerCode}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {dealer.registrationRole || (dealer.category === "JAPAN_HQ" || dealer.termsAcceptedVersion?.includes("JP-EXPORT") ? "Nissan Japan" : "NZ Dealer")} · {dealer.status === "APPROVED" ? "Approved" : "Pending Authorization"}
                </span>
              </div>
              <h2 id="dealer-details-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                {dealer.legalTradingName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>`
);
fs.writeFileSync('components/admin/DealerDetailsModal.tsx', dealerModal, 'utf8');
console.log('Updated DealerDetailsModal.tsx');

// 2. Fix CatalogueDetailsModal.tsx
let catModal = fs.readFileSync('components/admin/CatalogueDetailsModal.tsx', 'utf8');
catModal = catModal.replace(
  /<div className="px-6 py-4 bg-\[#0A0A0A\] text-white flex items-center justify-between border-b border-slate-800 shrink-0">[\s\S]*?<\/button>\s*<\/div>/,
  `<div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-600">
                  #{vehicle.stockId}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  VIN: {vehicle.vinChassis}
                </span>
              </div>
              <h2 id="catalogue-details-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.grade ? \`(\${vehicle.grade})\` : ""}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>`
);
fs.writeFileSync('components/admin/CatalogueDetailsModal.tsx', catModal, 'utf8');
console.log('Updated CatalogueDetailsModal.tsx');

// 3. Fix InviteUserModal.tsx
let inviteModal = fs.readFileSync('components/admin/InviteUserModal.tsx', 'utf8');
inviteModal = inviteModal.replace(
  /<div className="px-6 py-5 bg-\[#0A0A0A\] text-white flex items-center justify-between border-b border-\[#27272A\]">[\s\S]*?<\/button>\s*<\/div>/,
  `<div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#C3002F] shadow-2xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Invite Platform User
              </h2>
              <p className="text-xs text-slate-500">
                Grant role-based access to Nissan NZ Used Vehicle Programme
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>`
);
fs.writeFileSync('components/admin/InviteUserModal.tsx', inviteModal, 'utf8');
console.log('Updated InviteUserModal.tsx');
