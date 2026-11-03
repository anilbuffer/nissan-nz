const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '..', 'components', 'dealer', 'DealerStockCatalog.tsx');
let content = fs.readFileSync(catalogPath, 'utf8');

const oldHeaderBlock = `      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="pb-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isAdminView ? "Vehicle Catalogue" : "Vehicle Stock"} ({filteredVehicles.length})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdminView
                ? "Certified Japanese export inventory, condition grades, and landed pricing for New Zealand franchise dealers."
                : \`Landed wholesale inventory for \${currentDealer?.legalTradingName || "Auckland Nissan City Ltd"} (\${dealerZone})\`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
          {isAdminView ? (
            <>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span><strong className="text-slate-900 font-mono font-bold">{vehicles.length}</strong> Total Fleet</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span><strong className="text-slate-900 font-mono font-bold">{availableCount}</strong> Available in Japan</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs font-mono">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span><strong className="text-amber-800 font-bold">{vehicles.filter(v => v.status === "RESERVED").length}</strong> Active Holds</span>
              </div>
            </>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs">
              <span className="text-slate-400 font-normal">Pricing Zone:</span>
              <span className="font-extrabold font-mono text-[#0A0A0A]">{dealerZone}</span>
            </div>
          )}
        </div>
      </div>`;

const newHeaderBlock = `      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAdminView ? "Vehicle Catalogue" : "Vehicle Stock"} ({filteredVehicles.length})
          </h1>
          {isAdminView && (
            <p className="text-xs text-slate-500 mt-0.5">
              Certified Japanese export inventory, condition grades, and landed pricing for New Zealand franchise dealers.
            </p>
          )}
        </div>

        {isAdminView && (
          <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span><strong className="text-slate-900 font-mono font-bold">{vehicles.length}</strong> Total Fleet</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span><strong className="text-slate-900 font-mono font-bold">{availableCount}</strong> Available in Japan</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs font-mono">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span><strong className="text-amber-800 font-bold">{vehicles.filter(v => v.status === "RESERVED").length}</strong> Active Holds</span>
            </div>
          </div>
        )}
      </div>`;

const normContent = content.replace(/\r\n/g, '\n');
const normOld = oldHeaderBlock.replace(/\r\n/g, '\n');
const normNew = newHeaderBlock.replace(/\r\n/g, '\n');

if (normContent.includes(normOld)) {
  fs.writeFileSync(catalogPath, normContent.replace(normOld, normNew), 'utf8');
  console.log('Dealer subtitle and Pricing Zone badge removed successfully!');
} else {
  console.log('Could not find oldHeaderBlock');
}

