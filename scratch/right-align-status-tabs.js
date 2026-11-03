const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '..', 'components', 'dealer', 'DealerStockCatalog.tsx');
let content = fs.readFileSync(catalogPath, 'utf8');

const oldHeaderAndTabs = `      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header with In Stock count (mirroring reference)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-200">
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
      </div>

      {/* Scope Status Tabs: All Stock vs Available for Hold vs On Exclusivity Hold */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            setStatusFilter("ALL");
          }}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 \${statusFilter === "ALL"
            ? "bg-[#0A0A0A] text-white shadow-xs"
            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }\`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>All Stock</span>
          <span className={\`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] \${statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }\`}>
            {vehicles.filter((v) => v.status !== "WITHDRAWN").length}
          </span>
        </button>



        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            setStatusFilter("HELD");
          }}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 \${statusFilter === "HELD"
            ? "bg-[#0A0A0A] text-white shadow-xs"
            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }\`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>On Exclusivity Hold</span>
          <span className={\`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] \${statusFilter === "HELD" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            }\`}>
            {vehicles.filter((v) => v.status === "RESERVED").length}
          </span>
        </button>
      </div>`;

const newHeaderAndTabs = `      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header with Vehicle Stock Title & Right-Aligned Tabs     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
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

        {/* Right-Aligned Status Tabs in Dealer View (or Admin Fleet Badges) */}
        {!isAdminView ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setStatusFilter("ALL");
              }}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 \${statusFilter === "ALL"
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                }\`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>All Stock</span>
              <span className={\`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] \${statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }\`}>
                {vehicles.filter((v) => v.status !== "WITHDRAWN").length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setStatusFilter("HELD");
              }}
              className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 \${statusFilter === "HELD"
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                }\`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>On Exclusivity Hold</span>
              <span className={\`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] \${statusFilter === "HELD" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                }\`}>
                {vehicles.filter((v) => v.status === "RESERVED").length}
              </span>
            </button>
          </div>
        ) : (
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

let norm = content.replace(/\r\n/g, '\n');
const normOld = oldHeaderAndTabs.replace(/\r\n/g, '\n');
const normNew = newHeaderAndTabs.replace(/\r\n/g, '\n');

if (norm = norm.replace(normOld, normNew)) {
  fs.writeFileSync(catalogPath, norm, 'utf8');
  console.log('Successfully right-aligned All Stock and On Exclusivity Hold tabs next to Vehicle Stock!');
} else {
  console.log('Could not find oldHeaderAndTabs block.');
}

