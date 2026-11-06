"use client";

import React, { useState, useMemo } from "react";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import DealerDetailsModal from "./DealerDetailsModal";
import ReservationDetailsModal from "./ReservationDetailsModal";
import { ReservationRequest, DealerAccount, ZoneId, UserAccount, Vehicle } from "@/lib/types";
import {
  Building2,
  Clock,
  Lock,
  CheckCircle2,
  ArrowRight,
  X,
  AlertTriangle,
  UserCheck,
  Globe,
} from "lucide-react";

interface AdminDashboardViewProps {
  onNavigateTab: (tabId: string) => void;
}

// Helper to strictly resolve any registration item to one of the 3 sections on /register:
// "NZ Dealer" | "Nissan Japan" | "Programme"
function getRegistrationSectionRole(item?: {
  registrationRole?: string;
  category?: string;
  role?: string;
  termsAcceptedVersion?: string;
} | null): "NZ Dealer" | "Nissan Japan" | "Programme" {
  if (!item) return "NZ Dealer";
  if (
    item.registrationRole === "NZ Dealer" ||
    item.registrationRole === "Nissan Japan" ||
    item.registrationRole === "Programme"
  ) {
    return item.registrationRole;
  }
  if (item.category === "DEALER_NZ") return "NZ Dealer";
  if (item.category === "JAPAN_HQ") return "Nissan Japan";
  if (item.category === "PROGRAMME_USER") return "Programme";

  if (item.role === "NISSAN_JAPAN" || item.termsAcceptedVersion?.includes("JP-EXPORT")) {
    return "Nissan Japan";
  }
  if (
    item.role === "READONLY_PROGRAMME_USER" ||
    item.role?.toLowerCase().includes("programme")
  ) {
    return "Programme";
  }
  if (item.role === "DEALER_USER" || item.role === "DEALER_ADMIN") {
    return "NZ Dealer";
  }

  return "NZ Dealer";
}

export default function AdminDashboardView({ onNavigateTab }: AdminDashboardViewProps) {
  const {
    vehicles,
    dealers,
    reservations,
    users,
    approveDealer,
    rejectDealer,
    confirmAllocation,
    releaseHold,
    toggleUserStatus,
    deleteUser,
  } = useProgramme();

  const [notification, setNotification] = useState<string | null>(null);
  const [selectedDealerForDetails, setSelectedDealerForDetails] = useState<DealerAccount | null>(null);
  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<UserAccount | null>(null);

  // Decline Reason Note Modal State
  const [declineTargetDealer, setDeclineTargetDealer] = useState<DealerAccount | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // 1. Pending Dealer Onboarding Requests from /register (NZ Dealer)
  const pendingDealers = useMemo(
    () => dealers.filter((d) => d.status === "PENDING_APPROVAL" && d.category !== "JAPAN_HQ" && !d.termsAcceptedVersion?.includes("JP-EXPORT")),
    [dealers]
  );

  // 2. Pending User & Facility Accounts from /register
  const pendingUsers = useMemo(
    () => users.filter((u) => !u.active),
    [users]
  );
  // Nissan Japan HQ marshalling facilities from /register
  const pendingFacilities = useMemo(
    () => dealers.filter((d) => d.status === "PENDING_APPROVAL" && (d.category === "JAPAN_HQ" || d.termsAcceptedVersion?.includes("JP-EXPORT"))),
    [dealers]
  );
  const totalOnboardingRequests = pendingUsers.length + pendingFacilities.length;

  // 3. Active 24h exclusivity holds (Request Detail 1 as shown in attached image)
  const activeHolds = useMemo(
    () => reservations.filter((r) => r.status === "ACTIVE_HOLD"),
    [reservations]
  );

  // 4. Reserved vehicles (Request Detail 2 as shown in attached image)
  const reservedVehicles = useMemo(
    () => vehicles.filter((v) => v.status === "RESERVED"),
    [vehicles]
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

  // User Approval Handler (from /register)
  const handleApproveUser = (userId: string, userName: string) => {
    audio.playSuccessChime();
    toggleUserStatus(userId);
    setNotification(`Onboarding application for ${userName} approved and account activated.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // User Decline Handler (from /register)
  const handleDeclineUser = (userId: string, userName: string) => {
    audio.playSubtleClick();
    deleteUser(userId);
    setNotification(`Onboarding application for ${userName} declined and removed.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // 1-Click Confirm Allocation
  const handleConfirmReservation = (vehicleId: string) => {
    audio.playSuccessChime();
    confirmAllocation(vehicleId, "Confirmed directly from Operations Dashboard.");
    setNotification("Wholesale order confirmed and dispatched to shipping pipeline.");
    setTimeout(() => setNotification(null), 4000);
  };

  // 1-Click Release Hold
  const handleReleaseReservation = (vehicleId: string) => {
    audio.playSubtleClick();
    releaseHold(vehicleId, "Hold released from Operations Dashboard.");
    setNotification("Exclusivity hold released. Vehicle returned to catalogue.");
    setTimeout(() => setNotification(null), 4000);
  };

  const dealerOnboardingCount = pendingDealers.length + pendingFacilities.length + pendingUsers.length;
  const reservationQueueCount = activeHolds.length;

  return (
    <div className="space-y-6 max-w-8xl mx-auto font-sans text-slate-800 pb-12">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Clean Nissan Corporate Operations Bar            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Priority queues for NZ Dealer, Nissan Japan, and Programme onboarding approvals, and 24h exclusivity holds.
          </p>
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
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Card 1: Registration & Onboarding Approval Requests      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Onboarding &amp; Registration Approval Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
              {dealerOnboardingCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("admin-dealers")}
            className="text-xs font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Manage All Registrations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {dealerOnboardingCount === 0 ? (
          <div className="py-6 px-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 flex items-center justify-center gap-2 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No pending onboarding or registration approval requests.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* A. Pending NZ Dealer Registrations from /register */}
            {pendingDealers.map((dealer) => {
              const defaultZone = dealer.pricingZoneId || "ZONE_1";
              return (
                <div
                  key={dealer.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 sm:w-16 h-10 sm:h-11 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden text-[#0A0A0A]">
                      <Building2 className="w-5 h-5 text-[#0A0A0A]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {dealer.legalTradingName}
                      </div>
                      <div className="mt-0.5">
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                          {getRegistrationSectionRole(dealer)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setSelectedDealerForDetails(dealer);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all shadow-2xs cursor-pointer"
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
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(dealer.id, defaultZone)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-[#27272A] rounded-lg transition-all shadow-xs hover:shadow-soft cursor-pointer active:scale-[0.98]"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}

            {/* B. Pending Nissan Japan HQ Registrations from /register */}
            {pendingFacilities.map((facility) => {
              const defaultZone = facility.pricingZoneId || "ZONE_1";
              return (
                <div
                  key={facility.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 sm:w-16 h-10 sm:h-11 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden text-[#0A0A0A]">
                      <Globe className="w-5 h-5 text-[#0A0A0A]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {facility.legalTradingName}
                      </div>
                      <div className="mt-0.5">
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                          {getRegistrationSectionRole(facility)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setSelectedDealerForDetails(facility);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all shadow-2xs cursor-pointer"
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setDeclineTargetDealer(facility);
                        setDeclineReason("");
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApprove(facility.id, defaultZone)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-[#27272A] rounded-lg transition-all shadow-xs hover:shadow-soft cursor-pointer active:scale-[0.98]"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}

            {/* C. Pending Programme / Personnel Registrations from /register */}
            {pendingUsers.map((u) => {
              const roleLabel = getRegistrationSectionRole(u);
              const isJapan = roleLabel === "Nissan Japan";

              return (
                <div
                  key={u.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 sm:w-16 h-10 sm:h-11 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden text-[#0A0A0A]">
                      {isJapan ? (
                        <Globe className="w-5 h-5 text-[#0A0A0A]" />
                      ) : (
                        <UserCheck className="w-5 h-5 text-[#0A0A0A]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {u.name}
                      </div>
                      <div className="mt-0.5">
                        <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setSelectedUserForDetails(u);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition-all shadow-2xs cursor-pointer"
                    >
                      Review
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeclineUser(u.id, u.name)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveUser(u.id, u.name)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-[#27272A] rounded-lg transition-all shadow-xs hover:shadow-soft cursor-pointer active:scale-[0.98]"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Card 2: Atomic Reservation Queue Requests                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Atomic Reservation Queue Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
              {reservationQueueCount}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("admin-reservations")}
            className="text-xs font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Manage All Holds</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {reservationQueueCount === 0 ? (
          <div className="py-6 px-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 flex items-center justify-center gap-2 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No active reservation holds in queue.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeHolds.map((res) => {
              const vehicle = vehicles.find((v) => v.id === res.vehicleId || v.id === res.vehicle?.id) || res.vehicle;

              return (
                <div
                  key={res.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 sm:w-16 h-10 sm:h-11 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                      <img
                        src={vehicle?.images?.[0] || "/images/cars/note.png"}
                        alt={vehicle?.model || "Vehicle"}
                        className="w-full h-full object-contain select-none"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {vehicle?.year} {vehicle?.make} {vehicle?.model}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0 font-mono">
                          #{vehicle?.stockId}
                        </span>
                        <span className="text-slate-300 hidden sm:inline">·</span>
                        <span className="text-[10px] text-slate-600 hidden sm:inline truncate font-semibold">
                          {res.dealerName}
                        </span>
                        <span className="text-slate-300 hidden md:inline">·</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 flex items-center gap-1 bg-rose-50 text-[#C3002F] border-rose-200">
                          <Clock className="w-3 h-3 text-[#C3002F] animate-pulse" />
                          <span>Expiring soon</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setSelectedResForDetails(res);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                    >
                      Inspect
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReleaseReservation(vehicle?.id || res.vehicleId)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Release
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmReservation(vehicle?.id || res.vehicleId)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-[#444444] rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-[0.98]"
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

      {/* 3. Decline Dealership Application Reason Note Modal         */}
      {/* ─────────────────────────────────────────────────────────── */}
      {declineTargetDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-xl max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-[#C3002F] shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Decline Dealership Application
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
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
                className="px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-[#444444] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold cursor-pointer transition-all shadow-xs"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. User Onboarding Details Dossier Modal                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-xl max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0A0A0A] shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Onboarding Application Review
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Registration request submitted via /register
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForDetails(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Applicant Name:</span>
                <span className="text-slate-900 font-bold">{selectedUserForDetails.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Business Email:</span>
                <span className="text-slate-900 font-mono font-semibold">{selectedUserForDetails.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Phone Number:</span>
                <span className="text-slate-900 font-mono">{selectedUserForDetails.phone || "Not provided"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Requested Role:</span>
                <span className="font-medium px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-800 border border-slate-200">
                  {getRegistrationSectionRole(selectedUserForDetails)}
                </span>
              </div>
              {selectedUserForDetails.dealershipName && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Organization / Entity:</span>
                  <span className="text-slate-900 font-semibold">{selectedUserForDetails.dealershipName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleDeclineUser(selectedUserForDetails.id, selectedUserForDetails.name);
                  setSelectedUserForDetails(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs sm:text-sm font-semibold cursor-pointer transition-all shadow-2xs"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApproveUser(selectedUserForDetails.id, selectedUserForDetails.name);
                  setSelectedUserForDetails(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold cursor-pointer transition-all shadow-xs hover:shadow-soft active:scale-[0.98]"
              >
                Authorize &amp; Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Dealer Details Dossier Modal                             */}
      {/* ─────────────────────────────────────────────────────────── */}
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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. Reservation Details Dossier Modal                        */}
      {/* ─────────────────────────────────────────────────────────── */}
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
