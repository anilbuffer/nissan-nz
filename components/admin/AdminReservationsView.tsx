"use client";

import React, { useState } from "react";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { ReservationRequest, ReservationConfig } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  Clock,
  Car,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Building2,
  Search,
  Eye,
  MapPin,
  Calendar,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileCheck2,
  Gauge,
  Star,
  TrendingUp,
  FileText,
  AlertCircle,
  Hash,
  ShieldAlert,
  Sliders,
  Sparkles,
  Zap,
  RotateCcw,
  Ban,
} from "lucide-react";

interface AdminReservationsViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export default function AdminReservationsView({ onNavigateTab }: AdminReservationsViewProps) {
  const { currentUser } = useAuth();
  const isAuditor = false;
  const {
    reservations,
    confirmAllocation,
    releaseHold,
    rejectReservation,
    cancelReservation,
    expireReservation,
    simulateExpiryWarning,
    reservationConfig,
    updateReservationConfig,
  } = useProgramme();

  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);

  // US-15 Rules Modal State
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [draftRules, setDraftRules] = useState<ReservationConfig>(reservationConfig);

  // Quick Action Modal for confirm / release / reject / cancel
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "CONFIRM" | "RELEASE" | "REJECT" | "CANCEL";
    reservation: ReservationRequest | null;
    reason: string;
  }>({
    isOpen: false,
    type: "CONFIRM",
    reservation: null,
    reason: "",
  });

  const activeReservations = reservations.filter((r) => r.status === "ACTIVE_HOLD");
  const historyReservations = reservations.filter((r) => r.status !== "ACTIVE_HOLD");

  const filteredActive = activeReservations.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.requestId.toLowerCase().includes(q) ||
      r.dealerName.toLowerCase().includes(q) ||
      r.dealerCode.toLowerCase().includes(q) ||
      r.vehicle?.model?.toLowerCase().includes(q) ||
      r.vehicle?.stockId?.toLowerCase().includes(q) ||
      r.vehicle?.vinChassis?.toLowerCase().includes(q)
    );
  });

  const filteredHistory = historyReservations.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.requestId.toLowerCase().includes(q) ||
      r.dealerName.toLowerCase().includes(q) ||
      r.dealerCode.toLowerCase().includes(q) ||
      r.vehicle?.model?.toLowerCase().includes(q) ||
      r.vehicle?.stockId?.toLowerCase().includes(q)
    );
  });

  // Calculate dynamic countdown & warning status 
  const calcRemainingTime = (expiresAt: string) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) {
      return { label: "Expired", isExpired: true, isWarning: false, hours: 0, minutes: 0 };
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const threshold = reservationConfig?.warningThresholdHours || 2;
    const isWarning = hours < threshold;
    return {
      label: hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`,
      isExpired: false,
      isWarning,
      hours,
      minutes,
    };
  };

  const openActionDialog = (
    type: "CONFIRM" | "RELEASE" | "REJECT" | "CANCEL",
    res: ReservationRequest
  ) => {
    audio.playSubtleClick();
    const defaultReason =
      type === "CONFIRM"
        ? "Wholesale allocation confirmed by Autohub Ops. Purchase order issued."
        : type === "RELEASE"
          ? "Administrative hold released. Stock returned to available catalog."
          : type === "CANCEL"
            ? "Cancelled under Section 6.2 cooling-off right prior to allocation."
            : "Allocation declined during wholesale review.";

    setActionModal({
      isOpen: true,
      type,
      reservation: res,
      reason: defaultReason,
    });
  };

  const handleExecuteAction = () => {
    if (!actionModal.reservation) return;
    const res = actionModal.reservation;
    const reasonText = actionModal.reason.trim();

    if (actionModal.type === "CONFIRM") {
      audio.playSuccessChime();
      confirmAllocation(res.vehicleId, reasonText);
      setNotification(`Confirmed allocation for #${res.vehicle.stockId} to ${res.dealerName}. Active Order generated.`);
      if (selectedResForDetails?.id === res.id) {
        setSelectedResForDetails({ ...res, status: "CONFIRMED_ALLOCATED" });
      }
    } else if (actionModal.type === "RELEASE") {
      audio.playSubtleClick();
      releaseHold(res.vehicleId, reasonText);
      setNotification(`Released hold for #${res.vehicle.stockId}. Stock returned to Available.`);
      if (selectedResForDetails?.id === res.id) {
        setSelectedResForDetails({ ...res, status: "RELEASED" });
      }
    } else if (actionModal.type === "CANCEL") {
      audio.playSubtleClick();
      cancelReservation(res.id, reasonText, "Autohub Administrator");
      setNotification(`Cancelled hold ${res.requestId} for ${res.dealerName} under Section 6.2.`);
      if (selectedResForDetails?.id === res.id) {
        setSelectedResForDetails({ ...res, status: "CANCELLED" });
      }
    } else if (actionModal.type === "REJECT") {
      audio.playSubtleClick();
      rejectReservation(res.id, reasonText);
      setNotification(`Declined reservation ${res.requestId} for ${res.dealerName}.`);
      if (selectedResForDetails?.id === res.id) {
        setSelectedResForDetails({ ...res, status: "REJECTED" });
      }
    }

    setActionModal({ isOpen: false, type: "CONFIRM", reservation: null, reason: "" });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveRules = () => {
    audio.playSuccessChime();
    updateReservationConfig(draftRules);
    setIsRulesModalOpen(false);
    setNotification("Updated reservation expiry & warning rules successfully.");
    setTimeout(() => setNotification(null), 4000);
  };

  // ─────────────────────────────────────────────────────────────
  // A. INNER DETAILS VIEW (When a reservation is selected)
  // ─────────────────────────────────────────────────────────────
  if (selectedResForDetails) {
    const res = selectedResForDetails;
    const vehicle = res.vehicle;
    const price = res.priceSnapshot;
    const remaining = calcRemainingTime(res.expiresAt);

    return (
      <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setSelectedResForDetails(null);
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reservations Queue</span>
          </button>

          {/* Quick Simulation controls in detail view */}
          {!isAuditor && res.status === "ACTIVE_HOLD" && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">Simulation:</span>
              <button
                type="button"
                onClick={() => {
                  audio.playSoftChime();
                  simulateExpiryWarning(res.id);
                  setNotification(`Simulated warning for ${res.requestId}: expires in 55m (< 2h).`);
                  setSelectedResForDetails({
                    ...res,
                    expiresAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
                  });
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Force time remaining to 55 minutes for warning threshold simulation"
              >
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Simulate 1h Warning</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playWarningChime();
                  expireReservation(res.id, "Simulated auto-release expiry");
                  setNotification(`Simulated auto-release for ${res.requestId}: hold expired.`);
                  setSelectedResForDetails({ ...res, status: "EXPIRED" });
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Immediately expire hold and auto-release stock back to catalogue"
              >
                <Zap className="w-3 h-3 text-rose-600" />
                <span>Simulate Auto-Release</span>
              </button>
            </div>
          )}
        </div>

        {/* Detailed Dossier Card */}
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Dossier Header Banner */}
          <div className="bg-[#0A0A0A] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-white border border-white/15">
                  {res.requestId}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${res.status === "ACTIVE_HOLD"
                      ? remaining.isWarning
                        ? "bg-amber-500 text-black border border-amber-300 font-bold"
                        : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                      : res.status === "CONFIRMED_ALLOCATED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-700 text-slate-300 border border-slate-600"
                    }`}
                >
                  {res.status === "ACTIVE_HOLD"
                    ? remaining.isWarning
                      ? `⚠ WARNING: ${remaining.label}`
                      : `ACTIVE HOLD (${remaining.label})`
                    : res.status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                VIN: {vehicle.vinChassis} · Stock #{vehicle.stockId} · Grade {vehicle.auctionGrade}
              </p>
            </div>

            <div className="text-right sm:self-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Guaranteed Landed Price
              </span>
              <span className="text-2xl font-bold text-white font-mono">
                ${price.totalBuyPriceNZD.toLocaleString()} NZD
              </span>
              <span className="text-[10px] text-emerald-400 block font-mono">
                {price.zoneId} Landed &amp; Complied
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Vehicle & Cost Dossier */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vehicle Specs Grid */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Car className="w-4 h-4 text-[#C3002F]" />
                  <span>Certified Japanese Stock Verification</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Odometer:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {vehicle.odometerKm.toLocaleString()} km
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Powertrain:</span>
                    <span className="font-bold text-slate-800">{vehicle.fuelType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Transmission:</span>
                    <span className="font-bold text-slate-800">{vehicle.transmission}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Auction Grade:</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {vehicle.auctionGrade} / 5.0
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown Matrix */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Fixed-Cost Landed Calculation (Snapshot)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    FX: {price.exchangeRateJPYtoNZD} JPY/NZD
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>FOB Base Cost (¥{price.fobJPY.toLocaleString()}):</span>
                    <span className="font-mono text-slate-900">${price.fobNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Trans-Pacific RoRo Ocean Freight:</span>
                    <span className="font-mono text-slate-900">${price.oceanFreightNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Customs Processing &amp; 15% Landed GST:</span>
                    <span className="font-mono text-slate-900">${(price.customsProcessingNZD + price.gstNZD).toLocaleString()} NZD</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>MAF Bio-Security &amp; NZTA Compliance:</span>
                    <span className="font-mono text-slate-900">${price.complianceInspectionNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Zone Delivery to Dealership ({price.zoneId}):</span>
                    <span className="font-mono text-slate-900">${price.zoneDeliveryNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Nissan Used Vehicle Programme Fee:</span>
                    <span className="font-mono text-slate-900">${price.programmeFeeNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-2 text-sm">
                    <span>Total Landed Buy Price (GST Inclusive):</span>
                    <span className="font-mono text-[#C3002F] font-bold">
                      ${price.totalBuyPriceNZD.toLocaleString()} NZD
                    </span>
                  </div>
                </div>
              </div>

              {/* Compliance & US-12 Confirmation Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dealer Acknowledgement Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Terms of Trade: <strong>{res.termsVersionSnapshot}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Commercial Boundary Acknowledged: <strong>Yes</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Section 6.2 Cancellation Statement: <strong>Yes</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Hold Duration Window: <strong>{reservationConfig?.defaultHoldHours || 24} Hours</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Dealership & Administrative Sign-off Actions */}
            <div className="space-y-6">
              {/* Dealership Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Reserving Dealership</span>
                </div>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dealership Legal Name:</span>
                    <span className="font-bold text-slate-900">{res.dealerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Dealer Code:</span>
                    <span className="font-mono font-bold text-slate-800">{res.dealerCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Ordering Buyer:</span>
                    <span className="text-slate-800 font-medium">{res.userName} ({res.userEmail})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Requested Timestamp:</span>
                    <span className="text-slate-600 font-mono text-[11px]">
                      {new Date(res.requestedAt).toLocaleString("en-NZ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Holding Expiry:</span>
                    <span className="text-amber-800 font-mono font-bold text-[11px]">
                      {new Date(res.expiresAt).toLocaleString("en-NZ")} ({remaining.label})
                    </span>
                  </div>
                </div>
              </div>

              {/* Administrative Action Center  */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="font-bold text-xs text-slate-900 flex items-center justify-between">
                  <span>Autohub Action Center</span>
                  <span className="text-[10px] font-mono text-slate-500">SARAH JENKINS</span>
                </div>

                {res.status === "ACTIVE_HOLD" ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => openActionDialog("CONFIRM", res)}
                      className="w-full py-2.5 px-4 bg-[#0A0A0A] hover:bg-[#444444] text-white rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Confirm Wholesale Allocation</span>
                    </button>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => openActionDialog("RELEASE", res)}
                        className="py-2 px-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Release hold back to open stock"
                      >
                        <Unlock className="w-3 h-3 text-slate-500" />
                        <span>Release</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openActionDialog("CANCEL", res)}
                        className="py-2 px-2 bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Cancel under Section 6.2 cooling-off"
                      >
                        <Ban className="w-3 h-3 text-amber-600" />
                        <span>Cancel (6.2)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openActionDialog("REJECT", res)}
                        className="py-2 px-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                        title="Decline reservation request"
                      >
                        <XCircle className="w-3 h-3 text-rose-500" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center text-xs space-y-1">
                    <span className="font-bold text-slate-800 block">Status: {res.status}</span>
                    <p className="text-[11px] text-slate-500">
                      Reason: {res.decisionReason || "Resolved wholesale process"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Reason Dialog Modal */}
        {actionModal.isOpen && actionModal.reservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-base text-slate-900">
                  {actionModal.type === "CONFIRM" && "Confirm Wholesale Allocation"}
                  {actionModal.type === "RELEASE" && "Release Administrative Hold"}
                  {actionModal.type === "CANCEL" && "Cancel Reservation (Section 6.2)"}
                  {actionModal.type === "REJECT" && "Decline Reservation"}
                </h3>
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, type: "CONFIRM", reservation: null, reason: "" })}
                  className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <p>
                  Target Stock: <strong>#{actionModal.reservation.vehicle.stockId}</strong> ({actionModal.reservation.vehicle.model})
                </p>
                <p>
                  Dealership: <strong>{actionModal.reservation.dealerName}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Action Audit Reason
                </label>
                <textarea
                  rows={3}
                  value={actionModal.reason}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, type: "CONFIRM", reservation: null, reason: "" })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // B. MAIN GRID LAYOUT VIEW (Executive Grid Cards)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner & Scope Tab Switcher                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Reservations &amp; Exclusivity Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor dealer exclusivity holds, countdown timers, warning thresholds, and sign off on wholesale allocation confirmations.
          </p>
        </div>

        {/* Right Header: Rules Config Button + Tab Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isAuditor && (
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setDraftRules(reservationConfig);
                setIsRulesModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              title="Configure default hold duration, warning threshold, and auto-release rules"
            >
              <Sliders className="w-3.5 h-3.5 text-[#C3002F]" />
              <span>Expiry Rules</span>
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setActiveTab("ACTIVE");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "ACTIVE"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Active Holds</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono font-bold">
                {activeReservations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setActiveTab("HISTORY");
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === "HISTORY"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>History &amp; Audit</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                {historyReservations.length}
              </span>
            </button>
          </div>
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
      {/* 2. Compact Search & Filter Toolbar                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by stock ID, model, dealer code, or VIN..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-all font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono hidden sm:block">
          {activeTab === "ACTIVE"
            ? `${filteredActive.length} of ${activeReservations.length} Active Holds`
            : `${filteredHistory.length} of ${historyReservations.length} Records`}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. GRID CARDS SHOWCASE (Executive Grid Layout)             */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "ACTIVE" ? (
        filteredActive.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-slate-200 p-12 text-center space-y-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No Active Exclusivity Holds</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All certified Japanese inventory units are available for dealer purchase.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActive.map((res) => {
              const vehicle = res.vehicle;
              const price = res.priceSnapshot;
              const remaining = calcRemainingTime(res.expiresAt);

              return (
                <div
                  key={res.id}
                  onClick={() => {
                    audio.playSubtleClick();
                    setSelectedResForDetails(res);
                  }}
                  className="bg-white rounded-[24px] border border-slate-200 hover:border-slate-300 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer space-y-4 relative overflow-hidden"
                >
                  <div>
                    {/* Top Header: Title & Dynamic Expiry Badge (US-15) */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#C3002F] transition-colors leading-tight truncate">
                          {vehicle.make} - {vehicle.model}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                          {vehicle.year} · {vehicle.fuelType} · #{vehicle.stockId}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shrink-0 ${remaining.isWarning
                            ? "bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-400/30 animate-pulse"
                            : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}
                        title={
                          remaining.isWarning
                            ? `Warning: Hold expiring within ${reservationConfig?.warningThresholdHours || 2}h (US-15)`
                            : "Active Hold Countdown"
                        }
                      >
                        <Clock className={`w-3 h-3 ${remaining.isWarning ? "text-amber-600" : "text-slate-500"}`} />
                        <span>{remaining.label}</span>
                      </span>
                    </div>

                    {/* Studio Car Image with Ground Shadow */}
                    <div className="relative w-full h-40 my-3 flex items-center justify-center">
                      <div className="absolute bottom-2 w-4/5 h-3.5 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />
                      <img
                        src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                        alt={vehicle.model}
                        className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_10px_14px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 select-none"
                      />
                    </div>

                    {/* Reserving Dealer Information Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <span>Reserving Dealership</span>
                        <span className="font-mono text-slate-700">{res.dealerCode}</span>
                      </div>
                      <div className="font-bold text-slate-900 truncate">
                        {res.dealerName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Buyer: {res.userName}</span>
                        <span className="font-mono font-bold text-slate-700">{price.zoneId}</span>
                      </div>
                    </div>

                    {/* Simulator Quick Action Pills */}
                    {!isAuditor && (
                      <div className="pt-2 flex items-center justify-between gap-1 text-[10px]">
                        <span className="text-slate-400 font-mono">Simulate:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              audio.playSoftChime();
                              simulateExpiryWarning(res.id);
                              setNotification(`Simulated 1h warning for #${vehicle.stockId} (< 2h).`);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold cursor-pointer"
                            title="Simulate < 2h remaining"
                          >
                            ⏱ 1h Warning
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              audio.playWarningChime();
                              expireReservation(res.id, "Interactive auto-release expiry");
                              setNotification(`Auto-released hold on #${vehicle.stockId}. Stock is Available.`);
                            }}
                            className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold cursor-pointer"
                            title="Simulate auto-release on expiry"
                          >
                            ⚡ Auto-Release
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Guaranteed Landed Price on Left & Action on Right */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-lg font-bold text-slate-900 font-mono tracking-tight block leading-tight">
                        ${price.totalBuyPriceNZD.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Fixed Landed NZD
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionDialog("CONFIRM", res);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                        title="Confirm wholesale allocation (US-14)"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setSelectedResForDetails(res);
                        }}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Inspect full dossier"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* History Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((res) => {
            const isAllocated = res.status === "CONFIRMED_ALLOCATED";

            return (
              <div
                key={res.id}
                onClick={() => {
                  audio.playSubtleClick();
                  setSelectedResForDetails(res);
                }}
                className="bg-white rounded-[24px] border border-slate-200 hover:border-slate-300 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] transition-all duration-300 flex flex-col justify-between group cursor-pointer space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#C3002F] transition-colors leading-tight truncate">
                        {res.vehicle.make} - {res.vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                        #{res.requestId} · Stock #{res.vehicle.stockId}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${isAllocated
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : res.status === "CANCELLED"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : res.status === "EXPIRED"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                    >
                      {isAllocated ? "CONFIRMED" : res.status}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1 text-xs my-3">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dealership</div>
                    <div className="font-bold text-slate-900">{res.dealerName} ({res.dealerCode})</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Decision: {res.decisionReason || "Wholesale allocation verified"}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-900">
                    ${res.priceSnapshot.totalBuyPriceNZD.toLocaleString()} NZD
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.playSubtleClick();
                      setSelectedResForDetails(res);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                  >
                    <span>Dossier</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. US-15 Reservation Expiry & Warning Rules Modal           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-[#C3002F]">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Reservation Expiry &amp; Warning Rules
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Programme-wide administrative parameters for dealer exclusivity holds
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Parameter 1: Default Hold Duration */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-900">
                    Default Exclusivity Hold Duration (Hours)
                  </label>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {draftRules.defaultHoldHours} Hours
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="72"
                  step="6"
                  value={draftRules.defaultHoldHours}
                  onChange={(e) =>
                    setDraftRules({ ...draftRules, defaultHoldHours: Number(e.target.value) })
                  }
                  className="w-full accent-[#C3002F] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>6h Quick Hold</span>
                  <span>24h Standard (Default)</span>
                  <span>48h</span>
                  <span>72h Weekend</span>
                </div>
              </div>

              {/* Parameter 2: Warning Notification Threshold */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-900">
                    Warning Notification Threshold (Hours Remaining)
                  </label>
                  <span className="font-mono font-bold text-amber-700 text-sm">
                    {draftRules.warningThresholdHours} Hours Prior
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={draftRules.warningThresholdHours}
                  onChange={(e) =>
                    setDraftRules({ ...draftRules, warningThresholdHours: Number(e.target.value) })
                  }
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Triggers high-priority alerts to ordering buyers and dashboard warning badges when hold timer dips below this value.
                </p>
              </div>

              {/* Parameter 3: Auto-Release Toggle */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                <div>
                  <span className="font-bold text-slate-900 block">
                    Automatic Stock Release on Expiry
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    Immediately returns unconfirmed vehicles from RESERVED to AVAILABLE status
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={draftRules.autoReleaseOnExpiry}
                    onChange={(e) =>
                      setDraftRules({ ...draftRules, autoReleaseOnExpiry: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C3002F]" />
                </label>
              </div>

              {/* Parameter 4: Max Active Holds Per Dealer */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-900">
                    Max Concurrent Holds per Dealership
                  </label>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {draftRules.maxActiveHoldsPerDealer} Units
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="1"
                  value={draftRules.maxActiveHoldsPerDealer}
                  onChange={(e) =>
                    setDraftRules({ ...draftRules, maxActiveHoldsPerDealer: Number(e.target.value) })
                  }
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500">
                  Prevents single dealerships from locking excessive Japan inventory simultaneously.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRules}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                Save Rules Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
