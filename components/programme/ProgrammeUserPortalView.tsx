"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import OrderCorridorTimeline from "@/components/dealer/OrderCorridorTimeline";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { Vehicle, Order, ZoneId } from "@/lib/types";
import StatusBadge from "@/components/common/StatusBadge";
import Pagination from "@/components/common/Pagination";
import { getVehiclePriorityScore } from "@/lib/vehicle-priority";
import FullPageVehicleDetail from "@/components/dealer/FullPageVehicleDetail";
import FullPageOrderDetail from "@/components/programme/FullPageOrderDetail";
import {
  Car,
  Building2,
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
  initialVehicleId?: string;
  initialOrderId?: string;
}

function getVehicleAction(vehicle: Vehicle): "RESERVE" | "ALLOCATION" {
  if (vehicle.allocationMode) return vehicle.allocationMode;
  const num = parseInt(vehicle.stockId.replace(/\D/g, "") || "0", 10);
  return num % 2 === 0 ? "RESERVE" : "ALLOCATION";
}

export default function ProgrammeUserPortalView({
  initialSubTab = "stock",
  initialVehicleId,
  initialOrderId,
}: ProgrammeUserPortalViewProps) {
  const router = useRouter();
  const { currentUser, currentDealer } = useAuth();
  const { vehicles, reservations, orders, updateVehicle, setVehicleStatus } = useProgramme();

  const [activeTab, setActiveTab] = useState<"stock" | "reservations" | "orders">(
    initialSubTab
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<ZoneId>("ZONE_1");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingFromTab, setViewingFromTab] = useState<"stock" | "reservations" | "orders">(initialSubTab);
  const [copiedVin, setCopiedVin] = useState(false);
  const [now] = useState(() => Date.now());

  // Initialize viewing vehicle or order if passed as props
  useEffect(() => {
    if (initialVehicleId) {
      const v = vehicles.find((item) => item.id === initialVehicleId || item.stockId === initialVehicleId);
      if (v) setViewingVehicle(v);
    }
  }, [initialVehicleId, vehicles]);

  useEffect(() => {
    if (initialOrderId) {
      const o = orders.find((item) => item.id === initialOrderId || item.orderNumber === initialOrderId);
      if (o) setViewingOrder(o);
    }
  }, [initialOrderId, orders]);

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
    return vehicles
      .filter((v) => {
        const matchSearch =
          !q ||
          v.stockId.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.vinChassis.toLowerCase().includes(q) ||
          v.color.toLowerCase().includes(q);
        const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const priorityA = getVehiclePriorityScore(a, currentDealer?.id, false);
        const priorityB = getVehiclePriorityScore(b, currentDealer?.id, false);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.fobPriceJPY - b.fobPriceJPY;
      });
  }, [vehicles, searchQuery, statusFilter, currentDealer?.id]);

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

  // Listings Pagination (10 entries max per page)
  const ITEMS_PER_PAGE = 10;
  const [catalogPage, setCatalogPage] = useState(1);
  const [holdsPage, setHoldsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);

  useEffect(() => {
    setCatalogPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setHoldsPage(1);
    setOrdersPage(1);
  }, [searchQuery]);

  const totalCatalogPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE) || 1;
  const paginatedVehicles = useMemo(() => {
    const validPage = Math.min(Math.max(1, catalogPage), totalCatalogPages);
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVehicles, catalogPage, totalCatalogPages]);

  const totalHoldsPages = Math.ceil(filteredHolds.length / ITEMS_PER_PAGE) || 1;
  const paginatedHolds = useMemo(() => {
    const validPage = Math.min(Math.max(1, holdsPage), totalHoldsPages);
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredHolds.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHolds, holdsPage, totalHoldsPages]);

  const totalOrdersPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const validPage = Math.min(Math.max(1, ordersPage), totalOrdersPages);
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, ordersPage, totalOrdersPages]);

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

  // ─────────────────────────────────────────────────────────────
  // A. FULL INNER PAGE: VEHICLE DETAILS (Same as Dealer/Admin)
  // ─────────────────────────────────────────────────────────────
  if (viewingVehicle) {
    return (
      <FullPageVehicleDetail
        vehicleId={viewingVehicle.id}
        vehicleData={viewingVehicle}
        isAdmin={false}
        isProgramme={true}
        backLabel={viewingFromTab === "reservations" ? "Back to Exclusivity Holds" : "Back to Stock Catalogue"}
        onBack={() => {
          audio.playSubtleClick();
          setViewingVehicle(null);
          router.push(`/programme/${viewingFromTab || "stock"}`);
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // B. FULL INNER PAGE: ORDER DETAILS (Same as Dealer/Admin)
  // ─────────────────────────────────────────────────────────────
  if (viewingOrder) {
    return (
      <FullPageOrderDetail
        orderId={viewingOrder.id}
        orderData={viewingOrder}
        backLabel="Back to Wholesale Orders"
        onBack={() => {
          audio.playSubtleClick();
          setViewingOrder(null);
          router.push("/programme/orders");
        }}
        onViewVehicle={(vId) => {
          const v = vehicles.find((item) => item.id === vId);
          if (v) {
            setViewingVehicle(v);
            setViewingFromTab("orders");
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans text-slate-800 pb-16">
      {/* ─────────────────────────────────────────────────────────── */}
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
              {/* Status Filter Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    audio.playSubtleClick();
                    setStatusFilter(e.target.value);
                  }}
                  className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] cursor-pointer shadow-2xs"
                >
                  <option value="ALL">ALL</option>
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="RESERVED">RESERVED</option>
                  <option value="ALLOCATED">ALLOCATED</option>
                </select>
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
            <table className="w-full text-left text-xs text-slate-700 min-w-[760px]">
              <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 font-bold text-slate-700">Vehicle</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Stock ID</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Grade</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Mileage</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Landed Price</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Status</th>
                  <th className="py-3 px-5 font-bold text-slate-700 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No vehicles found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedVehicles.map((vehicle) => {
                    const price = calculateLandedPrice(vehicle.fobPriceJPY, selectedZone);
                    return (
                      <tr
                        key={vehicle.id}
                        onClick={() => {
                          audio.playSubtleClick();
                          setViewingFromTab("stock");
                          setViewingVehicle(vehicle);
                          router.push(`/programme/vehicles/${vehicle.id}`);
                        }}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        {/* 1. Vehicle */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              <img
                                src={vehicle.images?.[0] || "/images/cars/note.png"}
                                alt={vehicle.model}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-[#C3002F] transition-colors text-xs sm:text-sm whitespace-nowrap">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </span>
                          </div>
                        </td>

                        {/* 2. Stock ID */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            #{vehicle.stockId}
                          </span>
                        </td>

                        {/* 3. Grade */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            Grade {vehicle.grade || vehicle.auctionGrade || "4.5"}
                          </span>
                        </td>

                        {/* 4. Mileage */}
                        <td className="py-3.5 px-5 font-mono text-xs font-medium text-slate-600 whitespace-nowrap">
                          {vehicle.odometerKm.toLocaleString()} km
                        </td>

                        {/* 5. Landed Price */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
                            ${price.totalBuyPriceNZD.toLocaleString()} NZD
                          </span>
                        </td>

                        {/* 6. Catalogue Status */}
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <StatusBadge status={vehicle.status} size="sm" />
                        </td>

                        {/* 7. Dossier Action */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              audio.playSubtleClick();
                              setViewingFromTab("stock");
                              setViewingVehicle(vehicle);
                              router.push(`/programme/vehicles/${vehicle.id}`);
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

          {/* Catalog Pagination (10 max entries per page) */}
          <Pagination
            currentPage={catalogPage}
            totalPages={totalCatalogPages}
            totalItems={filteredVehicles.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(p) => setCatalogPage(p)}
            itemName="vehicles"
          />
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
              <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 font-bold text-slate-700">Reserved Vehicle</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Holding Dealership</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Exclusivity Countdown</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Locked Landed Price</th>
                  <th className="py-3 px-5 font-bold text-slate-700 text-right">Details</th>
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
                  paginatedHolds.map((reservation) => {
                    const diffMs = new Date(reservation.expiresAt).getTime() - now;
                    const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                    const minutesRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
                    const isActive = reservation.status === "ACTIVE_HOLD";

                    return (
                      <tr
                        key={reservation.id}
                        onClick={() => {
                          audio.playSubtleClick();
                          const matched = vehicles.find((v) => v.id === reservation.vehicleId) || reservation.vehicle;
                          if (matched) {
                            setViewingFromTab("reservations");
                            setViewingVehicle(matched);
                            router.push(`/programme/vehicles/${matched.id}`);
                          }
                        }}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        {/* 1. Reserved Vehicle */}
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 group-hover:text-[#C3002F] transition-colors text-xs sm:text-sm">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              audio.playSubtleClick();
                              const matched = vehicles.find((v) => v.id === reservation.vehicleId) || reservation.vehicle;
                              if (matched) {
                                setViewingFromTab("reservations");
                                setViewingVehicle(matched);
                                router.push(`/programme/vehicles/${matched.id}`);
                              }
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

          {/* Holds Pagination (10 max entries per page) */}
          <Pagination
            currentPage={holdsPage}
            totalPages={totalHoldsPages}
            totalItems={filteredHolds.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(p) => setHoldsPage(p)}
            itemName="holds"
          />
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
              <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5 font-bold text-slate-700">Order &amp; Vehicle</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Destination Dealership</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Carrier Vessel &amp; ETA</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Logistics Status</th>
                  <th className="py-3 px-5 font-bold text-slate-700">Total Landed</th>
                  <th className="py-3 px-5 font-bold text-slate-700 text-right">Details</th>
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
                  paginatedOrders.map((order) => {
                    const currentIdx = MILESTONES_ORDER.indexOf(order.currentMilestone);

                    return (
                      <tr
                        key={order.id}
                        onClick={() => {
                          audio.playSubtleClick();
                          setViewingFromTab("orders");
                          setViewingOrder(order);
                          router.push(`/programme/orders/${order.id}`);
                        }}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                      >
                        {/* 1. Order & Vehicle */}
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 group-hover:text-[#C3002F] transition-colors font-mono text-xs">
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
                          <StatusBadge status={order.currentMilestone} size="sm" />
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
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
                            onClick={(e) => {
                              e.stopPropagation();
                              audio.playSubtleClick();
                              setViewingFromTab("orders");
                              setViewingOrder(order);
                              router.push(`/programme/orders/${order.id}`);
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

          {/* Orders Pagination (10 max entries per page) */}
          <Pagination
            currentPage={ordersPage}
            totalPages={totalOrdersPages}
            totalItems={filteredOrders.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(p) => setOrdersPage(p)}
            itemName="orders"
          />
        </div>
      )}
    </div>
  );
}
