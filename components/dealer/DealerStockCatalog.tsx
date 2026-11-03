"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Vehicle } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import AtomicReservationModal from "./AtomicReservationModal";
import CatalogueDetailsModal from "@/components/admin/CatalogueDetailsModal";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  LayoutGrid,
  List,
  Sparkles,
  ShieldCheck,
  Heart,
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
  const { vehicles: rawVehicles, reserveVehicle: atomicReserve } = useProgramme();

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
  const [selectedFuel, setSelectedFuel] = useState("ALL");
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedBudget, setSelectedBudget] = useState("ALL");
  const [sortBy, setSortBy] = useState<"PRICE_ASC" | "PRICE_DESC" | "KM_ASC" | "YEAR_DESC">("PRICE_ASC");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "HELD">("ALL");
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

  // Reset all filters
  const handleResetFilters = () => {
    audio.playSubtleClick();
    setSearchQuery("");
    setSelectedModel("ALL");
    setSelectedFuel("ALL");
    setSelectedGrade("ALL");
    setSelectedBudget("ALL");
    setSortBy("PRICE_ASC");
    setStatusFilter("ALL");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedModel !== "ALL") count++;
    if (selectedFuel !== "ALL") count++;
    if (selectedGrade !== "ALL") count++;
    if (selectedBudget !== "ALL") count++;
    return count;
  }, [searchQuery, selectedModel, selectedFuel, selectedGrade, selectedBudget]);

  // Model Counts for Pills
  const modelStats = useMemo(() => {
    const list = [
      { key: "ALL", name: "All Models", count: 0 },
      { key: "Note", name: "Note e-Power", count: 0 },
      { key: "X-Trail", name: "X-Trail Hybrid", count: 0 },
      { key: "Serena", name: "Serena e-Power", count: 0 },
      { key: "Leaf", name: "Leaf e+ (EV)", count: 0 },
      { key: "Ariya", name: "Ariya EV", count: 0 },
      { key: "Kicks", name: "Kicks e-Power", count: 0 },
    ];

    vehicles.forEach((v) => {
      if (v.status !== "WITHDRAWN") {
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
        // Hide withdrawn stock from dealer catalog
        if (v.status === "WITHDRAWN") return false;
        if (statusFilter === "AVAILABLE" && v.status !== "AVAILABLE") return false;
        if (statusFilter === "HELD" && v.status !== "RESERVED") return false;

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

        if (selectedFuel !== "ALL" && v.fuelType !== selectedFuel) {
          return false;
        }

        if (selectedGrade !== "ALL") {
          const numGrade = parseFloat(v.auctionGrade);
          if (selectedGrade === "5.0" && numGrade < 5.0) return false;
          if (selectedGrade === "4.5" && numGrade < 4.5) return false;
          if (selectedGrade === "4.0" && numGrade < 4.0) return false;
        }

        const price = calculateLandedPrice(v.fobPriceJPY, dealerZone).totalBuyPriceNZD;
        if (selectedBudget === "UNDER_25K" && price >= 25000) return false;
        if (selectedBudget === "25K_35K" && (price < 25000 || price > 35000)) return false;
        if (selectedBudget === "OVER_35K" && price <= 35000) return false;

        return true;
      })
      .sort((a, b) => {
        const priceA = calculateLandedPrice(a.fobPriceJPY, dealerZone).totalBuyPriceNZD;
        const priceB = calculateLandedPrice(b.fobPriceJPY, dealerZone).totalBuyPriceNZD;

        if (sortBy === "PRICE_ASC") return priceA - priceB;
        if (sortBy === "PRICE_DESC") return priceB - priceA;
        if (sortBy === "KM_ASC") return a.odometerKm - b.odometerKm;
        return b.year - a.year;
      });
  }, [vehicles, searchQuery, selectedModel, selectedFuel, selectedGrade, selectedBudget, sortBy, dealerZone, statusFilter]);

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

  const availableCount = filteredVehicles.filter((v) => v.status === "AVAILABLE").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header with In Stock count (mirroring reference)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="pb-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isAdminView ? "Vehicle Catalogue" : "Vehicle Stock"} ({filteredVehicles.length})
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdminView
                ? "Certified Japanese export inventory, condition grades, and landed pricing for New Zealand franchise dealers."
                : `Landed wholesale inventory for ${currentDealer?.legalTradingName || "Auckland Nissan City Ltd"} (${dealerZone})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
          {isAdminView ? (
            <>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span><strong className="text-slate-900 font-mono font-bold">{vehicles.length}</strong> Total Fleet</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span><strong className="text-slate-900 font-mono font-bold">{availableCount}</strong> Available in Japan</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs font-mono">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span><strong className="text-amber-800 font-bold">{vehicles.filter(v => v.status === "RESERVED").length}</strong> Active Holds</span>
              </div>
            </>
          ) : (
            <>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-2 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span><strong className="text-slate-900 font-mono font-bold">{availableCount}</strong> Available for Hold</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5 shadow-2xs">
                <span className="text-slate-400 font-normal">Pricing Zone:</span>
                <span className="font-extrabold font-mono text-[#0A1322]">{dealerZone}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scope Status Tabs: All Stock vs Available for Hold vs On Exclusivity Hold */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            setStatusFilter("ALL");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${statusFilter === "ALL"
            ? "bg-[#0A1322] text-white shadow-xs"
            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>All Stock</span>
          <span className={`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] ${statusFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
            }`}>
            {vehicles.filter((v) => v.status !== "WITHDRAWN").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            setStatusFilter("AVAILABLE");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${statusFilter === "AVAILABLE"
            ? "bg-[#0A1322] text-white shadow-xs"
            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Available for Hold</span>
          <span className={`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] ${statusFilter === "AVAILABLE" ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
            }`}>
            {vehicles.filter((v) => v.status === "AVAILABLE").length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            setStatusFilter("HELD");
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${statusFilter === "HELD"
            ? "bg-[#0A1322] text-white shadow-xs"
            : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
        >
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          <span>On Exclusivity Hold</span>
          <span className={`ml-1 px-1.5 py-0.2 rounded-md font-mono text-[10px] ${statusFilter === "HELD" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            }`}>
            {vehicles.filter((v) => v.status === "RESERVED").length}
          </span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Modern Filter & Controls Bar (Wide, Unrestricted Layout)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4">
        {/* Top Filter Row: Search + Powertrain + Grade + Budget + Sort + Grid/List */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Note, X-Trail, Serena, stock ID, or chassis..."
              className="w-full pl-9 pr-8 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Selectors & Sort */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Powertrain Selector */}
            <div className="relative">
              <select
                value={selectedFuel}
                onChange={(e) => {
                  audio.playSubtleClick();
                  setSelectedFuel(e.target.value);
                }}
                aria-label="Filter by Powertrain"
                className="appearance-none pl-3 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Powertrains</option>
                <option value="e-Power">e-Power Hybrid</option>
                <option value="Hybrid">Standard Hybrid</option>
                <option value="100% Electric">100% Electric (EV)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Auction Grade Selector */}
            <div className="relative">
              <select
                value={selectedGrade}
                onChange={(e) => {
                  audio.playSubtleClick();
                  setSelectedGrade(e.target.value);
                }}
                aria-label="Filter by Auction Grade"
                className="appearance-none pl-3 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Auction Grades</option>
                <option value="5.0">Grade 5.0 (Showroom)</option>
                <option value="4.5">Grade 4.5+ (Immaculate)</option>
                <option value="4.0">Grade 4.0+ (Verified)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Budget Selector */}
            <div className="relative">
              <select
                value={selectedBudget}
                onChange={(e) => {
                  audio.playSubtleClick();
                  setSelectedBudget(e.target.value);
                }}
                aria-label="Filter by Budget"
                className="appearance-none pl-3 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all cursor-pointer shadow-2xs"
              >
                <option value="ALL">Any Budget</option>
                <option value="UNDER_25K">&lt; $25,000 NZD</option>
                <option value="25K_35K">$25,000 – $35,000</option>
                <option value="OVER_35K">&gt; $35,000 NZD</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  audio.playSubtleClick();
                  setSortBy(e.target.value as "PRICE_ASC" | "PRICE_DESC" | "KM_ASC" | "YEAR_DESC");
                }}
                aria-label="Sort inventory"
                className="appearance-none pl-3 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-[#E11D48]/20 focus:border-[#E11D48] transition-all cursor-pointer shadow-2xs"
              >
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="KM_ASC">Lowest Mileage</option>
                <option value="YEAR_DESC">Newest Year</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Grid vs List Layout Toggle in Top Right */}
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

        {/* Bottom Filter Row: Model Pills Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Models:
          </span>
          {modelStats.map((item) => {
            const isSelected = selectedModel === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setSelectedModel(item.key);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${isSelected
                  ? "bg-[#E11D48] text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70"
                  }`}
              >
                <span>{item.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${isSelected ? "bg-white/25 text-white" : "bg-white text-slate-600 border border-slate-200/80"
                    }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#E11D48] hover:text-[#BE123C] font-bold flex items-center gap-1 cursor-pointer shrink-0 ml-auto transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Empty State                                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Car className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-900">No vehicles match your search filters</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your model selector, powertrain filters, or clearing the keyword search.
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
          {filteredVehicles.map((vehicle) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const isFav = !!favorites[vehicle.id];

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[28px] border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer p-6 sm:p-7 relative overflow-hidden"
              >
                <div>
                  {/* Card Top Row: Full Width Name + Model, with Arrow & Favorite on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#E11D48] transition-colors leading-snug">
                        {vehicle.make} - {vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        {vehicle.year} · {vehicle.fuelType} · Grade {vehicle.auctionGrade}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, vehicle.id)}
                        aria-label="Add to favorites"
                        className={`p-2 rounded-full transition-all cursor-pointer ${isFav
                            ? "text-[#E11D48] bg-[#E11D48]/10"
                            : "text-slate-300 hover:text-[#E11D48] hover:bg-slate-50"
                          }`}
                      >
                        <Heart className={`w-4 h-4 ${isFav ? "fill-[#E11D48]" : ""}`} />
                      </button>
                      <div
                        className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#E11D48] text-slate-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0"
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

                    {!isAvailable && (
                      <div className="absolute bottom-1 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-amber-300 border border-amber-500/30 shadow-lg text-[11px] font-mono font-bold animate-in fade-in">
                        <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>
                          {isAdminView
                            ? (vehicle.reservedByDealerId === "DEALER_002" ? "Held by BOP Nissan" : "Held by Auckland Nissan")
                            : vehicle.reservedByDealerId === currentDealer?.id
                              ? "Your Active Hold (18h left)"
                              : "24h Exclusivity Lock Active"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Price on Left, Action Button on Right */}
                <div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block leading-tight">
                      ${price.totalBuyPriceNZD.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                      {isAdminView ? `FOB ¥${vehicle.fobPriceJPY.toLocaleString()}` : "NZD Landed"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAdminView ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFullPageDetails(vehicle.id);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Vehicle</span>
                      </button>
                    ) : isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setReserveVehicle(vehicle);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Hold (24h)</span>
                      </button>
                    ) : vehicle.reservedByDealerId === currentDealer?.id ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/dealer/orders");
                        }}
                        className="py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>My Active Hold</span>
                      </button>
                    ) : (
                      <span className="py-2.5 px-4 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-400 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Unavailable</span>
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
          {filteredVehicles.map((vehicle) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const isFav = !!favorites[vehicle.id];
            const retailEstimate = Math.round(price.totalBuyPriceNZD * 1.28);
            const grossMargin = retailEstimate - price.totalBuyPriceNZD;

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[24px] border border-slate-200/80 hover:border-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.07)] transition-all duration-300 p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6 group cursor-pointer"
              >
                {/* Left: Floating Cutout Thumbnail (No Inner Box) */}
                <div className="relative w-full md:w-56 h-36 flex items-center justify-center shrink-0">
                  <div className="absolute bottom-2 w-4/5 h-3 bg-black/15 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />
                  <img
                    src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 ease-out select-none"
                  />

                  {!isAvailable && (
                    <div className="absolute bottom-1 z-20 px-2.5 py-0.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-500/30 font-bold text-[9px] font-mono flex items-center gap-1 shadow-md">
                      <Lock className="w-2.5 h-2.5 text-amber-400" />
                      <span>{vehicle.reservedByDealerId === currentDealer?.id ? "Your Hold" : "Locked"}</span>
                    </div>
                  )}
                </div>

                {/* Middle: Clean Info Block & 3 Columns */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">{vehicle.year} · {vehicle.fuelType} · #{vehicle.stockId}</span>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#E11D48] transition-colors truncate">
                    {vehicle.make} {vehicle.model}
                  </h3>

                  {/* 3-Column Specifications in List View */}
                  <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100 max-w-md">
                    <div>
                      <span className="text-sm font-mono font-black text-slate-900 block leading-tight">
                        {vehicle.odometerKm.toLocaleString()} km
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                        Odometer
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-mono font-black text-slate-900 block leading-tight">
                        ★ {vehicle.auctionGrade} / {vehicle.interiorGrade}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                        Auction Grade
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-mono font-black text-emerald-600 block leading-tight">
                        +${grossMargin.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mt-0.5">
                        Est. Margin
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
                    <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                      ${price.totalBuyPriceNZD.toLocaleString()}
                      <span className="text-xs text-slate-500 font-normal ml-1">NZD</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenFullPageDetails(vehicle.id);
                      }}
                      className="btn-outline flex-1 py-2 px-3 rounded-xl text-slate-700 text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Specs</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {isAdminView ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenFullPageDetails(vehicle.id);
                        }}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs ${isAvailable
                            ? "bg-slate-900 hover:bg-black text-white"
                            : "bg-amber-600 hover:bg-amber-700 text-white"
                          }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAvailable ? "Inspect" : "Hold"}</span>
                      </button>
                    ) : isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setReserveVehicle(vehicle);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Hold</span>
                      </button>
                    ) : vehicle.reservedByDealerId === currentDealer?.id ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push("/dealer/orders");
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold font-mono text-center flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>My Hold</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-400 text-xs font-semibold cursor-not-allowed text-center flex items-center justify-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Locked</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Catalogue Details Dossier Modal */}
      {dossierVehicle && (
        <CatalogueDetailsModal
          vehicle={dossierVehicle}
          onClose={() => setDossierVehicle(null)}
          onNavigateToReservations={() => router.push("/admin/reservations")}
          onNavigateToInventory={() => router.push("/admin/inventory")}
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
