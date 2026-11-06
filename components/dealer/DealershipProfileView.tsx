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
  KeyRound,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Car,
  Package,
  AlertCircle,
  UserPlus,
  Edit3,
  X,
} from "lucide-react";

export default function DealershipProfileView() {
  const { currentDealer, currentUser } = useAuth();
  const isDealerAdmin = currentUser?.role === "DEALER_ADMIN" || currentUser?.role === "AUTOHUB_ADMIN";
  const { orders, reservations, users, addUser, toggleUserStatus, updateDealerProfile } = useProgramme();

  const [activeSubTab, setActiveSubTab] = useState<"DETAILS" | "PRICING" | "USERS" | "COMPLIANCE">("DETAILS");
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  // Staff Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"DEALER_USER" | "DEALER_ADMIN">("DEALER_USER");
  const [staffSuccessNotice, setStaffSuccessNotice] = useState<string | null>(null);

  // Primary Contact Edit State
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [contactNameInput, setContactNameInput] = useState(currentDealer?.primaryContactName || "David Miller");
  const [contactEmailInput, setContactEmailInput] = useState(currentDealer?.primaryContactEmail || "dealer@aucklandnissan.co.nz");
  const [contactPhoneInput, setContactPhoneInput] = useState(currentDealer?.primaryContactPhone || "+64 9 520 8899");

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim() || !currentDealer) return;
    audio.playSuccessChime();
    addUser({
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      phone: newStaffPhone.trim() || "+64 9 520 8899",
      role: newStaffRole,
      dealerId: currentDealer.id,
      dealershipName: currentDealer.legalTradingName,
      active: true,
      mfaEnabled: true,
      department: "Commercial Operations",
    });
    setStaffSuccessNotice(`Authorized staff account created for ${newStaffName} (${newStaffEmail}). Invitation dispatched.`);
    setIsInviteModalOpen(false);
    setNewStaffName("");
    setNewStaffEmail("");
    setNewStaffPhone("");
    setTimeout(() => setStaffSuccessNotice(null), 4500);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDealer) return;
    audio.playSuccessChime();
    updateDealerProfile(currentDealer.id, {
      primaryContactName: contactNameInput.trim(),
      primaryContactEmail: contactEmailInput.trim(),
      primaryContactPhone: contactPhoneInput.trim(),
    });
    setIsEditContactOpen(false);
    setStaffSuccessNotice("Dealership Principal primary contact credentials updated.");
    setTimeout(() => setStaffSuccessNotice(null), 4000);
  };

  const [selectedPreviewZone, setSelectedPreviewZone] = useState<ZoneId>(
    currentDealer?.pricingZoneId || "ZONE_1"
  );

  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";
  const activeZoneConfig = OFFICIAL_PRICING_ZONES[selectedPreviewZone];

  const targetDealerId = currentDealer?.id || currentUser?.dealerId;

  // Dealership specific statistics (strict tenant boundary)
  const activeOrdersCount = orders.filter(
    (o) => (targetDealerId ? o.dealerId === targetDealerId : false)
  ).length;

  const activeHoldsCount = reservations.filter(
    (r) =>
      r.status === "ACTIVE_HOLD" &&
      (targetDealerId ? r.dealerId === targetDealerId : false)
  ).length;

  // Filter users belonging to this dealership
  const dealerStaff = users.filter(
    (u) =>
      (targetDealerId && u.dealerId === targetDealerId) ||
      (currentDealer?.legalTradingName && u.dealershipName?.includes(currentDealer.legalTradingName))
  );

  const handleDownloadAgreement = () => {
    audio.playSuccessChime();
    setDownloadNotice("Downloading signed Nissan NZ Terms of Trade & Commercial Boundary Agreement (v2026.1)...");
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-8xl mx-auto animate-in fade-in duration-300">
      {/* Toast Notice Banners */}
      {staffSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{staffSuccessNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setStaffSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-700 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadNotice(null)}
            className="text-slate-600 hover:text-slate-900 text-xs cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Clean Top Header & Sub-Tabs (Soft Shadow + Outline)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">


            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
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
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200"
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
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
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
                  <Building2 className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Showroom &amp; Receiving Yard
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Official drop-off destination for domestic delivery
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full bg-slate-100  text-[11px] font-bold text-slate-700 border border-slate-200/60">
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
                <span className="text-slate-500  text-[11px] block">
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

              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Primary Contact
                  </span>
                  {isDealerAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setIsEditContactOpen(true);
                      }}
                      className="text-[11px] font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Contact Details</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <span className="text-sm font-bold text-slate-900">
                    {currentDealer?.primaryContactName || "David Miller"}
                  </span>
                  <div className="flex items-center gap-3 text-slate-600 text-[11px] flex-wrap">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentDealer?.primaryContactEmail || "dealer@aucklandnissan.co.nz"}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{currentDealer?.primaryContactPhone || "+64 9 520 8899"}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simplified Delivery Note */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs flex items-center gap-2.5 text-slate-600">
              <Truck className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-[11px]">
                Fixed price includes <strong>2 standard domestic transport movements</strong> (Port ➔ Compliance Hub ➔ Greenlane Yard).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. SUBTAB: Pricing Schedule (Zone 1 - 5 Comparison)         */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeSubTab === "PRICING" && (
        <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Section 4 Commercial Model
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
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
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"] as ZoneId[]).map((zKey) => (
                <button
                  key={zKey}
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setSelectedPreviewZone(zKey);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedPreviewZone === zKey
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
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Selected Schedule
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {activeZoneConfig.zoneName} ({activeZoneConfig.coverage})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Key drop-off hubs: {activeZoneConfig.majorLocations.join(", ")}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold">Standard 2x NZ Tow Total</span>
              <span className="text-xl font-bold  text-slate-900">
                ${activeZoneConfig.deliveryCostNZD.toLocaleString()} NZD
              </span>
            </div>
          </div>

          {/* 5 Component Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">RoRo Marine Freight</span>
              <span className="text-base font-bold  text-slate-900 block">
                ${activeZoneConfig.oceanFreightNZD.toLocaleString()} NZD
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">Customs &amp; MPI Bio</span>
              <span className="text-base font-bold  text-slate-900 block">
                ${activeZoneConfig.customsProcessingNZD.toLocaleString()} NZD
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">MR2A Compliance</span>
              <span className="text-base font-bold  text-slate-900 block">
                ${activeZoneConfig.complianceInspectionNZD.toLocaleString()} NZD
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-semibold">2x Domestic Movements</span>
              <span className="text-base font-bold  text-slate-900 block">
                ${activeZoneConfig.deliveryCostNZD.toLocaleString()} NZD
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] text-slate-400 block uppercase font-bold">Programme Fee</span>
              <span className="text-base font-bold  text-slate-900 block">
                ${activeZoneConfig.programmeFeeNZD.toLocaleString()} NZD
              </span>
            </div>
          </div>

          {/* Full Comparative Zone Matrix (Zone 1 - 5) */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase text-slate-500">
                National Geographic Schedule Benchmark (Zone 1 - 5)
              </h3>
              <span className="text-[10px] text-slate-400 ">
                Formula verified by AutoHub Logistics
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 touch-scroll navy-scrollbar">
              <table className="w-full text-xs text-left min-w-[720px]">
                <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-slate-600">Zone ID</th>
                    <th className="py-3 px-4 text-slate-600">Territory</th>
                    <th className="py-3 px-4 text-slate-600">RoRo Ocean</th>
                    <th className="py-3 px-4 text-slate-600">Customs &amp; Bio</th>
                    <th className="py-3 px-4 text-slate-600">MR2A Standard</th>
                    <th className="py-3 px-4 text-slate-600">2x NZ Tow</th>
                    <th className="py-3 px-4 text-slate-600">Programme Fee</th>
                    <th className="py-3 px-4 text-right text-slate-700">Fixed Overhead Total</th>
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
                          ? "bg-slate-50/80 font-medium text-slate-900"
                          : "hover:bg-slate-50/40 text-slate-600"
                          }`}
                      >
                        <td className="py-3 px-4  font-bold">
                          <span className="flex items-center gap-1.5">
                            {zid}
                            {isMyZone && (
                              <span className="px-2 py-0.5 rounded text-[9px] bg-slate-900 text-white font-semibold uppercase tracking-wider">
                                Assigned
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[11px]">{z.zoneName}</td>
                        <td className="py-3 px-4 ">${z.oceanFreightNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 ">${z.customsProcessingNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 ">${z.complianceInspectionNZD.toLocaleString()}</td>
                        <td className="py-3 px-4  font-bold text-slate-900">${z.deliveryCostNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 ">${z.programmeFeeNZD.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right  font-bold text-slate-900">
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
        <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Dealer Governance
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
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

            {isDealerAdmin ? (
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setIsInviteModalOpen(true);
                }}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-soft transition-all self-start sm:self-auto shrink-0 active:scale-[0.98]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Authorized Buyer</span>
              </button>
            ) : (
              <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl self-start sm:self-auto shrink-0">
                Principal Authority Required to Invite Staff
              </span>
            )}
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
                    <span className="text-[10px]  px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                      {staff.role}
                    </span>
                  </div>

                  <p className="text-slate-500 text-[11px] truncate">{staff.email}</p>
                  <p className="text-slate-400 text-[11px] ">{staff.phone || "+64 9 520 8899"}</p>

                  <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 ">
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
        <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Contractual Evidence
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
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
              <strong className="text-sm font-bold text-slate-900 block">
                {currentDealer?.termsAcceptedVersion || "v2026.1"}
              </strong>
              <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Both Acknowledgements Checked</span>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Execution Date</span>
              <strong className="text-sm font-bold text-slate-900 block">
                {currentDealer?.termsAcceptedAt ? new Date(currentDealer.termsAcceptedAt).toLocaleDateString("en-NZ", { dateStyle: "long" }) : "15 October 2026"}
              </strong>
              <span className="text-[11px] text-slate-500 ">
                Hash: SHA256:7f92a...c029
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Signatory</span>
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
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Section 4: Commercial Boundary Specification
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Left Column: Included in Total Buy Price */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Included in Total Buy Price</span>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Vehicle acquisition cost</strong> (Japan wholesale FOB rate)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Standard door-to-door shipment</strong> (Pacific RoRo transit)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Customs processing and NZ GST</strong> (15% import clearance)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Standard compliance inspection toward MR2A</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Two standard NZ delivery movements</strong> (Port to Centre, Centre to Yard)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Nissan programme component</strong> using approved dealer wording</span>
                  </li>
                </ul>
              </div>

              {/* Right Column: Potential Additional Dealer Cost */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 text-slate-900 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Potential Additional Dealer Cost (Separately Chargeable)</span>
                </div>
                <ul className="space-y-2 text-[11px] text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Compliance repairs</strong> (OEM replacement parts required for pass)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Repair certification / engineering evidence</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Parts, labour or testing</strong> beyond standard compliance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Border flag clearance</strong> (special quarantine or fumigation)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Non-standard storage, transport or redelivery</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. MODAL: Edit Primary Contact Details (DEALER_ADMIN only)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isEditContactOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Primary Dealership Contact
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official contact credentials for wholesale delivery notices &amp; order execution.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditContactOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Primary Contact Full Name <span className="text-[#C3002F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactNameInput}
                  onChange={(e) => setContactNameInput(e.target.value)}
                  placeholder="e.g. David Miller"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Business Email Address <span className="text-[#C3002F]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={contactEmailInput}
                  onChange={(e) => setContactEmailInput(e.target.value)}
                  placeholder="e.g. dealer@aucklandnissan.co.nz"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Contact Phone Number <span className="text-[#C3002F]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhoneInput}
                  onChange={(e) => setContactPhoneInput(e.target.value)}
                  placeholder="e.g. +64 9 520 8899"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditContactOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. MODAL: Invite Staff User (DEALER_ADMIN only)             */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Invite Authorized Dealership Buyer
                  </h3>
                  <p className="text-xs text-slate-500">
                    Grant procurement and reservation rights for {currentDealer?.legalTradingName || "your dealership"}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteStaff} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Staff Full Name <span className="text-[#C3002F]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="e.g. Jason Bell"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Corporate Email <span className="text-[#C3002F]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                  placeholder="e.g. jason@dealership.co.nz"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="e.g. +64 21 000 0000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 block">
                  Assigned Authority Role
                </label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as "DEALER_USER" | "DEALER_ADMIN")}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs cursor-pointer"
                >
                  <option value="DEALER_USER">Dealer User (Search Catalogue &amp; Reserve Stock)</option>
                  <option value="DEALER_ADMIN">Dealer Administrator (Full Dealership Roster &amp; Management)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
                >
                  Dispatch Staff Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
