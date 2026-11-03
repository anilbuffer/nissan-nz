"use client";

import React, { useState } from "react";
import { DealerAccount, ZoneId } from "@/lib/types";
import { OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import {
  X,
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Users,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface DealerDetailsModalProps {
  dealer: DealerAccount | null;
  onClose: () => void;
  onApprove?: (dealerId: string, zoneId: ZoneId) => void;
  onReject?: (dealerId: string) => void;
}

export default function DealerDetailsModal({
  dealer,
  onClose,
  onApprove,
  onReject,
}: DealerDetailsModalProps) {
  const { updateDealerZone, orders, reservations, users } = useProgramme();
  const [selectedZone, setSelectedZone] = useState<ZoneId>(
    dealer?.pricingZoneId || "ZONE_1"
  );
  const [hasSavedZone, setHasSavedZone] = useState(false);

  if (!dealer) return null;

  const currentZoneConfig = OFFICIAL_PRICING_ZONES[selectedZone] || OFFICIAL_PRICING_ZONES.ZONE_1;

  // Filter orders and holds belonging to this dealer
  const dealerOrders = orders.filter((o) => o.dealerId === dealer.id);
  const dealerHolds = reservations.filter(
    (r) => r.dealerId === dealer.id && r.status === "ACTIVE_HOLD"
  );
  const dealerUsers = users.filter((u) => u.dealerId === dealer.id);

  const handleSaveZone = () => {
    audio.playSuccessChime();
    updateDealerZone(dealer.id, selectedZone);
    setHasSavedZone(true);
    setTimeout(() => setHasSavedZone(false), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dealer-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 font-sans"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header - Nissan Obsidian Black */}
        <div className="px-6 py-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-slate-300">
                  {dealer.dealerCode}
                </span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-white/10 text-white border border-white/15">
                  {dealer.status === "APPROVED" ? "Approved Franchise" : "Pending Authorization"}
                </span>
              </div>
              <h2 id="dealer-details-title" className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                {dealer.legalTradingName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block">Assigned Zone</span>
              <div className="font-mono font-bold text-slate-900 text-base mt-1">{dealer.pricingZoneId}</div>
              <span className="text-xs text-slate-500 mt-0.5 block">${currentZoneConfig.deliveryCostNZD} Delivery</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block">Active Holds</span>
              <div className="font-mono font-bold text-slate-900 text-base mt-1">{dealerHolds.length} Units</div>
              <span className="text-xs text-slate-500 mt-0.5 block">24h Exclusivity</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block">Total Orders</span>
              <div className="font-mono font-bold text-slate-900 text-base mt-1">{dealerOrders.length} Shipments</div>
              <span className="text-xs text-slate-500 mt-0.5 block">Confirmed RoRo</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block">Registered Staff</span>
              <div className="font-mono font-bold text-slate-900 text-base mt-1">{dealerUsers.length || 1} Users</div>
              <span className="text-xs text-slate-600 font-medium mt-0.5 block">MFA Enabled</span>
            </div>
          </div>

          {/* Legal & Corporate Profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Legal &amp; Business Profile</span>
              </h3>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">NZBN:</span>
                  <span className="font-mono font-semibold text-slate-900 flex items-center gap-1">
                    {dealer.nzbn}
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Dealer Code:</span>
                  <span className="font-mono font-semibold text-slate-800">{dealer.dealerCode}</span>
                </div>

                <div className="flex items-start justify-between py-1 border-b border-slate-100 gap-2">
                  <span className="text-slate-500 shrink-0">Physical Showroom:</span>
                  <span className="font-medium text-slate-800 text-right">{dealer.address}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Operating Region:</span>
                  <span className="font-medium text-slate-700">{dealer.region}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Terms Version:</span>
                  <span className="font-mono text-slate-800 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-700" />
                    <span>{dealer.termsAcceptedVersion || "v2026.1 (Accepted)"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Principal & Contacts */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Primary Dealership Principal</span>
              </h3>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Primary Contact:</span>
                  <span className="font-semibold text-slate-900">{dealer.primaryContactName}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email Address:</span>
                  <a
                    href={`mailto:${dealer.primaryContactEmail}`}
                    className="text-slate-800 hover:text-black font-medium flex items-center gap-1 hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dealer.primaryContactEmail}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Direct Phone:</span>
                  <a
                    href={`tel:${dealer.primaryContactPhone}`}
                    className="text-slate-800 hover:text-black font-mono flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dealer.primaryContactPhone}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Holding Credit Limit:</span>
                  <span className="font-mono font-semibold text-slate-900">$350,000 NZD</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Max Concurrent Holds:</span>
                  <span className="font-mono font-medium text-slate-800">3 Vehicles Max</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Zone Assignment Control */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Geographic Delivery &amp; Fixed Towing Zone Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Determines the fixed wholesale landed towing rate attached to this dealer&#39;s orders.
                </p>
              </div>

              {hasSavedZone && (
                <span className="text-xs font-semibold text-slate-900 bg-white border border-slate-300 px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C3002F]" />
                  <span>Pricing Zone Updated</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {(Object.keys(OFFICIAL_PRICING_ZONES) as ZoneId[]).map((zoneKey) => {
                const z = OFFICIAL_PRICING_ZONES[zoneKey];
                const isSelected = selectedZone === zoneKey;
                return (
                  <button
                    key={zoneKey}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedZone(zoneKey);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-slate-900 ring-1 ring-slate-900 shadow-2xs"
                        : "bg-white/80 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-semibold text-xs text-slate-900">{zoneKey}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#C3002F]" />}
                    </div>
                    <p className="text-xs font-medium text-slate-700 truncate">{z.zoneName}</p>
                    <div className="mt-1 font-mono font-semibold text-slate-900 text-xs">
                      ${z.deliveryCostNZD} <span className="text-[10px] text-slate-400 font-sans">NZD</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedZone !== dealer.pricingZoneId && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveZone}
                  className="px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Save New Zone Assignment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            {dealer.status === "PENDING_APPROVAL" ? (
              <span className="font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
                <span>Pending initial franchise authorization and pricing zone sign-off.</span>
              </span>
            ) : (
              <span className="text-slate-600">
                Authorized Nissan New Zealand Franchisee with live ordering rights.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {dealer.status === "PENDING_APPROVAL" && (
              <>
                {onReject && (
                  <button
                    type="button"
                    onClick={() => {
                      onReject(dealer.id);
                      onClose();
                    }}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 font-medium text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    Decline
                  </button>
                )}
                {onApprove && (
                  <button
                    type="button"
                    onClick={() => {
                      onApprove(dealer.id, selectedZone);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Authorize Franchise</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onClose();
              }}
              className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
