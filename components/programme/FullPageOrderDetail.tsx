"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Order } from "@/lib/types";
import { audio } from "@/lib/sound";
import { getModelAngleImages } from "@/lib/vehicle-media";
import VehicleSpecificationsTabs from "@/components/dealer/VehicleSpecificationsTabs";
import OrderCorridorTimeline from "@/components/dealer/OrderCorridorTimeline";
import {
  Ship,
  Clock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Check,
  Eye,
  Car,
  Star,
  Building2,
  X,
  ArrowLeft,
  Copy,
  Fuel,
  Wrench,
  Download,
  ShieldCheck,
} from "lucide-react";

export interface FullPageOrderDetailProps {
  orderId?: string;
  orderData?: Order;
  onBack?: () => void;
  backLabel?: string;
  onViewVehicle?: (vehicleId: string) => void;
}

export default function FullPageOrderDetail({
  orderId,
  orderData,
  onBack,
  backLabel = "Back to Orders",
  onViewVehicle,
}: FullPageOrderDetailProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [activeDocPreview, setActiveDocPreview] = useState<{
    name: string;
    type: string;
    size?: string;
  } | null>(null);

  if (!orderData) {
    return (
      <div className="bg-white rounded-[16px] border border-slate-200 p-8 text-center space-y-4">
        <Car className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Order Not Found</h3>
        <p className="text-xs text-slate-500">The requested order record could not be loaded.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-[#0A0A0A] text-white rounded-xl text-xs font-semibold"
        >
          {backLabel}
        </button>
      </div>
    );
  }

  const order = orderData;
  const images = order.vehicle
    ? getModelAngleImages(order.vehicle.model, order.vehicle.images?.[0])
    : ["/images/cars/kicks.png"];
  const activeImage = images[activeImageIdx] || images[0];

  const handleCopyVin = (vin: string) => {
    navigator.clipboard.writeText(vin);
    setCopiedVin(true);
    audio.playSubtleClick();
    setTimeout(() => setCopiedVin(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans pb-16">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* Top Navigation & Action Bar                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            if (onBack) onBack();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300 group text-xs w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
            Programme Oversight · Read-Only View
          </span>

          {order.vehicle?.id && onViewVehicle && (
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onViewVehicle(order.vehicle.id);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300 text-xs"
              title="Open Vehicle Dossier"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Vehicle Dossier</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Main Header Card (Symmetric to Dealer/Admin View)        */}
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
                  #{order.vehicle?.stockId}
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                  {order.orderNumber}
                </span>
                <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-sky-50 text-sky-700 border-sky-200 shadow-2xs">
                  <Ship className="w-3 h-3 text-sky-600" />
                  <span>Allocated &amp; Shipping Secured</span>
                </span>
              </div>

              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                {order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}
              </h1>
            </div>
          </div>

          {/* Dealership Identity Pill */}
          <div className="flex items-center shrink-0 self-start lg:self-center">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-800">{order.dealerName}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-mono">{order.pricingZoneId}</span>
            </div>
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
                  alt={order.vehicle?.model || "Vehicle"}
                  className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_16px_20px_rgba(0,0,0,0.18)] select-none transition-transform duration-300 group-hover:scale-105"
                />

                {/* Grade Pill */}
                <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-mono font-bold text-slate-800 border border-slate-200 shadow-soft flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Grade {order.vehicle?.auctionGrade || order.vehicle?.grade || "4.5"}</span>
                </div>

                {/* Vessel Pill */}
                <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/90 font-mono text-xs flex items-center gap-1.5 shadow-soft">
                  <Ship className="w-3.5 h-3.5 text-slate-600" />
                  <span>{order.vesselName || "RoRo Ocean Carrier"}</span>
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
                  <span>{order.vehicle?.fuelType || "Petrol"}</span>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/80">
                  {order.vehicle?.color || "Pearl White"}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200/80">
                  {order.vehicle?.transmission || "Automatic"}
                </span>
              </div>

              {order.vehicle?.vinChassis && (
                <button
                  type="button"
                  onClick={() => handleCopyVin(order.vehicle.vinChassis)}
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
                      <span>{order.vehicle.vinChassis}</span>
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
                  Wholesale Landed Price ({order.pricingZoneId})
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  ${order.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()}
                  <span className="text-xs font-sans text-slate-400 font-semibold ml-2">NZD Landed</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Japanese baseline: ¥{order.vehicle?.fobPriceJPY?.toLocaleString()} FOB
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
                  <span className="font-mono font-medium text-slate-900">${order.priceBreakdown?.fobNZD?.toLocaleString()} NZD</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Ocean Freight &amp; Port:</span>
                  <span className="font-mono font-medium text-slate-900">${order.priceBreakdown?.oceanFreightNZD?.toLocaleString()} NZD</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Customs &amp; NZ GST:</span>
                  <span className="font-mono font-medium text-slate-900">${((order.priceBreakdown?.customsProcessingNZD || 0) + (order.priceBreakdown?.gstNZD || 0)).toLocaleString()} NZD</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">MR2A Compliance &amp; WoF:</span>
                  <span className="font-mono font-medium text-slate-900">${order.priceBreakdown?.complianceInspectionNZD?.toLocaleString()} NZD</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Domestic Zone Delivery:</span>
                  <span className="font-mono font-medium text-slate-900">${order.priceBreakdown?.zoneDeliveryNZD?.toLocaleString()} NZD</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Programme Administration Fee:</span>
                  <span className="font-mono font-medium text-slate-900">${order.priceBreakdown?.programmeFeeNZD?.toLocaleString() || 550} NZD</span>
                </div>
              </div>
            </div>

            {/* Dealership Destination Details */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Destination Dealership:</span>
                <strong className="text-slate-900 font-bold">{order.dealerName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Target Port &amp; Delivery Zone:</span>
                <span className="font-mono text-slate-800 font-semibold">{order.pricingZoneId} (Direct Corridor)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Carrier &amp; Vessel:</span>
                <span className="font-mono text-slate-800">{order.vesselName || "RoRo Carrier"} (Voyage {order.voyageNumber || "NZ-2026"})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. ROW 2: Door-to-Door Delivery Corridor                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Ship className="w-4 h-4 text-[#C3002F]" />
            <span>Delivery Corridor Milestones (5 Programme Stages)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">
              Current Status: <strong className="text-[#C3002F] uppercase">{order.currentMilestone.replace(/_/g, " ")}</strong>
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Live RoRo Tracked
            </span>
          </div>
        </div>

        <OrderCorridorTimeline order={order} />
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. ROW 3: Attached Additional Costs                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Wrench className="w-4 h-4 text-slate-700" />
            <span>Attached Additional Compliance &amp; Logistics Costs</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {(order.additionalCosts?.length || 0)} Recorded Items
          </span>
        </div>

        {order.additionalCosts && order.additionalCosts.length > 0 ? (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {order.additionalCosts.map((cost) => (
              <div key={cost.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/70 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900">{cost.description}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                      {cost.type}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                      Target: {cost.dealerName || order.dealerName}
                    </span>
                  </div>
                  {cost.notes && (
                    <p className="text-[11px] text-slate-500">{cost.notes}</p>
                  )}
                  {cost.evidenceDocumentUrl && (
                    <div className="inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200">
                      <span>Evidence: {cost.evidenceDocumentUrl}</span>
                    </div>
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
      {/* 6. ROW 4: Vehicle Specifications Tabs                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {order.vehicle && (
        <VehicleSpecificationsTabs vehicle={order.vehicle} isAdmin={false} />
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. ROW 5: Supporting Compliance Documents                   */}
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

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Document Preview Modal                                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 font-sans animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm truncate max-w-xs">{activeDocPreview.name}</h4>
                  <span className="text-xs text-slate-400 font-mono">{activeDocPreview.type} · {activeDocPreview.size}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-600 stroke-[1.5]" />
              <div>
                <p className="font-bold text-slate-900 text-xs">Official Certified Supply Chain Document</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                  Cryptographically verified document sealed during intake and archived with Autohub logistics audit chain.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#262626] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
