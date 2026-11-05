"use client";

import React, { useState } from "react";
import { Vehicle } from "@/lib/types";
import { calculateLandedPrice, OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { useProgramme } from "@/lib/programme-context";
import { getModelAngleImages } from "@/lib/vehicle-media";
import {
  X,
  Car,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Calendar,
  Gauge,
  FileCheck2,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Layers,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface CatalogueDetailsModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onNavigateToReservations?: () => void;
  onNavigateToInventory?: () => void;
}

export default function CatalogueDetailsModal({
  vehicle,
  onClose,
  onNavigateToReservations,
  onNavigateToInventory,
}: CatalogueDetailsModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [selectedZone, setSelectedZone] = useState<"ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4" | "ZONE_5">("ZONE_1");

  if (!vehicle) return null;

  const images = vehicle.images && vehicle.images.length > 0
    ? vehicle.images
    : ["/images/cars/kicks.png"];

  const landedPrice = calculateLandedPrice(vehicle.fobPriceJPY, selectedZone);
  const activeImage = images[activeImageIdx] || images[0];

  const handleCopyVin = () => {
    navigator.clipboard.writeText(vehicle.vinChassis);
    audio.playSubtleClick();
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalogue-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-600">
                  #{vehicle.stockId}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  VIN: {vehicle.vinChassis}
                </span>
              </div>
              <h2 id="catalogue-details-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.grade ? `(${vehicle.grade})` : ""}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Main Visual & Key Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Studio Image */}
            <div className="md:col-span-7 space-y-3">
              <div className="relative w-full h-64 sm:h-72 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-200/50 border border-slate-200/80 p-4 flex items-center justify-center overflow-hidden">
                <div className="absolute bottom-3 w-4/5 h-4 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-60" />
                <img
                  src={activeImage}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_12px_16px_rgba(0,0,0,0.18)] select-none transition-transform duration-300 hover:scale-105"
                />

                <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-mono font-bold text-slate-800 border border-slate-200 shadow-xs flex items-center gap-1">
                  <span className="text-amber-500 font-bold">★</span>
                  <span>Grade {vehicle.auctionGrade} / {vehicle.interiorGrade || "A"}</span>
                </div>

                <div className="absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-sm text-[10px] font-mono text-white">
                  {vehicle.location || "Yokohama Yard"}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setActiveImageIdx(idx);
                      }}
                      className={`w-16 h-12 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 ${activeImageIdx === idx
                        ? "border-[#C3002F] ring-2 ring-[#C3002F]/20 bg-white"
                        : "border-slate-200 hover:border-slate-300 opacity-70"
                        }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Primary Identification & Japanese Dossier */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Export Origin &amp; Verification
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Chassis / VIN:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-slate-900">{vehicle.vinChassis}</span>
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

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Powertrain / Fuel:</span>
                    <span className="font-bold text-slate-800">{vehicle.fuelType}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Odometer:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {vehicle.odometerKm.toLocaleString()} {vehicle.odometerUnit || "km"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Transmission / Drive:</span>
                    <span className="font-semibold text-slate-800">{vehicle.transmission} · {vehicle.driveType}</span>
                  </div>

                  <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Inspection Date:</span>
                    <span className="font-mono text-slate-700">{vehicle.inspectionDate || "2026-10-22"}</span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500">JEVIC Pre-Cleared:</span>
                    <span className="font-bold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Pass
                    </span>
                  </div>
                </div>
              </div>

              {/* Supporting Documents (Attached during Add Vehicle intake) */}

              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">

                    <FileText className="w-4 h-4 text-blue-600" />

                    <span>Supporting Documents</span>

                  </div>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">

                    {(vehicle.supportingDocuments?.length || 2)} Attached

                  </span>

                </div>

                <div className="grid grid-cols-1 gap-1.5 pt-1">

                  {(vehicle.supportingDocuments && vehicle.supportingDocuments.length > 0

                    ? vehicle.supportingDocuments

                    : [

                      { name: "USS_Tokyo_Official_Auction_Sheet.pdf", type: "AUCTION_SHEET", size: "2.4 MB" },

                      { name: "JEVIC_Digital_Odometer_Certificate.pdf", type: "JEVIC_CERTIFICATE", size: "1.1 MB" },

                    ]

                  ).map((doc, dIdx) => (

                    <div

                      key={dIdx}

                      className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2 text-xs"

                    >

                      <div className="flex items-center gap-2 min-w-0">

                        <FileText className="w-3.5 h-3.5 text-[#C3002F] shrink-0" />

                        <span className="font-semibold text-slate-800 text-[11px] truncate">

                          {doc.name}

                        </span>

                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0">

                        {doc.size || "PDF"}

                      </span>

                    </div>

                  ))}

                </div>

              </div>

              {/* Japanese Condition Notes */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  <span>Verified Condition Notes</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-[10px]">
                  {vehicle.conditionSummary || "Clean pass across all structural compliance markers. One-owner Japanese vehicle with complete service history."}
                </p>
                {vehicle.knownDefects && vehicle.knownDefects.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Inspector Markings:
                    </span>
                    {vehicle.knownDefects.map((defect, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{defect}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4 Landed Pricing Matrix across All 5 Zones */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Section 4 Commercial Pricing Calculator</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Guaranteed Formula
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Raw Japanese FOB acquisition baseline plus fixed ocean freight, towing, customs entry, and compliance.
                </p>
              </div>

              {/* Zone Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                {(["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedZone(z);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${selectedZone === z
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {z.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing Formula Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">FOB Rate (JPY)</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  ¥{vehicle.fobPriceJPY.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">Acquisition Base</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">FOB (NZD Eqv)</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  ${landedPrice.fobNZD.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">@ 90.0 JPY/NZD</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">RoRo Ocean Freight</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  ${landedPrice.oceanFreightNZD.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">Trans-Pacific V.48</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Customs &amp; MR2A</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  ${(landedPrice.customsProcessingNZD + landedPrice.complianceInspectionNZD).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">Border + Compliance</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Domestic Towing</span>
                <div className="font-mono font-bold text-slate-900 text-sm mt-1">
                  ${landedPrice.zoneDeliveryNZD.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500">{selectedZone} Logistics</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] text-rose-700 font-bold uppercase tracking-wider block">Total Landed NZD</span>
                <div className="font-mono font-bold text-[#C3002F] text-base mt-0.5">
                  ${landedPrice.totalBuyPriceNZD.toLocaleString()}
                </div>
                <span className="text-[10px] text-rose-600 font-semibold">Excl. GST</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {vehicle.status === "RESERVED" ? (
              <span className="text-amber-700 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>Reserved by Franchise Dealer · 24h Exclusivity Lock Active</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for wholesale reservation across all 5 New Zealand dealer zones</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {vehicle.status === "RESERVED" && onNavigateToReservations && (
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  onClose();
                  onNavigateToReservations();
                }}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Manage Hold in Queue</span>
              </button>
            )}

            {onNavigateToInventory && (
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  onClose();
                  onNavigateToInventory();
                }}
                className="px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white font-semibold text-xs transition-all shadow-xs hover:shadow-soft cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
              >
                <Car className="w-3.5 h-3.5" />
                <span>View Admin Vehicle Details</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
