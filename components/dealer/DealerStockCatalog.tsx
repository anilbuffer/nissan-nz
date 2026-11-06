"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Vehicle } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import AtomicReservationModal from "./AtomicReservationModal";
import CatalogueDetailsModal from "@/components/admin/CatalogueDetailsModal";
import Pagination from "@/components/common/Pagination";
import { getVehiclePriorityScore, getDealerReservationLabel } from "@/lib/vehicle-priority";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  ArrowRight,
  Lock,
  Gauge,
  Zap,
  Calendar,
  Car,
  X,
  Check,
  CheckCircle2,
  ChevronDown,
  MapPin,
  TrendingUp,
  Ship,
  FileCheck2,
  Eye,
  Wrench,
  AlertTriangle,
} from "lucide-react";

interface DealerStockCatalogProps {
  onSelectVehicle?: (vehicleId: string) => void;
  externalSearchQuery?: string;
}

export default function DealerStockCatalog({
  onSelectVehicle,
  externalSearchQuery,
}: DealerStockCatalogProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdminView = pathname?.startsWith("/admin");
  const { currentDealer, currentUser } = useAuth();
  const isDealer = currentUser?.role === "DEALER_USER" || currentUser?.role === "DEALER_ADMIN";
  const {
    vehicles: rawVehicles,
    reserveVehicle: atomicReserve,
  } = useProgramme();

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

  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dossierVehicle, setDossierVehicle] = useState<Vehicle | null>(null);

  // Layout View Mode (Grid vs List) with Smooth Transition
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  // Favorites / Shortlist State
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const toggleFavorite = (e: React.MouseEvent, vehicleId: string) => {
    e.stopPropagation();
    audio.playSubtleClick();
    setFavorites((prev) => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  };

  // Reservation Modal (for quick reserve from card)
  const [reserveVehicle, setReserveVehicle] = useState<Vehicle | null>(null);

  // Pagination State (10 max entries per page)
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset all filters
  const handleResetFilters = () => {
    audio.playSubtleClick();
    setSearchQuery("");
    setSelectedModel("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedModel !== "ALL") count++;
    if (statusFilter !== "ALL") count++;
    return count;
  }, [searchQuery, selectedModel, statusFilter]);

  // Model Counts for Pills
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
      if (isAdminView || (v.status !== "WITHDRAWN" && v.status !== "DRAFT")) {
        list[0].count++;
        list.slice(1).forEach((item) => {
          if (v.model.toLowerCase().includes(item.key.toLowerCase())) {
            item.count++;
          }
        });
      }
    });

    return list;
  }, [vehicles]);

  // Filtered & Sorted Stock (Live Synced with ProgrammeContext)
  const filteredVehicles = useMemo(() => {
    const effectiveSearch =
      externalSearchQuery !== undefined && externalSearchQuery !== ""
        ? externalSearchQuery
        : searchQuery;

    return vehicles
      .filter((v) => {
        // Hide withdrawn and draft stock from dealer catalog; admin can see all
        if (!isAdminView && (v.status === "WITHDRAWN" || v.status === "DRAFT")) return false;

        if (effectiveSearch) {
          const q = effectiveSearch.toLowerCase();
          const matchStock = v.stockId.toLowerCase().includes(q);
          const matchModel = v.model.toLowerCase().includes(q);
          const matchVin = v.vinChassis.toLowerCase().includes(q);
          const matchGrade = v.grade.toLowerCase().includes(q);
          const matchMake = v.make.toLowerCase().includes(q);
          const matchYear = String(v.year).includes(q);
          if (!matchStock && !matchModel && !matchVin && !matchGrade && !matchMake && !matchYear) return false;
        }

        if (selectedModel !== "ALL" && !v.model.toLowerCase().includes(selectedModel.toLowerCase())) {
          return false;
        }

        if (statusFilter !== "ALL" && v.status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 1. Highest Priority First (Additional Cost, Reserved by Auckland Nissan, Buyed, Sold, Allocated, Reserved, Available)
        const priorityA = getVehiclePriorityScore(a, currentDealer?.id, isAdminView);
        const priorityB = getVehiclePriorityScore(b, currentDealer?.id, isAdminView);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // 2. Secondary sort: Landed buy price low to high
        const priceA = calculateLandedPrice(a.fobPriceJPY, dealerZone).totalBuyPriceNZD;
        const priceB = calculateLandedPrice(b.fobPriceJPY, dealerZone).totalBuyPriceNZD;
        return priceA - priceB;
      });
  }, [vehicles, searchQuery, selectedModel, statusFilter, dealerZone, externalSearchQuery, isAdminView, currentDealer?.id]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedModel, statusFilter, externalSearchQuery]);

  // Calculate pagination boundaries
  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE) || 1;
  const paginatedVehicles = useMemo(() => {
    const validPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVehicles, currentPage, totalPages]);

  // Navigate directly to FULL PAGE Vehicle Details (INSIDE PORTAL)
  const handleOpenFullPageDetails = (vehicleId: string) => {
    audio.playSubtleClick();
    if (onSelectVehicle) {
      onSelectVehicle(vehicleId);
    } else if (isAdminView) {
      router.push(`/admin/vehicles/${vehicleId}`);
    } else {
      router.push(`/dealer/vehicles/${vehicleId}`);
    }
  };

  const handleReservationSuccess = (vehicleId: string) => {
    atomicReserve(
      vehicleId,
      currentDealer?.id || "DEALER_001",
      currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : undefined
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800 pb-12 animate-in fade-in duration-300">

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Clean Title & Subtitle + Total Stocks Text       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            {isAdminView ? "Vehicle Catalogue" : "Vehicle Stock"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdminView
              ? "Live Japanese auction sourcing and pre-cleared logistics pipeline for New Zealand operations."
              : "Certified Japanese inventory, condition grades, and landed pricing for New Zealand franchise dealers."}
          </p>
        </div>

        <div className="text-xs sm:text-sm font-medium text-slate-500 self-start sm:self-auto shrink-0">
          Total Stocks - ( <span className="font-semibold text-slate-900 font-mono">{filteredVehicles.length}</span> )
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Simplified Controls Bar (Search + [ All Models ] Selector) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Note, Leaf, X-Trail, Serena, Kicks, Dayz, Elgrand, Navara..."
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

          {/* Controls: Model Dropdown + Reset + Layout Toggle */}
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
                {isAdminView && (
                  <>
                    <option value="DRAFT">Draft Intake</option>
                    <option value="WITHDRAWN">Withdrawn</option>
                  </>
                )}
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

            {/* Grid vs List Layout Toggle */}
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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Empty & Access Control Guard State                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {!isAdminView && (currentUser?.role === "DEALER_APPLICANT" || (currentDealer && currentDealer.status !== "APPROVED")) ? (
        <div className="bg-white rounded-[16px] border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-4 shadow-soft animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">
              {currentDealer?.status === "SUSPENDED"
                ? "Dealership Account Suspended"
                : "Dealership Verification in Progress"}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {currentDealer?.status === "SUSPENDED"
                ? "Stock viewing and vehicle reservation privileges for this franchise have been administratively suspended. Please contact the Autohub Operations Centre."
                : "Your dealership registration application has been submitted and is currently undergoing commercial verification by the Autohub operations team. Stock catalog access, landed price calculations, and vehicle reservations will activate upon administrative approval."}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dealer/profile")}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
            >
              Review Application Details
            </button>
          </div>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-900">No vehicles match your search filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your model selector or clearing the keyword search.
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
        /* 4A. GRID LAYOUT: Ultra-Clean Luxury Automotive Showcase   */
        /* (Names Full-Width, Hero Studio Car, Price Left & Action Button Right) */
        /* ───────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-5 sm:gap-6 animate-in fade-in duration-300">
          {paginatedVehicles.map((vehicle, index) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const vCosts = vehicle.additionalCosts || [];
            const hasAdditionalCost = vCosts.length > 0;
            const approvedVCosts = vCosts.filter((c) => c.status === "APPROVED");
            const approvedVCostsTotal = approvedVCosts.reduce((s, c) => s + c.amountNZD, 0);
            const allCostsTotal = vCosts.reduce((s, c) => s + c.amountNZD, 0);
            const displayPriceNZD = price.totalBuyPriceNZD + (isAdminView ? allCostsTotal : approvedVCostsTotal);

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[16px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer p-6 sm:p-7 relative overflow-hidden"
              >
                <div>
                  {/* Card Top Row: Full Width Name + Model, with Arrow on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-black transition-colors leading-snug">
                        {vehicle.make} - {vehicle.model}
                      </h3>
                      <p className="text-[12px] text-slate-400 mt-1">
                        {vehicle.year} · {vehicle.fuelType} · Grade {vehicle.auctionGrade}
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <div
                        className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#0A0A0A] text-slate-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0"
                        title="View Full Vehicle Details"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Center: Floating Studio Car with Realistic Floor Shadow */}
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
                            <span>Additional Cost {allCostsTotal > 0 ? `(+$${allCostsTotal.toLocaleString()} NZD)` : ""}</span>
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
                            <span>
                              {getDealerReservationLabel(vehicle.reservedByDealerId, isAdminView, currentDealer?.id)}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Price on Left, Action Button on Right */}
                <div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight block leading-tight">
                      ${displayPriceNZD.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {isAdminView ? `FOB ¥${vehicle.fobPriceJPY.toLocaleString()}` : "NZD Landed Total"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdminView || !isDealer ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFullPageDetails(vehicle.id);
                        }}
                        className="py-2 px-3 sm:px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold transition-all shadow-xs hover:shadow-soft flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    ) : isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setReserveVehicle(vehicle);
                        }}
                        className="py-2 px-3 sm:px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold transition-all shadow-xs hover:shadow-soft active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                        title="Place 24-hour Exclusivity Reservation"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reserve</span>
                      </button>
                    ) : vehicle.status === "BUYED" ? (
                      <span className="py-2 px-3 rounded-xl bg-emerald-50/90 text-emerald-800 border border-emerald-200/90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buyed</span>
                      </span>
                    ) : vehicle.status === "SOLD" ? (
                      <span className="py-2 px-3 rounded-xl bg-slate-100/90 text-slate-700 border border-slate-200/90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sold</span>
                      </span>
                    ) : vehicle.status === "ALLOCATED" ? (
                      <span className="py-2 px-3 rounded-xl bg-sky-50/90 text-sky-800 border border-sky-200/90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs font-mono">
                        <Ship className="w-3.5 h-3.5 text-sky-600" />
                        <span>Allocated</span>
                      </span>
                    ) : (
                      <span className="py-2 px-3 rounded-xl bg-amber-50/90 text-amber-800 border border-amber-200/90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs font-mono">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reserved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 4B. LIST LAYOUT: Clean Luxury Automotive Rows             */
        /* ───────────────────────────────────────────────────────── */
        <div className="space-y-4 animate-in fade-in duration-300">
          {paginatedVehicles.map((vehicle, index) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const vCosts = vehicle.additionalCosts || [];
            const hasAdditionalCost = vCosts.length > 0;
            const approvedVCosts = vCosts.filter((c) => c.status === "APPROVED");
            const approvedVCostsTotal = approvedVCosts.reduce((s, c) => s + c.amountNZD, 0);
            const allCostsTotal = vCosts.reduce((s, c) => s + c.amountNZD, 0);
            const displayPriceNZD = price.totalBuyPriceNZD + (isAdminView ? allCostsTotal : approvedVCostsTotal);

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[16px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] transition-all duration-300 p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6 group cursor-pointer"
              >
                {/* Left: Floating Cutout Thumbnail (No Inner Box) */}
                <div className="relative w-full md:w-56 h-36 flex items-center justify-center shrink-0">
                  <div className="absolute bottom-2 w-4/5 h-3 bg-black/15 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />
                  <img
                    src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 ease-out select-none"
                  />

                  {(hasAdditionalCost || !isAvailable) && (
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
                          <span>{getDealerReservationLabel(vehicle.reservedByDealerId, isAdminView, currentDealer?.id)}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Middle: Clean Info Block & 3 Columns */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{vehicle.year} · {vehicle.fuelType} · #{vehicle.stockId}</span>
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
                          <span>{getDealerReservationLabel(vehicle.reservedByDealerId, isAdminView, currentDealer?.id)}</span>
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-black transition-colors truncate">
                    {vehicle.make} {vehicle.model}
                  </h3>

                  {/* 3-Column Specifications in List View */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100 max-w-md">
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
                        ★ {vehicle.auctionGrade} / {vehicle.interiorGrade}
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
                  </div>
                </div>

                {/* Right: Landed Price & Quick Actions */}
                <div className="w-full md:w-56 shrink-0 md:border-l md:border-slate-100 md:pl-6 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Landed Buy ({dealerZone})
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
                        handleOpenFullPageDetails(vehicle.id);
                      }}
                      className="btn-outline py-2 px-2.5 rounded-xl text-slate-700 text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Specs</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {isAdminView || !isDealer ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFullPageDetails(vehicle.id);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${isAvailable
                          ? "bg-slate-900 hover:bg-black text-white"
                          : "bg-amber-600 hover:bg-amber-700 text-white"
                          }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAvailable ? "Inspect" : "Reserved"}</span>
                      </button>
                    ) : isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setReserveVehicle(vehicle);
                        }}
                        className="py-2 px-3.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Place 24-hour Exclusivity Reservation"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Reserve</span>
                      </button>
                    ) : vehicle.status === "BUYED" ? (
                      <span className="py-2 px-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 text-xs font-semibold text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buyed</span>
                      </span>
                    ) : vehicle.status === "SOLD" ? (
                      <span className="py-2 px-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200/90 text-xs font-semibold text-center flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sold</span>
                      </span>
                    ) : vehicle.status === "ALLOCATED" ? (
                      <span className="py-2 px-3 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/90 text-xs font-semibold text-center flex items-center justify-center gap-1">
                        <Ship className="w-3.5 h-3.5 text-sky-600" />
                        <span>Allocated</span>
                      </span>
                    ) : (
                      <span className="py-2 px-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/90 text-xs font-semibold text-center flex items-center justify-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Reserved</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Pagination Bar (10 entries max per page) */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredVehicles.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={(p) => {
          setCurrentPage(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        itemName="vehicles"
      />

      {/* Catalogue Details Dossier Modal */}
      {dossierVehicle && (
        <CatalogueDetailsModal
          vehicle={dossierVehicle}
          onClose={() => setDossierVehicle(null)}
          onNavigateToReservations={() => router.push("/admin/reservations")}
          onNavigateToInventory={() => router.push(`/admin/vehicles/${dossierVehicle.id}`)}
        />
      )}

      {/* Atomic Reservation Modal */}
      <AtomicReservationModal
        vehicle={reserveVehicle}
        onClose={() => setReserveVehicle(null)}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
}
