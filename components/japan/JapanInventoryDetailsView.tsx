"use client";

import React, { useState, useMemo } from "react";
import { Vehicle, VehicleSupportingDoc, Order } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { JPY_TO_NZD_EXCHANGE_RATE } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import AmendVehicleForm from "./AmendVehicleForm";
import VehicleSpecificationsTabs from "@/components/dealer/VehicleSpecificationsTabs";
import VehicleStatsCards from "@/components/common/VehicleStatsCards";
import VehicleShowcaseCard from "@/components/common/VehicleShowcaseCard";
import CommercialLandedPricingCard from "@/components/dealer/CommercialLandedPricingCard";
import OrderCorridorTimeline from "@/components/dealer/OrderCorridorTimeline";
import { getRoRoMilestoneLabel } from "@/components/dealer/DealerOrdersView";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  MapPin,
  FileCheck2,
  Eye,
  Sparkles,
  Ship,
  Edit3,
  X,
  FileText,
  Download,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface JapanInventoryDetailsViewProps {
  vehicleId: string;
  onBack: () => void;
  onToggleStatus?: (vehicleId: string) => void;
  onAmend?: (vehicleId: string) => void;
}

export default function JapanInventoryDetailsView({
  vehicleId,
  onBack,
  onAmend,
}: JapanInventoryDetailsViewProps) {
  const { vehicles, dealers, orders, updateVehicle, setVehicleStatus } = useProgramme();
  const { currentUser } = useAuth();

  // Role permissions
  const isJapan = currentUser?.role === "NISSAN_JAPAN";
  const isAdmin = currentUser?.role === "AUTOHUB_ADMIN";
  const canManageInventory = isJapan || isAdmin;

  const [copiedVin, setCopiedVin] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal States
  const [isAmending, setIsAmending] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState(
    "Yard Inspection: Cosmetic Paint / Panel Rectification Required"
  );
  const [activeDocPreview, setActiveDocPreview] = useState<{
    title: string;
    type: "AUCTION_SHEET" | "JEVIC" | "MPI" | "MR2A";
    refNumber: string;
    details: string;
  } | null>(null);

  // Vehicle resolution with studio image priority
  const rawVehicle = vehicles.find((v) => v.id === vehicleId || v.stockId === vehicleId);
  const mockMatch = MOCK_VEHICLES.find((m) => m.id === rawVehicle?.id);

  const vehicle: Vehicle | null = useMemo(() => {
    if (!rawVehicle) return null;
    return {
      ...rawVehicle,
      images: mockMatch?.images || rawVehicle.images,
    };
  }, [rawVehicle, mockMatch]);

  // Associated Order (if vehicle is allocated or booked for shipping)
  const targetOrder: Order | undefined = useMemo(() => {
    if (!orders || !vehicle) return undefined;
    return orders.find(
      (o) =>
        o.vehicleId === vehicle.id ||
        o.vehicle?.id === vehicle.id ||
        o.vehicle?.stockId === vehicle.stockId
    );
  }, [orders, vehicle]);

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
    return docs;
  }, [vehicle]);

  // If user opened Amend Details, display full-page AmendVehicleForm
  if (isAmending && vehicle) {
    return (
      <AmendVehicleForm
        vehicleId={vehicle.id}
        onSuccessReturn={() => setIsAmending(false)}
        onViewDetails={() => setIsAmending(false)}
      />
    );
  }

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
            onBack();
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
        >
          Return to Inventory Listing
        </button>
      </div>
    );
  }

  const isAvailable = vehicle.status === "AVAILABLE";
  const isReserved = vehicle.status === "RESERVED";
  const isWithdrawn = vehicle.status === "WITHDRAWN";
  const isDraft = vehicle.status === "DRAFT";
  const isAllocated = Boolean(targetOrder) || vehicle.status === "ALLOCATED";
  const isSold = vehicle.status === "SOLD";

  const reservedDealer = vehicle.reservedByDealerId
    ? dealers.find((d) => d.id === vehicle.reservedByDealerId)
    : null;

  const handlePublish = () => {
    audio.playSuccessChime();
    setVehicleStatus(vehicle.id, "AVAILABLE", "Published unit to central New Zealand dealer catalogue");
    setActionNotice(`Unit #${vehicle.stockId} is now LIVE in the central catalogue.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleWithdrawConfirm = () => {
    audio.playSubtleClick();
    setVehicleStatus(vehicle.id, "WITHDRAWN", withdrawReason);
    setIsWithdrawModalOpen(false);
    setActionNotice(`Unit #${vehicle.stockId} withdrawn from catalogue.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleMarkSold = () => {
    audio.playSuccessChime();
    setVehicleStatus(vehicle.id, "SOLD", "Delivered and handed over to dealer inventory");
    setActionNotice(`Unit #${vehicle.stockId} marked as SOLD / DELIVERED.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans text-slate-800 max-w-8xl mx-auto">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Bar: Back Action, Status & Management Actions     */}
      {/* (Consistent layout and styles matching /dealer/stocks)      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Left Side: Back Navigation & Action Notice */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onBack();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs hover:border-slate-300 group cursor-pointer transition-all active:scale-95"
            title="Go back to inventory"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Inventory</span>
          </button>

          {/* Action Notice Toast */}
          {actionNotice && (
            <div className="px-3.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-soft animate-in fade-in flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>

        {/* Right Side: Status Badges & Operational Actions */}
        <div className="flex items-center gap-2 flex-wrap max-w-full sm:shrink-0 justify-start sm:justify-end">
          {/* Staging Yard Tag */}
          <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <MapPin className="w-3.5 h-3.5 text-[#C3002F]" />
            <span className="text-slate-400 font-normal">Staging Yard:</span>
            <span className="font-semibold text-slate-800">{vehicle.location || "Yokohama Export Terminal"}</span>
          </div>

          {/* Status Badges */}
          {isAvailable && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Available to NZ Franchise</span>
            </span>
          )}
          {isDraft && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-slate-100 text-slate-700 border-slate-300 shadow-2xs">
              <Edit3 className="w-3 h-3 text-slate-500 shrink-0" />
              <span>Draft Intake (Yard Staging)</span>
            </span>
          )}
          {isReserved && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-300 shadow-2xs">
              <Lock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Dealer 24h Exclusivity Hold</span>
            </span>
          )}
          {isAllocated && (
            <div className="flex items-center gap-2 flex-wrap max-w-full">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-sky-50 text-sky-700 border-sky-200 shadow-2xs">
                <Ship className="w-3 h-3 text-sky-600 shrink-0" />
                <span>Allocated &amp; Shipping Secured</span>
              </span>
              {targetOrder && (
                <span className="hidden sm:inline-flex text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs shrink-0">
                  {getRoRoMilestoneLabel(targetOrder.currentMilestone).displayBadge}
                </span>
              )}
            </div>
          )}
          {isWithdrawn && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-rose-50 text-rose-700 border-rose-200 shadow-2xs">
              <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
              <span>Withdrawn from Catalogue</span>
            </span>
          )}
          {isSold && (
            <span className="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200 shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-purple-600 shrink-0" />
              <span>Sold &amp; Wholesale Settled</span>
            </span>
          )}

          {/* Operational Actions (Nissan Japan & Admin) */}
          {canManageInventory && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  if (onAmend) {
                    onAmend(vehicle.id);
                  } else {
                    setIsAmending(true);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300 text-xs"
                title="Amend vehicle specifications"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Amend Details</span>
              </button>

              {isDraft && (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0A0A0A] hover:bg-[#333333] text-white transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
              )}

              {isAvailable && (
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setIsWithdrawModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Withdraw</span>
                </button>
              )}

              {isWithdrawn && (
                <button
                  type="button"
                  onClick={handlePublish}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0A0A0A] hover:bg-[#333333] text-white transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-publish</span>
                </button>
              )}

              {isAllocated && (
                <button
                  type="button"
                  onClick={handleMarkSold}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0A0A0A] hover:bg-[#333333] text-white transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Handover Complete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hold Reservation Alert Bar if Reserved */}
      {isReserved && (
        <div className="px-5 py-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2 shadow-2xs">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Unit is locked under an active 24-hour exclusivity hold by an authorised New Zealand Franchise Dealer.
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. ROW 1: Studio Showcase (Left 7) vs Commercial Baseline (Right 5) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column (7 cols): Studio Image Showcase Card */}
        <div className="lg:col-span-7 h-full flex flex-col">
          <VehicleShowcaseCard vehicle={vehicle} />
        </div>

        {/* Right Column (5 cols): Japanese Baseline & Terminal Logistics */}
        <div className="lg:col-span-5 h-full flex flex-col">
          <CommercialLandedPricingCard
            vehicle={vehicle}
            roleOverride={isAdmin ? "AUTOHUB_ADMIN" : "NISSAN_JAPAN"}
            onJapanPublish={handlePublish}
            onJapanWithdraw={() => setIsWithdrawModalOpen(true)}
            onJapanAmend={() => (onAmend ? onAmend(vehicle.id) : setIsAmending(true))}
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2.5 Order Corridor Timeline (if Allocated / Ordered)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {targetOrder && (
        <OrderCorridorTimeline order={targetOrder} />
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. VEHICLE STATS CARDS BAR                                  */}
      {/* (VIN, Engine, Transmission, Fuel, ODO, Year, Colour)        */}
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
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              MR2A Pre-Verified
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-800">
            <span>Overall Vehicle Condition:</span>
            <span className="text-emerald-700 font-bold text-xs">
              {vehicle.overallCondition || `★ ${vehicle.auctionGrade || "4.5"} - Clean Japanese Pre-Export Condition`}
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
                  className="flex items-center gap-2.5 text-xs text-slate-500 font-normal"
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
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">JEVIC Pre-Export Verification</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
            PASSED 100%
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Full Layout Card 2: Vehicle Specifications & Listing Tabs */}
      {/* ─────────────────────────────────────────────────────────── */}
      <VehicleSpecificationsTabs vehicle={vehicle} isAdmin={isAdmin} />

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
                    title: doc.name.replace(/_/g, " ").replace(/\.[^/.]+$/, ""),
                    type: (doc.type as any) || "AUCTION_SHEET",
                    refNumber: `${vehicle.stockId}-DOC-${idx + 1}`,
                    details: `Official uploaded documentation for ${vehicle.make} ${vehicle.model} (Stock #${vehicle.stockId}). File: ${doc.name} · Size: ${doc.size || "1.2 MB"} · Uploaded on ${doc.uploadedAt || vehicle.createdAt}. Certified pass.`,
                  });
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer group flex items-start justify-between bg-white shadow-2xs"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-900 group-hover:text-slate-600 transition-colors truncate block" title={doc.name}>
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
              No documents were uploaded while adding this vehicle.
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
      {/* 7. Bottom Return Navigation                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="pt-2 flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            onBack();
          }}
          className="py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all shadow-2xs flex items-center gap-2 cursor-pointer hover:border-slate-300 active:scale-[0.99]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Return to Inventory Listing</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Withdrawal Reason Modal                            */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Withdraw Vehicle from Catalogue
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Stock #{vehicle.stockId} ({vehicle.model})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Withdrawing this vehicle removes it from dealer visibility. Please specify the formal administrative withdrawal justification:
            </p>

            <div className="space-y-2">
              {[
                "Yard Inspection: Cosmetic Paint / Panel Rectification Required",
                "Documentation Hold: Awaiting JEVIC Biosecurity Re-clearance",
                "Commercial Staging: Re-assigned to Corporate Fleet Program",
                "Japanese Recall Campaign: Technical Module Update Required",
              ].map((reason, idx) => (
                <label
                  key={idx}
                  onClick={() => setWithdrawReason(reason)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${withdrawReason === reason
                      ? "border-rose-300 bg-rose-50/60 text-slate-900 font-semibold"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                >
                  <input
                    type="radio"
                    name="withdrawReason"
                    checked={withdrawReason === reason}
                    onChange={() => setWithdrawReason(reason)}
                    className="text-[#C3002F] focus:ring-[#C3002F]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="btn-outline text-xs py-2 px-3.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdrawConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Document Viewer Modal                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeDocPreview.title}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Ref: {activeDocPreview.refNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Digital Pass Body */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Vehicle Unit:</span>
                <strong className="text-slate-900">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </strong>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">VIN / Chassis:</span>
                <strong className="font-mono text-slate-900">{vehicle.vinChassis}</strong>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Verification Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                  PASS / CLEARED
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Inspector Sign-off Notes:</span>
                <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/70 font-mono text-[11px] leading-relaxed">
                  {activeDocPreview.details}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Digitally Signed &amp; Timestamped</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  alert(`Downloading cryptographic digital document PDF for ${activeDocPreview.refNumber}`);
                }}
                className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
