const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'dealer', 'FullPageVehicleDetail.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `<div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAdminApproveReservation}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Confirm Wholesale Allocation</span>
                        </button>

                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={handleAdminReleaseHold}
                            className="py-2 px-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            title="Release hold back to open catalogue"
                          >
                            <Unlock className="w-3 h-3 text-slate-500" />
                            <span>Release</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAdminCancelReservation}
                            className="py-2 px-1.5 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            title="Cancel under Section 6.2 cooling-off"
                          >
                            <Ban className="w-3 h-3 text-amber-600" />
                            <span>Cancel (6.2)</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAdminRejectReservation}
                            className="py-2 px-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            title="Decline reservation request"
                          >
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>`;

const replacement = `<div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAdminApproveReservation}
                          className="py-2.5 px-3 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                          title="Confirm wholesale allocation"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Confirm</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAdminRejectReservation}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                          title="Decline reservation and release hold"
                        >
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span>Decline</span>
                        </button>
                      </div>`;

// Normalize line endings for replacement
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');
const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

if (!normalizedContent.includes(normalizedTarget)) {
  console.error("Target not found in content!");
  process.exit(1);
}

const updatedContent = normalizedContent.replace(normalizedTarget, normalizedReplacement);
// Write back with CRLF if original had CRLF
const isCRLF = content.includes('\r\n');
fs.writeFileSync(filePath, isCRLF ? updatedContent.replace(/\n/g, '\r\n') : updatedContent, 'utf8');
console.log("Successfully replaced buttons!");

