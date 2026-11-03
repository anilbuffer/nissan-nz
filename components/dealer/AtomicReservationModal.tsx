"use client";

import React, { useState } from "react";
import { Vehicle, LandedPriceBreakdown } from "@/lib/types";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { useAuth } from "@/lib/auth-context";
import { audio } from "@/lib/sound";
import {
  X,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building2,
  Lock,
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
  const { currentDealer } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!vehicle) return null;

  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";
  const price: LandedPriceBreakdown = calculateLandedPrice(vehicle.fobPriceJPY, dealerZone);

  const handleConfirmReservation = () => {
    setIsSubmitting(true);
    audio.playSubtleClick();

    // Simulate atomic server transaction check
    setTimeout(() => {
      audio.playSuccessChime();
      setIsSubmitting(false);
      setIsSuccess(true);
      onSuccess(vehicle.id);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-hover border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A1322] text-white flex items-center justify-between border-b border-[#1B2A42]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-crimson-600 flex items-center justify-center font-bold text-white text-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Atomic Vehicle Reservation</h3>
              <p className="text-[10px] text-slate-400">Nissan NZ Programme Concurrency Lock</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B2A42] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-soft">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-extrabold text-slate-900">Reservation Confirmed!</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                <strong className="text-slate-900">{vehicle.make} {vehicle.model}</strong> ({vehicle.stockId}) has been locked to{" "}
                <strong className="text-slate-900">{currentDealer?.legalTradingName || "Your Dealership"}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs space-y-1.5 text-amber-900">
              <div className="font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>24-Hour Administrative Holding Lock</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                This vehicle is now held exclusively for your dealership. Autohub operations will verify and allocate the unit to generate your formal order milestones within 24 hours.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-soft cursor-pointer"
            >
              View in My Orders & Reservations
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto navy-scrollbar">
            {/* Vehicle Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-4">
              <img
                src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                alt={vehicle.model || "Vehicle"}
                className="w-20 h-14 object-contain rounded-xl border border-slate-200 bg-white p-1 shrink-0"
              />
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-bold text-slate-900 truncate">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  Stock: {vehicle.stockId} · Grade {vehicle.auctionGrade}
                </div>
                <div className="text-emerald-700 font-bold font-mono mt-0.5">
                  ${price.totalBuyPriceNZD.toLocaleString()} NZD (Zone 1 Landed)
                </div>
              </div>
            </div>

            {/* Active Commercial Acknowledgement Matrix (US-12) */}
            <div className="space-y-3 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Reservation Commitment (US-12)
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Authorized Dealer:</span>
                  <strong className="text-slate-900">Auckland Nissan (NZ-NIS-AKL01)</strong>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Commercial Zone:</span>
                  <span className="text-slate-900">Zone 1 - Upper North Island</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Terms Version:</span>
                  <span className="font-mono text-slate-900">v2026.1 Acknowledged</span>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-1.5">
                  <span>Guaranteed Landed Total:</span>
                  <strong className="text-slate-900 font-mono text-sm">
                    ${price.totalBuyPriceNZD.toLocaleString()} NZD
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                By confirming, you request vehicle allocation under the agreed Terms of Trade. If unconfirmed by Autohub or cancelled within 24 hours, the unit automatically returns to available stock.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmReservation}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition-all shadow-soft shadow-crimson-600/20 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Allocation Request</span>
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

