"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useProgramme } from "@/lib/programme-context";
import { ReservationRequest } from "@/lib/types";
import { audio } from "@/lib/sound";
import FullPageVehicleDetail from "@/components/dealer/FullPageVehicleDetail";
import StatusBadge from "@/components/common/StatusBadge";
import Pagination from "@/components/common/Pagination";
import {
  Clock,
  CheckCircle2,
  Search,
  Eye,
} from "lucide-react";

interface AdminReservationsViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export default function AdminReservationsView({ onNavigateTab }: AdminReservationsViewProps) {
  const {
    reservations,
    confirmAllocation,
    reservationConfig,
  } = useProgramme();

  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedResForDetails, setSelectedResForDetails] = useState<ReservationRequest | null>(null);
  const [confirmDialogRes, setConfirmDialogRes] = useState<ReservationRequest | null>(null);

  // Filter and prioritize active holds first
  const filteredReservations = reservations
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.requestId?.toLowerCase().includes(q) ||
        r.dealerName?.toLowerCase().includes(q) ||
        r.dealerCode?.toLowerCase().includes(q) ||
        r.vehicle?.model?.toLowerCase().includes(q) ||
        r.vehicle?.stockId?.toLowerCase().includes(q) ||
        r.vehicle?.vinChassis?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (a.status === "ACTIVE_HOLD" && b.status !== "ACTIVE_HOLD") return -1;
      if (a.status !== "ACTIVE_HOLD" && b.status === "ACTIVE_HOLD") return 1;
      return new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime();
    });

  // Reservations Pagination (10 entries max per page)
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE) || 1;
  const paginatedReservations = useMemo(() => {
    const validPage = Math.min(Math.max(1, currentPage), totalPages);
    const start = (validPage - 1) * ITEMS_PER_PAGE;
    return filteredReservations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReservations, currentPage, totalPages]);

  // Calculate dynamic countdown & warning status
  const calcRemainingTime = (expiresAt: string) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) {
      return { label: "Expired", isExpired: true, isWarning: false, hours: 0, minutes: 0 };
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const threshold = reservationConfig?.warningThresholdHours || 2;
    const isWarning = hours < threshold;
    return {
      label: hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`,
      isExpired: false,
      isWarning,
      hours,
      minutes,
    };
  };

  const handleDirectConfirm = (res: ReservationRequest) => {
    audio.playSuccessChime();
    confirmAllocation(res.vehicleId, "Wholesale allocation confirmed by Autohub Ops. Purchase order issued.");
    setNotification(`Confirmed allocation for #${res.vehicle?.stockId || res.requestId} to ${res.dealerName}. Active Order generated.`);
    setTimeout(() => setNotification(null), 4000);
  };

  // ─────────────────────────────────────────────────────────────
  // A. INNER DETAILS VIEW (Same details page as vehicle details)
  // ─────────────────────────────────────────────────────────────
  if (selectedResForDetails) {
    const liveRes = reservations.find((r) => r.id === selectedResForDetails.id) || selectedResForDetails;
    return (
      <FullPageVehicleDetail
        vehicleId={liveRes.vehicleId || liveRes.vehicle?.id}
        vehicleData={liveRes.vehicle}
        isAdmin={true}
        backLabel="Back to Reservations Queue"
        onBack={() => setSelectedResForDetails(null)}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // B. MAIN GRID LAYOUT VIEW (Executive Grid Cards)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Clean Nissan Corporate Operations Bar            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Reservations &amp; Exclusivity Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor dealer exclusivity holds, countdown timers, warning thresholds, and sign off on wholesale allocation confirmations.
          </p>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Search Toolbar with Reservation Counter                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-3.5 sm:p-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by stock ID, model, dealer code, or VIN..."
            className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono shrink-0 whitespace-nowrap self-end sm:self-center pr-1">
          {filteredReservations.length} of {reservations.length} Reservations
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. GRID CARDS SHOWCASE (Executive Grid Layout)             */}
      {/* ─────────────────────────────────────────────────────────── */}
      {filteredReservations.length === 0 ? (
        <div className="bg-white rounded-[16px] border border-slate-200 p-12 text-center space-y-2 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-sm text-slate-800">No Reservations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? "No reservations match your search query."
              : "All certified Japanese inventory units are available for dealer purchase."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedReservations.map((res) => {
            const vehicle = res.vehicle;
            const price = res.priceSnapshot;
            const isActiveHold = res.status === "ACTIVE_HOLD";
            const remaining = calcRemainingTime(res.expiresAt);

            return (
              <div
                key={res.id}
                onClick={() => {
                  audio.playSubtleClick();
                  setSelectedResForDetails(res);
                }}
                className="bg-white rounded-[16px] border border-slate-200 hover:border-slate-300 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group cursor-pointer space-y-4 relative overflow-hidden"
              >
                <div>
                  {/* Top Header: Title & Dynamic Expiry or Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-600 transition-colors leading-tight truncate">
                        {vehicle?.make || "Nissan"} - {vehicle?.model || "Vehicle"}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                        {vehicle?.year ? `${vehicle.year} · ` : ""}{vehicle?.fuelType ? `${vehicle.fuelType} · ` : ""}#{vehicle?.stockId || res.requestId}
                      </p>
                    </div>

                    {isActiveHold ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0 shadow-2xs border ${remaining.isWarning
                          ? "bg-amber-50 text-amber-800 border-amber-300"
                          : "bg-amber-50 text-amber-700 border-amber-200/80"
                          }`}
                        title={
                          remaining.isWarning
                            ? `Warning: Hold expiring within ${reservationConfig?.warningThresholdHours || 2}h`
                            : "Active Hold Countdown"
                        }
                      >
                        <Clock className={`w-3 h-3 ${remaining.isWarning ? "text-amber-600" : "text-amber-500"}`} />
                        <span>{remaining.label}</span>
                      </span>
                    ) : (
                      <StatusBadge status={res.status} size="sm" />
                    )}
                  </div>

                  {/* Studio Car Image with Ground Shadow */}
                  <div className="relative w-full h-40 my-3 flex items-center justify-center">
                    <div className="absolute bottom-2 w-4/5 h-3.5 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />
                    <img
                      src={vehicle?.images?.[0] || "/images/cars/kicks.png"}
                      alt={vehicle?.model || "Car"}
                      className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_10px_14px_rgba(0,0,0,0.12)] group-hover:scale-105 transition-transform duration-300 select-none"
                    />
                  </div>

                  {/* Reserving Dealer Information Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Reserving Dealership</span>
                      <span className="font-mono text-slate-700">{res.dealerCode}</span>
                    </div>
                    <div className="font-bold text-slate-900 truncate">
                      {res.dealerName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Buyer: {res.userName || "Franchise Dealer"}</span>
                      {price?.zoneId && (
                        <span className="font-mono font-bold text-slate-700">{price.zoneId}</span>
                      )}
                    </div>
                    {res.decisionReason && (
                      <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200/60 truncate">
                        Note: {res.decisionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Guaranteed Landed Price on Left & Action on Right */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-lg font-bold text-slate-900 font-mono tracking-tight block leading-tight">
                      ${(price?.totalBuyPriceNZD || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Fixed Landed NZD
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isActiveHold ? (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playSubtleClick();
                            setConfirmDialogRes(res);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white font-semibold text-xs transition-all shadow-xs hover:shadow-soft cursor-pointer active:scale-[0.98]"
                          title="Confirm wholesale allocation"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playSubtleClick();
                            setSelectedResForDetails(res);
                          }}
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                          title="Inspect vehicle details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          audio.playSubtleClick();
                          setSelectedResForDetails(res);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer text-xs"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reservations Pagination Bar (10 max entries per page) */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredReservations.length}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={(p) => {
          setCurrentPage(p);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        itemName="reservations"
      />

      {/* Confirmation Dialog for Grid Action */}
      {confirmDialogRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
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
                onClick={() => setConfirmDialogRes(null)}
                className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle:</span>
                <span className="font-bold text-slate-900">{confirmDialogRes.vehicle?.year} {confirmDialogRes.vehicle?.make} {confirmDialogRes.vehicle?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Stock ID:</span>
                <span className="font-mono font-bold text-slate-800">#{confirmDialogRes.vehicle?.stockId || confirmDialogRes.requestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Allocated Dealership:</span>
                <span className="font-bold text-slate-900">{confirmDialogRes.dealerName}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/60">
                <span className="text-slate-500">Fixed Landed Price:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  ${(confirmDialogRes.priceSnapshot?.totalBuyPriceNZD || 0).toLocaleString()} NZD
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to confirm wholesale allocation for unit <strong>#{confirmDialogRes.vehicle?.stockId || confirmDialogRes.requestId}</strong> to <strong>{confirmDialogRes.dealerName}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDialogRes(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = confirmDialogRes;
                  setConfirmDialogRes(null);
                  handleDirectConfirm(target);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white font-semibold text-xs transition-all shadow-xs hover:shadow-soft cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-white/90" />
                <span>Confirm Allocation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
