const fs = require('fs');

const file = 'components/dealer/DealerOrdersView.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add getRoRoMilestoneLabel helper near the top of the file
const helperFunction = `
export function getRoRoMilestoneLabel(milestone: OrderMilestone | string): { stageNumber: number; stageName: string; displayBadge: string } {
  switch (milestone) {
    case "ORDER_CONFIRMED":
    case "JAPAN_VERIFICATION":
      return { stageNumber: 1, stageName: "Received At Facility", displayBadge: "1. Received At Facility" };
    case "BOOKED_FOR_SHIPPING":
    case "IN_TRANSIT":
      return { stageNumber: 2, stageName: "In Transit", displayBadge: "2. In Transit" };
    case "NZ_BORDER_PROCESSING":
      return { stageNumber: 3, stageName: "Arrived in NZ", displayBadge: "3. Arrived in NZ" };
    case "COMPLIANCE":
    case "AWAITING_ADDITIONAL_COST":
    case "READY_FOR_DELIVERY":
      return { stageNumber: 4, stageName: "Out For Delivery", displayBadge: "4. Out For Delivery" };
    case "DELIVERED":
      return { stageNumber: 5, stageName: "Delivered", displayBadge: "5. Delivered" };
    default:
      return { stageNumber: 2, stageName: "In Transit", displayBadge: "2. In Transit" };
  }
}
`;

if (!content.includes('function getRoRoMilestoneLabel')) {
  const insertAfter = 'const MILESTONE_STEPS:';
  const insertIdx = content.indexOf(insertAfter);
  if (insertIdx !== -1) {
    content = content.substring(0, insertIdx) + helperFunction + '\n' + content.substring(insertIdx);
  }
}

// 2. Remove showPriceBreakdown state
content = content.replace(/\r?\n\s*const \[showPriceBreakdown, setShowPriceBreakdown\] = useState<boolean>\(false\);/, '');

// 3. Update RoRo pills across the file
content = content.replaceAll(
  '<span>RoRo: {selectedOrder?.currentMilestone.replace(/_/g, " ")}</span>',
  '<span>[ RoRo ] {selectedOrder ? getRoRoMilestoneLabel(selectedOrder.currentMilestone).displayBadge : "1. Received At Facility"}</span>'
);

content = content.replaceAll(
  '<span>RoRo: {selectedOrder.currentMilestone.replace(/_/g, " ")}</span>',
  '<span>[ RoRo ] {getRoRoMilestoneLabel(selectedOrder.currentMilestone).displayBadge}</span>'
);

content = content.replaceAll(
  '<span>RoRo: {order.currentMilestone.replace(/_/g, " ")}</span>',
  '<span>[ RoRo ] {getRoRoMilestoneLabel(order.currentMilestone).displayBadge}</span>'
);

// 4. Replace the Pricing block and vehicle details section (Sections A, B, C, E and View Cost Inclusions)
// with the symmetric Specifications card
const pricingBlockStart = '{/* Pricing Block */}';
const defectRemediationStart = '{/* Defect Remediation & Additional Cost Action */}';

const pStartIdx = content.indexOf(pricingBlockStart);
const dStartIdx = content.indexOf(defectRemediationStart);

if (pStartIdx === -1 || dStartIdx === -1) {
  console.error('Could not find pricing block or defect remediation markers');
  process.exit(1);
}

const replacementSection = `{/* Pricing Block (Clean: No [View Cost Inclusions]) */}
                      <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Total Buy Price (Fixed Landed)
                        </span>
                        <div className="text-2xl font-bold font-mono text-slate-900">
                          \${selectedOrder.priceBreakdown.totalBuyPriceNZD.toLocaleString()}{" "}
                          <span className="text-xs font-sans text-slate-500">NZD</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Fixed for {selectedOrder.pricingZoneId} (Zone Delivery Included)
                        </div>
                      </div>
                    </div>

                    {/* Studio Showcase Vehicle Image */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 flex items-center justify-center relative overflow-hidden h-56">
                      <div className="absolute bottom-4 w-3/4 h-4 bg-black/15 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />
                      <img
                        src={selectedOrder.vehicle?.images?.[0] || "/images/cars/kicks.png"}
                        alt={selectedOrder.vehicle?.model || "Vehicle"}
                        className="max-h-52 w-full object-contain filter drop-shadow-xl relative z-10"
                      />
                    </div>
                  </div>

                  {/* ───────────────────────────────────────────────────────── */}
                  {/* SPECIFICATIONS CARD (Symmetric with dealer/vehicles/VEH_023) */}
                  {/* ───────────────────────────────────────────────────────── */}
                  <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          Specifications
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Certified Japanese export verification and mechanical specification dossier.
                        </p>
                      </div>
                    </div>

                    {/* 4 Inner Stats Cards Strip */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      {/* 1. ODOMETER (JEVIC) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          ODOMETER (JEVIC)
                        </span>
                        <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
                          {selectedOrder.vehicle.odometerKm.toLocaleString()} {selectedOrder.vehicle.odometerUnit || "km"}
                        </div>
                        <span className="text-[11px] text-emerald-600 font-semibold block truncate">
                          Digitally Certified
                        </span>
                      </div>

                      {/* 2. AUCTION GRADE */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          AUCTION GRADE
                        </span>
                        <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                          ★ {selectedOrder.vehicle.auctionGrade || "4.5"} / {selectedOrder.vehicle.interiorGrade || "A"}
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate">
                          USS / JAA Inspection
                        </span>
                      </div>

                      {/* 3. FOB BASELINE (JPY) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          FOB BASELINE (JPY)
                        </span>
                        <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
                          ¥{selectedOrder.priceBreakdown.fobJPY.toLocaleString()}
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Japan Acquisition Cost
                        </span>
                      </div>

                      {/* 4. CORRIDOR / VESSEL */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          CORRIDOR STAGING
                        </span>
                        <div className="text-base sm:text-xl font-bold text-slate-900 truncate tracking-tight">
                          {selectedOrder.vesselName || selectedOrder.vehicle.location || "Yokohama Export Yard"}
                        </div>
                        <span className="text-[11px] text-blue-600 font-semibold block truncate">
                          [ RoRo ] {getRoRoMilestoneLabel(selectedOrder.currentMilestone).stageName}
                        </span>
                      </div>
                    </div>

                    {/* 4-Column Technical Grid (Cleaned: No Duplicates or Redundant Info) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      {/* Card 1: Provenance & Identification */}
                      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Provenance &amp; Identification
                        </span>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Chassis / VIN:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900">{selectedOrder.vehicle.vinChassis}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(selectedOrder.vehicle.vinChassis, "vin")}
                                title="Copy VIN"
                                className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {copiedField === "vin" ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Make &amp; Model:</span>
                            <span className="font-bold text-slate-900">{selectedOrder.vehicle.make || "Nissan"} {selectedOrder.vehicle.model}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Variant / Trim:</span>
                            <span className="font-semibold text-slate-800">{selectedOrder.vehicle.grade}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Drive Type:</span>
                            <span className="font-mono font-bold text-slate-900">{selectedOrder.vehicle.driveType || "2WD"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Powertrain & Mechanical */}
                      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Powertrain &amp; Mechanical
                        </span>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Powertrain:</span>
                            <span className="font-semibold text-slate-900">{selectedOrder.vehicle.fuelType}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Engine / Motor:</span>
                            <span className="font-mono font-medium text-slate-800">
                              {selectedOrder.vehicle.engineCc && selectedOrder.vehicle.engineCc > 0
                                ? \`\${selectedOrder.vehicle.engineCc.toLocaleString()} cc\`
                                : "Electric Drive Motor"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Transmission:</span>
                            <span className="font-medium text-slate-800">{selectedOrder.vehicle.transmission}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Exterior Colour:</span>
                            <span className="font-medium text-slate-800">{selectedOrder.vehicle.color || "Factory Original"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Compliance & Odometer */}
                      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Compliance &amp; Odometer
                        </span>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">JEVIC Odometer:</span>
                            <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Certified Hash Pass</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">NZTA Entry:</span>
                            <span className="font-semibold text-emerald-700 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>MR2A Dossier Cleared</span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Biosecurity / Rad:</span>
                            <span className="font-mono font-medium text-slate-700 text-[11px]">
                              Passed (&lt;0.08 µSv/h)
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Certified Date:</span>
                            <span className="font-mono text-slate-700">
                              {selectedOrder.vehicle.inspectionDate || (selectedOrder.orderedAt ? new Date(selectedOrder.orderedAt).toISOString().slice(0, 10) : "2026-10-24")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Condition Log & Japanese Notes */}
                      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Condition &amp; Inspection Log
                        </span>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Interior / Exterior:</span>
                            <span className="font-medium text-slate-900 text-[11px]">
                              Int: Grade {selectedOrder.vehicle.interiorGrade || "A"} · Ext: Grade {selectedOrder.vehicle.exteriorGrade || "A"}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-500 block mb-0.5">Overall Condition:</span>
                            <p className="text-[11px] text-slate-700 leading-snug font-normal">
                              {selectedOrder.vehicle.overallCondition || "Zero panel damage. Verified Japanese one-owner."}
                            </p>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-500 block mb-1">Reported Defects:</span>
                            {selectedOrder.vehicle.knownDefects && selectedOrder.vehicle.knownDefects.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {selectedOrder.vehicle.knownDefects.map((defect, dIdx) => (
                                  <span
                                    key={dIdx}
                                    className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200"
                                  >
                                    • {defect}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                                None Reported (Grade 4.5+ Standard)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  `;

content = content.substring(0, pStartIdx) + replacementSection + content.substring(dStartIdx);

// 5. Update Order Delivery Timeline header to feature [ RoRo ] Tracking
const timelineHeaderMarker = 'Order Delivery Timeline';
const timelineHeaderIdx = content.indexOf(timelineHeaderMarker);
if (timelineHeaderIdx !== -1) {
  const timelineCardStart = content.lastIndexOf('<div className="bg-white rounded-[16px]', timelineHeaderIdx);
  const timelineComponentMarker = '<OrderCorridorTimeline';
  const timelineComponentIdx = content.indexOf(timelineComponentMarker, timelineHeaderIdx);

  if (timelineCardStart !== -1 && timelineComponentIdx !== -1) {
    const newTimelineHeader = `<div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                            Order Delivery Timeline
                          </h3>
                          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            [ RoRo ] Live Tracking
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          End-to-end Pacific RoRo corridor tracking (1. Received At Facility, 2. In Transit, 3. Arrived in NZ, 4. Out For Delivery, 5. Delivered)
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                          <Ship className="w-3.5 h-3.5 text-blue-600" />
                          <span>Current: [ RoRo ] {getRoRoMilestoneLabel(selectedOrder.currentMilestone).displayBadge}</span>
                        </span>
                      </div>
                    </div>

                    `;

    content = content.substring(0, timelineCardStart) + newTimelineHeader + content.substring(timelineComponentIdx);
  }
}

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated DealerOrdersView.tsx');
