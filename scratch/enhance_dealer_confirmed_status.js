const fs = require('fs');
let code = fs.readFileSync('components/dealer/DealerOrdersView.tsx', 'utf8');

// 1. Add dealerConfirmedHolds filter
const targetHoldsFilter = `  // Filter 24h holds for this dealer
  const dealerHolds = reservations.filter(
    (r) =>
      r.status === "ACTIVE_HOLD" &&
      (!currentDealer?.id || r.dealerId === currentDealer.id)
  );`;

const newHoldsFilter = `  // Filter 24h holds for this dealer
  const dealerHolds = reservations.filter(
    (r) =>
      r.status === "ACTIVE_HOLD" &&
      (!currentDealer?.id || r.dealerId === currentDealer.id)
  );

  // Filter confirmed wholesale allocations for this dealer
  const dealerConfirmedHolds = reservations.filter(
    (r) =>
      r.status === "CONFIRMED_ALLOCATED" &&
      (!currentDealer?.id || r.dealerId === currentDealer.id)
  );`;

const isCrlf = code.includes('\r\n');
const norm = (str) => isCrlf ? str.replace(/\n/g, '\r\n') : str;

code = code.replace(norm(targetHoldsFilter), norm(newHoldsFilter));

// 2. Add confirmed allocations display to HOLDS tab
const targetEmptyHolds = `{dealerHolds.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Active Reservations</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Your dealership currently holds no time-locked reservations. Browse the Vehicle Catalogue to claim a 24-hour guaranteed price lock on available stock.
              </p>
            </div>
          ) : (`;

const newEmptyHolds = `{dealerConfirmedHolds.length > 0 && (
            <div className="p-5 sm:p-6 rounded-[24px] bg-emerald-50/90 border border-emerald-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Confirmed Wholesale Allocations ({dealerConfirmedHolds.length})
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Autohub Central Operations has approved these reservations and issued wholesale orders.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dealer/orders"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5" />
                  <span>View All Wholesale Orders</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dealerConfirmedHolds.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{res.vehicle.stockId}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>CONFIRMED ALLOCATED</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {res.vehicle.year} {res.vehicle.make} {res.vehicle.model}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono truncate">
                          VIN: {res.vehicle.vinChassis} · Landed: \${res.priceSnapshot.totalBuyPriceNZD.toLocaleString()} NZD
                        </p>
                      </div>

                      {res.decisionReason && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 leading-snug">
                          <strong>Note:</strong> {res.decisionReason}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/dealer/orders"
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-[#C3002F] text-white text-xs font-semibold text-center transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Track Order Milestones</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dealerHolds.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Pending Holds</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {dealerConfirmedHolds.length > 0
                  ? "All your recent reservation requests have been approved by Central Operations and converted into active Wholesale Orders above."
                  : "Your dealership currently holds no active time-locked reservations. Browse the Vehicle Catalogue to claim a 24-hour guaranteed price lock on available stock."}
              </p>
            </div>
          ) : (`;

code = code.replace(norm(targetEmptyHolds), norm(newEmptyHolds));

fs.writeFileSync('components/dealer/DealerOrdersView.tsx', code, 'utf8');
console.log('Successfully updated DealerOrdersView.tsx with confirmed allocation visibility!');
