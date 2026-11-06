"use client";

import React, { useState } from "react";
import { Vehicle, UserRole, Order } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useProgramme } from "@/lib/programme-context";
import {
  calculateEstimatedLandedAB,
  JPY_TO_NZD_EXCHANGE_RATE,
} from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import PricingComponentModal from "@/components/common/PricingComponentModal";
import {
  Info,
  Lock,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  Ship,
  Sparkles,
  AlertCircle,
  Edit3,
} from "lucide-react";

interface CommercialLandedPricingCardProps {
  vehicle: Vehicle;
  order?: Order;
  className?: string;
  roleOverride?: UserRole;
  onHoldSuccess?: () => void;
  onOrderSuccess?: () => void;
  // Admin specific callbacks
  onAdminConfirm?: () => void;
  onAdminDecline?: () => void;
  onAdminMarkSold?: () => void;
  // Japan specific callbacks
  onJapanPublish?: () => void;
  onJapanWithdraw?: () => void;
  onJapanAmend?: () => void;
}

export default function CommercialLandedPricingCard({
  vehicle,
  order,
  className = "",
  roleOverride,
  onHoldSuccess,
  onOrderSuccess,
  onAdminConfirm,
  onAdminDecline,
  onAdminMarkSold,
  onJapanPublish,
  onJapanWithdraw,
  onJapanAmend,
}: CommercialLandedPricingCardProps) {
  const { currentUser, currentDealer } = useAuth();
  const {
    reserveVehicle,
    confirmAllocation,
    releaseHold,
    setVehicleStatus,
    updateVehicle,
    reservations,
    pricingConfig,
  } = useProgramme();

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isEditingFob, setIsEditingFob] = useState(false);
  const [fobInput, setFobInput] = useState<number>(vehicle.fobPriceJPY || 2186175);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Synchronize FOB price input when vehicle updates
  React.useEffect(() => {
    setFobInput(vehicle.fobPriceJPY || 2186175);
  }, [vehicle.fobPriceJPY]);

  // Role resolution strictly per USER_ROLES.md
  const role: UserRole = roleOverride || currentUser?.role || "DEALER_USER";
  const isAdmin = role === "AUTOHUB_ADMIN";
  const isJapan = role === "NISSAN_JAPAN";
  const isProgramme = role === "READONLY_PROGRAMME_USER";
  const isApplicant = role === "DEALER_APPLICANT";
  const isDealer = role === "DEALER_USER" || role === "DEALER_ADMIN";

  // Dynamic Commercial Pricing Calculations strictly [A + B] (Wholesale Auckland port baseline)
  const exchangeRate = pricingConfig?.exchangeRateJPYtoNZD || JPY_TO_NZD_EXCHANGE_RATE;
  const effectiveFobJPY = vehicle.fobPriceJPY || 2186175;

  const { componentA, componentB, totalAB: totalLandedPriceAB } = calculateEstimatedLandedAB(
    effectiveFobJPY,
    exchangeRate
  );

  // Active vehicle status helpers
  const isAvailable = !order && vehicle.status === "AVAILABLE";
  const isReserved = !order && vehicle.status === "RESERVED";
  const isAllocated = Boolean(order) || vehicle.status === "ALLOCATED";
  const isSold =
    (!order && (vehicle.status === "SOLD" || (vehicle.status as any) === "BUYED")) ||
    order?.currentMilestone === "DELIVERED" ||
    vehicle.status === "SOLD";
  const isDraft = !order && vehicle.status === "DRAFT";
  const isWithdrawn = !order && vehicle.status === "WITHDRAWN";

  const isHeldByCurrentDealer =
    isReserved &&
    currentDealer &&
    vehicle.reservedByDealerId === currentDealer.id;

  // Handlers
  const handleHoldVehicle = () => {
    if (!currentDealer) return;
    audio.playSubtleClick();
    reserveVehicle(
      vehicle.id,
      currentDealer.id,
      currentUser ? { id: currentUser.id, name: currentUser.name, email: currentUser.email } : undefined
    );
    setActionNotice("24-Hour Exclusivity Hold activated successfully.");
    setTimeout(() => setActionNotice(null), 4000);
    if (onHoldSuccess) onHoldSuccess();
  };

  const handleSaveFob = () => {
    audio.playSuccessChime();
    updateVehicle(vehicle.id, { fobPriceJPY: Number(fobInput) });
    setIsEditingFob(false);
    setActionNotice("FOB acquisition baseline updated.");
    setTimeout(() => setActionNotice(null), 3500);
  };

  // ─────────────────────────────────────────────────────────────
  // 1. JAPAN PORTAL VIEW: Staging & Technical Logistics Baseline
  // (Strict Confidentiality: Zero NZ landed pricing, zero NZ margins, zero dealer names)
  // ─────────────────────────────────────────────────────────────
  if (isJapan) {
    return (
      <div
        className={`bg-white rounded-2xl p-4 sm:p-6 md:p-7 border border-slate-200/90 shadow-2xs h-full flex flex-col justify-between space-y-4 ${className}`}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div>
              <div className="text-slate-500 font-bold text-xs tracking-widest uppercase">
                NISSAN JAPAN
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
                Japanese Export Baseline
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
              title="Pricing Policy Information"
              aria-label="View pricing policy information"
            >
              <Info className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>

          {/* Hero JPY Price */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight font-mono">
                ¥{effectiveFobJPY.toLocaleString()}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-500 font-mono">
                JPY (FOB Baseline)
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Yokohama / Kobe Export Terminal baseline prior to RoRo carrier embarkation.
            </p>
          </div>

          <div className="border-b border-slate-100 my-2" />

          {/* Breakdown Items */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">
                    Vehicle Acquisition (Auction Baseline)
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Official Japan auction settlement &amp; de-registration
                  </div>
                </div>
              </div>
              <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                ¥{Math.round(effectiveFobJPY * 0.92).toLocaleString()}
              </span>
            </div>

            <div className="border-b border-slate-100" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 leading-tight">
                    Pre-Export Inspection &amp; Certification
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    JEVIC digital odometer check &amp; export customs
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                  ¥{Math.round(effectiveFobJPY * 0.08).toLocaleString()}
                </span>
                <span className="block text-[10px] font-bold text-slate-600 uppercase">
                  VERIFIED
                </span>
              </div>
            </div>
          </div>

          {/* Staging Yard Highlight */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Export Terminal Yard:</span>
            <span className="font-bold text-slate-900 font-mono">
              {vehicle.location || "Yokohama Export Terminal (Bay 4)"}
            </span>
          </div>
        </div>

        {/* Japan Operational Actions */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2.5">
            {onJapanAmend && (
              <button
                type="button"
                onClick={onJapanAmend}
                className="flex-1 py-3 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-800 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>Amend Specs</span>
              </button>
            )}

            {isDraft && onJapanPublish && (
              <button
                type="button"
                onClick={onJapanPublish}
                className="flex-1 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publish to NZ</span>
              </button>
            )}

            {isAvailable && onJapanWithdraw && (
              <button
                type="button"
                onClick={onJapanWithdraw}
                className="flex-1 py-3 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <AlertCircle className="w-4 h-4 text-slate-500" />
                <span>Withdraw Unit</span>
              </button>
            )}

            {isWithdrawn && onJapanPublish && (
              <button
                type="button"
                onClick={onJapanPublish}
                className="flex-1 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Re-publish</span>
              </button>
            )}
          </div>
        </div>

        <PricingComponentModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          vehicle={vehicle}
          componentA={componentA}
          componentB={componentB}
          roleOverride="NISSAN_JAPAN"
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. DEALER, ADMIN & PROGRAMME VIEW: Official Landed Price (A + B)
  // (Calm, High-Contrast Corporate B2B Palette per DESIGN.md)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-6 md:p-7 border border-slate-200/90 shadow-2xs h-full flex flex-col justify-between space-y-4 ${className}`}
    >
      <div className="space-y-3.5">
        {/* Top Header: Brand Wordmark + Title + Info Icon in Unified Aligned Row */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-slate-800 font-bold text-base uppercase shrink-0">
              NISSAN
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setIsPricingModalOpen(true);
            }}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer shrink-0"
            title="Click to view Pricing Component breakdown"
            aria-label="View Pricing Component breakdown"
          >
            <Info className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Hero Price Display (Obsidian Black & Monospace per Brand Standard) */}
        {isApplicant ? (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Lock className="w-4 h-4 text-slate-600" />
              <span>Commercial Pricing Restricted</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confidential wholesale rates are restricted to verified Nissan NZ franchise dealers. Unlocks upon Autohub account approval.
            </p>
          </div>
        ) : (
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 tracking-tight font-mono">
              ${totalLandedPriceAB.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-500 font-sans">
              NZD
            </span>
          </div>
        )}

        <div className="border-b border-slate-100 my-1" />

        {/* Row A: Vehicle & Export Cost */}
        <div className="flex items-start justify-between gap-3 py-1">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
              A
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                Vehicle &amp; Export Cost
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Purchase price, export, documentation (Japan)
              </div>
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-900 font-mono text-right shrink-0">
            {isApplicant ? "—" : `$${componentA.toLocaleString()}`}
          </div>
        </div>

        <div className="border-b border-slate-100 my-1" />

        {/* Row B: Fixed NZ Import & Compliance Fee */}
        <div className="flex items-start justify-between gap-3 py-1">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
              B
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 leading-tight">
                Fixed NZ Import &amp; Compliance Fee
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Freight, insurance, MPI, biosecurity, border &amp; compliance
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-base sm:text-lg font-bold text-slate-900 font-mono">
              {isApplicant ? "—" : `$${componentB.toLocaleString()}`}
            </div>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold tracking-wider uppercase">
              FIXED
            </span>
          </div>
        </div>

        {/* Highlight Banner: Estimated Landed Price (A + B) (Neutral Elevated Card) */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 my-2 flex items-center justify-between shadow-2xs">
          <div>
            <span className="font-bold text-xs sm:text-base text-slate-900 block leading-tight">
              Estimated Landed Price (A + B)
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Delivered to Auckland port baseline
            </span>
          </div>
          <span className="font-extrabold text-xl sm:text-2xl text-slate-950 font-mono tracking-tight">
            {isApplicant ? "Locked" : `$${totalLandedPriceAB.toLocaleString()}`}
          </span>
        </div>

        {/* Footnote Exclusion */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Delivered to Auckland port baseline. Excludes On-Road Costs (ORC) &amp; dealer retail margin.</span>
        </div>

        {/* Admin FOB Baseline Panel */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">FOB Baseline:</span>
              {isEditingFob ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={fobInput}
                    onChange={(e) => setFobInput(Number(e.target.value))}
                    className="w-24 px-2 py-0.5 rounded border border-slate-300 font-mono text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleSaveFob}
                    className="px-2 py-0.5 rounded bg-slate-900 text-white text-[11px] font-bold"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingFob(false)}
                    className="text-slate-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800">
                  <span>¥{effectiveFobJPY.toLocaleString()} JPY</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingFob(true)}
                    className="text-[11px] text-slate-500 hover:text-slate-900 underline"
                  >
                    (Edit)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. Action Buttons Section (Single Primary Red CTA: "A Little Red") */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-soft flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* DEALER ACTIONS (Only approved franchise dealers) */}
        {isDealer && !isApplicant && (
          <>
            {/* Single Focused Primary CTA: Hold Vehicle (24h) in Dark Brand Color */}
            {isAvailable && (
              <button
                type="button"
                onClick={handleHoldVehicle}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Lock className="w-4 h-4" />
                <span>Hold Vehicle (24h)</span>
              </button>
            )}

            {isHeldByCurrentDealer && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                    <span>Your 24h Exclusivity Hold is Active</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                    LOCKED
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    confirmAllocation(vehicle.id, "Wholesale order confirmed by franchise dealer");
                    setActionNotice("Vehicle added to Wholesale Order pipeline.");
                    setTimeout(() => setActionNotice(null), 4000);
                    if (onOrderSuccess) onOrderSuccess();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Proceed to Wholesale Order</span>
                </button>
              </div>
            )}

            {isReserved && !isHeldByCurrentDealer && (
              <div className="w-full py-3.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Locked under 24h Exclusivity Hold</span>
              </div>
            )}

            {isAllocated && (
              <div className="w-full py-3.5 px-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                <Ship className="w-4 h-4 text-slate-500" />
                <span>Allocated &amp; Scheduled for Shipping</span>
              </div>
            )}

            {isSold && (
              <div className="w-full py-3.5 px-4 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span>Wholesale Settled</span>
              </div>
            )}
          </>
        )}

        {/* DEALER APPLICANT VIEW (Strictly restricted per USER_ROLES.md) */}
        {isApplicant && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs space-y-1.5">
            <span className="font-semibold flex items-center gap-2 text-slate-900">
              <Lock className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Dealership Application Pending Approval</span>
            </span>
            <p className="text-[11px] text-slate-500">
              Autohub vetting is currently in progress. 24-hour holds and order placement are disabled until your franchise accreditation is approved.
            </p>
          </div>
        )}

        {/* AUTOHUB ADMIN ACTIONS (Governance & Logistics Control) */}
        {isAdmin && (
          <div className="space-y-2">
            {isReserved && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onAdminConfirm || (() => confirmAllocation(vehicle.id, "Admin Approved"))}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Order</span>
                </button>
                <button
                  type="button"
                  onClick={onAdminDecline || (() => releaseHold(vehicle.id, "Admin Released"))}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4 text-slate-500" />
                  <span>Decline</span>
                </button>
              </div>
            )}

            {isAllocated && (
              <button
                type="button"
                onClick={onAdminMarkSold || (() => setVehicleStatus(vehicle.id, "SOLD", "Settled"))}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-300" />
                <span>Mark Wholesale Settled</span>
              </button>
            )}

            {isAvailable && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs flex items-center justify-between">
                <span className="font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Available in Open Franchise Stock</span>
                </span>
                <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  CATALOGUE
                </span>
              </div>
            )}
          </div>
        )}

        {/* READONLY PROGRAMME VIEW */}
        {isProgramme && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Programme Compliance Transparency</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
              READ-ONLY
            </span>
          </div>
        )}
      </div>

      {/* Pricing Component Breakdown Modal */}
      <PricingComponentModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        vehicle={vehicle}
        componentA={componentA}
        componentB={componentB}
        roleOverride={role}
      />
    </div>
  );
}
