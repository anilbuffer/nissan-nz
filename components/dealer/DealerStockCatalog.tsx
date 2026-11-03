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
  const [selectedMaxKm, setSelectedMaxKm] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"PRICE_ASC" | "PRICE_DESC" | "KM_ASC" | "YEAR_DESC">("PRICE_ASC");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "HELD">("ALL");
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
    setSelectedMaxKm(null);
    setSortBy("PRICE_ASC");
    setStatusFilter("ALL");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedModel !== "ALL") count++;
    if (selectedFuel !== "ALL") count++;
    if (selectedGrade !== "ALL") count++;
    if (selectedMaxKm !== null) count++;
    if (statusFilter !== "ALL") count++;
    return count;
  }, [searchQuery, selectedModel, selectedFuel, selectedGrade, selectedMaxKm, statusFilter]);

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
          if (selectedGrade === "5.0" && v.auctionGrade !== "5.0") return false;
          if (selectedGrade === "4.5" && !["5.0", "4.5"].includes(v.auctionGrade)) return false;
          if (selectedGrade === "4.0" && !["5.0", "4.5", "4.0"].includes(v.auctionGrade)) return false;
        }

        if (selectedMaxKm !== null && v.odometerKm > selectedMaxKm) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "PRICE_ASC") {
          const priceA = calculateLandedPrice(a.fobPriceJPY, dealerZone).totalBuyPriceNZD;
          const priceB = calculateLandedPrice(b.fobPriceJPY, dealerZone).totalBuyPriceNZD;
          return priceA - priceB;
        }
        if (sortBy === "PRICE_DESC") {
          const priceA = calculateLandedPrice(a.fobPriceJPY, dealerZone).totalBuyPriceNZD;
          const priceB = calculateLandedPrice(b.fobPriceJPY, dealerZone).totalBuyPriceNZD;
          return priceB - priceA;
        }
        if (sortBy === "KM_ASC") {
          return a.odometerKm - b.odometerKm;
        }
        if (sortBy === "YEAR_DESC") {
          return b.year - a.year;
        }
        return 0;
      });
  }, [vehicles, searchQuery, selectedModel, selectedFuel, selectedGrade, selectedMaxKm, sortBy, dealerZone, statusFilter]);

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
      {/* 1. Header with Vehicle Stock Title & Right-Aligned Tabs     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAdminView ? "Vehicle Catalogue" : "Vehicle Stock"} ({filteredVehicles.length})
          </h1>
          {isAdminView && (
            <p className="text-xs text-slate-500 mt-0.5">
              Certified Japanese export inventory, condition grades, and landed pricing for New Zealand franchise dealers.
            </p>
          )}
        </div>

        {/* Right-Aligned Status Tabs in Dealer View (or Admin Fleet Badges) */}
        {!isAdminView ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setStatusFilter("ALL");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${statusFilter === "ALL"
                ? "bg-[#0A0A0A] text-white shadow-xs"
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
                setStatusFilter("HELD");
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${statusFilter === "HELD"
                ? "bg-[#0A0A0A] text-white shadow-xs"
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
        ) : (
          <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
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
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Modern Filter & Controls Bar (Wide, Unrestricted Layout)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3.5">
        {/* Row 1: Search Box + Extended Dropdowns + Layout Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Note, X-Trail, Serena, Leaf, stock ID, or chassis..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Extended Filters Toolbar */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Powertrain Filter */}
            <select
              value={selectedFuel}
              onChange={(e) => {
                audio.playSubtleClick();
                setSelectedFuel(e.target.value);
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Powertrains</option>
              <option value="e-Power">e-Power</option>
              <option value="100% Electric">100% Electric (EV)</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Petrol">Petrol</option>
            </select>

            {/* Auction Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => {
                audio.playSubtleClick();
                setSelectedGrade(e.target.value);
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Grades</option>
              <option value="5.0">Grade 5.0 (Showroom)</option>
              <option value="4.5">Grade 4.5+</option>
              <option value="4.0">Grade 4.0+</option>
            </select>

            {/* Mileage Filter */}
            <select
              value={selectedMaxKm !== null ? String(selectedMaxKm) : "ALL"}
              onChange={(e) => {
                audio.playSubtleClick();
                setSelectedMaxKm(e.target.value === "ALL" ? null : Number(e.target.value));
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              <option value="ALL">Any Mileage</option>
              <option value="20000">&lt; 20,000 km</option>
              <option value="35000">&lt; 35,000 km</option>
              <option value="50000">&lt; 50,000 km</option>
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => {
                audio.playSubtleClick();
                setSortBy(e.target.value as any);
              }}
              className="px-2.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer shadow-2xs"
            >
              <option value="PRICE_ASC">Price: Low to High</option>
              <option value="PRICE_DESC">Price: High to Low</option>
              <option value="KM_ASC">Mileage: Lowest First</option>
              <option value="YEAR_DESC">Year: Newest First</option>
            </select>

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

        {/* Row 2: 1-Click Model Quick-Filter Pills Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 navy-scrollbar">
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#0A0A0A] text-white shadow-2xs font-black"
                    : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold"
                }`}
              >
                <span>{item.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isSelected ? "bg-white/20 text-white" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 3: Active Filter Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-bold text-slate-400">Active Filters:</span>
            {selectedModel !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                Model: {selectedModel}
                <button type="button" onClick={() => setSelectedModel("ALL")} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {selectedFuel !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                Fuel: {selectedFuel}
                <button type="button" onClick={() => setSelectedFuel("ALL")} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {selectedGrade !== "ALL" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                Grade: {selectedGrade}+
                <button type="button" onClick={() => setSelectedGrade("ALL")} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {selectedMaxKm !== null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                Max KM: {selectedMaxKm.toLocaleString()} km
                <button type="button" onClick={() => setSelectedMaxKm(null)} className="hover:text-rose-600">✕</button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-200">
                &ldquo;{searchQuery}&rdquo;
                <button type="button" onClick={() => setSearchQuery("")} className="hover:text-rose-600">✕</button>
              </span>
            )}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-[#C3002F] hover:underline ml-1 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
        )}
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
          {filteredVehicles.map((vehicle, index) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[24px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group cursor-pointer p-6 sm:p-7 relative overflow-hidden"
              >
                <div>
                  {/* Card Top Row: Full Width Name + Model, with Arrow on Right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#C3002F] transition-colors leading-snug">
                        {vehicle.make} - {vehicle.model}
                      </h3>
                      <p className="text-[12px] text-slate-400 mt-1">
                        {vehicle.year} · {vehicle.fuelType} · Grade {vehicle.auctionGrade}
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <div
                        className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#C3002F] text-slate-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-2xs shrink-0"
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
                              : "On Exclusivity Hold (18h left)"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Price on Left, Action Button on Right */}
                <div className="pt-3.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight block leading-tight">
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
                        className="py-2.5 px-4 rounded-xl bg-[#C3002F] hover:bg-[#A10026] text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
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
                        <span>On Exclusivity Hold</span>
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
          {filteredVehicles.map((vehicle, index) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const retailEstimate = Math.round(price.totalBuyPriceNZD * 1.28);
            const grossMargin = retailEstimate - price.totalBuyPriceNZD;

            return (
              <div
                key={vehicle.id}
                onClick={() => handleOpenFullPageDetails(vehicle.id)}
                className="bg-white rounded-[24px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] transition-all duration-300 p-5 sm:p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6 group cursor-pointer"
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
                      <span>{vehicle.reservedByDealerId === currentDealer?.id ? "Your Active Hold (18h left)" : "On Exclusivity Hold (18h left)"}</span>
                    </div>
                  )}
                </div>

                {/* Middle: Clean Info Block & 3 Columns */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{vehicle.year} · {vehicle.fuelType} · #{vehicle.stockId}</span>

                    </div>
                    <span className="flex items-center gap-1 text-slate-400 text-xs">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}</span>
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-[#C3002F] transition-colors truncate">
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
                        className="flex-1 py-2 px-3 rounded-xl bg-[#C3002F] hover:bg-[#A10026] text-white text-xs font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
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
                        <span>On Exclusivity Hold</span>
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
