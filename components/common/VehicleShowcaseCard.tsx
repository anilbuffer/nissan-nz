"use client";

import React, { useState, useMemo } from "react";
import { Vehicle } from "@/lib/types";
import { audio } from "@/lib/sound";
import { getModelAngleImages } from "@/lib/vehicle-media";
import { ChevronLeft, ChevronRight, Star, MapPin } from "lucide-react";

interface VehicleShowcaseCardProps {
  vehicle: Vehicle;
  className?: string;
  showLocationBadge?: boolean;
  showGradeBadge?: boolean;
}

function getBodyType(model?: string): string {
  const m = (model || "").toLowerCase();
  if (
    m.includes("x-trail") ||
    m.includes("xtrail") ||
    m.includes("kicks") ||
    m.includes("ariya") ||
    m.includes("patrol")
  ) {
    return "SUV";
  }
  if (m.includes("serena") || m.includes("elgrand")) {
    return "People Mover";
  }
  if (m.includes("navara")) {
    return "Double Cab Ute";
  }
  if (m.includes("caravan") || m.includes("nv350")) {
    return "Commercial Van";
  }
  return "Hatchback";
}

function getDoorCount(model?: string): string {
  const m = (model || "").toLowerCase();
  if (m.includes("navara")) return "4 Door";
  return "5 Door";
}

export default function VehicleShowcaseCard({
  vehicle,
  className = "",
  showLocationBadge = false,
  showGradeBadge = false,
}: VehicleShowcaseCardProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Guarantee multi-angle image gallery from vehicle data or fallback studio photos
  const images = useMemo(() => {
    if (vehicle.images && vehicle.images.length > 1) {
      return vehicle.images;
    }
    return getModelAngleImages(
      vehicle.model,
      vehicle.images?.[0] || "/images/cars/note.png"
    );
  }, [vehicle.images, vehicle.model]);

  const activeImage = images[activeImageIdx] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    audio.playSubtleClick();
    setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    audio.playSubtleClick();
    setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleSelectThumbnail = (idx: number) => {
    audio.playSubtleClick();
    setActiveImageIdx(idx);
  };

  // Subtitle spec attributes: e.g. "e-Power | 1,198cc | Hatchback | 5 Door"
  const powertrain =
    vehicle.fuelType === "100% Electric"
      ? "100% Electric"
      : vehicle.transmission === "e-Power Drive" || vehicle.fuelType === "e-Power"
      ? "e-Power"
      : vehicle.fuelType || "Petrol";

  const engine =
    vehicle.fuelType === "100% Electric" ||
    (!vehicle.engineCc && vehicle.fuelType?.toLowerCase().includes("electric"))
      ? "Electric Motor"
      : `${vehicle.engineCc ? vehicle.engineCc.toLocaleString() : "1,198"}cc`;

  const bodyType = getBodyType(vehicle.model);
  const doors = getDoorCount(vehicle.model);

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-6 md:p-7 border border-slate-200/90 shadow-2xs h-full flex flex-col justify-between ${className}`}
    >
      <div>
        {/* ─────────────────────────────────────────────────────────── */}
        {/* 1. Top Card Header: Vehicle Name, Specs Line, Stock Pill   */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 pb-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-xs sm:text-[13px] text-slate-500 font-normal mt-1">
              {powertrain} &nbsp;|&nbsp; {engine} &nbsp;|&nbsp; {bodyType} &nbsp;|&nbsp; {doors}
            </p>
          </div>

          <div className="shrink-0 self-start">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-mono font-medium text-slate-700 block">
              Stock: {vehicle.stockId.replace(/^#/, "")}
            </span>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* 2. Hero Vehicle Stage with Seamless Canvas & Nav Controls   */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="relative w-full h-56 sm:h-72 md:h-80 lg:h-84 my-2 flex items-center justify-center overflow-hidden group">
          {/* Subtle realistic ground shadow beneath car */}
          <div className="absolute bottom-3 w-4/5 h-6 bg-black/15 rounded-[50%] blur-lg pointer-events-none transform scale-y-50" />

          {/* Main Hero Car Photo */}
          <img
            src={activeImage}
            alt={`${vehicle.make} ${vehicle.model} - Perspective ${activeImageIdx + 1}`}
            className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)] select-none transition-transform duration-300 group-hover:scale-[1.02]"
          />

          {/* Left Arrow Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-950 transition-all cursor-pointer z-20 active:scale-95 touch-manipulation"
              title="Previous photo"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5 stroke-[1.75]" />
            </button>
          )}

          {/* Right Arrow Button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 hover:bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-700 hover:text-slate-950 transition-all cursor-pointer z-20 active:scale-95 touch-manipulation"
              title="Next photo"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 stroke-[1.75]" />
            </button>
          )}

          {/* Optional Auction Grade Badge */}
          {showGradeBadge && vehicle.auctionGrade && (
            <div className="absolute top-2 left-2 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-mono font-bold text-slate-800 border border-slate-200 shadow-soft flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>★ Grade {vehicle.auctionGrade}</span>
            </div>
          )}

          {/* Optional Yard Location Badge */}
          {showLocationBadge && vehicle.location && (
            <div className="absolute bottom-2 right-2 z-20 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/90 font-mono text-xs flex items-center gap-1.5 shadow-soft">
              <MapPin className="w-3.5 h-3.5 text-[#C3002F]" />
              <span>{vehicle.location.split("(")[0]?.trim()}</span>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* 3. Thumbnail Gallery Strip (Active with Red Outline Border) */}
        {/* ─────────────────────────────────────────────────────────── */}
        {images.length > 1 && (
          <div className="mt-4 pt-1">
            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
              {images.map((img, idx) => {
                const isActive = activeImageIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectThumbnail(idx)}
                    className={`w-18 h-13 sm:w-20 sm:h-14 md:w-22 md:h-16 rounded-xl p-1 overflow-hidden transition-all cursor-pointer bg-white shrink-0 flex items-center justify-center ${
                      isActive
                        ? "border-2 border-[#C3002F] shadow-2xs"
                        : "border border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100"
                    }`}
                    title={`View photo angle ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail angle ${idx + 1}`}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
