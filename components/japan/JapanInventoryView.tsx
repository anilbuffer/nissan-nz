"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Vehicle } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { JPY_TO_NZD_EXCHANGE_RATE } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import Pagination from "@/components/common/Pagination";
import { getVehiclePriorityScore } from "@/lib/vehicle-priority";
import {
  Search,
  Plus,
  Eye,
  Upload,
  Edit3,
  ChevronDown,
  RotateCcw,
  X,
  LayoutGrid,
  List,
  Sparkles,
  CheckCircle2,
  Lock,
  Ship,
  MapPin,
  ArrowUpRight,
  AlertCircle,
  Car,
  Wrench,
} from "lucide-react";

interface JapanInventoryViewProps {
  onSelectVehicle?: (vehicleId: string) => void;
  onNavigateAdd?: () => void;
  onNavigateBatch?: () => void;
}

export default function JapanInventoryView({
  onSelectVehicle,
  onNavigateAdd,
  onNavigateBatch,
}: JapanInventoryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { vehicles: rawVehicles, toggleVehicleStatus, setVehicleStatus } = useProgramme();
  const { currentUser } = useAuth();

  // Role permissions
  const isJapan = currentUser?.role === "NISSAN_JAPAN";
  const isAdmin = currentUser?.role === "AUTOHUB_ADMIN";
  const canManageInventory = isJapan || isAdmin;

  // Guarantee high-definition studio transparent cutouts
  const vehicles = useMemo(() => {
    return rawVehicles.map((v) => {
      const mock = MOCK_VEHICLES.find((m) => m.id === v.id);
      return {
        ...v,
        images: mock?.images || v.images,
      };
    });
  }, [rawVehicles]);

  // Filter States (identical to /dealer/stocks)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Layout View Mode (Grid vs List) with Smooth Transition
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");

  // Action Notice Toast
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Withdrawal modal state
  const [withdrawModalVehicle, setWithdrawModalVehicle] = useState<Vehicle | null>(null);
  const [withdrawReason, setWithdrawReason] = useState(
    "Yard Inspection: Cosmetic Paint / Panel Rectification Required"
  );

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

  // Model Counts for selector
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

  // Filtered & Sorted Inventory
  const filteredVehicles = useMemo(() => {
    return vehicles
      .filter((v) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchStock = v.stockId.toLowerCase().includes(q);
          const matchModel = v.model.toLowerCase().includes(q);
          const matchVin = v.vinChassis.toLowerCase().includes(q);
          const matchGrade = (v.grade || "").toLowerCase().includes(q);
          const matchMake = (v.make || "").toLowerCase().includes(q);
          const matchYear = String(v.year).includes(q);
          const matchColor = (v.color || "").toLowerCase().includes(q);
          const matchLoc = (v.location || "").toLowerCase().includes(q);
          if (!matchStock && !matchModel && !matchVin && !matchGrade && !matchMake && !matchYear && !matchColor && !matchLoc) {
            return false;
          }
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
        const priorityA = getVehiclePriorityScore(a, undefined, true);
        const priorityB = getVehiclePriorityScore(b, undefined, true);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.stockId.localeCompare(b.stockId);
      });
  }, [vehicles, searchQuery, selectedModel, statusFilter]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedModel, statusFilter]);

  // Pagination boundaries
  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE) || 1;
  const paginatedVehicles = useMemo(() => {
    const validPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVehicles, currentPage, totalPages]);

  // Quick stats
  const availableCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const draftCount = vehicles.filter((v) => v.status === "DRAFT").length;
  const reservedCount = vehicles.filter((v) => v.status === "RESERVED").length;
  const withdrawnCount = vehicles.filter((v) => v.status === "WITHDRAWN").length;

  // Navigation handlers
  const handleOpenDetails = (vehicleId: string) => {
    audio.playSubtleClick();
    if (onSelectVehicle) {
      onSelectVehicle(vehicleId);
    } else {
      router.push(`/japan/inventory/${vehicleId}`);
    }
  };

  const handleOpenAmend = (e: React.MouseEvent, vehicleId: string) => {
    e.stopPropagation();
    audio.playSubtleClick();
    router.push(`/japan/inventory/${vehicleId}/amend`);
  };

  const handlePublishVehicle = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation();
    audio.playSuccessChime();
    setVehicleStatus(vehicle.id, "AVAILABLE", "Published unit to central New Zealand dealer catalogue");
    setActionNotice(`Unit #${vehicle.stockId} is now LIVE in the central catalogue.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleOpenWithdrawModal = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.stopPropagation();
    audio.playSubtleClick();
    setWithdrawModalVehicle(vehicle);
  };

  const handleWithdrawConfirm = () => {
    if (!withdrawModalVehicle) return;
    audio.playSubtleClick();
    setVehicleStatus(withdrawModalVehicle.id, "WITHDRAWN", withdrawReason);
    setWithdrawModalVehicle(null);
    setActionNotice(`Unit #${withdrawModalVehicle.stockId} withdrawn from catalogue.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6 max-w-8xl mx-auto text-slate-800 pb-12 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Clean Title & Subtitle + Total Stocks Text       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Japan Vehicle Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nissan Motor Co. Japan · Central vehicle repository, yard marshalling, and franchise publication controls.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto shrink-0">
          <div className="text-xs sm:text-sm font-medium text-slate-500">
            Total Inventory - ( <span className="font-semibold text-slate-900 font-mono">{filteredVehicles.length}</span> )
          </div>

          {canManageInventory && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  if (onNavigateBatch) onNavigateBatch();
                  else router.push("/japan/upload");
                }}
                className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Batch CSV/Excel Inventory Upload"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Batch Upload</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  if (onNavigateAdd) onNavigateAdd();
                  else router.push("/japan/add-vehicle");
                }}
                className="py-2 px-3 sm:px-3.5 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold transition-all shadow-xs hover:shadow-soft cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
                title="Add Single Vehicle Listing"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Vehicle</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Notice Toast */}
      {actionNotice && (
        <div className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-soft animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Executive 4-KPI Metric Strip                             */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Total Listed
          </span>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {vehicles.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Yokohama &amp; Kobe Bays
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Available to NZ
          </span>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {availableCount}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Franchise Catalog Active
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Dealer Reserved
          </span>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {reservedCount}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            24h Atomic Exclusivity
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Primary Staging Yard
          </span>
          <div className="text-xl font-bold text-slate-900 truncate">
            Yokohama Terminal
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Bay 14 Marshalling Base
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Controls Bar (Search + Models Selector + Grid/List)       */}
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
              placeholder="Search Note, Leaf, X-Trail, Serena, VIN, or Stock ID..."
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

          {/* Controls: Model Dropdown + Status Selector + Reset + Layout Toggle */}
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
                <option value="ALL">All Statuses ({vehicles.length})</option>
                <option value="AVAILABLE">Available ({availableCount})</option>
                <option value="RESERVED">Reserved ({reservedCount})</option>
                <option value="ALLOCATED">Allocated ({vehicles.filter((v) => v.status === "ALLOCATED").length})</option>
                <option value="BUYED">Buyed ({vehicles.filter((v) => v.status === "BUYED").length})</option>
                <option value="SOLD">Sold ({vehicles.filter((v) => v.status === "SOLD").length})</option>
                <option value="DRAFT">Draft Intake ({draftCount})</option>
                <option value="WITHDRAWN">Withdrawn ({withdrawnCount})</option>
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

            {/* Grid vs List Layout Toggle (100% styled like /dealer/stocks) */}
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
      {/* 4. Empty State                                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-900">No inventory matches your search filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your model selector, status filter, or clearing the search text.
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
        /* 4A. GRID LAYOUT: Luxury Automotive Showcase Cards         */
        /* (Consistent with /dealer/stocks)                          */
        /* ───────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 min-[2200px]:grid-cols-5 gap-5 sm:gap-6 animate-in fade-in duration-300">
          {paginatedVehicles.map((vehicle) => {
            const isAvailable = vehicle.status === "AVAILABLE";
            const isDraft = vehicle.status === "DRAFT";
            const isReserved = vehicle.status === "RESERVED";
            const isAllocated = vehicle.status === "ALLOCATED";
            const isBuyed = vehicle.status === "BUYED";
            const isSold = vehicle.status === "SOLD";
            const isWithdrawn = vehicle.status === "WITHDRAWN";

            const vCosts = vehicle.additionalCosts || [];
            const hasAdditionalCost = vCosts.length > 0;
            const allCostsTotal = vCosts.reduce((s, c) => s + c.amountNZD, 0);

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenDetails(vehicle.id)}
                className="bg-white rounded-[16px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer p-6 sm:p-7 relative overflow-hidden"
              >
                <div>
                  {/* Card Top Row: Name + Model, with Arrow on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-black transition-colors leading-snug truncate">
                        {vehicle.make} - {vehicle.model}
                      </h3>
                      <p className="text-[12px] text-slate-400 mt-1">
                        {vehicle.year} · {vehicle.fuelType || "e-Power"} · Grade {vehicle.auctionGrade || "4.5"}
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

                    {/* Status & Priority Badges Centered at bottom */}
                    <div className="absolute bottom-1 z-20 flex items-center gap-1.5 flex-wrap justify-center px-2 animate-in fade-in max-w-full">
                      {isAvailable && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/95 text-emerald-900 border border-emerald-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span>Available to NZ</span>
                        </span>
                      )}
                      {isDraft && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/95 text-slate-800 border border-slate-300/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                          <Edit3 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>Draft Intake</span>
                        </span>
                      )}
                      {isReserved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50/95 text-amber-900 border border-amber-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                          <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Dealer Reserved</span>
                        </span>
                      )}
                      {isAllocated && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50/95 text-sky-900 border border-sky-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                          <Ship className="w-3 h-3 text-sky-600 shrink-0" />
                          <span>Allocated</span>
                        </span>
                      )}
                      {isBuyed && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50/95 text-emerald-900 border border-emerald-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Buyed</span>
                        </span>
                      )}
                      {isSold && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100/95 text-slate-800 border border-slate-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                          <CheckCircle2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>Sold / Settled</span>
                        </span>
                      )}
                      {isWithdrawn && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50/95 text-rose-900 border border-rose-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                          <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>Withdrawn</span>
                        </span>
                      )}
                      {hasAdditionalCost && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50/95 text-rose-900 border border-rose-200/90 backdrop-blur-md shadow-2xs text-[10px] font-semibold tracking-tight">
                          <Wrench className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>+Cost</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Role-based Price Left & Action Buttons Right */}
                <div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Left: JPY FOB Baseline for Japan Portal (Role-based) */}
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-slate-900 font-mono tracking-tight block leading-tight">
                      ¥{vehicle.fobPriceJPY.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      FOB Baseline · JPY
                    </span>
                  </div>

                  {/* Right: Role-based Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Amend Button (Nissan Japan & Admin only) */}
                    {canManageInventory && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenAmend(e, vehicle.id)}
                        className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-2xs cursor-pointer"
                        title="Amend Vehicle Specifications"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Quick Publish / Withdraw Action (Japan & Admin) */}
                    {canManageInventory && (
                      <>
                        {isAvailable && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenWithdrawModal(e, vehicle)}
                            className="p-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-all shadow-2xs cursor-pointer"
                            title="Withdraw from catalogue"
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(isDraft || isWithdrawn) && (
                          <button
                            type="button"
                            onClick={(e) => handlePublishVehicle(e, vehicle)}
                            className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all shadow-2xs cursor-pointer"
                            title="Publish to catalogue"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}

                    {/* Primary Inspect / Details Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(vehicle.id);
                      }}
                      className="py-2 px-3 sm:px-3.5 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold transition-all shadow-xs hover:shadow-soft flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
                      title="Inspect full vehicle details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ───────────────────────────────────────────────────────── */
        /* 4B. LIST LAYOUT: Luxury Automotive Rows                   */
        /* (Consistent with /dealer/stocks)                          */
        /* ───────────────────────────────────────────────────────── */
        <div className="space-y-4 animate-in fade-in duration-300">
          {paginatedVehicles.map((vehicle) => {
            const isAvailable = vehicle.status === "AVAILABLE";
            const isDraft = vehicle.status === "DRAFT";
            const isReserved = vehicle.status === "RESERVED";
            const isAllocated = vehicle.status === "ALLOCATED";
            const isBuyed = vehicle.status === "BUYED";
            const isSold = vehicle.status === "SOLD";
            const isWithdrawn = vehicle.status === "WITHDRAWN";

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenDetails(vehicle.id)}
                className="bg-white rounded-[16px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] transition-all duration-300 p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6 group cursor-pointer"
              >
                {/* Left: Floating Cutout Thumbnail with floor shadow */}
                <div className="relative w-full md:w-56 h-36 flex items-center justify-center shrink-0">
                  <div className="absolute bottom-2 w-4/5 h-3 bg-black/15 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />
                  <img
                    src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 ease-out select-none"
                  />

                  {/* Status badge pinned to thumbnail bottom */}
                  <div className="absolute bottom-1 z-20 px-2 py-0.5 rounded-full bg-white/95 border border-slate-200/90 shadow-2xs font-semibold text-[9px] flex items-center gap-1.5 flex-wrap justify-center backdrop-blur-md">
                    {isAvailable && (
                      <span className="inline-flex items-center gap-1 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Available</span>
                      </span>
                    )}
                    {isDraft && (
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <Edit3 className="w-2.5 h-2.5 text-slate-500" />
                        <span>Draft</span>
                      </span>
                    )}
                    {isReserved && (
                      <span className="inline-flex items-center gap-1 text-amber-800">
                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                        <span>Reserved</span>
                      </span>
                    )}
                    {isAllocated && (
                      <span className="inline-flex items-center gap-1 text-sky-800">
                        <Ship className="w-2.5 h-2.5 text-sky-600" />
                        <span>Allocated</span>
                      </span>
                    )}
                    {isBuyed && (
                      <span className="inline-flex items-center gap-1 text-emerald-800">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Buyed</span>
                      </span>
                    )}
                    {isSold && (
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <CheckCircle2 className="w-2.5 h-2.5 text-slate-500" />
                        <span>Sold</span>
                      </span>
                    )}
                    {isWithdrawn && (
                      <span className="inline-flex items-center gap-1 text-rose-800">
                        <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                        <span>Withdrawn</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Clean Info Block & 3 Columns */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {vehicle.year} · {vehicle.fuelType || "e-Power"} · #{vehicle.stockId}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        VIN: {vehicle.vinChassis}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Export Terminal"}</span>
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
                        ★ {vehicle.auctionGrade || "4.5"} / {vehicle.interiorGrade || "A"}
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

                {/* Right: FOB Price & Quick Actions */}
                <div className="w-full md:w-56 shrink-0 md:border-l md:border-slate-100 md:pl-6 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                      FOB BASELINE (JPY)
                    </span>
                    <div className="text-xl font-bold text-slate-900 font-mono tracking-tight mt-0.5">
                      ¥{vehicle.fobPriceJPY.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      Yokohama / Kobe Export Terminal
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(vehicle.id);
                      }}
                      className="btn-outline py-2 px-2.5 rounded-xl text-slate-700 text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <span>Specs</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {canManageInventory && (
                      <button
                        type="button"
                        onClick={(e) => handleOpenAmend(e, vehicle.id)}
                        className="btn-outline py-2 px-2 rounded-xl text-slate-700 text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                        title="Amend Details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(vehicle.id);
                      }}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Pagination Bar (10 entries max per page)                 */}
      {/* ─────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. Withdrawal Reason Modal                                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {withdrawModalVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Withdraw Vehicle from Catalogue
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Stock #{withdrawModalVehicle.stockId} ({withdrawModalVehicle.model})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Withdrawing this vehicle removes it from dealer visibility. Please specify the formal administrative withdrawal justification:
            </p>

            <div className="space-y-2">
              {[
                "Yard Inspection: Cosmetic Paint / Panel Rectification Required",
                "Documentation Hold: Awaiting JEVIC Biosecurity Re-clearance",
                "Commercial Staging: Re-assigned to Corporate Fleet Program",
                "Japanese Recall Campaign: Technical Module Update Required",
              ].map((reason, idx) => (
                <label
                  key={idx}
                  onClick={() => setWithdrawReason(reason)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${withdrawReason === reason
                      ? "border-rose-300 bg-rose-50/60 text-slate-900 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                >
                  <input
                    type="radio"
                    name="withdrawReason"
                    checked={withdrawReason === reason}
                    onChange={() => setWithdrawReason(reason)}
                    className="text-[#C3002F] focus:ring-[#C3002F]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWithdrawModalVehicle(null)}
                className="btn-outline text-xs py-2 px-3.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdrawConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
