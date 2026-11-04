"use client";

import React, { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Vehicle, LandedPriceBreakdown, ZoneId, VehicleSupportingDoc, AdditionalCostItem } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { calculateLandedPrice, OFFICIAL_PRICING_ZONES, JPY_TO_NZD_EXCHANGE_RATE } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import AtomicReservationModal from "./AtomicReservationModal";
import AddVehicleAdditionalCostModal from "@/components/admin/AddVehicleAdditionalCostModal";
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  Copy,
  Check,
  Lock,
  ShieldCheck,
  Star,
  MapPin,
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
  } = useProgramme();
  const { currentDealer, currentUser } = useAuth();

  // Determine role perspective strictly: Admin route/role vs Dealer route/role
  const isDealerContext = typeof pathname === "string" && pathname.startsWith("/dealer");
  const isAdminContext = typeof pathname === "string" && pathname.startsWith("/admin");
  const isAdmin =
    isAdminProp !== undefined
      ? isAdminProp
      : isAdminContext || (currentUser?.role === "AUTOHUB_ADMIN" && !isDealerContext);

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

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedZone, setSelectedZone] = useState<ZoneId>(dealerZone);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isAddCostModalOpen, setIsAddCostModalOpen] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

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
            else if (isAdmin) router.push("/admin/catalogue");
            else router.push("/dealer/stocks");
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
        >
          Return to {isAdmin ? "Catalogue" : "Stock"}
        </button>
      </div>
    );
  }

  // Active zone configuration and pricing calculations
  const activeZoneId = isAdmin ? selectedZone : dealerZone;
  const selectedZoneConfig = OFFICIAL_PRICING_ZONES[activeZoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;
  const landedPrice: LandedPriceBreakdown = calculateLandedPrice(
    vehicle.fobPriceJPY,
    activeZoneId,
    pricingConfig
  );

  const additionalCosts: AdditionalCostItem[] = vehicle.additionalCosts || [];
  const approvedAdditionalCosts = additionalCosts.filter((c) => c.status === "APPROVED");
  const approvedCostsTotal = approvedAdditionalCosts.reduce((sum, item) => sum + item.amountNZD, 0);
  const pendingAdditionalCosts = additionalCosts.filter((c) => c.status === "PENDING_DEALER_APPROVAL");
  const additionalCostsTotal = additionalCosts.reduce((sum, item) => sum + item.amountNZD, 0);
  const totalBuyPriceNZD = landedPrice.totalBuyPriceNZD + (isAdmin ? additionalCostsTotal : approvedCostsTotal);

  // 5 Delivery Zones with dynamic Fixed Profile Prices for Admin inspection
  const zonesWithPrices = (["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"] as ZoneId[]).map((zid) => {
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

  const images = vehicle.images && vehicle.images.length > 0 ? vehicle.images : ["/images/cars/dayz.png"];
  const activeImage = images[activeImageIdx] || images[0];

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
    const diff = new Date(activeReservation.expiresAt).getTime() - Date.now();
    if (diff <= 0) return { label: "EXPIRED", isExpired: true, isWarning: false };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const isWarning = hours < 2;
    return {
      label: `${hours}h ${mins}m remaining`,
      isExpired: false,
      isWarning,
    };
  }, [activeReservation]);

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

  const handleAddAdditionalCost = (item: AdditionalCostItem) => {
    const updated = [...additionalCosts, item];
    updateVehicle(vehicle.id, { additionalCosts: updated });
    setIsAddCostModalOpen(false);
    setActionNotice(`Additional cost proposal "+$${item.amountNZD.toLocaleString()} NZD" submitted for dealer approval.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleRemoveAdditionalCost = (costId: string) => {
    const updated = additionalCosts.filter((c) => c.id !== costId);
    updateVehicle(vehicle.id, { additionalCosts: updated });
    audio.playSubtleClick();
    setActionNotice("Additional cost item removed.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDealerApproveCost = (costId: string) => {
    audio.playSuccessChime();
    const updated = additionalCosts.map((c) =>
      c.id === costId ? { ...c, status: "APPROVED" as const, decidedAt: new Date().toISOString() } : c
    );
    updateVehicle(vehicle.id, { additionalCosts: updated });
    setActionNotice("Additional cost approved and added to your landed buy price.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDealerRejectCost = (costId: string) => {
    audio.playSubtleClick();
    const updated = additionalCosts.map((c) =>
      c.id === costId ? { ...c, status: "DECLINED" as const, decidedAt: new Date().toISOString() } : c
    );
    updateVehicle(vehicle.id, { additionalCosts: updated });
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
      {/* 1. Top Navigation & Action Notice Bar                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300 group text-xs w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>{backLabel || (isAdmin ? "Back to Catalogue" : "Back to Stock")}</span>
        </button>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="px-3.5 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-semibold shadow-soft border border-slate-200 animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Main Vehicle Header Card (Consistent with Japan Inventory) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white text-slate-900 rounded-[16px] p-6 sm:p-7 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
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
                {isDraft && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-slate-100 text-slate-700 border-slate-300 shadow-2xs">
                    <Edit3 className="w-3 h-3 text-slate-500" />
                    <span>Draft Intake (Yard Staging)</span>
                  </span>
                )}
                {isReserved && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-300 shadow-2xs">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>
                      {isAdmin
                        ? "Dealer 24h Exclusivity Hold"
                        : isHeldByCurrentDealer
                          ? "Your Active 24h Hold"
                          : "Dealer 24h Exclusivity Hold"}
                    </span>
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

              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions: Tailored strictly to role responsibilities */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            {!isAdmin && currentDealer && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-800">{currentDealer.legalTradingName}</span>
                <span className="text-slate-300">·</span>
                <span className="text-slate-500 font-mono">{dealerZone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hold Reservation Alert Bar if Reserved */}
        {isReserved && (
          <div className="mt-5 pt-4 border-t border-amber-200/80 bg-amber-50/70 -mx-6 -mb-6 sm:-mx-7 sm:-mb-7 px-6 py-3.5 flex items-center gap-2 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              {isAdmin ? (
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
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2.5 INNER STATS CARDS STRIP (Matching Japan Inventory Style)   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

        {/* 3. Role-relevant Commercial Stat: Admin sees FOB Baseline (JPY); Dealer sees Total Buy Price (NZD) */}
        {isAdmin ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              ACQUISITION BASELINE ({vehicle.currency || "JPY"})
            </span>
            <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
              ¥{vehicle.fobPriceJPY.toLocaleString()}
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              TOTAL BUY PRICE (NZD)
            </span>
            <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
              ${totalBuyPriceNZD.toLocaleString()} NZD
            </div>
          </div>
        )}

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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. ROW 1: Studio Showcase (Left 7) vs Commercial Panel (Right 5) */}
      {/* Balanced layout with items-stretch alignment                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Studio Image Showcase */}
        <div className="lg:col-span-7 h-full flex flex-col">
          <div className="bg-white rounded-[16px] p-6 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between space-y-4">
            <div>
              {/* Main Stage Image */}
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

                {/* Zero Emission Emblem if Electric / Hybrid */}
                {isElectricOrHybrid && (
                  <div className="absolute top-4 right-4 z-20 hidden sm:block">
                    <ZeroEmissionBadge />
                  </div>
                )}

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
                    High-Resolution Studio Angles ({images.length})
                  </span>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          audio.playSubtleClick();
                          setActiveImageIdx(idx);
                        }}
                        className={`w-20 h-14 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 ${activeImageIdx === idx
                          ? "border-slate-900 ring-2 ring-slate-900/10 bg-white"
                          : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                          }`}
                      >
                        <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                      </button>
                    ))}
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

        {/* Right Column (5 cols): Commercial & Order Management Panel */}
        <div className="lg:col-span-5 h-full flex flex-col">
          <div className="bg-white rounded-[16px] p-6 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between space-y-5">
            {/* ──────────────────────────────────────────────────────── */}
            {/* ADMIN COMMERCIAL VIEW                                    */}
            {/* ──────────────────────────────────────────────────────── */}
            {isAdmin ? (
              <div className="space-y-4">
                {/* Acquisition Baseline Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C3002F]" />
                      Japanese Acquisition Pricing ({vehicle.purchasePriceBasis || "FOB"})
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-mono font-bold">
                      {vehicle.purchasePriceBasis || "FOB"} · {vehicle.currency || "JPY"}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-3">
                    {isEditingPrice ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                            ¥
                          </span>
                          <input
                            type="number"
                            step="10000"
                            value={fobInputJPY}
                            onChange={(e) => setFobInputJPY(Number(e.target.value))}
                            className="pl-6 pr-2 py-1 w-32 rounded-lg border border-slate-300 bg-white font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C3002F]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSavePrice}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFobInputJPY(vehicle.fobPriceJPY);
                            setIsEditingPrice(false);
                          }}
                          className="text-slate-400 hover:text-slate-600 text-xs p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                          ¥{vehicle.fobPriceJPY.toLocaleString()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingPrice(true)}
                          className="text-[11px] font-bold text-[#C3002F] hover:underline cursor-pointer"
                        >
                          (Edit)
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Raw Japan auction purchase price prior to ocean shipping (~${landedPrice.fobNZD.toLocaleString()} NZD equiv.)
                  </p>
                  <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                    <span className="text-slate-400 font-sans">Dispatch Vessel:</span>
                    <strong className="text-slate-900 font-bold">Port of Auckland (RoRo V.48)</strong>
                  </div>
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

                {/* Price Breakdown Line Items */}
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Pricing Component</span>
                    <span>Calculated Value (NZD)</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">Ocean Freight &amp; Port Handling:</span>
                    <span className="font-mono font-medium text-slate-900">${landedPrice.oceanFreightNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">Customs Processing &amp; NZ GST (15% CIF):</span>
                    <span className="font-mono font-medium text-slate-900">
                      ${(landedPrice.customsProcessingNZD + landedPrice.gstNZD).toLocaleString()} NZD
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">MR2A Compliance &amp; Inspection:</span>
                    <span className="font-mono font-medium text-slate-900">${landedPrice.complianceInspectionNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">
                      Domestic Delivery ({selectedZoneConfig.zoneName.split("-")[0]?.trim()}):
                    </span>
                    <span className="font-mono font-medium text-slate-900">${landedPrice.zoneDeliveryNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">Nissan Programme Component:</span>
                    <span className="font-mono font-medium text-slate-900">${landedPrice.programmeFeeNZD.toLocaleString()} NZD</span>
                  </div>
                </div>

                {/* Total Landed Buy Price Box */}
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
                    ${landedPrice.totalBuyPriceNZD.toLocaleString()} NZD
                  </strong>
                </div>

                {/* Admin Allocation Lifecycle Controls */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {actionNotice && (
                    <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
                        <span>{actionNotice}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActionNotice(null)}
                        className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {isReserved && (
                    <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-slate-900 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Dealer 24h Exclusivity Hold</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded">
                          {remainingTime ? remainingTime.label : "Active Hold"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1.5 p-3 rounded-lg bg-white border border-slate-200/80 font-sans">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reserving Dealership:</span>
                          <span className="font-bold text-slate-900">{reservingDealerName}</span>
                        </div>
                        {activeReservation && (
                          <>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Buyer Contact:</span>
                              <span className="text-slate-700 font-medium">
                                {activeReservation.userName} ({activeReservation.userEmail})
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Request ID:</span>
                              <span className="font-mono font-bold text-slate-800">
                                {activeReservation.requestId}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px]">
                              <span className="text-slate-500">Holding Expiry:</span>
                              <span className="font-mono text-slate-800 font-medium">
                                {new Date(activeReservation.expiresAt).toLocaleString("en-NZ")}
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleAdminApproveReservation}
                          className="py-2.5 px-3 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                          title="Confirm wholesale allocation"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white/90" />
                          <span>Confirm</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAdminRejectReservation}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                          title="Decline reservation and release hold"
                        >
                          <XCircle className="w-4 h-4 text-slate-500" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {isAllocated && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Ship className="w-4 h-4 text-slate-600" />
                          <span>Vehicle Allocated to Dealership</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200/80 border border-slate-300/80 px-2 py-0.5 rounded">
                          ALLOCATED
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 flex justify-between">
                        <span className="text-slate-500">Allocated To:</span>
                        <span className="font-bold text-slate-900">{reservingDealerName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAdminMarkAsSold}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white/90" />
                        <span>Mark Wholesale Settled</span>
                      </button>
                    </div>
                  )}

                  {isSold && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-slate-900">
                          <CheckCircle2 className="w-4 h-4 text-slate-600" />
                          <span>Wholesale Settled &amp; Sold</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200/80 border border-slate-300/80 px-2 py-0.5 rounded">
                          SETTLED
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-slate-200/80 text-xs text-slate-600">
                        <span className="text-slate-600 text-[11px]">Final handover and title transfer completed.</span>
                      </div>
                    </div>
                  )}

                  {isAvailable && (
                    <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/80 text-xs flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Reservation Status:</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Available in Central Catalogue</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ──────────────────────────────────────────────────────── */
              /* DEALER COMMERCIAL VIEW                                   */
              /* ──────────────────────────────────────────────────────── */
              <div className="space-y-4">
                {/* Total Landed Buy Price Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C3002F]" />
                    Wholesale Landed Price ({dealerZone})
                  </span>

                  <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                    ${totalBuyPriceNZD.toLocaleString()}
                    <span className="text-xs font-sans text-slate-400 font-semibold ml-2">NZD Total Buy Price</span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Guaranteed landed wholesale price delivered directly to your authorized franchise depot.
                  </p>
                </div>

                {/* Designated Territory Presentation */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 block">
                        Designated Delivery Zone
                      </span>
                      <strong className="text-xs text-slate-800 block">
                        {dealerZone} · {selectedZoneConfig.zoneName}
                      </strong>
                    </div>
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
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

                {/* Price Line Items Table */}
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Pricing Component</span>
                    <span>Commercial Allocation</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">Ocean Freight &amp; Port Handling:</span>
                    <span className="font-mono font-medium text-slate-900">${landedPrice.oceanFreightNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">Customs Clearance &amp; NZ GST (15% CIF):</span>
                    <span className="font-mono font-medium text-slate-900">
                      ${(landedPrice.customsProcessingNZD + landedPrice.gstNZD).toLocaleString()} NZD
                    </span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">MR2A Compliance &amp; WoF Certification:</span>
                    <span className="font-mono font-medium text-slate-900">${landedPrice.complianceInspectionNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">Direct Dealership Delivery ({dealerZone}):</span>
                    <span className="font-mono font-medium text-slate-900">${landedPrice.zoneDeliveryNZD.toLocaleString()} NZD</span>
                  </div>
                  <div className="py-1.5 flex items-center justify-between">
                    <span className="text-slate-600">Nissan Certified Programme Component:</span>
                    <span className="font-mono font-medium text-slate-900">${landedPrice.programmeFeeNZD.toLocaleString()} NZD</span>
                  </div>
                </div>

                {/* Guaranteed Fixed Profile Price Callout */}
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

                {/* Dealer Exclusivity Hold & Procurement Action */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {isAvailable ? (
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setIsReserveModalOpen(true);
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs tracking-wide transition-all shadow-xs active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Place 24-Hour Exclusivity Hold (Reserve)</span>
                    </button>
                  ) : isReserved && isHeldByCurrentDealer ? (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Your Active Hold · Pending Allocation Review</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/80">
                        Active Hold
                      </span>
                    </div>
                  ) : isAllocated ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        <Ship className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>Allocated to Your Dealership</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => router.push("/dealer/orders")}
                        className="text-[11px] font-bold text-slate-900 hover:underline cursor-pointer"
                      >
                        View Orders →
                      </button>
                    </div>
                  ) : isSold ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>Sold &amp; Handed Over</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => router.push("/dealer/orders")}
                        className="text-[11px] font-bold text-slate-900 hover:underline cursor-pointer"
                      >
                        View Orders →
                      </button>
                    </div>
                  ) : (
                    <div className="w-full py-3 px-4 rounded-xl bg-slate-100 text-slate-500 font-semibold text-xs text-center flex items-center justify-center gap-2 border border-slate-200">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reserved Under Network Lock</span>
                    </div>
                  )}

                  {/* Trust Badges */}
                  <div className="flex items-center justify-center gap-2.5 text-[10px] text-slate-400 pt-1 flex-wrap">
                    <span>✓ Zero Initial Deposit</span>
                    <span>•</span>
                    <span>✓ 24h Price Guarantee</span>
                    <span>•</span>
                    <span>✓ JEVIC &amp; MR2A Included</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3.5 Reservation Exclusivity & Dealership Credentials Dossier Card */}
      {(isReserved || activeReservation) && (
        <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C3002F]" />
              <span>Dealer Exclusivity Credentials &amp; Terms Compliance</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {activeReservation?.requestId || `#REQ-${vehicle.stockId}`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-semibold">{reservingDealerName}</strong>
              <span className="text-[11px] text-slate-500 font-mono block">Code: {activeReservation?.dealerCode || "DEALER_NZ"}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-semibold truncate">{activeReservation?.userName || "Certified Buyer"}</strong>
              <span className="text-[11px] text-slate-500 truncate block">{activeReservation?.userEmail || "buyer@dealership.co.nz"}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-semibold">Terms of Trade v2026.1</strong>
              <span className="text-[11px] text-slate-700 font-medium block">✓ Digitally Signed &amp; Stamped</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <strong className="text-slate-900 block font-semibold">Section 6.2 Protected</strong>
              <span className="text-[11px] text-slate-700 font-medium block">✓ Zero Initial Deposit</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Full Layout Card 1: Inspection Condition Dossier         */}
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Inspector Recorded Markings &amp; Defect Items:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {vehicle.knownDefects.map((defect, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-800 font-medium"
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
      {/* 5. Full Layout Card 2: Vehicle Specifications & Listing     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            <span>Vehicle Specifications &amp; Listing Record</span>
          </h3>
          <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
            NZTA Certified
          </span>
        </div>

        {/* Clean 4-Column Technical Grid (Zero duplicate info) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Card 1: Provenance & Identification */}
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
                      <Check className="w-3 h-3 text-slate-900" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stock Serial ID:</span>
                <span className="font-mono font-bold text-slate-800">#{vehicle.stockId}</span>
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
                <span className="text-slate-500">Model Year:</span>
                <span className="font-mono font-bold text-slate-900">{vehicle.year}</span>
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
                <span className="text-slate-500">Displacement:</span>
                <span className="font-mono font-medium text-slate-800">
                  {vehicle.engineCc && vehicle.engineCc > 0 ? `${vehicle.engineCc.toLocaleString()} cc` : "Electric Motor"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Transmission:</span>
                <span className="font-medium text-slate-800">{vehicle.transmission}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Drive System:</span>
                <span className="font-mono font-bold text-slate-900">{vehicle.driveType || "2WD"}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Exterior Colour:</span>
                <span className="font-medium text-slate-800">{vehicle.color || "Factory Original"}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Compliance & Verification */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Compliance &amp; Verification
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">JEVIC Odometer:</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  <span>Certified Pass</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">NZTA Entry:</span>
                <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3 text-slate-500" />
                  <span>MR2A Cleared</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Biosecurity / Rad:</span>
                <span className="font-mono font-medium text-slate-700 text-[11px]">
                  Passed (&lt;0.08 µSv/h)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Certified Date:</span>
                <span className="font-mono text-slate-700">{vehicle.inspectionDate || vehicle.createdAt}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Stock Reference:</span>
                <span className="font-mono text-slate-700">{vehicle.stockReference}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Listing & Intake Profile */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Listing &amp; Intake Profile
            </span>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Listing Status:</span>
                {isAvailable ? (
                  <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                    AVAILABLE
                  </span>
                ) : isReserved ? (
                  <span className="font-bold text-amber-800 bg-amber-50 border border-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full">
                    RESERVED
                  </span>
                ) : isAllocated ? (
                  <span className="font-bold text-sky-700 bg-sky-50 border border-sky-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                    ALLOCATED
                  </span>
                ) : isWithdrawn ? (
                  <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                    WITHDRAWN
                  </span>
                ) : isSold ? (
                  <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                    SOLD
                  </span>
                ) : (
                  <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                    {vehicle.status}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Yard Staging:</span>
                <span className="font-medium text-slate-800 text-[11px] truncate max-w-[140px]" title={vehicle.location}>
                  {vehicle.location}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Created Date:</span>
                <span className="font-mono text-slate-700 text-[11px]">{vehicle.createdAt}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Last Updated:</span>
                <span className="font-mono text-slate-700 text-[11px]">{vehicle.updatedAt}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Pricing Basis:</span>
                <span className="font-mono text-slate-800 font-bold text-[11px]">
                  {isAdmin ? `${vehicle.purchasePriceBasis || "FOB"} (${vehicle.currency || "JPY"})` : "Wholesale Landed (NZD)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. Full Layout Card 3: Supporting Documents                 */}
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
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#C3002F]" />
              <span>Additional Costs</span>
            </h3>
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
              <PlusCircle className="w-3.5 h-3.5 text-white/90" />
              <span>Add Additional Cost</span>
            </button>
          )}
        </div>

        {/* Dealer Pending Costs Alert Banner */}
        {!isAdmin && pendingAdditionalCosts.length > 0 && (
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
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 font-bold">Category</th>
                  <th className="py-3 px-4 font-bold">Description</th>
                  <th className="py-3 px-4 font-bold">Notes / Evidence</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Amount (NZD)</th>
                  <th className="py-3 px-4 font-bold text-right">{isAdmin ? "Action" : "Review Decision"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {additionalCosts.map((cost) => (
                  <tr key={cost.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {cost.type.replace(/_/g, " ")}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{cost.description}</td>
                    <td className="py-3 px-4 text-[11px]">
                      <div className="font-mono text-slate-600 truncate max-w-xs">
                        {cost.notes || "Official Inspection Item"}
                      </div>
                      {cost.evidenceDocumentUrl && (
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200">
                          <Paperclip className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[150px]">{cost.evidenceDocumentUrl}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {cost.status === "PENDING_DEALER_APPROVAL" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 w-fit">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{isAdmin ? "Awaiting Dealer Review" : "Pending Your Approval"}</span>
                        </span>
                      ) : cost.status === "APPROVED" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-900 border border-slate-300 font-semibold flex items-center gap-1.5 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-slate-600" />
                          <span>{isAdmin ? "Approved by Dealer" : "Approved"}</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-400 border border-slate-200 flex items-center gap-1.5 w-fit">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                          <span>{isAdmin ? "Declined by Dealer" : "Declined"}</span>
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
                          onClick={() => handleRemoveAdditionalCost(cost.id)}
                          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Remove cost proposal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : cost.status === "PENDING_DEALER_APPROVAL" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDealerApproveCost(cost.id)}
                            className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                            title="Approve this additional cost"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDealerRejectCost(cost.id)}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                            title="Decline this additional cost"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      ) : cost.status === "APPROVED" ? (
                        <span className="text-[11px] font-semibold text-slate-700">Applied to Landed</span>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">Declined</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-slate-900">
                    {isAdmin ? "Total Proposed Additional Costs:" : "Approved Additional Costs (Applied):"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm text-slate-900">
                    +${(isAdmin ? additionalCostsTotal : approvedCostsTotal).toLocaleString()} NZD
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
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
          <span>{backLabel ? backLabel : `Return to ${isAdmin ? "Catalogue" : "Stock"}`}</span>
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

      {/* B. Add Vehicle Additional Cost Modal (Admin Only) */}
      {isAddCostModalOpen && (
        <AddVehicleAdditionalCostModal
          vehicle={vehicle}
          isOpen={isAddCostModalOpen}
          onClose={() => setIsAddCostModalOpen(false)}
          onAddCost={handleAddAdditionalCost}
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
                <span className="text-slate-500">Fixed Landed Price:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${totalBuyPriceNZD.toLocaleString()} NZD
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
