const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'admin', 'AdminReservationsView.tsx');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// Add state
const oldState = `  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);`;
const newState = `  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);
  const [confirmDialogRes, setConfirmDialogRes] = useState<ReservationRequest | null>(null);`;

content = content.replace(oldState, newState);

// Update grid button onClick
const oldBtn = `                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectConfirm(res);
                          }}`;
const newBtn = `                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playSubtleClick();
                            setConfirmDialogRes(res);
                          }}`;

content = content.replace(oldBtn, newBtn);

// Add Confirmation modal JSX at bottom
const modalJsx = `
      {/* Confirmation Dialog for Grid Action */}
      {confirmDialogRes && (
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
                onClick={() => setConfirmDialogRes(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900">{confirmDialogRes.vehicle?.year} {confirmDialogRes.vehicle?.make} {confirmDialogRes.vehicle?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock ID:</span>
                <span className="font-mono font-bold text-slate-800">#{confirmDialogRes.vehicle?.stockId || confirmDialogRes.requestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Dealership:</span>
                <span className="font-bold text-slate-900">{confirmDialogRes.dealerName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Fixed Landed Price:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  \${(confirmDialogRes.priceSnapshot?.totalBuyPriceNZD || 0).toLocaleString()} NZD
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to confirm wholesale allocation for unit <strong>#{confirmDialogRes.vehicle?.stockId || confirmDialogRes.requestId}</strong> to <strong>{confirmDialogRes.dealerName}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialogRes(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = confirmDialogRes;
                  setConfirmDialogRes(null);
                  handleDirectConfirm(target);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirm Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('    </div>\n  );\n}', modalJsx + '    </div>\n  );\n}');

fs.writeFileSync(filePath, content.replace(/\n/g, '\r\n'), 'utf8');
console.log("Updated AdminReservationsView.tsx with Confirm modal!");

