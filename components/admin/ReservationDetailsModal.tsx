"use client";

import React, { useState, useEffect } from "react";
import { ReservationRequest } from "@/lib/types";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  X,
  Lock,
  Unlock,
  Clock,
  Car,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Copy,
  Check,
  Calendar,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

interface ReservationDetailsModalProps {
  reservation: ReservationRequest | null;
  onClose: () => void;
  onConfirmAllocation?: (vehicleId: string, reason: string) => void;
  onReleaseHold?: (vehicleId: string, reason: string) => void;
  onRejectReservation?: (reservationId: string, reason: string) => void;
}

export default function ReservationDetailsModal({
  reservation,
  onClose,
  onConfirmAllocation,
  onReleaseHold,
  onRejectReservation,
}: ReservationDetailsModalProps) {
  const [copiedVin, setCopiedVin] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<"CONFIRM" | "RELEASE" | "REJECT" | null>(null);
  const [reasonInput, setReasonInput] = useState("");

  // Live 24-hr countdown calculation
  useEffect(() => {
    if (!reservation?.expiresAt) return;

    function updateTimer() {
      const now = new Date().getTime();
      const expiry = new Date(reservation!.expiresAt).getTime();
      const diff = Math.max(0, expiry - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [reservation]);

  if (!reservation) return null;

  const vehicle = reservation.vehicle;
  const vehicleImage = vehicle?.images?.[0] || "/images/cars/kicks.png";
  const price = reservation.priceSnapshot || calculateLandedPrice(vehicle?.fobPriceJPY || 2000000, "ZONE_1");

  const handleCopyVin = () => {
    if (!vehicle?.vinChassis) return;
    navigator.clipboard.writeText(vehicle.vinChassis);
    audio.playSubtleClick();
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const handleExecuteAction = () => {
    if (confirmDialog === "CONFIRM" && onConfirmAllocation) {
      audio.playSuccessChime();
      onConfirmAllocation(
        reservation.vehicleId,
        reasonInput || "Wholesale allocation confirmed by Autohub Ops."
      );
      onClose();
    } else if (confirmDialog === "RELEASE" && onReleaseHold) {
      audio.playSubtleClick();
      onReleaseHold(
        reservation.vehicleId,
        reasonInput || "Exclusivity hold released back to catalogue."
      );
      onClose();
    } else if (confirmDialog === "REJECT" && onRejectReservation) {
      audio.playSubtleClick();
      onRejectReservation(
        reservation.id,
        reasonInput || "Reservation declined during administrative review."
      );
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400">
                  {reservation.requestId}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    reservation.status === "ACTIVE_HOLD"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      : reservation.status === "CONFIRMED_ALLOCATED"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : "bg-slate-700 text-slate-300 border-slate-600"
                  }`}
                >
                  {reservation.status === "ACTIVE_HOLD"
                    ? "24-Hour Exclusivity Active"
                    : reservation.status}
                </span>
              </div>
              <h2 id="reservation-details-title" className="text-lg font-bold text-white tracking-tight">
                Reservation Dossier · {vehicle?.year} {vehicle?.make} {vehicle?.model}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 24-Hour Exclusivity Countdown Banner */}
          {reservation.status === "ACTIVE_HOLD" && timeLeft && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Atomic Hold Exclusivity Window
                  </h3>
                  <p className="text-slate-500 text-[11px]">
                    Vehicle is exclusive to {reservation.dealerName}. Other dealers cannot reserve or purchase.
                  </p>
                </div>
              </div>

              {/* Countdown Digits */}
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-amber-200/90 shadow-2xs self-start sm:self-auto font-mono">
                <div className="text-center">
                  <div className="text-base font-black text-amber-700 leading-tight">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">Hours</div>
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="text-center">
                  <div className="text-base font-black text-amber-700 leading-tight">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">Mins</div>
                </div>
                <span className="text-amber-500 font-bold">:</span>
                <div className="text-center">
                  <div className="text-base font-black text-amber-700 leading-tight">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] text-slate-400 uppercase">Secs</div>
                </div>
              </div>
            </div>
          )}

          {/* 2-Column: Vehicle Details & Reserving Dealer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vehicle Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  <span>Locked Stock Specification</span>
                </h3>
                <span className="font-mono text-xs font-bold text-slate-700">#{vehicle?.stockId}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-28 h-20 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                  <img
                    src={vehicleImage}
                    alt={vehicle?.model || "Vehicle"}
                    className="w-full h-full object-contain filter drop-shadow-xs"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {vehicle?.year} {vehicle?.make} {vehicle?.model}
                  </h4>
                  <p className="text-slate-500 text-xs">
                    {vehicle?.grade} · {vehicle?.fuelType}
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    {vehicle?.odometerKm?.toLocaleString()} km · Grade {vehicle?.auctionGrade}
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Chassis / VIN:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-slate-900">{vehicle?.vinChassis}</span>
                    <button
                      type="button"
                      onClick={handleCopyVin}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Copy VIN"
                    >
                      {copiedVin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Japanese Location:</span>
                  <span className="font-semibold text-slate-800">{vehicle?.location || "Yokohama Yard (Bay 2)"}</span>
                </div>
              </div>
            </div>

            {/* Reserving Dealership Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reserving Franchisee</span>
                </h3>
                <span className="font-mono text-xs font-bold text-slate-700">{reservation.dealerCode}</span>
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {reservation.dealerName}
                </h4>
                <p className="text-slate-500 text-xs">
                  Authorized Buyer: <strong className="text-slate-800">{reservation.userName}</strong> ({reservation.userEmail})
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Pricing Zone:</span>
                  <span className="font-mono font-bold text-slate-900">{price.zoneId}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Requested Timestamp:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(reservation.requestedAt).toLocaleString("en-NZ")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Lock Expiry:</span>
                  <span className="font-mono font-bold text-amber-700">
                    {new Date(reservation.expiresAt).toLocaleString("en-NZ")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Boundary Acknowledged:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Yes (Section 4 Rate)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4 Landed Buy Price Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Guaranteed Landed Price Snapshot (Section 4 Commercial Contract)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Locked FOB JPY</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  ¥{(vehicle?.fobPriceJPY || 2000000).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">${price.fobNZD.toLocaleString()} NZD</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Logistics &amp; Freight</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  ${(price.oceanFreightNZD + price.zoneDeliveryNZD).toLocaleString()} NZD
                </div>
                <span className="text-[10px] text-slate-500">Ocean + {price.zoneId} Tow</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customs &amp; Compliance</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  ${(price.customsProcessingNZD + price.complianceInspectionNZD).toLocaleString()} NZD
                </div>
                <span className="text-[10px] text-slate-500">Border + MR2A Pass</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Total Landed Price</span>
                <div className="font-mono font-black text-[#E11D48] text-base mt-0.5">
                  ${price.totalBuyPriceNZD.toLocaleString()} NZD
                </div>
                <span className="text-[10px] text-rose-600 font-semibold">Excl. GST (Protected)</span>
              </div>
            </div>
          </div>

          {/* Confirm Dialog Input */}
          {confirmDialog && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
              <h4 className="font-bold text-slate-900 text-xs">
                {confirmDialog === "CONFIRM"
                  ? "Confirm Wholesale Allocation & Generate Order"
                  : confirmDialog === "RELEASE"
                  ? "Release Hold Back to Available Stock"
                  : "Decline Dealer Reservation"}
              </h4>
              <input
                type="text"
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Enter operational note or audit reason..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs cursor-pointer shadow-xs ${
                    confirmDialog === "CONFIRM"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : confirmDialog === "RELEASE"
                      ? "bg-slate-900 hover:bg-slate-800"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Execute {confirmDialog}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {reservation.status === "ACTIVE_HOLD" ? (
              <span className="text-amber-800 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Central Wholesale Authority: Dealer locked against price escalation for 24h</span>
              </span>
            ) : (
              <span className="text-slate-600">
                Decision: {reservation.decision || reservation.status} ({reservation.decisionReason || "Completed"})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {reservation.status === "ACTIVE_HOLD" && !confirmDialog && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog("RELEASE");
                    setReasonInput("Released back to catalogue by Autohub Ops.");
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Release Hold</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog("CONFIRM");
                    setReasonInput("Wholesale allocation confirmed by Autohub Ops.");
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Allocation</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
