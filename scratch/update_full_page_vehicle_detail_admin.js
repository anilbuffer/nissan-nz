const fs = require('fs');

const filePath = 'components/dealer/FullPageVehicleDetail.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Unlock to imports if not present
if (!content.includes('Unlock,')) {
  content = content.replace('Lock,', 'Lock,\r\n  Unlock,');
  if (!content.includes('Unlock,')) {
    content = content.replace('Lock,', 'Lock,\n  Unlock,');
  }
}

// 2. Update handleBack function to respect isAdmin
content = content.replace(
  `  const handleBack = () => {
    audio.playSubtleClick();
    if (onBack) {
      onBack();
    } else {
      router.push("/dealer/stocks");
    }
  };`,
  `  const handleBack = () => {
    audio.playSubtleClick();
    if (onBack) {
      onBack();
    } else if (isAdmin) {
      router.push("/admin/catalogue");
    } else {
      router.push("/dealer/stocks");
    }
  };`
);

// 3. Update top breadcrumbs & header for admin
const oldTopBreadcrumbs = `<button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Stock Catalog</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <button
              type="button"
              onClick={handleBack}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Stock Catalog
            </button>`;

const newTopBreadcrumbs = `<button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isAdmin ? "Back to Catalogue" : "Back to Stock Catalog"}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <button
              type="button"
              onClick={handleBack}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isAdmin ? "Vehicle Catalogue" : "Stock Catalog"}
            </button>`;

content = content.replace(oldTopBreadcrumbs, newTopBreadcrumbs);

// 4. Update top-right badge for admin
const oldTopRight = `{/* Right: Clean Status & Pricing Tier Profile */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile:</span>
            <span className="text-slate-800">{dealerZone} Landed</span>
          </div>

          {vehicle.status === "AVAILABLE" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for Allocation</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Active 24-Hour Hold</span>
            </span>
          )}
        </div>`;

const newTopRight = `{/* Right: Clean Status & Pricing Tier Profile */}
        <div className="flex items-center gap-2.5">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Autohub Operations Authority</span>
              </span>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                Zone 1–5 Schedule Active
              </span>
            </div>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile:</span>
                <span className="text-slate-800">{dealerZone} Landed</span>
              </div>

              {vehicle.status === "AVAILABLE" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available for Allocation</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Active 24-Hour Hold</span>
                </span>
              )}
            </>
          )}
        </div>`;

content = content.replace(oldTopRight, newTopRight);

// 5. Replace right column Wholesale Economics & Action buttons for Admin
const oldRightColEconomics = `{/* Clean Light Wholesale Margin Box (NO DARK BACKGROUND) */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Wholesale Economics
                  </span>
                  <div className="text-xl font-black font-mono tracking-tight text-slate-900 mt-0.5">
                    \${price.totalBuyPriceNZD.toLocaleString()} <span className="text-xs font-normal text-slate-500">Landed</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Projected Dealer Margin</span>
                  <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-mono text-xs font-bold shadow-2xs">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+\${dealerMarginNZD.toLocaleString()} NZD ({marginPercentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Progress Indicator for Margin */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Landed Buy: <strong className="text-slate-900 font-mono">\${price.totalBuyPriceNZD.toLocaleString()}</strong></span>
                  <span>Est. NZ Retail: <strong className="text-emerald-700 font-mono font-bold">\${retailEstimateNZD.toLocaleString()}</strong></span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden flex">
                  <div style={{ width: \`\${Math.round((price.totalBuyPriceNZD / retailEstimateNZD) * 100)}%\` }} className="bg-[#0A1322] h-full" />
                  <div style={{ width: \`\${Math.round((dealerMarginNZD / retailEstimateNZD) * 100)}%\` }} className="bg-emerald-500 h-full" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">
                  Delivery Zone: <strong className="text-slate-900 font-mono font-bold">{dealerZone}</strong>
                </span>
                <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All duties &amp; MR2A pass included
                </span>
              </div>
            </div>`;

const newRightColEconomics = `{isAdmin ? (
              /* Admin Authority: 5-Zone Landed Pricing Schedule */
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Comparative Landed Price Matrix
                    </span>
                    <strong className="text-xs text-slate-900">Standard Formula (15% GST + MR2A Included)</strong>
                  </div>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    Fixed Landed
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { zone: "ZONE_1", name: "Upper North Island (Auckland Direct)" },
                    { zone: "ZONE_2", name: "Central North Island (Waikato / BOP)" },
                    { zone: "ZONE_3", name: "Lower North Island (Wellington / Hawkes Bay)" },
                    { zone: "ZONE_4", name: "Upper South Island (Canterbury / Nelson)" },
                    { zone: "ZONE_5", name: "Lower South Island (Otago / Southland)" },
                  ].map((z) => {
                    const zPrice = calculateLandedPrice(vehicle.fobPriceJPY, z.zone as any);
                    return (
                      <div key={z.zone} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {z.zone}
                          </span>
                          <span className="text-[11px] text-slate-600 truncate max-w-[180px]">{z.name}</span>
                        </div>
                        <strong className="font-mono font-bold text-slate-900 text-xs">
                          \${zPrice.totalBuyPriceNZD.toLocaleString()} NZD
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              ${oldRightColEconomics}
            )}`;

content = content.replace(oldRightColEconomics, newRightColEconomics);

// 6. Update action buttons block for Admin vs Dealer
const oldActionButtonsBlock = `{/* Primary Action Button: Simple, High-Conversion Naming */}
            <div className="space-y-3 pt-1">
              {isAdmin ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-100 text-slate-900 flex items-center justify-between text-xs border border-slate-200">
                    <span className="text-slate-500">Administrative Authority:</span>
                    <span className="font-mono font-bold text-rose-600">Status: {vehicle.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        router.push("/admin/inventory");
                      }}
                      className="btn-outline py-3 px-3 rounded-xl text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
                    >
                      Inventory Controller
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        router.push("/admin/reservations");
                      }}
                      className="py-3 px-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs transition-colors cursor-pointer text-center shadow-xs"
                    >
                      Reservations Queue
                    </button>
                  </div>
                </div>
              ) : vehicle.status === "AVAILABLE" ? (`;

const newActionButtonsBlock = `{/* Primary Action Button: Simple, High-Conversion Naming */}
            <div className="space-y-3 pt-1">
              {isAdmin ? (
                <div className="space-y-3">
                  {vehicle.status === "RESERVED" ? (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span>Active 24h Exclusivity Hold</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold bg-white text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                          18h 42m Left
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Locked by <strong className="text-amber-950">Auckland Nissan City Ltd (NZ-NIS-AKL01)</strong>. Price is guaranteed under Section 4 Commercial Boundary.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSuccessChime();
                            alert("Wholesale allocation confirmed for " + vehicle.stockId + ". Dispatched to shipping pipeline.");
                            router.push("/admin/orders");
                          }}
                          className="py-2.5 px-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Order</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            alert("Exclusivity hold released for " + vehicle.stockId + ". Vehicle returned to wholesale catalog.");
                            router.push("/admin/reservations");
                          }}
                          className="btn-outline py-2.5 px-3 rounded-xl text-slate-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Release Lock</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Administrative Operational Status:</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Available in Japan Stock
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            router.push("/admin/inventory");
                          }}
                          className="btn-outline py-3 px-3 rounded-xl text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
                        >
                          Inventory Controller
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            router.push("/admin/orders");
                          }}
                          className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer text-center shadow-xs"
                        >
                          Orders Pipeline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : vehicle.status === "AVAILABLE" ? (`;

content = content.replace(oldActionButtonsBlock, newActionButtonsBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated FullPageVehicleDetail.tsx for Admin view!");

