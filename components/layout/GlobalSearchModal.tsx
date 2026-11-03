"use client";
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProgramme } from "@/lib/programme-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  Search,
  X,
  ArrowUpRight,
  Lock,
  Car,
  Sparkles,
  CheckCircle2,
  Filter,
  ShieldCheck,
  MapPin,
  ChevronRight,
  SlidersHorizontal,
  Hash,
  Gauge,
  Fuel,
} from "lucide-react";
import { Vehicle } from "@/lib/types";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onQueryChange?: (val: string) => void;
}

export default function GlobalSearchModal({
  isOpen,
  onClose,
  initialQuery = "",
  onQueryChange,
}: GlobalSearchModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, currentDealer } = useAuth();
  const { vehicles } = useProgramme();

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";
  const isAdminOrJapan =
    currentUser?.role === "AUTOHUB_ADMIN" ||
    currentUser?.role === "NISSAN_JAPAN" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/japan");

  // Keep local query in sync with initialQuery when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setSelectedIndex(0);
      // Prevent background scrolling while modal is active
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }, 50);

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, initialQuery]);

  // Quick filter presets
  const filterPresets = [
    { id: "ALL", label: "All Stock", count: vehicles.filter((v) => v.status !== "WITHDRAWN").length },
    { id: "AVAILABLE", label: "Available to Reserve", count: vehicles.filter((v) => v.status === "AVAILABLE").length },
    { id: "NOTE", label: "Note e-Power", count: vehicles.filter((v) => v.model?.toLowerCase().includes("note")).length },
    { id: "X-TRAIL", label: "X-Trail", count: vehicles.filter((v) => v.model?.toLowerCase().includes("x-trail")).length },
    { id: "SERENA", label: "Serena", count: vehicles.filter((v) => v.model?.toLowerCase().includes("serena")).length },
    { id: "LEAF", label: "Leaf EV", count: vehicles.filter((v) => v.model?.toLowerCase().includes("leaf")).length },
    { id: "ARIYA", label: "Ariya", count: vehicles.filter((v) => v.model?.toLowerCase().includes("ariya")).length },
    { id: "GRADE_45", label: "Grade 4.5+", count: vehicles.filter((v) => parseFloat(v.auctionGrade || "0") >= 4.5).length },
  ];

  // Live filtered vehicle listings
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.status === "WITHDRAWN") return false;

      // 1. Category Preset Filter
      if (activeFilter === "AVAILABLE" && v.status !== "AVAILABLE") return false;
      if (activeFilter === "NOTE" && !v.model?.toLowerCase().includes("note")) return false;
      if (activeFilter === "X-TRAIL" && !v.model?.toLowerCase().includes("x-trail")) return false;
      if (activeFilter === "SERENA" && !v.model?.toLowerCase().includes("serena")) return false;
      if (activeFilter === "LEAF" && !v.model?.toLowerCase().includes("leaf")) return false;
      if (activeFilter === "ARIYA" && !v.model?.toLowerCase().includes("ariya")) return false;
      if (activeFilter === "GRADE_45" && parseFloat(v.auctionGrade || "0") < 4.5) return false;

      // 2. Free Text Query Search
      if (!query || !query.trim()) return true;
      const q = query.trim().toLowerCase();

      const modelMatch = v.model?.toLowerCase().includes(q);
      const makeMatch = v.make?.toLowerCase().includes(q);
      const stockMatch = v.stockId?.toLowerCase().includes(q);
      const vinMatch = v.vinChassis?.toLowerCase().includes(q);
      const fuelMatch = v.fuelType?.toLowerCase().includes(q);
      const gradeMatch = v.auctionGrade?.toLowerCase().includes(q) || v.grade?.toLowerCase().includes(q);
      const yearMatch = String(v.year).includes(q);
      const locationMatch = v.location?.toLowerCase().includes(q);
      const colorMatch = v.color?.toLowerCase().includes(q);
      const transmissionMatch = v.transmission?.toLowerCase().includes(q);

      return (
        modelMatch ||
        makeMatch ||
        stockMatch ||
        vinMatch ||
        fuelMatch ||
        gradeMatch ||
        yearMatch ||
        locationMatch ||
        colorMatch ||
        transmissionMatch
      );
    });
  }, [vehicles, query, activeFilter]);

  // Navigate to appropriate vehicle dossier based on portal/role
  const handleSelectVehicle = (vehicleId: string) => {
    audio.playSubtleClick();
    onClose();

    if (pathname.startsWith("/japan") || currentUser?.role === "NISSAN_JAPAN") {
      router.push(`/japan/inventory/${vehicleId}`);
    } else if (
      pathname.startsWith("/admin") ||
      currentUser?.role === "AUTOHUB_ADMIN" ||
      currentUser?.role === "READONLY_AUDITOR"
    ) {
      router.push(`/admin/vehicles/${vehicleId}`);
    } else {
      router.push(`/dealer/vehicles/${vehicleId}`);
    }
  };

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredVehicles.length > 0 ? (prev + 1) % filteredVehicles.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          filteredVehicles.length > 0 ? (prev - 1 + filteredVehicles.length) % filteredVehicles.length : 0
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredVehicles[selectedIndex]) {
          handleSelectVehicle(filteredVehicles[selectedIndex].id);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredVehicles, selectedIndex]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] max-w-4xl w-full overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
        {/* 1. Modal Top Bar with Search Input */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#E11D48] flex items-center justify-center shrink-0 border border-rose-100">
              <Search className="w-5 h-5" />
            </div>

            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                  if (onQueryChange) onQueryChange(e.target.value);
                }}
                placeholder="Search make, model, year, VIN, stock ID, grade or keyword..."
                className="w-full text-sm sm:text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent pr-8"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    if (onQueryChange) onQueryChange("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors shrink-0 flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">ESC</span>
              <X className="w-4 h-4 sm:hidden" />
            </button>
          </div>

          {/* Quick Filter Chips Carousel */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
            {filterPresets.map((f) => {
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setActiveFilter(f.id);
                    setSelectedIndex(0);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${isActive
                      ? "bg-[#E11D48] text-white shadow-xs shadow-rose-200"
                      : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60"
                    }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${isActive ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200/80"
                      }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Results Header Status Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              {filteredVehicles.length} {filteredVehicles.length === 1 ? "Vehicle" : "Vehicles"} Found
            </span>
            {query && (
              <span className="text-slate-400">
                matching &ldquo;<span className="font-medium text-slate-700">{query}</span>&rdquo;
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-600">
              {isAdminOrJapan ? "Yokohama & Kobe Export Feeds" : `Landed ${dealerZone} Schedule`}
            </span>
          </div>
        </div>

        {/* 3. Scrollable Vehicle Listing Cards */}
        <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-1.5">
          {filteredVehicles.map((vehicle, idx) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isAvailable = vehicle.status === "AVAILABLE";
            const isSelected = selectedIndex === idx;

            return (
              <div
                key={vehicle.id}
                data-index={idx}
                onClick={() => handleSelectVehicle(vehicle.id)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all duration-150 border ${isSelected
                    ? "bg-rose-50/40 border-[#E11D48]/40 shadow-xs"
                    : "bg-white hover:bg-slate-50/80 border-slate-100 hover:border-slate-200"
                  }`}
              >
                {/* Left: Thumbnail & Main Dossier */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="relative w-20 h-16 sm:w-24 sm:h-18 rounded-xl bg-slate-100 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-slate-300">
                    <img
                      src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                      alt={vehicle.model}
                      className="w-full h-full object-contain filter drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-xs px-1 py-0.2 rounded text-[9px] font-black text-slate-800 border border-slate-200/80">
                      ★ {vehicle.auctionGrade}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover:text-[#E11D48] transition-colors truncate">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200/80 shrink-0">
                        #{vehicle.stockId}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {vehicle.grade} · {vehicle.color} · VIN: {vehicle.vinChassis}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-slate-600">
                        <Fuel className="w-3.5 h-3.5 text-slate-400" />
                        {vehicle.fuelType}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-slate-600">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        {vehicle.odometerKm.toLocaleString()} km
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {vehicle.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Pricing, Status Pill, Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-base sm:text-lg font-black font-mono text-slate-900 tracking-tight leading-tight">
                      ${price.totalBuyPriceNZD.toLocaleString()}
                      <span className="text-xs font-semibold text-slate-400 ml-1">NZD</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      FOB ¥{vehicle.fobPriceJPY.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isAvailable ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        AVAILABLE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Lock className="w-3 h-3 text-amber-500" />
                        RESERVED
                      </span>
                    )}

                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isSelected
                          ? "bg-[#E11D48] text-white shadow-xs"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-900"
                        }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {filteredVehicles.length === 0 && (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-800">
                  No vehicles found matching &ldquo;{query || activeFilter}&rdquo;
                </h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Try searching by different keywords like &ldquo;Note&rdquo;, &ldquo;X-Trail&rdquo;, &ldquo;Serena&rdquo;, &ldquo;Grade 4.5&rdquo;, or reset your active filters.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveFilter("ALL");
                    if (onQueryChange) onQueryChange("");
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Modal Footer with Keyboard Shortcuts and Navigation */}
        <div className="p-3 sm:px-5 sm:py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="hidden sm:flex items-center gap-2">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200 shadow-2xs">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200 shadow-2xs ml-0.5">
                ↓
              </kbd>{" "}
              Navigate
            </span>
            <span>•</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200 shadow-2xs">
                ↵
              </kbd>{" "}
              Open Dossier
            </span>
            <span>•</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200 shadow-2xs">
                ESC
              </kbd>{" "}
              Close
            </span>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <span className="font-mono text-slate-500 font-semibold text-xs">
              Total Programme Stock: {vehicles.length} Units
            </span>

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onClose();
                if (pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") {
                  router.push("/admin/inventory");
                } else if (pathname.startsWith("/japan") || currentUser?.role === "NISSAN_JAPAN") {
                  router.push("/japan/inventory");
                } else {
                  router.push("/dealer/stocks");
                }
              }}
              className="text-[#E11D48] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Explore Complete Catalogue</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
