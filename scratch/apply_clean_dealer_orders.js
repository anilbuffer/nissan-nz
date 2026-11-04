const fs = require('fs');

const p = 'components/dealer/DealerOrdersView.tsx';
let c = fs.readFileSync(p, 'utf8');

// 1. Imports
c = c.replace(
  'import { audio } from "@/lib/sound";',
  'import { audio } from "@/lib/sound";\nimport SameModelVehiclesShowcase from "@/components/common/SameModelVehiclesShowcase";\nimport { getModelAngleImages, getCanonicalModelName } from "@/lib/vehicle-media";'
);

// 2. Destructure vehicles from useProgramme()
c = c.replace(
  'const { orders, reservations, releaseHold, cancelReservation, respondToAdditionalCost, confirmAllocation, reservationConfig, pricingConfig } = useProgramme();',
  'const { vehicles, orders, reservations, releaseHold, cancelReservation, respondToAdditionalCost, confirmAllocation, reservationConfig, pricingConfig } = useProgramme();'
);

// 3. Enrich images
c = c.replace(
  `                    const mockMatch = MOCK_VEHICLES.find((m) => m.id === selectedOrder.vehicle.id);
                    const images = (mockMatch?.images || selectedOrder.vehicle.images || []).length > 0
                      ? (mockMatch?.images || selectedOrder.vehicle.images || [])
                      : [selectedOrder.vehicle.images?.[0] || "/images/cars/kicks.png"];`,
  `                    const mockMatch = MOCK_VEHICLES.find((m) => m.id === selectedOrder.vehicle.id);
                    const existingImages = (mockMatch?.images || selectedOrder.vehicle.images || []);
                    const images = existingImages.length > 1
                      ? existingImages
                      : getModelAngleImages(selectedOrder.vehicle.model, existingImages[0] || selectedOrder.vehicle.images?.[0] || "/images/cars/kicks.png");`
);

// 4. SameModelVehiclesShowcase inside space-y-6 before closing div
c = c.replace(
  `                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-bold shadow-2xs self-start sm:self-auto">
                      Delivery Zone: {selectedOrder.pricingZoneId}
                    </span>
                  </div>
                </div>
              )}`,
  `                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-bold shadow-2xs self-start sm:self-auto">
                      Delivery Zone: {selectedOrder.pricingZoneId}
                    </span>
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
                </div>
              )}`
);

fs.writeFileSync(p, c, 'utf8');
console.log('Successfully updated DealerOrdersView.tsx cleanly');

