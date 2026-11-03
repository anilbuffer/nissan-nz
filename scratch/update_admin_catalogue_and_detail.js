const fs = require('fs');

// 1. Update DealerStockCatalog.tsx
const catalogPath = 'components/dealer/DealerStockCatalog.tsx';
let catalog = fs.readFileSync(catalogPath, 'utf8');

// Replace handleOpenFullPageDetails so it doesn't open the modal for Admin, but calls onSelectVehicle or navigates to /admin/vehicles/${vehicleId}
const oldHandleOpen = `  // Navigate directly to FULL PAGE Vehicle Details (INSIDE PORTAL)
  const handleOpenFullPageDetails = (vehicleId: string) => {
    audio.playSubtleClick();
    if (isAdminView) {
      const veh = vehicles.find((item) => item.id === vehicleId);
      if (veh) setDossierVehicle(veh);
      return;
    }
    if (onSelectVehicle) {
      onSelectVehicle(vehicleId);
    } else {
      router.push(\`/dealer/vehicles/\${vehicleId}\`);
    }
  };`;

const newHandleOpen = `  // Navigate directly to FULL PAGE Vehicle Details (INSIDE PORTAL)
  const handleOpenFullPageDetails = (vehicleId: string) => {
    audio.playSubtleClick();
    if (onSelectVehicle) {
      onSelectVehicle(vehicleId);
    } else if (isAdminView) {
      router.push(\`/admin/vehicles/\${vehicleId}\`);
    } else {
      router.push(\`/dealer/vehicles/\${vehicleId}\`);
    }
  };`;

catalog = catalog.replace(oldHandleOpen, newHandleOpen);

// Update Header Banner for Admin
const oldHeaderRight = `        <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span><strong className="text-slate-900 font-mono font-bold">{availableCount}</strong> Available for Hold</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs">
            <span className="text-slate-400 font-normal">Pricing Zone:</span>
            <span className="font-extrabold font-mono text-[#0A1322]">{dealerZone}</span>
          </div>
        </div>`;

const newHeaderRight = `        <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
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
            <>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span><strong className="text-slate-900 font-mono font-bold">{availableCount}</strong> Available for Hold</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs">
                <span className="text-slate-400 font-normal">Pricing Zone:</span>
                <span className="font-extrabold font-mono text-[#0A1322]">{dealerZone}</span>
              </div>
            </>
          )}
        </div>`;

catalog = catalog.replace(oldHeaderRight, newHeaderRight);

// Update grid card button for admin
catalog = catalog.replace(
  `                    {isAdminView ? (
                      isAvailable ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFullPageDetails(vehicle.id);
                          }}
                          className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push("/admin/reservations");
                          }}
                          className="btn-outline py-2 px-3.5 rounded-xl text-amber-900 text-xs font-bold font-mono flex items-center gap-1.5 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Inspect Hold</span>
                        </button>
                      )
                    ) :`,
  `                    {isAdminView ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFullPageDetails(vehicle.id);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Vehicle</span>
                      </button>
                    ) :`
);

fs.writeFileSync(catalogPath, catalog, 'utf8');
console.log("Successfully updated DealerStockCatalog.tsx!");

