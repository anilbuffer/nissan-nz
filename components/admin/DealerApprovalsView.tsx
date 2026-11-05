"use client";

import React, { useState } from "react";
import { DealerAccount, ZoneId } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Users,
  CheckCircle2,
  XCircle,
  Building2,
  FileCheck2,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Eye,
  Search,
  FileText,
  AlertTriangle,
  Car,
  Hash,
  Award,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function DealerApprovalsView() {
  const { dealers, approveDealer, rejectDealer, returnDealerApplication, updateDealerZone, orders, reservations, users, addUser, toggleUserStatus } = useProgramme();

  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Track pending zone selection in main view for pending applicants
  const [pendingZoneMap, setPendingZoneMap] = useState<Record<string, ZoneId>>({
    DEALER_005: "ZONE_5",
  });

  // Track zone selection inside the details view
  const [detailSelectedZone, setDetailSelectedZone] = useState<ZoneId | null>(null);
  const [hasSavedDetailZone, setHasSavedDetailZone] = useState(false);

  // Status Filter: ALL | PENDING_APPROVAL | RETURNED_FOR_INFO | APPROVED | REJECTED
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_APPROVAL" | "RETURNED_FOR_INFO" | "APPROVED" | "REJECTED">("ALL");

  // Return for Information Modal State
  const [returnModalDealer, setReturnModalDealer] = useState<DealerAccount | null>(null);
  const [returnReasonInput, setReturnReasonInput] = useState("");

  // Reject Modal State
  const [rejectModalDealer, setRejectModalDealer] = useState<DealerAccount | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // Invite Staff Modal State for Dealership Dossier
  const [isInviteStaffOpen, setIsInviteStaffOpen] = useState(false);
  const [staffNameInput, setStaffNameInput] = useState("");
  const [staffEmailInput, setStaffEmailInput] = useState("");
  const [staffPhoneInput, setStaffPhoneInput] = useState("");
  const [staffRoleInput, setStaffRoleInput] = useState<"DEALER_USER" | "DEALER_ADMIN">("DEALER_USER");

  const handleConfirmReturn = () => {
    if (!returnModalDealer) return;
    audio.playSuccessChime();
    const reason = returnReasonInput.trim() || "Missing required certificate of incorporation or showroom depot access clarification.";
    returnDealerApplication(returnModalDealer.id, reason);
    setNotification(`Application for ${returnModalDealer.legalTradingName} returned to franchise requesting corrections.`);
    setReturnModalDealer(null);
    setReturnReasonInput("");
    setTimeout(() => setNotification(null), 4500);
  };

  const handleConfirmReject = () => {
    if (!rejectModalDealer) return;
    audio.playSubtleClick();
    const reason = rejectReasonInput.trim() || "Territory boundary conflict or failure to meet Nissan franchise compliance criteria.";
    rejectDealer(rejectModalDealer.id, reason);
    setNotification(`Application for ${rejectModalDealer.legalTradingName} declined.`);
    setRejectModalDealer(null);
    setRejectReasonInput("");
    setTimeout(() => setNotification(null), 4500);
  };

  const handleCreateStaff = (e: React.FormEvent, dealerId: string, dealershipName: string) => {
    e.preventDefault();
    if (!staffNameInput.trim() || !staffEmailInput.trim()) return;
    audio.playSuccessChime();
    addUser({
      name: staffNameInput.trim(),
      email: staffEmailInput.trim(),
      phone: staffPhoneInput.trim() || "+64 9 000 0000",
      role: staffRoleInput,
      dealerId,
      dealershipName,
      active: true,
      mfaEnabled: true,
      department: "Commercial Governance",
    });
    setNotification(`User ${staffNameInput} successfully authorized for ${dealershipName}.`);
    setIsInviteStaffOpen(false);
    setStaffNameInput("");
    setStaffEmailInput("");
    setStaffPhoneInput("");
    setTimeout(() => setNotification(null), 4000);
  };

  const approvedDealers = dealers.filter((d) => d.status === "APPROVED");

  // Selected dealer computed from live context
  const selectedDealer = dealers.find((d) => d.id === selectedDealerId) || null;

  const filteredApproved = approvedDealers.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.legalTradingName.toLowerCase().includes(q) ||
      d.dealerCode.toLowerCase().includes(q) ||
      d.nzbn.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.primaryContactName.toLowerCase().includes(q)
    );
  });

  const handleApprove = (dealerId: string, assignedZone?: ZoneId) => {
    audio.playSuccessChime();
    const zone = assignedZone || pendingZoneMap[dealerId] || "ZONE_1";
    approveDealer(dealerId, zone);
    setNotification(`Dealership ${dealerId} approved successfully and assigned to ${zone}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleReject = (dealerId: string) => {
    audio.playSubtleClick();
    rejectDealer(dealerId);
    setNotification(`Dealership application ${dealerId} has been declined.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveDetailZone = (dealerId: string, zoneId: ZoneId) => {
    audio.playSuccessChime();
    updateDealerZone(dealerId, zoneId);
    setHasSavedDetailZone(true);
    setNotification(`Updated pricing zone for dealership to ${zoneId}.`);
    setTimeout(() => {
      setHasSavedDetailZone(false);
      setNotification(null);
    }, 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // A. FULL INNER DETAILS PAGE (When a dealer is selected)
  // ─────────────────────────────────────────────────────────────
  if (selectedDealer) {
    const dealer = selectedDealer;
    const isApproved = dealer.status === "APPROVED";
    const currentZoneId = detailSelectedZone || dealer.pricingZoneId || "ZONE_1";
    const currentZoneConfig = OFFICIAL_PRICING_ZONES[currentZoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;

    // Filter orders and holds belonging to this dealer
    const dealerOrders = orders.filter((o) => o.dealerId === dealer.id);
    const dealerHolds = reservations.filter(
      (r) => r.dealerId === dealer.id && r.status === "ACTIVE_HOLD"
    );
    const dealerUsers = users.filter((u) => u.dealerId === dealer.id);

    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
        {/* Navigation Top Bar */}
        <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setSelectedDealerId(null);
              setDetailSelectedZone(null);
            }}
            className="btn-outline cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Dealers Overview</span>
          </button>

          <div className="flex items-center gap-2">
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{selectedDealer.registrationRole || (selectedDealer.termsAcceptedVersion?.includes("JP-EXPORT") ? "Nissan Japan" : "NZ Dealer")} (Authorized)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 font-mono shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>Pending Authorization</span>
              </span>
            )}
          </div>
        </div>

        {notification && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* 4-Stat Executive Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Assigned Pricing Zone
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealer.pricingZoneId}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Active Exclusivity Holds
            </span>
            <div className="text-xl font-bold text-amber-700 font-mono">
              {dealerHolds.length} Vehicles
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Total Wholesale Orders
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealerOrders.length} Shipments
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Authorized Staff Accounts
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {dealerUsers.length || 1} Registered
            </div>
          </div>
        </div>

        {/* 2-Column Executive Dealership Dossier */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Legal Profile & Allocation Activity */}
          <div className="lg:col-span-7 space-y-6">
            {/* Legal & Business Entity Card */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Franchise Entity Dossier
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {dealer.legalTradingName}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
                  <Building2 className="w-5 h-5 text-slate-600" />
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">New Zealand Business Number (NZBN):</span>
                  <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                    {dealer.nzbn}
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Franchise Dealer Code:</span>
                  <span className="font-mono font-bold text-slate-900">{dealer.dealerCode}</span>
                </div>

                <div className="flex items-start justify-between py-1.5 border-b border-slate-100 gap-3">
                  <span className="text-slate-500 font-medium shrink-0">Showroom Address:</span>
                  <span className="font-medium text-slate-800 text-right">{dealer.address}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Designated Territory:</span>
                  <span className="font-semibold text-slate-800">{dealer.region}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Terms of Trade Agreement:</span>
                  <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dealer.termsAcceptedVersion || "v2026.1 (Fully Executed)"}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Commercial Boundary Acceptance:</span>
                  <span className="font-semibold text-slate-900">
                    {dealer.costBoundaryAccepted ? "Pre-approved & Cost Boundary Enforced" : "Pending Sign-off"}
                  </span>
                </div>
              </div>
            </div>

            {/* Wholesale Allocation & Exclusivity Limits */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileCheck2 className="w-4 h-4 text-[#C3002F]" />
                <span>Commercial Floorplan &amp; Capacity Boundary</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <strong className="text-sm font-bold text-slate-900 font-mono block">$350,000 NZD</strong>
                  <span className="text-[10px] text-slate-500">Tier 1 Nissan Floorplan</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <strong className="text-sm font-bold text-slate-900 font-mono block">3 Units Max</strong>
                  <span className="text-[10px] text-slate-500">Atomic 24h Lock Limit</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                  <strong className="text-sm font-bold text-emerald-700 block">Self-Service Active</strong>
                  <span className="text-[10px] text-slate-500">Wholesale Catalogue Access</span>
                </div>
              </div>
            </div>

            {/* Active Inventory Activity for this Dealership */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Car className="w-4 h-4 text-slate-600" />
                  <span>Active Stock Holds &amp; Direct Orders ({dealerHolds.length + dealerOrders.length})</span>
                </div>
              </div>

              {dealerHolds.length === 0 && dealerOrders.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                  No active vehicle holds or pending shipments for this dealership right now.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dealerHolds.map((hold) => (
                    <div
                      key={hold.id}
                      className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <strong className="text-slate-900">
                            #{hold.vehicle?.stockId} · {hold.vehicle?.model}
                          </strong>
                          <span className="text-slate-500 text-[11px] block">
                            24h Exclusivity Hold · Buyer: {hold.userName}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        ${hold.priceSnapshot.totalBuyPriceNZD.toLocaleString()} NZD
                      </span>
                    </div>
                  ))}

                  {dealerOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="text-slate-900">
                            Order #{order.orderNumber} · {order.vehicle?.make} {order.vehicle?.model}
                          </strong>
                          <span className="text-slate-500 text-[11px] block">
                            Milestone: {order.currentMilestone} · Zone: {order.pricingZoneId}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        \${order.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()} NZD
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact Dossier, Interactive Zone Config & Admin Actions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Primary Principal Card */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Authorized Dealer Principal
              </span>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Principal Name:</span>
                  <strong className="text-slate-900 font-bold">{dealer.primaryContactName}</strong>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Direct Email:</span>
                  <a
                    href={`mailto:${dealer.primaryContactEmail}`}
                    className="text-[#C3002F] hover:underline font-medium flex items-center gap-1 font-mono"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dealer.primaryContactEmail}</span>
                  </a>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Direct Telephone:</span>
                  <a
                    href={`tel:${dealer.primaryContactPhone}`}
                    className="text-slate-800 hover:text-slate-900 font-mono font-medium flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dealer.primaryContactPhone}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Interactive Pricing & Towing Zone Configuration */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Geographic Pricing Zone Configuration
                  </h3>
                  {hasSavedDetailZone && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Saved!</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Determines the fixed wholesale landed towing rate ($650 – $1,750 NZD) attached to all vehicle quotes for this dealer.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {(Object.keys(OFFICIAL_PRICING_ZONES) as ZoneId[]).map((zoneKey) => {
                  const z = OFFICIAL_PRICING_ZONES[zoneKey];
                  const isSelected = currentZoneId === zoneKey;

                  return (
                    <button
                      key={zoneKey}
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setDetailSelectedZone(zoneKey);
                      }}
                      className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${isSelected
                        ? "bg-slate-50 border-[#C3002F] ring-2 ring-[#C3002F]/10 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900">{zoneKey}</span>
                          <span className="text-xs font-semibold text-slate-700">· {z.zoneName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                          {z.majorLocations.join(", ")}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          ${z.deliveryCostNZD} <span className="text-[10px] font-normal text-slate-400">NZD</span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#C3002F] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {detailSelectedZone && detailSelectedZone !== dealer.pricingZoneId && (
                <button
                  type="button"
                  onClick={() => handleSaveDetailZone(dealer.id, detailSelectedZone)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Save Zone Assignment ({detailSelectedZone})</span>
                </button>
              )}
            </div>

            {/* Administrative Operational Authority */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Administrative Operational Authority
              </span>

              {!isApproved ? (
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleApprove(dealer.id, currentZoneId)}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize {dealer.registrationRole || (dealer.termsAcceptedVersion?.includes("JP-EXPORT") ? "Nissan Japan" : "NZ Dealer")} &amp; Assign Zone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReject(dealer.id)}
                    className="w-full btn-outline py-2.5 px-4 text-xs text-rose-700 hover:bg-rose-50 hover:border-rose-200 justify-center"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Decline Application</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{dealer.registrationRole || (dealer.termsAcceptedVersion?.includes("JP-EXPORT") ? "Nissan Japan Facility" : "NZ Dealer")} Fully Operational</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    This dealership holds authorized credentials to browse wholesale stock, place 24h locks, and access guaranteed landed pricing.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // B. MAIN DEALERS OVERVIEW (Everything Open Without Tabs)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Clean Nissan Corporate Operations Bar            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Franchise Dealers &amp; Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete franchise network directory, authorized dealership entities, NZBN verification, and domestic towing zone assignments.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Executive Network 3-KPI Metric Strip                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Total Network
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {dealers.length}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Active Showrooms
          </span>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {approvedDealers.length}
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            National Coverage
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            5 Zones
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Global Network Search Toolbar                            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by legal name, dealer code, NZBN, or region..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-all font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono hidden sm:block">
          {dealers.length} Dealerships Registered
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Approved Franchise Network Directory   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Franchise Dealership Network ({approvedDealers.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Nissan franchise dealers authorized for wholesale catalogue ordering and 24h holds.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredApproved.length} Dealerships Visible
          </div>
        </div>

        <div className="overflow-x-auto touch-scroll navy-scrollbar">
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
                      ${zone.deliveryCostNZD.toLocaleString()} NZD
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-900">{d.primaryContactName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{d.primaryContactEmail}</div>
                    </td>

                    <td className="py-4 px-4">
                      <StatusBadge status={d.status || "APPROVED"} size="sm" />
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
        </div>
      </div>
    </div>
  );
}
