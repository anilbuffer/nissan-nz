"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useProgramme } from "@/lib/programme-context";
import { OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { ZoneId } from "@/lib/types";
import {
  Building2,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle2,
  FileText,
  User,
  Users,
  Phone,
  Mail,
  Clock,
  Download,
  CreditCard,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Car,
  Package,
  AlertCircle,
} from "lucide-react";

export default function DealershipProfileView() {
  const { currentDealer, currentUser } = useAuth();
  const { orders, reservations, users } = useProgramme();

  const [activeSubTab, setActiveSubTab] = useState<"DETAILS" | "PRICING" | "USERS" | "COMPLIANCE">("DETAILS");
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [selectedPreviewZone, setSelectedPreviewZone] = useState<ZoneId>(
    currentDealer?.pricingZoneId || "ZONE_1"
  );

  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";
  const activeZoneConfig = OFFICIAL_PRICING_ZONES[selectedPreviewZone];

  // Dealership specific statistics
  const activeOrdersCount = orders.filter(
    (o) => !currentDealer?.id || o.dealerId === currentDealer.id
  ).length;

  const activeHoldsCount = reservations.filter(
    (r) =>
      r.status === "ACTIVE_HOLD" &&
      (!currentDealer?.id || r.dealerId === currentDealer.id)
  ).length;

  // Filter users belonging to this dealership
  const dealerStaff = users.filter(
    (u) =>
      u.dealerId === (currentDealer?.id || "DEALER_001") ||
      u.dealershipName?.includes(currentDealer?.legalTradingName || "Auckland Nissan")
  );

  const handleDownloadAgreement = () => {
    audio.playSuccessChime();
    setDownloadNotice("Downloading signed Nissan NZ Terms of Trade & Commercial Boundary Agreement (v2026.1)...");
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Clean Top Header & Sub-Tabs (Soft Shadow + Outline)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#E11D48] bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/70">
                Nissan Franchise Dealership
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
                Approved &amp; Active
              </span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Code: {currentDealer?.dealerCode || "NZ-NIS-AKL01"} · {dealerZone}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              {currentDealer?.legalTradingName || "Auckland Nissan City Ltd"}
            </h1>

            <p className="text-xs text-slate-500 font-medium">
              {currentDealer?.address || "360 Great South Road, Greenlane, Auckland"} · NZBN: {currentDealer?.nzbn || "9429038291024"}
            </p>
          </div>
        </div>

        {/* Tab Navigation Strip (Clean Outline Pills with Soft Shadow) */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: "DETAILS", label: "Showroom & Logistics", icon: Building2 },
            { id: "PRICING", label: "Pricing Schedule", icon: Truck },
            { id: "USERS", label: `Authorized Staff (${dealerStaff.length})`, icon: Users },
            { id: "COMPLIANCE", label: "Commercial Terms", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setActiveSubTab(tab.id as any);
                }}
                className={`btn-outline px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  isActive
                    ? "bg-[#0A1322] text-white border-[#0A1322] shadow-xs"
                    : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-rose-400" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {downloadNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. SUBTAB: Dealership Details & Physical Showroom           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeSubTab === "DETAILS" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Primary Identity & Receiving Facility */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
                    <Building2 className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Showroom &amp; Receiving Yard
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                      Official drop-off destination for domestic delivery
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-slate-100 font-mono text-[11px] font-bold text-slate-700 border border-slate-200/60">
                  {dealerZone} Scheduled
                </span>
              </div>

              {/* Streamlined Info Grid: Clean & Concise */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Trading Entity
                  </span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {currentDealer?.legalTradingName || "Auckland Nissan City Ltd"}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] block">
                    NZBN: {currentDealer?.nzbn || "9429038291024"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Receiving Yard Location
                  </span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {currentDealer?.address || "360 Great South Road, Greenlane, Auckland"}
                  </span>
                  <span className="text-slate-500 text-[11px] block">
                    Mon–Fri, 07:30 – 17:30 NZST
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1 sm:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Primary Contact
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <span className="text-sm font-bold text-slate-900">
                      {currentDealer?.primaryContactName || "David Miller"}
                    </span>
                    <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{currentDealer?.primaryContactEmail || "dealer@aucklandnissan.co.nz"}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{currentDealer?.primaryContactPhone || "+64 9 520 8899"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simplified Delivery Note */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs flex items-center gap-2.5 text-slate-600">
                <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px]">
                  Fixed price includes <strong>2 standard domestic transport movements</strong> (Port ➔ Compliance Hub ➔ Greenlane Yard).
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Credit Facility & Commercial Entitlement */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E11D48]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Wholesale Holding Limit</h3>
                  <p className="text-[11px] text-slate-400">Programme commercial facility</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Active Allocations:</span>
                  <strong className="text-sm font-mono text-slate-900">$101,899 NZD</strong>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-[#E11D48] rounded-full w-[28%]" />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Utilized: 28%</span>
                  <span>Credit Cap: $500,000 NZD</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Permitted 24h Holds:</span>
                  <strong className="text-slate-800 font-mono">Up to 4 Concurrent</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Deposit Requirement:</span>
                  <strong className="text-emerald-700 font-semibold">Exempt (Approved Franchise)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Settlement Basis:</span>
                  <strong className="text-slate-800 font-mono">Net 14 Days Post-Pass</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadAgreement}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Facility Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. SUBTAB: Pricing Schedule (Zone 1 - 5 Comparison)         */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeSubTab === "PRICING" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
                  Section 4 Commercial Model
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Fixed Wholesale Landed Formula
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Official Geographic Zone Pricing Schedule
              </h2>
              <p className="text-xs text-slate-500">
                All 5 fixed-cost components guaranteed by Nissan Used Vehicle Programme with standard MR2A entry inspection.
              </p>
            </div>

            {/* Zone Selector Pill */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              {(["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"] as ZoneId[]).map((zKey) => (
                <button
                  key={zKey}
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setSelectedPreviewZone(zKey);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedPreviewZone === zKey
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  {zKey === dealerZone ? `★ ${zKey}` : zKey}
                </button>
              ))}
            </div>
          </div>

          {/* Active Zone Detail Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/60 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-[#E11D48] uppercase tracking-wider block">
                Selected Schedule
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                {activeZoneConfig.zoneName} ({activeZoneConfig.coverage})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Key drop-off hubs: {activeZoneConfig.majorLocations.join(", ")}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Standard 2x NZ Tow Total</span>
              <span className="text-xl font-black font-mono text-slate-900">
                ${activeZoneConfig.deliveryCostNZD.toLocaleString()} NZD
              </span>
            </div>
          </div>

          {/* 5 Component Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">RoRo Marine Freight</span>
              <span className="text-base font-extrabold font-mono text-slate-900 block">
                ${activeZoneConfig.oceanFreightNZD.toLocaleString()} NZD
              </span>
              <span className="text-[10px] text-slate-500 block">Yokohama to Auckland/Lyttelton</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">Customs &amp; MPI Bio</span>
              <span className="text-base font-extrabold font-mono text-slate-900 block">
                ${activeZoneConfig.customsProcessingNZD.toLocaleString()} NZD
              </span>
              <span className="text-[10px] text-slate-500 block">Heat treatment &amp; entry clearance</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">MR2A Compliance</span>
              <span className="text-base font-extrabold font-mono text-slate-900 block">
                ${activeZoneConfig.complianceInspectionNZD.toLocaleString()} NZD
              </span>
              <span className="text-[10px] text-slate-500 block">Standard structural &amp; emissions check</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">2x Domestic Movements</span>
              <span className="text-base font-extrabold font-mono text-slate-900 block">
                ${activeZoneConfig.deliveryCostNZD.toLocaleString()} NZD
              </span>
              <span className="text-[10px] text-slate-500 block">Port to center &amp; to Greenlane</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">Programme Fee</span>
              <span className="text-base font-extrabold font-mono text-slate-900 block">
                ${activeZoneConfig.programmeFeeNZD.toLocaleString()} NZD
              </span>
              <span className="text-[10px] text-slate-500 block">Nissan certified provenance fee</span>
            </div>
          </div>

          {/* Section 4 Boundary Guarantee Notice */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs flex items-start gap-3.5 text-amber-900">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed text-[11px]">
              <strong className="block font-bold">Commercial Boundary Policy (Section 4):</strong>
              The fixed Total Buy Price assumes a standard compliance pass. Potential additional dealer costs such as compliance defect repairs, repair certification, or requested accessories will be itemized with photographic evidence and presented for your active approval before work proceeds.
            </div>
          </div>

          {/* Full Comparative Zone Matrix (Zone 1 - 5) */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                National Geographic Schedule Benchmark (Zone 1 - 5)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Formula verified by AutoHub Logistics
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 touch-scroll navy-scrollbar">
              <table className="w-full text-xs text-left min-w-[720px]">
                <thead className="bg-[#0A1322] text-white text-[10px] font-bold uppercase tracking-wider border-b border-[#1B2A42]">
                  <tr>
                    <th className="py-3.5 px-4 text-slate-200">Zone ID</th>
                    <th className="py-3.5 px-4 text-slate-200">Territory</th>
                    <th className="py-3.5 px-4 text-slate-200">RoRo Ocean</th>
                    <th className="py-3.5 px-4 text-slate-200">Customs &amp; Bio</th>
                    <th className="py-3.5 px-4 text-slate-200">MR2A Standard</th>
                    <th className="py-3.5 px-4 text-slate-200">2x NZ Tow</th>
                    <th className="py-3.5 px-4 text-slate-200">Programme Fee</th>
                    <th className="py-3.5 px-4 text-right text-slate-200">Fixed Overhead Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"] as ZoneId[]).map((zid) => {
                    const z = OFFICIAL_PRICING_ZONES[zid];
                    const isMyZone = zid === dealerZone;
                    const totalFixed = z.oceanFreightNZD + z.customsProcessingNZD + z.complianceInspectionNZD + z.deliveryCostNZD + z.programmeFeeNZD;

                    return (
                      <tr
                        key={zid}
                        className={`transition-colors ${isMyZone
                          ? "bg-rose-50/60 font-semibold text-slate-900"
                          : "hover:bg-slate-50/50 text-slate-600"
                          }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className="flex items-center gap-1.5">
                            {zid}
                            {isMyZone && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#E11D48] text-white uppercase font-sans">
                                Assigned
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px]">{z.zoneName}</td>
                        <td className="py-3 px-4 font-mono">${z.oceanFreightNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono">${z.customsProcessingNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono">${z.complianceInspectionNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono font-bold">${z.deliveryCostNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono">${z.programmeFeeNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          ${totalFixed.toLocaleString()} NZD
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. SUBTAB: Permitted Staff Users (US-05)                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeSubTab === "USERS" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
                  Dealer Governance (US-05)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  Role-Based Access Control
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Permitted Dealership Personnel
              </h2>
              <p className="text-xs text-slate-500">
                Franchise staff authorized to place atomic holds, review landed costs, and sign off order milestones.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dealerStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-start gap-4 shadow-2xs"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold flex items-center justify-center text-sm border border-slate-700 shrink-0">
                    {staff.name.charAt(0)}
                  </div>
                  {staff.active && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 truncate">{staff.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {staff.role}
                    </span>
                  </div>

                  <p className="text-slate-500 text-[11px] truncate">{staff.email}</p>
                  <p className="text-slate-400 text-[11px] font-mono">{staff.phone || "+64 9 520 8899"}</p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-slate-400" />
                      <span>MFA: {staff.mfaEnabled ? "Enabled" : "Disabled"}</span>
                    </span>
                    <span>•</span>
                    <span>Last login: {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleDateString() : "Active"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. SUBTAB: Commercial Terms Agreement & Version Snapshot    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeSubTab === "COMPLIANCE" && (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
                  Contractual Evidence
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Legally Executed
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Terms of Trade &amp; Commercial Boundary Agreement
              </h2>
              <p className="text-xs text-slate-500">
                Verified digital execution by authorized dealership representative.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadAgreement}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Signed Agreement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Terms Version Snapshot</span>
              <strong className="text-sm font-bold text-slate-900 block font-mono">
                {currentDealer?.termsAcceptedVersion || "v2026.1"}
              </strong>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Both Acknowledgements Checked</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Execution Timestamp</span>
              <strong className="text-sm font-bold text-slate-900 block font-mono">
                {currentDealer?.termsAcceptedAt ? new Date(currentDealer.termsAcceptedAt).toLocaleDateString("en-NZ", { dateStyle: "long" }) : "15 October 2026"}
              </strong>
              <span className="text-[11px] text-slate-500 font-mono">
                Hash: SHA256:7f92a...c029
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Executing Signatory</span>
              <strong className="text-sm font-bold text-slate-900 block">
                {currentDealer?.primaryContactName || "David Miller"}
              </strong>
              <span className="text-[11px] text-slate-500">
                General Manager &amp; Dealer Principal
              </span>
            </div>
          </div>

          {/* Section 4 Commercial Boundary Two-Column Comparison */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              Section 4: Commercial Boundary Specification
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left Column: Included in Total Buy Price */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 text-emerald-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Included in Total Buy Price</span>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Vehicle acquisition cost</strong> (Japan wholesale FOB rate)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Standard door-to-door shipment</strong> (Pacific RoRo transit)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Customs processing and NZ GST</strong> (15% import clearance)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Standard compliance inspection toward MR2A</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Two standard NZ delivery movements</strong> (Port to Centre, Centre to Yard)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span><strong>Nissan programme component</strong> using approved dealer wording</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Potential Additional Dealer Cost */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200 text-amber-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Potential Additional Dealer Cost (Separately Chargeable)</span>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Compliance repairs</strong> (OEM replacement parts required for pass)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Repair certification / engineering evidence</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Parts, labour or testing</strong> beyond standard compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Border flag clearance</strong> (special quarantine or fumigation)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Non-standard storage, transport or redelivery</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span><strong>Dealer-requested accessories, modifications or grooming</strong></span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 italic">
              <strong>Mandatory Portal Disclosure:</strong> The portal must state that the fixed price assumes a standard compliance pass. Separately chargeable work will be identified at the time of invoicing and requires active dealer confirmation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
