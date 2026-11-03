"use client";

import React, { useState } from "react";
import { DealerAccount, ZoneId } from "@/lib/types";
import { OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import {
  X,
  Building2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Car,
  ShoppingBag,
  Users,
  CreditCard,
  FileText,
  AlertTriangle,
  ExternalLink,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A1322] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400">
                  {dealer.dealerCode}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${dealer.status === "APPROVED"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}
                >
                  {dealer.status === "APPROVED" ? "Approved Franchise" : "Pending Authorization"}
                </span>
              </div>
              <h2 id="dealer-details-title" className="text-lg font-bold text-white tracking-tight">
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
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Assigned Zone</span>
              <div className="font-mono font-black text-slate-900 text-lg mt-1">{dealer.pricingZoneId}</div>
              <span className="text-[10px] text-slate-500">${currentZoneConfig.deliveryCostNZD} Delivery</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Active Holds</span>
              <div className="font-mono font-black text-amber-600 text-lg mt-1">{dealerHolds.length} Units</div>
              <span className="text-[10px] text-slate-500">24h Exclusivity</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Orders</span>
              <div className="font-mono font-black text-slate-900 text-lg mt-1">{dealerOrders.length} Shipments</div>
              <span className="text-[10px] text-slate-500">Confirmed RoRo</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Registered Staff</span>
              <div className="font-mono font-black text-slate-900 text-lg mt-1">{dealerUsers.length || 1} Users</div>
              <span className="text-[10px] text-emerald-600 font-semibold">MFA Enabled</span>
            </div>
          </div>

          {/* Legal & Corporate Profile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Legal &amp; Business Profile</span>
              </h3>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">NZBN:</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                    {dealer.nzbn}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Dealer Code:</span>
                  <span className="font-mono font-bold text-slate-800">{dealer.dealerCode}</span>
                </div>

                <div className="flex items-start justify-between py-1 border-b border-slate-100 gap-2">
                  <span className="text-slate-500 shrink-0">Physical Showroom:</span>
                  <span className="font-medium text-slate-800 text-right">{dealer.address}</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Operating Region:</span>
                  <span className="font-semibold text-slate-700">{dealer.region}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Terms Version:</span>
                  <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{dealer.termsAcceptedVersion || "v2026.1 (Accepted)"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Primary Principal & Contacts */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Primary Dealership Principal</span>
              </h3>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Primary Contact:</span>
                  <strong className="text-slate-900">{dealer.primaryContactName}</strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email Address:</span>
                  <a
                    href={`mailto:${dealer.primaryContactEmail}`}
                    className="text-blue-600 hover:underline font-medium flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{dealer.primaryContactEmail}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Direct Phone:</span>
                  <a
                    href={`tel:${dealer.primaryContactPhone}`}
                    className="text-slate-700 hover:text-slate-900 font-mono flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{dealer.primaryContactPhone}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Holding Credit Limit:</span>
                  <span className="font-mono font-bold text-slate-900">$350,000 NZD</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Max Concurrent Holds:</span>
                  <span className="font-mono font-bold text-slate-800">3 Vehicles Max</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Zone Assignment Control */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 space-y-4">
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
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pricing Zone Updated!</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
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
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                      ? "bg-white border-[#E11D48] ring-2 ring-[#E11D48]/20 shadow-xs"
                      : "bg-white/80 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-slate-900">{zoneKey}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#E11D48]" />}
                    </div>
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{z.zoneName}</p>
                    <div className="mt-2 font-mono font-bold text-slate-900 text-xs">
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
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Save New Zone Assignment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {dealer.status === "PENDING_APPROVAL" ? (
              <span className="text-amber-800 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
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
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer"
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
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
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
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
