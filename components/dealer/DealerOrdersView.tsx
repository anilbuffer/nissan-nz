"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import OrderCorridorTimeline from "./OrderCorridorTimeline";
import { Order, OrderMilestone, ReservationRequest, ZoneId, LandedPriceBreakdown } from "@/lib/types";
import { MOCK_VEHICLES } from "@/lib/mock-data";
import { calculateLandedPrice, OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import StatusBadge from "@/components/common/StatusBadge";
import Pagination from "@/components/common/Pagination";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { audio } from "@/lib/sound";
import { getModelAngleImages } from "@/lib/vehicle-media";
import VehicleSpecificationsTabs from "./VehicleSpecificationsTabs";
import FullPageVehicleDetail from "./FullPageVehicleDetail";
import {
  Car,
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
  TrendingUp,
  Star,
  ArrowLeft,
  Sparkles,
  Info,
  Layers,
  Calendar,
  DollarSign,
  AlertTriangle,
  BadgeCheck,
  RotateCcw,
} from "lucide-react";


export function getBrandMilestoneLabel(milestone: OrderMilestone | string): { stageNumber: number; stageName: string; displayBadge: string } {
  switch (milestone) {
    case "ORDER_CONFIRMED":
      return { stageNumber: 1, stageName: "Order Confirmed", displayBadge: "1. Order Confirmed" };
    case "JAPAN_VERIFICATION":
      return { stageNumber: 2, stageName: "Verification", displayBadge: "2. Verification" };
    case "BOOKED_FOR_SHIPPING":
      return { stageNumber: 3, stageName: "Shipment", displayBadge: "3. Shipment" };
    case "IN_TRANSIT":
      return { stageNumber: 4, stageName: "Transit", displayBadge: "4. Transit" };
    case "NZ_BORDER_PROCESSING":
      return { stageNumber: 5, stageName: "Customs Release", displayBadge: "5. Customs Release" };
    case "COMPLIANCE":
    case "AWAITING_ADDITIONAL_COST":
      return { stageNumber: 6, stageName: "MR2A", displayBadge: "6. MR2A" };
    case "READY_FOR_DELIVERY":
      return { stageNumber: 7, stageName: "Delivery Ready", displayBadge: "7. Delivery Ready" };
    case "DELIVERED":
      return { stageNumber: 8, stageName: "Delivered", displayBadge: "8. Delivered" };
    default:
      return { stageNumber: 4, stageName: "Transit", displayBadge: "4. Transit" };
  }
}
export const getRoRoMilestoneLabel = getBrandMilestoneLabel;

const MILESTONE_STEPS: { key: OrderMilestone; label: string; actor: string; desc: string }[] = [
  { key: "ORDER_CONFIRMED", label: "Order Confirmed", actor: "Dealership & Autohub Ops", desc: "Wholesale allocation accepted and entered into programme schedule." },
  { key: "JAPAN_VERIFICATION", label: "Verification", actor: "Japan Logistics Hub", desc: "Physical yard inspection, JEVIC odometer verification & export deregistration." },
  { key: "BOOKED_FOR_SHIPPING", label: "Shipment", actor: "AutoHub Shipping Ops", desc: "RoRo vessel space confirmed and port staging completed." },
  { key: "IN_TRANSIT", label: "Transit", actor: "Trans-Pacific RoRo Lines", desc: "Coastal and ocean transit across Pacific corridor to Ports of Auckland." },
  { key: "NZ_BORDER_PROCESSING", label: "Customs Release", actor: "NZ Customs & MPI", desc: "MPI biosecurity heat treatment and cleared GST import entry assessment." },
  { key: "COMPLIANCE", label: "MR2A", actor: "VINZ / VTNZ Compliance Centre", desc: "NZTA standard safety pass, brake testing, and EV state of health certification." },
  { key: "READY_FOR_DELIVERY", label: "Delivery Ready", actor: "AutoHub Domestic Carrier", desc: "Compliance plate stamped; carrier dispatch to franchise drop-off yard." },
  { key: "DELIVERED", label: "Delivered", actor: "Franchise Receiving Yard", desc: "Final handover, transport receipt signed, and entered into yard inventory." },
];

export interface DealerOrdersViewProps {
  mode?: "ORDERS" | "RESERVE";
}


function ZeroEmissionBadge() {
  return (
    <div className="flex flex-col items-center select-none pointer-events-none scale-90">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 p-0.5 shadow-sm flex items-center justify-center">
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <span className="text-sky-500 font-bold text-base font-sans leading-none lowercase italic -translate-x-0.5">e</span>
        </div>
      </div>
      <span className="text-[9px] font-bold tracking-tight text-slate-700 uppercase mt-0.5">
        Zero Emission
      </span>
    </div>
  );
}

export default function DealerOrdersView({ mode }: DealerOrdersViewProps = {}) {
  const { currentDealer, currentUser } = useAuth();
  const { vehicles, orders, reservations, releaseHold, cancelReservation, respondToAdditionalCost, confirmAllocation, reservationConfig, pricingConfig } = useProgramme();

  const [activeTab, setActiveTab] = useState<"ORDERS" | "HOLDS">(mode === "RESERVE" ? "HOLDS" : "ORDERS");

  useEffect(() => {
    if (mode === "RESERVE") {
      setActiveTab("HOLDS");
    } else if (mode === "ORDERS") {
      setActiveTab("ORDERS");
    }
  }, [mode]);
  const [activeImageIdx, setActiveImageIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("ALL");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{ name: string; type: string; date: string } | null>(null);
  const [viewingDefectPhoto, setViewingDefectPhoto] = useState<boolean>(false);
  const [confirmingHoldVehicleId, setConfirmingHoldVehicleId] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [mobileSubTab, setMobileSubTab] = useState<"LIST" | "DETAIL">("LIST");
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  const targetDealerId = currentDealer?.id || currentUser?.dealerId;

  // Filter orders strictly for this dealer (strict tenant boundary)
  const dealerOrders = useMemo(
    () => orders.filter((o) => (targetDealerId ? o.dealerId === targetDealerId : false)),
    [orders, targetDealerId]
  );

  // Filter 24h holds strictly for this dealer
  const dealerHolds = reservations.filter(
    (r) =>
      r.status === "ACTIVE_HOLD" &&
      (targetDealerId ? r.dealerId === targetDealerId : false)
  );

  // Filter confirmed wholesale allocations strictly for this dealer
  const dealerConfirmedHolds = reservations.filter(
    (r) =>
      r.status === "CONFIRMED_ALLOCATED" &&
      (targetDealerId ? r.dealerId === targetDealerId : false)
  );

  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    dealerOrders[0]?.id || ""
  );
  const [now] = useState(() => Date.now());

  // Keep selected order valid
  const selectedOrder =
    dealerOrders.find((o) => o.id === (viewingOrderId || selectedOrderId)) ||
    orders.find((o) => o.id === (viewingOrderId || selectedOrderId)) ||
    dealerOrders[0] ||
    orders[0];

  // Filtered orders list by search query and status
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dealerOrders.filter((order) => {
      if (orderStatusFilter !== "ALL" && order.vehicle.status !== orderStatusFilter) {
        return false;
      }
      return (
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.vehicle.vinChassis.toLowerCase().includes(q) ||
        order.vehicle.stockId.toLowerCase().includes(q) ||
        order.vehicle.model.toLowerCase().includes(q) ||
        (order.vesselName && order.vesselName.toLowerCase().includes(q))
      );
    });
  }, [dealerOrders, searchQuery, orderStatusFilter]);

  // Orders Pagination (10 entries max per page)
  const ORDERS_PER_PAGE = 10;
  const [currentOrderPage, setCurrentOrderPage] = useState(1);

  useEffect(() => {
    setCurrentOrderPage(1);
  }, [searchQuery, orderStatusFilter]);

  const totalOrderPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const validPage = Math.min(Math.max(1, currentOrderPage), totalOrderPages);
    const start = (validPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, currentOrderPage, totalOrderPages]);

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
    <div className="space-y-6 max-w-8xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Clean Simple Top Header & View Tabs (Hidden when inspecting an order) */}
      {/* ─────────────────────────────────────────────────────────── */}
      {!viewingOrderId && (
        <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      )}

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
            <div className="p-5 sm:p-6 rounded-[16px] bg-emerald-50/90 border border-emerald-200 shadow-sm space-y-4">
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
                        <StatusBadge status="CONFIRMED_ALLOCATED" size="sm" />
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
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white text-xs font-semibold text-center transition-all shadow-xs hover:shadow-soft flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
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
                const diffMs = new Date(res.expiresAt).getTime() - now;
                const remHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                const remMins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
                const isExpiringSoon = remHours < (reservationConfig?.warningThresholdHours || 2);

                return (
                  <div
                    key={res.id}
                    className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] transition-all flex flex-col justify-between space-y-5"
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
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200/60">
                          <span>Delivery: {res.priceSnapshot.zoneId || "ZONE_1"}</span>
                          <span className="text-emerald-700 font-semibold">24h Price Lock</span>
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
          {/* If viewing a specific order detail dossier - 100% consistent with /dealer/vehicles/[id] */}
          {viewingOrderId ? (
            <FullPageVehicleDetail
              vehicleId={selectedOrder.vehicle.id}
              vehicleData={selectedOrder.vehicle}
              orderId={selectedOrder.id}
              orderData={selectedOrder}
              onBack={() => {
                audio.playSubtleClick();
                setViewingOrderId(null);
              }}
              backLabel="Back to Orders Grid"
            />
          ) : (
            /* Orders Grid Cards View */
            <div className="space-y-6 animate-in fade-in">
              {/* Search & Filter Strip */}
              <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Dropdown Selector */}
                  <div className="relative shrink-0">
                    <select
                      value={orderStatusFilter}
                      onChange={(e) => {
                        audio.playSubtleClick();
                        setOrderStatusFilter(e.target.value);
                      }}
                      aria-label="Filter by Status"
                      className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-slate-800 font-normal cursor-pointer shadow-2xs"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="ALLOCATED">Allocated</option>
                      <option value="BUYED">Buyed</option>
                      <option value="SOLD">Sold</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>

                  {/* Reset Button */}
                  {(searchQuery || orderStatusFilter !== "ALL") && (
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setSearchQuery("");
                        setOrderStatusFilter("ALL");
                      }}
                      className="text-xs text-[#C3002F] hover:text-[#A10026] font-bold flex items-center gap-1 cursor-pointer transition-colors px-2 py-1.5 shrink-0"
                      title="Reset filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
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
                <div className="space-y-6">
                  {/* Orders Grid Layout (2-3 Columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 animate-in fade-in">
                    {paginatedOrders.map((order) => {
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
                          className="bg-white rounded-[16px] border border-slate-200 hover:border-slate-300 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between cursor-pointer group"
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
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Confirmed Order</span>
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

                  {/* Orders Pagination Bar (10 max entries per page) */}
                  <Pagination
                    currentPage={currentOrderPage}
                    totalPages={totalOrderPages}
                    totalItems={filteredOrders.length}
                    itemsPerPage={ORDERS_PER_PAGE}
                    onPageChange={(p) => {
                      setCurrentOrderPage(p);
                    }}
                    itemName="orders"
                  />
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