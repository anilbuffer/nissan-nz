const fs = require('fs');

// 1. FullPageVehicleDetail.tsx
{
  const p = 'components/dealer/FullPageVehicleDetail.tsx';
  let c = fs.readFileSync(p, 'utf8');

  // Remove floating studio angle pill
  c = c.replace(
    /\r?\n\s*\{\/\* Studio Angle Indicator Pill \*\/\}[\s\S]*?<\/div>/,
    ''
  );

  // Remove Angle: label above thumbnails and clean thumbnails
  const oldThumbRegex = /\{\/\* Thumbnail Gallery Strip \*\/\}[\s\S]*?\{\/\* Pinned Studio Badge Footer \*\/\}/;
  const newThumbSection = `{/* Thumbnail Gallery Strip */}
              {images.length > 1 && (
                <div className="space-y-1.5 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Multi-Angle Gallery ({images.length} Perspectives)
                  </span>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
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
                          className={\`w-20 h-14 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 flex items-center justify-center \${isActive
                            ? "border-slate-900 ring-2 ring-slate-900/10 bg-white shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                            }\`}
                        >
                          <img src={img} alt="Vehicle Perspective" className="w-full h-full object-contain" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pinned Studio Badge Footer */}`;

  c = c.replace(oldThumbRegex, newThumbSection);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Updated FullPageVehicleDetail.tsx');
}

// 2. JapanInventoryDetailsView.tsx
{
  const p = 'components/japan/JapanInventoryDetailsView.tsx';
  let c = fs.readFileSync(p, 'utf8');

  // Remove floating studio angle pill
  c = c.replace(
    /\r?\n\s*\{\/\* Studio Angle Indicator Pill \*\/\}[\s\S]*?<\/div>/,
    ''
  );

  // Remove Angle: label above thumbnails and clean thumbnails
  const oldThumbRegex = /\{\/\* Thumbnail Gallery Strip \*\/\}[\s\S]*?\{\/\* Pinned Studio Badge Footer \*\/\}/;
  const newThumbSection = `{/* Thumbnail Gallery Strip */}
              {images.length > 1 && (
                <div className="space-y-1.5 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    Multi-Angle Gallery ({images.length} Perspectives)
                  </span>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
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
                          className={\`w-20 h-14 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 flex items-center justify-center \${isActive
                            ? "border-[#C3002F] ring-2 ring-[#C3002F]/20 bg-white shadow-2xs"
                            : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                            }\`}
                        >
                          <img src={img} alt="Vehicle Perspective" className="w-full h-full object-contain" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pinned Studio Badge Footer */}`;

  c = c.replace(oldThumbRegex, newThumbSection);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Updated JapanInventoryDetailsView.tsx');
}

// 3. CatalogueDetailsModal.tsx
{
  const p = 'components/admin/CatalogueDetailsModal.tsx';
  let c = fs.readFileSync(p, 'utf8');

  // Remove floating camera badge
  c = c.replace(
    /\r?\n\s*<div className="absolute top-3 right-3 z-20 px-2\.5 py-1 rounded-full bg-slate-900\/80[\s\S]*?<\/div>/,
    ''
  );

  // Clean thumbnails section
  const oldThumbRegex = /\{\/\* Thumbnails with angle indicators \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  const newThumbSection = `{/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mt-3">
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
                        className={\`w-16 h-12 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 flex items-center justify-center \${isActive
                          ? "border-[#C3002F] ring-2 ring-[#C3002F]/20 bg-white"
                          : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                          }\`}
                      >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>`;

  c = c.replace(oldThumbRegex, newThumbSection);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Updated CatalogueDetailsModal.tsx');
}

// 4. ReservationDetailsModal.tsx
{
  const p = 'components/admin/ReservationDetailsModal.tsx';
  let c = fs.readFileSync(p, 'utf8');

  // Remove top-1.5 camera badge from active image container
  c = c.replace(
    /\r?\n\s*<div className="absolute top-1\.5 right-1\.5 px-1\.5 py-0\.5 rounded-full bg-slate-900\/80 text-\[8px\][\s\S]*?<\/div>/,
    ''
  );

  // Remove Angles header text above thumbnail strip
  c = c.replace(
    /<div className="flex items-center justify-between text-\[10px\] font-mono text-slate-400">\s*<span>Angles \(\d+\)<\/span>[\s\S]*?<\/div>/,
    ''
  );

  fs.writeFileSync(p, c, 'utf8');
  console.log('Updated ReservationDetailsModal.tsx');
}

// 5. DealerOrdersView.tsx
{
  const p = 'components/dealer/DealerOrdersView.tsx';
  let c = fs.readFileSync(p, 'utf8');

  // Remove floating studio angle pill
  c = c.replace(
    /\r?\n\s*\{\/\* Studio Angle Indicator Pill \*\/\}[\s\S]*?<\/div>/,
    ''
  );

  // Clean thumbnails section
  const oldThumbRegex = /\{\/\* Horizontal Angle Thumbnails Row \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
  const newThumbSection = `{/* Horizontal Angle Thumbnails Row */}
                              {images.length > 1 && (
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
                                          alt="Vehicle Angle"
                                          className="w-full h-full object-contain"
                                        />
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>`;

  c = c.replace(oldThumbRegex, newThumbSection);
  fs.writeFileSync(p, c, 'utf8');
  console.log('Updated DealerOrdersView.tsx');
}

