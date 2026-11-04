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
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Building2,
  Sparkles,
  Ship,
  MapPin,
  Calendar,
  Lock,
} from "lucide-react";

interface DirectAllocationModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSuccess?: (vehicleId: string) => void;
}

export default function DirectAllocationModal({
  vehicle,
  onClose,
  onSuccess,
}: DirectAllocationModalProps) {
  const router = useRouter();
  const { currentUser, currentDealer } = useAuth();
  const { confirmAllocation, pricingConfig } = useProgramme();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [ackTerms, setAckTerms] = useState(false);

  if (!vehicle) return null;

  const dealerZone = currentDealer?.pricingZoneId || "ZONE_1";
  const price: LandedPriceBreakdown = calculateLandedPrice(
    vehicle.fobPriceJPY,
    dealerZone,
    pricingConfig
  );

  const handleConfirmAllocation = () => {
    if (!ackTerms) return;
    setIsSubmitting(true);
    audio.playSubtleClick();

    setTimeout(() => {
      const generatedOrderId = `ORD-NZ-2026-${Math.floor(100 + Math.random() * 900)}`;
      setOrderId(generatedOrderId);

      // Trigger programme context allocation
      confirmAllocation(
        vehicle.id,
        `Direct wholesale allocation by franchise dealer: ${currentDealer?.legalTradingName || "Dealership"}`
      );

      setIsSubmitting(false);
      setIsSuccess(true);
      audio.playSuccessChime();

      if (onSuccess) {
        onSuccess(vehicle.id);
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[94vh] flex flex-col bg-white rounded-[16px] shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Clean Executive Light Header */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 shadow-2xs">
              <Ship className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900">Direct Vehicle Allocation</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Wholesale Order Commitment
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Immediate Allocation to Dealership Supply Pipeline</p>
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
          <div className="p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vehicle Successfully Allocated</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Allocation Confirmed &amp; Logged
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                <strong className="text-slate-900">{vehicle.year} {vehicle.make} {vehicle.model}</strong> (VIN:{" "}
                <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">
                  {vehicle.vinChassis}
                </code>
                ) has been assigned to <strong className="text-slate-900">{currentDealer?.legalTradingName || "Your Dealership"}</strong>.
              </p>
            </div>

            {/* Order Reference Pill */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-semibold text-slate-500">Wholesale Order Number:</span>
                <span className="font-mono font-bold text-slate-900">{orderId}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Fixed Landed Buy Price:</span>
                <strong className="text-slate-900 font-mono">${price.totalBuyPriceNZD.toLocaleString()} NZD</strong>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Logistics Status:</span>
                <span className="text-emerald-700 font-semibold">ORDER_CONFIRMED · Marshalling Yard</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  onClose();
                  router.push("/dealer/orders");
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <span>View in Orders &amp; Logistics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Continue Browsing Stock</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Vehicle Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 flex items-center gap-4">
              <div className="w-24 h-16 shrink-0 flex items-center justify-center">
                <img
                  src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                  alt={vehicle.model}
                  className="w-full h-full object-contain filter drop-shadow-sm select-none"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-semibold">
                    #{vehicle.stockId}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Grade {vehicle.auctionGrade}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h4>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  VIN: {vehicle.vinChassis} · {vehicle.odometerKm.toLocaleString()} km
                </p>
              </div>
            </div>

            {/* Landed Commercial Details */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-600">Fixed Landed Buy Price ({dealerZone})</span>
                <span className="text-base font-bold font-mono text-slate-900">
                  ${price.totalBuyPriceNZD.toLocaleString()} <span className="text-xs font-normal text-slate-500">NZD</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Japan FOB Acquisition</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>RoRo Ocean Freight &amp; Marine</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>NZ Customs &amp; 15% GST</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>MR2A &amp; 1-Year WoF Pass</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>2 Carrier Movements to Dealership Depot</span>
                </div>
              </div>
            </div>

            {/* Dealership Destination */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span className="font-semibold">{currentDealer?.legalTradingName || "Dealership"}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Code: {currentDealer?.dealerCode || "NZ-NIS-001"}
              </span>
            </div>

            {/* Allocation Agreement Checkbox */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${ackTerms
                ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20"
                : "bg-white border-slate-200 hover:border-slate-300"
                }`}
            >
              <input
                type="checkbox"
                checked={ackTerms}
                onChange={(e) => setAckTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-slate-900 focus:ring-slate-900 border-slate-300 shrink-0 cursor-pointer"
              />
              <span className="text-xs text-slate-700 leading-snug">
                I authorize immediate <strong className="text-slate-900 font-bold">Direct Wholesale Allocation</strong> of this vehicle under the <strong className="text-slate-900 font-bold">Nissan NZ Terms of Trade</strong>. Vehicle will transition immediately from stock to active dealership order. *
              </span>
            </label>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAllocation}
                disabled={!ackTerms || isSubmitting}
                className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${ackTerms && !isSubmitting
                  ? "bg-[#0A0A0A] hover:bg-[#27272A] text-white hover:shadow-soft active:scale-[0.98]"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
              >
                <Ship className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Allocating..." : "Confirm Vehicle Allocation"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

