"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import OrderCorridorTimeline from "@/components/dealer/OrderCorridorTimeline";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { Vehicle, Order, ZoneId } from "@/lib/types";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import StatusBadge from "@/components/common/StatusBadge";
import Pagination from "@/components/common/Pagination";
import { getVehiclePriorityScore, getDealerReservationLabel } from "@/lib/vehicle-priority";
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
  ChevronDown,
  ExternalLink,
  LayoutGrid,
  List,
  RotateCcw,
  ArrowUpRight,
  Wrench,
  MapPin,
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
  const { vehicles: rawVehicles, reservations, orders, updateVehicle, setVehicleStatus } = useProgramme();

  // Guarantee transparent studio PNG cutouts from MOCK_VEHICLES always take precedence
  const vehicles = useMemo(() => {
    return rawVehicles.map((v) => {
      const mock = MOCK_VEHICLES.find((m) => m.id === v.id);
      return {
        ...v,
        images: mock?.images || v.images,
      };
    });
  }, [rawVehicles]);

  const [activeTab, setActiveTab] = useState<"stock" | "reservations" | "orders">(
    initialSubTab
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<ZoneId>("ZONE_1");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedModel, setSelectedModel] = useState<string>("ALL");

  // Layout View Mode (Grid vs List) with Smooth Transition (same as /dealer/stocks)
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewingFromTab, setViewingFromTab] = useState<"stock" | "reservations" | "orders">(initialSubTab);
  const [copiedVin, setCopiedVin] = useState(false);
  const [now] = useState(() => Date.now());

  // Model Counts for Selector
  const modelStats = useMemo(() => {
    const list = [
      { key: "ALL", name: "All Models", count: 0 },
      { key: "Note", name: "Note e-Power", count: 0 },
      { key: "Leaf", name: "Leaf (EV)", count: 0 },
      { key: "X-Trail", name: "X-Trail", count: 0 },
      { key: "Serena", name: "Serena e-Power", count: 0 },
      { key: "Kicks", name: "Kicks e-Power", count: 0 },
      { key: "Dayz", name: "Dayz Kei", count: 0 },
      { key: "Elgrand", name: "Elgrand VIP", count: 0 },
      { key: "Navara", name: "Navara 4WD Ute", count: 0 },
      { key: "Ariya", name: "Ariya (EV)", count: 0 },
    ];

    vehicles.forEach((v) => {
      list[0].count++;
      list.slice(1).forEach((item) => {
        if (v.model.toLowerCase().includes(item.key.toLowerCase())) {
          item.count++;
        }
      });
    });

    return list;
  }, [vehicles]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (statusFilter !== "ALL") count++;
    if (selectedModel !== "ALL") count++;
    return count;
  }, [searchQuery, statusFilter, selectedModel]);

  const handleResetFilters = () => {
    audio.playSubtleClick();
    setSearchQuery("");
    setStatusFilter("ALL");
    setSelectedModel("ALL");
    setCatalogPage(1);
  };

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

  const handleOpenVehicleDetails = (vehicle: Vehicle) => {
    audio.playSubtleClick();
    setViewingFromTab("stock");
    setViewingVehicle(vehicle);
    router.push(`/programme/vehicles/${vehicle.id}`);
  };

  // Executive Metric Counts
  const activeHolds = useMemo(() => reservations.filter((r) => r.status === "ACTIVE_HOLD"), [reservations]);
  const activeOrders = useMemo(() => orders.filter((o) => o.currentMilestone !== "DELIVERED"), [orders]);

  const totalHoldValue = useMemo(
    () => activeHolds.reduce((acc, h) => acc + (h.priceSnapshot?.totalBuyPriceNZD || 0), 0),
    [activeHolds]
  );

  // Filtered Vehicles (Programme Oversight: search, status, model & priority sorted)
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
          v.color.toLowerCase().includes(q) ||
          String(v.year).includes(q) ||
          (v.grade && v.grade.toLowerCase().includes(q)) ||
          (v.auctionGrade && v.auctionGrade.toLowerCase().includes(q));

        const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
        const matchModel =
          selectedModel === "ALL" ||
          v.model.toLowerCase().includes(selectedModel.toLowerCase());

        return matchSearch && matchStatus && matchModel;
      })
      .sort((a, b) => {
        // Programme role prioritizes remediation costs, reserved, allocated, available
        const priorityA = getVehiclePriorityScore(a, undefined, true);
        const priorityB = getVehiclePriorityScore(b, undefined, true);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.fobPriceJPY - b.fobPriceJPY;
      });
  }, [vehicles, searchQuery, statusFilter, selectedModel]);

  // Filtered Holds
  const filteredHolds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return reservations.filter((r) => {
      if (statusFilter !== "ALL" && r.vehicle?.status !== statusFilter && r.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        r.dealerName?.toLowerCase().includes(q) ||
        r.vehicle?.model.toLowerCase().includes(q) ||
        r.vehicle?.stockId.toLowerCase().includes(q) ||
        r.vehicleId.toLowerCase().includes(q)
      );
    });
  }, [reservations, searchQuery, statusFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.vehicle?.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.dealerName.toLowerCase().includes(q) ||
        o.vehicle?.model.toLowerCase().includes(q) ||
        o.vesselName?.toLowerCase().includes(q) ||
        o.currentMilestone.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, statusFilter]);

  // Listings Pagination (10 entries max per page)
  const ITEMS_PER_PAGE = 10;
  const [catalogPage, setCatalogPage] = useState(1);
  const [holdsPage, setHoldsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);

  useEffect(() => {
    setCatalogPage(1);
  }, [searchQuery, statusFilter, selectedModel, selectedZone]);

  useEffect(() => {
    setHoldsPage(1);
    setOrdersPage(1);
  }, [searchQuery, statusFilter]);

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
    <div className="space-y-5 max-w-8xl mx-auto font-sans text-slate-800 pb-16 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Clean Title & Subtitle + Total Stocks Text       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
              {activeTab === "stock"
                ? "Authorised Programme Stock"
                : activeTab === "reservations"
                  ? "Exclusivity Reservations Queue"
                  : "Wholesale Logistics & Orders"}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <ShieldCheck className="w-3 h-3 text-slate-500" />
              <span>NSC Programme Governance</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === "stock"
              ? "Centralised Japanese export allocation pipeline, condition grades, FOB acquisition baselines, and landed pricing across New Zealand delivery zones."
              : activeTab === "reservations"
                ? "Live 24-hour exclusivity reservations placed across New Zealand authorized franchise dealerships."
                : "Live ocean shipment tracking, RoRo transit, customs inspection, and inland compliance milestones."}
          </p>
        </div>

        <div className="text-xs sm:text-sm font-medium text-slate-500 self-start sm:self-auto shrink-0">
          {activeTab === "stock" && (
            <span>Total Units - ( <strong className="font-semibold text-slate-900 font-mono">{filteredVehicles.length}</strong> )</span>
          )}
          {activeTab === "reservations" && (
            <span>Active Holds - ( <strong className="font-semibold text-slate-900 font-mono">{filteredHolds.length}</strong> )</span>
          )}
          {activeTab === "orders" && (
            <span>Corridor Orders - ( <strong className="font-semibold text-slate-900 font-mono">{filteredOrders.length}</strong> )</span>
          )}
        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. TAB 1: Stock Catalogue (Grid & List Layouts - Programme Role POV) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "stock" && (
        <div className="space-y-5">
          {/* Controls Bar: Search + Model + Status + Pricing Zone + Reset + Layout Toggle */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Note, Leaf, X-Trail, Serena, VIN, Stock ID..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 font-normal transition-all shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Controls: Model + Status + Zone + Reset + Layout Toggle */}
              <div className="flex items-center flex-wrap gap-2.5">
                {/* Models Dropdown Selector */}
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      audio.playSubtleClick();
                      setSelectedModel(e.target.value);
                    }}
                    aria-label="Filter by Model"
                    className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-slate-800 font-normal cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Models ({modelStats[0]?.count || 0})</option>
                    {modelStats.slice(1).map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.name} ({item.count})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>

                {/* Status Dropdown Selector */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      audio.playSubtleClick();
                      setStatusFilter(e.target.value);
                    }}
                    aria-label="Filter by Status"
                    className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-slate-800 font-normal cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="ALLOCATED">Allocated</option>
                    <option value="BUYED">Buyed</option>
                    <option value="SOLD">Sold</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>


                {/* Reset Button */}
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-[#C3002F] hover:text-[#A10026] font-bold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1.5"
                    title="Reset filters"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}

                {/* Grid vs List Layout Toggle (same as /dealer/stocks) */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setViewMode("GRID");
                    }}
                    title="Grid View"
                    aria-label="Grid View"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${viewMode === "GRID"
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-900"
                      }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grid</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setViewMode("LIST");
                    }}
                    title="List View"
                    aria-label="List View"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${viewMode === "LIST"
                        ? "bg-white text-slate-950 shadow-xs border border-slate-200/60"
                        : "text-slate-500 hover:text-slate-900"
                      }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <Car className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-base text-slate-900">No vehicles match your search filters</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try adjusting your model selector, status filter, or clearing the search query.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : viewMode === "GRID" ? (
            /* ───────────────────────────────────────────────────────── */
            /* 3A. GRID LAYOUT: Luxury Automotive Showcase (Programme POV) */
            /* ───────────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-5 sm:gap-6 animate-in fade-in duration-300">
              {paginatedVehicles.map((vehicle) => {
                const price = calculateLandedPrice(vehicle.fobPriceJPY, selectedZone);
                const isAvailable = vehicle.status === "AVAILABLE";
                const vCosts = vehicle.additionalCosts || [];
                const hasAdditionalCost = vCosts.length > 0;
                const allCostsTotal = vCosts.reduce((s, c) => s + c.amountNZD, 0);
                const displayPriceNZD = price.totalBuyPriceNZD + allCostsTotal;

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => handleOpenVehicleDetails(vehicle)}
                    className="bg-white rounded-[16px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer p-6 sm:p-7 relative overflow-hidden"
                  >
                    <div>
                      {/* Card Top Row: Vehicle Make & Model + Details, Arrow on Right */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-black transition-colors leading-snug truncate">
                            {vehicle.make} - {vehicle.model}
                          </h3>
                          <p className="text-[12px] text-slate-400 mt-1">
                            {vehicle.year} · {vehicle.fuelType} · Grade {vehicle.auctionGrade || vehicle.grade || "4.5"}
                          </p>
                        </div>
                        <div className="flex items-center shrink-0">
                          <div
                            className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#0A0A0A] text-slate-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0"
                            title="Inspect Vehicle Dossier"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Card Center: Floating Studio Car with Floor Shadow */}
                      <div className="relative w-full h-44 sm:h-52 my-3 flex items-center justify-center">
                        <div className="absolute bottom-2.5 w-4/5 h-3.5 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />

                        <img
                          src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                          alt={`${vehicle.make} ${vehicle.model}`}
                          className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_12px_16px_rgba(0,0,0,0.12)] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 ease-out select-none"
                        />

                        {/* Priority & Status Badges */}
                        {(hasAdditionalCost || !isAvailable) && (
                          <div className="absolute bottom-1 z-20 flex items-center gap-1.5 flex-wrap justify-center px-2 animate-in fade-in max-w-full">
                            {hasAdditionalCost && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50/95 text-rose-900 border border-rose-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                                <Wrench className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Additional Cost (+${allCostsTotal.toLocaleString()} NZD)</span>
                              </span>
                            )}
                            {vehicle.status === "BUYED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50/95 text-emerald-900 border border-emerald-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Buyed</span>
                              </span>
                            )}
                            {vehicle.status === "SOLD" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/95 text-slate-800 border border-slate-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                                <CheckCircle2 className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>Sold</span>
                              </span>
                            )}
                            {vehicle.status === "ALLOCATED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50/95 text-sky-900 border border-sky-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                                <Ship className="w-3 h-3 text-sky-600 shrink-0" />
                                <span>Allocated</span>
                              </span>
                            )}
                            {vehicle.status === "RESERVED" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50/95 text-amber-900 border border-amber-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                                <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{getDealerReservationLabel(vehicle.reservedByDealerId, true)}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Bottom: Landed Price + Inspect Action Button (Clean Image 2 style for Programme POV) */}
                    <div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight block leading-tight font-mono">
                          ${displayPriceNZD.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          NZD Landed Total
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenVehicleDetails(vehicle);
                          }}
                          className="py-2 px-3.5 sm:px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold transition-all shadow-xs hover:shadow-soft flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                          title="Inspect Vehicle Dossier & Condition Report"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-300" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ───────────────────────────────────────────────────────── */
            /* 3B. LIST LAYOUT: Luxury Automotive Rows (Programme POV)   */
            /* ───────────────────────────────────────────────────────── */
            <div className="space-y-4 animate-in fade-in duration-300">
              {paginatedVehicles.map((vehicle) => {
                const price = calculateLandedPrice(vehicle.fobPriceJPY, selectedZone);
                const isAvailable = vehicle.status === "AVAILABLE";
                const vCosts = vehicle.additionalCosts || [];
                const hasAdditionalCost = vCosts.length > 0;
                const allCostsTotal = vCosts.reduce((s, c) => s + c.amountNZD, 0);
                const displayPriceNZD = price.totalBuyPriceNZD + allCostsTotal;

                return (
                  <div
                    key={vehicle.id}
                    onClick={() => handleOpenVehicleDetails(vehicle)}
                    className="bg-white rounded-[16px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] transition-all duration-300 p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6 group cursor-pointer"
                  >
                    {/* Left: Floating Cutout Thumbnail */}
                    <div className="relative w-full md:w-56 h-36 flex items-center justify-center shrink-0">
                      <div className="absolute bottom-2 w-4/5 h-3 bg-black/15 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />
                      <img
                        src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                        alt={`${vehicle.make} ${vehicle.model}`}
                        className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 ease-out select-none"
                      />

                      {/* Overlaid Badges */}
                      <div className="absolute bottom-1 z-20 px-2 py-0.5 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs font-semibold text-[9px] flex items-center gap-1.5 flex-wrap justify-center backdrop-blur-md">
                        {hasAdditionalCost && (
                          <span className="inline-flex items-center gap-0.5 text-rose-800">
                            <Wrench className="w-2.5 h-2.5 text-rose-600" />
                            <span>+Cost</span>
                          </span>
                        )}
                        {vehicle.status === "BUYED" && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Buyed</span>
                          </span>
                        )}
                        {vehicle.status === "SOLD" && (
                          <span className="inline-flex items-center gap-0.5 text-slate-700">
                            <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
                            <span>Sold</span>
                          </span>
                        )}
                        {vehicle.status === "ALLOCATED" && (
                          <span className="inline-flex items-center gap-0.5 text-sky-800">
                            <Ship className="w-2.5 h-2.5 text-sky-600" />
                            <span>Allocated</span>
                          </span>
                        )}
                        {vehicle.status === "RESERVED" && (
                          <span className="inline-flex items-center gap-0.5 text-amber-800">
                            <Lock className="w-2.5 h-2.5 text-amber-600" />
                            <span>{getDealerReservationLabel(vehicle.reservedByDealerId, true)}</span>
                          </span>
                        )}
                        {isAvailable && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-800">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Available</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Clean Info Block & 4 Columns */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-600">
                            {vehicle.year} · {vehicle.fuelType} · #{vehicle.stockId}
                          </span>
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/80 font-semibold">
                            VIN: {vehicle.vinChassis}
                          </span>
                          {hasAdditionalCost && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/90">
                              <Wrench className="w-2.5 h-2.5 text-rose-600" />
                              <span>Additional Cost (+${allCostsTotal.toLocaleString()} NZD)</span>
                            </span>
                          )}
                          {vehicle.status === "BUYED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Buyed</span>
                            </span>
                          )}
                          {vehicle.status === "SOLD" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/90">
                              <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
                              <span>Sold</span>
                            </span>
                          )}
                          {vehicle.status === "ALLOCATED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200/90">
                              <Ship className="w-2.5 h-2.5 text-sky-600" />
                              <span>Allocated</span>
                            </span>
                          )}
                          {vehicle.status === "RESERVED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90">
                              <Lock className="w-2.5 h-2.5 text-amber-600" />
                              <span>{getDealerReservationLabel(vehicle.reservedByDealerId, true)}</span>
                            </span>
                          )}
                          {isAvailable && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90">
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Available</span>
                            </span>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-slate-400 text-xs shrink-0">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}</span>
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-black transition-colors truncate">
                        {vehicle.make} {vehicle.model}
                      </h3>

                      {/* 4-Column Specifications in List View */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100 max-w-xl">
                        <div>
                          <span className="text-sm font-mono font-bold text-slate-900 block leading-tight">
                            {vehicle.odometerKm.toLocaleString()} km
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                            Odometer
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-mono font-bold text-slate-900 block leading-tight">
                            ★ {vehicle.auctionGrade || vehicle.grade || "4.5"} / {vehicle.interiorGrade || "A"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                            Auction Grade
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-mono font-bold text-slate-800 block leading-tight truncate">
                            {vehicle.transmission || "Automatic"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                            Transmission
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-mono font-bold text-slate-800 block leading-tight truncate">
                            {vehicle.fuelType || "Hybrid"}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                            Powertrain
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Landed Price & Quick Actions */}
                    <div className="w-full md:w-56 shrink-0 md:border-l md:border-slate-100 md:pl-6 flex flex-col justify-between space-y-3">
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                          NZD Landed Total
                        </span>
                        <div className="text-xl font-bold text-slate-900 font-mono tracking-tight mt-0.5">
                          ${displayPriceNZD.toLocaleString()}
                          <span className="text-xs text-slate-500 font-normal ml-1">NZD</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenVehicleDetails(vehicle);
                          }}
                          className="py-2 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Specs</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenVehicleDetails(vehicle);
                          }}
                          className="py-2 px-3.5 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs bg-[#0A0A0A] hover:bg-[#27272A] text-white"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-300" />
                          <span>Inspect Dossier</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

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
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hidden lg:block">
                Total Hold Value: <strong>${totalHoldValue.toLocaleString()} NZD</strong>
              </div>
              {/* Status Dropdown Selector */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    audio.playSubtleClick();
                    setStatusFilter(e.target.value);
                  }}
                  aria-label="Filter by Status"
                  className="appearance-none pl-3.5 pr-8 py-1.5 text-xs bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-normal cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="ALLOCATED">Allocated</option>
                  <option value="BUYED">Buyed</option>
                  <option value="SOLD">Sold</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
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
              {(searchQuery || statusFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="text-xs text-[#C3002F] hover:text-[#A10026] font-bold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
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
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="text-xs font-mono text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hidden lg:block">
                Active In-Transit: <strong>{activeOrders.length}</strong>
              </div>
              {/* Status Dropdown Selector */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    audio.playSubtleClick();
                    setStatusFilter(e.target.value);
                  }}
                  aria-label="Filter by Status"
                  className="appearance-none pl-3.5 pr-8 py-1.5 text-xs bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-normal cursor-pointer shadow-2xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="ALLOCATED">Allocated</option>
                  <option value="BUYED">Buyed</option>
                  <option value="SOLD">Sold</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
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
              {(searchQuery || statusFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  className="text-xs text-[#C3002F] hover:text-[#A10026] font-bold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1"
                  title="Reset filters"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
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
