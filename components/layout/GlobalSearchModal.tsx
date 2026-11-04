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
  Car,
  ChevronRight,
} from "lucide-react";

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

  // Clean, focused filter presets
  const filterPresets = [
    { id: "ALL", label: "All Stock" },
    { id: "AVAILABLE", label: "Available" },
    { id: "NOTE", label: "Note e-Power" },
    { id: "LEAF", label: "Leaf EV" },
    { id: "X-TRAIL", label: "X-Trail" },
    { id: "SERENA", label: "Serena" },
    { id: "HYBRID", label: "Hybrid" },
    { id: "E-POWER", label: "e-Power" },
  ];

  // Intelligent, multi-token search engine that works well
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.status === "WITHDRAWN") return false;

      // 1. Preset filter match
      if (activeFilter === "AVAILABLE" && v.status !== "AVAILABLE") return false;
      if (activeFilter === "NOTE" && !v.model?.toLowerCase().includes("note")) return false;
      if (activeFilter === "LEAF" && !v.model?.toLowerCase().includes("leaf")) return false;
      if (activeFilter === "X-TRAIL" && !v.model?.toLowerCase().includes("x-trail")) return false;
      if (activeFilter === "SERENA" && !v.model?.toLowerCase().includes("serena")) return false;
      if (activeFilter === "HYBRID" && !v.fuelType?.toLowerCase().includes("hybrid")) return false;
      if (
        activeFilter === "E-POWER" &&
        !v.fuelType?.toLowerCase().includes("power") &&
        !v.model?.toLowerCase().includes("power")
      ) {
        return false;
      }

      // 2. Multi-term free text search
      if (!query || !query.trim()) return true;

      const rawQuery = query.trim().toLowerCase();
      const tokens = rawQuery.split(/\s+/).filter(Boolean);

      const cleanVin = (v.vinChassis || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanStock = (v.stockId || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const searchableText = [
        v.year,
        v.make,
        v.model,
        v.grade,
        v.color,
        v.fuelType,
        v.transmission,
        v.location,
        v.stockId,
        v.vinChassis,
        cleanVin,
        cleanStock,
        v.auctionGrade ? `grade ${v.auctionGrade}` : "",
        v.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Every word token in the query must match the vehicle
      return tokens.every((token) => {
        const cleanToken = token.replace(/[^a-z0-9]/g, "");
        return (
          searchableText.includes(token) ||
          (cleanToken.length >= 2 && (cleanVin.includes(cleanToken) || cleanStock.includes(cleanToken)))
        );
      });
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
      currentUser?.role === "AUTOHUB_ADMIN"
    ) {
      router.push(`/admin/vehicles/${vehicleId}`);
    } else {
      router.push(`/dealer/vehicles/${vehicleId}`);
    }
  };

  // Keyboard navigation
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
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-8 sm:pt-16 p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150 font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        
        {/* 1. Modal Top Bar with Outlined Search Input */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white sticky top-0 z-20 space-y-3">
          <div className="flex items-center gap-2.5">
            {/* Outlined Search Field */}
            <div className="relative flex-1 flex items-center bg-slate-50 hover:bg-white focus-within:bg-white rounded-xl border border-slate-300 hover:border-slate-400 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all px-3.5 py-2.5 shadow-2xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                  if (onQueryChange) onQueryChange(e.target.value);
                }}
                placeholder="Search make, model, year, VIN, stock ID, or keyword..."
                className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent pr-7"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    if (onQueryChange) onQueryChange("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-200/60 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clean Close / ESC Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer border border-slate-200 shadow-2xs"
              title="Close search"
            >
              <span className="hidden sm:inline font-mono text-[11px]">ESC</span>
              <X className="w-4 h-4 sm:hidden" />
            </button>
          </div>

          {/* Clean, Simple Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
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
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white font-semibold shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 font-medium"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Results Count Bar */}
        <div className="px-5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            <strong className="text-slate-800 font-semibold">{filteredVehicles.length}</strong> {filteredVehicles.length === 1 ? "vehicle" : "vehicles"} found
            {query && <span> for &ldquo;{query}&rdquo;</span>}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {isAdminOrJapan ? "Central Inventory" : `Pricing: ${dealerZone}`}
          </span>
        </div>

        {/* 3. Streamlined Clean Vehicle List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1 divide-y-0">
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
                className={`group flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 border ${
                  isSelected
                    ? "bg-slate-50 border-slate-300 shadow-2xs"
                    : "bg-white hover:bg-slate-50/70 border-transparent hover:border-slate-200"
                }`}
              >
                {/* Left: Thumbnail & Core Identification */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-14 h-10 sm:w-16 sm:h-11 rounded-lg bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                      alt={vehicle.model}
                      className="w-full h-full object-contain select-none"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 font-medium shrink-0">
                        #{vehicle.stockId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {vehicle.grade ? `${vehicle.grade} · ` : ""}{vehicle.fuelType} · {vehicle.odometerKm.toLocaleString()} km · {vehicle.color}
                    </p>
                  </div>
                </div>

                {/* Right: Price, Status & Chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="font-bold font-mono text-xs sm:text-sm text-slate-900">
                      ${price.totalBuyPriceNZD.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans ml-1">NZD</span>
                  </div>

                  {isAvailable ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      AVAILABLE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
                      RESERVED
                    </span>
                  )}

                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isSelected
                        ? "text-slate-800 translate-x-0.5"
                        : "text-slate-300 group-hover:text-slate-600"
                    }`}
                  />
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {filteredVehicles.length === 0 && (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-slate-800">
                  No vehicles found matching &ldquo;{query}&rdquo;
                </h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Try searching by model, year, VIN (e.g. E13), or reset filters.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setActiveFilter("ALL");
                    if (onQueryChange) onQueryChange("");
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  Reset Search
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Minimalist Modal Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="hidden sm:flex items-center gap-2 text-slate-500">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200 shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200 shadow-2xs ml-0.5">↓</kbd>
              {" "}navigate
            </span>
            <span>•</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200 shadow-2xs">↵</kbd>
              {" "}select
            </span>
            <span>•</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white font-mono text-[10px] text-slate-600 border border-slate-200 shadow-2xs">ESC</kbd>
              {" "}close
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
              if (pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") {
                router.push("/admin/catalogue");
              } else if (pathname.startsWith("/japan") || currentUser?.role === "NISSAN_JAPAN") {
                router.push("/japan/inventory");
              } else {
                router.push("/dealer/stocks");
              }
            }}
            className="text-slate-700 hover:text-[#C3002F] font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors ml-auto"
          >
            <span>View Full Catalogue</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
