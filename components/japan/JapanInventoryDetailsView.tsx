"use client";

import React, { useState, useMemo } from "react";
import { Vehicle, VehicleStatus, VehicleSupportingDoc } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { JPY_TO_NZD_EXCHANGE_RATE } from "@/lib/pricing-calculator";
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
  Share2,
  Edit3,
  X,
  FileText,
  Download,
  AlertCircle,
  Clock,
  Layers,
  Star,
} from "lucide-react";

interface JapanInventoryDetailsViewProps {
  vehicleId: string;
  onBack: () => void;
  onToggleStatus?: (vehicleId: string) => void;
}

export default function JapanInventoryDetailsView({
  vehicleId,
  onBack,
}: JapanInventoryDetailsViewProps) {
  const { vehicles, dealers, updateVehicle, setVehicleStatus } = useProgramme();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal States
  const [isAmendmentOpen, setIsAmendmentOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawReason, setWithdrawReason] = useState(
    "Yard Inspection: Cosmetic Paint / Panel Rectification Required"
  );
  const [activeDocPreview, setActiveDocPreview] = useState<{
    title: string;
    type: "AUCTION_SHEET" | "JEVIC" | "MPI" | "MR2A";
    refNumber: string;
    details: string;
  } | null>(null);

  const vehicle = vehicles.find((v) => v.id === vehicleId || v.stockId === vehicleId);

  const vehicleDocs = useMemo(() => {
    const docs = [...(vehicle?.supportingDocuments || [])];
    if (vehicle?.conditionReportName && !docs.some(d => d.name === vehicle.conditionReportName)) {
      docs.unshift({
        name: vehicle.conditionReportName,
        type: "AUCTION_SHEET",
        url: vehicle.conditionReportUrl || "https://example.com/reports/condition.pdf",
        size: "2.4 MB",
        uploadedAt: vehicle.createdAt || "2026-10-22",
      });
    }
    return docs;
  }, [vehicle]);

  // Amendment Form States initialized if vehicle exists
  const [editModel, setEditModel] = useState(vehicle?.model || "");
  const [editGrade, setEditGrade] = useState(vehicle?.grade || "");
  const [editYear, setEditYear] = useState(vehicle?.year || 2022);
  const [editOdo, setEditOdo] = useState(vehicle?.odometerKm || 25000);
  const [editTransmission, setEditTransmission] = useState(vehicle?.transmission || "Automatic");
  const [editFuel, setEditFuel] = useState(vehicle?.fuelType || "e-Power");
  const [editDrive, setEditDrive] = useState(vehicle?.driveType || "2WD");
  const [editEngineCc, setEditEngineCc] = useState<number | "">(vehicle?.engineCc || 1200);
  const [editColor, setEditColor] = useState(vehicle?.color || "Pearl White");
  const [editAuctionGrade, setEditAuctionGrade] = useState(vehicle?.auctionGrade || "4.5");
  const [editInteriorGrade, setEditInteriorGrade] = useState(vehicle?.interiorGrade || "A");
  const [editExteriorGrade, setEditExteriorGrade] = useState(vehicle?.exteriorGrade || "A");
  const [editFobJPY, setEditFobJPY] = useState(vehicle?.fobPriceJPY || 2000000);
  const [editLocation, setEditLocation] = useState(vehicle?.location || "Yokohama Export Terminal");
  const [editCondition, setEditCondition] = useState(vehicle?.conditionSummary || "");
  const [editDefects, setEditDefects] = useState(vehicle?.knownDefects?.join("\n") || "");

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
    vehicle.images && vehicle.images.length > 0 ? vehicle.images : ["/images/cars/kicks.png"];

  const activeImage = images[activeImageIdx] || images[0];
  const isAvailable = vehicle.status === "AVAILABLE";
  const isReserved = vehicle.status === "RESERVED";
  const isWithdrawn = vehicle.status === "WITHDRAWN";
  const isDraft = vehicle.status === "DRAFT";
  const isAllocated = vehicle.status === "ALLOCATED";
  const isSold = vehicle.status === "SOLD";

  const reservedDealer = vehicle.reservedByDealerId
    ? dealers.find((d) => d.id === vehicle.reservedByDealerId)
    : null;

  const handleCopyVin = () => {
    navigator.clipboard.writeText(vehicle.vinChassis);
    audio.playSubtleClick();
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  const handlePublish = () => {
    audio.playSuccessChime();
    setVehicleStatus(vehicle.id, "AVAILABLE", "Published unit to central New Zealand dealer catalogue");
    setActionNotice(`Unit #${vehicle.stockId} is now LIVE in the central catalogue.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleWithdrawConfirm = () => {
    audio.playSubtleClick();
    setVehicleStatus(vehicle.id, "WITHDRAWN", withdrawReason);
    setIsWithdrawModalOpen(false);
    setActionNotice(`Unit #${vehicle.stockId} withdrawn from catalogue.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleSaveAmendment = (e: React.FormEvent) => {
    e.preventDefault();
    audio.playSuccessChime();
    const parsedDefects = editDefects
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean);

    updateVehicle(vehicle.id, {
      model: editModel,
      grade: editGrade,
      year: editYear,
      odometerKm: editOdo,
      transmission: editTransmission as Vehicle["transmission"],
      fuelType: editFuel as Vehicle["fuelType"],
      driveType: editDrive as Vehicle["driveType"],
      engineCc: editEngineCc ? Number(editEngineCc) : 1200,
      color: editColor,
      auctionGrade: editAuctionGrade,
      interiorGrade: editInteriorGrade,
      exteriorGrade: editExteriorGrade,
      fobPriceJPY: editFobJPY,
      location: editLocation,
      conditionSummary: editCondition,
      knownDefects: parsedDefects.length > 0 ? parsedDefects : ["Clean pass verified"],
    });

    setIsAmendmentOpen(false);
    setActionNotice(`Specifications & commercial terms updated for unit #${vehicle.stockId}.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleMarkSold = () => {
    audio.playSuccessChime();
    setVehicleStatus(vehicle.id, "SOLD", "Delivered and handed over to dealer inventory");
    setActionNotice(`Unit #${vehicle.stockId} marked as SOLD / DELIVERED.`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const estimatedNZD = Math.round((vehicle.fobPriceJPY || 0) * JPY_TO_NZD_EXCHANGE_RATE);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-12 font-sans text-slate-800 max-w-7xl mx-auto">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Top Navigation & Action Notice Bar                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-all cursor-pointer shadow-2xs hover:border-slate-300 group text-xs w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Inventory</span>
        </button>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="px-3.5 py-1.5 rounded-xl bg-white text-slate-800 text-xs font-semibold shadow-soft border border-slate-200 animate-in fade-in flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>{actionNotice}</span>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Main Vehicle Header Card                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white text-slate-900 rounded-[16px] p-6 sm:p-7 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#C3002F] shrink-0 shadow-2xs">
              <Car className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                  #{vehicle.stockId}
                </span>

                {/* Status Badges for MVP states */}
                {isAvailable && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Available to NZ Franchise</span>
                  </span>
                )}
                {isDraft && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-slate-100 text-slate-700 border-slate-300">
                    <Edit3 className="w-3 h-3 text-slate-500" />
                    <span>Draft Intake (Yard Staging)</span>
                  </span>
                )}
                {isReserved && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-300">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Dealer 24h Exclusivity Hold</span>
                  </span>
                )}
                {isAllocated && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-sky-50 text-sky-700 border-sky-200">
                    <Ship className="w-3 h-3 text-sky-600" />
                    <span>Allocated &amp; Shipping Secured</span>
                  </span>
                )}
                {isWithdrawn && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-rose-50 text-rose-700 border-rose-200">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Withdrawn from Catalogue</span>
                  </span>
                )}
                {isSold && (
                  <span className="text-[11px] font-bold px-3 py-0.5 rounded-full border flex items-center gap-1.5 bg-purple-50 text-purple-700 border-purple-200">
                    <CheckCircle2 className="w-3 h-3 text-purple-600" />
                    <span>Sold &amp; Handed Over</span>
                  </span>
                )}

              </div>

              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions: Amendment, Publication & Status Management */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            {/* Amend Details Button */}
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setEditModel(vehicle.model);
                setEditGrade(vehicle.grade);
                setEditYear(vehicle.year);
                setEditOdo(vehicle.odometerKm);
                setEditTransmission(vehicle.transmission);
                setEditFuel(vehicle.fuelType);
                setEditDrive(vehicle.driveType || "2WD");
                setEditEngineCc(vehicle.engineCc || 1200);
                setEditColor(vehicle.color || "Pearl White");
                setEditAuctionGrade(vehicle.auctionGrade || "4.5");
                setEditInteriorGrade(vehicle.interiorGrade || "A");
                setEditExteriorGrade(vehicle.exteriorGrade || "A");
                setEditFobJPY(vehicle.fobPriceJPY);
                setEditLocation(vehicle.location || "Yokohama Export Terminal");
                setEditCondition(vehicle.conditionSummary || "");
                setEditDefects(vehicle.knownDefects?.join("\n") || "");
                setIsAmendmentOpen(true);
              }}
              className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-500" />
              <span>Amend Details</span>
            </button>

            {/* Publication & Withdrawal Status Action Buttons */}
            {isDraft && (
              <button
                type="button"
                onClick={handlePublish}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A0A0A] hover:bg-[#444444] text-white transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publish to Catalogue</span>
              </button>
            )}

            {isAvailable && (
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setIsWithdrawModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Withdraw from Catalogue</span>
              </button>
            )}

            {isWithdrawn && (
              <button
                type="button"
                onClick={handlePublish}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Re-publish to Catalogue</span>
              </button>
            )}

            {isAllocated && (
              <button
                type="button"
                onClick={handleMarkSold}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Handover Completed</span>
              </button>
            )}
          </div>
        </div>

        {/* Hold Reservation Alert Bar if Reserved */}
        {isReserved && (
          <div className="mt-5 pt-4 border-t border-amber-200/60 bg-amber-50/70 -mx-6 -mb-6 px-6 py-3.5 flex items-center gap-2 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Unit is locked under a 24-hour exclusivity hold by{" "}
              <strong className="text-amber-950 font-bold">
                {reservedDealer?.legalTradingName || "NZ Dealer Network Partner"}
              </strong>
              .
            </span>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2.5 INNER STATS CARDS STRIP                                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. ODOMETER (JEVIC) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            ODOMETER (JEVIC)
          </span>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
            {vehicle.odometerKm.toLocaleString()} {vehicle.odometerUnit || "km"}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block truncate">
            Digitally Certified
          </span>
        </div>

        {/* 2. AUCTION & INSPECTION GRADE */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            AUCTION &amp; INSPECTION GRADE
          </span>
          <div className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
            ★ {vehicle.auctionGrade || "4.5"}
          </div>
          <span className="text-[11px] text-slate-600 font-medium block truncate">
            Int: Grade {vehicle.interiorGrade || "A"} · Ext: Grade {vehicle.exteriorGrade || "A"}
          </span>
        </div>

        {/* 3. FOB BASELINE (JPY) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            ACQUISITION BASELINE ({vehicle.currency || "JPY"})
          </span>
          <div className="text-base sm:text-xl font-bold font-mono text-slate-900 tracking-tight">
            ¥{vehicle.fobPriceJPY.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 block truncate">
            {vehicle.purchasePriceBasis || "FOB"} Japan Cost
          </span>
        </div>

        {/* 4. YARD STAGING */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            YARD STAGING
          </span>
          <div className="text-base sm:text-xl font-bold text-slate-900 truncate tracking-tight">
            {vehicle.location || "Yokohama Export Terminal"}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block truncate">
            Export Bay Ready
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. ROW 1: Studio Showcase (Left 7) vs Technical Specs (Right 5) */}
      {/* Balanced with items-stretch and full height alignment       */}
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
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="relative z-10 w-full h-full object-contain filter drop-shadow-[0_16px_20px_rgba(0,0,0,0.18)] select-none transition-transform duration-300 group-hover:scale-105"
                />

                {/* Auction Grade Pill */}
                <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-mono font-bold text-slate-800 border border-slate-200 shadow-soft flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Auction Grade {vehicle.auctionGrade || "4.5"} · Int {vehicle.interiorGrade || "A"} · Ext {vehicle.exteriorGrade || "A"}</span>
                </div>

                {/* Yard Location Pill */}
                <div className="absolute bottom-4 right-4 z-20 px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm text-slate-800 border border-slate-200/90 font-mono text-xs flex items-center gap-1.5 shadow-soft">
                  <MapPin className="w-3.5 h-3.5 text-[#C3002F]" />
                  <span>{vehicle.location || "Yokohama Export Terminal"}</span>
                </div>
              </div>

              {/* Thumbnail Gallery Strip */}
              {images.length > 1 && (
                <div className="space-y-1.5 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                    High-Resolution Studio Angles ({images.length})
                  </span>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          audio.playSubtleClick();
                          setActiveImageIdx(idx);
                        }}
                        className={`w-20 h-14 rounded-xl border-2 p-1 overflow-hidden transition-all cursor-pointer bg-slate-50 shrink-0 ${activeImageIdx === idx
                          ? "border-[#C3002F] ring-2 ring-[#C3002F]/20 bg-white"
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

            {/* Pinned Studio Badge Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Studio Photographic Inspection</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Asset</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Japanese Baseline Pricing & Technical Parameters */}
        <div className="lg:col-span-5 h-full flex flex-col">
          <div className="bg-white rounded-[16px] p-6 border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] h-full flex flex-col justify-between space-y-5">
            {/* Top: Baseline Pricing Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C3002F]" />
                  Japanese Acquisition Pricing ({vehicle.purchasePriceBasis || "FOB"})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 text-[10px] font-mono font-bold">
                  {vehicle.purchasePriceBasis || "FOB"} · {vehicle.currency || "JPY"}
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight">
                  ¥{vehicle.fobPriceJPY.toLocaleString()}
                  <span className="text-xs font-sans text-slate-400 font-semibold ml-2">{vehicle.currency || "JPY"} ({vehicle.purchasePriceBasis || "FOB"})</span>
                </div>
                {/* <p className="text-[11px] text-slate-500 mt-0.5">
                  Raw acquisition cost at Tokyo/Yokohama auction terminal prior to ocean shipping (~${estimatedNZD.toLocaleString()} NZD equiv.)
                </p> */}
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between font-mono">
                <span className="text-slate-400 font-sans">Dispatch Vessel:</span>
                <strong className="text-slate-900 font-bold">Port of Auckland (RoRo V.48)</strong>
              </div>
            </div>

            {/* Middle: Technical Parameters Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Vehicle Specifications &amp; Listing Record
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAmendmentOpen(true)}
                  className="text-[11px] font-bold text-[#C3002F] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Amend Specs</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="flex items-center justify-between py-1.5">
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

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Stock Serial ID:</span>
                  <span className="font-mono font-bold text-slate-800">#{vehicle.stockId}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Make &amp; Model:</span>
                  <span className="font-bold text-slate-800">{vehicle.make || "Nissan"} {vehicle.model}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Variant / Trim:</span>
                  <span className="font-bold text-slate-800">{vehicle.grade}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Model Year:</span>
                  <span className="font-mono font-bold text-slate-900">{vehicle.year}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Engine Displacement:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {vehicle.engineCc ? `${vehicle.engineCc.toLocaleString()} cc` : "1,200 cc"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Transmission:</span>
                  <span className="font-medium text-slate-800">
                    {vehicle.transmission}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Drive System:</span>
                  <span className="font-medium text-slate-800">
                    {vehicle.driveType || "2WD"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Exterior Colour:</span>
                  <span className="font-semibold text-slate-800">
                    {vehicle.color || "Factory Original"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Powertrain / Fuel:</span>
                  <span className="font-semibold text-slate-800">{vehicle.fuelType}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Relevant Stock Ref:</span>
                  <span className="font-mono text-slate-700 font-semibold">
                    {vehicle.stockReference || `USS-JAA-${vehicle.stockId.slice(-4)}`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Listing Status:</span>
                  <span className="font-bold text-slate-900 font-mono text-[11px]">
                    {vehicle.status}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Created / Updated:</span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    {vehicle.createdAt || vehicle.inspectionDate || "2026-10-22"} · {vehicle.updatedAt || new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
              </div>
            </div>

            {/* Pinned Verification Status Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-sans">Intake Verification:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>NZTA MR2A Pre-Cleared</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Full Layout Card 1: Inspection Condition Dossier         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#C3002F]" />
            <span>Inspection Condition Dossier &amp; Known Defects</span>
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
              ★ Grade {vehicle.auctionGrade || "4.5"} · Int {vehicle.interiorGrade || "A"} · Ext {vehicle.exteriorGrade || "A"}
            </span>
            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              MR2A Pre-Verified
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-800">
            <span>Overall Vehicle Condition:</span>
            <span className="text-emerald-700 font-bold text-xs sm:text-sm">
              {vehicle.overallCondition || `★ ${vehicle.auctionGrade} - Clean Japanese Pre-Export Condition`}
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed text-xs">
            {vehicle.conditionSummary ||
              "Showroom demonstration grade. Zero structural panel damage detected. Fully compliant for NZTA MR2A border entry with genuine Japanese documentation."}
          </p>
        </div>

        {vehicle.knownDefects && vehicle.knownDefects.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Inspector Recorded Markings &amp; Defect Items:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {vehicle.knownDefects.map((defect, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-2.5 text-xs text-amber-950 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="break-words leading-snug">{defect}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integrated JEVIC Verification Bar */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">JEVIC Pre-Export Verification</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
            PASSED 100%
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Full Layout Card 2: Supporting Documents                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#C3002F]" />
              <span>Supporting Documents</span>
            </h3>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold font-mono border border-emerald-200 shrink-0 self-start sm:self-auto">
            {vehicleDocs.length} {vehicleDocs.length === 1 ? "Document" : "Documents"} Uploaded
          </span>
        </div>

        {vehicleDocs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {vehicleDocs.map((doc: VehicleSupportingDoc, idx: number) => (
              <div
                key={doc.name + idx}
                onClick={() => {
                  audio.playSubtleClick();
                  setActiveDocPreview({
                    title: doc.name.replace(/_/g, " ").replace(/\.[^/.]+$/, ""),
                    type: (doc.type as any) || "AUCTION_SHEET",
                    refNumber: `${vehicle.stockId}-DOC-${idx + 1}`,
                    details: `Official uploaded documentation for ${vehicle.make} ${vehicle.model} (Stock #${vehicle.stockId}). File: ${doc.name} · Size: ${doc.size || "1.2 MB"} · Uploaded on ${doc.uploadedAt || vehicle.createdAt}. Certified pass.`,
                  });
                }}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 transition-all cursor-pointer group flex items-start justify-between bg-white shadow-2xs"
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#C3002F] shrink-0" />
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#C3002F] transition-colors truncate block" title={doc.name}>
                      {doc.name}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {doc.type.replace(/_/g, " ")} · {doc.size || "PDF Document"}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-semibold block">
                    Uploaded with Vehicle ({doc.uploadedAt || vehicle.createdAt})
                  </span>
                </div>
                <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-700 shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 text-center my-3">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No Supporting Documents</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No documents were uploaded while adding this vehicle.
            </p>
          </div>
        )}

        {/* Pinned Cryptographic Status Footer */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Cryptographic Export Register</span>
          <span className="text-slate-700 font-bold">SHA-256 Verified</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Bottom Return Navigation                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="pt-2 flex items-center justify-center">
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            onBack();
          }}
          className="py-3 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all shadow-2xs flex items-center gap-2 cursor-pointer hover:border-slate-300 active:scale-[0.99]"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>Return to Inventory Listing</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 1: Premium Executive Vehicle Amendment Modal (US-08)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isAmendmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Executive Header */}
            <div className="px-6 py-5 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#C3002F] shrink-0 shadow-2xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Amend Vehicle Specifications
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                      #{vehicle.stockId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Central Fleet Catalogue Management · VIN: <span className="font-mono font-semibold text-slate-700">{vehicle.vinChassis}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAmendmentOpen(false)}
                className="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveAmendment} className="flex-1 overflow-y-auto navy-scrollbar p-6 space-y-5">

              {/* SECTION 1: Core Vehicle Identification */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Car className="w-4 h-4 text-[#C3002F]" />
                    <span>1. Core Identification &amp; Model</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Asset Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Model Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      placeholder="e.g. Note e-Power, Leaf, X-Trail"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Package / Grade *
                    </label>
                    <input
                      type="text"
                      required
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      placeholder="e.g. Medalist, Nismo"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Model Year *
                    </label>
                    <input
                      type="number"
                      required
                      min={2015}
                      max={2026}
                      value={editYear}
                      onChange={(e) => setEditYear(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Powertrain & Mechanical Specifications */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Fuel className="w-4 h-4 text-emerald-600" />
                    <span>2. Powertrain &amp; Mechanical Specifications</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Technical Profile</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Powertrain / Fuel *
                    </label>
                    <select
                      value={editFuel}
                      onChange={(e) => setEditFuel(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="e-Power">e-Power (Electric Generator)</option>
                      <option value="100% Electric">100% Electric (EV Zero Emission)</option>
                      <option value="Hybrid">Hybrid Powertrain</option>
                      <option value="Petrol">Petrol Internal Combustion</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Transmission *
                    </label>
                    <select
                      value={editTransmission}
                      onChange={(e) => setEditTransmission(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="Automatic">Automatic Transmission</option>
                      <option value="e-Power Drive">e-Power Drive (One-Pedal)</option>
                      <option value="CVT">CVT Continuously Variable</option>
                      <option value="Manual">Manual Shift</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Drive System *
                    </label>
                    <select
                      value={editDrive}
                      onChange={(e) => setEditDrive(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="2WD">2WD (Front/Rear Wheel)</option>
                      <option value="4WD">4WD (Intelligent All-Wheel)</option>
                      <option value="e-4ORCE AWD">e-4ORCE AWD (Dual Motor)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Engine Displacement (cc)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={editEngineCc}
                        onChange={(e) => setEditEngineCc(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                        placeholder="e.g. 1200"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                        cc
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Verified Odometer (km) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        value={editOdo}
                        onChange={(e) => setEditOdo(Number(e.target.value))}
                        className="w-full pl-3.5 pr-16 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 font-mono font-semibold text-[11px]">
                        km JEVIC
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Exterior Colour
                    </label>
                    <input
                      type="text"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      placeholder="e.g. Pearl White, Brilliant Silver"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Commercial Terms & Yard Marshalling */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <MapPin className="w-4 h-4 text-sky-600" />
                    <span>3. Commercial Pricing &amp; Yard Logistics</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Commercial Terms</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                        FOB Price (JPY) *
                      </label>
                      <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ≈ ${Math.round(editFobJPY * JPY_TO_NZD_EXCHANGE_RATE).toLocaleString()} NZD
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs font-mono">
                        ¥
                      </span>
                      <input
                        type="number"
                        required
                        min={500000}
                        step={10000}
                        value={editFobJPY}
                        onChange={(e) => setEditFobJPY(Number(e.target.value))}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">Baseline raw acquisition cost at export terminal</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Japanese Marshalling Yard *
                    </label>
                    <select
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="Yokohama Export Terminal">Yokohama Export Terminal (Bay 14 Marshalling Base)</option>
                      <option value="Yokohama Yard (Bay 1)">Yokohama Yard (Bay 1)</option>
                      <option value="Yokohama Yard (Bay 2)">Yokohama Yard (Bay 2)</option>
                      <option value="Yokohama Yard (Bay 3)">Yokohama Yard (Bay 3)</option>
                      <option value="Yokohama Yard (Bay 4)">Yokohama Yard (Bay 4)</option>
                      <option value="Yokohama Yard (Bay 5)">Yokohama Yard (Bay 5)</option>
                      <option value="Yokohama Yard (Bay 6)">Yokohama Yard (Bay 6)</option>
                      <option value="Yokohama Yard (Bay 7)">Yokohama Yard (Bay 7)</option>
                      <option value="Kobe Export Terminal">Kobe Export Terminal</option>
                      <option value="Nagoya Port Terminal">Nagoya Port Terminal</option>
                      <option value="Port of Auckland Delivery Yard">Port of Auckland Delivery Yard</option>
                    </select>
                    <span className="text-[10px] text-slate-500 block">Current physical holding bay location</span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Inspection Assessment & Condition Dossier */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <FileCheck2 className="w-4 h-4 text-amber-600" />
                    <span>4. Inspection Assessment &amp; Condition Dossier</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">USS / JAA Criteria</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Auction Grade *
                    </label>
                    <select
                      value={editAuctionGrade}
                      onChange={(e) => setEditAuctionGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="5.0">★ 5.0 (Near New Pristine)</option>
                      <option value="4.5">★ 4.5 (Excellent Clean Pass)</option>
                      <option value="4.0">★ 4.0 (Good Commuter)</option>
                      <option value="3.5">★ 3.5 (Fair Road Wear)</option>
                      <option value="RA">★ RA (Repaired Verified Pass)</option>
                      <option value="R">★ R (Repaired History)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Interior Grade *
                    </label>
                    <select
                      value={editInteriorGrade}
                      onChange={(e) => setEditInteriorGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="A">Grade A (Immaculate Showroom)</option>
                      <option value="B">Grade B (Normal Commuter Wear)</option>
                      <option value="C">Grade C (Visible Blemishes / Marks)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Exterior Grade *
                    </label>
                    <select
                      value={editExteriorGrade}
                      onChange={(e) => setEditExteriorGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all cursor-pointer"
                    >
                      <option value="A">Grade A (Factory Clean)</option>
                      <option value="B">Grade B (Minor Blemishes)</option>
                      <option value="C">Grade C (Scratches / Dents)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                    Condition Summary Dossier
                  </label>
                  <textarea
                    rows={2}
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value)}
                    placeholder="Provide overview of overall vehicle condition, body integrity, and inspection notes..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                      Recorded Defect Items / Inspection Markings
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">One item per line</span>
                  </div>
                  <textarea
                    rows={2}
                    value={editDefects}
                    onChange={(e) => setEditDefects(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] shadow-2xs transition-all"
                    placeholder="e.g. Minor stone chip on lower front bumper (A1)&#10;Factory alloys in immaculate condition"
                  />
                </div>
              </div>

              {/* Sticky / Pinned Action Buttons in Footer */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/80">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Changes will update central catalogue and audit ledger</span>
                </div>

                <div className="flex items-center gap-2.5 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAmendmentOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-[#C3002F] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save &amp; Apply Amendments</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 2: Withdrawal Reason Modal (US-08)                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Withdraw Vehicle from Catalogue
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Stock #{vehicle.stockId} ({vehicle.model})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Withdrawing this vehicle removes it from dealer visibility. Please specify the formal administrative withdrawal justification:
            </p>

            <div className="space-y-2">
              {[
                "Yard Inspection: Cosmetic Paint / Panel Rectification Required",
                "Documentation Hold: Awaiting JEVIC Biosecurity Re-clearance",
                "Commercial Staging: Re-assigned to Corporate Fleet Program",
                "Japanese Recall Campaign: Technical Module Update Required",
              ].map((reason, idx) => (
                <label
                  key={idx}
                  onClick={() => setWithdrawReason(reason)}
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-colors ${withdrawReason === reason
                    ? "border-rose-300 bg-rose-50/60 text-slate-900 font-semibold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                >
                  <input
                    type="radio"
                    name="withdrawReason"
                    checked={withdrawReason === reason}
                    onChange={() => setWithdrawReason(reason)}
                    className="text-[#C3002F] focus:ring-[#C3002F]"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="btn-outline text-xs py-2 px-3.5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWithdrawConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
              >
                Confirm Withdrawal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODAL 3: Document Viewer Modal (US-07)                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeDocPreview.title}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Ref: {activeDocPreview.refNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Digital Pass Body */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Vehicle Unit:</span>
                <strong className="text-slate-900">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </strong>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">VIN / Chassis:</span>
                <strong className="font-mono text-slate-900">{vehicle.vinChassis}</strong>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                <span className="text-slate-500">Verification Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                  PASS / CLEARED
                </span>
              </div>
              <div className="pt-1">
                <span className="text-slate-500 block mb-1">Inspector Sign-off Notes:</span>
                <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/70 font-mono text-[11px] leading-relaxed">
                  {activeDocPreview.details}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Digitally Signed &amp; Timestamped</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  alert(`Downloading cryptographic digital document PDF for ${activeDocPreview.refNumber}`);
                }}
                className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
