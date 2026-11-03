"use client";

import React, { useState } from "react";
import { useProgramme } from "@/lib/programme-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import DealerDetailsModal from "./DealerDetailsModal";
import ReservationDetailsModal from "./ReservationDetailsModal";
import { ReservationRequest, DealerAccount, ZoneId } from "@/lib/types";
import {
  Users,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  Clock,
  Car,
  MapPin,
  ShieldCheck,
  FileCheck2,
  Mail,
  Phone,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  Eye,
  TrendingUp,
  Sparkles,
  Zap,
} from "lucide-react";

interface AdminDashboardViewProps {
  onNavigateTab: (tabId: string) => void;
}

export default function AdminDashboardView({ onNavigateTab }: AdminDashboardViewProps) {
  const {
    vehicles,
    dealers,
    reservations,
    approveDealer,
    rejectDealer,
    confirmAllocation,
    releaseHold,
  } = useProgramme();

  const [notification, setNotification] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Record<string, ZoneId>>({});
  const [selectedDealerForDetails, setSelectedDealerForDetails] = useState<DealerAccount | null>(null);
  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);

  // 1. Pending Dealer Onboarding Requests
  const pendingDealers = dealers.filter((d) => d.status === "PENDING_APPROVAL");

  // 2. Active 24-Hour Atomic Reservation Holds
  const activeHolds = reservations.filter((r) => r.status === "ACTIVE_HOLD");
  const heldVehicles = (activeHolds.length > 0
    ? activeHolds.map((r) => {
      const live = vehicles.find((v) => v.id === r.vehicleId || v.id === r.vehicle?.id);
      return {
        ...r.vehicle,
        ...live,
        images:
          live?.images && live.images.length > 0
            ? live.images
            : r.vehicle?.images && r.vehicle.images.length > 0
              ? r.vehicle.images
              : ["/images/cars/kicks.png"],
      };
    })
    : vehicles.filter((v) => v.status === "RESERVED")
  ).map((v) => ({
    ...v,
    images: v.images && v.images.length > 0 ? v.images : ["/images/cars/kicks.png"],
  }));

  // Total Capital in Active Holds
  const totalLockedCapitalNZD = heldVehicles.reduce((acc, v) => {
    const matchingRes = reservations.find((r) => r.vehicleId === v.id && r.status === "ACTIVE_HOLD");
    const p = matchingRes?.priceSnapshot || calculateLandedPrice(v.fobPriceJPY, "ZONE_1");
    return acc + p.totalBuyPriceNZD;
  }, 0);

  // Dealer Approval Handler
  const handleApprove = (dealerId: string, defaultZone: ZoneId) => {
    audio.playSuccessChime();
    const zone = selectedZone[dealerId] || defaultZone;
    approveDealer(dealerId, zone);
    setNotification(`Approved dealership application and assigned to ${zone}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Dealer Rejection Handler
  const handleReject = (dealerId: string) => {
    audio.playSubtleClick();
    rejectDealer(dealerId);
    setNotification(`Dealership onboarding request declined.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1-Click Confirm Allocation
  const handleConfirmReservation = (vehicleId: string) => {
    audio.playSuccessChime();
    confirmAllocation(vehicleId, "Confirmed directly from Admin Operations Dashboard.");
    setNotification(`Wholesale allocation confirmed. Order generated and dispatched to shipping pipeline.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1-Click Release Hold
  const handleReleaseReservation = (vehicleId: string) => {
    audio.playSubtleClick();
    releaseHold(vehicleId, "Hold released from Admin Operations Dashboard.");
    setNotification(`Reservation hold released. Vehicle returned to wholesale catalogue.`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header & Live Operations Status Bar                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E11D48] animate-pulse" />
              Autohub Platform Operations
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Live Action Queue
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Operations Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active priority alerts for dealer franchise onboarding approvals and 24-hour server-side atomic exclusivity holds.
          </p>
        </div>

        {/* Live Operations Stats Counter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold font-mono flex items-center gap-1.5 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingDealers.length} Approvals Pending</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold font-mono flex items-center gap-1.5 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-[#E11D48]" />
            <span>{heldVehicles.length} Exclusivity Locks</span>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
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
      {/* 2. OPERATIONAL ALERT CARDS (High-Impact Luxury Alert Theme) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6 w-full">
        {/* ========================================================= */}
        {/* ALERT 1: Dealer Onboarding Approval Request (Amber Alert)  */}
        {/* ========================================================= */}
        <div className="relative w-full bg-white rounded-3xl border border-amber-200/90 shadow-[0_8px_30px_rgba(245,158,11,0.06)] p-6 sm:p-7 transition-all space-y-5 overflow-hidden">
          {/* Top Amber Radiant Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

          {/* Alert Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Dealer Onboarding Approval Requests
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    ACTION REQUIRED
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Franchise dealership registrations awaiting legal NZBN verification and Geographic Pricing Zone assignment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-amber-50 text-amber-900 border border-amber-300/80 shadow-2xs">
                {pendingDealers.length} {pendingDealers.length === 1 ? "Application Pending" : "Applications Pending"}
              </span>
            </div>
          </div>

          {/* Alert Body */}
          {pendingDealers.length === 0 ? (
            <div className="py-8 px-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">All dealer onboarding applications processed. No pending authorizations required.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDealers.map((dealer) => {
                const currentAssignedZone = selectedZone[dealer.id] || dealer.pricingZoneId || "ZONE_1";

                return (
                  <div
                    key={dealer.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/30 via-white to-amber-50/10 border border-amber-200/80 hover:border-amber-300 shadow-2xs hover:shadow-xs transition-all space-y-4 text-xs"
                  >
                    {/* Top Row: Dealership Title + Code + Address */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-amber-700 font-bold shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-base font-black text-slate-900 tracking-tight">
                              {dealer.legalTradingName}
                            </strong>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200">
                              {dealer.dealerCode}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs flex items-center gap-1.5 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{dealer.address}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-slate-600 font-semibold">NZBN: {dealer.nzbn}</span>
                          </p>
                        </div>
                      </div>

                      {/* Terms Acceptance Badge */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-semibold self-start sm:self-auto shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Terms &amp; Cost Boundary Accepted</span>
                      </div>
                    </div>

                    {/* Middle Row: Contact Info & Zone Mapping Controller */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                      {/* Principal Contact */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Principal Contact
                        </span>
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {dealer.primaryContactName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {dealer.primaryContactEmail} · {dealer.primaryContactPhone}
                        </div>
                      </div>

                      {/* Geographic Pricing Zone Selector */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Assigned Pricing Zone
                        </span>
                        <div className="flex items-center gap-2">
                          <select
                            value={currentAssignedZone}
                            onChange={(e) =>
                              setSelectedZone({
                                ...selectedZone,
                                [dealer.id]: e.target.value as ZoneId,
                              })
                            }
                            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                          >
                            <option value="ZONE_1">ZONE_1 (Upper North Island)</option>
                            <option value="ZONE_2">ZONE_2 (Central North Island)</option>
                            <option value="ZONE_3">ZONE_3 (Lower North Island)</option>
                            <option value="ZONE_4">ZONE_4 (Upper South Island)</option>
                            <option value="ZONE_5">ZONE_5 (Lower South Island)</option>
                          </select>
                        </div>
                      </div>

                      {/* Floorplan Holding Limit */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-1 sm:col-span-2 lg:col-span-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Floorplan Allocation Tier
                        </span>
                        <div className="text-xs font-bold text-slate-900 font-mono">
                          $350,000 NZD Cap
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          Max 3 Concurrent 24h Exclusivity Holds
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Approval activates immediate catalog access and zone-based landed price calculator.
                      </span>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            setSelectedDealerForDetails(dealer);
                          }}
                          className="btn-outline text-xs py-2 px-3.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Review Dossier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(dealer.id)}
                          className="btn-outline text-xs py-2 px-3.5 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                        >
                          <span>Decline</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(dealer.id, currentAssignedZone)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs transition-all shadow-[0_4px_14px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_18px_rgba(16,185,129,0.4)] cursor-pointer active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Authorize &amp; Activate</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Alert Footer */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>Requires administrative authorization before commercial stock ordering is unlocked.</span>
            <button
              type="button"
              onClick={() => onNavigateTab("admin-dealers")}
              className="text-amber-800 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All Franchisees</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ALERT 2: Atomic Reservation Queue Request (Rose Alert)     */}
        {/* ========================================================= */}
        <div className="relative w-full bg-white rounded-3xl border border-rose-200/90 shadow-[0_8px_30px_rgba(225,29,72,0.06)] p-6 sm:p-7 transition-all space-y-5 overflow-hidden">
          {/* Top Rose Radiant Strip */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239]" />

          {/* Alert Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-[#E11D48] shadow-2xs shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Atomic Reservation Queue Requests
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    24H LOCK ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dealer exclusivity locks protected against duplicate allocation, awaiting wholesale confirmation or release.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold font-mono bg-rose-50 text-rose-900 border border-rose-300/80 shadow-2xs">
                {heldVehicles.length} {heldVehicles.length === 1 ? "Active Lock" : "Active Locks"}
              </span>
            </div>
          </div>

          {/* Alert Body */}
          {heldVehicles.length === 0 ? (
            <div className="py-8 px-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">No active 24h exclusivity holds. All catalogue stock is available.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {heldVehicles.map((vehicle) => {
                const matchingRes = reservations.find(
                  (r) => r.vehicleId === vehicle.id && r.status === "ACTIVE_HOLD"
                );
                const dealerName = matchingRes?.dealerName || "Auckland Nissan City Ltd";
                const dealerCode = matchingRes?.dealerCode || "NZ-NIS-AKL01";
                const dealerZone = matchingRes?.priceSnapshot?.zoneId || "ZONE_1";
                const price = matchingRes?.priceSnapshot || calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);

                return (
                  <div
                    key={vehicle.id}
                    className="p-5 rounded-2xl bg-gradient-to-br from-rose-50/30 via-white to-rose-50/10 border border-rose-200/80 hover:border-rose-300 shadow-2xs hover:shadow-xs transition-all space-y-4 text-xs"
                  >
                    {/* Top Row: Vehicle Image + Title + Dealership Lock info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Vehicle Studio Thumbnail */}
                        <div className="relative w-28 sm:w-36 h-20 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                            alt={vehicle.model || "Vehicle"}
                            className="w-full h-full object-contain filter drop-shadow-xs select-none"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-white/90 text-slate-700 font-mono text-[9px] font-bold border border-slate-200 shadow-2xs">
                            ★ {vehicle.auctionGrade || "4.5"}
                          </span>
                        </div>

                        {/* Title & Specs */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-base font-black text-slate-900 tracking-tight">
                              {vehicle.year} {vehicle.make} - {vehicle.model}
                            </strong>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              #{vehicle.stockId}
                            </span>
                          </div>
                          <p className="text-slate-500 text-xs">
                            {vehicle.grade} · {vehicle.engineCc || 1200}cc {vehicle.fuelType} · {vehicle.vinChassis}
                          </p>
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>Held By: <strong className="text-slate-900 font-semibold">{dealerName}</strong> ({dealerCode})</span>
                          </div>
                        </div>
                      </div>

                      {/* Exclusivity Timer Pill */}
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-mono font-bold text-xs self-start md:self-auto shrink-0 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                        <span>18h 42m Remaining Under Lock</span>
                      </div>
                    </div>

                    {/* Middle Row: Financial Economics Snapshot */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Guaranteed Landed Buy
                        </span>
                        <div className="text-sm font-black font-mono text-slate-900">
                          ${price.totalBuyPriceNZD.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">NZD ({dealerZone})</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium block">
                          Fixed commercial allocation price
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Japanese FOB Baseline
                        </span>
                        <div className="text-sm font-black font-mono text-slate-900">
                          ¥{vehicle.fobPriceJPY.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">JPY</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          RoRo: Yokohama to Auckland
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-slate-200/70 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Dealership Exclusivity Status
                        </span>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Strictly Protected (Atomic)</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Zero risk of duplicate allocation
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Confirming wholesale order converts hold into confirmed shipping allocation.
                      </span>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            const r = reservations.find((res) => res.vehicleId === vehicle.id && res.status === "ACTIVE_HOLD") || reservations[0];
                            if (r) setSelectedResForDetails(r);
                          }}
                          className="btn-outline text-xs py-2 px-3.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Inspect Hold</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReleaseReservation(vehicle.id)}
                          className="btn-outline text-xs py-2 px-3.5 hover:border-slate-300 hover:bg-slate-100"
                        >
                          <Unlock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Release Lock</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmReservation(vehicle.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white font-bold text-xs transition-all shadow-[0_4px_14px_rgba(225,29,72,0.35)] hover:shadow-[0_6px_18px_rgba(225,29,72,0.45)] cursor-pointer active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Allocation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Alert Footer */}
          <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span>24-hour exclusivity timer guarantees dealer price protection without duplicate allocation.</span>
            <button
              type="button"
              onClick={() => onNavigateTab("admin-reservations")}
              className="text-[#E11D48] hover:text-[#BE123C] font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Full Reservations Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dealer Details Dossier Modal */}
      {selectedDealerForDetails && (
        <DealerDetailsModal
          dealer={selectedDealerForDetails}
          onClose={() => setSelectedDealerForDetails(null)}
          onApprove={(did, zid) => handleApprove(did, zid)}
          onReject={handleReject}
        />
      )}

      {/* Reservation Details Dossier Modal */}
      {selectedResForDetails && (
        <ReservationDetailsModal
          reservation={selectedResForDetails}
          onClose={() => setSelectedResForDetails(null)}
          onConfirmAllocation={(vid) => handleConfirmReservation(vid)}
          onReleaseHold={(vid) => handleReleaseReservation(vid)}
        />
      )}
    </div>
  );
}
