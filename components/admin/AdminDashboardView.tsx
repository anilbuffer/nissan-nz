"use client";

import React, { useState, useMemo } from "react";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import DealerDetailsModal from "./DealerDetailsModal";
import ReservationDetailsModal from "./ReservationDetailsModal";
import { ReservationRequest, DealerAccount, ZoneId, Order, Vehicle } from "@/lib/types";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import {
  Building2,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  Clock,
  Eye,
  Check,
  X,
  AlertTriangle,
  Car,
  Ship,
  FileSpreadsheet,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Truck,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  Zap,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

interface AdminDashboardViewProps {
  onNavigateTab: (tabId: string) => void;
}

export default function AdminDashboardView({ onNavigateTab }: AdminDashboardViewProps) {
  const { currentUser } = useAuth();
  const {
    vehicles,
    dealers,
    reservations,
    orders,
    auditLogs,
    approveDealer,
    rejectDealer,
    confirmAllocation,
    releaseHold,
  } = useProgramme();

  const isAuditor = currentUser?.role === "READONLY_AUDITOR";

  // Quick filter view mode
  const [filterMode, setFilterMode] = useState<"ALL" | "APPROVALS" | "HOLDS" | "SHIPPING" | "STOCK">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZoneMap, setSelectedZoneMap] = useState<Record<string, ZoneId>>({});

  const [notification, setNotification] = useState<string | null>(null);
  const [selectedDealerForDetails, setSelectedDealerForDetails] = useState<DealerAccount | null>(null);
  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);

  // Decline Reason Note Modal State
  const [declineTargetDealer, setDeclineTargetDealer] = useState<DealerAccount | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // 1. Pending Dealer Onboarding Requests
  const pendingDealers = dealers.filter((d) => d.status === "PENDING_APPROVAL");

  // 2. Active 24-Hour Atomic Reservation Holds
  const activeHolds = reservations.filter((r) => r.status === "ACTIVE_HOLD");

  // 3. Shipping Pipeline & Remediation Exceptions
  const activeOrders = orders.filter((o) => o.currentMilestone !== "DELIVERED");
  const remediationExceptions = orders.filter((o) =>
    o.additionalCosts?.some((c) => c.status === "PENDING_DEALER_APPROVAL")
  );

  // 4. Holds nearing expiry (< 4 hours remaining)
  const holdsNearExpiry = activeHolds.filter((h) => {
    const diffHours = (new Date(h.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 4;
  });

  const totalExceptionsCount =
    pendingDealers.length + remediationExceptions.length + holdsNearExpiry.length;

  // 5. Executive KPIs
  const availableStockCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const reservedStockCount = vehicles.filter((v) => v.status === "RESERVED").length;
  const allocatedStockCount = vehicles.filter((v) => v.status === "ALLOCATED").length;
  const totalStockCount = vehicles.length;
  const approvedDealersCount = dealers.filter((d) => d.status === "APPROVED").length;
  const totalHoldValue = activeHolds.reduce((acc, h) => acc + (h.priceSnapshot?.totalBuyPriceNZD || 0), 0);

  const totalWholesaleJPY = vehicles.reduce((sum, v) => sum + (v.fobPriceJPY || 0), 0);
  const totalWholesaleNZD = Math.round(totalWholesaleJPY * 0.01085);

  // Dealer Approval Handler
  const handleApprove = (dealerId: string, customZone?: ZoneId) => {
    if (isAuditor) return;
    const targetDealer = dealers.find((d) => d.id === dealerId);
    const assignedZone = customZone || selectedZoneMap[dealerId] || targetDealer?.pricingZoneId || "ZONE_1";
    audio.playSuccessChime();
    approveDealer(dealerId, assignedZone);
    setNotification(`Dealership "${targetDealer?.legalTradingName || dealerId}" approved and assigned to ${assignedZone}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Dealer Decline Confirm Handler
  const handleConfirmDecline = () => {
    if (isAuditor || !declineTargetDealer) return;
    audio.playSubtleClick();
    const reasonText = declineReason.trim() || "Compliance verification requirements not met.";
    rejectDealer(declineTargetDealer.id, reasonText);
    setNotification(`Dealership "${declineTargetDealer.legalTradingName}" application declined. Reason logged to audit.`);
    setDeclineTargetDealer(null);
    setDeclineReason("");
    setTimeout(() => setNotification(null), 5000);
  };

  // 1-Click Confirm Allocation
  const handleConfirmReservation = (vehicleId: string) => {
    if (isAuditor) return;
    audio.playSuccessChime();
    confirmAllocation(vehicleId, "Confirmed directly from Operations Grid.");
    setNotification(`Allocation confirmed: Dispatched vehicle to RoRo ocean shipping pipeline.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1-Click Release Hold
  const handleReleaseReservation = (vehicleId: string) => {
    if (isAuditor) return;
    audio.playSubtleClick();
    releaseHold(vehicleId, "Hold released directly from Operations Grid.");
    setNotification(`Exclusivity hold released: Unit returned to available catalogue.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Zone Change Handler
  const handleZoneSelectChange = (dealerId: string, zone: ZoneId) => {
    setSelectedZoneMap((prev) => ({ ...prev, [dealerId]: zone }));
  };

  // Filtered Lists based on search query
  const query = searchQuery.toLowerCase().trim();

  const filteredPendingDealers = useMemo(() => {
    if (!query) return pendingDealers;
    return pendingDealers.filter(
      (d) =>
        d.legalTradingName.toLowerCase().includes(query) ||
        d.dealerCode.toLowerCase().includes(query) ||
        d.nzbn.includes(query) ||
        d.region.toLowerCase().includes(query)
    );
  }, [pendingDealers, query]);

  const filteredHolds = useMemo(() => {
    if (!query) return activeHolds;
    return activeHolds.filter(
      (h) =>
        h.dealerName?.toLowerCase().includes(query) ||
        h.vehicle?.model.toLowerCase().includes(query) ||
        h.vehicle?.stockId.toLowerCase().includes(query) ||
        h.vehicleId.toLowerCase().includes(query)
    );
  }, [activeHolds, query]);

  const filteredOrders = useMemo(() => {
    if (!query) return activeOrders;
    return activeOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.dealerName.toLowerCase().includes(query) ||
        o.vehicle?.model.toLowerCase().includes(query) ||
        o.vesselName?.toLowerCase().includes(query)
    );
  }, [activeOrders, query]);

  const filteredVehicles = useMemo(() => {
    if (!query) return vehicles.slice(0, 8);
    return vehicles
      .filter(
        (v) =>
          v.stockId.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query) ||
          v.vinChassis.toLowerCase().includes(query) ||
          v.status.toLowerCase().includes(query)
      )
      .slice(0, 10);
  }, [vehicles, query]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-150 font-sans text-slate-800 pb-16">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Sleek Compact Operations Bar                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 px-5 py-4 sm:px-6 sm:py-4.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C3002F]">
              Central Operations Command
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Autohub Operations Grid
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 hidden sm:inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Atomic Matrix</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A0A0A]">
            Operations Executive Grid
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Unified command matrix for dealer franchise onboarding, 24h atomic locks, and RoRo ocean tracking.
          </p>
        </div>

        {/* Global Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onNavigateTab("admin-audit")}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Audit &amp; Export</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("admin-catalogue")}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <Car className="w-3.5 h-3.5 text-slate-600" />
            <span>Full Catalogue</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab("admin-orders")}
            className="px-3.5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <Ship className="w-3.5 h-3.5 text-rose-400" />
            <span>Milestones Pipeline</span>
          </button>
        </div>
      </div>

      {/* Auditor Read-Only Mode Banner */}
      {isAuditor && (
        <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5 shadow-2xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Regulatory Auditor Mode:</strong> Programme operations are rendered under read-only audit clearance. Mutation actions (onboarding approval, order confirmation, releasing holds) are restricted to authorized Autohub administrators.
          </span>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Executive KPI Ribbon (High-Density Compact Strip)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Metric 1: Catalogue Stock */}
        <div
          onClick={() => setFilterMode(filterMode === "STOCK" ? "ALL" : "STOCK")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${
            filterMode === "STOCK"
              ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={filterMode === "STOCK" ? "text-slate-300" : "text-slate-500"}>Catalogue</span>
            <Car className={`w-3.5 h-3.5 ${filterMode === "STOCK" ? "text-white" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums">{availableStockCount}</span>
            <span className={`text-[10px] ${filterMode === "STOCK" ? "text-slate-300" : "text-slate-400"}`}>
              avail / {totalStockCount} total
            </span>
          </div>
          <span className={`text-[10px] font-mono tabular-nums block truncate mt-0.5 ${filterMode === "STOCK" ? "text-slate-300" : "text-slate-500"}`}>
            ${(totalWholesaleNZD / 1000).toFixed(0)}k NZD wholesale pool
          </span>
        </div>

        {/* Metric 2: 24h Exclusivity Holds */}
        <div
          onClick={() => setFilterMode(filterMode === "HOLDS" ? "ALL" : "HOLDS")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${
            filterMode === "HOLDS"
              ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={filterMode === "HOLDS" ? "text-slate-300" : "text-slate-500"}>24h Holds</span>
            <Lock className={`w-3.5 h-3.5 ${filterMode === "HOLDS" ? "text-blue-400" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums">{activeHolds.length}</span>
            <span className={`text-[10px] ${filterMode === "HOLDS" ? "text-slate-300" : "text-slate-400"}`}>
              active locks
            </span>
          </div>
          <span className={`text-[10px] font-mono tabular-nums block truncate mt-0.5 ${filterMode === "HOLDS" ? "text-slate-300" : "text-slate-500"}`}>
            {totalHoldValue > 0 ? `$${totalHoldValue.toLocaleString()} NZD locked` : "No active locks"}
          </span>
        </div>

        {/* Metric 3: Shipping Pipeline */}
        <div
          onClick={() => setFilterMode(filterMode === "SHIPPING" ? "ALL" : "SHIPPING")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${
            filterMode === "SHIPPING"
              ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={filterMode === "SHIPPING" ? "text-slate-300" : "text-slate-500"}>Shipping Pipeline</span>
            <Ship className={`w-3.5 h-3.5 ${filterMode === "SHIPPING" ? "text-indigo-400" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums">{activeOrders.length}</span>
            <span className={`text-[10px] ${filterMode === "SHIPPING" ? "text-slate-300" : "text-slate-400"}`}>
              shipments active
            </span>
          </div>
          <span className={`text-[10px] block truncate mt-0.5 ${filterMode === "SHIPPING" ? "text-slate-300" : "text-slate-500"}`}>
            8 door-to-door milestones
          </span>
        </div>

        {/* Metric 4: Dealership Network */}
        <div
          onClick={() => setFilterMode(filterMode === "APPROVALS" ? "ALL" : "APPROVALS")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${
            filterMode === "APPROVALS"
              ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={filterMode === "APPROVALS" ? "text-slate-300" : "text-slate-500"}>Dealer Network</span>
            <Building2 className={`w-3.5 h-3.5 ${filterMode === "APPROVALS" ? "text-emerald-400" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums">{approvedDealersCount}</span>
            <span className={`text-[10px] ${filterMode === "APPROVALS" ? "text-slate-300" : "text-slate-400"}`}>
              / {dealers.length} dealers
            </span>
          </div>
          <span className={`text-[10px] block truncate mt-0.5 ${filterMode === "APPROVALS" ? "text-slate-300" : "text-slate-500"}`}>
            {pendingDealers.length > 0 ? `${pendingDealers.length} pending onboarding` : "All authorized"}
          </span>
        </div>

        {/* Metric 5: Action Exceptions */}
        <div
          onClick={() => setFilterMode(filterMode === "APPROVALS" ? "ALL" : "APPROVALS")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer col-span-2 md:col-span-1 ${
            totalExceptionsCount > 0
              ? "bg-rose-50/70 border-rose-200 hover:bg-rose-100/70"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className="text-[#C3002F] font-bold">Exceptions</span>
            <AlertCircle className="w-3.5 h-3.5 text-[#C3002F]" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums text-[#C3002F]">{totalExceptionsCount}</span>
            <span className="text-[10px] text-rose-600 font-semibold">action alerts</span>
          </div>
          <span className="text-[10px] text-slate-600 block truncate mt-0.5 font-medium">
            {pendingDealers.length} approvals · {remediationExceptions.length} repairs
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Interactive Filter & Universal Search Bar                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Quick Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "ALL", label: "Unified Operations Grid", count: null },
            { id: "APPROVALS", label: "Pending Approvals", count: pendingDealers.length, alert: pendingDealers.length > 0 },
            { id: "HOLDS", label: "Active 24h Holds", count: activeHolds.length },
            { id: "SHIPPING", label: "Shipping Pipeline", count: activeOrders.length },
            { id: "STOCK", label: "Stock Quickview", count: availableStockCount },
          ].map((item) => {
            const active = filterMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setFilterMode(item.id as any);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  active
                    ? "bg-[#0A0A0A] text-white shadow-2xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <span>{item.label}</span>
                {item.count !== null && (
                  <span
                    className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : item.alert
                        ? "bg-[#C3002F] text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock ID, dealer, NZBN, vessel..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] focus:border-[#0A0A0A] font-sans transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. GRID A: Pending Dealer Approvals (Direct 1-Click Action) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {(filterMode === "ALL" || filterMode === "APPROVALS") && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Dealer Onboarding Queue &amp; Territorial Zone Assignment
              </h2>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                pendingDealers.length > 0 ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-slate-100 text-slate-600"
              }`}>
                {pendingDealers.length} Awaiting Authorization
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("admin-dealers")}
              className="text-[11px] font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Directory</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {filteredPendingDealers.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {pendingDealers.length === 0
                  ? "All franchise dealership applications have been evaluated. No pending approvals."
                  : "No pending applications match the active search filter."}
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto touch-scroll navy-scrollbar">
              <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
                <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Trading Name &amp; Code</th>
                    <th className="py-2.5 px-3">NZBN / Region</th>
                    <th className="py-2.5 px-3">Primary Signatory</th>
                    <th className="py-2.5 px-3">Target Zone Assignment</th>
                    <th className="py-2.5 px-3">Terms Accepted</th>
                    <th className="py-2.5 px-3 text-right">Inline Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredPendingDealers.map((dealer) => {
                    const currentSelectedZone = selectedZoneMap[dealer.id] || dealer.pricingZoneId || "ZONE_1";
                    return (
                      <tr key={dealer.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Name & Code */}
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{dealer.legalTradingName}</span>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                              #{dealer.dealerCode}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal truncate block">{dealer.address}</span>
                        </td>

                        {/* 2. NZBN / Region */}
                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <div className="font-semibold text-slate-800">{dealer.nzbn}</div>
                          <div className="text-[10px] text-slate-500 font-sans">{dealer.region}</div>
                        </td>

                        {/* 3. Primary Signatory */}
                        <td className="py-2.5 px-3 text-[11px]">
                          <div className="font-medium text-slate-900">{dealer.primaryContactName}</div>
                          <div className="text-[10px] text-slate-400 truncate font-mono">{dealer.primaryContactEmail}</div>
                        </td>

                        {/* 4. Inline Zone Selector (Direct Interactive Dropdown without opening modal) */}
                        <td className="py-2.5 px-3">
                          <select
                            disabled={isAuditor}
                            value={currentSelectedZone}
                            onChange={(e) => handleZoneSelectChange(dealer.id, e.target.value as ZoneId)}
                            className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                          >
                            <option value="ZONE_1">Zone 1 (Auckland Metro)</option>
                            <option value="ZONE_2">Zone 2 (North Island Upper)</option>
                            <option value="ZONE_3">Zone 3 (Central North Island)</option>
                            <option value="ZONE_4">Zone 4 (Wellington &amp; South Entry)</option>
                            <option value="ZONE_5">Zone 5 (South Island Regional)</option>
                          </select>
                        </td>

                        {/* 5. Terms Accepted Badge */}
                        <td className="py-2.5 px-3">
                          {dealer.termsAcceptedAt ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <Check className="w-2.5 h-2.5" />
                              <span>v{dealer.termsAcceptedVersion || "2026.1"} Signed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <span>Pending Sign</span>
                            </span>
                          )}
                        </td>

                        {/* 6. Inline Decision Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                audio.playSubtleClick();
                                setSelectedDealerForDetails(dealer);
                              }}
                              title="Inspect Full Application Dossier"
                              className="p-1.5 text-slate-500 hover:text-[#0A0A0A] bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {!isAuditor ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    audio.playSubtleClick();
                                    setDeclineTargetDealer(dealer);
                                    setDeclineReason("");
                                  }}
                                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-[#C3002F] hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                  Decline
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(dealer.id, currentSelectedZone)}
                                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#C3002F] hover:bg-[#A10026] rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                                >
                                  Authorize
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                                Read-Only
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. GRID B: Active 24-Hour Exclusivity Holds Queue           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {(filterMode === "ALL" || filterMode === "HOLDS") && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-800" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                24-Hour Atomic Exclusivity Holds Queue
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold">
                {activeHolds.length} Active Locks
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("admin-reservations")}
              className="text-[11px] font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer"
            >
              <span>Full Holds Manager</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {filteredHolds.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                {activeHolds.length === 0
                  ? "No active 24h exclusivity holds. All stock in central catalogue is available."
                  : "No exclusivity holds match the active search filter."}
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto touch-scroll navy-scrollbar">
              <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
                <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Vehicle Details</th>
                    <th className="py-2.5 px-3">Holding Dealership</th>
                    <th className="py-2.5 px-3">Time Remaining (24h Window)</th>
                    <th className="py-2.5 px-3">Landed Price (NZD)</th>
                    <th className="py-2.5 px-3 text-right">Inline Execution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredHolds.map((reservation) => {
                    const diffMs = new Date(reservation.expiresAt).getTime() - Date.now();
                    const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                    const minutesRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
                    const isUrgent = hoursRemaining < 4;
                    const priceNZD = reservation.priceSnapshot?.totalBuyPriceNZD || 0;

                    return (
                      <tr key={reservation.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Vehicle Details */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-7 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              <img
                                src={reservation.vehicle?.images?.[0] || "/images/cars/note.png"}
                                alt={reservation.vehicle?.model || "Vehicle"}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">
                                {reservation.vehicle?.year} {reservation.vehicle?.model}
                              </div>
                              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                                <span>#{reservation.vehicle?.stockId}</span>
                                <span>·</span>
                                <span>{reservation.vehicle?.grade}</span>
                                <span>·</span>
                                <span>{reservation.vehicle?.odometerKm?.toLocaleString()} km</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Holding Dealership */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{reservation.dealerName}</div>
                          <div className="font-mono text-[10px] text-slate-400">
                            Hold ID: #{reservation.id.slice(-6)}
                          </div>
                        </td>

                        {/* 3. Live Countdown Window */}
                        <td className="py-2.5 px-3">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                              isUrgent
                                ? "bg-rose-50 text-rose-800 border-rose-200 animate-pulse"
                                : "bg-slate-100 text-slate-800 border-slate-200"
                            }`}
                          >
                            <Clock className={`w-3 h-3 ${isUrgent ? "text-rose-600" : "text-slate-500"}`} />
                            <span>
                              {hoursRemaining}h {minutesRemaining}m left
                            </span>
                          </div>
                        </td>

                        {/* 4. Total Buy Price NZD */}
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          <div>${priceNZD.toLocaleString()} NZD</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            ¥{reservation.vehicle?.fobPriceJPY?.toLocaleString()} FOB
                          </div>
                        </td>

                        {/* 5. Inline Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                audio.playSubtleClick();
                                setSelectedResForDetails(reservation);
                              }}
                              title="Inspect Reservation Snapshot Dossier"
                              className="p-1.5 text-slate-500 hover:text-[#0A0A0A] bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {!isAuditor ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleReleaseReservation(reservation.vehicleId)}
                                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-[#C3002F] hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                                >
                                  Release
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmReservation(reservation.vehicleId)}
                                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#C3002F] hover:bg-[#A10026] rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                                >
                                  Confirm Order
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                                Read-Only
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. GRID C: Wholesale Shipping Pipeline & Variations Matrix  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {(filterMode === "ALL" || filterMode === "SHIPPING") && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-slate-800" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Wholesale Shipping Orders &amp; Milestone Tracking
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold">
                {activeOrders.length} In Transit
              </span>
              {remediationExceptions.length > 0 && (
                <span className="px-2 py-0.2 rounded-full bg-rose-50 text-[#C3002F] border border-rose-200 text-[10px] font-bold animate-pulse">
                  {remediationExceptions.length} Cost Sign-Offs Pending
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("admin-orders")}
              className="text-[11px] font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer"
            >
              <span>Milestone Manager</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-6 px-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>No wholesale shipping orders active or matching filter.</span>
            </div>
          ) : (
            <div className="overflow-x-auto touch-scroll navy-scrollbar">
              <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
                <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Order &amp; Vehicle</th>
                    <th className="py-2.5 px-3">Consignee Dealer</th>
                    <th className="py-2.5 px-3">Ocean Vessel &amp; ETA</th>
                    <th className="py-2.5 px-3">Milestone Progress</th>
                    <th className="py-2.5 px-3">Landed Price / Repairs</th>
                    <th className="py-2.5 px-3 text-right">Pipeline Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredOrders.map((order) => {
                    const pendingCost = order.additionalCosts?.find((c) => c.status === "PENDING_DEALER_APPROVAL");
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* 1. Order & Vehicle */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 font-mono">{order.orderNumber}</div>
                          <div className="text-[11px] text-slate-600">
                            {order.vehicle?.year} {order.vehicle?.model}
                          </div>
                        </td>

                        {/* 2. Consignee Dealer */}
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{order.dealerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{order.dealerId}</div>
                        </td>

                        {/* 3. Vessel & ETA */}
                        <td className="py-2.5 px-3 text-[11px]">
                          <div className="font-medium text-slate-800">{order.vesselName || "RoRo Carrier"}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ETA: {order.etaDeliveryDate || "TBD"}</div>
                        </td>

                        {/* 4. Milestone Progress */}
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {order.currentMilestone.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* 5. Landed Price / Repairs */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900 font-mono">
                            ${order.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()} NZD
                          </div>
                          {pendingCost && (
                            <span className="inline-block mt-0.5 font-bold text-[10px] text-[#C3002F] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              +${pendingCost.amountNZD.toLocaleString()} Repair Req
                            </span>
                          )}
                        </td>

                        {/* 6. Pipeline Action */}
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onNavigateTab("admin-orders")}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                          >
                            <span>Milestones</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. GRID D: Central Japanese Stock Quick-Glance Table       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {(filterMode === "ALL" || filterMode === "STOCK") && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-800" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Authorised Central Japanese Stock Catalogue
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold">
                {availableStockCount} Available Now
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("admin-catalogue")}
              className="text-[11px] font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All {vehicles.length} Units</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto touch-scroll navy-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 min-w-[780px]">
              <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Stock ID</th>
                  <th className="py-2.5 px-3">Vehicle Spec</th>
                  <th className="py-2.5 px-3">Grade</th>
                  <th className="py-2.5 px-3">Odometer</th>
                  <th className="py-2.5 px-3">FOB (JPY)</th>
                  <th className="py-2.5 px-3">Zone 1 Landed (NZD)</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredVehicles.map((vehicle) => {
                  const price = calculateLandedPrice(vehicle.fobPriceJPY, "ZONE_1");
                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        #{vehicle.stockId}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{vehicle.grade}</td>
                      <td className="py-2.5 px-3 font-mono">{vehicle.odometerKm.toLocaleString()} km</td>
                      <td className="py-2.5 px-3 font-mono">¥{vehicle.fobPriceJPY.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        ${price.totalBuyPriceNZD.toLocaleString()} NZD
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            vehicle.status === "AVAILABLE"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : vehicle.status === "RESERVED"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : vehicle.status === "ALLOCATED"
                              ? "bg-blue-50 text-blue-800 border border-blue-200"
                              : vehicle.status === "WITHDRAWN"
                              ? "bg-slate-800 text-white border border-slate-900"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {vehicle.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 8. GRID E: Chronological Operational Audit Stream           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {filterMode === "ALL" && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-900">
                Recent System Ledger Activity
              </h3>
              <span className="text-[10px] font-mono text-slate-400">
                ({auditLogs.length} verified events)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab("admin-audit")}
              className="text-[11px] font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer"
            >
              <span>Full Audit Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(auditLogs || []).slice(0, 4).map((log) => (
              <div key={log.id} className="py-1.5 px-4 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-700 font-semibold shrink-0">
                    {log.category}
                  </span>
                  <span className="text-slate-900 font-semibold truncate font-mono text-[11px]">{log.action}</span>
                  <span className="text-slate-500 truncate hidden sm:inline text-[11px]">— {log.details}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 9. MODALS: Decline Reason Prompt Modal                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      {declineTargetDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#C3002F] shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Decline Dealership Application
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {declineTargetDealer.legalTradingName} ({declineTargetDealer.dealerCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeclineTargetDealer(null);
                  setDeclineReason("");
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">
                Reason for Rejection / Compliance Audit Note <span className="text-[#C3002F]">*</span>
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., NZBN verification mismatch, territorial boundary conflict, or missing authorized officer endorsement."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 resize-none font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeclineTargetDealer(null);
                  setDeclineReason("");
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!declineReason.trim()}
                onClick={handleConfirmDecline}
                className="px-4 py-1.5 rounded-lg bg-[#C3002F] hover:bg-[#A10026] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer transition-all shadow-xs"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dealer Details Dossier Modal */}
      {selectedDealerForDetails && (
        <DealerDetailsModal
          dealer={selectedDealerForDetails}
          onClose={() => setSelectedDealerForDetails(null)}
          onApprove={(did, zid) => handleApprove(did, zid)}
          onReject={(did) => {
            setSelectedDealerForDetails(null);
            const target = dealers.find((d) => d.id === did);
            if (target) {
              setDeclineTargetDealer(target);
              setDeclineReason("");
            }
          }}
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
