const fs = require('fs');

const filePath = 'components/admin/ReservationDetailsModal.tsx';
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

// 2. Add useProgramme and active image state
const targetState = `  const [copiedVin, setCopiedVin] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<"CONFIRM" | "RELEASE" | "REJECT" | null>(null);
  const [reasonInput, setReasonInput] = useState("");`;

const replacementState = `  const { vehicles } = useProgramme();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<"CONFIRM" | "RELEASE" | "REJECT" | null>(null);
  const [reasonInput, setReasonInput] = useState("");`;

content = content.replace(targetState.replace(/\n/g, '\r\n'), replacementState.replace(/\n/g, '\r\n'));
if (!content.includes('activeImageIdx')) {
  content = content.replace(targetState, replacementState);
}

// 3. Dynamic images computation
const targetVehicleImg = `  const vehicle = reservation.vehicle;
  const vehicleImage = vehicle?.images?.[0] || "/images/cars/kicks.png";
  const price = reservation.priceSnapshot || calculateLandedPrice(vehicle?.fobPriceJPY || 2000000, "ZONE_1");`;

const replacementVehicleImg = `  const vehicle = reservation.vehicle;
  const images = (vehicle?.images && vehicle.images.length > 1)
    ? vehicle.images
    : getModelAngleImages(vehicle?.model, vehicle?.images?.[0] || "/images/cars/kicks.png");
  const activeImage = images[activeImageIdx] || images[0];
  const price = reservation.priceSnapshot || calculateLandedPrice(vehicle?.fobPriceJPY || 2000000, "ZONE_1");`;

content = content.replace(targetVehicleImg.replace(/\n/g, '\r\n'), replacementVehicleImg.replace(/\n/g, '\r\n'));
if (!content.includes('const activeImage = images[activeImageIdx]')) {
  content = content.replace(targetVehicleImg, replacementVehicleImg);
}

// 4. Vehicle photo showcase inside the card
const targetPhotoCard = `              <div className="flex items-center gap-4">
                <div className="w-24 sm:w-28 h-18 sm:h-20 rounded-lg bg-slate-50 border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={vehicleImage}
                    alt={vehicle?.model || "Vehicle"}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {vehicle?.year} {vehicle?.make} {vehicle?.model}
                  </h4>
                  <p className="text-slate-600 text-xs">
                    {vehicle?.grade} · {vehicle?.fuelType}
                  </p>
                  <p className="text-slate-500 font-mono text-xs">
                    {vehicle?.odometerKm?.toLocaleString()} km · Grade {vehicle?.auctionGrade}
                  </p>
                </div>
              </div>`;

const replacementPhotoCard = `              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="relative w-28 sm:w-36 h-20 sm:h-24 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100/80 border border-slate-200 p-2 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={activeImage}
                      alt={vehicle?.model || "Vehicle"}
                      className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200 hover:scale-105"
                    />
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-slate-900/80 text-[8px] font-mono text-white flex items-center gap-1">
                      <Camera className="w-2.5 h-2.5 text-rose-400" />
                      <span>{getAngleLabel(activeImage, activeImageIdx)}</span>
                    </div>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">
                      {vehicle?.year} {vehicle?.make} {vehicle?.model}
                    </h4>
                    <p className="text-slate-600 text-xs truncate">
                      {vehicle?.grade} · {vehicle?.fuelType} · {vehicle?.color}
                    </p>
                    <p className="text-slate-500 font-mono text-xs">
                      {vehicle?.odometerKm?.toLocaleString()} km · ★ Grade {vehicle?.auctionGrade}
                    </p>
                  </div>
                </div>

                {/* Multi-angle Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="space-y-1 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Angles ({images.length})</span>
                      <span className="text-slate-600 font-medium">{getAngleLabel(activeImage, activeImageIdx)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
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
                            className={\`w-14 h-10 rounded-lg border p-0.5 bg-slate-50 shrink-0 overflow-hidden cursor-pointer transition-all \${isActive
                              ? "border-[#C3002F] ring-1 ring-[#C3002F]/30 bg-white shadow-2xs"
                              : "border-slate-200 hover:border-slate-300 opacity-75"
                              }\`}
                            title={label}
                          >
                            <img src={img} alt={label} className="w-full h-full object-contain" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>`;

content = content.replace(targetPhotoCard.replace(/\n/g, '\r\n'), replacementPhotoCard.replace(/\n/g, '\r\n'));
if (!content.includes('Multi-angle Thumbnail Strip')) {
  content = content.replace(targetPhotoCard, replacementPhotoCard);
}

// 5. SameModelVehiclesShowcase below Landed Buy Price Breakdown
const targetBreakdown = `              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Total Landed Price</span>
                <div className="font-mono font-bold text-[#C3002F] text-sm sm:text-base mt-1">
                  \${price.totalBuyPriceNZD.toLocaleString()} NZD
                </div>
                <span className="text-xs text-slate-500 mt-0.5 block">Excl. GST (Protected)</span>
              </div>
            </div>
          </div>`;

const replacementBreakdown = `              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 block">Total Landed Price</span>
                <div className="font-mono font-bold text-[#C3002F] text-sm sm:text-base mt-1">
                  \${price.totalBuyPriceNZD.toLocaleString()} NZD
                </div>
                <span className="text-xs text-slate-500 mt-0.5 block">Excl. GST (Protected)</span>
              </div>
            </div>
          </div>

          {/* Sibling Units of Same Model in Fleet */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 space-y-3">
            <SameModelVehiclesShowcase
              currentVehicle={vehicle}
              allVehicles={vehicles}
              isAdmin={true}
              portal="admin"
              compact={true}
              title={\`Other \${getCanonicalModelName(vehicle?.model)} Units in Pipeline & Fleet\`}
            />
          </div>`;

content = content.replace(targetBreakdown.replace(/\n/g, '\r\n'), replacementBreakdown.replace(/\n/g, '\r\n'));
if (!content.includes('Sibling Units of Same Model in Fleet')) {
  content = content.replace(targetBreakdown, replacementBreakdown);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated ReservationDetailsModal.tsx');

