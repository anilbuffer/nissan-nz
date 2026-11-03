"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import OrderCorridorTimeline from "@/components/dealer/OrderCorridorTimeline";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { Vehicle, Order, ZoneId } from "@/lib/types";
import {
  Car,
  Lock,
  Ship,
  Eye,
  CheckCircle2,
  Clock,
  Search,
  ShieldCheck,
  X,
  Check,
  Copy,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface ProgrammeUserPortalViewProps {
  initialSubTab?: "stock" | "reservations" | "orders";
}

function getVehicleAction(vehicle: Vehicle): "RESERVE" | "ALLOCATION" {
  if (vehicle.allocationMode) return vehicle.allocationMode;
  const num = parseInt(vehicle.stockId.replace(/\D/g, "") || "0", 10);
  return num % 2 === 0 ? "RESERVE" : "ALLOCATION";
}

export default function ProgrammeUserPortalView({
  initialSubTab = "stock",
}: ProgrammeUserPortalViewProps) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { vehicles, reservations, orders, updateVehicle, setVehicleStatus } = useProgramme();

  const [activeTab, setActiveTab] = useState<"stock" | "reservations" | "orders">(
    initialSubTab
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<ZoneId>("ZONE_1");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedVehicleForDossier, setSelectedVehicleForDossier] = useState<Vehicle | null>(null);
  const [selectedOrderForDossier, setSelectedOrderForDossier] = useState<Order | null>(null);
  const [copiedVin, setCopiedVin] = useState(false);

  // Sync state if route changes
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleTabChange = (tabId: "stock" | "reservations" | "orders") => {
    audio.playSubtleClick();
    setActiveTab(tabId);
    router.push(`/programme/${tabId}`);
  };

  // Executive Metric Counts
  const availableVehicles = useMemo(() => vehicles.filter((v) => v.status === "AVAILABLE"), [vehicles]);
  const activeHolds = useMemo(() => reservations.filter((r) => r.status === "ACTIVE_HOLD"), [reservations]);
  const activeOrders = useMemo(() => orders.filter((o) => o.currentMilestone !== "DELIVERED"), [orders]);

  const totalHoldValue = useMemo(
    () => activeHolds.reduce((acc, h) => acc + (h.priceSnapshot?.totalBuyPriceNZD || 0), 0),
    [activeHolds]
  );

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return vehicles.filter((v) => {
      const matchSearch =
        !q ||
        v.stockId.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.vinChassis.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  // Filtered Holds
  const filteredHolds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return reservations.filter((r) => {
      if (!q) return true;
      return (
        r.dealerName?.toLowerCase().includes(q) ||
        r.vehicle?.model.toLowerCase().includes(q) ||
        r.vehicle?.stockId.toLowerCase().includes(q) ||
        r.vehicleId.toLowerCase().includes(q)
      );
    });
  }, [reservations, searchQuery]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.dealerName.toLowerCase().includes(q) ||
        o.vehicle?.model.toLowerCase().includes(q) ||
        o.vesselName?.toLowerCase().includes(q) ||
        o.currentMilestone.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  const handleCopyVin = (vin: string) => {
    navigator.clipboard.writeText(vin);
    audio.playSubtleClick();
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  // 8 Milestones Definition
  const MILESTONES_ORDER = [
    "JAPAN_EXPORT_PREPARATION",
    "EXPORT_CUSTOMS_CLEARED",
    "VESSEL_LOADED",
    "OCEAN_TRANSIT",
    "NZ_PORT_ARRIVAL",
    "CUSTOMS_NZTA_INSPECTION",
    "INLAND_LOGISTICS",
    "DELIVERED",
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans text-slate-800 pb-16">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Clean Nissan Corporate Title Bar                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 px-6 py-5 sm:px-7 sm:py-5.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C3002F]">
              Nissan
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#C3002F]" />
              <span>NSC Oversight · Read-Only</span>
            </span>
            {currentUser?.email && (
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                ({currentUser.email})
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            {activeTab === "stock"
              ? "Authorised Programme Stock"
              : activeTab === "reservations"
                ? "Exclusivity Reservations Queue"
                : "Programme Orders & Shipping"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal max-w-2xl leading-relaxed">
            {activeTab === "stock"
              ? "Centralised National Sales Company governance for authorised Japanese vehicle inventory, specifications, and dealer allocation."
              : activeTab === "reservations"
                ? "Live monitoring of 24-hour franchise dealership exclusivity holds with locked landed price snapshots."
                : "Confirmed wholesale vehicle orders, RoRo ocean transit logistics, and door-to-door delivery milestones."}
          </p>
        </div>

        {/* Live Status Clearance Pill */}
        <div className="shrink-0 flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-700">Live Synchronized</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Executive 4-KPI Metric Strip: Total Vehicles, Available Stock, Reserved, Active Orders */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Vehicles */}
        <div
          onClick={() => {
            audio.playSubtleClick();
            handleTabChange("stock");
            setStatusFilter("ALL");
          }}
          className={`p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1 transition-all cursor-pointer hover:border-slate-300 ${activeTab === "stock" && statusFilter === "ALL" ? "ring-1 ring-[#0A0A0A]" : ""
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Vehicles
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700">
              <Car className="w-4 h-4 text-[#0A0A0A]" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {vehicles.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Catalogue stock inventory
          </span>
        </div>

        {/* 2. Available Stock */}
        <div
          onClick={() => {
            audio.playSubtleClick();
            handleTabChange("stock");
            setStatusFilter("AVAILABLE");
          }}
          className={`p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1 transition-all cursor-pointer hover:border-slate-300 ${activeTab === "stock" && statusFilter === "AVAILABLE" ? "ring-1 ring-emerald-500" : ""
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Available Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {availableVehicles.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Ready for dealer allocation
          </span>
        </div>

        {/* 3. Reserved */}
        <div
          onClick={() => {
            audio.playSubtleClick();
            handleTabChange("reservations");
          }}
          className={`p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1 transition-all cursor-pointer hover:border-slate-300 ${activeTab === "reservations" ? "ring-1 ring-amber-500" : ""
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Reserved
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Lock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {activeHolds.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Active 24h exclusivity holds
          </span>
        </div>

        {/* 4. Active Orders */}
        <div
          onClick={() => {
            audio.playSubtleClick();
            handleTabChange("orders");
          }}
          className={`p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1 transition-all cursor-pointer hover:border-slate-300 ${activeTab === "orders" ? "ring-1 ring-blue-500" : ""
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Active Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Ship className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono">
            {activeOrders.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            In RoRo transit to NZ
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. TAB 1: Stock Catalogue (Clean, Spacious 5 Columns)       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Subheader Toolbar */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                Authorised Central Vehicle Stock
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                · {filteredVehicles.length} of {vehicles.length} Units Listed
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1">
                {["ALL", "AVAILABLE", "RESERVED", "ALLOCATED"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setStatusFilter(status);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${statusFilter === status
                        ? "bg-[#0A0A0A] text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Pricing Zone Selector */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Pricing:</span>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value as ZoneId)}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] cursor-pointer shadow-2xs"
                >
                  <option value="ZONE_1">Zone 1 (Auckland Metro)</option>
                  <option value="ZONE_2">Zone 2 (Upper North Island)</option>
                  <option value="ZONE_3">Zone 3 (Central North Island)</option>
                  <option value="ZONE_4">Zone 4 (Wellington &amp; South)</option>
                  <option value="ZONE_5">Zone 5 (South Island)</option>
                </select>
              </div>

              {/* Search Box */}
              <div className="relative min-w-[200px] flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search make, model, stock ID..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] focus:border-[#0A0A0A] font-sans shadow-2xs transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto touch-scroll navy-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Vehicle &amp; Stock ID</th>
                  <th className="py-3 px-5">Grade &amp; Mileage</th>
                  <th className="py-3 px-5">{selectedZone.replace("_", " ")} Landed Price</th>
                  <th className="py-3 px-5">Catalogue Status</th>
                  <th className="py-3 px-5 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No vehicles found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => {
                    const price = calculateLandedPrice(vehicle.fobPriceJPY, selectedZone);
                    return (
                      <tr key={vehicle.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Vehicle & Stock ID */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              <img
                                src={vehicle.images?.[0] || "/images/cars/note.png"}
                                alt={vehicle.model}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-xs sm:text-sm">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                                  #{vehicle.stockId}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                  {vehicle.grade}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Grade & Mileage */}
                        <td className="py-3.5 px-5">
                          <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span className="px-1.5 py-0.2 bg-slate-100 text-slate-900 rounded border border-slate-200 text-[11px]">
                              Grade {vehicle.grade || vehicle.auctionGrade || "4.5"}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                            {vehicle.odometerKm.toLocaleString()} km
                          </div>
                        </td>

                        {/* 3. Landed Price */}
                        <td className="py-3.5 px-5">
                          <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                            ${price.totalBuyPriceNZD.toLocaleString()} NZD
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Fixed Profile ({selectedZone.replace("_", " ")})
                          </div>
                        </td>

                        {/* 4. Catalogue Status & Admin Assigned Action */}
                        <td className="py-3.5 px-5">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${vehicle.status === "AVAILABLE"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : vehicle.status === "RESERVED"
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : vehicle.status === "ALLOCATED"
                                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                            >
                              {vehicle.status}
                            </span>

                            {vehicle.status === "AVAILABLE" && (
                              <button
                                type="button"
                                onClick={() => {
                                  audio.playSubtleClick();
                                  const currentMode = getVehicleAction(vehicle);
                                  const nextMode = currentMode === "ALLOCATION" ? "RESERVE" : "ALLOCATION";
                                  updateVehicle(vehicle.id, { allocationMode: nextMode });
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors cursor-pointer hover:opacity-80 bg-slate-50 border-slate-200 text-slate-700"
                                title="Click to toggle Admin assigned action mode for dealers"
                              >
                                {getVehicleAction(vehicle) === "ALLOCATION" ? (
                                  <>
                                    <Ship className="w-2.5 h-2.5 text-emerald-600" />
                                    <span>Assigned: Allocation</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-2.5 h-2.5 text-amber-600" />
                                    <span>Assigned: Reserve</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 5. Dossier Action */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              audio.playSubtleClick();
                              setSelectedVehicleForDossier(vehicle);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Spec</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. TAB 2: Exclusivity Holds (Clean, Spacious 5 Columns)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "reservations" && (
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                Authorised 24-Hour Exclusivity Holds
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                · {filteredHolds.length} Active Records
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                Total Hold Value: <strong>${totalHoldValue.toLocaleString()} NZD</strong>
              </div>
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search hold, dealer, vehicle..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] focus:border-[#0A0A0A] font-sans shadow-2xs transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto touch-scroll navy-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
              <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Reserved Vehicle</th>
                  <th className="py-3 px-5">Holding Dealership</th>
                  <th className="py-3 px-5">Exclusivity Countdown</th>
                  <th className="py-3 px-5">Locked Landed Price</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredHolds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No active exclusivity reservations currently recorded.
                    </td>
                  </tr>
                ) : (
                  filteredHolds.map((reservation) => {
                    const diffMs = new Date(reservation.expiresAt).getTime() - Date.now();
                    const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                    const minutesRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
                    const isActive = reservation.status === "ACTIVE_HOLD";

                    return (
                      <tr key={reservation.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Reserved Vehicle */}
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {reservation.vehicle?.year} {reservation.vehicle?.model}
                          </div>
                          <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                            Stock #{reservation.vehicle?.stockId}
                          </div>
                        </td>

                        {/* 2. Holding Dealership */}
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {reservation.dealerName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Authorised Franchisee
                          </div>
                        </td>

                        {/* 3. Exclusivity Countdown */}
                        <td className="py-3.5 px-5 font-mono">
                          {isActive ? (
                            <div className="inline-flex items-center gap-1.5 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 text-xs">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>{hoursRemaining}h {minutesRemaining}m left</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">Expired / Concluded</span>
                          )}
                        </td>

                        {/* 4. Locked Landed Price */}
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          ${reservation.priceSnapshot?.totalBuyPriceNZD?.toLocaleString()} NZD
                          <div className="text-[10px] text-slate-400 font-normal">
                            Snapshot Locked
                          </div>
                        </td>

                        {/* 5. Details Action */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              audio.playSubtleClick();
                              const matched = vehicles.find((v) => v.id === reservation.vehicleId);
                              if (matched) setSelectedVehicleForDossier(matched);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View Spec</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. TAB 3: Orders & Shipping (Clean, Spacious 5 Columns)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tight">
                Wholesale Order Records &amp; RoRo Logistics Pipeline
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                · {filteredOrders.length} Shipments Recorded
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                Active In-Transit: <strong>{activeOrders.length}</strong>
              </div>
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order, vessel, dealer..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] focus:border-[#0A0A0A] font-sans shadow-2xs transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto touch-scroll navy-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 min-w-[720px]">
              <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-5">Order &amp; Vehicle</th>
                  <th className="py-3 px-5">Destination Dealership</th>
                  <th className="py-3 px-5">Carrier Vessel &amp; ETA</th>
                  <th className="py-3 px-5">Logistics Status</th>
                  <th className="py-3 px-5">Total Landed</th>
                  <th className="py-3 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No orders found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const currentIdx = MILESTONES_ORDER.indexOf(order.currentMilestone);

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Order & Vehicle */}
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 font-mono text-xs">
                            {order.orderNumber}
                          </div>
                          <div className="text-xs text-slate-700 font-medium mt-0.5">
                            {order.vehicle?.year} {order.vehicle?.model}
                          </div>
                        </td>

                        {/* 2. Destination Dealer */}
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {order.dealerName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Franchise Delivery
                          </div>
                        </td>

                        {/* 3. Carrier & ETA */}
                        <td className="py-3.5 px-5 text-xs">
                          <div className="font-medium text-slate-800">
                            {order.vesselName || "RoRo Ocean Carrier"}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            ETA: {order.etaDeliveryDate || "Pending Schedule"}
                          </div>
                        </td>

                        {/* 4. Logistics Status */}
                        <td className="py-3.5 px-5">
                          <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                            {order.currentMilestone.replace(/_/g, " ")}
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Milestone {currentIdx + 1} of 8
                          </div>
                        </td>

                        {/* 5. Total Landed Price */}
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900 text-xs sm:text-sm">
                          ${order.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()} NZD
                        </td>

                        {/* 6. Details Action */}
                        <td className="py-3.5 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              audio.playSubtleClick();
                              setSelectedOrderForDossier(order);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. ENRICHED MODAL: Comprehensive Vehicle Spec Dossier       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedVehicleForDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-2xl max-w-3xl w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 font-sans max-h-[92vh] overflow-y-auto navy-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    #{selectedVehicleForDossier.stockId}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${selectedVehicleForDossier.status === "AVAILABLE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedVehicleForDossier.status === "RESERVED"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                  >
                    {selectedVehicleForDossier.status}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  {selectedVehicleForDossier.year} {selectedVehicleForDossier.make} {selectedVehicleForDossier.model}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicleForDossier(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo & Pricing Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-7 h-48 sm:h-56 bg-slate-50 rounded-2xl border border-slate-200 p-3 flex items-center justify-center overflow-hidden">
                <img
                  src={selectedVehicleForDossier.images?.[0] || "/images/cars/note.png"}
                  alt={selectedVehicleForDossier.model}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md"
                />
              </div>

              <div className="sm:col-span-5 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                  Commercial Pricing Schedule
                </span>

                <div>
                  <div className="text-2xl font-bold font-mono text-[#C3002F]">
                    ${calculateLandedPrice(selectedVehicleForDossier.fobPriceJPY, selectedZone).totalBuyPriceNZD.toLocaleString()} NZD
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Guaranteed landed for {selectedZone.replace("_", " ")}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-xs space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-sans text-[11px]">Base FOB (Japan):</span>
                    <strong className="text-slate-900">¥{selectedVehicleForDossier.fobPriceJPY.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-sans text-[11px]">Inclusions:</span>
                    <span className="text-[11px] font-sans text-emerald-700 font-semibold">CIF, GST, MR2A</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Specifications Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Technical Specifications &amp; Identifiers
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">VIN / Chassis</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-slate-900 truncate">{selectedVehicleForDossier.vinChassis}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyVin(selectedVehicleForDossier.vinChassis)}
                      className="text-slate-400 hover:text-slate-700 ml-1 p-0.5"
                      title="Copy VIN"
                    >
                      {copiedVin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auction Grade</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
                    Grade {selectedVehicleForDossier.grade || selectedVehicleForDossier.auctionGrade || "4.5"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verified Odometer</span>
                  <span className="font-mono font-bold text-slate-900 text-sm mt-1 block">
                    {selectedVehicleForDossier.odometerKm.toLocaleString()} km
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Powertrain / Fuel</span>
                  <span className="font-bold text-slate-900 text-sm mt-1 block truncate">
                    {selectedVehicleForDossier.fuelType || "e-Power"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transmission</span>
                  <span className="font-medium text-slate-800 text-xs mt-1 block truncate">
                    {selectedVehicleForDossier.transmission || "Automatic"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Drive Type</span>
                  <span className="font-medium text-slate-800 text-xs mt-1 block">
                    {selectedVehicleForDossier.driveType || "2WD"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exterior Color</span>
                  <span className="font-medium text-slate-800 text-xs mt-1 block truncate">
                    {selectedVehicleForDossier.color || "Pearl White"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Yard Bay Location</span>
                  <span className="font-medium text-slate-800 text-xs mt-1 block truncate">
                    {selectedVehicleForDossier.location || "Yokohama Port"}
                  </span>
                </div>
              </div>
            </div>

            {/* Condition remarks if available */}
            {selectedVehicleForDossier.conditionSummary && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Inspection Condition Dossier:</span>
                <p className="text-slate-600 leading-relaxed font-normal">
                  {selectedVehicleForDossier.conditionSummary}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-mono">
                NSC Oversight Clearance · Verified Read-Only
              </span>
              <button
                type="button"
                onClick={() => setSelectedVehicleForDossier(null)}
                className="px-5 py-2 bg-[#0A0A0A] hover:bg-[#444444] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Spec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 8. ENRICHED MODAL: Wholesale Order Logistics Dossier        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedOrderForDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 animate-in zoom-in-95 duration-150 font-sans max-h-[92vh] overflow-y-auto navy-scrollbar">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedOrderForDossier.orderNumber}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Wholesale Order Record
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                  {selectedOrderForDossier.vehicle?.year} {selectedOrderForDossier.vehicle?.model}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDossier(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shipment Overview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Destination Dealer</span>
                <strong className="text-slate-900 block mt-0.5">{selectedOrderForDossier.dealerName}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Ocean Carrier</span>
                <strong className="text-slate-900 block mt-0.5">{selectedOrderForDossier.vesselName || "RoRo Carrier"}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Delivery ETA</span>
                <strong className="font-mono text-slate-900 block mt-0.5">{selectedOrderForDossier.etaDeliveryDate || "Pending Schedule"}</strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Landed Price</span>
                <strong className="font-mono text-[#C3002F] text-sm block mt-0.5">
                  ${selectedOrderForDossier.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()} NZD
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicle Stock ID</span>
                <span className="font-mono text-slate-800 block mt-0.5">#{selectedOrderForDossier.vehicle?.stockId}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Booking Reference</span>
                <span className="font-mono text-slate-800 block mt-0.5">{selectedOrderForDossier.orderNumber}</span>
              </div>
            </div>

            {/* Door to Door Order Delivery Corridor (Matching Reference Layout) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Delivery Corridor Milestones (5 Programme Stages)
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Live RoRo Status
                </span>
              </div>
              <OrderCorridorTimeline order={selectedOrderForDossier} />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderForDossier(null)}
                className="px-5 py-2 bg-[#0A0A0A] hover:bg-[#444444] text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
