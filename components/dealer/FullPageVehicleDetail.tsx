"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, LandedPriceBreakdown, ZoneId } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { calculateLandedPrice, OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import AtomicReservationModal from "./AtomicReservationModal";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  ShieldCheck,
  Star,
  MapPin,
  Gauge,
  Eye,
  AlertCircle,
  FileText,
} from "lucide-react";

interface FullPageVehicleDetailProps {
  vehicleId?: string;
  vehicleData?: Vehicle;
  onBack?: () => void;
}

function ZeroEmissionBadge() {
  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 p-0.5 shadow-md flex items-center justify-center">
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-inner">
          <span className="text-sky-500 font-black text-2xl font-sans leading-none lowercase italic -translate-x-0.5">e</span>
        </div>
      </div>
      <span className="text-[10px] font-black tracking-tight text-slate-800 uppercase mt-1">
        Zero Emission
      </span>
    </div>
  );
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
  const defaultZone: ZoneId = (currentDealer?.pricingZoneId as ZoneId) || "ZONE_1";

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

  const images =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images
      : ["/images/cars/note.png"];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedZone, setSelectedZone] = useState<ZoneId>(defaultZone);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);

  const selectedZoneConfig = OFFICIAL_PRICING_ZONES[selectedZone] || OFFICIAL_PRICING_ZONES.ZONE_1;
  const selectedZonePrice: LandedPriceBreakdown = useMemo(() => {
    return calculateLandedPrice(vehicle.fobPriceJPY, selectedZone);
  }, [vehicle.fobPriceJPY, selectedZone]);

  const isAvailable = vehicle.status === "AVAILABLE";
  const isHeldByCurrentDealer = vehicle.reservedByDealerId === currentDealer?.id;

  const handleCopyVin = (e: React.MouseEvent) => {
    e.stopPropagation();
    audio.playSubtleClick();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(vehicle.vinChassis);
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    }
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

  const handleReservationSuccess = (vId: string) => {
    atomicReserve(
      vId,
      currentDealer?.id || "DEALER_001",
      currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : undefined
    );
    setIsReserveModalOpen(false);
  };

  // 5 Delivery Zones for the Price Schedule Matrix
  const zonesList: { id: ZoneId; code: string; cost: number }[] = [
    { id: "ZONE_1", code: "Z1", cost: 650 },
    { id: "ZONE_2", code: "Z2", cost: 900 },
    { id: "ZONE_3", code: "Z3", cost: 1150 },
    { id: "ZONE_4", code: "Z4", cost: 1450 },
    { id: "ZONE_5", code: "Z5", cost: 1750 },
  ];

  const isElectricOrHybrid =
    vehicle.fuelType === "100% Electric" ||
    vehicle.fuelType === "e-Power" ||
    vehicle.model.toLowerCase().includes("leaf") ||
    vehicle.model.toLowerCase().includes("power");

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Navigation & Breadcrumbs Bar                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        {/* Right Status Indicator */}
        <div className="flex items-center gap-2">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for Allocation</span>
            </span>
          ) : isHeldByCurrentDealer ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Your Active Hold (18h left)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>On Exclusivity Hold</span>
            </span>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Top 4 KPI Metric Cards (As in reference screenshot)      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: ODOMETER (JEVIC) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            ODOMETER (JEVIC)
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
            {vehicle.odometerKm.toLocaleString()} km
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Digitally Certified</span>
          </div>
        </div>

        {/* KPI 2: AUCTION GRADE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            AUCTION GRADE
          </span>
          <div className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span className="text-amber-500">★</span>
            <span>{vehicle.auctionGrade} / {vehicle.interiorGrade}</span>
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            USS / JAA Inspection
          </div>
        </div>

        {/* KPI 3: FOB BASELINE (JPY) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            FOB BASELINE (JPY)
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 tracking-tight">
            ¥{vehicle.fobPriceJPY.toLocaleString()}
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            Japan Acquisition Cost
          </div>
        </div>

        {/* KPI 4: YARD STAGING */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            YARD STAGING
          </span>
          <div className="text-2xl font-black text-slate-900 tracking-tight truncate" title={vehicle.location || "Yokohama Yard"}>
            {vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            Export Bay Ready
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Main Body: 2 Columns (Showcase + Landed Schedule)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ───────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Vehicle Showcase + Japanese Export Specs     */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Studio Car Showcase Card */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-7 shadow-xs relative">
            {/* Top-Left: Auction Grade Pill */}
            <div className="absolute top-5 left-5 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-xs font-bold border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
              <span className="text-amber-500">★</span>
              <span>Grade {vehicle.auctionGrade} / {vehicle.interiorGrade}</span>
            </div>

            {/* Top-Right: Stock ID */}
            <div className="absolute top-5 right-5 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-700 font-mono text-xs font-bold border border-slate-200/80 shadow-2xs">
              #{vehicle.stockId}
            </div>

            {/* Car Canvas */}
            <div className="relative aspect-[16/10] w-full flex items-center justify-center my-4">
              {/* Studio floor shadow */}
              <div className="absolute bottom-4 w-4/5 h-6 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />

              {/* High-res Studio Cutout Car */}
              <img
                src={images[activeImageIdx] || images[0]}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full select-none transition-all duration-300 relative z-10 object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.12)]"
              />

              {/* Zero Emission Emblem (Right of Car) */}
              {isElectricOrHybrid && (
                <div className="absolute top-8 right-8 z-20 hidden sm:block">
                  <ZeroEmissionBadge />
                </div>
              )}
            </div>

            {/* Horizontal Angle Thumbnails Row */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pt-4 border-t border-slate-100">
              {images.map((img, idx) => {
                const isActive = activeImageIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setActiveImageIdx(idx);
                    }}
                    className={`w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden p-1 transition-all cursor-pointer flex items-center justify-center bg-white shrink-0 ${
                      isActive
                        ? "border-2 border-[#C3002F] shadow-xs"
                        : "border border-slate-200 hover:border-slate-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Angle ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Japanese Export Verification & Technical Specifications Card */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Japanese Export Verification &amp; Technical Specifications
              </h2>
            </div>

            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              {/* Row 1: Chassis / VIN */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Chassis / VIN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 tracking-wide">
                    {vehicle.vinChassis}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyVin}
                    title="Copy VIN"
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedVin ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Row 2: JEVIC Odometer Certification */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">JEVIC Odometer Certification:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5 font-mono text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>VERIFIED {vehicle.odometerKm.toLocaleString()} KM</span>
                </span>
              </div>

              {/* Row 3: Battery State of Health (SOH) */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Battery State of Health (SOH):</span>
                <span className="font-semibold text-slate-900 text-right">
                  {vehicle.fuelType === "100% Electric"
                    ? "Certified 94.8% SOH (12/12 Bars Verified)"
                    : "Certified Hybrid e-Power System"}
                </span>
              </div>

              {/* Row 4: MR2A Compliance & WoF */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">MR2A Compliance &amp; WoF:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-right">
                  Pre-Inspected Pass Guaranteed
                </span>
              </div>

              {/* Row 5: Powertrain / Fuel */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Powertrain / Fuel:</span>
                <span className="font-semibold text-slate-900 text-right">
                  {vehicle.fuelType} · {vehicle.transmission}
                </span>
              </div>

              {/* Row 6: Engine Displacement */}
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Engine Displacement:</span>
                <span className="font-mono font-semibold text-slate-900 text-right">
                  {vehicle.engineCc > 0 ? `${vehicle.engineCc.toLocaleString()} cc` : "Dual Inverter EV Motor"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Wholesale Landed Schedule + Dealer Actions  */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: WHOLESALE LANDED PRICE SCHEDULE */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                WHOLESALE LANDED PRICE SCHEDULE
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900 tracking-tight">
                  ${selectedZonePrice.totalBuyPriceNZD.toLocaleString()}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  NZD Landed
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Guaranteed landed wholesale cost schedule across New Zealand geographic delivery zones.
              </p>
            </div>

            {/* 5 Delivery Zones Switcher Pills */}
            <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1">
              {zonesList.map((z) => {
                const isSelected = selectedZone === z.id;
                return (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedZone(z.id);
                    }}
                    className={`flex-1 py-2 px-1 rounded-xl text-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-slate-900 font-black shadow-xs ring-1 ring-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-medium"
                    }`}
                  >
                    <span className="block text-xs font-bold leading-tight">{z.code}</span>
                    <span className="block text-[10px] font-mono text-slate-400 leading-tight mt-0.5">
                      ${z.cost}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Price Line Items Table */}
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">Selected Zone Territory:</span>
                <strong className="text-slate-900 font-semibold text-right truncate max-w-[200px]">
                  {selectedZoneConfig.zoneName}
                </strong>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">FOB Acquisition (JPY):</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  ¥{vehicle.fobPriceJPY.toLocaleString()}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">Ocean Freight &amp; Port Handling:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  ${selectedZonePrice.oceanFreightNZD.toLocaleString()} NZD
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">NZ Customs &amp; 15% GST:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  ${selectedZonePrice.gstNZD.toLocaleString()} NZD
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">MR2A Compliance &amp; Inspection:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  ${selectedZonePrice.complianceInspectionNZD.toLocaleString()} NZD
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-medium">Domestic Carrier Towing:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  ${selectedZonePrice.zoneDeliveryNZD.toLocaleString()} NZD
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Dealer Role Action / Procurement Box */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                {isAdmin ? "ADMINISTRATIVE CENTRAL STOCK AUTHORITY" : "DEALER PROCUREMENT & EXCLUSIVITY AUTHORITY"}
              </span>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This vehicle is live on the dealer purchasing catalogue and eligible for 24h atomic exclusivity holds.
              </p>
            </div>

            {isAdmin ? (
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    alert("Vehicle " + vehicle.stockId + " withdrawn from dealer access.");
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-rose-50 text-[#C3002F] border border-rose-200 font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Withdraw from Dealer Access</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                {isAvailable ? (
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setIsReserveModalOpen(true);
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-[#C3002F] hover:bg-[#A10026] text-white font-bold text-sm tracking-wide transition-all shadow-[0_4px_16px_rgba(195,0,47,0.25)] hover:shadow-[0_6px_22px_rgba(195,0,47,0.35)] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Hold Vehicle (24h Exclusivity Lock)</span>
                  </button>
                ) : isHeldByCurrentDealer ? (
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      router.push("/dealer/orders");
                    }}
                    className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Your Active Hold (18h left) - Complete Order</span>
                  </button>
                ) : (
                  <div className="w-full py-4 px-6 rounded-2xl bg-slate-100 text-slate-500 font-bold text-xs text-center flex items-center justify-center gap-2 border border-slate-200">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Locked Under 24h Exclusivity Hold by Network</span>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 pt-1 flex-wrap font-medium">
                  <span>✓ Zero Initial Deposit</span>
                  <span>•</span>
                  <span>✓ 24h Price Guarantee</span>
                  <span>•</span>
                  <span>✓ JEVIC &amp; MR2A Included</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Atomic Exclusivity Reservation Modal                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isReserveModalOpen && (
        <AtomicReservationModal
          vehicle={vehicle}
          onClose={() => setIsReserveModalOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
}
