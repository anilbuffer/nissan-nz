"use client";

import React, { useState, useMemo } from "react";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import DealerDetailsModal from "./DealerDetailsModal";
import ReservationDetailsModal from "./ReservationDetailsModal";
import { ReservationRequest, DealerAccount, ZoneId, UserAccount, Vehicle } from "@/lib/types";
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
  UserCheck,
  Users,
} from "lucide-react";

interface AdminDashboardViewProps {
  onNavigateTab: (tabId: string) => void;
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

  // 1. Dealer Onboarding Approval Requests (Franchise Dealers from /register)
  const pendingDealers = useMemo(
    () => dealers.filter((d) => d.status === "PENDING_APPROVAL" && !d.termsAcceptedVersion?.includes("JP-EXPORT")),
    [dealers]
  );

  // 2. Onboarding Approval Requests (User & Facility Accounts from /register)
  const pendingUsers = useMemo(
    () => users.filter((u) => !u.active),
    [users]
  );
  const pendingFacilities = useMemo(
    () => dealers.filter((d) => d.status === "PENDING_APPROVAL" && d.termsAcceptedVersion?.includes("JP-EXPORT")),
    [dealers]
  );
  const totalOnboardingRequests = pendingUsers.length + pendingFacilities.length;

  // 3. Atomic Reservation Queue Requests (Active 24h exclusivity holds)
  const activeHolds = useMemo(
    () => reservations.filter((r) => r.status === "ACTIVE_HOLD"),
    [reservations]
  );

  // 4. Reserved Requests (Vehicles with status RESERVED)
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
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Operations Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Priority queues for franchise dealer onboarding approvals, staff registrations, and 24h exclusivity holds.
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-slate-600" />
            <span>{pendingDealers.length} Dealer Onboarding</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>{totalOnboardingRequests} Onboarding</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>{activeHolds.length} Reservation Queue</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            <span>{reservedVehicles.length} Reserved</span>
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
      {/* 1. Card 1: Dealer Onboarding Approval Requests              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Dealer Onboarding Approval Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
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
          <div className="py-6 px-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 flex items-center justify-center gap-2 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No pending franchise dealer applications. New submissions from /register will appear here.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingDealers.map((dealer) => {
              const defaultZone = dealer.pricingZoneId || "ZONE_1";

              return (
                <div
                  key={dealer.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
                >
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
                        <span className="text-slate-300 hidden sm:inline">·</span>
                        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                          NZBN: {dealer.nzbn}
                        </span>
                        {dealer.primaryContactName && (
                          <>
                            <span className="text-slate-300 hidden md:inline">·</span>
                            <span className="text-[10px] text-slate-500 hidden md:inline">
                              Contact: {dealer.primaryContactName} ({dealer.primaryContactEmail})
                            </span>
                          </>
                        )}
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
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-[#444444] rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-[0.98]"
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
      {/* 2. Card 2: Onboarding Approval Requests                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Onboarding Approval Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
              {totalOnboardingRequests}
            </span>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Staff &amp; Facility Registrations from /register
          </span>
        </div>

        {totalOnboardingRequests === 0 ? (
          <div className="py-6 px-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 flex items-center justify-center gap-2 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No pending user or personnel onboarding requests. Submissions from /register will appear here.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {/* Programme & Staff Users pending approval */}
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {u.name}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {u.role.replace(/_/g, " ")}
                      </span>
                      <span className="text-slate-300 hidden sm:inline">·</span>
                      <span className="text-[10px] text-slate-500 hidden sm:inline truncate">
                        {u.email}
                      </span>
                      {u.dealershipName && (
                        <>
                          <span className="text-slate-300 hidden sm:inline">·</span>
                          <span className="text-[10px] text-slate-600 font-medium hidden sm:inline truncate">
                            {u.dealershipName}
                          </span>
                        </>
                      )}
                      {u.phone && (
                        <>
                          <span className="text-slate-300 hidden md:inline">·</span>
                          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                            {u.phone}
                          </span>
                        </>
                      )}
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
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeclineUser(u.id, u.name)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveUser(u.id, u.name)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-[#444444] rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-[0.98]"
                  >
                    Authorize
                  </button>
                </div>
              </div>
            ))}

            {/* Japan HQ Facilities pending approval */}
            {pendingFacilities.map((fac) => (
              <div
                key={fac.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {fac.legalTradingName} (Japan Export Facility)
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        #{fac.dealerCode}
                      </span>
                      <span className="text-slate-300 hidden sm:inline">·</span>
                      <span className="text-[10px] text-slate-500 hidden sm:inline truncate">
                        {fac.region}
                      </span>
                      <span className="text-slate-300 hidden md:inline">·</span>
                      <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                        Contact: {fac.primaryContactName} ({fac.primaryContactEmail})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedDealerForDetails(fac);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    Review
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      rejectDealer(fac.id, "Facility application declined.");
                      setNotification(`Facility application for ${fac.legalTradingName} declined.`);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprove(fac.id, "ZONE_1")}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A0A0A] hover:bg-[#444444] rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-[0.98]"
                  >
                    Authorize
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Card 3: Atomic Reservation Queue Requests                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Atomic Reservation Queue Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
              {activeHolds.length}
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

        {activeHolds.length === 0 ? (
          <div className="py-6 px-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 flex items-center justify-center gap-2 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No active 24h exclusivity holds in queue. All catalogue stock is available.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activeHolds.map((res) => {
              const vehicle = vehicles.find((v) => v.id === res.vehicleId || v.id === res.vehicle?.id) || res.vehicle;
              const diffMs = new Date(res.expiresAt).getTime() - Date.now();
              const hoursLeft = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
              const minutesLeft = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
              const isUrgent = hoursLeft < 4;

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
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                          #{vehicle?.stockId}
                        </span>
                        <span className="text-slate-300 hidden sm:inline">·</span>
                        <span className="text-[10px] text-slate-600 hidden sm:inline truncate font-semibold">
                          {res.dealerName}
                        </span>
                        <span className="text-slate-300 hidden md:inline">·</span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 flex items-center gap-1 ${isUrgent
                          ? "bg-rose-50 text-[#C3002F] border-rose-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                          <Clock className={`w-3 h-3 ${isUrgent ? "text-[#C3002F] animate-pulse" : "text-slate-500"}`} />
                          <span>{hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m left` : "Expiring soon"}</span>
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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Card 4: Reserved Requests                                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-800" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Reserved Requests
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
              {reservedVehicles.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab("admin-catalogue")}
            className="text-xs font-semibold text-[#C3002F] hover:text-[#A10026] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>View Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {reservedVehicles.length === 0 ? (
          <div className="py-6 px-4 bg-slate-50 rounded-xl text-center text-sm text-slate-500 flex items-center justify-center gap-2 border border-slate-200/60">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>No vehicles currently reserved. All catalogue stock is available for franchise allocation.</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reservedVehicles.map((vehicle) => {
              const matchingRes = reservations.find(
                (r) => r.vehicleId === vehicle.id
              );
              const dealerName = matchingRes?.dealerName || "Auckland Nissan City Ltd";

              return (
                <div
                  key={vehicle.id}
                  className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors"
                >
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
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 shrink-0 font-mono">
                          ¥{vehicle.fobPriceJPY.toLocaleString()} FOB
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        if (matchingRes) {
                          setSelectedResForDetails(matchingRes);
                        } else {
                          onNavigateTab("admin-catalogue");
                        }
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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Decline Dealership Application Reason Note Modal         */}
      {/* ─────────────────────────────────────────────────────────── */}
      {declineTargetDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans">
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

              {/* Quick preset chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
                {[
                  "NZBN Verification Inactive",
                  "Territory Franchise Conflict",
                  "Missing Authorised Signatory",
                  "Credit Boundary Ineligible",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setDeclineReason(preset)}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
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
      {/* 6. User Onboarding Details Dossier Modal                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedUserForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-xl max-w-lg w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
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
                <span className="text-blue-700 font-bold uppercase">{selectedUserForDetails.role.replace(/_/g, " ")}</span>
              </div>
              {selectedUserForDetails.dealershipName && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Organization / Franchise:</span>
                  <span className="text-slate-900 font-semibold">{selectedUserForDetails.dealershipName}</span>
                </div>
              )}
              {selectedUserForDetails.department && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="text-slate-900">{selectedUserForDetails.department}</span>
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
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs sm:text-sm font-medium cursor-pointer transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApproveUser(selectedUserForDetails.id, selectedUserForDetails.name);
                  setSelectedUserForDetails(null);
                }}
                className="px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs sm:text-sm font-semibold cursor-pointer transition-all shadow-xs"
              >
                Authorize &amp; Activate
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
