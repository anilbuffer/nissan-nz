const fs = require('fs');
const path = require('path');

// 1. Update FullPageVehicleDetail.tsx
const detailPath = path.join(__dirname, '..', 'components', 'dealer', 'FullPageVehicleDetail.tsx');
let detailContent = fs.readFileSync(detailPath, 'utf8').replace(/\r\n/g, '\n');

// 1.1 Fix rawVehicle prioritization
const oldRawVehicle = `  // Find vehicle from live programme context or fallback to mock data
  const rawVehicle =
    vehicleData ||
    vehicles.find((v) => v.id === vehicleId || v.stockId === vehicleId) ||
    MOCK_VEHICLES.find((m) => m.id === vehicleId || m.stockId === vehicleId) ||
    vehicles[0] ||
    MOCK_VEHICLES[0];`;

const newRawVehicle = `  // Find vehicle from live programme context or fallback to mock data
  const rawVehicle =
    vehicles.find((v) => v.id === vehicleId || v.stockId === vehicleId || (vehicleData && (v.id === vehicleData.id || v.stockId === vehicleData.stockId))) ||
    vehicleData ||
    MOCK_VEHICLES.find((m) => m.id === vehicleId || m.stockId === vehicleId) ||
    vehicles[0] ||
    MOCK_VEHICLES[0];`;

if (!detailContent.includes(oldRawVehicle)) {
  console.error("oldRawVehicle not found!");
  process.exit(1);
}
detailContent = detailContent.replace(oldRawVehicle, newRawVehicle);

// 1.2 Add modal states
const oldStates = `  const [activeDocPreview, setActiveDocPreview] = useState<{
    name: string;
    type: string;
    date: string;
    size?: string;
  } | null>(null);
  const [docDownloadToast, setDocDownloadToast] = useState<string | null>(null);`;

const newStates = `  const [activeDocPreview, setActiveDocPreview] = useState<{
    name: string;
    type: string;
    date: string;
    size?: string;
  } | null>(null);
  const [docDownloadToast, setDocDownloadToast] = useState<string | null>(null);

  // Admin Reservation Confirmation & Decline Modal States
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");`;

if (!detailContent.includes(oldStates)) {
  console.error("oldStates not found!");
  process.exit(1);
}
detailContent = detailContent.replace(oldStates, newStates);

// 1.3 Replace approve/reject handlers
const oldHandlers = `  const handleAdminApproveReservation = () => {
    audio.playSuccessChime();
    confirmAllocation(vehicle.id, "Approved by Central Operations Admin");
    setActionNotice(\`Reservation confirmed & vehicle allocated to \${reservingDealerName}.\`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAdminRejectReservation = () => {
    audio.playSubtleClick();
    releaseHold(vehicle.id, "Reservation declined by Central Operations Admin");
    setActionNotice(\`Reservation declined. Unit #\${vehicle.stockId} is back in available catalogue.\`);
    setTimeout(() => setActionNotice(null), 3500);
  };`;

const newHandlers = `  const handleAdminApproveReservation = () => {
    audio.playSubtleClick();
    setIsConfirmModalOpen(true);
  };

  const handleAdminRejectReservation = () => {
    audio.playSubtleClick();
    setDeclineReason("");
    setIsDeclineModalOpen(true);
  };

  const executeConfirmAllocation = () => {
    audio.playSuccessChime();
    confirmAllocation(vehicle.id, "Approved by Central Operations Admin. Wholesale purchase order issued.");
    setIsConfirmModalOpen(false);
    setActionNotice(\`✓ Wholesale allocation confirmed for unit #\${vehicle.stockId} to \${reservingDealerName}. Active order generated.\`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const executeDeclineReservation = () => {
    audio.playSubtleClick();
    const reason = declineReason.trim() || "Reservation declined by Central Operations Admin";
    if (activeReservation) {
      rejectReservation(activeReservation.id, reason);
    }
    releaseHold(vehicle.id, reason);
    setIsDeclineModalOpen(false);
    setDeclineReason("");
    setActionNotice(\`Reservation declined for unit #\${vehicle.stockId}. Stock released back to Available.\`);
    setTimeout(() => setActionNotice(null), 5000);
  };`;

if (!detailContent.includes(oldHandlers)) {
  console.error("oldHandlers not found!");
  process.exit(1);
}
detailContent = detailContent.replace(oldHandlers, newHandlers);

// 1.4 Add inline actionNotice in right sidebar above the reservation box
const oldLifecycleHeader = `                {/* Admin Allocation Lifecycle Controls */}
                <div className="pt-2 border-t border-slate-100">
                  {isReserved && (`;

const newLifecycleHeader = `                {/* Admin Allocation Lifecycle Controls */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {actionNotice && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{actionNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActionNotice(null)}
                        className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {isReserved && (`;

if (!detailContent.includes(oldLifecycleHeader)) {
  console.error("oldLifecycleHeader not found!");
  process.exit(1);
}
detailContent = detailContent.replace(oldLifecycleHeader, newLifecycleHeader);

// 1.5 Add Confirmation Modal and Decline with Reason Modal JSX
const modalsJsx = `      {/* Confirm Wholesale Allocation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Confirm Wholesale Allocation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Approve reservation &amp; issue purchase order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900">{vehicle.year} {vehicle.make} {vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock ID:</span>
                <span className="font-mono font-bold text-slate-800">#{vehicle.stockId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Dealership:</span>
                <span className="font-bold text-slate-900">{reservingDealerName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Fixed Landed Price:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  \${totalBuyPriceNZD.toLocaleString()} NZD
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to confirm this wholesale allocation? This will officially allocate unit <strong>#{vehicle.stockId}</strong> to <strong>{reservingDealerName}</strong> and generate an active order in the milestones pipeline.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmAllocation}
                className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirm Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reservation with Reason Modal */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Decline Reservation Hold
                  </h3>
                  <p className="text-xs text-slate-500">
                    Release exclusivity hold back to open inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900">{vehicle.year} {vehicle.make} {vehicle.model} (#{vehicle.stockId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reserving Dealer:</span>
                <span className="font-bold text-slate-900">{reservingDealerName}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Reason for Declining *</span>
                <span className="text-[10px] text-slate-400 font-normal">Recorded in audit log</span>
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Allocation declined during wholesale credit review / Dealership requested cancellation..."
                className="w-full p-3 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 transition-all font-sans"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Declining will terminate the exclusivity hold for <strong>{reservingDealerName}</strong> and immediately return unit #{vehicle.stockId} to the active Japan inventory catalog.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeclineReservation}
                disabled={!declineReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <XCircle className="w-4 h-4" />
                <span>Decline Reservation</span>
              </button>
            </div>
          </div>
        </div>
      )}
`;

const toastAnchor = `      {/* D. Download Toast Notification */}`;
if (!detailContent.includes(toastAnchor)) {
  console.error("toastAnchor not found!");
  process.exit(1);
}
detailContent = detailContent.replace(toastAnchor, modalsJsx + '\n' + toastAnchor);

fs.writeFileSync(detailPath, detailContent.replace(/\n/g, '\r\n'), 'utf8');
console.log("Updated FullPageVehicleDetail.tsx successfully!");

// 2. Update AdminReservationsView.tsx for reactive liveRes lookup
const adminResPath = path.join(__dirname, '..', 'components', 'admin', 'AdminReservationsView.tsx');
let adminResContent = fs.readFileSync(adminResPath, 'utf8').replace(/\r\n/g, '\n');

const oldAdminInner = `  if (selectedResForDetails) {
    return (
      <FullPageVehicleDetail
        vehicleId={selectedResForDetails.vehicleId || selectedResForDetails.vehicle?.id}
        vehicleData={selectedResForDetails.vehicle}
        isAdmin={true}
        backLabel="Back to Reservations Queue"
        onBack={() => setSelectedResForDetails(null)}
      />
    );
  }`;

const newAdminInner = `  if (selectedResForDetails) {
    const liveRes = reservations.find((r) => r.id === selectedResForDetails.id) || selectedResForDetails;
    return (
      <FullPageVehicleDetail
        vehicleId={liveRes.vehicleId || liveRes.vehicle?.id}
        vehicleData={liveRes.vehicle}
        isAdmin={true}
        backLabel="Back to Reservations Queue"
        onBack={() => setSelectedResForDetails(null)}
      />
    );
  }`;

if (adminResContent.includes(oldAdminInner)) {
  adminResContent = adminResContent.replace(oldAdminInner, newAdminInner);
  fs.writeFileSync(adminResPath, adminResContent.replace(/\n/g, '\r\n'), 'utf8');
  console.log("Updated AdminReservationsView.tsx successfully!");
}

