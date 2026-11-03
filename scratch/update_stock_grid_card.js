const fs = require('fs');

const filePath = 'components/dealer/DealerStockCatalog.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = '{filteredVehicles.map((vehicle) => {';
const targetGridSectionStart = '/* 4A. GRID LAYOUT: Ultra-Clean Luxury Automotive Showcase   */';
const targetListSectionStart = '/* 4B. LIST LAYOUT: Clean Luxury Automotive Rows             */';

const startIndex = content.indexOf(targetGridSectionStart);
const endIndex = content.indexOf(targetListSectionStart);

if (startIndex === -1 || endIndex === -1) {
  console.error("Could not find grid section boundaries!");
  process.exit(1);
}

const before = content.slice(0, startIndex);
const after = content.slice(endIndex);

const newGridContent = `/* 4A. GRID LAYOUT: Ultra-Clean Luxury Automotive Showcase   */
        /* (Names Full-Width, Hero Studio Car, Price Left & Action Button Right) */
        /* ───────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-5 sm:gap-6 animate-in fade-in duration-300">
          {filteredVehicles.map((vehicle) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const isFav = !!favorites[vehicle.id];

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[28px] border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer p-6 sm:p-7 relative overflow-hidden"
              >
                <div>
                  {/* Card Top Row: Full Width Name + Model, with Arrow & Favorite on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#E11D48] transition-colors leading-snug">
                        {vehicle.make} - {vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {vehicle.year} · {vehicle.fuelType} · Grade {vehicle.auctionGrade}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, vehicle.id)}
                        aria-label="Add to favorites"
                        className={\`p-2 rounded-full transition-all cursor-pointer \${
                          isFav
                            ? "text-[#E11D48] bg-[#E11D48]/10"
                            : "text-slate-300 hover:text-[#E11D48] hover:bg-slate-50"
                        }\`}
                      >
                        <Heart className={\`w-4 h-4 \${isFav ? "fill-[#E11D48]" : ""}\`} />
                      </button>
                      <div
                        className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#E11D48] text-slate-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0"
                        title="View Full Vehicle Details"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Center: Floating Studio Car with Realistic Floor Shadow */}
                  <div className="relative w-full h-44 sm:h-52 my-3 flex items-center justify-center">
                    <div className="absolute bottom-2.5 w-4/5 h-3.5 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />

                    <img
                      src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                      alt={\`\${vehicle.make} \${vehicle.model}\`}
                      className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_12px_16px_rgba(0,0,0,0.12)] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 ease-out select-none"
                    />

                    {!isAvailable && (
                      <div className="absolute bottom-1 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-500/30 shadow-lg text-[11px] font-mono font-bold animate-in fade-in">
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>
                          {isAdminView
                            ? (vehicle.reservedByDealerId === "DEALER_002" ? "Held by BOP Nissan" : "Held by Auckland Nissan")
                            : vehicle.reservedByDealerId === currentDealer?.id
                            ? "Your Active Hold (18h left)"
                            : "24h Exclusivity Lock Active"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Price on Left, Action Button on Right */}
                <div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block leading-tight">
                      \${price.totalBuyPriceNZD.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {isAdminView ? \`FOB ¥\${vehicle.fobPriceJPY.toLocaleString()}\` : "NZD Landed"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAdminView ? (
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
                    ) : isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setReserveVehicle(vehicle);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Hold (24h)</span>
                      </button>
                    ) : vehicle.reservedByDealerId === currentDealer?.id ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/dealer/orders");
                        }}
                        className="py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>My Active Hold</span>
                      </button>
                    ) : (
                      <span className="py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-400 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Unavailable</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        `;

content = before + newGridContent + after;
fs.writeFileSync(filePath, content, 'utf8');
console.log("DealerStockCatalog.tsx successfully updated with clean grid card!");

