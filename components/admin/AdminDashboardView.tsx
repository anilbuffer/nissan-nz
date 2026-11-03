"use client";

import React, { useState } from "react";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import DealerDetailsModal from "./DealerDetailsModal";
import ReservationDetailsModal from "./ReservationDetailsModal";
import { ReservationRequest, DealerAccount, ZoneId } from "@/lib/types";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import {
  Building2,
  Lock,
  Unlock,
  CheckCircle2,
  ArrowRight,
  Clock,
  Eye,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

interface AdminDashboardViewProps {
  onNavigateTab: (tabId: string) => void;
}

export default function AdminDashboardView({ onNavigateTab }: AdminDashboardViewProps) {
  const {
    vehicles,
    dealers,
    reservations,
    approveDealer,
    rejectDealer,
    confirmAllocation,
    releaseHold,
  } = useProgramme();

  const [notification, setNotification] = useState<string | null>(null);
  const [selectedDealerForDetails, setSelectedDealerForDetails] = useState<DealerAccount | null>(null);
  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);

  // Decline Reason Note Modal State
  const [declineTargetDealer, setDeclineTargetDealer] = useState<DealerAccount | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // 1. Pending Dealer Onboarding Requests (Always guarantee realistic requests)
  const pendingDealers = dealers.filter((d) => d.status === "PENDING_APPROVAL");

  // 2. Active 24-Hour Atomic Reservation Holds
  const activeHolds = reservations.filter((r) => r.status === "ACTIVE_HOLD");
  const heldVehicles = (activeHolds.length > 0
    ? activeHolds.map((r) => {
      const live = vehicles.find((v) => v.id === r.vehicleId || v.id === r.vehicle?.id);
      const mock = MOCK_VEHICLES.find((m) => m.id === live?.id || m.id === r.vehicleId);
      return {
        ...r.vehicle,
        ...live,
        images: mock?.images || live?.images || r.vehicle?.images || ["/images/cars/kicks.png"],
      };
    })
    : vehicles.filter((v) => v.status === "RESERVED").map((v) => {
      const mock = MOCK_VEHICLES.find((m) => m.id === v.id);
      return {
        ...v,
        images: mock?.images || v.images || ["/images/cars/kicks.png"],
      };
    })
  );


  // Dealer Approval Handler
  const handleApprove = (dealerId: string, defaultZone: ZoneId) => {
    audio.playSuccessChime();
    approveDealer(dealerId, defaultZone);
    setNotification(`Dealership application approved and assigned to ${defaultZone}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Dealer Decline Confirm Handler (with reason note)
  const handleConfirmDecline = () => {
    if (!declineTargetDealer) return;
    audio.playSubtleClick();
    const reasonText = declineReason.trim() || "No specific reason provided.";
    rejectDealer(declineTargetDealer.id, reasonText);
    setNotification(`Dealership application declined. Reason logged: "${reasonText}".`);
    setDeclineTargetDealer(null);
    setDeclineReason("");
    setTimeout(() => setNotification(null), 5000);
  };

  // 1-Click Confirm Allocation
  const handleConfirmReservation = (vehicleId: string) => {
    audio.playSuccessChime();
    confirmAllocation(vehicleId, "Confirmed directly from Operations Dashboard.");
    setNotification(`Wholesale order confirmed and dispatched to shipping pipeline.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1-Click Release Hold
  const handleReleaseReservation = (vehicleId: string) => {
    audio.playSubtleClick();
    releaseHold(vehicleId, "Hold released from Operations Dashboard.");
    setNotification(`Exclusivity hold released. Vehicle returned to catalogue.`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto animate-in fade-in duration-200 font-sans text-slate-800 pb-12">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Clean Nissan Corporate Operations Bar            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Priority queues for franchise dealer onboarding approvals and 24h exclusivity holds.
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold  flex items-center gap-1.5 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>{pendingDealers.length} Approvals Pending</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold  flex items-center gap-1.5 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>{heldVehicles.length} Active Holds</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-medium flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-sm cursor-pointer p-1"
          >
            ✕
          </button>
        </div>
      )}


      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Section 1: Dealer Onboarding Approval Requests            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Dealer Onboarding Approval Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700  text-xs font-semibold border border-slate-200">
              {pendingDealers.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("admin-dealers")}
            className="text-xs font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Manage Franchisees</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {pendingDealers.length === 0 ? (
          <div className="py-6 px-4 bg-slate-50 rounded-lg text-center text-xs text-slate-500 flex items-center justify-center gap-2 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>All dealer applications processed. No pending authorizations required.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingDealers.map((dealer) => {
              const defaultZone = dealer.pricingZoneId || "ZONE_1";

              return (
                <div
                  key={dealer.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg transition-colors"
                >
                  {/* Left: Minimal Dealer Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {dealer.legalTradingName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          #{dealer.dealerCode}
                        </span>
                        <span className="text-slate-300 hidden sm:inline">·</span>
                        <span className="text-[10px] text-slate-500 hidden sm:inline truncate">
                          {dealer.region}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setSelectedDealerForDetails(dealer);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      Review
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setDeclineTargetDealer(dealer);
                        setDeclineReason("");
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Decline
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(dealer.id, defaultZone)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-slate-800 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-[0.98]"
                    >
                      Authorize
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Section 2: Atomic Reservation Queue Requests            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Atomic Reservation Queue Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700  text-xs font-semibold border border-slate-200">
              {heldVehicles.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("admin-reservations")}
            className="text-xs sm:text-sm font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Manage All Holds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {heldVehicles.length === 0 ? (
          <div className="py-6 px-4 bg-slate-50 rounded-lg text-center text-sm text-slate-500 flex items-center justify-center gap-2 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No active 24h exclusivity holds. All catalogue stock is available.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {heldVehicles.map((vehicle) => {
              const matchingRes = reservations.find(
                (r) => r.vehicleId === vehicle.id && r.status === "ACTIVE_HOLD"
              );
              const dealerName = matchingRes?.dealerName || "Auckland Nissan City Ltd";

              return (
                <div
                  key={vehicle.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg transition-colors"
                >
                  {/* Left: Thumbnail & Minimal Specs */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 sm:w-16 h-10 sm:h-11 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <img
                        src={vehicle.images?.[0] || "/images/cars/note.png"}
                        alt={vehicle.model || "Vehicle"}
                        className="w-full h-full object-contain select-none"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          #{vehicle.stockId}
                        </span>
                        <span className="text-slate-300 hidden sm:inline">·</span>
                        <span className="text-[10px] text-slate-600 hidden sm:inline truncate">
                          {dealerName}
                        </span>
                        <span className="text-slate-300 hidden md:inline">·</span>
                        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#C3002F]" />
                          <span>18h left</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        const r = reservations.find((res) => res.vehicleId === vehicle.id && res.status === "ACTIVE_HOLD") || reservations[0];
                        if (r) setSelectedResForDetails(r);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      Inspect
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReleaseReservation(vehicle.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Release
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmReservation(vehicle.id)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-slate-800 rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-[0.98]"
                    >
                      Confirm Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Decline Dealership Application Reason Note Modal         */}
      {/* ─────────────────────────────────────────────────────────── */}
      {declineTargetDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-[#C3002F] shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Decline Dealership Application
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {declineTargetDealer.legalTradingName} ({declineTargetDealer.dealerCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDeclineTargetDealer(null);
                  setDeclineReason("");
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                Reason for Rejection / Compliance Audit Note <span className="text-[#C3002F]">*</span>
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., NZBN business entity check failed, territorial boundary overlap with existing franchise, or missing authorized signatory."
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 resize-none font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeclineTargetDealer(null);
                  setDeclineReason("");
                }}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!declineReason.trim()}
                onClick={handleConfirmDecline}
                className="px-4 py-2 rounded-lg bg-[#C3002F] hover:bg-[#A10026] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold cursor-pointer transition-all shadow-xs"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dealer Details Dossier Modal */}
      {selectedDealerForDetails && (
        <DealerDetailsModal
          dealer={selectedDealerForDetails}
          onClose={() => setSelectedDealerForDetails(null)}
          onApprove={(did, zid) => handleApprove(did, zid)}
          onReject={(did) => {
            setSelectedDealerForDetails(null);
            const target = dealers.find((d) => d.id === did);
            if (target) {
              setDeclineTargetDealer(target);
              setDeclineReason("");
            }
          }}
        />
      )}

      {/* Reservation Details Dossier Modal */}
      {selectedResForDetails && (
        <ReservationDetailsModal
          reservation={selectedResForDetails}
          onClose={() => setSelectedResForDetails(null)}
          onConfirmAllocation={(vid) => handleConfirmReservation(vid)}
          onReleaseHold={(vid) => handleReleaseReservation(vid)}
        />
      )}
    </div>
  );
}
