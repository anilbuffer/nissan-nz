const fs = require('fs');
const path = require('path');

// 1. Update DealerApprovalsView.tsx
const viewPath = path.join(__dirname, '..', 'components', 'admin', 'DealerApprovalsView.tsx');
let viewContent = fs.readFileSync(viewPath, 'utf8').replace(/\r\n/g, '\n');

// Replace navigation top bar breadcrumbs
const navTarget = `          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setSelectedDealerId(null);
                setDetailSelectedZone(null);
              }}
              className="btn-outline"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Dealers Overview</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Platform Operations</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Franchise Dealers</span>
              <span>/</span>
              <span className="font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                {dealer.dealerCode}
              </span>
            </div>
          </div>`;

const navReplacement = `          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setSelectedDealerId(null);
              setDetailSelectedZone(null);
            }}
            className="btn-outline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Dealers Overview</span>
          </button>`;

if (!viewContent.includes(navTarget)) {
  console.error("navTarget not found in DealerApprovalsView.tsx!");
  process.exit(1);
}
viewContent = viewContent.replace(navTarget, navReplacement);

// Replace 4-stat sub-labels
const statTarget = `        {/* 4-Stat Executive Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Assigned Pricing Zone
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealer.pricingZoneId}
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              \${currentZoneConfig.deliveryCostNZD.toLocaleString()} NZD Towing Schedule
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Active Exclusivity Holds
            </span>
            <div className="text-xl font-bold text-amber-700 font-mono">
              {dealerHolds.length} Vehicles
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              24-Hour Atomic Locks
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Total Wholesale Orders
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealerOrders.length} Shipments
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              Confirmed Japan RoRo
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Authorized Staff Accounts
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealerUsers.length || 1} Registered
            </div>
            <span className="text-xs text-emerald-600 font-semibold block truncate">
              MFA Security Active
            </span>
          </div>
        </div>`;

const statReplacement = `        {/* 4-Stat Executive Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Assigned Pricing Zone
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealer.pricingZoneId}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Active Exclusivity Holds
            </span>
            <div className="text-xl font-bold text-amber-700 font-mono">
              {dealerHolds.length} Vehicles
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Total Wholesale Orders
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealerOrders.length} Shipments
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Authorized Staff Accounts
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealerUsers.length || 1} Registered
            </div>
          </div>
        </div>`;

if (!viewContent.includes(statTarget)) {
  console.error("statTarget not found in DealerApprovalsView.tsx!");
  process.exit(1);
}
viewContent = viewContent.replace(statTarget, statReplacement);

fs.writeFileSync(viewPath, viewContent.replace(/\n/g, '\r\n'), 'utf8');
console.log("Updated DealerApprovalsView.tsx successfully!");

// 2. Update DealerDetailsModal.tsx sub-spans as well for consistency
const modalPath = path.join(__dirname, '..', 'components', 'admin', 'DealerDetailsModal.tsx');
if (fs.existsSync(modalPath)) {
  let modalContent = fs.readFileSync(modalPath, 'utf8').replace(/\r\n/g, '\n');
  modalContent = modalContent.replace(/<span className="text-xs text-slate-500 mt-0\.5 block">\$\{currentZoneConfig\.deliveryCostNZD\} Delivery<\/span>\n/g, '');
  modalContent = modalContent.replace(/<span className="text-xs text-slate-500 mt-0\.5 block">24h Exclusivity<\/span>\n/g, '');
  modalContent = modalContent.replace(/<span className="text-xs text-slate-500 mt-0\.5 block">Confirmed RoRo<\/span>\n/g, '');
  modalContent = modalContent.replace(/<span className="text-xs text-slate-600 font-medium mt-0\.5 block">MFA Enabled<\/span>\n/g, '');
  fs.writeFileSync(modalPath, modalContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log("Updated DealerDetailsModal.tsx successfully!");
}

