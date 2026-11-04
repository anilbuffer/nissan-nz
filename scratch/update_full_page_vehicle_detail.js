const fs = require('fs');

const filePath = 'components/dealer/FullPageVehicleDetail.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
if (!content.includes('SameModelVehiclesShowcase')) {
  content = content.replace(
    'import AddVehicleAdditionalCostModal from "@/components/admin/AddVehicleAdditionalCostModal";',
    'import AddVehicleAdditionalCostModal from "@/components/admin/AddVehicleAdditionalCostModal";\nimport SameModelVehiclesShowcase from "@/components/common/SameModelVehiclesShowcase";\nimport { getModelAngleImages, getAngleLabel } from "@/lib/vehicle-media";'
  );
}
if (!content.includes('Camera,')) {
  content = content.replace('ArrowLeft,', 'ArrowLeft,\n  Camera,');
}

// 2. images array memoization
const targetImages = `  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : ["/images/cars/dayz.png"];
  const activeImage = images[activeImageIdx] || images[0];`;

const replacementImages = `  const images = useMemo(() => {
    const existing = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];
    if (existing.length > 1) return existing;
    return getModelAngleImages(vehicle.model, existing[0]);
  }, [vehicle]);
  const activeImage = images[activeImageIdx] || images[0];`;

content = content.replace(targetImages.replace(/\n/g, '\r\n'), replacementImages.replace(/\n/g, '\r\n'));
if (!content.includes('getModelAngleImages(vehicle.model')) {
  content = content.replace(targetImages, replacementImages);
}

// 3. Stage image angle label pill
const targetZeroEmission = `{/* Zero Emission Emblem if Electric / Hybrid */}
                {isElectricOrHybrid && (
                  <div className="absolute top-4 right-4 z-20 hidden sm:block">
                    <ZeroEmissionBadge />
                  </div>
                )}`;

const replacementZeroEmission = `{/* Zero Emission Emblem if Electric / Hybrid */}
                {isElectricOrHybrid && (
                  <div className="absolute top-4 right-4 z-20 hidden sm:block">
                    <ZeroEmissionBadge />
                  </div>
                )}

                {/* Studio Angle Indicator Pill */}
                <div className={\`absolute \${isElectricOrHybrid ? "top-14" : "top-4"} right-4 z-20 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-[11px] font-mono text-white flex items-center gap-1.5 shadow-soft\`}>
                  <Camera className="w-3.5 h-3.5 text-rose-400" />
                  <span>{getAngleLabel(activeImage, activeImageIdx)}</span>
                </div>`;

content = content.replace(targetZeroEmission.replace(/\n/g, '\r\n'), replacementZeroEmission.replace(/\n/g, '\r\n'));
if (!content.includes('Studio Angle Indicator Pill')) {
  content = content.replace(targetZeroEmission, replacementZeroEmission);
}

// 4. Thumbnails with angle labels
const targetThumbnails = `              {/* Thumbnail Gallery Strip */}
              {images.length > 1 && (
                <div className="space-y-1.5 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    High-Resolution Studio Angles ({images.length})
                  </span>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          audio.playSubtleClick();
                          setActiveImageIdx(idx);
                        }}
                        className={\`w-20 h-14 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 \${activeImageIdx === idx
                          ? "border-slate-900 ring-2 ring-slate-900/10 bg-white"
                          : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                          }\`}
                      >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}`;

const replacementThumbnails = `              {/* Thumbnail Gallery Strip */}
              {images.length > 1 && (
                <div className="space-y-1.5 mt-4">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Multi-Angle Studio Gallery ({images.length} Perspectives)
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-500">
                      Angle: {getAngleLabel(activeImage, activeImageIdx)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {images.map((img, idx) => {
                      const label = getAngleLabel(img, idx);
                      const isActive = activeImageIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            setActiveImageIdx(idx);
                          }}
                          className={\`min-w-[84px] h-16 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 flex flex-col justify-between items-center \${isActive
                            ? "border-slate-900 ring-2 ring-slate-900/10 bg-white shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                            }\`}
                          title={label}
                        >
                          <img src={img} alt={label} className="w-full h-8 object-contain" />
                          <span className="text-[9px] font-mono font-semibold text-slate-600 text-center truncate max-w-[80px] block leading-tight">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}`;

content = content.replace(targetThumbnails.replace(/\n/g, '\r\n'), replacementThumbnails.replace(/\n/g, '\r\n'));
if (!content.includes('Multi-Angle Studio Gallery')) {
  content = content.replace(targetThumbnails, replacementThumbnails);
}

// 5. Add SameModelVehiclesShowcase right after the main row
const targetAfterRow = `                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-2.5 text-[10px] text-slate-400 pt-1 flex-wrap">
                    <span>✓ Zero Initial Deposit</span>
                    <span>•</span>
                    <span>✓ 24h Price Guarantee</span>
                    <span>•</span>
                    <span>✓ JEVIC &amp; MR2A Included</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>`;

const replacementAfterRow = `                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-2.5 text-[10px] text-slate-400 pt-1 flex-wrap">
                    <span>✓ Zero Initial Deposit</span>
                    <span>•</span>
                    <span>✓ 24h Price Guarantee</span>
                    <span>•</span>
                    <span>✓ JEVIC &amp; MR2A Included</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3.4 Multiple Sibling Units of Same Model in Central Fleet   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <SameModelVehiclesShowcase
          currentVehicle={vehicle}
          allVehicles={vehicles}
          isAdmin={isAdmin}
          portal={isAdmin ? "admin" : "dealer"}
        />
      </div>`;

content = content.replace(targetAfterRow.replace(/\n/g, '\r\n'), replacementAfterRow.replace(/\n/g, '\r\n'));
if (!content.includes('Multiple Sibling Units of Same Model')) {
  content = content.replace(targetAfterRow, replacementAfterRow);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated FullPageVehicleDetail.tsx');

