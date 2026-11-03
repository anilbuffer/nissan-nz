"use client";

import React, { useState } from "react";
import { Vehicle } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import {
  ArrowLeft,
  Car,
  ShieldCheck,
  CheckCircle2,
  Lock,
  MapPin,
  Calendar,
  Gauge,
  FileCheck2,
  Copy,
  Check,
  ExternalLink,
  Fuel,
  Compass,
  AlertTriangle,
  ChevronRight,
  Eye,
  Building2,
  Sparkles,
  Ship,
  Printer,
  Share2,
} from "lucide-react";

interface JapanInventoryDetailsViewProps {
  vehicleId: string;
  onBack: () => void;
  onToggleStatus?: (vehicleId: string) => void;
}

export default function JapanInventoryDetailsView({
  vehicleId,
  onBack,
  onToggleStatus,
}: JapanInventoryDetailsViewProps) {
  const { vehicles, dealers, toggleVehicleStatus } = useProgramme();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const vehicle = vehicles.find((v) => v.id === vehicleId || v.stockId === vehicleId);

  if (!vehicle) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-soft">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Vehicle Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested export vehicle unit may have been removed or does not exist.
        </p>
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            onBack();
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-xs"
        >
          Return to Inventory Listing
        </button>
      </div>
    );
  }

  const images =
    vehicle.images && vehicle.images.length > 0
      ? vehicle.images
      : ["/images/cars/kicks.png"];

  const activeImage = images[activeImageIdx] || images[0];
  const isAvailable = vehicle.status === "AVAILABLE";
  const isReserved = vehicle.status === "RESERVED";
  const isWithdrawn = vehicle.status === "WITHDRAWN";

  const reservedDealer = vehicle.reservedByDealerId
    ? dealers.find((d) => d.id === vehicle.reservedByDealerId)
    : null;

  const handleCopyVin = () => {
    navigator.clipboard.writeText(vehicle.vinChassis);
    audio.playSubtleClick();
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const handleToggle = () => {
    audio.playSubtleClick();
    if (onToggleStatus) {
      onToggleStatus(vehicle.id);
    } else {
      toggleVehicleStatus(vehicle.id);
    }
    setActionNotice(
      isAvailable
        ? `Unit #${vehicle.stockId} withdrawn from NZ dealer catalogue.`
        : `Unit #${vehicle.stockId} published to NZ dealer catalogue.`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onBack();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-soft hover:border-slate-300 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Export Inventory</span>
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-mono text-slate-500">#{vehicle.stockId}</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-800 truncate max-w-[200px]">
            {vehicle.year} {vehicle.model}
          </span>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="px-3.5 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-semibold shadow-soft border border-slate-200 animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* Main Vehicle Header Card (Light Theme: Outline + Soft Shadow) */}
      <div className="bg-white text-slate-900 rounded-3xl p-6 border border-slate-200/90 shadow-soft relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E11D48] shrink-0 shadow-2xs">
              <Car className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                  #{vehicle.stockId}
                </span>

                <span
                  className={`text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                    isAvailable
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : isReserved
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {isReserved ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Dealer Exclusivity Hold</span>
                    </>
                  ) : isAvailable ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Available to NZ Franchise</span>
                    </>
                  ) : (
                    <span>Withdrawn / Inactive</span>
                  )}
                </span>

                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{vehicle.location || "Yokohama Export Terminal"}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>

              <p className="text-xs text-slate-500">
                Package Grade: <strong className="text-slate-800 font-semibold">{vehicle.grade}</strong> · Transmission:{" "}
                <strong className="text-slate-800 font-semibold">{vehicle.transmission}</strong> · Powertrain:{" "}
                <strong className="text-slate-800 font-semibold">{vehicle.fuelType}</strong>
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            {!isReserved && (
              <button
                type="button"
                onClick={handleToggle}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 ${
                  isAvailable
                    ? "bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200"
                    : "bg-[#E11D48] hover:bg-[#BE123C] text-white"
                }`}
              >
                {isAvailable ? "Withdraw from Catalogue" : "Publish to Catalogue"}
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                window.print();
              }}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              title="Print Vehicle Sheet"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hold Reservation Alert Bar if Reserved */}
        {isReserved && (
          <div className="mt-5 pt-4 border-t border-amber-200/60 bg-amber-50/70 -mx-6 -mb-6 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Unit is locked under a 24-hour exclusivity hold by{" "}
                <strong className="text-amber-950 font-bold">
                  {reservedDealer?.legalTradingName || "NZ Dealer Network Partner"}
                </strong>
                .
              </span>
            </div>
            {vehicle.reservationExpiresAt && (
              <span className="text-[11px] font-mono text-amber-700">
                Hold expiry: {new Date(vehicle.reservationExpiresAt).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Showcase & Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft space-y-4">
            {/* Main Stage Image */}
            <div className="relative w-full h-72 sm:h-96 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-200/50 border border-slate-200/80 p-6 flex items-center justify-center overflow-hidden group">
              <div className="absolute bottom-4 w-4/5 h-6 bg-black/15 rounded-[50%] blur-lg pointer-events-none transform scale-y-50" />
              <img
                src={activeImage}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_16px_20px_rgba(0,0,0,0.18)] select-none transition-transform duration-300 group-hover:scale-105"
              />

              {/* Auction Grade Pill */}
              <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-mono font-bold text-slate-800 border border-slate-200 shadow-soft flex items-center gap-1.5">
                <span className="text-amber-500 font-bold">★</span>
                <span>Auction Grade {vehicle.auctionGrade} / {vehicle.interiorGrade || "A"}</span>
              </div>

              {/* Yard Location Pill (Clean Light Theme) */}
              <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/90 font-mono text-xs flex items-center gap-1.5 shadow-soft">
                <MapPin className="w-3.5 h-3.5 text-[#E11D48]" />
                <span>{vehicle.location || "Yokohama Yard"}</span>
              </div>
            </div>

            {/* Thumbnail Gallery Strip */}
            {images.length > 1 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                  High-Resolution Studio Angles ({images.length})
                </span>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setActiveImageIdx(idx);
                      }}
                      className={`w-20 h-14 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 ${
                        activeImageIdx === idx
                          ? "border-[#E11D48] ring-2 ring-[#E11D48]/20 bg-white"
                          : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="Thumbnail" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inspection Condition Dossier & Defects Mapping */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#E11D48]" />
                <span>Inspection Condition Dossier &amp; Defects Mapping</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                NZTA MR2A Pre-Verified
              </span>
            </div>

            <p className="text-slate-700 leading-relaxed text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              {vehicle.conditionSummary ||
                "Showroom demonstration grade. Zero structural panel damage detected. Fully compliant for NZTA MR2A border entry with genuine Japanese documentation."}
            </p>

            {vehicle.knownDefects && vehicle.knownDefects.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Inspector Recorded Markings &amp; Defects:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {vehicle.knownDefects.map((defect, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-950 font-medium"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>{defect}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Parameters, Certification & Wholesale JPY (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Japanese Wholesale Baseline Procurement Card (Light Theme: Outline + Soft Shadow) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white text-slate-900 border border-slate-200/90 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
                Japanese Wholesale Baseline
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold">
                FOB JPY
              </span>
            </div>

            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                ¥{vehicle.fobPriceJPY.toLocaleString()}
                <span className="text-xs font-sans text-slate-400 font-semibold ml-2">JPY (FOB)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Acquisition cost at Tokyo/Yokohama auction terminal prior to ocean shipping.
              </p>
            </div>

            <div className="pt-3.5 border-t border-slate-100 text-xs text-slate-600 space-y-2 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Export Terminal:</span>
                <strong className="text-slate-900 font-bold">{vehicle.location || "Yokohama Port"}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-sans">Dispatch Vessel:</span>
                <strong className="text-slate-900 font-bold">Port of Auckland (RoRo V.48)</strong>
              </div>
            </div>
          </div>

          {/* Technical Specifications Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-3.5 shadow-soft">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Vehicle Technical Parameters
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Chassis / VIN:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900">{vehicle.vinChassis}</span>
                  <button
                    type="button"
                    onClick={handleCopyVin}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded hover:bg-slate-100 transition-colors"
                    title="Copy VIN"
                  >
                    {copiedVin ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Package / Grade:</span>
                <span className="font-bold text-slate-800">{vehicle.grade}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Powertrain:</span>
                <span className="font-semibold text-slate-800">{vehicle.fuelType}</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Verified Mileage:</span>
                <span className="font-mono font-bold text-slate-900">
                  {vehicle.odometerKm.toLocaleString()} {vehicle.odometerUnit || "km"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Transmission / Drive:</span>
                <span className="font-medium text-slate-800">
                  {vehicle.transmission} · {vehicle.driveType || "2WD"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Displacement:</span>
                <span className="font-mono text-slate-700">
                  {vehicle.engineCc ? `${vehicle.engineCc} cc` : "Pure EV"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Body Color:</span>
                <span className="font-semibold text-slate-800">
                  {vehicle.color || "Factory Original"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500">Model Year:</span>
                <span className="font-mono font-bold text-slate-900">{vehicle.year}</span>
              </div>
            </div>
          </div>

          {/* JEVIC Pre-Export Verification Card */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-5 space-y-3 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>JEVIC Pre-Export Verification</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-300">
                PASSED
              </span>
            </div>

            <div className="text-xs text-emerald-900/85 space-y-2 pt-1 divide-y divide-emerald-200/50">
              <div className="flex items-center justify-between pt-1">
                <span>Odometer Authenticity:</span>
                <strong className="font-mono text-emerald-950">JEVIC Certified Stamp</strong>
              </div>
              <div className="flex items-center justify-between pt-1.5">
                <span>Biosecurity Inspection:</span>
                <strong className="text-emerald-950">Pre-Cleared (Clean)</strong>
              </div>
              <div className="flex items-center justify-between pt-1.5">
                <span>Inspection Date:</span>
                <strong className="font-mono text-emerald-950">
                  {vehicle.inspectionDate || "2026-10-22"}
                </strong>
              </div>
            </div>
          </div>

          {/* Bottom Back Button Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onBack();
              }}
              className="w-full py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all shadow-soft flex items-center justify-center gap-2 cursor-pointer hover:border-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Return to Inventory List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
