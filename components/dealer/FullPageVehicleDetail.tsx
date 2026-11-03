"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Vehicle, LandedPriceBreakdown, ZoneId } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { calculateLandedPrice, OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import AtomicReservationModal from "./AtomicReservationModal";
import DirectAllocationModal from "./DirectAllocationModal";
import AddVehicleAdditionalCostModal from "@/components/admin/AddVehicleAdditionalCostModal";
import { AdditionalCostItem } from "@/lib/types";
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
  Ship,
  DollarSign,
  Trash2,
  Wrench,
  PlusCircle,
} from "lucide-react";

interface FullPageVehicleDetailProps {
  vehicleId?: string;
  vehicleData?: Vehicle;
  onBack?: () => void;
  isAdmin?: boolean;
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

function getVehicleAction(vehicle: Vehicle): "RESERVE" | "ALLOCATION" {
  if (vehicle.allocationMode) return vehicle.allocationMode;
  const num = parseInt(vehicle.stockId.replace(/\D/g, "") || "0", 10);
  return num % 2 === 0 ? "RESERVE" : "ALLOCATION";
}

export default function FullPageVehicleDetail({
  vehicleId,
  vehicleData,
  onBack,
  isAdmin: isAdminProp,
}: FullPageVehicleDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    vehicles,
    reserveVehicle: atomicReserve,
    updateVehicle,
    setVehicleStatus,
    pricingConfig,
  } = useProgramme();
  const { currentDealer, currentUser } = useAuth();
  const isAdmin =
    isAdminProp ??
    (currentUser?.role === "AUTOHUB_ADMIN" || (typeof pathname === "string" && pathname.startsWith("/admin")));
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
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [fullWidthTab, setFullWidthTab] = useState<"ADDITIONAL_COSTS" | "SPECS">("ADDITIONAL_COSTS");
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);

  // Admin Price Editing State
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [fobInputJPY, setFobInputJPY] = useState(vehicle.fobPriceJPY);
  const [priceUpdatedToast, setPriceUpdatedToast] = useState(false);
  const [activeDocPreview, setActiveDocPreview] = useState<{
    title: string;
    type: "AUCTION_SHEET" | "JEVIC" | "MPI" | "MR2A";
    refNumber: string;
    details: string;
  } | null>(null);

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

  const additionalCosts: AdditionalCostItem[] = vehicle.additionalCosts || [];
  const additionalCostsTotal = additionalCosts.reduce((sum, item) => sum + item.amountNZD, 0);
  const basePriceNZD = landedPrice.totalBuyPriceNZD;
  const totalBuyPriceNZD = basePriceNZD + additionalCostsTotal;

  const handleAddAdditionalCost = (item: AdditionalCostItem) => {
    const updated = [...additionalCosts, item];
    updateVehicle(vehicle.id, { additionalCosts: updated });
  };

  const handleRemoveAdditionalCost = (costId: string) => {
    const updated = additionalCosts.filter((c) => c.id !== costId);
    updateVehicle(vehicle.id, { additionalCosts: updated });
    audio.playSubtleClick();
  };

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
      <div className="bg-white rounded-[24px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isAdmin ? "Back to Catalogue" : "Back to Stock"}</span>
          </button>
        </div>

        {/* Right: Dealership Profile & Stock State */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <div
              title="Stock withdrawal & catalogue status are managed exclusively by Nissan Japan Global Fleet Authority"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${vehicle.status === "WITHDRAWN"
                ? "bg-slate-900 text-white border-slate-900"
                : vehicle.status === "AVAILABLE"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : vehicle.status === "RESERVED"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : vehicle.status === "ALLOCATED"
                      ? "bg-blue-50 text-blue-800 border-blue-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${vehicle.status === "WITHDRAWN"
                  ? "bg-amber-400"
                  : vehicle.status === "AVAILABLE"
                    ? "bg-emerald-500"
                    : vehicle.status === "RESERVED"
                      ? "bg-amber-500"
                      : vehicle.status === "ALLOCATED"
                        ? "bg-blue-500"
                        : "bg-slate-400"
                  }`}
              />
              <span>
                {vehicle.status === "WITHDRAWN"
                  ? "Withdrawn (Nissan Japan Only)"
                  : vehicle.status === "AVAILABLE"
                    ? "Live in Catalogue"
                    : vehicle.status}
              </span>
            </div>
          )}

          {!isAdmin && currentDealer && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{currentDealer.legalTradingName}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-mono">{dealerZone}</span>
            </div>
          )}

          {vehicle.status === "AVAILABLE" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Available</span>
            </span>
          )}
          {vehicle.status === "DRAFT" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>Draft Staging</span>
            </span>
          )}
          {vehicle.status === "RESERVED" && (
            isHeldByCurrentDealer ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                <Lock className="w-3 h-3 text-amber-600" />
                <span>Your Active Reservation (18h left)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Reserved · Network Lock</span>
              </span>
            )
          )}
          {vehicle.status === "ALLOCATED" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <Ship className="w-3 h-3 text-sky-600" />
              <span>Allocated to Order</span>
            </span>
          )}
          {vehicle.status === "WITHDRAWN" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Withdrawn from Catalogue</span>
            </span>
          )}
          {vehicle.status === "SOLD" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <CheckCircle2 className="w-3 h-3 text-purple-600" />
              <span>Sold &amp; Handed Over</span>
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
      {/* 2. Main Workspace Grid: Vehicle Studio Showcase & Wholesale Landed Matrix */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* ───────────────────────────────────────────────────────── */}
        {/* LEFT COLUMN: Vehicle Showcase + Studio Photography        */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col h-full">
          {/* Main Studio Car Showcase Card */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative flex flex-col justify-between h-full">
            {/* Top Row: Auction Grade & Stock ID */}
            <div className="flex items-center justify-between relative z-20 pb-1">
              <div className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-[11px] font-semibold border border-slate-200 shadow-2xs flex items-center gap-1">
                <span className="text-amber-500">★</span>
                <span>Grade {vehicle.auctionGrade} / {vehicle.interiorGrade}</span>
              </div>

              <div className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-600 font-mono text-[11px] font-medium border border-slate-200 shadow-2xs">
                #{vehicle.stockId}
              </div>
            </div>

            {/* Car Canvas */}
            <div className="relative flex-1 min-h-[250px] sm:min-h-[280px] w-full flex items-center justify-center my-auto py-2">
              {/* Studio floor shadow */}
              <div className="absolute bottom-2 w-4/5 h-4 bg-black/10 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />

              {/* High-res Studio Cutout Car */}
              <img
                src={images[activeImageIdx] || images[0]}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full max-h-[260px] sm:max-h-[290px] select-none transition-all duration-200 relative z-10 object-contain filter drop-shadow-[0_8px_14px_rgba(0,0,0,0.10)]"
              />

              {/* Zero Emission Emblem (Right of Car) */}
              {isElectricOrHybrid && (
                <div className="absolute top-1 right-2 z-20 hidden sm:block">
                  <ZeroEmissionBadge />
                </div>
              )}
            </div>

            {/* Horizontal Angle Thumbnails Row */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 border-t border-slate-100 mt-auto">
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
                    className={`w-14 h-10 sm:w-16 sm:h-11 rounded-lg overflow-hidden p-0.5 transition-all cursor-pointer flex items-center justify-center bg-white shrink-0 ${isActive
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
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* RIGHT COLUMN: Wholesale Landed Schedule + Dealer Actions  */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="lg:col-span-5 flex flex-col h-full">
          {/* Card 1: WHOLESALE LANDED PRICE SCHEDULE */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between h-full space-y-4">
            <div className="space-y-3.5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  {isAdmin ? "WHOLESALE LANDED PRICE SCHEDULE" : "GUARANTEED WHOLESALE LANDED SCHEDULE"}
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                    ${totalBuyPriceNZD.toLocaleString()}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    NZD Total Buy Price
                  </span>
                </div>
                <div className="text-[11px] font-mono flex items-center gap-1.5 mt-0.5 text-slate-500">
                  <span>Guaranteed Base: ${basePriceNZD.toLocaleString()}</span>
                  <span>+</span>
                  {additionalCostsTotal > 0 ? (
                    <span className="text-rose-600 font-bold">Add. Costs: ${additionalCostsTotal.toLocaleString()}</span>
                  ) : (
                    <span className="text-emerald-700 font-semibold">Additional Costs = $0</span>
                  )}
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
                          className={`flex-1 py-2 px-1 rounded-lg text-center transition-all cursor-pointer ${isSelected
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
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-600 font-medium">FOB Acquisition Price:</span>
                    {isAdmin && !isEditingPrice && (
                      <button
                        type="button"
                        onClick={() => setIsEditingPrice(true)}
                        className="text-[10px] text-slate-400 hover:text-slate-900 underline font-medium cursor-pointer"
                      >
                        (Edit)
                      </button>
                    )}
                  </div>
                  {isAdmin && isEditingPrice ? (
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold text-slate-400">
                          ¥
                        </span>
                        <input
                          type="number"
                          step="10000"
                          value={fobInputJPY}
                          onChange={(e) => setFobInputJPY(Number(e.target.value))}
                          className="pl-5 pr-1.5 py-0.5 w-28 rounded border border-slate-300 bg-white font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSavePrice}
                        className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFobInputJPY(vehicle.fobPriceJPY);
                          setIsEditingPrice(false);
                        }}
                        className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="font-mono font-medium text-slate-900 text-right">
                      ¥{vehicle.fobPriceJPY.toLocaleString()}
                      <span className="text-slate-400 font-normal text-[11px] ml-1">
                        (~${landedPrice.fobNZD.toLocaleString()} NZD)
                      </span>
                    </span>
                  )}
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
                  </div>
                  <span className="font-mono font-medium text-slate-900 text-right">
                    ${landedPrice.programmeFeeNZD.toLocaleString()} NZD
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Total Buy Price Section */}
            <div className="space-y-3 mt-auto pt-2">
              {/* Total Buy Price / Fixed Profile Price */}
              <div className="py-2.5 px-3.5 flex items-center justify-between gap-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="text-xs text-slate-900 block font-bold">
                    Total Buy Price (Fixed Profile Price):
                  </strong>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Guaranteed landed total for {selectedZoneConfig.zoneName.split("-")[0]?.trim()}
                  </span>
                </div>
                <strong className="font-mono text-base sm:text-lg font-bold text-slate-950">
                  ${landedPrice.totalBuyPriceNZD.toLocaleString()} NZD
                </strong>
              </div>

              {/* Dealer: Commercial Margin & Exclusivity Procurement Action integrated into the Price Schedule Card */}
              {!isAdmin && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {/* Retail Guidance & Projected Margin Box */}
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                        Est. NZ Retail Guidance
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        ${retailEstimateNZD.toLocaleString()} NZD
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Projected Dealer Margin</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-800 text-xs">
                        +${projectedMarginNZD.toLocaleString()} ({marginPercentage}%)
                      </span>
                    </div>
                  </div>

                  {/* Primary Dealer Procurement Action Button */}
                  <div>
                    {isAvailable ? (
                      <div>
                        {getVehicleAction(vehicle) === "ALLOCATION" ? (
                          <button
                            type="button"
                            onClick={() => {
                              audio.playSubtleClick();
                              setIsAllocateModalOpen(true);
                            }}
                            className="w-full py-3.5 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs tracking-wide transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Ship className="w-4 h-4 text-emerald-400" />
                            <span>Direct Wholesale Allocation</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              audio.playSubtleClick();
                              setIsReserveModalOpen(true);
                            }}
                            className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 font-bold text-xs tracking-wide transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Lock className="w-4 h-4 text-slate-600" />
                            <span>Place 24-Hour Exclusivity Hold (Reserve)</span>
                          </button>
                        )}
                      </div>
                    ) : isHeldByCurrentDealer ? (
                      <div className="space-y-2">
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                          <span className="font-semibold flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Your Active Reservation (18h left)</span>
                          </span>
                          <span className="font-mono text-[10px] font-bold text-amber-800">24h Exclusivity Lock</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            setIsAllocateModalOpen(true);
                          }}
                          className="w-full py-3 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                        >
                          <Ship className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Confirm Allocation (Convert to Order)</span>
                        </button>
                      </div>
                    ) : (
                      <div className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs text-center flex items-center justify-center gap-2 border border-slate-200">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reserved Under 24h Exclusivity Lock by Network</span>
                      </div>
                    )}

                    {/* Trust Badges */}
                    <div className="flex items-center justify-center gap-2.5 text-[10px] text-slate-400 pt-2 flex-wrap">
                      <span>✓ Zero Initial Deposit</span>
                      <span>•</span>
                      <span>✓ 24h Price Guarantee</span>
                      <span>•</span>
                      <span>✓ JEVIC &amp; MR2A Included</span>
                    </div>

                    {/* Admin Status & Allocation Mode Assignment Controls */}
                    {isAdmin && (
                      <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3 mt-4 shadow-sm border border-slate-800">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white tracking-tight">Admin Assignment</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">NSC Authority</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1 font-medium">Dealer Action Mode:</label>
                            <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-800 p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  audio.playSubtleClick();
                                  updateVehicle(vehicle.id, { allocationMode: "RESERVE" });
                                }}
                                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                                  getVehicleAction(vehicle) === "RESERVE"
                                    ? "bg-white text-slate-950 shadow-xs"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                <Lock className="w-3 h-3" />
                                <span>Reserve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  audio.playSubtleClick();
                                  updateVehicle(vehicle.id, { allocationMode: "ALLOCATION" });
                                }}
                                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                                  getVehicleAction(vehicle) === "ALLOCATION"
                                    ? "bg-white text-slate-950 shadow-xs"
                                    : "text-slate-400 hover:text-white"
                                }`}
                              >
                                <Ship className="w-3 h-3 text-emerald-600" />
                                <span>Allocation</span>
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1 font-medium">Vehicle Status:</label>
                            <select
                              value={vehicle.status}
                              onChange={(e) => {
                                audio.playSubtleClick();
                                setVehicleStatus(vehicle.id, e.target.value as any, "Updated by Admin");
                              }}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1.5 px-2 text-xs font-mono text-white focus:outline-none cursor-pointer"
                            >
                              <option value="AVAILABLE">AVAILABLE</option>
                              <option value="RESERVED">RESERVED</option>
                              <option value="ALLOCATED">ALLOCATED</option>
                              <option value="WITHDRAWN">WITHDRAWN</option>
                              <option value="SOLD">SOLD</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. FULL-WIDTH WORKSPACE: Technical Specs vs Additional Costs */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* Full-Width Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setFullWidthTab("ADDITIONAL_COSTS");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${fullWidthTab === "ADDITIONAL_COSTS"
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
              }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Additional Costs Ledger</span>
            {additionalCostsTotal > 0 ? (
              <span className="ml-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-rose-500 text-white font-bold">
                +${additionalCostsTotal.toLocaleString()}
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                $0
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setFullWidthTab("SPECS");
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${fullWidthTab === "SPECS"
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
              }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Japanese Export Verification &amp; Technical Specs</span>
          </button>
        </div>

        {/* TAB 1: ADDITIONAL COSTS LEDGER */}
        {fullWidthTab === "ADDITIONAL_COSTS" && (
          <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5 animate-in fade-in duration-200">
            {/* Header with Title & Add Cost Button for Admin */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Additional Costs Ledger
                </h2>
                <p className="text-xs text-slate-500">
                  Itemized administrative adjustments, inspection surcharges, and landing fee reconciliation.
                </p>
              </div>

              {/* Admin Action: Add Additional Cost */}
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setIsAddCostModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-auto active:scale-[0.98]"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>+ Add Additional Cost</span>
                </button>
              )}
            </div>

            {/* 4-Card Executive Pricing Summary Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Effective Region
                </span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                  {selectedZoneConfig.zoneName.split("-")[0]?.trim()}
                </span>
                <span className="font-mono text-[10px] text-slate-500 block">
                  Pricing Zone: {activeZoneId}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Fixed Cost Profile
                </span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm block font-mono">
                  ${basePriceNZD.toLocaleString()} NZD
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Guaranteed Profile</span>
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Additional Cost
                </span>
                <span className={`font-mono font-bold text-xs sm:text-sm block ${additionalCostsTotal > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  {additionalCostsTotal > 0 ? `+${additionalCostsTotal.toLocaleString()} NZD` : "additional cost = 0"}
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  {additionalCosts.length > 0 ? `${additionalCosts.length} items attached` : "No surcharges added"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0A0A0A] text-white space-y-0.5 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Total Buy Price
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm block tracking-tight text-white">
                  ${totalBuyPriceNZD.toLocaleString()} NZD
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  Fixed Landed + Additional Costs
                </span>
              </div>
            </div>

            {/* Additional Costs Ledger Records */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Additional Costs Records:
                  </h3>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-500">
                  Total Additional Costs: ${additionalCostsTotal.toLocaleString()} NZD
                </span>
              </div>

              {additionalCosts.length === 0 ? (
                /* When not admin added -> additional cost = 0 */
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      additional cost = 0
                    </span>
                    <p className="text-xs text-slate-500 max-w-lg mx-auto mt-0.5">
                      No additional costs have been attached by the Autohub Administrator. All inspection, biosecurity, and standard delivery fees remain strictly guaranteed within the Total Buy Price.
                    </p>
                  </div>
                </div>
              ) : (
                /* When admin has attached additional costs */
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4 font-bold">Category</th>
                        <th className="py-3 px-4 font-bold">Description</th>
                        <th className="py-3 px-4 font-bold">Notes / Evidence</th>
                        <th className="py-3 px-4 font-bold">Status</th>
                        <th className="py-3 px-4 font-bold text-right">Amount (NZD)</th>
                        {isAdmin && <th className="py-3 px-4 font-bold text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {additionalCosts.map((cost) => (
                        <tr key={cost.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {cost.type.replace(/_/g, " ")}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {cost.description}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {cost.notes || "Official Inspection Item"}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {cost.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            +${cost.amountNZD.toLocaleString()}
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleRemoveAdditionalCost(cost.id)}
                                className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Remove cost item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan={isAdmin ? 4 : 4} className="py-3 px-4 text-slate-900">
                          Total Buy Price (Fixed Landed Base ${basePriceNZD.toLocaleString()} + Additional Costs ${additionalCostsTotal.toLocaleString()}):
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm text-slate-900">
                          ${totalBuyPriceNZD.toLocaleString()} NZD
                        </td>
                        {isAdmin && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TECHNICAL SPECIFICATIONS & JAPANESE VERIFICATION */}
        {fullWidthTab === "SPECS" && (
          <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Japanese Export Verification &amp; Technical Specifications
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Certified USS/JAA Japanese export documentation, digital odometer verification, and mechanical specification dossier.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setActiveDocPreview({
                      title: "JEVIC Pre-Shipment Inspection Certificate",
                      type: "JEVIC",
                      refNumber: `JEVIC-NZ-${vehicle.vinChassis.slice(-6)}`,
                      details: `Certified Mileage: ${vehicle.odometerKm.toLocaleString()} km · Digital odometer hash verified 100% · Radiation test: Passed (0.08 µSv/h).`,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>JEVIC Certified</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setActiveDocPreview({
                      title: "USS Tokyo Official Auction Sheet",
                      type: "AUCTION_SHEET",
                      refNumber: `USS-TK-${vehicle.vinChassis.slice(-6)}`,
                      details: `Overall Auction Grade: ${vehicle.auctionGrade} · Interior: ${vehicle.interiorGrade || "A"} · Exterior: ${vehicle.exteriorGrade || "A"} · USS Tokyo pre-export inspection certified.`,
                    });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Auction Sheet (PDF)</span>
                </button>
              </div>
            </div>

            {/* 4-Column Technical Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* Card 1: Japanese Provenance & Identification */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Provenance &amp; Identification
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Chassis / VIN:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{vehicle.vinChassis}</span>
                      <button
                        type="button"
                        onClick={handleCopyVin}
                        title="Copy VIN"
                        className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {copiedVin ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Make &amp; Model:</span>
                    <span className="font-bold text-slate-900">{vehicle.make || "Nissan"} {vehicle.model}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Variant / Trim:</span>
                    <span className="font-semibold text-slate-800">{vehicle.grade}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Stock Reference:</span>
                    <span className="font-mono font-bold text-slate-900">{vehicle.stockReference || `USS-JAA-${vehicle.stockId.slice(-4)}`}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Powertrain & Mechanical */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Powertrain &amp; Mechanical
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Powertrain:</span>
                    <span className="font-semibold text-slate-900">{vehicle.fuelType}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Transmission:</span>
                    <span className="font-medium text-slate-800">{vehicle.transmission}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Exterior Colour:</span>
                    <span className="font-medium text-slate-800">{vehicle.color || "Factory Original"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Model Year:</span>
                    <span className="font-mono font-bold text-slate-900">{vehicle.year}</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Compliance & Odometer */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Compliance &amp; Odometer
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">JEVIC Odometer:</span>
                    <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{vehicle.odometerKm.toLocaleString()} {vehicle.odometerUnit || "km"}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Price Basis:</span>
                    <span className="font-mono font-bold text-slate-900">{vehicle.purchasePriceBasis || "FOB"} ({vehicle.currency || "JPY"})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Listing Status:</span>
                    <span className="font-mono font-bold text-slate-900 text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200">
                      {vehicle.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Certified Date:</span>
                    <span className="font-mono text-slate-700">{vehicle.createdAt || vehicle.inspectionDate || "2026-10-24"}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Condition Log & Japanese Notes */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Condition &amp; Inspection Log
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Auction Grade:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <span className="text-amber-500 font-bold">★</span>
                      <span>{vehicle.auctionGrade} / {vehicle.interiorGrade || "A"}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-0.5">Overall Condition:</span>
                    <p className="text-[11px] text-slate-700 leading-snug font-normal">
                      {vehicle.overallCondition || vehicle.conditionSummary || "Zero panel damage. Verified Japanese one-owner."}
                    </p>
                  </div>

                  {vehicle.knownDefects && vehicle.knownDefects.length > 0 && (
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">Reported Defects:</span>
                      <div className="flex flex-wrap gap-1">
                        {vehicle.knownDefects.map((defect, dIdx) => (
                          <span
                            key={dIdx}
                            className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200"
                          >
                            • {defect}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Atomic Exclusivity Reservation Modal                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isReserveModalOpen && (
        <AtomicReservationModal
          vehicle={vehicle}
          onClose={() => setIsReserveModalOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. Direct Vehicle Allocation Modal                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isAllocateModalOpen && (
        <DirectAllocationModal
          vehicle={vehicle}
          onClose={() => setIsAllocateModalOpen(false)}
          onSuccess={() => {
            setIsAllocateModalOpen(false);
            router.push("/dealer/orders");
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. Add Vehicle Additional Cost Modal (Admin Only)           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isAddCostModalOpen && (
        <AddVehicleAdditionalCostModal
          vehicle={vehicle}
          isOpen={isAddCostModalOpen}
          onClose={() => setIsAddCostModalOpen(false)}
          onAddCost={handleAddAdditionalCost}
        />
      )}
    </div>
  );
}
