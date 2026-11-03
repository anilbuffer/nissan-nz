"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, LandedPriceBreakdown } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import AtomicReservationModal from "./AtomicReservationModal";
import {
  ArrowLeft,
  Gauge,
  Zap,
  Calendar,
  Lock,
  Unlock,
  User,
  ShieldCheck,
  CheckCircle2,
  Car,
  TrendingUp,
  Ship,
  FileCheck2,
  FileText,
  Sparkles,
  MapPin,
  Check,
  ChevronDown,
  Download,
  ShieldAlert,
  HelpCircle,
  Radio,
  SlidersHorizontal,
  Star,
} from "lucide-react";

interface FullPageVehicleDetailProps {
  vehicleId?: string;
  vehicleData?: Vehicle;
  onBack?: () => void;
}

export default function FullPageVehicleDetail({
  vehicleId,
  vehicleData,
  onBack,
}: FullPageVehicleDetailProps) {
  const router = useRouter();
  const { vehicles, reserveVehicle: atomicReserve } = useProgramme();
  const { currentDealer, currentUser } = useAuth();
  const isAdmin = currentUser?.role === "AUTOHUB_ADMIN";
  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";

  // Find vehicle from live programme context
  const rawVehicle =
    vehicleData ||
    vehicles.find((v) => v.id === vehicleId) ||
    vehicles[0] ||
    MOCK_VEHICLES[0];

  // Guarantee transparent studio PNG cutouts from MOCK_VEHICLES always take precedence
  const mockMatch = MOCK_VEHICLES.find((m) => m.id === rawVehicle.id);
  const vehicle = {
    ...rawVehicle,
    images: mockMatch?.images || rawVehicle.images,
  };

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  // Specifications Accordions state (PERFORMANCE open by default matching reference)
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({
    PERFORMANCE: true,
    INSPECTION: false,
    SAFETY: false,
    COMPLIANCE: false,
    DIMENSIONS: false,
  });

  const toggleAccordion = (key: string) => {
    audio.playSubtleClick();
    setOpenAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBack = () => {
    audio.playSubtleClick();
    if (onBack) {
      onBack();
    } else if (isAdmin) {
      router.push("/admin/catalogue");
    } else {
      router.push("/dealer/stocks");
    }
  };

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ["/images/cars/kicks.png"];

  const price: LandedPriceBreakdown = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);
  const retailEstimateNZD = Math.round(price.totalBuyPriceNZD * 1.28);
  const dealerMarginNZD = retailEstimateNZD - price.totalBuyPriceNZD;
  const marginPercentage = ((dealerMarginNZD / price.totalBuyPriceNZD) * 100).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Portal Navigation & Action Bar                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Back button & Breadcrumbs */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isAdmin ? "Back to Catalogue" : "Back to Stock Catalog"}</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <button
              type="button"
              onClick={handleBack}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isAdmin ? "Vehicle Catalogue" : "Stock Catalog"}
            </button>
            <span>/</span>
            <span className="text-slate-500">Nissan</span>
            <span>/</span>
            <span className="text-slate-900 font-semibold">{vehicle.model}</span>
            <span>/</span>
            <span className="font-mono text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
              #{vehicle.stockId}
            </span>
          </div>
        </div>

        {/* Right: Clean Status & Pricing Tier Profile */}
        <div className="flex items-center gap-2.5">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Autohub Operations Authority</span>
              </span>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                Zone 1–5 Schedule Active
              </span>
            </div>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile:</span>
                <span className="text-slate-800">{dealerZone} Landed</span>
              </div>

              {vehicle.status === "AVAILABLE" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Available for Allocation</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Active 24-Hour Hold</span>
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Top Stage: Studio Vehicle View + Acquisition Card        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ───────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Vehicle Showcase + Quick Specs + Angles      */}
        {/* (Matching clean multi-angle studio reference)             */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Vehicle Studio Showcase (Clean White Canvas) */}
          <div className="relative aspect-[16/10] w-full rounded-[28px] overflow-hidden bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] group flex items-center justify-center p-6 sm:p-8">
            {/* Realistic studio floor contact shadow beneath tires */}
            <div className="absolute bottom-6 w-4/5 h-6 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />

            <img
              src={images[activeImageIdx] || images[0]}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full select-none transition-all duration-300 relative z-10 object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)]"
            />

            {/* Top-Left: Discrete Auction Grade Pill */}
            <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-xs font-bold border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
              <span className="text-amber-500 font-bold">★</span>
              <span>Grade {vehicle.auctionGrade} / {vehicle.interiorGrade}</span>
            </div>

            {/* Top-Right: Photo Index & Angle Label */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-700 font-mono text-[11px] font-bold border border-slate-200/80 shadow-2xs">
              {activeImageIdx + 1} / {images.length} · {["Front 3/4", "Side View", "Rear 3/4", "Interior", "Front Face"][activeImageIdx] || "Studio Angle"}
            </div>

            {vehicle.status !== "AVAILABLE" && (
              <div className="absolute bottom-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 text-amber-300 font-bold text-xs shadow-xl border border-amber-500/30 backdrop-blur-md">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>24-Hour Exclusivity Lock Active</span>
              </div>
            )}
          </div>

          {/* 4 Required Specifications Highlights (Odometer, Auction Grade, Est. Margin, Yard Location) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            {/* 1. Odometer */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#E11D48] flex items-center justify-center shrink-0 border border-rose-100">
                <Gauge className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Odometer
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 font-mono block truncate">
                  {vehicle.odometerKm.toLocaleString()} km
                </strong>
              </div>
            </div>

            {/* 2. Auction Grade */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Auction Grade
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                  ★ {vehicle.auctionGrade} / {vehicle.interiorGrade}
                </strong>
              </div>
            </div>

            {/* 3. Est. Margin / FOB Baseline */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  {isAdmin ? "FOB Baseline (JPY)" : "Est. Margin"}
                </span>
                <strong className="text-xs sm:text-sm font-black text-emerald-600 font-mono block truncate">
                  {isAdmin ? `¥${vehicle.fobPriceJPY.toLocaleString()}` : `+$${dealerMarginNZD.toLocaleString()}`}
                </strong>
              </div>
            </div>

            {/* 4. Yard Location */}
            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Yard Location
                </span>
                <strong className="text-xs sm:text-sm font-black text-slate-900 block truncate" title={vehicle.location || "Yokohama Yard"}>
                  {vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}
                </strong>
              </div>
            </div>
          </div>

          {/* Clean Multi-Angle Thumbnails Selector (Same Vehicle, Multiple Perspectives) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Studio Inspection Angles</span>
              <span className="text-slate-400 font-normal">Click to switch perspective</span>
            </div>
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1">
              {images.map((img, idx) => {
                const isActive = activeImageIdx === idx;
                const angleLabels = ["Front 3/4", "Side View", "Rear 3/4", "Interior", "Front Face"];
                const label = angleLabels[idx] || `Angle ${idx + 1}`;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setActiveImageIdx(idx);
                    }}
                    className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all cursor-pointer ${
                      isActive
                        ? "bg-slate-100 ring-2 ring-[#0A1322] shadow-xs"
                        : "bg-white hover:bg-slate-50 border border-slate-200/80 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="w-16 h-11 sm:w-20 sm:h-13 flex items-center justify-center overflow-hidden rounded-xl">
                      <img
                        src={img}
                        alt={label}
                        className="w-full h-full object-contain filter drop-shadow-2xs group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <span className={`text-[10px] font-bold tracking-tight truncate ${isActive ? "text-slate-900 font-extrabold" : "text-slate-500"}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Clean Light Executive Acquisition Card       */}
        {/* (No Dark Boxes - Pure Clean Light Aesthetics)             */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
            {/* Header: Make & Model Title + Spec Subtitle */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1.5">
                <span className="uppercase tracking-wider font-extrabold text-[#E11D48]">
                  Nissan Certified Pre-Owned
                </span>
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold border border-slate-200/60">
                  {vehicle.vinChassis}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {vehicle.make} - {vehicle.model}
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {vehicle.grade} · {vehicle.engineCc || 1200}cc {vehicle.fuelType} · Auction Grade {vehicle.auctionGrade}
              </p>
            </div>

            {/* Landed Pricing Display */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                  ${price.totalBuyPriceNZD.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  NZD Guaranteed Landed ({dealerZone})
                </span>
              </div>
              {isAdmin ? (
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mt-1">
                  <span>Japanese FOB Baseline: <strong className="text-slate-800">¥{vehicle.fobPriceJPY.toLocaleString()} JPY</strong></span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold">Standard Fixed Landed Formula Applied</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fixed commercial landed allocation price. Standard MR2A pass &amp; 15% GST fully covered.
                </p>
              )}
            </div>

            {isAdmin ? (
              /* Admin Authority: 5-Zone Landed Pricing Schedule */
              <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Comparative Landed Price Matrix
                    </span>
                    <strong className="text-xs text-slate-900">Standard Formula (15% GST + MR2A Included)</strong>
                  </div>
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    Fixed Landed
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {[
                    { zone: "ZONE_1", name: "Upper North Island (Auckland Direct)" },
                    { zone: "ZONE_2", name: "Central North Island (Waikato / BOP)" },
                    { zone: "ZONE_3", name: "Lower North Island (Wellington / Hawkes Bay)" },
                    { zone: "ZONE_4", name: "Upper South Island (Canterbury / Nelson)" },
                    { zone: "ZONE_5", name: "Lower South Island (Otago / Southland)" },
                  ].map((z) => {
                    const zPrice = calculateLandedPrice(vehicle.fobPriceJPY, z.zone as any);
                    return (
                      <div key={z.zone} className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {z.zone}
                          </span>
                          <span className="text-[11px] text-slate-600 truncate max-w-[180px]">{z.name}</span>
                        </div>
                        <strong className="font-mono font-bold text-slate-900 text-xs">
                          ${zPrice.totalBuyPriceNZD.toLocaleString()} NZD
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3.5 shadow-2xs">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Wholesale Economics
                  </span>
                  <div className="text-xl font-black font-mono tracking-tight text-slate-900 mt-0.5">
                    ${price.totalBuyPriceNZD.toLocaleString()} <span className="text-xs font-normal text-slate-500">Landed</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Projected Dealer Margin</span>
                  <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-mono text-xs font-bold shadow-2xs">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+${dealerMarginNZD.toLocaleString()} NZD ({marginPercentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Progress Indicator for Margin */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Landed Buy: <strong className="text-slate-900 font-mono">${price.totalBuyPriceNZD.toLocaleString()}</strong></span>
                  <span>Est. NZ Retail: <strong className="text-emerald-700 font-mono font-bold">${retailEstimateNZD.toLocaleString()}</strong></span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden flex">
                  <div style={{ width: `${Math.round((price.totalBuyPriceNZD / retailEstimateNZD) * 100)}%` }} className="bg-[#0A1322] h-full" />
                  <div style={{ width: `${Math.round((dealerMarginNZD / retailEstimateNZD) * 100)}%` }} className="bg-emerald-500 h-full" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">
                  Delivery Zone: <strong className="text-slate-900 font-mono font-bold">{dealerZone}</strong>
                </span>
                <span className="text-emerald-700 font-medium flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  All duties &amp; MR2A pass included
                </span>
              </div>
            </div>
            )}

            {/* Primary Action Button: Simple, High-Conversion Naming */}
            <div className="space-y-3 pt-1">
              {isAdmin ? (
                <div className="space-y-3">
                  {vehicle.status === "RESERVED" ? (
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs text-amber-950 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-amber-900">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span>Active 24h Exclusivity Hold</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold bg-white text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                          18h 42m Left
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Locked by <strong className="text-amber-950">Auckland Nissan City Ltd (NZ-NIS-AKL01)</strong>. Price is guaranteed under Section 4 Commercial Boundary.
                      </p>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSuccessChime();
                            alert("Wholesale allocation confirmed for " + vehicle.stockId + ". Dispatched to shipping pipeline.");
                            router.push("/admin/orders");
                          }}
                          className="py-2.5 px-3 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Order</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            alert("Exclusivity hold released for " + vehicle.stockId + ". Vehicle returned to wholesale catalog.");
                            router.push("/admin/reservations");
                          }}
                          className="btn-outline py-2.5 px-3 rounded-xl text-slate-700 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Release Lock</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">Administrative Operational Status:</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Available in Japan Stock
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            router.push("/admin/inventory");
                          }}
                          className="btn-outline py-3 px-3 rounded-xl text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
                        >
                          Inventory Controller
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            router.push("/admin/orders");
                          }}
                          className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-colors cursor-pointer text-center shadow-xs"
                        >
                          Orders Pipeline
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : vehicle.status === "AVAILABLE" ? (
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setIsReserveModalOpen(true);
                  }}
                  className="w-full py-4 px-6 rounded-2xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(225,29,72,0.30)] hover:shadow-[0_6px_22px_rgba(225,29,72,0.40)] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Hold Vehicle (24h)</span>
                </button>
              ) : (
                <div className="w-full py-4 px-6 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs text-center flex items-center justify-center gap-2 border border-slate-200">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Vehicle Held Under 24-Hour Exclusivity Lock</span>
                </div>
              )}

              {/* Trust Guarantee Badges */}
              <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-1 flex-wrap font-medium">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> Zero initial deposit
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> 24h floorplan hold
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-500" /> 100% Fixed Landed Price
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Bottom Stage: Specifications & Verification Documents   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Vehicle Specifications
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive factory technical data, auction evaluation, and pre-export certification.
            </p>
          </div>

          {/* Official Verification Document Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                alert("Opening Japan Auction Sheet PDF for " + vehicle.stockId);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Auction Sheet (PDF)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                alert("Opening JEVIC Odometer Certificate for " + vehicle.stockId);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>JEVIC Certificate</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {/* ACCORDION 1: PERFORMANCE (Open by default) */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("PERFORMANCE")}
              className="w-full flex items-center justify-between text-left font-black text-xs uppercase tracking-wider text-slate-900 hover:text-[#E11D48] transition-colors py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#E11D48]" />
                <span>PERFORMANCE &amp; POWERTRAIN</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openAccordion.PERFORMANCE ? "rotate-180 text-slate-900" : ""
                  }`}
              />
            </button>

            {openAccordion.PERFORMANCE && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-3.5 pb-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">0–100 km/h</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">7.90 seconds</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Top Speed</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">185 km/h</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">System / Engine</span>
                  <strong className="text-slate-900 text-sm block mt-0.5 truncate">{vehicle.fuelType} (HR12DE + EM47)</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Displacement</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">{vehicle.engineCc || 1200} cc</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Power Output</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">100 kW (136 PS)</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Instant Torque</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">280 Nm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Drivetrain</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{vehicle.driveType}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Transmission</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{vehicle.transmission}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Fuel / Battery</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">{vehicle.fuelType}</strong>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: JAPAN INSPECTION & CONDITION */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("INSPECTION")}
              className="w-full flex items-center justify-between text-left font-black text-xs uppercase tracking-wider text-slate-900 hover:text-[#E11D48] transition-colors py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#E11D48]" />
                <span>JAPAN INSPECTION &amp; CONDITION</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openAccordion.INSPECTION ? "rotate-180 text-slate-900" : ""
                  }`}
              />
            </button>

            {openAccordion.INSPECTION && (
              <div className="space-y-3 pt-3.5 pb-2 text-xs">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Auction Grade</span>
                    <strong className="text-base font-black text-slate-900 font-mono block mt-0.5">★ {vehicle.auctionGrade}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Interior Grade</span>
                    <strong className="text-base font-black text-slate-900 block mt-0.5">Grade {vehicle.interiorGrade}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Exterior Grade</span>
                    <strong className="text-base font-black text-slate-900 block mt-0.5">Grade {vehicle.exteriorGrade}</strong>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-800">JEVIC Odometer Certification</span>
                    </div>
                    <span className="text-emerald-700 font-mono font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      100% Verified
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-800">Yokohama Port Radiation Screening (&lt;0.08 μSv/h)</span>
                    </div>
                    <span className="text-emerald-700 font-mono font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Zero Detected
                    </span>
                  </div>
                </div>

                {vehicle.knownDefects && vehicle.knownDefects.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1.5">Pre-Export Condition Log:</span>
                    <ul className="space-y-1">
                      {vehicle.knownDefects.map((defect, i) => (
                        <li key={i} className="flex items-center gap-2 text-slate-600 text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>{defect}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACCORDION 3: SAFETY & ADAS */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("SAFETY")}
              className="w-full flex items-center justify-between text-left font-black text-xs uppercase tracking-wider text-slate-900 hover:text-[#E11D48] transition-colors py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
                <span>SAFETY &amp; ADAS SPECIFICATIONS</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openAccordion.SAFETY ? "rotate-180 text-slate-900" : ""
                  }`}
              />
            </button>

            {openAccordion.SAFETY && (
              <div className="space-y-2 pt-3.5 pb-2 text-xs">
                <div className="flex items-center gap-2.5 py-1 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>ProPILOT Autonomous Highway Cruise &amp; Steering Assist</span>
                </div>
                <div className="flex items-center gap-2.5 py-1 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Intelligent Emergency Autonomous Forward Braking</span>
                </div>
                <div className="flex items-center gap-2.5 py-1 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Around View 360° Monitor with Moving Object Detection</span>
                </div>
                <div className="flex items-center gap-2.5 py-1 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lane Departure Prevention &amp; Blind Spot Intervention</span>
                </div>
                <div className="flex items-center gap-2.5 py-1 text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Full Curtain &amp; Dual Front SRS Airbags (ANCAP 5-Star Equivalent)</span>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 4: COMPLIANCE & BORDER SPECIFICATIONS */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("COMPLIANCE")}
              className="w-full flex items-center justify-between text-left font-black text-xs uppercase tracking-wider text-slate-900 hover:text-[#E11D48] transition-colors py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4 text-[#E11D48]" />
                <span>COMPLIANCE &amp; BORDER SPECIFICATIONS</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openAccordion.COMPLIANCE ? "rotate-180 text-slate-900" : ""
                  }`}
              />
            </button>

            {openAccordion.COMPLIANCE && (
              <div className="space-y-2 pt-3.5 pb-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Departure Port:</span>
                  <strong className="text-slate-900">Yokohama RoRo Terminal, Japan</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Destination Port:</span>
                  <strong className="text-slate-900">Ports of Auckland (Fergusson Wharf)</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">NZTA Entry Compliance:</span>
                  <strong className="text-emerald-700 font-semibold">MR2A Certification Pass Included</strong>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Warrant of Fitness:</span>
                  <strong className="text-slate-900">1-Year NZ WoF Issued</strong>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500">Biosecurity Clearance:</span>
                  <strong className="text-slate-900">MPI Decontaminated &amp; Steam Cleared</strong>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 5: DIMENSIONS & CAPACITIES */}
          <div className="py-3.5">
            <button
              type="button"
              onClick={() => toggleAccordion("DIMENSIONS")}
              className="w-full flex items-center justify-between text-left font-black text-xs uppercase tracking-wider text-slate-900 hover:text-[#E11D48] transition-colors py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-[#E11D48]" />
                <span>DIMENSIONS &amp; CAPACITIES</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openAccordion.DIMENSIONS ? "rotate-180 text-slate-900" : ""
                  }`}
              />
            </button>

            {openAccordion.DIMENSIONS && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 pt-3.5 pb-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Length</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">4,770 mm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Width</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">1,740 mm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Height</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">1,865 mm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Wheelbase</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">2,860 mm</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Curb Weight</span>
                  <strong className="text-slate-900 font-mono text-sm block mt-0.5">1,670 kg</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Seating</span>
                  <strong className="text-slate-900 text-sm block mt-0.5">5–7 Seats</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Atomic Reservation Modal */}
      <AtomicReservationModal
        vehicle={isReserveModalOpen ? vehicle : null}
        onClose={() => setIsReserveModalOpen(false)}
        onSuccess={(vId) => {
          atomicReserve(
            vId,
            currentDealer?.id || "DEALER_001",
            currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : undefined
          );
          setIsReserveModalOpen(false);
          handleBack();
        }}
      />
    </div>
  );
}
