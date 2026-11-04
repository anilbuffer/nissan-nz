"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Vehicle, ZoneId } from "@/lib/types";
import { getCanonicalModelName, getSameModelVehicles, getModelAngleImages } from "@/lib/vehicle-media";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { audio } from "@/lib/sound";
import StatusBadge from "./StatusBadge";
import {
  Car,
  ChevronRight,
  Eye,
  Gauge,
  Layers,
  MapPin,
  Sparkles,
  Star,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface SameModelVehiclesShowcaseProps {
  currentVehicle: Vehicle;
  allVehicles?: Vehicle[];
  onSelectVehicle?: (vehicle: Vehicle) => void;
  isAdmin?: boolean;
  portal?: "dealer" | "admin" | "japan" | "programme";
  compact?: boolean;
  title?: string;
  className?: string;
}

export default function SameModelVehiclesShowcase({
  currentVehicle,
  allVehicles,
  onSelectVehicle,
  isAdmin = false,
  portal = "dealer",
  compact = false,
  title,
  className = "",
}: SameModelVehiclesShowcaseProps) {
  const router = useRouter();
  const { vehicles: contextVehicles } = useProgramme();
  const { currentUser, currentDealer } = useAuth();

  const vehiclesList = allVehicles && allVehicles.length > 0 ? allVehicles : contextVehicles;
  const sameModelUnits = getSameModelVehicles(vehiclesList, currentVehicle);
  const canonicalModel = getCanonicalModelName(currentVehicle.model);

  if (sameModelUnits.length === 0) {
    if (compact) return null;
    return (
      <div className={`p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-xs text-slate-500 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-400" />
          <span>
            Single Exclusive Spec: Unit <strong>#{currentVehicle.stockId}</strong> is currently the only <strong>{canonicalModel}</strong> in intake staging.
          </span>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
          Fleet Count: 1
        </span>
      </div>
    );
  }

  const dealerZone: ZoneId = (currentDealer?.pricingZoneId as ZoneId) || "ZONE_1";
  const isCurrentUnavailable = currentVehicle.status !== "AVAILABLE";
  const availableCount = sameModelUnits.filter((v) => v.status === "AVAILABLE").length;

  const handleUnitClick = (unit: Vehicle) => {
    audio.playSubtleClick();
    if (onSelectVehicle) {
      onSelectVehicle(unit);
      return;
    }

    if (portal === "admin" || isAdmin) {
      router.push(`/admin/vehicles/${unit.id}`);
    } else if (portal === "japan") {
      router.push(`/japan/inventory/${unit.id}`);
    } else {
      router.push(`/dealer/vehicles/${unit.id}`);
    }
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#C3002F] border border-rose-100 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {title || `Other ${canonicalModel} Units in Central Inventory`}
              </h3>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {sameModelUnits.length} {sameModelUnits.length === 1 ? "unit" : "units"}
              </span>
              {availableCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {availableCount} Available Now
                </span>
              )}
            </div>
            {!compact && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Compare sibling specifications, grades, and landed buy prices across the network.
              </p>
            )}
          </div>
        </div>

        {isCurrentUnavailable && availableCount > 0 && (
          <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 self-start sm:self-auto">
            <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Alternative units available for immediate reserve</span>
          </div>
        )}
      </div>

      {/* Grid of Same-Model Units */}
      <div className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {sameModelUnits.map((unit) => {
          const landed = calculateLandedPrice(unit.fobPriceJPY, dealerZone);
          const isUnitAvailable = unit.status === "AVAILABLE";
          const unitImages = unit.images && unit.images.length > 0
            ? unit.images
            : getModelAngleImages(unit.model);
          const displayThumb = unitImages[0] || "/images/cars/note.png";

          return (
            <div
              key={unit.id}
              onClick={() => handleUnitClick(unit)}
              className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-3.5 shadow-2xs hover:shadow-soft transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              <div>
                {/* Top: Stock ID & Status */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      #{unit.stockId}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono truncate">
                      {unit.vinChassis}
                    </span>
                  </div>
                  <StatusBadge status={unit.status} size="sm" />
                </div>

                {/* Middle: Studio Thumbnail & Quick Specs */}
                <div className="py-2.5 flex items-center gap-3">
                  <div className="w-20 h-16 rounded-lg bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200/80 p-1 flex items-center justify-center shrink-0 relative overflow-hidden">
                    <img
                      src={displayThumb}
                      alt={unit.model}
                      className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-110 transition-transform duration-200 select-none"
                    />
                    {unitImages.length > 1 && (
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono font-bold bg-slate-900/70 text-white px-1 py-0.2 rounded">
                        {unitImages.length} angles
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-black transition-colors truncate">
                      {unit.year} {unit.model}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {unit.grade || "Standard Spec"} · {unit.color}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
                      <span>{unit.odometerKm.toLocaleString()} km</span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                        ★ {unit.auctionGrade}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Price & Inspect CTA */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-900 block leading-tight">
                    {isAdmin ? `¥${unit.fobPriceJPY.toLocaleString()}` : `$${landed.totalBuyPriceNZD.toLocaleString()} NZD`}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block">
                    {isAdmin ? "FOB Acquisition" : "Landed Wholesale"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnitClick(unit);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white border border-slate-200 hover:border-slate-900 text-[11px] font-bold transition-all cursor-pointer shadow-2xs group-hover:border-slate-400"
                >
                  <span>Inspect</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
