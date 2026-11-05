"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Order, OrderMilestone, AdditionalCostItem, VehicleSupportingDoc } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import { getModelAngleImages } from "@/lib/vehicle-media";
import AdditionalCostCreatorModal from "./AdditionalCostCreatorModal";
import VehicleSpecificationsTabs from "@/components/dealer/VehicleSpecificationsTabs";
import {
  Ship,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Calendar,
  Anchor,
  FileCheck2,
  FileText,
  Search,
  Check,
  Eye,
  Car,
  Star,
  Building2,
  X,
  Lock,
  ArrowLeft,
  Copy,
  Fuel,
  Sparkles,
  DollarSign,
  Layers,
  Wrench,
  Download,
  ShoppingBag,
  ShieldCheck,
  RotateCcw,
  Truck,
} from "lucide-react";

const MILESTONE_SEQUENCE: { key: OrderMilestone; label: string }[] = [
  { key: "ORDER_CONFIRMED", label: "Order Confirmed" },
  { key: "JAPAN_VERIFICATION", label: "Verification" },
  { key: "BOOKED_FOR_SHIPPING", label: "Shipment" },
  { key: "IN_TRANSIT", label: "Transit" },
  { key: "NZ_BORDER_PROCESSING", label: "Customs Release" },
  { key: "COMPLIANCE", label: "MR2A" },
  { key: "READY_FOR_DELIVERY", label: "Delivery Ready" },
  { key: "DELIVERED", label: "Delivered" },
];

interface AllocationMilestonesViewProps {
  initialOrderId?: string;
  onSelectOrder?: (orderId: string) => void;
  onBackToOrders?: () => void;
}

export default function AllocationMilestonesView({
  initialOrderId,
  onSelectOrder,
  onBackToOrders,
}: AllocationMilestonesViewProps = {}) {
  const router = useRouter();
  const params = useParams();
  const routeOrderId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { orders, advanceOrderMilestone, attachAdditionalCost: addCost } = useProgramme();

  const [viewingOrderId, setViewingOrderId] = useState<string | null>(initialOrderId || routeOrderId || null);
  const [selectedOrderForCost, setSelectedOrderForCost] = useState<Order | null>(null);
  const [editingMilestoneOrderId, setEditingMilestoneOrderId] = useState<string | null>(null);
  const [nextMilestoneKey, setNextMilestoneKey] = useState<OrderMilestone>("NZ_BORDER_PROCESSING");
  const [milestoneNotes, setMilestoneNotes] = useState("MPI biosecurity heat treatment and border discharge verified.");
  const [editingEta, setEditingEta] = useState<string>("");
  const [editingVessel, setEditingVessel] = useState<string>("");
  const [editingVoyage, setEditingVoyage] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [milestoneFilter, setMilestoneFilter] = useState<string>("ALL");
  const [copiedVin, setCopiedVin] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeDocPreview, setActiveDocPreview] = useState<{
    name: string;
    type: string;
    size: string;
  } | null>(null);

  useEffect(() => {
    if (initialOrderId) {
      setViewingOrderId(initialOrderId);
    } else if (routeOrderId) {
      setViewingOrderId(routeOrderId);
    }
  }, [initialOrderId, routeOrderId]);

  const viewingOrder = viewingOrderId
    ? orders.find((o) => o.id === viewingOrderId || o.orderNumber === viewingOrderId) || null
    : null;

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.vehicle?.vinChassis?.toLowerCase().includes(q) ||
      order.vehicle?.model?.toLowerCase().includes(q) ||
      order.dealerName?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (milestoneFilter === "IN_TRANSIT") {
      return order.currentMilestone === "IN_TRANSIT";
    }
    if (milestoneFilter === "COMPLIANCE") {
      return (
        order.currentMilestone === "NZ_BORDER_PROCESSING" ||
        order.currentMilestone === "COMPLIANCE" ||
        order.currentMilestone === "AWAITING_ADDITIONAL_COST"
      );
    }
    if (milestoneFilter === "READY_FOR_DELIVERY") {
      return order.currentMilestone === "READY_FOR_DELIVERY" || order.currentMilestone === "DELIVERED";
    }

    return true;
  });

  const handleViewDossier = (order: Order) => {
    audio.playSubtleClick();
    setViewingOrderId(order.id);
    setActiveImageIdx(0);
    if (onSelectOrder) {
      onSelectOrder(order.id);
    } else {
      router.push(`/admin/orders/${order.id}`);
    }
  };

  const handleBackToOrders = () => {
    audio.playSubtleClick();
    setViewingOrderId(null);
    if (onBackToOrders) {
      onBackToOrders();
    } else {
      router.push("/admin/orders");
    }
  };

  const handleCopyVin = (vin: string) => {
    navigator.clipboard.writeText(vin);
    setCopiedVin(true);
    audio.playSubtleClick();
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const startEditingMilestone = (order: Order) => {
    audio.playSubtleClick();
    if (editingMilestoneOrderId === order.id) {
      setEditingMilestoneOrderId(null);
    } else {
      setEditingMilestoneOrderId(order.id);
      setNextMilestoneKey(order.currentMilestone);
      setMilestoneNotes(
        order.milestones?.find((m) => m.key === order.currentMilestone)?.notes ||
        "Carrier progression verified by Autohub Logistics."
      );
      setEditingEta(order.etaDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
      setEditingVessel(order.vesselName || "Trans-Pacific RoRo V.49");
      setEditingVoyage(order.voyageNumber || "TP-2649");
    }
  };

  const handleAdvanceMilestone = (orderId: string) => {
    audio.playSuccessChime();
    advanceOrderMilestone(orderId, nextMilestoneKey, milestoneNotes, {
      etaDeliveryDate: editingEta,
      vesselName: editingVessel,
      voyageNumber: editingVoyage,
    });
    setEditingMilestoneOrderId(null);
    setNotification(`Order ${orderId} successfully advanced to ${nextMilestoneKey.replace(/_/g, " ")}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCostCreated = (orderId: string, costItem: AdditionalCostItem) => {
    addCost(orderId, costItem);
    setNotification(`Additional compliance cost item attached to Order ${orderId}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const images = viewingOrder?.vehicle
    ? getModelAngleImages(viewingOrder.vehicle.model, viewingOrder.vehicle.images?.[0])
    : ["/images/cars/kicks.png"];
  const activeImage = images[activeImageIdx] || images[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* A. FULL INNER PAGE: ORDER DOSSIER (Symmetric to /admin/vehicles) */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {viewingOrder ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Navigation & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <button
              type="button"
              onClick={handleBackToOrders}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300 group text-xs w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Orders</span>
            </button>

            {/* Actions Bar moved up out of the card to prevent crowding */}
            <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setSelectedOrderForCost(viewingOrder)}
                className="btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Additional Cost</span>
              </button>

              <button
                type="button"
                onClick={() => startEditingMilestone(viewingOrder)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Update Milestone &amp; EDD</span>
              </button>

              {viewingOrder.vehicle?.id && (
                <Link
                  href={`/admin/vehicles/${viewingOrder.vehicle.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300 text-xs"
                  title="Open Vehicle Dossier"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Vehicle Dossier</span>
                </Link>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 1. Main Header Card (Symmetric to /admin/vehicles/VEH_023)  */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white text-slate-900 rounded-[16px] p-6 sm:p-7 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
                  <Car className="w-7 h-7" />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                      #{viewingOrder.vehicle?.stockId}
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                      {viewingOrder.orderNumber}
                    </span>
                    <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-sky-50 text-sky-700 border-sky-200 shadow-2xs">
                      <Ship className="w-3 h-3 text-sky-600" />
                      <span>Allocated &amp; Shipping Secured</span>
                    </span>
                  </div>

                  <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                    {viewingOrder.vehicle?.year} {viewingOrder.vehicle?.make} {viewingOrder.vehicle?.model}
                  </h1>
                </div>
              </div>

              {/* Dealership Identity Pill (Clean & Uncrowded) */}
              <div className="flex items-center shrink-0 self-start lg:self-center">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">{viewingOrder.dealerName}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 font-mono">{viewingOrder.pricingZoneId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 2. Top Two Cards Strip: 4 KPI Metrics Strip                 */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. ODOMETER (JEVIC) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                ODOMETER (JEVIC)
              </span>
              <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
                {viewingOrder.vehicle?.odometerKm?.toLocaleString() || "25,600"} {viewingOrder.vehicle?.odometerUnit || "km"}
              </div>
            </div>

            {/* 2. AUCTION & INSPECTION GRADE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                AUCTION &amp; INSPECTION GRADE
              </span>
              <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                ★ {viewingOrder.vehicle?.auctionGrade || "4.5"}
              </div>
            </div>

            {/* 3. Role Commercial Price: Admin sees Total Buy Price NZD + FOB JPY */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                TOTAL BUY PRICE (NZD)
              </span>
              <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight flex items-baseline gap-2">
                <span>${viewingOrder.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()} NZD</span>
              </div>
            </div>

            {/* 4. DELIVERY ETA / VESSEL */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                DELIVERY ETA / VESSEL
              </span>
              <div className="text-base sm:text-xl font-bold text-slate-900 truncate tracking-tight">
                {viewingOrder.etaDeliveryDate || "Pending Schedule"}
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 3. ROW 1: Studio Showcase (Left 7) vs Commercial Panel (Right 5) */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Column (7 cols): Studio Image Showcase */}
            <div className="lg:col-span-7 h-full flex flex-col">
              <div className="bg-white rounded-[16px] p-6 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between space-y-4">
                <div>
                  {/* Main Stage Image */}
                  <div className="relative w-full h-72 sm:h-84 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-200/50 border border-slate-200/80 p-6 flex items-center justify-center overflow-hidden group">
                    <div className="absolute bottom-4 w-4/5 h-6 bg-black/15 rounded-[50%] blur-lg pointer-events-none transform scale-y-50" />
                    <img
                      src={activeImage}
                      alt={viewingOrder.vehicle?.model || "Vehicle"}
                      className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_16px_20px_rgba(0,0,0,0.18)] select-none transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Grade Pill */}
                    <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-mono font-bold text-slate-800 border border-slate-200 shadow-soft flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Grade {viewingOrder.vehicle?.auctionGrade || "4.5"}</span>
                    </div>

                    {/* Vessel / Shipping Pill */}
                    <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/90 font-mono text-xs flex items-center gap-1.5 shadow-soft">
                      <Ship className="w-3.5 h-3.5 text-slate-600" />
                      <span>{viewingOrder.vesselName || "RoRo V.49"}</span>
                    </div>
                  </div>

                  {/* Multi-angle Thumbnail Strip */}
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 mt-4">
                    {images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          audio.playSubtleClick();
                          setActiveImageIdx(idx);
                        }}
                        className={`relative rounded-xl border p-1 bg-slate-50 overflow-hidden cursor-pointer transition-all aspect-4/3 flex items-center justify-center ${
                          activeImageIdx === idx
                            ? "border-[#0A0A0A] ring-2 ring-slate-900/10 shadow-xs scale-[1.02]"
                            : "border-slate-200/80 hover:border-slate-300 opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Angle ${idx + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Bar: Quick Vehicle Specs + VIN Copier */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/80 flex items-center gap-1">
                      <Fuel className="w-3 h-3 text-slate-500" />
                      <span>{viewingOrder.vehicle?.fuelType || "Petrol"}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/80">
                      {viewingOrder.vehicle?.color || "Silver"}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/80">
                      {viewingOrder.vehicle?.transmission || "Automatic"}
                    </span>
                  </div>

                  {viewingOrder.vehicle?.vinChassis && (
                    <button
                      type="button"
                      onClick={() => handleCopyVin(viewingOrder.vehicle.vinChassis)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-mono transition-colors cursor-pointer"
                      title="Copy VIN"
                    >
                      {copiedVin ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>{viewingOrder.vehicle.vinChassis}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (5 cols): Wholesale Landed Schedule & Dealership Panel */}
            <div className="lg:col-span-5 h-full flex flex-col">
              <div className="bg-white rounded-[16px] p-6 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Price Banner */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C3002F]" />
                      Wholesale Landed Price ({viewingOrder.pricingZoneId})
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                      ${viewingOrder.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()}
                      <span className="text-xs font-sans text-slate-400 font-semibold ml-2">NZD Landed</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Japanese baseline: ¥{viewingOrder.vehicle?.fobPriceJPY?.toLocaleString()} FOB
                    </p>
                  </div>

                  {/* Pricing Breakdown Schedule */}
                  <div className="divide-y divide-slate-100 text-xs">
                    <div className="py-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <span>Pricing Component</span>
                      <span>Commercial Allocation</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Vehicle Base Price (NZD):</span>
                      <span className="font-mono font-medium text-slate-900">${viewingOrder.priceBreakdown?.fobNZD?.toLocaleString()} NZD</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Ocean Freight &amp; Port:</span>
                      <span className="font-mono font-medium text-slate-900">${viewingOrder.priceBreakdown?.oceanFreightNZD?.toLocaleString()} NZD</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Customs &amp; NZ GST:</span>
                      <span className="font-mono font-medium text-slate-900">${((viewingOrder.priceBreakdown?.customsProcessingNZD || 0) + (viewingOrder.priceBreakdown?.gstNZD || 0)).toLocaleString()} NZD</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">MR2A Compliance &amp; WoF:</span>
                      <span className="font-mono font-medium text-slate-900">${viewingOrder.priceBreakdown?.complianceInspectionNZD?.toLocaleString()} NZD</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Domestic Zone Delivery:</span>
                      <span className="font-mono font-medium text-slate-900">${viewingOrder.priceBreakdown?.zoneDeliveryNZD?.toLocaleString()} NZD</span>
                    </div>
                    <div className="py-2 flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Programme Administration Fee:</span>
                      <span className="font-mono font-medium text-slate-900">${viewingOrder.priceBreakdown?.programmeFeeNZD?.toLocaleString() || 550} NZD</span>
                    </div>
                  </div>
                </div>

                {/* Dealership Destination Details */}
                <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Destination Dealership:</span>
                    <strong className="text-slate-900 font-bold">{viewingOrder.dealerName}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Target Port &amp; Delivery Zone:</span>
                    <span className="font-mono text-slate-800 font-semibold">{viewingOrder.pricingZoneId} (Direct Corridor)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Carrier &amp; Vessel:</span>
                    <span className="font-mono text-slate-800">{viewingOrder.vesselName || "Trans-Pacific RoRo"} (Voyage {viewingOrder.voyageNumber || "TP-2649"})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 4. ROW 2: 8-Stage Milestone Corridor Stepper & Progress     */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Ship className="w-4 h-4 text-[#C3002F]" />
                <span>Logistics Progression Corridor</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500">
                  Current: <strong className="text-[#C3002F] uppercase">{viewingOrder.currentMilestone.replace(/_/g, " ")}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => startEditingMilestone(viewingOrder)}
                  className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                >
                  {editingMilestoneOrderId === viewingOrder.id ? "Close Editor" : "Advance Milestone"}
                </button>
              </div>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {MILESTONE_SEQUENCE.map((stage, idx) => {
                const milestoneObj = viewingOrder.milestones?.find((m) => m.key === stage.key);
                const isDone = !!milestoneObj?.completedAt;
                const isCurrent = viewingOrder.currentMilestone === stage.key;

                return (
                  <div
                    key={stage.key}
                    className={`p-3 rounded-xl text-center text-xs border transition-all ${
                      isDone
                        ? "bg-slate-50 border-slate-200 text-slate-700"
                        : isCurrent
                          ? "bg-slate-900 text-white border-slate-900 font-bold shadow-xs ring-2 ring-slate-900/10"
                          : "bg-white border-slate-200/70 text-slate-400"
                    }`}
                  >
                    <div className="text-[11px] font-semibold truncate leading-tight">
                      {stage.label}
                    </div>
                    <div className="text-[10px] mt-1.5 font-mono flex items-center justify-center gap-1">
                      {isDone ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <Check className="w-3 h-3 stroke-[3]" /> Passed
                        </span>
                      ) : isCurrent ? (
                        <span className="text-amber-300 font-bold animate-pulse">● Active</span>
                      ) : (
                        <span className="text-slate-400 opacity-70">Step {idx + 1}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Inline Milestone Editor Drawer */}
            {editingMilestoneOrderId === viewingOrder.id && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 animate-in fade-in text-xs mt-4">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#C3002F]" />
                    <span>Advance Logistics Milestone &amp; Update EDD</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingMilestoneOrderId(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Target Milestone Phase:
                    </label>
                    <select
                      value={nextMilestoneKey}
                      onChange={(e) => setNextMilestoneKey(e.target.value as OrderMilestone)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-hidden focus:border-slate-900"
                    >
                      {MILESTONE_SEQUENCE.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Delivery ETA Date:
                    </label>
                    <input
                      type="date"
                      value={editingEta}
                      onChange={(e) => setEditingEta(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:outline-hidden focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Vessel Carrier:
                    </label>
                    <input
                      type="text"
                      value={editingVessel}
                      onChange={(e) => setEditingVessel(e.target.value)}
                      placeholder="e.g. Trans Future 5"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-hidden focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Voyage Identifier:
                    </label>
                    <input
                      type="text"
                      value={editingVoyage}
                      onChange={(e) => setEditingVoyage(e.target.value)}
                      placeholder="e.g. V.2026-B"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-hidden focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Carrier Progress &amp; Audit Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={milestoneNotes}
                    onChange={(e) => setMilestoneNotes(e.target.value)}
                    placeholder="Enter compliance, vessel departure, or discharge notes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-normal text-xs focus:outline-hidden focus:border-slate-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMilestoneOrderId(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdvanceMilestone(viewingOrder.id)}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save Milestone &amp; Carrier Progress</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 5. ROW 3: Additional Compliance Costs Section              */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Wrench className="w-4 h-4 text-slate-700" />
                <span>Attached Additional Compliance &amp; Logistics Costs</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForCost(viewingOrder)}
                className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Attach Additional Cost</span>
              </button>
            </div>

            {viewingOrder.additionalCosts && viewingOrder.additionalCosts.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {viewingOrder.additionalCosts.map((cost) => (
                  <div key={cost.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cost.description}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {cost.type}
                        </span>
                      </div>
                      {cost.notes && (
                        <p className="text-[11px] text-slate-500">{cost.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-slate-900">${cost.amountNZD.toLocaleString()} NZD</div>
                        <div className="text-[10px] text-slate-400">Attached: {cost.proposedAt || "Recent"}</div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          cost.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : cost.status === "DECLINED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        {cost.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-slate-50/80 border border-dashed border-slate-200 text-slate-500 text-xs space-y-2">
                <Wrench className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="font-medium text-slate-700">No additional compliance costs attached to this order.</p>
                <p className="text-[11px] text-slate-400">Standard landed package covers all standard ocean freight, customs, and initial entry compliance.</p>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 6. ROW 4: Vehicle Specifications Tabs (Zero Duplication)   */}
          {/* ─────────────────────────────────────────────────────────── */}
          {viewingOrder.vehicle && (
            <VehicleSpecificationsTabs vehicle={viewingOrder.vehicle} isAdmin={true} />
          )}

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 7. ROW 5: Supporting Compliance & Intake Documents Vault    */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>Supporting Compliance &amp; Intake Documents</span>
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold font-mono border border-slate-200 shrink-0 self-start sm:self-auto">
                Official Intake Archive
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[
                { name: "USS_Tokyo_Official_Auction_Sheet.pdf", type: "AUCTION_SHEET", size: "2.4 MB" },
                { name: "JEVIC_Digital_Odometer_Certificate.pdf", type: "JEVIC_CERTIFICATE", size: "1.1 MB" },
                { name: "NZTA_MR2A_Entry_Dossier.pdf", type: "COMPLIANCE_CERT", size: "1.8 MB" },
                { name: "Pacific_RoRo_Sea_Waybill_BL.pdf", type: "BILL_OF_LADING", size: "940 KB" },
              ].map((doc, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveDocPreview(doc)}
                  className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all group flex items-start justify-between bg-white shadow-2xs cursor-pointer"
                >
                  <div className="space-y-1.5 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                      <span className="font-bold text-xs text-slate-900 truncate block" title={doc.name}>
                        {doc.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {doc.type} · {doc.size}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-medium block">
                      Uploaded during vehicle intake
                    </span>
                  </div>
                  <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>

            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Cryptographic Supply Chain Register</span>
              <span className="text-slate-700 font-bold">SHA-256 Verified</span>
            </div>
          </div>

          {/* Bottom Return Bar */}
          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToOrders}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Orders</span>
            </button>

            {viewingOrder.vehicle?.id && (
              <Link
                href={`/admin/vehicles/${viewingOrder.vehicle.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <span>Full Vehicle Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* B. DEFAULT VIEW: ORDERS LIST & MILESTONES GRID                  */
        /* ═══════════════════════════════════════════════════════════════ */
        <>
          {/* ─────────────────────────────────────────────────────────── */}
          {/* 1. Header: Clean Nissan Corporate Operations Bar            */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                Wholesale Orders &amp; Logistics Pipeline
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor confirmed dealer allocations, Pacific maritime transit, entry compliance certification, and dispatch.
              </p>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 2. Executive Orders 4-KPI Metric Strip                      */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* 1. Confirmed Orders */}
            <div
              onClick={() => {
                audio.playSubtleClick();
                setMilestoneFilter("ALL");
              }}
              className={`p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1.5 transition-all cursor-pointer hover:border-slate-300 hover:shadow-md ${
                milestoneFilter === "ALL" ? "ring-2 ring-slate-900 border-slate-900" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  CONFIRMED ORDERS
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {orders.length}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Total wholesale orders active
              </div>
            </div>

            {/* 2. Vessels In Transit */}
            <div
              onClick={() => {
                audio.playSubtleClick();
                setMilestoneFilter((prev) => (prev === "IN_TRANSIT" ? "ALL" : "IN_TRANSIT"));
              }}
              className={`p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1.5 transition-all cursor-pointer hover:border-slate-300 hover:shadow-md ${
                milestoneFilter === "IN_TRANSIT" ? "ring-2 ring-slate-900 border-slate-900" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  VESSELS IN TRANSIT
                </span>
                <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                  <Ship className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {orders.filter((o) => o.currentMilestone === "IN_TRANSIT").length}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                RoRo carrier sea transit
              </div>
            </div>

            {/* 3. Customs / Compliance */}
            <div
              onClick={() => {
                audio.playSubtleClick();
                setMilestoneFilter((prev) => (prev === "COMPLIANCE" ? "ALL" : "COMPLIANCE"));
              }}
              className={`p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1.5 transition-all cursor-pointer hover:border-slate-300 hover:shadow-md ${
                milestoneFilter === "COMPLIANCE" ? "ring-2 ring-slate-900 border-slate-900" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  CUSTOMS / COMPLIANCE
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {orders.filter((o) => o.currentMilestone === "NZ_BORDER_PROCESSING" || o.currentMilestone === "COMPLIANCE" || o.currentMilestone === "AWAITING_ADDITIONAL_COST").length}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Biosecurity &amp; MR2A entry
              </div>
            </div>

            {/* 4. Ready For Delivery */}
            <div
              onClick={() => {
                audio.playSubtleClick();
                setMilestoneFilter((prev) => (prev === "READY_FOR_DELIVERY" ? "ALL" : "READY_FOR_DELIVERY"));
              }}
              className={`p-4 sm:p-5 rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-1.5 transition-all cursor-pointer hover:border-slate-300 hover:shadow-md ${
                milestoneFilter === "READY_FOR_DELIVERY" ? "ring-2 ring-slate-900 border-slate-900" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                  READY FOR DELIVERY
                </span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Truck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {orders.filter((o) => o.currentMilestone === "READY_FOR_DELIVERY" || o.currentMilestone === "DELIVERED").length}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                Cleared for dealer release
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* 3. Global Orders Search Toolbar & Filter Strip               */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by order #, VIN, model, or dealer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 font-normal transition-all shadow-2xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setSearchQuery("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status / Milestone Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: "ALL", label: "All Orders" },
                  { id: "IN_TRANSIT", label: "In Transit" },
                  { id: "COMPLIANCE", label: "Customs/Entry" },
                  { id: "READY_FOR_DELIVERY", label: "Ready" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setMilestoneFilter(pill.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      milestoneFilter === pill.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Reset filter button if any active */}
              {(searchQuery || milestoneFilter !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setSearchQuery("");
                    setMilestoneFilter("ALL");
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono shrink-0 whitespace-nowrap self-end md:self-center pr-1">
              Showing <strong className="text-slate-900 font-bold">{filteredOrders.length}</strong> of {orders.length} orders
            </div>
          </div>

          {/* Orders Cards List */}
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-500 text-xs space-y-2">
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-800">No matching orders found</p>
                <p className="text-slate-400">Try adjusting your search criteria</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isEditingThis = editingMilestoneOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    className="p-5 sm:p-6 rounded-[16px] bg-white border border-slate-200 shadow-sm space-y-5 transition-all hover:border-slate-300"
                  >
                    {/* Order Row Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0 shadow-2xs">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{order.orderNumber}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-xs text-slate-500">#{order.vehicle?.stockId}</span>
                            <span className="text-slate-300">·</span>
                            <span className="font-bold text-xs text-slate-800">
                              {order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            VIN: {order.vehicle?.vinChassis} · Dealer: <strong className="text-slate-700">{order.dealerName}</strong> ({order.pricingZoneId})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <div className="text-right">
                          <div className="text-base font-bold font-mono text-slate-900">
                            ${order.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()} NZD
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            EDD: {order.etaDeliveryDate || "TBD"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Milestone Corridor Steps */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                      {MILESTONE_SEQUENCE.map((stage, idx) => {
                        const milestoneObj = order.milestones?.find((m) => m.key === stage.key);
                        const isDone = !!milestoneObj?.completedAt;
                        const isCurrent = order.currentMilestone === stage.key;

                        return (
                          <div
                            key={stage.key}
                            className={`p-2.5 rounded-xl text-center text-xs border transition-all ${
                              isDone
                                ? "bg-slate-50 border-slate-200 text-slate-700"
                                : isCurrent
                                  ? "bg-slate-900 text-white border-slate-900 font-bold shadow-xs"
                                  : "bg-white border-slate-200/60 text-slate-400"
                            }`}
                          >
                            <div className="text-[11px] font-semibold truncate leading-tight">
                              {stage.label}
                            </div>
                            <div className="text-[10px] mt-1 font-mono flex items-center justify-center gap-1">
                              {isDone ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                  <Check className="w-3 h-3 stroke-[3]" /> Passed
                                </span>
                              ) : isCurrent ? (
                                <span className="text-amber-300 font-bold animate-pulse">● Active</span>
                              ) : (
                                <span className="text-slate-400 opacity-70">Step {idx + 1}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Carrier Log & Action Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-100">
                      <div className="text-slate-500 font-mono text-[11px]">
                        Carrier: <span className="text-slate-700 font-medium">{order.vesselName || "Trans-Pacific RoRo V.49"}</span> · Voyage: <span className="text-slate-700 font-medium">{order.voyageNumber || "TP-2649"}</span>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleViewDossier(order)}
                          className="btn-outline text-xs py-2 px-3.5 flex items-center gap-1.5 cursor-pointer hover:border-slate-400"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View Dossier</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedOrderForCost(order)}
                          className="btn-outline text-xs py-2 px-3.5 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>Additional Cost</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => startEditingMilestone(order)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                        >
                          <span>Update Milestone &amp; EDD</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Advance Milestone & EDD Inline Drawer */}
                    {isEditingThis && (
                      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 animate-in fade-in text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#C3002F]" />
                            <span>Advance Logistics Milestone &amp; Update EDD</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingMilestoneOrderId(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              Target Milestone Phase:
                            </label>
                            <select
                              value={nextMilestoneKey}
                              onChange={(e) => setNextMilestoneKey(e.target.value as OrderMilestone)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-hidden focus:border-slate-900"
                            >
                              {MILESTONE_SEQUENCE.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              Delivery ETA Date:
                            </label>
                            <input
                              type="date"
                              value={editingEta}
                              onChange={(e) => setEditingEta(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs focus:outline-hidden focus:border-slate-900"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              Vessel Carrier:
                            </label>
                            <input
                              type="text"
                              value={editingVessel}
                              onChange={(e) => setEditingVessel(e.target.value)}
                              placeholder="e.g. Trans Future 5"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-hidden focus:border-slate-900"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">
                              Voyage Identifier:
                            </label>
                            <input
                              type="text"
                              value={editingVoyage}
                              onChange={(e) => setEditingVoyage(e.target.value)}
                              placeholder="e.g. V.2026-B"
                              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs focus:outline-hidden focus:border-slate-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Carrier Progress &amp; Audit Notes:
                          </label>
                          <textarea
                            rows={2}
                            value={milestoneNotes}
                            onChange={(e) => setMilestoneNotes(e.target.value)}
                            placeholder="Enter compliance, vessel departure, or discharge notes..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-normal text-xs focus:outline-hidden focus:border-slate-900"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingMilestoneOrderId(null)}
                            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer shadow-2xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdvanceMilestone(order.id)}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Save Milestone &amp; Carrier Progress</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Additional Cost Creator Modal */}
      <AdditionalCostCreatorModal
        order={selectedOrderForCost}
        onClose={() => setSelectedOrderForCost(null)}
        onSubmit={handleCostCreated}
      />

      {/* Document Preview Lightbox Modal */}
      {activeDocPreview && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col font-sans">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm truncate">{activeDocPreview.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{activeDocPreview.type} · {activeDocPreview.size}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 text-center space-y-4 bg-slate-50/50">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto shadow-xs text-slate-700">
                <FileText className="w-8 h-8 text-slate-600" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">Authenticated Compliance Document</p>
                <p className="text-xs text-slate-500 mt-1">Cryptographically stamped during Autohub Japan export clearance.</p>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-left text-xs font-mono text-slate-600 space-y-1 max-w-md mx-auto">
                <div className="flex justify-between"><span>Format:</span><span className="font-bold text-slate-800">PDF / A-1b Compliant</span></div>
                <div className="flex justify-between"><span>Hash:</span><span className="font-bold text-slate-800">sha256:4f8e...92a1</span></div>
                <div className="flex justify-between"><span>Authority:</span><span className="font-bold text-slate-800">Autohub Customs NZ</span></div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  audio.playSuccessChime();
                  alert(`Downloading secure copy of ${activeDocPreview.name}`);
                }}
                className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#333333] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
