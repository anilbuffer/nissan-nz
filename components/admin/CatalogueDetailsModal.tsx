"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, VehicleSupportingDoc, AdditionalCostItem } from "@/lib/types";
import { calculateLandedPrice, OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { useAuth } from "@/lib/auth-context";
import { useProgramme } from "@/lib/programme-context";
import VehicleSpecificationsTabs from "@/components/dealer/VehicleSpecificationsTabs";
import {
  X,
  Car,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Calendar,
  Gauge,
  FileCheck2,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Layers,
  ChevronRight,
  TrendingUp,
  Star,
  Ship,
  AlertCircle,
  Eye,
  Download,
  Building2,
  Wrench,
  PlusCircle,
  Trash2,
  Paperclip,
  AlertTriangle,
} from "lucide-react";

interface CatalogueDetailsModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToInventory?: () => void;
}

export default function CatalogueDetailsModal({
  vehicle,
  onClose,
  onNavigateToReservations,
  onNavigateToInventory,
}: CatalogueDetailsModalProps) {
  const router = useRouter();
  const { currentUser, currentDealer } = useAuth();
  const {
    vehicles,
    respondToVehicleAdditionalCost,
    removeVehicleAdditionalCost,
  } = useProgramme();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<"ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4" | "ZONE_5">(
    (currentDealer?.pricingZoneId as any) || "ZONE_1"
  );
  const [activeDocPreview, setActiveDocPreview] = useState<{
    name: string;
    type: string;
    date: string;
    size: string;
  } | null>(null);

  if (!vehicle) return null;

  // Live vehicle from context (to reflect real-time additional costs & status changes)
  const liveVehicle = vehicles.find((v) => v.id === vehicle.id) || vehicle;

  const isAdmin = currentUser?.role === "AUTOHUB_ADMIN";
  const images = liveVehicle.images && liveVehicle.images.length > 0
    ? liveVehicle.images
    : ["/images/cars/kicks.png"];

  const landedPrice = calculateLandedPrice(liveVehicle.fobPriceJPY, selectedZone);
  const activeImage = images[activeImageIdx] || images[0];
  const selectedZoneConfig = OFFICIAL_PRICING_ZONES[selectedZone] || OFFICIAL_PRICING_ZONES.ZONE_1;

  const additionalCosts: AdditionalCostItem[] = liveVehicle.additionalCosts || [];
  const approvedCosts = additionalCosts.filter((c) => c.status === "APPROVED");
  const approvedCostsTotal = approvedCosts.reduce((sum, c) => sum + c.amountNZD, 0);
  const pendingCosts = additionalCosts.filter((c) => c.status === "PENDING_DEALER_APPROVAL");
  const pendingForCurrentDealer = pendingCosts.filter(
    (c) => !c.dealerId || c.dealerId === currentDealer?.id || liveVehicle.reservedByDealerId === currentDealer?.id
  );
  const allCostsTotal = additionalCosts.reduce((sum, c) => sum + c.amountNZD, 0);
  const totalBuyPriceWithCosts = landedPrice.totalBuyPriceNZD + (isAdmin ? allCostsTotal : approvedCostsTotal);

  const handleRemoveCost = (costId: string) => {
    removeVehicleAdditionalCost(liveVehicle.id, costId);
    audio.playSubtleClick();
    setActionToast("Additional cost item removed.");
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleApproveCost = (costId: string) => {
    audio.playSuccessChime();
    respondToVehicleAdditionalCost(liveVehicle.id, costId, "APPROVED", currentDealer?.id);
    setActionToast("Additional cost approved and applied to landed buy price.");
    setTimeout(() => setActionToast(null), 3500);
  };

  const handleDeclineCost = (costId: string) => {
    audio.playSubtleClick();
    respondToVehicleAdditionalCost(liveVehicle.id, costId, "DECLINED", currentDealer?.id);
    setActionToast("Additional cost proposal declined.");
    setTimeout(() => setActionToast(null), 3500);
  };

  const isAvailable = vehicle.status === "AVAILABLE";
  const isReserved = vehicle.status === "RESERVED";
  const isAllocated = vehicle.status === "ALLOCATED";
  const isSold = vehicle.status === "SOLD" || vehicle.status === "BUYED";
  const isWithdrawn = vehicle.status === "WITHDRAWN";

  const vehicleDocs = useMemo(() => {
    const docs = [...(vehicle?.supportingDocuments || [])];
    if (vehicle?.conditionReportName && !docs.some((d) => d.name === vehicle.conditionReportName)) {
      docs.unshift({
        name: vehicle.conditionReportName,
        type: "AUCTION_SHEET",
        url: vehicle.conditionReportUrl || "https://example.com/reports/condition.pdf",
        size: "2.4 MB",
        uploadedAt: vehicle.createdAt || "2026-10-22",
      });
    }
    if (docs.length === 0) {
      docs.push(
        {
          name: "USS_Tokyo_Official_Auction_Sheet.pdf",
          type: "AUCTION_SHEET",
          url: "https://example.com/reports/uss.pdf",
          size: "2.4 MB",
          uploadedAt: "2026-10-22",
        },
        {
          name: "JEVIC_Digital_Odometer_Certificate.pdf",
          type: "JEVIC_CERTIFICATE",
          url: "https://example.com/reports/jevic.pdf",
          size: "1.1 MB",
          uploadedAt: "2026-10-22",
        }
      );
    }
    return docs;
  }, [vehicle]);

  const handleCopyVin = () => {
    navigator.clipboard.writeText(vehicle.vinChassis);
    audio.playSubtleClick();
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const handleOpenFullPage = () => {
    audio.playSubtleClick();
    onClose();
    if (isAdmin) {
      router.push(`/admin/vehicles/${vehicle.id}`);
    } else {
      router.push(`/dealer/vehicles/${vehicle.id}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalogue-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
        {/* ─────────────────────────────────────────────────────────── */}
        {/* 1. Header Card (Symmetric to /admin/vehicles/VEH_023)         */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="p-6 sm:p-7 bg-white text-slate-900 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
              <Car className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                  #{vehicle.stockId}
                </span>

                {/* Status Badges - Informative Colors */}
                {isAvailable && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{isAdmin ? "Available to NZ Franchise" : "Available for Reservation"}</span>
                  </span>
                )}
                {isReserved && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-300 shadow-2xs">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Dealer 24h Exclusivity Hold</span>
                  </span>
                )}
                {isAllocated && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-sky-50 text-sky-700 border-sky-200 shadow-2xs">
                    <Ship className="w-3 h-3 text-sky-600" />
                    <span>Allocated &amp; Shipping Secured</span>
                  </span>
                )}
                {isWithdrawn && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-rose-50 text-rose-700 border-rose-200 shadow-2xs">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Withdrawn from Catalogue</span>
                  </span>
                )}
                {isSold && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                    <span>Sold &amp; Wholesale Settled</span>
                  </span>
                )}
              </div>

              <h1 id="catalogue-details-title" className="text-base sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.grade ? `(${vehicle.grade})` : ""}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenFullPage}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300 text-xs"
              title="Open dedicated full page view"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Dossier Page</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Close details modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* 2. Top Two Cards Strip: 4 KPI Metrics Strip                  */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-6 sm:p-7 pb-0 bg-white shrink-0">
          {/* 1. ODOMETER (JEVIC) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              ODOMETER (JEVIC)
            </span>
            <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
              {vehicle.odometerKm.toLocaleString()} {vehicle.odometerUnit || "km"}
            </div>
          </div>

          {/* 2. AUCTION & INSPECTION GRADE */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              AUCTION &amp; INSPECTION GRADE
            </span>
            <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
              ★ {vehicle.auctionGrade || "4.5"}
            </div>
          </div>

          {/* 3. Role-based Price */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              {isAdmin ? `ACQUISITION BASELINE (${vehicle.currency || "JPY"})` : "TOTAL BUY PRICE (NZD)"}
            </span>
            <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
              {isAdmin ? `¥${vehicle.fobPriceJPY.toLocaleString()}` : `$${landedPrice.totalBuyPriceNZD.toLocaleString()} NZD`}
            </div>
          </div>

          {/* 4. YARD STAGING */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              YARD STAGING
            </span>
            <div className="text-base sm:text-xl font-bold text-slate-900 truncate tracking-tight">
              {vehicle.location || "Yokohama Export Terminal"}
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* ─────────────────────────────────────────────────────────── */}
          {/* 3. ROW 1: Studio Showcase (Left 7) vs Commercial Panel (Right 5) */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column (7 cols): Studio Image Showcase */}
            <div className="lg:col-span-7 h-full flex flex-col">
              <div className="bg-white rounded-[16px] p-6 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between space-y-4">
                <div>
                  <div className="relative w-full h-72 sm:h-84 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-200/50 border border-slate-200/80 p-6 flex items-center justify-center overflow-hidden group">
                    <div className="absolute bottom-4 w-4/5 h-6 bg-black/15 rounded-[50%] blur-lg pointer-events-none transform scale-y-50" />
                    <img
                      src={activeImage}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_16px_20px_rgba(0,0,0,0.18)] select-none transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Auction Grade Pill */}
                    <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-mono font-bold text-slate-800 border border-slate-200 shadow-soft flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>
                        Auction Grade {vehicle.auctionGrade || "4.5"} · Int {vehicle.interiorGrade || "A"} · Ext {vehicle.exteriorGrade || "A"}
                      </span>
                    </div>

                    {/* Yard Location Pill */}
                    <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/90 font-mono text-xs flex items-center gap-1.5 shadow-soft">
                      <MapPin className="w-3.5 h-3.5 text-slate-600" />
                      <span>{vehicle.location || "Yokohama Export Terminal"}</span>
                    </div>
                  </div>

                  {/* Thumbnail Gallery Strip */}
                  {images.length > 1 && (
                    <div className="space-y-1.5 mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                        Multi-Angle Gallery ({images.length} Perspectives)
                      </span>
                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
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
                              className={`w-20 h-14 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 flex items-center justify-center ${
                                isActive
                                  ? "border-slate-900 ring-2 ring-slate-900/10 bg-white shadow-2xs"
                                  : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                              }`}
                            >
                              <img src={img} alt="Vehicle Perspective" className="w-full h-full object-contain" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pinned Studio Badge Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Studio Photographic Inspection</span>
                  <span className="text-slate-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Asset</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Commercial & Landed Pricing Panel */}
            <div className="lg:col-span-5 h-full flex flex-col">
              <div className="bg-white rounded-[16px] p-6 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Pricing Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C3002F]" />
                      {isAdmin ? `Japanese Acquisition Pricing (${vehicle.purchasePriceBasis || "FOB"})` : `Wholesale Landed Price (${selectedZone})`}
                    </span>

                    <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                      {isAdmin ? `¥${vehicle.fobPriceJPY.toLocaleString()}` : `$${landedPrice.totalBuyPriceNZD.toLocaleString()}`}
                      <span className="text-xs font-sans text-slate-400 font-semibold ml-2">
                        {isAdmin ? `${vehicle.currency || "JPY"} Baseline` : "NZD Total Buy Price"}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {isAdmin
                        ? `Raw Japan auction baseline prior to ocean shipping (~$${landedPrice.fobNZD.toLocaleString()} NZD equiv.)`
                        : "Guaranteed landed wholesale price delivered directly to your authorized franchise depot."}
                    </p>
                  </div>

                  {/* 5-Zone Wholesale Landed Matrix Selector */}
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
                      {(["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"] as const).map((zid) => {
                        const isSelected = selectedZone === zid;
                        const zPrice = calculateLandedPrice(vehicle.fobPriceJPY, zid);
                        return (
                          <button
                            key={zid}
                            type="button"
                            onClick={() => {
                              audio.playSubtleClick();
                              setSelectedZone(zid);
                            }}
                            className={`flex-1 py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-white text-slate-900 font-bold shadow-2xs ring-1 ring-slate-300"
                                : "text-slate-600 hover:text-slate-900 font-medium"
                            }`}
                          >
                            <span className="block text-[11px] font-bold leading-tight">{zid.replace("ZONE_", "Z")}</span>
                            <span className="block text-[10px] font-mono font-bold text-slate-900 leading-tight mt-0.5">
                              ${Math.round(zPrice.totalBuyPriceNZD / 1000)}k
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Breakdown Line Items */}
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <span>Pricing Component</span>
                      <span>Commercial Allocation</span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Ocean Freight &amp; Port Handling:</span>
                      <span className="font-mono font-medium text-slate-900">${landedPrice.oceanFreightNZD.toLocaleString()} NZD</span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Customs Processing &amp; NZ GST (15% CIF):</span>
                      <span className="font-mono font-medium text-slate-900">
                        ${(landedPrice.customsProcessingNZD + landedPrice.gstNZD).toLocaleString()} NZD
                      </span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">MR2A Compliance &amp; Inspection:</span>
                      <span className="font-mono font-medium text-slate-900">${landedPrice.complianceInspectionNZD.toLocaleString()} NZD</span>
                    </div>
                    <div className="py-1.5 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Domestic Delivery ({selectedZone.replace("ZONE_", "Zone ")}):</span>
                      <span className="font-mono font-medium text-slate-900">${landedPrice.zoneDeliveryNZD.toLocaleString()} NZD</span>
                    </div>
                    {approvedCostsTotal > 0 && (
                      <div className="py-1.5 flex items-center justify-between text-emerald-700 font-semibold bg-emerald-50/70 px-2 rounded-lg">
                        <span>Approved Additional Costs:</span>
                        <span className="font-mono">+${approvedCostsTotal.toLocaleString()} NZD</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Total Buy Price Section */}
                <div className="space-y-3 mt-auto pt-2">
                  <div className="py-2.5 px-3.5 flex items-center justify-between gap-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <strong className="text-xs text-slate-900 block font-bold">
                        Total Buy Price ({selectedZone.replace("ZONE_", "Zone ")}):
                      </strong>
                      <span className="text-[10px] text-slate-400 font-normal">
                        Guaranteed landed total for {selectedZoneConfig.zoneName.split("-")[0]?.trim()}
                      </span>
                    </div>
                    <strong className="font-mono text-base sm:text-lg font-bold text-slate-950">
                      ${totalBuyPriceWithCosts.toLocaleString()} NZD
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenFullPage}
                    className="w-full py-3 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <ExternalLink className="w-4 h-4 text-white/90" />
                    <span>Open Full Inspection &amp; Order Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 4. Inspection Condition Dossier & Known Defects             */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#C3002F]" />
                <span>Inspection Condition Dossier &amp; Known Defects</span>
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                  ★ Grade {vehicle.auctionGrade || "4.5"} · Int {vehicle.interiorGrade || "A"} · Ext {vehicle.exteriorGrade || "A"}
                </span>
                <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                  MR2A Pre-Verified
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-800">
                <span>Overall Vehicle Condition:</span>
                <span className="text-slate-800 font-bold text-xs">
                  {vehicle.overallCondition || `★ ${vehicle.auctionGrade} - Clean Japanese Pre-Export Condition`}
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                {vehicle.conditionSummary ||
                  "Showroom demonstration grade. Zero structural panel damage detected. Fully compliant for NZTA MR2A border entry with genuine Japanese documentation."}
              </p>
            </div>

            {vehicle.knownDefects && vehicle.knownDefects.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 block mb-3">
                  Inspector Recorded Markings &amp; Defect Items:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {vehicle.knownDefects.map((defect, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 text-xs text-slate-400 font-normal"
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
                      <span className="break-words leading-snug">{defect}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Integrated JEVIC Verification Bar */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-800">JEVIC Pre-Export Verification</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-mono text-[10px] font-bold border border-slate-200">
                PASSED 100%
              </span>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 4b. Attached Additional Compliance & Repair Costs           */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#C3002F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Attached Additional Compliance &amp; Repair Costs
                </h3>
                {additionalCosts.length > 0 && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                    {additionalCosts.length} {additionalCosts.length === 1 ? "Item" : "Items"}
                  </span>
                )}
              </div>
            </div>

            {actionToast && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionToast}</span>
              </div>
            )}

            {/* Dealer Action Required Banner */}
            {!isAdmin && pendingForCurrentDealer.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block font-bold">
                      {pendingForCurrentDealer.length} Additional Cost Proposal{pendingForCurrentDealer.length > 1 ? "s" : ""} Awaiting Dealership Sign-Off
                    </strong>
                    <p className="text-amber-700 text-[11px] mt-0.5">
                      Proposed by central operations. Review the required defect repair or certification work and approve or decline.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {additionalCosts.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center">
                <span className="text-xs font-bold text-slate-500 block">
                  No Additional Costs Attached
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  This unit has zero supplementary non-standard compliance repairs or decontamination fees.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 font-bold">Category</th>
                      <th className="py-3 px-4 font-bold">Description</th>
                      <th className="py-3 px-4 font-bold">Target Dealer</th>
                      <th className="py-3 px-4 font-bold">Notes / Evidence</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Amount (NZD)</th>
                      <th className="py-3 px-4 font-bold text-right">{isAdmin ? "Action" : "Review Decision"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {additionalCosts.map((cost) => {
                      const isPending = cost.status === "PENDING_DEALER_APPROVAL";
                      const isApproved = cost.status === "APPROVED";
                      const canAct = !isAdmin && isPending && (!cost.dealerId || cost.dealerId === currentDealer?.id || liveVehicle.reservedByDealerId === currentDealer?.id);

                      return (
                        <tr key={cost.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {cost.type.replace(/_/g, " ")}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{cost.description}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[130px]">{cost.dealerName || "Allocated Dealer"}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-[11px]">
                            <div className="font-mono text-slate-600 truncate max-w-xs">
                              {cost.notes || "Official Dossier Remediation"}
                            </div>
                            {cost.evidenceDocumentUrl && (
                              <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200">
                                <Paperclip className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                <span className="truncate max-w-[140px]">{cost.evidenceDocumentUrl}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 w-fit">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>{isAdmin ? "Awaiting Dealer Review" : "Pending Approval"}</span>
                              </span>
                            ) : isApproved ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 w-fit">
                                <X className="w-3.5 h-3.5 text-rose-500" />
                                <span>Declined</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            +${cost.amountNZD.toLocaleString()} NZD
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleRemoveCost(cost.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Remove cost item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : canAct ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleApproveCost(cost.id)}
                                  className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeclineCost(cost.id)}
                                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Decline</span>
                                </button>
                              </div>
                            ) : isApproved ? (
                              <span className="text-[11px] font-semibold text-emerald-700">Applied</span>
                            ) : isPending ? (
                              <span className="text-[11px] text-slate-400">Targeted to other dealer</span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Declined</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={5} className="py-3 px-4 text-slate-900">
                        {isAdmin ? "Total Proposed Additional Costs:" : "Approved Additional Costs (Applied):"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-sm text-slate-900">
                        +${(isAdmin ? allCostsTotal : approvedCostsTotal).toLocaleString()} NZD
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 5. Vehicle Specifications & Listing Tabs                   */}
          {/* ─────────────────────────────────────────────────────────── */}
          <VehicleSpecificationsTabs
            vehicle={liveVehicle}
            isAdmin={isAdmin}
            copiedVin={copiedVin}
            onCopyVin={handleCopyVin}
          />

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 6. Supporting Documents Vault                               */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>Supporting Documents</span>
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono border border-slate-200 shrink-0 self-start sm:self-auto">
                {vehicleDocs.length} {vehicleDocs.length === 1 ? "Document" : "Documents"} Uploaded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {vehicleDocs.map((doc: VehicleSupportingDoc, idx: number) => (
                <div
                  key={doc.name + idx}
                  onClick={() => {
                    audio.playSubtleClick();
                    setActiveDocPreview({
                      name: doc.name,
                      type: doc.type.replace(/_/g, " "),
                      date: doc.uploadedAt || vehicle.createdAt || "2026-10-22",
                      size: doc.size || "1.2 MB",
                    });
                  }}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer group flex items-start justify-between bg-white shadow-2xs"
                >
                  <div className="space-y-1.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                      <span
                        className="font-bold text-xs text-slate-900 group-hover:text-slate-600 transition-colors truncate block"
                        title={doc.name}
                      >
                        {doc.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {doc.type.replace(/_/g, " ")} · {doc.size || "PDF Document"}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-medium block">
                      Uploaded with Vehicle ({doc.uploadedAt || vehicle.createdAt})
                    </span>
                  </div>
                  <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>

            {/* Pinned Cryptographic Status Footer */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Cryptographic Export Register</span>
              <span className="text-slate-700 font-bold">SHA-256 Verified</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* Footer Actions                                              */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {vehicle.status === "RESERVED" ? (
              <span className="text-amber-800 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Reserved by Franchise Dealer · 24h Exclusivity Lock Active</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Ready for wholesale reservation across all 5 New Zealand dealer zones</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {vehicle.status === "RESERVED" && onNavigateToReservations && (
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  onClose();
                  onNavigateToReservations();
                }}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Manage Hold in Queue</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenFullPage}
              className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Dedicated Page</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Official Verified Intake Document Preview Modal */}
        {activeDocPreview && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Official Intake Document Verification</h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Nissan Global Export Archive · Stock #{vehicle.stockId}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDocPreview(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-slate-400">Document File:</span>
                  <strong className="text-slate-800 text-right font-mono truncate">{activeDocPreview.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Classification:</span>
                  <span className="font-mono font-bold text-slate-800">{activeDocPreview.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recorded Size:</span>
                  <span className="font-mono text-slate-700">{activeDocPreview.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Intake Timestamp:</span>
                  <span className="font-mono text-slate-700">{activeDocPreview.date}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Validation Status:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                    AUTHENTICATED (DIGITAL SEAL)
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveDocPreview(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
