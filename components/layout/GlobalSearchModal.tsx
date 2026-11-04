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
  Car,
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
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";

  // Initialize query and focus input only when modal opens (not on every parent re-render)
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery || "");
      setSelectedIndex(0);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // High-performance multi-term search
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (v.status === "WITHDRAWN") return false;
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
        v.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return tokens.every((token) => {
        const cleanToken = token.replace(/[^a-z0-9]/g, "");
        return (
          searchableText.includes(token) ||
          (cleanToken.length >= 2 && (cleanVin.includes(cleanToken) || cleanStock.includes(cleanToken)))
        );
      });
    });
  }, [vehicles, query]);

  // Navigate to appropriate vehicle view
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
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-10 sm:pt-20 p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150 font-sans"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">

        {/* Top Search Input with Single Crisp Outline */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            {/* Single Outlined Search Box Container */}
            <div className="relative flex-1 flex items-center bg-white rounded-xl border border-slate-300 hover:border-slate-400 focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-900/10 transition-all px-3 py-2 shadow-2xs">
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
                placeholder="Search make, model, year, VIN, stock ID..."
                className="w-full text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-transparent border-0 outline-0 ring-0 focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none !shadow-none !outline-none !ring-0 pr-6"
                style={{ outline: "none", boxShadow: "none" }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    if (onQueryChange) onQueryChange("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* ESC / Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer border border-slate-200 shadow-2xs"
              title="Close search"
            >
              <span className="font-mono text-[11px]">ESC</span>
            </button>
          </div>
        </div>

        {/* Clean, Simple Search List: Thumbnail + Name + Price */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredVehicles.map((vehicle, idx) => {
            const price = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
            const isSelected = selectedIndex === idx;

            return (
              <div
                key={vehicle.id}
                data-index={idx}
                onClick={() => handleSelectVehicle(vehicle.id)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 border ${isSelected
                    ? "bg-slate-50 border-slate-300 shadow-2xs"
                    : "bg-white hover:bg-slate-50/70 border-transparent hover:border-slate-200"
                  }`}
              >
                {/* 1. Thumbnail + 2. Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-9 rounded-lg bg-slate-50 border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                      alt={vehicle.model}
                      className="w-full h-full object-contain select-none"
                    />
                  </div>

                  <div className="min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.grade ? `(${vehicle.grade})` : ""}
                    </h4>
                  </div>
                </div>

                {/* 3. Price */}
                <div className="text-right shrink-0">
                  <span className="font-bold font-mono text-xs sm:text-sm text-slate-900">
                    ${price.totalBuyPriceNZD.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans ml-1">NZD</span>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {filteredVehicles.length === 0 && (
            <div className="py-10 px-4 text-center space-y-2">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                <Car className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                No vehicles matching &ldquo;{query}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Minimalist Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>{filteredVehicles.length} vehicles</span>
          <div className="flex items-center gap-2">
            <span>↑ ↓ navigate</span>
            <span>•</span>
            <span>↵ select</span>
          </div>
        </div>

      </div>
    </div>
  );
}
