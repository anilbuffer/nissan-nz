"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, LandedPriceBreakdown } from "@/lib/types";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { useAuth } from "@/lib/auth-context";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import {
  X,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  FileCheck2,
  Building2,
  User,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

interface AtomicReservationModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess: (vehicleId: string) => void;
}

export default function AtomicReservationModal({
  vehicle,
  onClose,
  onSuccess,
}: AtomicReservationModalProps) {
  const router = useRouter();
  const { currentUser, currentDealer } = useAuth();
  const { reserveVehicle, pricingConfig, reservationConfig } = useProgramme();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  // US-12 Mandatory Dual Checkbox Acknowledgements
  const [ackTermsAndPrice, setAckTermsAndPrice] = useState(false);
  const [ackCancellationStatement, setAckCancellationStatement] = useState(false);

  if (!vehicle) return null;

  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";
  const price: LandedPriceBreakdown = calculateLandedPrice(
    vehicle.fobPriceJPY,
    dealerZone,
    pricingConfig
  );
  const defaultHours = reservationConfig?.defaultHoldHours || 24;

  const handleConfirmReservation = () => {
    if (!ackTermsAndPrice || !ackCancellationStatement) return;
    setIsSubmitting(true);
    setConflictError(null);
    audio.playSubtleClick();

    // Atomic Concurrency Prevention (US-13)
    setTimeout(() => {
      const dealerId = currentDealer?.id || "DEALER_001";
      const success = reserveVehicle(
        vehicle.id,
        dealerId,
        currentUser
          ? { id: currentUser.id, name: currentUser.name, email: currentUser.email }
          : undefined
      );

      setIsSubmitting(false);

      if (!success) {
        audio.playWarningChime();
        setConflictError(
          "Double Reservation Prevented: Another authorized dealer placed an exclusivity lock or this vehicle status changed moments ago. Concurrency lock secured the catalogue."
        );
      } else {
        audio.playSuccessChime();
        setIsSuccess(true);
        onSuccess(vehicle.id);
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Clean Executive Light Header */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-800 shadow-2xs">
              <Lock className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Vehicle Exclusivity Reservation</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  24h Exclusivity
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Atomic Concurrency Lock &amp; Landed Price Commitment</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          /* ──────── SUCCESS CONFIRMATION SCREEN ──────── */
          <div className="p-6 sm:p-8 text-center space-y-5 overflow-y-auto animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-soft">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-mono">
                REQ-RES-{vehicle.stockId}
              </span>
              <h4 className="text-xl font-bold text-slate-900 pt-1">
                24-Hour Exclusivity Reservation Secured!
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                <strong className="text-slate-900">{vehicle.year} {vehicle.make} {vehicle.model}</strong> ({vehicle.stockId}) has been reserved with atomic exclusivity for{" "}
                <strong className="text-slate-900">{currentDealer?.legalTradingName || "Your Dealership"}</strong>.
              </p>
            </div>

            {/* Reservation Details Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Guaranteed Buy Price (Zone Landed):</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${price.totalBuyPriceNZD.toLocaleString()} NZD
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Exclusivity Window:</span>
                <span className="font-mono text-emerald-700 font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {defaultHours} Hours Active Reservation
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Terms of Trade Version:</span>
                <span className="font-mono text-slate-700 font-bold">v2026.1 Acknowledged</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Ordering Buyer Contact:</span>
                <span className="text-slate-800 font-medium">{currentUser?.name || currentDealer?.primaryContactName}</span>
              </div>
            </div>

            {/* Next Steps Info Box */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-left text-xs space-y-1 text-amber-900">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Wholesale Allocation Review</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Autohub operations will review this reservation and issue your confirmed order milestones within the {defaultHours}-hour exclusivity window. You may cancel without penalty under Section 6.2 before allocation confirmation.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  onClose();
                  router.push("/dealer/orders");
                }}
                className="w-full sm:flex-1 py-2.5 px-4 bg-[#0A0A0A] hover:bg-[#444444] text-white rounded-xl font-bold text-xs transition-colors shadow-soft cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View in Orders &amp; Reservations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          /* ──────── RESERVATION SUBMISSION FORM ──────── */
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto navy-scrollbar">
            {/* Concurrency Error Banner (US-13) */}
            {conflictError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Double Reservation Collision Avoided</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  {conflictError}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] transition-colors cursor-pointer"
                  >
                    Close &amp; Choose Available Stock
                  </button>
                </div>
              </div>
            )}

            {/* Vehicle Summary Compact Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3.5">
              <img
                src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                alt={vehicle.model || "Vehicle"}
                className="w-20 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
              />
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-bold text-slate-900 truncate">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate mt-0.5">
                  Stock #{vehicle.stockId} · Grade {vehicle.auctionGrade} · {vehicle.odometerKm.toLocaleString()} km
                </div>
                <div className="text-slate-500 font-mono text-[10px] truncate">
                  VIN/Chassis: <span className="text-slate-800 font-bold">{vehicle.vinChassis}</span>
                </div>
              </div>
            </div>

            {/* Landed Pricing Snapshot (US-12 Guaranteed Landed Basis) */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2.5 text-xs shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                  Guaranteed Landed Price Basis
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold border border-emerald-200">
                  {dealerZone} Commercial Matrix
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>FOB Japan Base (¥{vehicle.fobPriceJPY.toLocaleString()} converted):</span>
                  <span className="font-mono text-slate-900">${price.fobNZD.toLocaleString()} NZD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ocean Freight &amp; RoRo Transit:</span>
                  <span className="font-mono text-slate-900">${price.oceanFreightNZD.toLocaleString()} NZD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Customs Processing &amp; 15% GST:</span>
                  <span className="font-mono text-slate-900">${(price.customsProcessingNZD + price.gstNZD).toLocaleString()} NZD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>NZ Entry Compliance &amp; WoF Certification:</span>
                  <span className="font-mono text-slate-900">${price.complianceInspectionNZD.toLocaleString()} NZD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Dedicated Zone Delivery ({dealerZone}):</span>
                  <span className="font-mono text-slate-900">${price.zoneDeliveryNZD.toLocaleString()} NZD</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Nissan Used Vehicle Programme Margin:</span>
                  <span className="font-mono text-slate-900">${price.programmeFeeNZD.toLocaleString()} NZD</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold border-t border-slate-100 pt-1.5 text-xs">
                  <span>Total Guaranteed Landed Buy Price:</span>
                  <span className="font-mono text-sm text-[#C3002F] font-bold">
                    ${price.totalBuyPriceNZD.toLocaleString()} NZD
                  </span>
                </div>
              </div>
            </div>

            {/* Dealer & Buyer Identification (US-12) */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Authorized Dealership:</span>
                </span>
                <strong className="text-slate-900">
                  {currentDealer?.legalTradingName || "Auckland Nissan City Ltd"} ({currentDealer?.dealerCode || "NZ-NIS-AKL01"})
                </strong>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ordering Buyer User:</span>
                </span>
                <span className="text-slate-800 font-medium">
                  {currentUser?.name || "David Miller"} ({currentUser?.email || "buyer@aucklandnissan.co.nz"})
                </span>
              </div>
              <div className="flex justify-between text-slate-600 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reservation Exclusivity Window:</span>
                </span>
                <span className="font-mono text-slate-900 font-bold">
                  {defaultHours} Hours Exclusivity Lock
                </span>
              </div>
            </div>

            {/* Mandatory Dual Acknowledgment Checkboxes (US-12) */}
            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={ackTermsAndPrice}
                  onChange={(e) => {
                    audio.playSubtleClick();
                    setAckTermsAndPrice(e.target.checked);
                  }}
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <div className="text-[11px] text-slate-700 leading-snug">
                  <strong className="text-slate-900 block font-semibold mb-0.5">
                    1. Specification &amp; Price Confirmation (Terms of Trade v2026.1)
                  </strong>
                  I verify the vehicle specifications, VIN ({vehicle.vinChassis}), and ordering dealership credentials, and agree to the guaranteed landed total of{" "}
                  <strong className="text-slate-900 font-mono">${price.totalBuyPriceNZD.toLocaleString()} NZD</strong> subject to programme Terms of Trade v2026.1.
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={ackCancellationStatement}
                  onChange={(e) => {
                    audio.playSubtleClick();
                    setAckCancellationStatement(e.target.checked);
                  }}
                  className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                />
                <div className="text-[11px] text-slate-700 leading-snug">
                  <strong className="text-slate-900 block font-semibold mb-0.5">
                    2. Section 6.2 Cancellation Statement
                  </strong>
                  I acknowledge that submitting this request establishes an exclusive {defaultHours}-hour reservation. If cancelled prior to Autohub allocation confirmation or expired without confirmation, no financial penalty applies and the unit returns to available stock.
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all cursor-pointer text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting || !ackTermsAndPrice || !ackCancellationStatement}
                onClick={handleConfirmReservation}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer ${ackTermsAndPrice && ackCancellationStatement
                    ? "bg-[#0A0A0A] hover:bg-[#27272A] text-white hover:shadow-soft active:scale-[0.98]"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Vehicle Reservation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
