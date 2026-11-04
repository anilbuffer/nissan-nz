const fs = require('fs');

const filePath = 'components/japan/JapanInventoryDetailsView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
if (!content.includes('SameModelVehiclesShowcase')) {
  content = content.replace(
    'import { audio } from "@/lib/sound";',
    'import { audio } from "@/lib/sound";\nimport SameModelVehiclesShowcase from "@/components/common/SameModelVehiclesShowcase";\nimport { getModelAngleImages, getAngleLabel, getCanonicalModelName } from "@/lib/vehicle-media";'
  );
}
if (!content.includes('Camera,')) {
  content = content.replace('Car,', 'Camera,\n  Car,');
}

// 2. images array memoization
const targetImages = `  const images =
    vehicle.images && vehicle.images.length > 0 ? vehicle.images : ["/images/cars/kicks.png"];

  const activeImage = images[activeImageIdx] || images[0];`;

const replacementImages = `  const images = (vehicle.images && vehicle.images.length > 1)
    ? vehicle.images
    : getModelAngleImages(vehicle.model, vehicle.images?.[0] || "/images/cars/kicks.png");

  const activeImage = images[activeImageIdx] || images[0];`;

content = content.replace(targetImages.replace(/\n/g, '\r\n'), replacementImages.replace(/\n/g, '\r\n'));
if (!content.includes('getModelAngleImages(vehicle.model')) {
  content = content.replace(targetImages, replacementImages);
}

// 3. Stage image angle label pill & Thumbnails with labels
const targetStageThumb = `                {/* Yard Location Pill */}
                <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/90 font-mono text-xs flex items-center gap-1.5 shadow-soft">
                  <MapPin className="w-3.5 h-3.5 text-[#C3002F]" />
                  <span>{vehicle.location || "Yokohama Export Terminal"}</span>
                </div>
              </div>

              {/* Thumbnail Gallery Strip */}
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
                          ? "border-[#C3002F] ring-2 ring-[#C3002F]/20 bg-white"
                          : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                          }\`}
                      >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}`;

const replacementStageThumb = `                {/* Studio Angle Indicator Pill */}
                <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-[11px] font-mono text-white flex items-center gap-1.5 shadow-soft">
                  <Camera className="w-3.5 h-3.5 text-rose-400" />
                  <span>{getAngleLabel(activeImage, activeImageIdx)}</span>
                </div>

                {/* Yard Location Pill */}
                <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/90 font-mono text-xs flex items-center gap-1.5 shadow-soft">
                  <MapPin className="w-3.5 h-3.5 text-[#C3002F]" />
                  <span>{vehicle.location || "Yokohama Export Terminal"}</span>
                </div>
              </div>

              {/* Thumbnail Gallery Strip */}
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
                            ? "border-[#C3002F] ring-2 ring-[#C3002F]/20 bg-white shadow-2xs"
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

content = content.replace(targetStageThumb.replace(/\n/g, '\r\n'), replacementStageThumb.replace(/\n/g, '\r\n'));
if (!content.includes('Multi-Angle Studio Gallery (')) {
  content = content.replace(targetStageThumb, replacementStageThumb);
}

// 4. SameModelVehiclesShowcase before Return Navigation
const targetBeforeNav = `        {/* Pinned Cryptographic Status Footer */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Cryptographic Export Register</span>
          <span className="text-slate-700 font-bold">SHA-256 Verified</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Bottom Return Navigation                                 */}`;

const replacementBeforeNav = `        {/* Pinned Cryptographic Status Footer */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Cryptographic Export Register</span>
          <span className="text-slate-700 font-bold">SHA-256 Verified</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4.5 Matching Model Fleet Units in Japan Staging             */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <SameModelVehiclesShowcase
          currentVehicle={vehicle}
          allVehicles={vehicles}
          isAdmin={true}
          portal="japan"
          title={\`Fleet Depth · Other \${getCanonicalModelName(vehicle.model)} Units in Japan Yard Staging\`}
        />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Bottom Return Navigation                                 */}`;

content = content.replace(targetBeforeNav.replace(/\n/g, '\r\n'), replacementBeforeNav.replace(/\n/g, '\r\n'));
if (!content.includes('Matching Model Fleet Units in Japan Staging')) {
  content = content.replace(targetBeforeNav, replacementBeforeNav);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated JapanInventoryDetailsView.tsx');

