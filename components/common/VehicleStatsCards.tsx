"use client";

import React, { useState } from "react";
import { Vehicle } from "@/lib/types";
import { audio } from "@/lib/sound";

interface VehicleStatsCardsProps {
  vehicle: Vehicle;
  className?: string;
}

/**
 * Sleek, small precision SVGs matching the design reference exactly
 */
export function VinTagIcon({ className = "w-4 h-4 sm:w-4.5 sm:h-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Automotive Chassis / VIN Plate Stamp */}
      <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
      <path d="M7 9.5h4" />
      <path d="M7 12.5h10" />
      <path d="M7 15.5h6" />
      <circle cx="18" cy="8.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="18" cy="15.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EngineIcon({ className = "w-4 h-4 sm:w-4.5 sm:h-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Engine main block body */}
      <rect x="5.5" y="8" width="12" height="9" rx="1.5" />
      {/* Left air intake / pulleys */}
      <path d="M5.5 10H3v5h2.5" />
      <path d="M3 12.5h2.5" />
      {/* Top cylinder head / valve cover */}
      <path d="M8.5 8V5.5h6V8" />
      <path d="M10.5 5.5V4h2v1.5" />
      {/* Right bell housing connector */}
      <path d="M17.5 10H20v5h-2.5" />
      <path d="M20 11.5v2" />
      {/* Lower oil pan */}
      <path d="M8 17v1.5h7V17" />
    </svg>
  );
}

export function TransmissionIcon({ className = "w-4 h-4 sm:w-4.5 sm:h-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Horizontal connector line */}
      <path d="M5 12h14" />
      {/* 3 Vertical gear tracks */}
      <path d="M5 6.5v11" />
      <path d="M12 6.5v11" />
      <path d="M19 6.5v11" />
      {/* 6 gear position terminal knobs */}
      <circle cx="5" cy="5" r="1.4" strokeWidth={1.4} />
      <circle cx="12" cy="5" r="1.4" strokeWidth={1.4} />
      <circle cx="19" cy="5" r="1.4" strokeWidth={1.4} />
      <circle cx="5" cy="19" r="1.4" strokeWidth={1.4} />
      <circle cx="12" cy="19" r="1.4" strokeWidth={1.4} />
      <circle cx="19" cy="19" r="1.4" strokeWidth={1.4} />
    </svg>
  );
}

export function FuelLeafIcon({ className = "w-4 h-4 sm:w-4.5 sm:h-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Elegant tilted eco leaf */}
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.5 12 13 13 12" />
    </svg>
  );
}

export function SpeedometerIcon({ className = "w-4 h-4 sm:w-4.5 sm:h-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Speedometer gauge arc and dial */}
      <path d="M3.34 17a10 10 0 1 1 17.32 0" />
      <path d="m12 14 3.5-3.5" />
      <circle cx="12" cy="14" r="1.4" />
      <path d="M6.5 11h.01" />
      <path d="M17.5 11h.01" />
      <path d="M12 6.5h.01" />
    </svg>
  );
}

export function CalendarIcon({ className = "w-4 h-4 sm:w-4.5 sm:h-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Modern calendar card */}
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 9.5h18" />
    </svg>
  );
}

export function PaletteIcon({ className = "w-4 h-4 sm:w-4.5 sm:h-4.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Paint palette with thumb hole and color spots */}
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.12 0-.93.75-1.67 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C22 6 17.5 2 12 2Z" />
      <circle cx="13.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Formatters for vehicle specs matching official NZ/Japan Nissan taxonomy
 */
function resolveEngine(v: Vehicle): string {
  if (v.fuelType === "100% Electric" || (!v.engineCc && v.fuelType?.toLowerCase().includes("electric"))) {
    return "Electric Motor";
  }
  if (v.engineCc && v.engineCc > 0) {
    return `${v.engineCc.toLocaleString()} cc`;
  }
  return "1,198 cc";
}

function resolveTransmission(v: Vehicle): string {
  if (v.transmission === "e-Power Drive" || v.fuelType === "e-Power") {
    return "e-Power";
  }
  return v.transmission || "Automatic";
}

function resolveFuelEconomy(v: Vehicle): string {
  if ((v as any).fuelEconomy) return (v as any).fuelEconomy;
  if ((v as any).fuelConsumption) return (v as any).fuelConsumption;

  const model = (v.model || "").toLowerCase();
  const fuel = (v.fuelType || "").toLowerCase();

  if (fuel.includes("electric") || model.includes("leaf")) return "0.0 L/100km";
  if (model.includes("note")) return "4.5 L/100km";
  if (model.includes("kicks")) return "4.6 L/100km";
  if (model.includes("serena")) return "5.4 L/100km";
  if (model.includes("x-trail")) return "6.1 L/100km";
  if (model.includes("dayz")) return "4.8 L/100km";
  if (model.includes("roox")) return "4.9 L/100km";
  if (model.includes("aura")) return "4.4 L/100km";
  if (model.includes("caravan")) return "8.9 L/100km";
  if (fuel.includes("e-power")) return "4.5 L/100km";
  if (fuel.includes("hybrid")) return "4.8 L/100km";
  return "4.5 L/100km";
}

function resolveOdo(v: Vehicle): string {
  if (v.odometerKm !== undefined && v.odometerKm !== null) {
    return `${v.odometerKm.toLocaleString()} ${v.odometerUnit || "km"}`;
  }
  return "23,401 km";
}

function resolveYear(v: Vehicle): string {
  return String(v.year || 2021);
}

function resolveColour(v: Vehicle): string {
  return v.color || "White Pearl";
}

export default function VehicleStatsCards({
  vehicle,
  className = "",
}: VehicleStatsCardsProps) {
  const [copiedVin, setCopiedVin] = useState(false);

  if (!vehicle) return null;

  const handleCopyVin = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(vehicle.vinChassis);
      audio.playSubtleClick();
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    }
  };

  const stats = [
    {
      key: "vin",
      label: "VIN",
      value: vehicle.vinChassis || "ZE1-104928",
      icon: VinTagIcon,
      clickable: true,
      onClick: handleCopyVin,
      title: "Click to copy VIN / Chassis number",
      copied: copiedVin,
    },
    {
      key: "engine",
      label: "Engine",
      value: resolveEngine(vehicle),
      icon: EngineIcon,
    },
    {
      key: "transmission",
      label: "Transmission",
      value: resolveTransmission(vehicle),
      icon: TransmissionIcon,
    },
    {
      key: "fuel",
      label: "Fuel (Combined)",
      value: resolveFuelEconomy(vehicle),
      icon: FuelLeafIcon,
    },
    {
      key: "odometer",
      label: "ODO",
      value: resolveOdo(vehicle),
      icon: SpeedometerIcon,
    },
    {
      key: "year",
      label: "Year",
      value: resolveYear(vehicle),
      icon: CalendarIcon,
    },
    {
      key: "colour",
      label: "Colour",
      value: resolveColour(vehicle),
      icon: PaletteIcon,
    },
  ];

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden ${className}`}
    >
      {/* 1. Mobile & Tablet Responsive Grid (< lg): All 7 stats clearly visible without any horizontal scroll */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:hidden p-3 sm:p-4 gap-2 sm:gap-2.5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isVin = stat.key === "vin";
          return (
            <div
              key={stat.key}
              className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-colors ${
                stat.clickable ? "cursor-pointer group select-none hover:bg-slate-100/80 active:scale-[0.99]" : ""
              } ${isVin ? "col-span-2 sm:col-span-1" : ""}`}
              onClick={stat.onClick}
              title={stat.title}
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                <Icon className="w-4 h-4 text-slate-500 shrink-0 group-hover:text-slate-800 transition-colors" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] sm:text-[12.5px] font-bold text-slate-900 tracking-tight leading-tight truncate group-hover:text-slate-700 transition-colors flex items-center gap-1.5 font-mono">
                  <span>{stat.value}</span>
                  {stat.copied && (
                    <span className="text-[10px] text-emerald-600 font-bold font-sans animate-in fade-in">
                      Copied!
                    </span>
                  )}
                </div>
                <div className="text-[10px] sm:text-[10.5px] font-normal text-slate-400 leading-tight mt-0.5 truncate">
                  {stat.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Desktop Single-Row Flex Strip (>= lg): Sleek inline presentation with precision dividers */}
      <div className="hidden lg:flex items-center w-full py-2.5 sm:py-3 px-3 sm:px-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <React.Fragment key={stat.key}>
              {idx > 0 && (
                <div className="h-6 sm:h-7 w-[1px] bg-slate-200/80 shrink-0 mx-1 sm:mx-1.5" />
              )}
              <div
                className={`flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0 justify-center px-1 sm:px-1.5 first:pl-0 last:pr-0 ${
                  stat.clickable ? "cursor-pointer group select-none" : ""
                }`}
                onClick={stat.onClick}
                title={stat.title}
              >
                <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-500 shrink-0 group-hover:text-slate-800 transition-colors" />
                <div className="min-w-0">
                  <div className="text-[11.5px] sm:text-[12.5px] lg:text-[13px] font-bold text-slate-900 tracking-tight leading-tight whitespace-nowrap group-hover:text-slate-700 transition-colors flex items-center gap-1 font-mono">
                    <span>{stat.value}</span>
                    {stat.copied && (
                      <span className="text-[10px] text-emerald-600 font-bold font-sans animate-in fade-in">
                        Copied!
                      </span>
                    )}
                  </div>
                  <div className="text-[9.5px] sm:text-[10px] lg:text-[10.5px] font-normal text-slate-400 leading-tight mt-0.5 whitespace-nowrap">
                    {stat.label}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
