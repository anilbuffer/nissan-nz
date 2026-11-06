"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Vehicle, LandedPriceBreakdown, ZoneId, VehicleSupportingDoc, AdditionalCostItem } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { calculateEstimatedLandedAB, JPY_TO_NZD_EXCHANGE_RATE } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import AtomicReservationModal from "./AtomicReservationModal";
import VehicleSpecificationsTabs from "./VehicleSpecificationsTabs";
import VehicleStatsCards from "@/components/common/VehicleStatsCards";
import VehicleShowcaseCard from "@/components/common/VehicleShowcaseCard";
import CommercialLandedPricingCard from "./CommercialLandedPricingCard";
import { getModelAngleImages, getAngleLabel } from "@/lib/vehicle-media";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  ShieldCheck,
  Star,
  Building2,
  Ship,
  DollarSign,
  Trash2,
  Wrench,
  PlusCircle,
  X,
  Paperclip,
  FileText,
  Eye,
  Download,
  FileCheck2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Edit3,
  Calendar,
  Gauge,
  Sparkles,
  XCircle,
} from "lucide-react";

interface FullPageVehicleDetailProps {
  vehicleId?: string;
  vehicleData?: Vehicle;
  onBack?: () => void;
  isAdmin?: boolean;
  isProgramme?: boolean;
  backLabel?: string;
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
  isAdmin: isAdminProp,
  isProgramme: isProgrammeProp,
  backLabel,
}: FullPageVehicleDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    vehicles,
    reserveVehicle: atomicReserve,
    confirmAllocation,
    releaseHold,
    updateVehicle,
    setVehicleStatus,
    pricingConfig,
    reservations,
    rejectReservation,
    cancelReservation,
    dealers,
    respondToVehicleAdditionalCost,
    removeVehicleAdditionalCost,
  } = useProgramme();
  const { currentDealer, currentUser } = useAuth();

  // Determine role perspective strictly: Programme vs Admin vs Dealer
  const isDealerContext = typeof pathname === "string" && pathname.startsWith("/dealer");
  const isAdminContext = typeof pathname === "string" && pathname.startsWith("/admin");
  const isProgrammeContext =
    isProgrammeProp !== undefined
      ? isProgrammeProp
      : (typeof pathname === "string" && pathname.startsWith("/programme")) ||
        currentUser?.role === "READONLY_PROGRAMME_USER";

  const isAdmin =
    isAdminProp !== undefined
      ? isAdminProp
      : !isProgrammeContext && (isAdminContext || (currentUser?.role === "AUTOHUB_ADMIN" && !isDealerContext));

  const isDealer = !isProgrammeContext && (currentUser?.role === "DEALER_USER" || currentUser?.role === "DEALER_ADMIN");
  const dealerZone: ZoneId = (currentDealer?.pricingZoneId as ZoneId) || "ZONE_1";

  // Find vehicle from live programme context or fallback to mock data
  const rawVehicle =
    vehicles.find((v) => v.id === vehicleId || v.stockId === vehicleId || (vehicleData && (v.id === vehicleData.id || v.stockId === vehicleData.stockId))) ||
    vehicleData ||
    MOCK_VEHICLES.find((m) => m.id === vehicleId || m.stockId === vehicleId) ||
    vehicles[0] ||
    MOCK_VEHICLES[0];

  // Guarantee studio photos from user uploads or fallback cutouts
  const mockMatch = MOCK_VEHICLES.find((m) => m.id === rawVehicle?.id);
  const vehicle: Vehicle = useMemo(() => {
    if (!rawVehicle) return MOCK_VEHICLES[0];
    const defaultImages =
      rawVehicle.images && rawVehicle.images.length > 0
        ? rawVehicle.images
        : mockMatch?.images && mockMatch.images.length > 0
          ? mockMatch.images
          : ["/images/cars/dayz.png"];

    return {
      ...rawVehicle,
      images: defaultImages,
      overallCondition:
        rawVehicle.overallCondition ||
        rawVehicle.conditionSummary ||
        `★ ${rawVehicle.auctionGrade || "4.5"} - Clean Japanese Pre-Export Condition`,
      currency: rawVehicle.currency || "JPY",
      purchasePriceBasis: rawVehicle.purchasePriceBasis || "FOB",
      stockReference: rawVehicle.stockReference || `USS-JAA-${rawVehicle.stockId.slice(-4)}`,
      conditionReportName: rawVehicle.conditionReportName || "USS_Tokyo_Official_Auction_Sheet.pdf",
      createdAt: rawVehicle.createdAt || rawVehicle.inspectionDate || "2026-10-23",
      updatedAt: rawVehicle.updatedAt || "2026-10-24",
      knownDefects:
        rawVehicle.knownDefects && rawVehicle.knownDefects.length > 0
          ? rawVehicle.knownDefects
          : ["Clean pre-export inspection pass verified"],
    };
  }, [rawVehicle, mockMatch]);

  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  // Admin Price Editing State
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [fobInputJPY, setFobInputJPY] = useState(vehicle.fobPriceJPY);

  // Document Inspection State
  const [activeDocPreview, setActiveDocPreview] = useState<{
    name: string;
    type: string;
    date: string;
    size?: string;
  } | null>(null);
  const [docDownloadToast, setDocDownloadToast] = useState<string | null>(null);

  // Admin Reservation Confirmation & Decline Modal States
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");

  // Synchronize FOB input when vehicle FOB changes
  React.useEffect(() => {
    setFobInputJPY(vehicle.fobPriceJPY);
  }, [vehicle.fobPriceJPY]);

  // Supporting Documents attached during Add Vehicle intake
  const vehicleDocs: VehicleSupportingDoc[] = useMemo(() => {
    const list: VehicleSupportingDoc[] = [];

    if (vehicle.supportingDocuments && vehicle.supportingDocuments.length > 0) {
      list.push(...vehicle.supportingDocuments);
    }

    if (vehicle.conditionReportName && !list.some((d) => d.name === vehicle.conditionReportName)) {
      list.unshift({
        name: vehicle.conditionReportName,
        type: "AUCTION_SHEET",
        url: vehicle.conditionReportUrl || "https://example.com/reports/condition.pdf",
        size: "2.4 MB",
        uploadedAt: vehicle.createdAt || "2026-10-22",
      });
    }

    if (list.length === 0) {
      list.push(
        {
          name: "USS_Tokyo_Official_Auction_Sheet.pdf",
          type: "AUCTION_SHEET",
          url: "https://example.com/reports/uss_sheet.pdf",
          size: "2.4 MB",
          uploadedAt: vehicle.createdAt || "2026-10-22",
        },
        {
          name: "JEVIC_Digital_Odometer_Certificate.pdf",
          type: "JEVIC_CERTIFICATE",
          url: "https://example.com/reports/jevic_pass.pdf",
          size: "1.1 MB",
          uploadedAt: vehicle.createdAt || "2026-10-22",
        },
        {
          name: "NZTA_MR2A_Entry_Dossier.pdf",
          type: "MR2A_DOSSIER",
          url: "https://example.com/reports/mr2a_pass.pdf",
          size: "1.8 MB",
          uploadedAt: vehicle.createdAt || "2026-10-22",
        }
      );
    }

    return list;
  }, [vehicle]);

  const images = useMemo(() => {
    const existing = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];
    if (existing.length > 1) return existing;
    return getModelAngleImages(vehicle.model, existing[0]);
  }, [vehicle]);

  // Active reservation details from live reservations store
  const activeReservation = useMemo(() => {
    return (
      reservations?.find(
        (r) =>
          (r.vehicleId === vehicle.id || r.vehicle?.id === vehicle.id) &&
          r.status === "ACTIVE_HOLD"
      ) ||
      reservations?.find(
        (r) => r.vehicleId === vehicle.id || r.vehicle?.id === vehicle.id
      )
    );
  }, [reservations, vehicle.id]);

  const remainingTime = useMemo(() => {
    if (!activeReservation?.expiresAt) return null;
    const diff = new Date(activeReservation.expiresAt).getTime() - now;
    if (diff <= 0) return { label: "EXPIRED", isExpired: true, isWarning: false };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const isWarning = hours < 2;
    return {
      label: `${hours}h ${mins}m remaining`,
      isExpired: false,
      isWarning,
    };
  }, [activeReservation, now]);

  if (!vehicle) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-soft max-w-xl mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Vehicle Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested export vehicle unit #{vehicleId} does not exist or has been withdrawn.
        </p>
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            if (onBack) onBack();
            else if (isProgrammeContext) router.push("/programme/stock");
            else if (isAdmin) router.push("/admin/catalogue");
            else router.push("/dealer/stocks");
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
        >
          Return to {isProgrammeContext ? "Stock Catalogue" : isAdmin ? "Catalogue" : "Stock"}
        </button>
      </div>
    );
  }

  // Active pricing calculations strictly [A + B] wholesale landed baseline
  const effectiveFobJPY = vehicle.fobPriceJPY || 2186175;
  const exchangeRate = pricingConfig?.exchangeRateJPYtoNZD || JPY_TO_NZD_EXCHANGE_RATE;
  const { totalAB } = calculateEstimatedLandedAB(effectiveFobJPY, exchangeRate);

  const additionalCosts: AdditionalCostItem[] = vehicle.additionalCosts || [];
  const approvedAdditionalCosts = additionalCosts.filter((c) => c.status === "APPROVED");
  const approvedCostsTotal = approvedAdditionalCosts.reduce((sum, item) => sum + item.amountNZD, 0);
  const pendingAdditionalCosts = additionalCosts.filter((c) => c.status === "PENDING_DEALER_APPROVAL");
  const additionalCostsTotal = additionalCosts.reduce((sum, item) => sum + item.amountNZD, 0);
  const totalLandedPriceAB = totalAB + ((isAdmin || isProgrammeContext) ? additionalCostsTotal : approvedCostsTotal);

  const isAvailable = vehicle.status === "AVAILABLE";
  const isReserved = vehicle.status === "RESERVED";
  const isAllocated = vehicle.status === "ALLOCATED";
  const isWithdrawn = vehicle.status === "WITHDRAWN";
  const isSold = vehicle.status === "SOLD" || (vehicle.status as any) === "BUYED";
  const isDraft = vehicle.status === "DRAFT";

  // Check if held by currently signed in dealer
  const isHeldByCurrentDealer =
    Boolean(currentDealer?.id && vehicle.reservedByDealerId === currentDealer.id);

  const reservingDealer = dealers?.find((d) => d.id === vehicle.reservedByDealerId);
  const reservingDealerName =
    reservingDealer?.legalTradingName ||
    (vehicle.reservedByDealerId === "DEALER_002"
      ? "Bay of Plenty Nissan"
      : vehicle.reservedByDealerId === "DEALER_001"
        ? "Auckland Nissan"
        : "Franchise Dealer Partner");

  const isElectricOrHybrid =
    vehicle.fuelType === "100% Electric" ||
    vehicle.fuelType === "Hybrid" ||
    vehicle.fuelType === "e-Power" ||
    vehicle.model.toLowerCase().includes("leaf") ||
    vehicle.model.toLowerCase().includes("power") ||
    vehicle.model.toLowerCase().includes("dayz");

  // Navigation handlers
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

  const handleCopyVin = (e: React.MouseEvent) => {
    e.stopPropagation();
    audio.playSubtleClick();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(vehicle.vinChassis);
      setCopiedVin(true);
      setTimeout(() => setCopiedVin(false), 2000);
    }
  };

  const handleSavePrice = () => {
    audio.playSuccessChime();
    updateVehicle(vehicle.id, { fobPriceJPY: Number(fobInputJPY) });
    setIsEditingPrice(false);
    setActionNotice(`FOB acquisition baseline updated for unit #${vehicle.stockId}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAdminApproveReservation = () => {
    audio.playSubtleClick();
    setIsConfirmModalOpen(true);
  };

  const handleAdminRejectReservation = () => {
    audio.playSubtleClick();
    setDeclineReason("");
    setIsDeclineModalOpen(true);
  };

  const executeConfirmAllocation = () => {
    audio.playSuccessChime();
    confirmAllocation(vehicle.id, "Approved by Central Operations Admin. Wholesale purchase order issued.");
    setIsConfirmModalOpen(false);
    setActionNotice(`✓ Wholesale allocation confirmed for unit #${vehicle.stockId} to ${reservingDealerName}. Active order generated.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  const executeDeclineReservation = () => {
    audio.playSubtleClick();
    const reason = declineReason.trim() || "Reservation declined by Central Operations Admin";
    if (activeReservation) {
      rejectReservation(activeReservation.id, reason);
    }
    releaseHold(vehicle.id, reason);
    setIsDeclineModalOpen(false);
    setDeclineReason("");
    setActionNotice(`Reservation declined for unit #${vehicle.stockId}. Stock released back to Available.`);
    setTimeout(() => setActionNotice(null), 5000);
  };


  const handleAdminMarkAsSold = () => {
    audio.playSuccessChime();
    setVehicleStatus(vehicle.id, "SOLD", "Vehicle wholesale settlement completed by Operations Admin");
    setActionNotice(`Unit #${vehicle.stockId} marked as SETTLED.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRemoveAdditionalCost = (costId: string) => {
    removeVehicleAdditionalCost(vehicle.id, costId);
    audio.playSubtleClick();
    setActionNotice("Additional cost item removed.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDealerApproveCost = (costId: string) => {
    audio.playSuccessChime();
    respondToVehicleAdditionalCost(vehicle.id, costId, "APPROVED", currentDealer?.id);
    setActionNotice("Additional cost approved and added to your landed buy price.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDealerRejectCost = (costId: string) => {
    audio.playSubtleClick();
    respondToVehicleAdditionalCost(vehicle.id, costId, "DECLINED", currentDealer?.id);
    setActionNotice("Additional cost proposal declined.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleReservationSuccess = (vId: string) => {
    atomicReserve(
      vId,
      currentDealer?.id || "DEALER_001",
      currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : undefined
    );
    setIsReserveModalOpen(false);
    setActionNotice(`24-Hour Exclusivity Hold active on unit #${vehicle.stockId}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDownloadDocument = (docName: string) => {
    audio.playSubtleClick();
    setDocDownloadToast(`Downloading official verified intake dossier: ${docName}`);
    setTimeout(() => setDocDownloadToast(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans text-slate-800 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Bar: Back Action (Left) vs Status Badge (Right)   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Back Navigation & Action Notice */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs hover:border-slate-300 group cursor-pointer transition-all active:scale-95"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>{backLabel || (isProgrammeContext ? "Back to Stock Catalogue" : isAdmin ? "Back to Catalogue" : "Back to Stock")}</span>
          </button>

          {/* Action Notice Toast */}
          {actionNotice && (
            <div className="px-3.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-soft animate-in fade-in flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>

        {/* Right Side: Status Badges (Right Aligned per user request) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {isAvailable && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isProgrammeContext ? "Available Central Stock" : isAdmin ? "Available to NZ Franchise" : "Available for Reservation"}</span>
            </span>
          )}
          {isDraft && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-slate-100 text-slate-700 border-slate-300 shadow-2xs">
              <Edit3 className="w-3 h-3 text-slate-500" />
              <span>Draft Intake (Yard Staging)</span>
            </span>
          )}
          {isReserved && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-300 shadow-2xs">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>
                {isProgrammeContext
                  ? (reservingDealerName ? `Reserved by ${reservingDealerName}` : "Active 24h Exclusivity Hold")
                  : isAdmin
                    ? "Dealer 24h Exclusivity Hold"
                    : isHeldByCurrentDealer
                      ? "Your Active 24h Hold"
                      : "Dealer 24h Exclusivity Hold"}
              </span>
            </span>
          )}
          {isAllocated && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-sky-50 text-sky-700 border-sky-200 shadow-2xs">
              <Ship className="w-3 h-3 text-sky-600" />
              <span>Allocated &amp; Shipping Secured</span>
            </span>
          )}
          {isWithdrawn && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-rose-50 text-rose-700 border-rose-200 shadow-2xs">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              <span>Withdrawn from Catalogue</span>
            </span>
          )}
          {isSold && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-purple-600" />
              <span>Sold &amp; Wholesale Settled</span>
            </span>
          )}
        </div>
      </div>

      {/* Hold Reservation Alert Bar if Reserved */}
      {isReserved && (
        <div className="px-5 py-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2 shadow-2xs">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {isProgrammeContext ? (
              <>
                Unit is locked under an active 24-hour exclusivity hold by{" "}
                <strong className="text-slate-900 font-bold">{reservingDealerName}</strong>.
              </>
            ) : isAdmin ? (
              <>
                Unit is locked under a 24-hour exclusivity hold by{" "}
                <strong className="text-slate-900 font-bold">{reservingDealerName}</strong>.
              </>
            ) : isHeldByCurrentDealer ? (
              <>
                Your dealership holds a <strong className="text-slate-900 font-bold">24-hour exclusivity lock</strong> on this unit. Pending Autohub allocation approval.
              </>
            ) : (
              <>Unit is temporarily locked under a 24-hour exclusivity hold by another certified franchise partner.</>
            )}
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. ROW 1: Studio Showcase (Left 7) vs Commercial Panel (Right 5) */}
      {/* Balanced layout with items-stretch alignment                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Studio Image Showcase Card (matching design reference) */}
        <div className="lg:col-span-7 h-full flex flex-col">
          <VehicleShowcaseCard vehicle={vehicle} />
        </div>

        {/* Right Column (5 cols): Commercial Landed Pricing Card (matching design reference) */}
        <div className="lg:col-span-5 h-full flex flex-col">
          <CommercialLandedPricingCard
            vehicle={vehicle}
            roleOverride={
              isProgrammeContext
                ? "READONLY_PROGRAMME_USER"
                : isAdmin
                  ? "AUTOHUB_ADMIN"
                  : currentUser?.role
            }
            onHoldSuccess={() => setActionNotice("24-Hour Exclusivity Hold active on unit.")}
            onOrderSuccess={() => setActionNotice("Order successfully initiated.")}
            onAdminConfirm={executeConfirmAllocation}
            onAdminDecline={executeDeclineReservation}
            onAdminMarkSold={handleAdminMarkAsSold}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3.5 VEHICLE STATS CARDS BAR (VIN, Engine, Transmission, Fuel, ODO, Year, Colour) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <VehicleStatsCards vehicle={vehicle} />

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Full Layout Card 1: Inspection Condition Dossier         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
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
              {vehicle.overallCondition}
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
      {/* 5. Full Layout Card 2: Vehicle Specifications & Listing Tabs */}
      {/* ─────────────────────────────────────────────────────────── */}
      <VehicleSpecificationsTabs
        vehicle={vehicle}
        isAdmin={isAdmin}
        isProgramme={isProgrammeContext}
        copiedVin={copiedVin}
        onCopyVin={handleCopyVin}
      />

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. Full Layout Card 3: Supporting Documents                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
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

        {vehicleDocs.length > 0 ? (
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
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center my-3">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Supporting Documents</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No supplementary documentation was attached during vehicle intake.
            </p>
          </div>
        )}

        {/* Pinned Cryptographic Status Footer */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Cryptographic Export Register</span>
          <span className="text-slate-700 font-bold">SHA-256 Verified</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. Full Layout Card 4: Additional Costs                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 md:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#C3002F]" />
              <span>Additional Costs</span>
            </h3>
          </div>
        </div>

        {/* Dealer Pending Costs Alert Banner */}
        {!isAdmin && !isProgrammeContext && pendingAdditionalCosts.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                <AlertTriangle className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <strong className="block font-bold">
                  {pendingAdditionalCosts.length} Supplementary Cost Proposal{pendingAdditionalCosts.length > 1 ? "s" : ""} Awaiting Your Review
                </strong>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Proposed by operations compliance. Review the items and click Approve or Decline. Approved costs are incorporated into your landed buy price.
                </p>
              </div>
            </div>
          </div>
        )}

        {additionalCosts.length === 0 ? (
          <div className="p-8 sm:p-10 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-center">
            <span className="text-sm font-bold text-slate-500 block">
              No Additional Costs
            </span>
            <p className="text-xs text-slate-400 mt-1">
              This vehicle has zero supplementary repair or non-standard compliance variance costs attached.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {additionalCosts.map((cost) => {
              const isPending = cost.status === "PENDING_DEALER_APPROVAL";
              const isApproved = cost.status === "APPROVED";
              const isDeclined = cost.status === "DECLINED";

              return (
                <div
                  key={cost.id}
                  className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 ${
                    isPending
                      ? "bg-amber-50/30 border-amber-200/90 shadow-2xs"
                      : isApproved
                        ? "bg-white border-emerald-200 shadow-2xs"
                        : "bg-slate-50/60 border-slate-200"
                  }`}
                >
                  {/* Card Header: Category & Status on Left, Amount on Right */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-slate-200/70">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200/80 font-mono">
                          {cost.type.replace(/_/g, " ")}
                        </span>

                        {isPending ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/90 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>{isAdmin || isProgrammeContext ? "Awaiting Dealer Sign-Off" : "Pending Your Approval"}</span>
                          </span>
                        ) : isApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200/90 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved & Applied</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/90 flex items-center gap-1">
                            <X className="w-3 h-3 text-slate-500" />
                            <span>Declined</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {cost.description}
                      </h4>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                      <div className="text-right">
                        <span className="font-mono text-base sm:text-lg font-bold text-slate-900 block leading-none">
                          +${cost.amountNZD.toLocaleString()} NZD
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">
                          Landed Surcharge
                        </span>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdditionalCost(cost.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                          title="Remove cost proposal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Dealership, Notes, and Evidence Attachment */}
                  <div className="pt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Target Dealership
                      </span>
                      <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cost.dealerName || "Allocated Franchise Dealer"}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Compliance Notes & Directive
                      </span>
                      <p className="text-slate-600 text-xs">
                        {cost.notes || "Official Inspection Item recorded during vehicle processing."}
                      </p>
                    </div>

                    {cost.evidenceDocumentUrl && (
                      <div className="md:col-span-2 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Attached Evidence Document
                        </span>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono transition-colors shadow-2xs">
                          <Paperclip className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[280px] sm:max-w-md">{cost.evidenceDocumentUrl}</span>
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white border border-slate-200">PDF</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Action / Settlement Footer */}
                  {!isAdmin && !isProgrammeContext && isPending && isDealer && (
                    <div className="mt-4 pt-3.5 border-t border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-[11px] text-amber-900/80">
                        Approving incorporates this <strong className="font-mono text-slate-900">+${cost.amountNZD.toLocaleString()} NZD</strong> surcharge into your final landed buy price.
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDealerRejectCost(cost.id)}
                          className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                        >
                          <X className="w-3.5 h-3.5 text-slate-500" />
                          <span>Decline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDealerApproveCost(cost.id)}
                          className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-soft transition-all active:scale-[0.98]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve (+${cost.amountNZD.toLocaleString()} NZD)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isProgrammeContext && isPending && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-500 italic">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Supplementary cost proposal submitted; awaiting dealer review and authorization.</span>
                    </div>
                  )}

                  {!isAdmin && !isProgrammeContext && isPending && !isDealer && (
                    <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-500 italic">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Awaiting dealership cost variation approval before incorporation into landed price.</span>
                    </div>
                  )}

                  {isApproved && (
                    <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center gap-2 text-xs font-medium text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Authorized by dealership and incorporated into official landed buy price calculation.</span>
                    </div>
                  )}

                  {isDeclined && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-500">
                      <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Proposal declined. Surcharge is excluded from landed pricing.</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reconciliation Summary Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                  {isProgrammeContext ? "Programme Financial Reconciliation" : isAdmin ? "Financial Reconciliation" : "Dealership Cost Reconciliation"}
                </span>
                <div className="flex items-center gap-4 text-slate-600 text-[11px] flex-wrap">
                  <span>Approved (Applied): <strong className="text-slate-900 font-mono">+${approvedCostsTotal.toLocaleString()} NZD</strong></span>
                  {additionalCostsTotal > approvedCostsTotal && (
                    <span>Pending Review: <strong className="text-amber-800 font-mono">+${(additionalCostsTotal - approvedCostsTotal).toLocaleString()} NZD</strong></span>
                  )}
                </div>
              </div>

              <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                  {isProgrammeContext || isAdmin ? "Total Proposed Variance" : "Approved Landed Variance"}
                </span>
                <span className="text-base sm:text-lg font-mono font-bold text-slate-900">
                  +${((isProgrammeContext || isAdmin) ? additionalCostsTotal : approvedCostsTotal).toLocaleString()} NZD
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 8. Bottom Return Navigation                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="pt-2 flex items-center justify-center">
        <button
          type="button"
          onClick={handleBack}
          className="py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all shadow-2xs flex items-center gap-2 cursor-pointer hover:border-slate-300 active:scale-[0.99]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>{backLabel ? backLabel : `Return to ${isProgrammeContext ? "Stock Catalogue" : isAdmin ? "Catalogue" : "Stock"}`}</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 9. MODALS & OVERLAYS                                        */}
      {/* ─────────────────────────────────────────────────────────── */}

      {/* A. Atomic Exclusivity Reservation Modal (Dealer Only) */}
      {isReserveModalOpen && (
        <AtomicReservationModal
          vehicle={vehicle}
          onClose={() => setIsReserveModalOpen(false)}
          onSuccess={handleReservationSuccess}
        />
      )}

      {/* C. Official Verified Intake Document Preview Modal */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
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
                <span className="font-mono text-slate-700">{activeDocPreview.size || "1.8 MB"}</span>
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

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Certified under Nissan Japan HQ intake &amp; AutoHub compliance standards.</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadDocument(activeDocPreview.name);
                  setActiveDocPreview(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Wholesale Allocation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Confirm Wholesale Allocation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Approve reservation &amp; issue purchase order
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900">{vehicle.year} {vehicle.make} {vehicle.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock ID:</span>
                <span className="font-mono font-bold text-slate-800">#{vehicle.stockId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Dealership:</span>
                <span className="font-bold text-slate-900">{reservingDealerName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Fixed Landed Price (A + B):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${totalLandedPriceAB.toLocaleString()} NZD
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to confirm this wholesale allocation? This will officially allocate unit <strong>#{vehicle.stockId}</strong> to <strong>{reservingDealerName}</strong> and generate an active order in the milestones pipeline.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmAllocation}
                className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-white/90" />
                <span>Confirm Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Reservation with Reason Modal */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Decline Reservation Hold
                  </h3>
                  <p className="text-xs text-slate-500">
                    Release exclusivity hold back to open inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900">{vehicle.year} {vehicle.make} {vehicle.model} (#{vehicle.stockId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reserving Dealer:</span>
                <span className="font-bold text-slate-900">{reservingDealerName}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Reason for Declining *</span>
                <span className="text-[10px] text-slate-400 font-normal">Recorded in audit log</span>
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g. Allocation declined during wholesale credit review / Dealership requested cancellation..."
                className="w-full p-3 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-sans"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Declining will terminate the exclusivity hold for <strong>{reservingDealerName}</strong> and immediately return unit #{vehicle.stockId} to the active Japan inventory catalog.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDeclineReservation}
                disabled={!declineReason.trim()}
                className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <XCircle className="w-4 h-4 text-slate-400" />
                <span>Decline Reservation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. Download Toast Notification */}
      {docDownloadToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs font-medium flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom-3">
          <Download className="w-4 h-4 text-slate-300 shrink-0 animate-bounce" />
          <span>{docDownloadToast}</span>
        </div>
      )}
    </div>
  );
}
