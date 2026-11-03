"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import OrderCorridorTimeline from "./OrderCorridorTimeline";
import { Order, OrderMilestone, ReservationRequest } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { audio } from "@/lib/sound";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Ship,
  Lock,
  Unlock,
  Download,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  FileCheck2,
  Copy,
  Check,
  Search,
  Filter,
  ArrowRight,
  Eye,
  X,
  Truck,
  Sparkles,
  Info,
  Layers,
  Calendar,
  DollarSign,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";

const MILESTONE_STEPS: { key: OrderMilestone; label: string; actor: string; desc: string }[] = [
  { key: "ORDER_CONFIRMED", label: "Order Confirmed", actor: "Dealership & Autohub Ops", desc: "Wholesale allocation accepted and entered into programme schedule." },
  { key: "JAPAN_VERIFICATION", label: "Japan Export Verification", actor: "Japan Logistics Hub", desc: "Physical yard inspection, JEVIC odometer verification & export deregistration." },
  { key: "BOOKED_FOR_SHIPPING", label: "Shipment & Berth Booked", actor: "AutoHub Shipping Ops", desc: "RoRo vessel space confirmed and port staging completed." },
  { key: "IN_TRANSIT", label: "Pacific Ocean Transit", actor: "Trans-Pacific RoRo Lines", desc: "Coastal and ocean transit across Pacific corridor to Ports of Auckland." },
  { key: "NZ_BORDER_PROCESSING", label: "NZ Border & Customs Release", actor: "NZ Customs & MPI", desc: "MPI biosecurity heat treatment and cleared GST import entry assessment." },
  { key: "COMPLIANCE", label: "MR2A Technical Compliance", actor: "VINZ / VTNZ Compliance Centre", desc: "NZTA standard safety pass, brake testing, and EV state of health certification." },
  { key: "READY_FOR_DELIVERY", label: "Ready for Dealership Delivery", actor: "AutoHub Domestic Carrier", desc: "Compliance plate stamped; carrier dispatch to franchise drop-off yard." },
  { key: "DELIVERED", label: "Delivered to Dealership", actor: "Franchise Receiving Yard", desc: "Final handover, transport receipt signed, and entered into yard inventory." },
];

export interface DealerOrdersViewProps {
  mode?: "ORDERS" | "RESERVE";
}

export default function DealerOrdersView({ mode }: DealerOrdersViewProps = {}) {
  const { currentDealer } = useAuth();
  const { orders, reservations, releaseHold, cancelReservation, respondToAdditionalCost, confirmAllocation, reservationConfig } = useProgramme();

  const [activeTab, setActiveTab] = useState<"ORDERS" | "HOLDS">(mode === "RESERVE" ? "HOLDS" : "ORDERS");

  useEffect(() => {
    if (mode === "RESERVE") {
      setActiveTab("HOLDS");
    } else if (mode === "ORDERS") {
      setActiveTab("ORDERS");
    }
  }, [mode]);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ name: string; type: string; date: string } | null>(null);
  const [viewingDefectPhoto, setViewingDefectPhoto] = useState<boolean>(false);
  const [confirmingHoldVehicleId, setConfirmingHoldVehicleId] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [mobileSubTab, setMobileSubTab] = useState<"LIST" | "DETAIL">("LIST");
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  // Filter orders for this dealer
  const dealerOrders = orders.filter(
    (o) => !currentDealer?.id || o.dealerId === currentDealer.id
  );

  // Filter 24h holds for this dealer
  const dealerHolds = reservations.filter(
    (r) =>
      r.status === "ACTIVE_HOLD" &&
      (!currentDealer?.id || r.dealerId === currentDealer.id)
  );

  // Filter confirmed wholesale allocations for this dealer
  const dealerConfirmedHolds = reservations.filter(
    (r) =>
      r.status === "CONFIRMED_ALLOCATED" &&
      (!currentDealer?.id || r.dealerId === currentDealer.id)
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    dealerOrders[0]?.id || ""
  );

  // Keep selected order valid
  const selectedOrder =
    dealerOrders.find((o) => o.id === selectedOrderId) || dealerOrders[0];

  // Filtered orders list by search query and milestone
  const filteredOrders = dealerOrders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.vehicle.vinChassis.toLowerCase().includes(q) ||
      order.vehicle.stockId.toLowerCase().includes(q) ||
      order.vehicle.model.toLowerCase().includes(q) ||
      (order.vesselName && order.vesselName.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "IN_TRANSIT" && (order.currentMilestone === "IN_TRANSIT" || order.currentMilestone === "BOOKED_FOR_SHIPPING")) ||
      (statusFilter === "BORDER" && (order.currentMilestone === "NZ_BORDER_PROCESSING" || order.currentMilestone === "COMPLIANCE" || order.currentMilestone === "AWAITING_ADDITIONAL_COST")) ||
      (statusFilter === "READY" && (order.currentMilestone === "READY_FOR_DELIVERY" || order.currentMilestone === "DELIVERED"));

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalFleetValueNZD = dealerOrders.reduce(
    (sum, o) => sum + (o.priceBreakdown?.totalBuyPriceNZD || 0),
    0
  );
  const onHighSeasCount = dealerOrders.filter(
    (o) => o.currentMilestone === "IN_TRANSIT" || o.currentMilestone === "BOOKED_FOR_SHIPPING"
  ).length;
  const inComplianceCount = dealerOrders.filter(
    (o) => o.currentMilestone === "NZ_BORDER_PROCESSING" || o.currentMilestone === "COMPLIANCE" || o.currentMilestone === "AWAITING_ADDITIONAL_COST"
  ).length;
  const pendingActionsCount = dealerOrders.reduce(
    (count, o) => count + o.additionalCosts.filter((c) => c.status === "PENDING_DEALER_APPROVAL").length,
    0
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    audio.playSubtleClick();
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleApproveCost = (orderId: string, costId: string) => {
    audio.playSuccessChime();
    respondToAdditionalCost(orderId, costId, "APPROVED");
    setToastNotice("Compliance defect remediation approved. Added to invoice per Section 4 terms.");
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleDeclineCost = (orderId: string, costId: string) => {
    audio.playSubtleClick();
    respondToAdditionalCost(orderId, costId, "DECLINED");
    setToastNotice("Remediation declined. Autohub Compliance team has been notified for reassessment.");
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleReleaseMyHold = (vehicleId: string) => {
    audio.playSubtleClick();
    releaseHold(vehicleId, "Voluntary release by franchise dealer.");
    setToastNotice("24-Hour Exclusivity Hold released. Vehicle returned to wholesale catalog.");
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleCancelMyHold = (reservationId: string) => {
    audio.playSubtleClick();
    cancelReservation(reservationId, "Voluntary Section 6.2 cooling-off cancellation by dealership.", currentDealer?.legalTradingName || "Dealer Buyer");
    setToastNotice("Hold cancelled under Section 6.2 without penalty. Stock returned to open catalogue.");
    setTimeout(() => setToastNotice(null), 4000);
  };

  const handleConfirmHoldToOrder = (vehicleId: string) => {
    audio.playSuccessChime();
    confirmAllocation(vehicleId, "Confirmed wholesale allocation by franchise dealer principal.");
    setConfirmingHoldVehicleId(null);
    setActiveTab("ORDERS");
    setToastNotice("Order successfully generated! Vehicle transitioned to wholesale shipment pipeline.");
    setTimeout(() => setToastNotice(null), 4500);
  };

  const handleDownloadDoc = (docName: string) => {
    audio.playSuccessChime();
    setToastNotice(`Downloading verified official document: ${docName}...`);
    setTimeout(() => setToastNotice(null), 3500);
  };

  const getMilestoneIndex = (milestone: OrderMilestone) => {
    if (milestone === "AWAITING_ADDITIONAL_COST") return 5;
    const idx = MILESTONE_STEPS.findIndex((s) => s.key === milestone);
    return idx === -1 ? 0 : idx;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Clean Simple Top Header & View Tabs (Soft Shadow + Outline) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            {mode === "RESERVE" ? `Vehicle Reservations (${dealerHolds.length})` : `Wholesale Orders (${dealerOrders.length})`}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {currentDealer?.legalTradingName || "Auckland Nissan City Ltd"} · {mode === "RESERVE" ? "Active 24-hour exclusivity reservations with guaranteed landed pricing locks." : "Live tracking of confirmed vehicle orders, ocean transit, and NZ compliance milestones."}
          </p>
        </div>

        {/* Action / Navigation links */}
        {mode === "ORDERS" ? (
          <Link
            href="/dealer/reserve"
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>View Reservations</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-amber-100 text-amber-800 font-bold">
              {dealerHolds.length}
            </span>
          </Link>
        ) : mode === "RESERVE" ? (
          <Link
            href="/dealer/orders"
            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <Ship className="w-3.5 h-3.5 text-slate-600" />
            <span>Wholesale Orders</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-slate-100 text-slate-700 font-bold">
              {dealerOrders.length}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setActiveTab("ORDERS");
                setViewingOrderId(null);
              }}
              className={`btn-outline px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "ORDERS"
                ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
            >
              <Ship className={`w-3.5 h-3.5 ${activeTab === "ORDERS" ? "text-rose-400" : "text-slate-500"}`} />
              <span>Active Orders</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${activeTab === "ORDERS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                }`}>
                {dealerOrders.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setActiveTab("HOLDS");
                setViewingOrderId(null);
              }}
              className={`btn-outline px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "HOLDS"
                ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-50"
                }`}
            >
              <Lock className={`w-3.5 h-3.5 ${activeTab === "HOLDS" ? "text-amber-400" : "text-amber-500"}`} />
              <span>24h Reservations</span>
              <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] ${activeTab === "HOLDS" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-900"
                }`}>
                {dealerHolds.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Global Interactive Notification Toast */}
      {toastNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-md animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. TAB: My 24-Hour Exclusivity Holds                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {(mode === "RESERVE" || (!mode && activeTab === "HOLDS")) && (
        <div className="space-y-6 animate-in fade-in">
          {dealerConfirmedHolds.length > 0 && (
            <div className="p-5 sm:p-6 rounded-[24px] bg-emerald-50/90 border border-emerald-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">
                      Confirmed Wholesale Allocations ({dealerConfirmedHolds.length})
                    </h3>
                    <p className="text-xs text-emerald-800">
                      Autohub Central Operations has approved these reservations and issued wholesale orders.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dealer/orders"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
                >
                  <Ship className="w-3.5 h-3.5" />
                  <span>View All Wholesale Orders</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dealerConfirmedHolds.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{res.vehicle.stockId}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>CONFIRMED ALLOCATED</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {res.vehicle.year} {res.vehicle.make} {res.vehicle.model}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono truncate">
                          VIN: {res.vehicle.vinChassis} · Landed: ${res.priceSnapshot.totalBuyPriceNZD.toLocaleString()} NZD
                        </p>
                      </div>

                      {res.decisionReason && (
                        <p className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 leading-snug">
                          <strong>Note:</strong> {res.decisionReason}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/dealer/orders"
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-[#C3002F] text-white text-xs font-semibold text-center transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Track Order Milestones</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dealerHolds.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Pending Holds</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {dealerConfirmedHolds.length > 0
                  ? "All your recent reservation requests have been approved by Central Operations and converted into active Wholesale Orders above."
                  : "Your dealership currently holds no active time-locked reservations. Browse the Vehicle Catalogue to claim a 24-hour guaranteed price lock on available stock."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {dealerHolds.map((res) => {
                const diffMs = new Date(res.expiresAt).getTime() - Date.now();
                const remHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                const remMins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
                const isExpiringSoon = remHours < (reservationConfig?.warningThresholdHours || 2);

                return (
                  <div
                    key={res.id}
                    className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      {/* Top tags */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            #{res.vehicle.stockId}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200 flex items-center gap-1 font-mono">
                            <Lock className="w-2.5 h-2.5 text-amber-600" />
                            <span>{reservationConfig?.defaultHoldHours || 24}h Lock</span>
                          </span>
                        </div>

                        <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${isExpiringSoon
                          ? "bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-400/30 animate-pulse"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`} title={isExpiringSoon ? "Warning: Hold expiring soon" : "Holding countdown"}>
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>{remHours}h {remMins}m left</span>
                        </span>
                      </div>

                      {/* Studio Vehicle Preview (Clean white canvas with floor shadow) */}
                      <div className="relative w-full h-40 flex items-center justify-center my-2">
                        <div className="absolute bottom-2 w-3/4 h-3 bg-black/15 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />
                        <img
                          src={res.vehicle?.images?.[0] || "/images/cars/kicks.png"}
                          alt={res.vehicle?.model || "Vehicle"}
                          className="relative z-10 w-full h-full object-contain filter drop-shadow-md select-none"
                        />
                      </div>

                      {/* Vehicle Spec */}
                      <div>
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {res.vehicle.year} {res.vehicle.make} {res.vehicle.model}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">
                          {res.vehicle.grade} · {res.vehicle.fuelType} · {res.vehicle.odometerKm.toLocaleString()} km · Grade {res.vehicle.auctionGrade || "4.5"}
                        </p>
                      </div>

                      {/* Guaranteed Landed Price Snapshot */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Guaranteed Landed:</span>
                          <span className="font-mono text-base font-bold text-slate-900">
                            ${res.priceSnapshot.totalBuyPriceNZD.toLocaleString()} NZD
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-200/60">
                          <span>FOB: ¥{res.priceSnapshot.fobJPY.toLocaleString()}</span>
                          <span className="text-emerald-700 font-semibold">Terms Agreed</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setConfirmingHoldVehicleId(res.vehicleId)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Order</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelMyHold(res.id)}
                        className="py-2.5 px-3 rounded-xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                        title="Cancel hold under Section 6.2 cooling-off right without penalty"
                      >
                        <Unlock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. TAB: Active Orders & Shipments                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {(mode === "ORDERS" || (!mode && activeTab === "ORDERS")) && (
        <div className="space-y-6">
          {/* If viewing a specific order detail dossier */}
          {viewingOrderId ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Back to Orders Grid Action Bar */}
              <div className="flex items-center justify-between bg-white rounded-[24px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setViewingOrderId(null);
                  }}
                  className="btn-outline py-2 px-4 rounded-xl text-xs font-bold text-slate-800 hover:text-[#C3002F] flex items-center gap-2 cursor-pointer shadow-2xs transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Back to Orders Grid</span>
                </button>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-500 font-bold">
                    Order: {selectedOrder?.orderNumber}
                  </span>
                  <span className="font-mono text-[11px] font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1.5">
                    <Ship className="w-3.5 h-3.5 text-blue-600" />
                    <span>RoRo: {selectedOrder?.currentMilestone.replace(/_/g, " ")}</span>
                  </span>
                </div>
              </div>

              {/* Full-Width Detailed Order Cockpit */}
              {selectedOrder && (
                <div className="space-y-6">
                  {/* Hero Vehicle & Identification Block */}
                  <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">
                            #{selectedOrder.vehicle.stockId}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                            Order: {selectedOrder.orderNumber}
                          </span>
                          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1">
                            <Ship className="w-3 h-3 text-blue-600" />
                            <span>RoRo: {selectedOrder.currentMilestone.replace(/_/g, " ")}</span>
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-[#C3002F] border border-rose-100">
                            {selectedOrder.vehicle.fuelType}
                          </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                          {selectedOrder.vehicle.year} {selectedOrder.vehicle.make} {selectedOrder.vehicle.model}
                        </h2>

                        <p className="text-xs text-slate-500 font-medium">
                          {selectedOrder.vehicle.grade} · {selectedOrder.vehicle.transmission} · {selectedOrder.vehicle.engineCc}cc · Color: {selectedOrder.vehicle.color}
                        </p>

                        {/* 1-Click Copy VIN & Stock */}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-500">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            <span className="text-slate-400">VIN:</span>
                            <strong className="text-slate-800">{selectedOrder.vehicle.vinChassis}</strong>
                            <button
                              type="button"
                              onClick={() => handleCopy(selectedOrder.vehicle.vinChassis, "vin")}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                              title="Copy VIN"
                            >
                              {copiedField === "vin" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            <span className="text-slate-400">Auction Grade:</span>
                            <strong className="text-slate-800">★ {selectedOrder.vehicle.auctionGrade || "4.5"} / {selectedOrder.vehicle.interiorGrade || "A"}</strong>
                          </div>

                          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                            <span className="text-slate-400">Odometer:</span>
                            <strong className="text-slate-800">{selectedOrder.vehicle.odometerKm.toLocaleString()} {selectedOrder.vehicle.odometerUnit || "km"}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Block */}
                      <div className="sm:text-right shrink-0 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                          Total Buy Price (Fixed Landed)
                        </span>
                        <div className="text-2xl font-bold font-mono text-slate-900">
                          ${selectedOrder.priceBreakdown.totalBuyPriceNZD.toLocaleString()} <span className="text-xs font-sans text-slate-500">NZD</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          FOB: ¥{selectedOrder.priceBreakdown.fobJPY.toLocaleString()} ({selectedOrder.pricingZoneId})
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            setShowPriceBreakdown(!showPriceBreakdown);
                          }}
                          className="text-[11px] text-[#C3002F] hover:text-[#A10026] font-bold mt-2 flex items-center sm:justify-end gap-1 cursor-pointer"
                        >
                          <span>{showPriceBreakdown ? "Hide Inclusions" : "View Cost Inclusions"}</span>
                          {showPriceBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Studio Showcase Vehicle Image */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 flex items-center justify-center relative overflow-hidden h-56">
                      <div className="absolute bottom-4 w-3/4 h-4 bg-black/15 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />
                      <img
                        src={selectedOrder.vehicle?.images?.[0] || "/images/cars/kicks.png"}
                        alt={selectedOrder.vehicle?.model || "Vehicle"}
                        className="max-h-52 w-full object-contain filter drop-shadow-xl relative z-10"
                      />
                    </div>

                    {/* Organised Vehicle Details Consistency (Sections A, B, C, E) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                      {/* Section A: Vehicle Identification */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
                          <span className="w-2 h-2 rounded-full bg-[#0A0A0A]" />
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                            A. Identification
                          </h4>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Stock ID:</span><span className="font-mono font-bold text-slate-900">#{selectedOrder.vehicle.stockId}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Chassis / VIN:</span><span className="font-mono text-slate-800 font-semibold truncate max-w-[130px]">{selectedOrder.vehicle.vinChassis}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Make / Model:</span><span className="font-semibold text-slate-800">{selectedOrder.vehicle.make} {selectedOrder.vehicle.model}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Variant / Trim:</span><span className="font-semibold text-slate-800">{selectedOrder.vehicle.grade}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Model Year:</span><span className="font-mono font-bold text-slate-800">{selectedOrder.vehicle.year}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Odometer:</span><span className="font-mono text-slate-800">{selectedOrder.vehicle.odometerKm.toLocaleString()} {selectedOrder.vehicle.odometerUnit || "km"}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Transmission:</span><span className="text-slate-800">{selectedOrder.vehicle.transmission}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Exterior Colour:</span><span className="text-slate-800">{selectedOrder.vehicle.color}</span></div>
                        </div>
                      </div>

                      {/* Section B: Vehicle Condition */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                            B. Vehicle Condition
                          </h4>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Auction Grade:</span><span className="font-mono font-bold text-amber-700">★ {selectedOrder.vehicle.auctionGrade || "4.5"}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Interior Grade:</span><span className="font-bold text-slate-800">{selectedOrder.vehicle.interiorGrade || "A"}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Exterior Grade:</span><span className="font-bold text-slate-800">{selectedOrder.vehicle.exteriorGrade || "A"}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Overall Condition:</span><span className="text-emerald-700 font-semibold">{selectedOrder.vehicle.overallCondition || "Clean Japanese Grade"}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Known Defects:</span><span className="text-slate-700">{selectedOrder.vehicle.knownDefects?.[0] || "None Recorded"}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Condition Report:</span><span className="text-slate-700 font-medium">USS Digital Dossier</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Supporting Doc:</span><span className="text-emerald-700 font-medium">Verified PDF</span></div>
                        </div>
                      </div>

                      {/* Section C: Vehicle Pricing Inputs */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                            C. Pricing Inputs
                          </h4>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Acquisition Price:</span><span className="font-mono font-bold text-slate-900">¥{selectedOrder.priceBreakdown.fobJPY.toLocaleString()}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">NZD Equivalent:</span><span className="font-mono font-bold text-slate-900">${selectedOrder.priceBreakdown.fobNZD.toLocaleString()} NZD</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Currency:</span><span className="font-mono text-slate-800">JPY / NZD</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Purchase Basis:</span><span className="font-mono font-bold text-slate-800">{selectedOrder.vehicle.purchasePriceBasis || "FOB"}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Pricing Profile:</span><span className="text-slate-800 font-medium">{selectedOrder.pricingZoneId}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Total Fixed Landed:</span><span className="font-mono font-bold text-slate-900">${selectedOrder.priceBreakdown.totalBuyPriceNZD.toLocaleString()} NZD</span></div>
                        </div>
                      </div>

                      {/* Section E: Listing / Order Information */}
                      <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
                          <span className="w-2 h-2 rounded-full bg-slate-700" />
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                            E. Listing &amp; Order
                          </h4>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Listing Status:</span><span className="font-mono font-bold text-slate-900">{selectedOrder.vehicle.status}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">RoRo Status:</span><span className="font-mono font-bold text-blue-700">RoRo: {selectedOrder.currentMilestone.replace(/_/g, " ")}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Order Reference:</span><span className="font-mono font-semibold text-slate-800">{selectedOrder.orderNumber}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Stock Reference:</span><span className="font-mono text-slate-800">{selectedOrder.vehicle.stockReference || `USS-JAA-${selectedOrder.vehicle.stockId.slice(-4)}`}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Order Date:</span><span className="font-mono text-slate-600">{selectedOrder.orderedAt ? new Date(selectedOrder.orderedAt).toLocaleDateString() : "2026-10-24"}</span></div>
                          <div className="flex justify-between py-0.5"><span className="text-slate-400">Last Updated:</span><span className="font-mono text-slate-600">{new Date().toISOString().slice(0, 10)}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Section 4 Commercial Inclusions Breakdown (Expandable) */}
                    {showPriceBreakdown && (
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-slate-900">
                              Section 4 Commercial Inclusions Guarantee
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Assigned Profile: {selectedOrder.pricingZoneId} (Upper North Island)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[11px]">
                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                            <span className="text-slate-400 block font-medium">Vehicle Acquisition:</span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              ${selectedOrder.priceBreakdown.fobNZD.toLocaleString()} NZD
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">¥{selectedOrder.priceBreakdown.fobJPY.toLocaleString()}</span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                            <span className="text-slate-400 block font-medium">RoRo Ocean Freight:</span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              ${selectedOrder.priceBreakdown.oceanFreightNZD.toLocaleString()} NZD
                            </span>
                            <span className="text-[10px] text-slate-400">Direct RoRo Liner</span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                            <span className="text-slate-400 block font-medium">Customs &amp; NZ GST:</span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              ${(selectedOrder.priceBreakdown.customsProcessingNZD + selectedOrder.priceBreakdown.gstNZD).toLocaleString()} NZD
                            </span>
                            <span className="text-[10px] text-slate-400">MPI Bio &amp; 15% GST Entry</span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                            <span className="text-slate-400 block font-medium">MR2A Compliance Pass:</span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              ${selectedOrder.priceBreakdown.complianceInspectionNZD.toLocaleString()} NZD
                            </span>
                            <span className="text-[10px] text-slate-400">NZTA Structural Standards</span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                            <span className="text-slate-400 block font-medium">2x Domestic Movements:</span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              ${selectedOrder.priceBreakdown.zoneDeliveryNZD.toLocaleString()} NZD
                            </span>
                            <span className="text-[10px] text-slate-400">Port ➔ Center ➔ Yard</span>
                          </div>

                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-0.5">
                            <span className="text-slate-400 block font-medium">Nissan Programme Fee:</span>
                            <span className="font-mono font-bold text-slate-900 block text-xs">
                              ${selectedOrder.priceBreakdown.programmeFeeNZD.toLocaleString()} NZD
                            </span>
                            <span className="text-[10px] text-slate-400">Provenance &amp; Quality Audit</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Section 4 Commercial Boundary Rule:</strong> The fixed price assumes a standard compliance pass. Separately chargeable work will be identified at the time of invoicing.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>



                  {/* Defect Remediation & Additional Cost Action */}
                  {selectedOrder.additionalCosts.length > 0 && (
                    <div className="space-y-4">
                      {selectedOrder.additionalCosts.map((cost) => {
                        const isPending = cost.status === "PENDING_DEALER_APPROVAL";
                        const isApproved = cost.status === "APPROVED";

                        return (
                          <div
                            key={cost.id}
                            className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isPending
                              ? "bg-amber-50/70 border-amber-300"
                              : isApproved
                                ? "bg-emerald-50/60 border-emerald-300"
                                : "bg-slate-50 border-slate-200"
                              }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/80">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600" />
                                <h3 className="font-bold text-sm text-slate-900">
                                  Compliance Defect Remediation Sign-Off
                                </h3>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-mono text-base font-bold text-slate-900">
                                  +${cost.amountNZD.toLocaleString()} NZD
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono ${isPending
                                  ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  }`}>
                                  {isPending ? "Action Required" : cost.status}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-700 leading-relaxed">
                              {cost.description}
                            </p>

                            <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between text-slate-600 text-[11px]">
                                <span>Remediation Facility: <strong>VINZ Penrose Compliance Hub</strong></span>
                                <span className="font-mono text-slate-400">Proposed: {cost.proposedAt ? new Date(cost.proposedAt).toLocaleDateString() : "Active"}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 italic">
                                {cost.notes || "Nissan OEM replacement component held in stock. Turnaround time: 24 hours."}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  audio.playSubtleClick();
                                  setViewingDefectPhoto(true);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Inspect Photographic Evidence</span>
                              </button>

                              {isPending && (
                                <div className="flex items-center gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => handleDeclineCost(selectedOrder.id, cost.id)}
                                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                                  >
                                    Decline Remediation
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveCost(selectedOrder.id, cost.id)}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve (+${cost.amountNZD} NZD)</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Order Delivery Timeline (Matching Reference Layout & Authentic Nissan NZ Corridor Data) */}
                  <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                          Order Delivery Timeline
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          End-to-end Pacific corridor tracking from Yokohama export hub to dealership handover.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          5 Programme Stages
                        </span>
                        <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Live RoRo Tracking
                        </span>
                      </div>
                    </div>

                    <OrderCorridorTimeline order={selectedOrder} />
                  </div>

                  {/* Compliance & Shipping Documents Vault */}
                  <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-slate-100 gap-3">
                      <div className="flex items-start gap-2.5">
                        <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">
                            Compliance &amp; Shipping Documents Vault
                          </h3>
                          <ul className="text-[11px] text-slate-500 mt-1.5 space-y-0.5 list-disc list-inside">
                            <li>Upload multiple vehicle photographs.</li>
                            <li>Upload condition report.</li>
                            <li>Upload supporting vehicle documents.</li>
                            <li>Associate all images and documents with the correct stock record.</li>
                          </ul>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {selectedOrder.documents?.length || 4} Verified Documents
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {selectedOrder.documents && selectedOrder.documents.length > 0 ? (
                        selectedOrder.documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  {doc.type.replace(/_/g, " ")}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(doc.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 pt-1" title={doc.name}>
                                {doc.name}
                              </h4>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
                              <span className="text-[10px] text-slate-400 font-mono">
                                Official Digital Seal
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    audio.playSubtleClick();
                                    setViewingDocument({
                                      name: doc.name,
                                      type: doc.type,
                                      date: new Date(doc.uploadedAt).toLocaleDateString(),
                                    });
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                                  <span>View</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDownloadDoc(doc.name)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>PDF</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-6 text-xs text-slate-400 italic">
                          No documents uploaded yet for this allocation.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Destination Yard Delivery Protocol */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/90 p-5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-600">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#C3002F] shrink-0" />
                        <span className="font-bold text-slate-900">Designated Franchise Delivery Destination:</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        {selectedOrder.deliveryAddress || "360 Great South Road, Greenlane, Auckland 1051"}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-[11px] font-bold shadow-2xs self-start sm:self-auto">
                      Delivery Zone: {selectedOrder.pricingZoneId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Orders Grid Cards View */
            <div className="space-y-6 animate-in fade-in">
              {/* Search & Filter Strip */}
              <div className="bg-white rounded-[24px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter by Order #, VIN, model or vessel..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#C3002F] focus:bg-white"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Filter Chips */}
                  <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                    {[
                      { id: "ALL", label: "All Milestones" },
                      { id: "IN_TRANSIT", label: "On Vessel" },
                      { id: "BORDER", label: "NZ Compliance" },
                      { id: "READY", label: "Ready / Yard" },
                    ].map((chip) => (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => {
                          audio.playSubtleClick();
                          setStatusFilter(chip.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${statusFilter === chip.id
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-800"
                          }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono shrink-0">
                  Showing <strong>{filteredOrders.length}</strong> of {dealerOrders.length} Orders
                </div>
              </div>

              {dealerOrders.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
                    <Ship className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No Wholesale Orders Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Your franchise dealership does not currently have active vehicle allocations. Browse the Stock Catalog to place a 24-hour exclusivity lock.
                  </p>
                </div>
              ) : (
                /* Orders Grid Layout (2-3 Columns) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 animate-in fade-in">
                  {filteredOrders.map((order) => {
                    const hasPendingCost = order.additionalCosts.some(
                      (c) => c.status === "PENDING_DEALER_APPROVAL"
                    );

                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          audio.playSubtleClick();
                          setSelectedOrderId(order.id);
                          setViewingOrderId(order.id);
                        }}
                        className="bg-white rounded-[24px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between cursor-pointer group"
                      >
                        <div>
                          {/* Card Top Row: Order # + Status Pill */}
                          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div>
                              <span className="font-mono font-bold text-sm text-slate-900 group-hover:text-[#C3002F] transition-colors">
                                {order.orderNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                ETA {order.etaDeliveryDate ? new Date(order.etaDeliveryDate).toLocaleDateString([], { month: "short", day: "numeric" }) : "TBD"}
                              </span>
                            </div>

                            {hasPendingCost ? (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Approval Needed</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono flex items-center gap-1">
                                <Ship className="w-3 h-3 text-blue-600" />
                                <span>RoRo: {order.currentMilestone.replace(/_/g, " ")}</span>
                              </span>
                            )}
                          </div>

                          {/* Center Floating Studio Vehicle Image */}
                          <div className="relative w-full h-40 my-3 flex items-center justify-center">
                            <div className="absolute bottom-2 w-3/4 h-3 bg-black/15 rounded-[50%] blur-sm pointer-events-none transform scale-y-50" />
                            <img
                              src={order.vehicle?.images?.[0] || "/images/cars/kicks.png"}
                              alt={order.vehicle?.model || "Vehicle"}
                              className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_10px_14px_rgba(0,0,0,0.12)] group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 select-none"
                            />
                          </div>

                          {/* Vehicle Title & Specs */}
                          <div className="space-y-1">
                            <h3 className="font-bold text-base text-slate-900 group-hover:text-[#C3002F] transition-colors truncate">
                              {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium truncate">
                              VIN: {order.vehicle.vinChassis} · {order.vehicle.odometerKm.toLocaleString()} km · Grade {order.vehicle.auctionGrade || "4.5"}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer: Price & View Dossier Action */}
                        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Landed Total</span>
                            <span className="font-mono font-bold text-base text-slate-900">
                              ${order.priceBreakdown.totalBuyPriceNZD.toLocaleString()} <span className="text-xs font-normal text-slate-400">NZD</span>
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              audio.playSubtleClick();
                              setSelectedOrderId(order.id);
                              setViewingOrderId(order.id);
                            }}
                            className="btn-outline py-2 px-3.5 rounded-xl text-xs font-bold text-slate-800 hover:text-[#C3002F] hover:border-[#C3002F]/40 flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Official Verified Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Digital Document Verification</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Document:</span>
                <strong className="text-slate-800 text-right">{viewingDocument.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="font-mono font-bold text-slate-700">{viewingDocument.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verified Date:</span>
                <span className="font-mono text-slate-700">{viewingDocument.date}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-400">Validation Status:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> JEVIC / NZTA Signed
                </span>
              </div>
            </div>

            <div className="h-40 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2 p-4 text-center">
              <FileText className="w-8 h-8 text-slate-400" />
              <span>Official Japanese Export &amp; Provenance Certificate PDF</span>
              <span className="text-[10px] text-slate-400 font-mono">Hash: 8f9b2...e41d</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingDocument(null)}
                className="btn-outline px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleDownloadDoc(viewingDocument.name)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black cursor-pointer shadow-xs"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Defect Photographic Evidence Viewer Modal */}
      {viewingDefectPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">MR2A Defect Photographic Inspection</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingDefectPhoto(false)}
                className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-800">
              <img
                src="https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80"
                alt="Defect Photographic Evidence"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/70 text-white text-[10px] font-mono">
                VINZ Auckland Inspection Bay 2 · High-Res Macro Evidence
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Front lower compliance inspection identified minor stone chip pitting exceeding the 1.5mm NZTA Warrant of Fitness safety threshold. Remediation involves replacement with an OEM Nissan part held in Penrose inventory.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingDefectPhoto(false)}
                className="btn-outline px-5 py-2 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Hold to Order Confirmation Modal */}
      {confirmingHoldVehicleId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-[#C3002F] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-slate-900">
                Confirm Wholesale Allocation
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                By confirming, you execute Section 3 wholesale purchase under your agreed Terms of Trade. The fixed landed buy price will be invoiced on vessel dispatch.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Vehicle Unit:</span>
                <strong className="text-slate-800">{confirmingHoldVehicleId}</strong>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Terms Version:</span>
                <span className="text-slate-800">v2026.1 Bound</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Hold State:</span>
                <span className="text-emerald-700 font-bold">24h Exclusivity Active</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingHoldVehicleId(null)}
                className="btn-outline flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmHoldToOrder(confirmingHoldVehicleId)}
                className="flex-1 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Execute Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}