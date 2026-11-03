"use client";

import React, { useState } from "react";
import { useProgramme } from "@/lib/programme-context";
import { ReservationRequest } from "@/lib/types";
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
} from "lucide-react";

interface AdminReservationsViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export default function AdminReservationsView({ onNavigateTab }: AdminReservationsViewProps) {
  const { reservations, confirmAllocation, releaseHold, rejectReservation } = useProgramme();

  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);

  // Quick Action Modal for confirm/release justification
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "CONFIRM" | "RELEASE" | "REJECT";
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

  const openActionDialog = (type: "CONFIRM" | "RELEASE" | "REJECT", res: ReservationRequest) => {
    audio.playSubtleClick();
    const defaultReason =
      type === "CONFIRM"
        ? "Wholesale allocation confirmed by Autohub Ops. Purchase order issued."
        : type === "RELEASE"
        ? "Administrative hold released. Stock returned to available catalog."
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
      setNotification(`Confirmed allocation for #${res.vehicle.stockId} to ${res.dealerName}.`);
      if (selectedResForDetails?.id === res.id) {
        setSelectedResForDetails({ ...res, status: "CONFIRMED_ALLOCATED" });
      }
    } else if (actionModal.type === "RELEASE") {
      audio.playSubtleClick();
      releaseHold(res.vehicleId, reasonText);
      setNotification(`Released 24h hold for #${res.vehicle.stockId}. Stock is now Available.`);
      if (selectedResForDetails?.id === res.id) {
        setSelectedResForDetails({ ...res, status: "RELEASED" });
      }
    } else if (actionModal.type === "REJECT") {
      audio.playSubtleClick();
      rejectReservation(res.id, reasonText);
      setNotification(`Declined reservation ${res.requestId} for ${res.dealerName}.`);
      if (selectedResForDetails?.id === res.id) {
        setSelectedResForDetails({ ...res, status: "CANCELLED" });
      }
    }

    setActionModal({ isOpen: false, type: "CONFIRM", reservation: null, reason: "" });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─────────────────────────────────────────────────────────────
  // A. INNER DETAILS VIEW (When a reservation is selected)
  // ─────────────────────────────────────────────────────────────
  if (selectedResForDetails) {
    const res = selectedResForDetails;
    const vehicle = res.vehicle;
    const price = res.priceSnapshot;
    const isHold = res.status === "ACTIVE_HOLD";

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Navigation Top Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setSelectedResForDetails(null);
              }}
              className="btn-outline"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Reservations Grid</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Platform Operations</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Reservations Queue</span>
              <span>/</span>
              <span className="font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                {res.requestId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isHold ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 font-mono shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>24h Atomic Lock Active (18h Left)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{res.status}</span>
              </span>
            )}
          </div>
        </div>

        {/* Inner Details 2-Column Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Studio Vehicle & Specifications Strip */}
          <div className="lg:col-span-7 space-y-4">
            {/* Vehicle Studio Showcase */}
            <div className="relative aspect-[16/10] w-full rounded-3xl overflow-hidden bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center p-6 sm:p-8">
              <div className="absolute bottom-6 w-4/5 h-6 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />
              <img
                src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                alt={vehicle.model}
                className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)] relative z-10 select-none"
              />

              <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-xs font-bold border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Grade {vehicle.auctionGrade || "4.5"} / {vehicle.interiorGrade || "A"}</span>
              </div>

              <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-700 font-mono text-[11px] font-bold border border-slate-200/80 shadow-2xs">
                #{vehicle.stockId}
              </div>
            </div>

            {/* 4-Stat Executive Highlights Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Odometer
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 font-mono block truncate">
                  {vehicle.odometerKm?.toLocaleString() || "28,400"} km
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Auction Grade
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                  ★ {vehicle.auctionGrade || "4.5"} / {vehicle.interiorGrade || "A"}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  FOB Baseline
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 font-mono block truncate">
                  ¥{vehicle.fobPriceJPY?.toLocaleString() || "2,450,000"}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Yard Location
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                  {vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}
                </strong>
              </div>
            </div>

            {/* Cryptographic Execution Audit Box */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-3 shadow-2xs text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>SHA-256 Cryptographic Audit &amp; Lock Trail</span>
              </div>
              <div className="space-y-1.5 text-slate-600">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Reservation Request ID:</span>
                  <span className="font-mono font-bold text-slate-900">{res.requestId}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Requested At (UTC):</span>
                  <span className="font-mono text-slate-800">{new Date(res.requestedAt).toLocaleString("en-NZ")}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400 font-medium">Exclusivity Expires At (UTC):</span>
                  <span className="font-mono text-amber-800 font-bold">{new Date(res.expiresAt).toLocaleString("en-NZ")}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 font-medium">Section 4 Policy Hash:</span>
                  <span className="font-mono text-[10px] text-slate-500 truncate max-w-[220px]">sha256:7f83b1657ff1fc53b92dc18148a1d65d</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Dealership Dossier & Landed Buy Economics */}
          <div className="lg:col-span-5 space-y-4">
            {/* Dealership Dossier Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 space-y-5 shadow-2xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Reserving Dealership Entity
                </span>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {res.dealerName}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <span>Dealer Code: <strong className="text-slate-800 font-bold">{res.dealerCode}</strong></span>
                  <span>·</span>
                  <span>Zone: <strong className="text-slate-800 font-bold">{price.zoneId}</strong></span>
                </div>
              </div>

              {/* Authorized Buyer */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Authorized Buyer Contact
                </span>
                <div className="font-bold text-slate-900">
                  {res.userName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {res.userEmail} · Direct Floorplan Buyer
                </div>
              </div>

              {/* Landed Pricing Breakdown */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Guaranteed Fixed Landed Price
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
                  ${price.totalBuyPriceNZD.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">NZD Landed</span>
                </div>

                <div className="space-y-2 text-xs pt-1 divide-y divide-slate-100">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">FOB Acquisition (JPY):</span>
                    <strong className="font-mono text-slate-900">¥{vehicle.fobPriceJPY?.toLocaleString() || "2,450,000"}</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">Customs Clearance &amp; 15% GST:</span>
                    <strong className="font-mono text-slate-900">${price.gstNZD?.toLocaleString() || "3,491"} NZD</strong>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">MR2A Compliance &amp; WoF:</span>
                    <strong className="text-emerald-700 font-semibold">Standard Pass Fully Covered</strong>
                  </div>
                </div>
              </div>

              {/* Administrative Action Authority Buttons */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Administrative Operational Authority
                </span>

                {isHold ? (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => openActionDialog("CONFIRM", res)}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(225,29,72,0.35)] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Wholesale Allocation</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => openActionDialog("RELEASE", res)}
                        className="btn-outline py-2.5 px-3 text-xs"
                      >
                        <Unlock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Release Lock</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openActionDialog("REJECT", res)}
                        className="btn-outline py-2.5 px-3 text-xs hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Decline Hold</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-600 font-medium">
                    This reservation has been resolved ({res.status}). No active lock pending.
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
                  {actionModal.type === "RELEASE" && "Release 24-Hour Hold"}
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
                  Administrative Action Reason (Immutable Audit Log)
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
                  className="btn-outline text-xs py-2 px-4"
                >
                  Cancel
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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
              Wholesale Allocation Control
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              24-Hour Atomic Locks
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Reservations Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor dealer exclusivity hold countdowns and sign off on wholesale allocation confirmations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setActiveTab("ACTIVE");
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ACTIVE"
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "HISTORY"
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
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-2 shadow-2xs">
            <Clock className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-sm text-slate-800">No Active 24-Hour Holds</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All certified Japanese inventory units are available for dealer purchase.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredActive.map((res) => {
              const vehicle = res.vehicle;
              const price = res.priceSnapshot;

              return (
                <div
                  key={res.id}
                  onClick={() => {
                    audio.playSubtleClick();
                    setSelectedResForDetails(res);
                  }}
                  className="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 p-6 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer space-y-4 relative overflow-hidden"
                >
                  <div>
                    {/* Top Header: Title & Stock ID */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#E11D48] transition-colors leading-tight truncate">
                          {vehicle.make} - {vehicle.model}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                          {vehicle.year} · {vehicle.fuelType} · #{vehicle.stockId}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold shrink-0">
                        <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                        <span>18h Left</span>
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
                  </div>

                  {/* Bottom Row: Guaranteed Landed Price on Left & Action on Right */}
                  <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-lg font-black text-slate-900 font-mono tracking-tight block leading-tight">
                        ${price.totalBuyPriceNZD.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Fixed Landed NZD
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        audio.playSubtleClick();
                        setSelectedResForDetails(res);
                      }}
                      className="btn-outline text-xs py-2 px-3.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Inspect Hold</span>
                    </button>
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
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-slate-300 p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group cursor-pointer space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-black text-slate-900 group-hover:text-[#E11D48] transition-colors leading-tight truncate">
                        {res.vehicle.make} - {res.vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                        #{res.requestId} · Stock #{res.vehicle.stockId}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                        isAllocated
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
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
                    className="btn-outline text-xs py-1.5 px-3"
                  >
                    <span>Dossier</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
