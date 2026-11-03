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
  TrendingUp,
  FileText,
  Building2,
  SlidersHorizontal,
} from "lucide-react";

interface FullPageVehicleDetailProps {
  vehicleId?: string;
  vehicleData?: Vehicle;
  onBack?: () => void;
}

function ZeroEmissionBadge() {
  return (
    <div className="flex flex-col items-center select-none pointer-events-none scale-90">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 p-0.5 shadow-sm flex items-center justify-center">
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <span className="text-sky-500 font-bold text-base font-sans leading-none lowercase italic -translate-x-0.5">e</span>
        </div>
      </div>
      <span className="text-[9px] font-bold tracking-tight text-slate-700 uppercase mt-0.5">
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
  const {
    vehicles,
    reserveVehicle: atomicReserve,
    updateVehicle,
    toggleVehicleStatus,
    pricingConfig,
  } = useProgramme();
  const { currentDealer, currentUser } = useAuth();
  const isAdmin = currentUser?.role === "AUTOHUB_ADMIN";
  const dealerZone: ZoneId = (currentDealer?.pricingZoneId as ZoneId) || "ZONE_1";

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
  const [selectedZone, setSelectedZone] = useState<ZoneId>(dealerZone);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);

  // Admin Price Editing State
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [fobInputJPY, setFobInputJPY] = useState(vehicle.fobPriceJPY);
  const [priceUpdatedToast, setPriceUpdatedToast] = useState(false);

  // Keep fobInput synced with vehicle
  React.useEffect(() => {
    setFobInputJPY(vehicle.fobPriceJPY);
  }, [vehicle.fobPriceJPY]);

  // In Dealer role, pricing is anchored to the dealer's designated franchise delivery zone
  const activeZoneId = isAdmin ? selectedZone : dealerZone;
  const selectedZoneConfig = OFFICIAL_PRICING_ZONES[activeZoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;
  const landedPrice: LandedPriceBreakdown = useMemo(() => {
    return calculateLandedPrice(vehicle.fobPriceJPY, activeZoneId, pricingConfig);
  }, [vehicle.fobPriceJPY, activeZoneId, pricingConfig]);

  // Dealer Commercial Margins
  const retailEstimateNZD = Math.round(landedPrice.totalBuyPriceNZD * 1.28);
  const projectedMarginNZD = retailEstimateNZD - landedPrice.totalBuyPriceNZD;
  const marginPercentage = ((projectedMarginNZD / landedPrice.totalBuyPriceNZD) * 100).toFixed(1);

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

  const handleSavePrice = () => {
    audio.playSuccessChime();
    updateVehicle(vehicle.id, { fobPriceJPY: Number(fobInputJPY) });
    setIsEditingPrice(false);
    setPriceUpdatedToast(true);
    setTimeout(() => setPriceUpdatedToast(false), 4000);
  };

  const handleReservationSuccess = (vId: string) => {
    atomicReserve(
      vId,
      currentDealer?.id || "DEALER_001",
      currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : undefined
    );
    setIsReserveModalOpen(false);
  };

  // 5 Delivery Zones with dynamic Fixed Profile Prices for this vehicle
  const zonesWithPrices = useMemo(() => {
    return (["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"] as ZoneId[]).map((zid) => {
      const zConfig = OFFICIAL_PRICING_ZONES[zid];
      const zBreakdown = calculateLandedPrice(vehicle.fobPriceJPY, zid, pricingConfig);
      return {
        id: zid,
        code: zid.replace("ZONE_", "Z"),
        name: zConfig?.zoneName || zid,
        region: zConfig?.coverage || zid,
        towingCost: zBreakdown.zoneDeliveryNZD,
        fixedProfilePrice: zBreakdown.totalBuyPriceNZD,
      };
    });
  }, [vehicle.fobPriceJPY, pricingConfig]);

  const isElectricOrHybrid =
    vehicle.fuelType === "100% Electric" ||
    vehicle.fuelType === "e-Power" ||
    vehicle.model.toLowerCase().includes("leaf") ||
    vehicle.model.toLowerCase().includes("power");

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-10 font-sans text-slate-800">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Navigation & Dealership Identity Bar              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isAdmin ? "Back to Catalogue" : "Back to Stock"}</span>
          </button>

          <div className="h-3.5 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <button
              type="button"
              onClick={handleBack}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              {isAdmin ? "Vehicle Catalogue" : "Stock"}
            </button>
            <span>/</span>
            <span className="text-slate-400">Nissan</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{vehicle.model}</span>
            <span>/</span>
            <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium border border-slate-200">
              #{vehicle.stockId}
            </span>
          </div>
        </div>

        {/* Right: Dealership Profile & Stock State */}
        <div className="flex items-center gap-2 flex-wrap">
          {!isAdmin && currentDealer && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{currentDealer.legalTradingName}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-mono">{dealerZone}</span>
            </div>
          )}

          {isAvailable ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Available</span>
            </span>
          ) : isHeldByCurrentDealer ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Your Active Hold (18h left)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>On Exclusivity Hold</span>
            </span>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {priceUpdatedToast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Vehicle FOB acquisition price updated. Wholesale landed matrix recalculated across all zones.</span>
          </div>
          <button
            type="button"
            onClick={() => setPriceUpdatedToast(false)}
            className="text-emerald-700 hover:text-emerald-900 text-sm cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Top 4 Compact Metric Cards                               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: ODOMETER (JEVIC) */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            ODOMETER (JEVIC)
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 tracking-tight">
            {vehicle.odometerKm.toLocaleString()} km
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            <span>Digitally Certified</span>
          </div>
        </div>

        {/* KPI 2: AUCTION GRADE */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            AUCTION GRADE
          </span>
          <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1">
            <span className="text-amber-500 font-bold">★</span>
            <span>{vehicle.auctionGrade} / {vehicle.interiorGrade}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-normal">
            USS / JAA Certified
          </div>
        </div>

        {/* KPI 3: DEALER RELEVANT METRIC: Est. Retail Guide & Margin */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            {isAdmin ? "FOB BASELINE (JPY)" : "EST. NZ RETAIL GUIDE"}
          </span>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 tracking-tight">
            {isAdmin ? `¥${vehicle.fobPriceJPY.toLocaleString()}` : `$${retailEstimateNZD.toLocaleString()}`}
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-700">
            {isAdmin ? (
              <span className="text-slate-500 font-normal">Japan Acquisition Cost</span>
            ) : (
              <>
                <TrendingUp className="w-3 h-3" />
                <span>+${projectedMarginNZD.toLocaleString()} Margin ({marginPercentage}%)</span>
              </>
            )}
          </div>
        </div>

        {/* KPI 4: YARD STAGING / EXPORT LOGISTICS */}
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">
            EXPORT STAGING
          </span>
          <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate" title={vehicle.location || "Yokohama Yard"}>
            {vehicle.location ? vehicle.location.split("(")[0]?.trim() : "Yokohama Yard"}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-normal">
            Export Bay Ready · RoRo
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Main Body: 2 Columns (Showcase + Landed Economics)       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ───────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Vehicle Showcase + Japanese Export Specs     */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Studio Car Showcase Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs relative">
            {/* Top-Left: Auction Grade Pill */}
            <div className="absolute top-4 left-4 z-20 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-[11px] font-semibold border border-slate-200 shadow-2xs flex items-center gap-1">
              <span className="text-amber-500">★</span>
              <span>Grade {vehicle.auctionGrade} / {vehicle.interiorGrade}</span>
            </div>

            {/* Top-Right: Stock ID */}
            <div className="absolute top-4 right-4 z-20 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-600 font-mono text-[11px] font-medium border border-slate-200 shadow-2xs">
              #{vehicle.stockId}
            </div>

            {/* Car Canvas */}
            <div className="relative aspect-[16/10] w-full flex items-center justify-center my-2">
              {/* Studio floor shadow */}
              <div className="absolute bottom-3 w-4/5 h-4 bg-black/10 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />

              {/* High-res Studio Cutout Car */}
              <img
                src={images[activeImageIdx] || images[0]}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full select-none transition-all duration-200 relative z-10 object-contain filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.10)]"
              />

              {/* Zero Emission Emblem (Right of Car) */}
              {isElectricOrHybrid && (
                <div className="absolute top-6 right-6 z-20 hidden sm:block">
                  <ZeroEmissionBadge />
                </div>
              )}
            </div>

            {/* Horizontal Angle Thumbnails Row */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 border-t border-slate-100">
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
                    className={`w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden p-0.5 transition-all cursor-pointer flex items-center justify-center bg-white shrink-0 ${
                      isActive
                        ? "border-2 border-[#C3002F] shadow-2xs"
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
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Japanese Export Verification &amp; Technical Specs
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  alert(`Opening official verified Japan Auction Sheet for ${vehicle.stockId}`);
                }}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
              >
                <FileText className="w-3 h-3 text-slate-400" />
                <span>Auction Sheet (PDF)</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {/* Row 1: Chassis / VIN */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-normal">Chassis / VIN:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-semibold text-slate-900">
                    {vehicle.vinChassis}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyVin}
                    title="Copy VIN"
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {copiedVin ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Row 2: JEVIC Odometer Certification */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-normal">JEVIC Odometer Certification:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1 font-mono text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>VERIFIED {vehicle.odometerKm.toLocaleString()} KM</span>
                </span>
              </div>

              {/* Row 3: Battery State of Health (SOH) */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-normal">Battery State of Health (SOH):</span>
                <span className="font-medium text-slate-800 text-right">
                  {vehicle.fuelType === "100% Electric"
                    ? "Certified 94.8% SOH (12/12 Bars Verified)"
                    : "Certified Hybrid e-Power System"}
                </span>
              </div>

              {/* Row 4: MR2A Compliance & WoF */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-normal">MR2A Compliance &amp; WoF:</span>
                <span className="text-emerald-700 font-semibold text-right">
                  Pre-Inspected Pass Guaranteed
                </span>
              </div>

              {/* Row 5: Powertrain / Fuel */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-normal">Powertrain / Fuel:</span>
                <span className="font-medium text-slate-800 text-right">
                  {vehicle.fuelType} · {vehicle.transmission}
                </span>
              </div>

              {/* Row 6: Engine Displacement */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-500 font-normal">Engine Displacement:</span>
                <span className="font-mono font-medium text-slate-800 text-right">
                  {vehicle.engineCc > 0 ? `${vehicle.engineCc.toLocaleString()} cc` : "Dual Inverter EV Motor"}
                </span>
              </div>

              {/* Row 7: Condition Summary */}
              {vehicle.conditionSummary && (
                <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-slate-500 font-normal shrink-0">Condition Log:</span>
                  <span className="font-normal text-slate-700 text-left sm:text-right text-[11px]">
                    {vehicle.conditionSummary}
                  </span>
                </div>
              )}

              {/* Row 8: Known Japanese Defects */}
              {vehicle.knownDefects && vehicle.knownDefects.length > 0 && (
                <div className="py-2 flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                  <span className="text-slate-500 font-normal shrink-0">Reported Items:</span>
                  <div className="flex flex-col sm:items-end gap-1">
                    {vehicle.knownDefects.map((defect, dIdx) => (
                      <span key={dIdx} className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        • {defect}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Wholesale Landed Schedule + Dealer Actions  */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 1: WHOLESALE LANDED PRICE SCHEDULE */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                {isAdmin ? "WHOLESALE LANDED PRICE SCHEDULE" : "GUARANTEED WHOLESALE LANDED SCHEDULE"}
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                  ${landedPrice.totalBuyPriceNZD.toLocaleString()}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  NZD Landed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                {isAdmin
                  ? "Guaranteed landed wholesale cost schedule across New Zealand delivery zones."
                  : `Fixed landed price for ${currentDealer?.legalTradingName || "your franchise dealership"} (${dealerZone}).`}
              </p>
            </div>

            {/* Delivery Zone Presentation */}
            {isAdmin ? (
              /* Admin: Interactive 5-Zone Matrix with Fixed Profile Prices */
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold uppercase tracking-wider text-slate-500">
                    Fixed Profile Price as per Zone
                  </span>
                  <span className="font-mono text-slate-400">
                    Active: {selectedZoneConfig.zoneName.split("-")[0]?.trim()}
                  </span>
                </div>
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                  {zonesWithPrices.map((z) => {
                    const isSelected = selectedZone === z.id;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => {
                          audio.playSubtleClick();
                          setSelectedZone(z.id);
                        }}
                        className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white text-slate-900 font-bold shadow-2xs ring-1 ring-slate-300"
                            : "text-slate-600 hover:text-slate-900 font-medium"
                        }`}
                      >
                        <span className="block text-xs font-bold leading-tight">{z.code}</span>
                        <span className="block text-[11px] font-mono font-bold text-slate-900 leading-tight mt-0.5">
                          ${z.fixedProfilePrice.toLocaleString()}
                        </span>
                        <span className="block text-[9px] font-mono text-slate-400 leading-tight">
                          Tow ${z.towingCost}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Dealer: Fixed Designated Territory Badge (Section 4 Compliance) */
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                      Designated Delivery Zone
                    </span>
                    <strong className="text-xs text-slate-800 block">
                      {dealerZone} · {selectedZoneConfig.zoneName}
                    </strong>
                  </div>
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Carrier Transit Included
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/70">
                  <span>Dealership Address:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[200px]">
                    {currentDealer?.address || "Auckland Dealership Depot"}
                  </span>
                </div>
              </div>
            )}

            {/* Price Line Items Table matching Exact Nissan Specifications */}
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Pricing Component</span>
                <span>{isAdmin ? "Calculated Value" : "Commercial Allocation"}</span>
              </div>

              {/* 1. FOB Acquisition Price */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-600 font-medium">FOB Acquisition Price:</span>
                <span className="font-mono font-medium text-slate-900 text-right">
                  ¥{vehicle.fobPriceJPY.toLocaleString()}
                  <span className="text-slate-400 font-normal text-[11px] ml-1">
                    (~${landedPrice.fobNZD.toLocaleString()} NZD)
                  </span>
                </span>
              </div>

              {/* 2. Ocean Freight & Port Handling */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-600 font-medium">Ocean Freight &amp; Port Handling:</span>
                <span className="font-mono font-medium text-slate-900 text-right">
                  ${landedPrice.oceanFreightNZD.toLocaleString()} NZD
                </span>
              </div>

              {/* 3. Customs Processing & GST */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-600 font-medium">Customs Processing &amp; GST:</span>
                <span className="font-mono font-medium text-slate-900 text-right">
                  ${(landedPrice.customsProcessingNZD + landedPrice.gstNZD).toLocaleString()} NZD
                </span>
              </div>

              {/* 4. MR2A Compliance & Inspection */}
              <div className="py-2 flex items-center justify-between gap-3">
                <span className="text-slate-600 font-medium">MR2A Compliance &amp; Inspection:</span>
                <span className="font-mono font-medium text-slate-900 text-right">
                  ${landedPrice.complianceInspectionNZD.toLocaleString()} NZD
                </span>
              </div>

              {/* 5. Domestic NZ Delivery */}
              <div className="py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-slate-600 font-medium">Domestic NZ Delivery:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({selectedZoneConfig.zoneName.split("-")[0]?.trim() || selectedZone})
                  </span>
                </div>
                <span className="font-mono font-medium text-slate-900 text-right">
                  ${landedPrice.zoneDeliveryNZD.toLocaleString()} NZD
                </span>
              </div>

              {/* 6. Nissan Programme Component */}
              <div className="py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-slate-600 font-medium">Nissan Programme Component:</span>
                  <span className="text-[10px] text-slate-400 font-normal">(Configured)</span>
                </div>
                <span className="font-mono font-medium text-slate-900 text-right">
                  ${landedPrice.programmeFeeNZD.toLocaleString()} NZD
                </span>
              </div>

              {/* 7. Total Buy Price / Fixed Profile Price */}
              <div className="py-2.5 px-3 flex items-center justify-between gap-3 bg-slate-50 rounded-lg -mx-1 mt-1 border border-slate-200">
                <div>
                  <strong className="text-xs text-slate-900 block font-bold">
                    Total Buy Price (Fixed Profile Price):
                  </strong>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Guaranteed landed total for {selectedZoneConfig.zoneName.split("-")[0]?.trim()}
                  </span>
                </div>
                <strong className="font-mono text-base font-bold text-slate-950">
                  ${landedPrice.totalBuyPriceNZD.toLocaleString()} NZD
                </strong>
              </div>
            </div>

            {/* Admin: Dedicated Fixed Profile Price Schedule as per Zone */}
            {isAdmin && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Fixed Profile Price as per Zone Schedule
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    5-Zone Commercial Guarantee
                  </span>
                </div>
                <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden text-xs">
                  {zonesWithPrices.map((z) => {
                    const isSelected = selectedZone === z.id;
                    return (
                      <div
                        key={z.id}
                        onClick={() => {
                          audio.playSubtleClick();
                          setSelectedZone(z.id);
                        }}
                        className={`py-2 px-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-white font-semibold text-slate-900 shadow-2xs ring-1 ring-slate-200"
                            : "hover:bg-white text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                              isSelected ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {z.code}
                          </span>
                          <span className="text-xs truncate">{z.name}</span>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">
                            Tow: ${z.towingCost}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            ${z.fixedProfilePrice.toLocaleString()} NZD
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Dealer Role Action / Procurement Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                {isAdmin ? "ADMINISTRATIVE CENTRAL STOCK AUTHORITY" : "DEALER PROCUREMENT & EXCLUSIVITY AUTHORITY"}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                {isAdmin
                  ? "This vehicle is live on the dealer purchasing catalogue and eligible for 24h atomic exclusivity holds."
                  : "Lock this certified Japanese unit exclusively for 24 hours under Section 4 Exclusivity. Zero upfront deposit required."}
              </p>
            </div>

            {isAdmin ? (
              <div className="pt-1 space-y-3">
                {/* Vehicle FOB Price Configurator */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">FOB Acquisition Baseline</span>
                      <span className="text-[11px] text-slate-500">Fixed Japan export baseline</span>
                    </div>
                    {!isEditingPrice && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPrice(true)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                        <span>Configure Price</span>
                      </button>
                    )}
                  </div>

                  {isEditingPrice ? (
                    <div className="space-y-2 pt-1 border-t border-slate-200">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                          ¥
                        </span>
                        <input
                          type="number"
                          step="10000"
                          value={fobInputJPY}
                          onChange={(e) => setFobInputJPY(Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFobInputJPY(vehicle.fobPriceJPY);
                            setIsEditingPrice(false);
                          }}
                          className="px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSavePrice}
                          className="px-3.5 py-1 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                        >
                          Save New Price
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="font-mono font-bold text-base text-slate-900">
                      ¥{vehicle.fobPriceJPY.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Stock Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    toggleVehicleStatus(vehicle.id);
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer ${
                    vehicle.status === "WITHDRAWN"
                      ? "bg-slate-900 hover:bg-black text-white"
                      : "bg-white hover:bg-rose-50 text-[#C3002F] border border-rose-200"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>
                    {vehicle.status === "WITHDRAWN" ? "Publish to Dealer Access" : "Withdraw from Dealer Access"}
                  </span>
                </button>

                {/* Direct Link to Commercial Cost Matrix */}
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    router.push("/admin/config");
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Open Commercial Cost Matrix (/admin/config)</span>
                </button>
              </div>
            ) : (
              <div className="pt-1 space-y-2.5">
                {isAvailable ? (
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setIsReserveModalOpen(true);
                    }}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-[#C3002F] hover:bg-[#A10026] text-white font-semibold text-xs transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Hold Vehicle (24h Exclusivity Lock)</span>
                  </button>
                ) : isHeldByCurrentDealer ? (
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      router.push("/dealer/orders");
                    }}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Your Active Hold (18h left) - Complete Order</span>
                  </button>
                ) : (
                  <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs text-center flex items-center justify-center gap-2 border border-slate-200">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Locked Under 24h Exclusivity Hold by Network</span>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-2.5 text-[10px] text-slate-400 pt-0.5 flex-wrap">
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
