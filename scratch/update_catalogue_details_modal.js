const fs = require('fs');

const filePath = 'components/admin/CatalogueDetailsModal.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Imports
if (!content.includes('SameModelVehiclesShowcase')) {
  content = content.replace(
    'import { audio } from "@/lib/sound";',
    'import { audio } from "@/lib/sound";\nimport { useProgramme } from "@/lib/programme-context";\nimport SameModelVehiclesShowcase from "@/components/common/SameModelVehiclesShowcase";\nimport { getModelAngleImages, getAngleLabel, getCanonicalModelName } from "@/lib/vehicle-media";'
  );
}
if (!content.includes('Camera,')) {
  content = content.replace('Car,', 'Camera,\n  Car,');
}

// 2. Add useProgramme & active vehicle state inside component
const targetHeader = `export default function CatalogueDetailsModal({
  vehicle,
  onClose,
  onNavigateToReservations,
  onNavigateToInventory,
}: CatalogueDetailsModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [selectedZone, setSelectedZone] = useState<"ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4" | "ZONE_5">("ZONE_1");

  if (!vehicle) return null;

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ["/images/cars/kicks.png"];

  const landedPrice = calculateLandedPrice(vehicle.fobPriceJPY, selectedZone);
  const activeImage = images[activeImageIdx] || images[0];`;

const replacementHeader = `export default function CatalogueDetailsModal({
  vehicle,
  onClose,
  onNavigateToReservations,
  onNavigateToInventory,
}: CatalogueDetailsModalProps) {
  const { vehicles } = useProgramme();
  const [currentUnit, setCurrentUnit] = useState<Vehicle | null>(vehicle);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [selectedZone, setSelectedZone] = useState<"ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4" | "ZONE_5">("ZONE_1");

  React.useEffect(() => {
    if (vehicle) {
      setCurrentUnit(vehicle);
      setActiveImageIdx(0);
    }
  }, [vehicle]);

  if (!currentUnit && !vehicle) return null;
  const activeVehicle = currentUnit || vehicle!;

  const images = (activeVehicle.images && activeVehicle.images.length > 1)
    ? activeVehicle.images
    : getModelAngleImages(activeVehicle.model, activeVehicle.images?.[0] || "/images/cars/kicks.png");

  const landedPrice = calculateLandedPrice(activeVehicle.fobPriceJPY, selectedZone);
  const activeImage = images[activeImageIdx] || images[0];`;

content = content.replace(targetHeader.replace(/\n/g, '\r\n'), replacementHeader.replace(/\n/g, '\r\n'));
if (!content.includes('activeVehicle')) {
  content = content.replace(targetHeader, replacementHeader);
}

// Replace references to `vehicle.` with `activeVehicle.` in the body
// Let's do this safely by replacing `vehicle.` with `activeVehicle.` in the JSX part
// Specifically:
content = content.replace(/vehicle\.stockId/g, 'activeVehicle.stockId');
content = content.replace(/vehicle\.vinChassis/g, 'activeVehicle.vinChassis');
content = content.replace(/vehicle\.year/g, 'activeVehicle.year');
content = content.replace(/vehicle\.make/g, 'activeVehicle.make');
content = content.replace(/vehicle\.model/g, 'activeVehicle.model');
content = content.replace(/vehicle\.grade/g, 'activeVehicle.grade');
content = content.replace(/vehicle\.auctionGrade/g, 'activeVehicle.auctionGrade');
content = content.replace(/vehicle\.interiorGrade/g, 'activeVehicle.interiorGrade');
content = content.replace(/vehicle\.location/g, 'activeVehicle.location');
content = content.replace(/vehicle\.odometerKm/g, 'activeVehicle.odometerKm');
content = content.replace(/vehicle\.transmission/g, 'activeVehicle.transmission');
content = content.replace(/vehicle\.color/g, 'activeVehicle.color');
content = content.replace(/vehicle\.fuelType/g, 'activeVehicle.fuelType');
content = content.replace(/vehicle\.engineCc/g, 'activeVehicle.engineCc');
content = content.replace(/vehicle\.status/g, 'activeVehicle.status');
content = content.replace(/vehicle\.fobPriceJPY/g, 'activeVehicle.fobPriceJPY');
content = content.replace(/vehicle\.supportingDocuments/g, 'activeVehicle.supportingDocuments');
content = content.replace(/vehicle\.conditionSummary/g, 'activeVehicle.conditionSummary');
content = content.replace(/vehicle\.knownDefects/g, 'activeVehicle.knownDefects');

// 3. Stage image angle label pill & Thumbnails with labels
const targetStage = `                <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-mono font-bold text-slate-800 border border-slate-200 shadow-xs flex items-center gap-1">
                  <span className="text-amber-500 font-bold">★</span>
                  <span>Grade {activeVehicle.auctionGrade} / {activeVehicle.interiorGrade || "A"}</span>
                </div>

                <div className="absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-sm text-[10px] font-mono text-white">
                  {activeVehicle.location || "Yokohama Yard"}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setActiveImageIdx(idx);
                      }}
                      className={\`w-16 h-12 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 \${activeImageIdx === idx
                        ? "border-[#C3002F] ring-2 ring-[#C3002F]/20 bg-white"
                        : "border-slate-200 hover:border-slate-300 opacity-70"
                        }\`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}`;

const replacementStage = `                <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-mono font-bold text-slate-800 border border-slate-200 shadow-xs flex items-center gap-1">
                  <span className="text-amber-500 font-bold">★</span>
                  <span>Grade {activeVehicle.auctionGrade} / {activeVehicle.interiorGrade || "A"}</span>
                </div>

                <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 shadow-xs">
                  <Camera className="w-3 h-3 text-rose-400" />
                  <span>{getAngleLabel(activeImage, activeImageIdx)}</span>
                </div>

                <div className="absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-sm text-[10px] font-mono text-white">
                  {activeVehicle.location || "Yokohama Yard"}
                </div>
              </div>

              {/* Thumbnails with angle indicators */}
              {images.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
                    <span>Studio Angles ({images.length})</span>
                    <span className="text-slate-600 font-semibold">{getAngleLabel(activeImage, activeImageIdx)}</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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
                          className={\`w-20 h-14 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 flex flex-col justify-between items-center \${isActive
                            ? "border-[#C3002F] ring-2 ring-[#C3002F]/20 bg-white"
                            : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                            }\`}
                          title={label}
                        >
                          <img src={img} alt={label} className="w-full h-7 object-contain" />
                          <span className="text-[8px] font-mono font-semibold text-slate-600 truncate max-w-[72px] block text-center">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}`;

content = content.replace(targetStage.replace(/\n/g, '\r\n'), replacementStage.replace(/\n/g, '\r\n'));
if (!content.includes('Studio Angles (')) {
  content = content.replace(targetStage, replacementStage);
}

// 4. SameModelVehiclesShowcase at the end of the scrollable body
const targetEndOfBody = `              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}`;

const replacementEndOfBody = `              </div>
            </div>
          </div>

          {/* Sibling Units of Same Model in Central Catalogue */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-3">
            <SameModelVehiclesShowcase
              currentVehicle={activeVehicle}
              allVehicles={vehicles}
              isAdmin={true}
              portal="admin"
              compact={true}
              title={\`Other \${getCanonicalModelName(activeVehicle.model)} Units in Central Catalogue\`}
              onSelectVehicle={(selectedUnit) => {
                setCurrentUnit(selectedUnit);
                setActiveImageIdx(0);
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}`;

content = content.replace(targetEndOfBody.replace(/\n/g, '\r\n'), replacementEndOfBody.replace(/\n/g, '\r\n'));
if (!content.includes('Sibling Units of Same Model in Central Catalogue')) {
  content = content.replace(targetEndOfBody, replacementEndOfBody);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated CatalogueDetailsModal.tsx');

