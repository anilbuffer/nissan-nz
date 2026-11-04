const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'admin', 'DealerApprovalsView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `        <div className="overflow-x-auto touch-scroll navy-scrollbar">
          <table className="w-full text-left text-xs text-slate-600 min-w-[760px]">
            <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider border-b border-[#27272A]">
              <tr>
                <th className="py-3.5 px-6 text-slate-200">Dealership Legal Entity</th>
                <th className="py-3.5 px-4 text-slate-200">NZBN</th>
                <th className="py-3.5 px-4 text-slate-200">Assigned Zone</th>
                <th className="py-3.5 px-4 text-slate-200">Delivery Rate</th>
                <th className="py-3.5 px-4 text-slate-200">Authorized Contact</th>
                <th className="py-3.5 px-4 text-slate-200">Terms</th>
                <th className="py-3.5 px-4 text-center text-slate-200">Dossier</th>
                <th className="py-3.5 px-6 text-right text-slate-200">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApproved.map((d) => {
                const zone = OFFICIAL_PRICING_ZONES[d.pricingZoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;

                return (
                  <tr
                    key={d.id}
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedDealerId(d.id);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="group-hover:text-[#C3002F] transition-colors font-bold text-sm">
                        {d.legalTradingName}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 font-normal mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{d.dealerCode} · {d.address}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold font-sans">
                          {d.registrationRole || (d.termsAcceptedVersion?.includes("JP-EXPORT") ? "Nissan Japan" : "NZ Dealer")}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-700 font-medium">
                      {d.nzbn}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 font-mono font-bold text-slate-800 text-[11px] border border-slate-200">
                        {d.pricingZoneId}
                      </span>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      \${zone.deliveryCostNZD.toLocaleString()} NZD
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{d.primaryContactName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{d.primaryContactEmail}</div>
                    </td>

                    <td className="py-4 px-4 font-mono text-emerald-700 font-bold">
                      {d.termsAcceptedVersion || "v2026.1"}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setSelectedDealerId(d.id);
                        }}
                        className="btn-outline text-xs py-1.5 px-3"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inspect</span>
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] font-mono">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>`;

const replacement = `        <div className="overflow-x-auto touch-scroll navy-scrollbar">
          <table className="w-full text-left text-xs text-slate-600 min-w-[700px]">
            <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6 text-slate-700 font-bold">Dealership Legal Entity</th>
                <th className="py-3.5 px-4 text-slate-700 font-bold">NZBN</th>
                <th className="py-3.5 px-4 text-slate-700 font-bold">Delivery Rate</th>
                <th className="py-3.5 px-4 text-slate-700 font-bold">Authorized Contact</th>
                <th className="py-3.5 px-4 text-slate-700 font-bold">Status</th>
                <th className="py-3.5 px-6 text-right text-slate-700 font-bold">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApproved.map((d) => {
                const zone = OFFICIAL_PRICING_ZONES[d.pricingZoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;

                return (
                  <tr
                    key={d.id}
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedDealerId(d.id);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="group-hover:text-[#C3002F] transition-colors font-bold text-sm">
                        {d.legalTradingName}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-slate-700 font-medium">
                      {d.nzbn}
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-slate-900">
                      \${zone.deliveryCostNZD.toLocaleString()} NZD
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{d.primaryContactName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{d.primaryContactEmail}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] font-mono">
                        ACTIVE
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setSelectedDealerId(d.id);
                        }}
                        className="btn-outline text-xs py-1.5 px-3 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>`;

const normalizedContent = content.replace(/\\r\\n/g, '\\n');
const normalizedTarget = target.replace(/\\r\\n/g, '\\n');
const normalizedReplacement = replacement.replace(/\\r\\n/g, '\\n');

if (!normalizedContent.includes(normalizedTarget)) {
  console.error("Target not found!");
  process.exit(1);
}

const updated = normalizedContent.replace(normalizedTarget, normalizedReplacement);
const isCRLF = content.includes('\\r\\n');
fs.writeFileSync(filePath, isCRLF ? updated.replace(/\\n/g, '\\r\\n') : updated, 'utf8');
console.log("Updated Franchise Dealership table successfully!");

