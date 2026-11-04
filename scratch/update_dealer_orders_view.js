const fs = require('fs');

const filePath = 'components/dealer/DealerOrdersView.tsx';
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

// 2. Enrich images in selectedOrder vehicle view
const targetImages = `                    const mockMatch = MOCK_VEHICLES.find((m) => m.id === selectedOrder.vehicle.id);
                    const images = (mockMatch?.images || selectedOrder.vehicle.images || []).length > 0
                      ? (mockMatch?.images || selectedOrder.vehicle.images || [])
                      : [selectedOrder.vehicle.images?.[0] || "/images/cars/kicks.png"];`;

const replacementImages = `                    const mockMatch = MOCK_VEHICLES.find((m) => m.id === selectedOrder.vehicle.id);
                    const existingImages = (mockMatch?.images || selectedOrder.vehicle.images || []);
                    const images = existingImages.length > 1
                      ? existingImages
                      : getModelAngleImages(selectedOrder.vehicle.model, existingImages[0] || selectedOrder.vehicle.images?.[0] || "/images/cars/kicks.png");`;

content = content.replace(targetImages.replace(/\n/g, '\r\n'), replacementImages.replace(/\n/g, '\r\n'));
if (!content.includes('getModelAngleImages(selectedOrder.vehicle.model')) {
  content = content.replace(targetImages, replacementImages);
}

// 3. Stage image angle label pill & Thumbnails with labels
const targetStageThumb = `                              {/* Car Canvas */}
                              <div className="relative flex-1 min-h-[250px] sm:min-h-[280px] w-full flex items-center justify-center my-auto py-2">
                                {/* Studio floor shadow */}
                                <div className="absolute bottom-2 w-4/5 h-4 bg-black/10 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />

                                {/* High-res Studio Cutout Car */}
                                <img
                                  src={images[activeImageIdx] || images[0]}
                                  alt={\`\${selectedOrder.vehicle.make} \${selectedOrder.vehicle.model}\`}
                                  className="w-full max-h-[260px] sm:max-h-[290px] select-none transition-all duration-200 relative z-10 object-contain filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.10)]"
                                />

                                {isElectricOrHybrid && (
                                  <div className="absolute top-1 right-2 z-20 hidden sm:block">
                                    <ZeroEmissionBadge />
                                  </div>
                                )}
                              </div>

                              {/* Horizontal Angle Thumbnails Row */}
                              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 border-t border-slate-100 mt-auto">
                                {images.map((img, idx) => {
                                  const isActive = activeImageIdx === idx;
                                  return (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        audio.playSubtleClick();
                                        setActiveImageIdx(idx);
                                      }}
                                      className={\`w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden p-0.5 transition-all cursor-pointer flex items-center justify-center bg-white shrink-0 \${isActive
                                        ? "border-2 border-[#C3002F] shadow-2xs"
                                        : "border border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                                        }\`}
                                    >
                                      <img
                                        src={img}
                                        alt={\`Thumbnail \${idx + 1}\`}
                                        className="w-full h-full object-contain"
                                      />
                                    </button>
                                  );
                                })}
                              </div>`;

const replacementStageThumb = `                              {/* Car Canvas */}
                              <div className="relative flex-1 min-h-[250px] sm:min-h-[280px] w-full flex items-center justify-center my-auto py-2">
                                {/* Studio floor shadow */}
                                <div className="absolute bottom-2 w-4/5 h-4 bg-black/10 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />

                                {/* High-res Studio Cutout Car */}
                                <img
                                  src={images[activeImageIdx] || images[0]}
                                  alt={\`\${selectedOrder.vehicle.make} \${selectedOrder.vehicle.model}\`}
                                  className="w-full max-h-[260px] sm:max-h-[290px] select-none transition-all duration-200 relative z-10 object-contain filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.10)]"
                                />

                                {/* Studio Angle Indicator Pill */}
                                <div className="absolute top-1 left-2 z-20 px-2.5 py-0.5 rounded-full bg-slate-900/85 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 shadow-2xs">
                                  <Camera className="w-3 h-3 text-rose-400" />
                                  <span>{getAngleLabel(images[activeImageIdx] || images[0], activeImageIdx)}</span>
                                </div>

                                {isElectricOrHybrid && (
                                  <div className="absolute top-1 right-2 z-20 hidden sm:block">
                                    <ZeroEmissionBadge />
                                  </div>
                                )}
                              </div>

                              {/* Horizontal Angle Thumbnails Row */}
                              <div className="space-y-1 pt-3 border-t border-slate-100 mt-auto">
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
                                  <span>Multi-Angle Studio Photos ({images.length})</span>
                                  <span className="text-slate-600 font-semibold">{getAngleLabel(images[activeImageIdx] || images[0], activeImageIdx)}</span>
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
                                  {images.map((img, idx) => {
                                    const isActive = activeImageIdx === idx;
                                    const label = getAngleLabel(img, idx);
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          audio.playSubtleClick();
                                          setActiveImageIdx(idx);
                                        }}
                                        className={\`w-16 h-12 rounded-lg overflow-hidden p-1 transition-all cursor-pointer flex flex-col items-center justify-between bg-white shrink-0 \${isActive
                                          ? "border-2 border-[#C3002F] shadow-2xs"
                                          : "border border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                                          }\`}
                                        title={label}
                                      >
                                        <img
                                          src={img}
                                          alt={label}
                                          className="w-full h-6 object-contain"
                                        />
                                        <span className="text-[8px] font-mono font-medium text-slate-600 truncate block text-center max-w-[58px]">
                                          {label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>`;

content = content.replace(targetStageThumb.replace(/\n/g, '\r\n'), replacementStageThumb.replace(/\n/g, '\r\n'));
if (!content.includes('Multi-Angle Studio Photos (')) {
  content = content.replace(targetStageThumb, replacementStageThumb);
}

// 4. SameModelVehiclesShowcase at the bottom of the order view
const targetBottomOrder = `                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-bold shadow-2xs self-start sm:self-auto">
                      Delivery Zone: {selectedOrder.pricingZoneId}
                    </span>
                  </div>
                </div>
              )}`;

const replacementBottomOrder = `                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-bold shadow-2xs self-start sm:self-auto">
                      Delivery Zone: {selectedOrder.pricingZoneId}
                    </span>
                  </div>
                </div>

                {/* Sibling / Same Model Fleet Availability in Pipeline */}
                <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                  <SameModelVehiclesShowcase
                    currentVehicle={selectedOrder.vehicle}
                    allVehicles={vehicles}
                    isAdmin={false}
                    portal="dealer"
                    title={\`Matching Model Fleet Pipeline · Other \${getCanonicalModelName(selectedOrder.vehicle.model)} Units in Stock\`}
                  />
                </div>
              )}`;

content = content.replace(targetBottomOrder.replace(/\n/g, '\r\n'), replacementBottomOrder.replace(/\n/g, '\r\n'));
if (!content.includes('Matching Model Fleet Pipeline')) {
  content = content.replace(targetBottomOrder, replacementBottomOrder);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated DealerOrdersView.tsx');

