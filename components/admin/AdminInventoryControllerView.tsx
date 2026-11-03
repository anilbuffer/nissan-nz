"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Vehicle, ZoneId } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { calculateLandedPrice, OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  Car,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowUpRight,
  ArrowLeft,
  Lock,
  Unlock,
  Clock,
  MapPin,
  Calendar,
  Gauge,
  Star,
  TrendingUp,
  Copy,
  Check,
  ShieldCheck,
  FileCheck2,
  Hash,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function AdminInventoryControllerView() {
  const router = useRouter();
  const { vehicles, toggleVehicleStatus, reservations } = useProgramme();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "AVAILABLE" | "RESERVED" | "WITHDRAWN">("ALL");
  const [modelFilter, setModelFilter] = useState("ALL");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Inner Details View states
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedVin, setCopiedVin] = useState(false);
  const [selectedPricingZone, setSelectedPricingZone] = useState<ZoneId>("ZONE_1");

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const mStock = v.stockId.toLowerCase().includes(q);
        const mModel = v.model.toLowerCase().includes(q);
        const mVin = v.vinChassis.toLowerCase().includes(q);
        if (!mStock && !mModel && !mVin) return false;
      }

      if (statusFilter !== "ALL" && v.status !== statusFilter) {
        return false;
      }

      if (modelFilter !== "ALL" && !v.model.toLowerCase().includes(modelFilter.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [vehicles, searchQuery, statusFilter, modelFilter]);

  const handleToggleStatus = (vehicleId: string) => {
    audio.playSubtleClick();
    toggleVehicleStatus(vehicleId);
  };

  const handleCopyVin = (vin: string) => {
    navigator.clipboard.writeText(vin);
    audio.playSubtleClick();
    setCopiedVin(true);
    setTimeout(() => setCopiedVin(false), 2000);
  };

  // Live selected vehicle from context
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId) || null;

  // Check if vehicle has an active hold
  const activeHold = selectedVehicle
    ? reservations.find((r) => r.vehicleId === selectedVehicle.id && r.status === "ACTIVE_HOLD")
    : null;

  // ─────────────────────────────────────────────────────────────
  // A. FULL INNER DETAILS PAGE (When an inventory item is selected)
  // ─────────────────────────────────────────────────────────────
  if (selectedVehicle) {
    const v = selectedVehicle;
    const images = v.images && v.images.length > 0 ? v.images : ["/images/cars/kicks.png"];
    const activeImage = images[activeImageIdx] || images[0];
    const landedPrice = calculateLandedPrice(v.fobPriceJPY, selectedPricingZone);
    const isWithdrawn = v.status === "WITHDRAWN";
    const isReserved = v.status === "RESERVED";

    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
        {/* Navigation Top Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setSelectedVehicleId(null);
                setActiveImageIdx(0);
              }}
              className="btn-outline"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Back to Central Inventory</span>
            </button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Platform Operations</span>
              <span>/</span>
              <span className="text-slate-900 font-semibold">Central Inventory</span>
              <span>/</span>
              <span className="font-mono text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-slate-200">
                #{v.stockId}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isReserved ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 font-mono shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>24h Exclusivity Lock Active</span>
              </span>
            ) : isWithdrawn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Withdrawn From Dealer Catalogue</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Available for Franchise Hold</span>
              </span>
            )}
          </div>
        </div>

        {/* 4-Stat Executive Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Odometer (JEVIC)
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              {v.odometerKm.toLocaleString()} km
            </div>
            <span className="text-xs text-emerald-700 font-semibold block truncate">
              Digitally Certified
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Auction Grade
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              ★ {v.auctionGrade} / {v.interiorGrade || "A"}
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              USS / JAA Inspection
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              FOB Baseline (JPY)
            </span>
            <div className="text-xl font-black text-slate-900 font-mono">
              ¥{v.fobPriceJPY.toLocaleString()}
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              Japan Acquisition Cost
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Yard Staging
            </span>
            <div className="text-xl font-black text-slate-900 truncate">
              {v.location ? v.location.split("(")[0]?.trim() : "Yokohama Yard"}
            </div>
            <span className="text-xs text-slate-500 font-medium block truncate">
              Export Bay Ready
            </span>
          </div>
        </div>

        {/* 2-Column Cockpit Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Studio Vehicle & Technical Dossier */}
          <div className="lg:col-span-7 space-y-6">
            {/* Studio Photography Showcase */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center p-6">
                <div className="absolute bottom-6 w-4/5 h-6 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />
                <img
                  src={activeImage}
                  alt={v.model}
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.12)] relative z-10 select-none"
                />

                <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-xs font-bold border border-slate-200/80 shadow-2xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Grade {v.auctionGrade} / {v.interiorGrade || "A"}</span>
                </div>

                <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-700 font-mono text-[11px] font-bold border border-slate-200/80 shadow-2xs">
                  #{v.stockId}
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all p-1 bg-white shrink-0 ${
                        activeImageIdx === idx
                          ? "border-[#E11D48] ring-2 ring-[#E11D48]/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Technical & Compliance Dossier */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Japanese Export Verification &amp; Technical Specifications</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Chassis / VIN:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{v.vinChassis}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyVin(v.vinChassis)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
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

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">JEVIC Odometer Certification:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>VERIFIED #{v.odometerKm.toLocaleString()} KM</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Battery State of Health (SOH):</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {v.fuelType === "100% Electric" ? "94.2% (Grade A Battery SOH)" : "Certified Hybrid e-Power System"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">MR2A Compliance &amp; WoF:</span>
                  <span className="font-semibold text-emerald-700">Pre-inspected Pass Guaranteed</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Powertrain / Fuel:</span>
                  <span className="font-semibold text-slate-800">{v.fuelType} · {v.transmission}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Engine Displacement:</span>
                  <span className="font-mono font-semibold text-slate-800">{v.engineCc ? `${v.engineCc.toLocaleString()} cc` : "1,200 cc e-Power"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Comparative 5-Zone Landed Schedule & Administrative Controls */}
          <div className="lg:col-span-5 space-y-6">
            {/* Comparative 5-Zone Landed Price Schedule */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-5 shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Wholesale Landed Price Schedule
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 mt-1">
                  ${landedPrice.totalBuyPriceNZD.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">NZD Landed</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Guaranteed landed wholesale cost schedule across New Zealand geographic delivery zones.
                </p>
              </div>

              {/* Zone Switcher Buttons */}
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
                {(["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"] as const).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedPricingZone(z);
                    }}
                    className={`py-2 rounded-xl text-center transition-all cursor-pointer ${
                      selectedPricingZone === z
                        ? "bg-white text-slate-900 shadow-2xs font-black"
                        : "text-slate-500 hover:text-slate-800 font-medium text-xs"
                    }`}
                  >
                    <div className="text-[11px] font-mono">{z.replace("ZONE_", "Z")}</div>
                    <div className="text-[9px] text-slate-400 font-mono">
                      ${OFFICIAL_PRICING_ZONES[z].deliveryCostNZD}
                    </div>
                  </button>
                ))}
              </div>

              {/* Price Breakdown Component */}
              <div className="space-y-2 text-xs pt-1 divide-y divide-slate-100">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Selected Zone Territory:</span>
                  <strong className="text-slate-900">{OFFICIAL_PRICING_ZONES[selectedPricingZone].zoneName}</strong>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">FOB Acquisition (JPY):</span>
                  <strong className="font-mono text-slate-900">¥{v.fobPriceJPY.toLocaleString()}</strong>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Ocean Freight &amp; Port Handling:</span>
                  <strong className="font-mono text-slate-900">${landedPrice.oceanFreightNZD.toLocaleString()} NZD</strong>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">NZ Customs &amp; 15% GST:</span>
                  <strong className="font-mono text-slate-900">${landedPrice.gstNZD.toLocaleString()} NZD</strong>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">MR2A Compliance &amp; Inspection:</span>
                  <strong className="font-mono text-slate-900">${landedPrice.complianceInspectionNZD.toLocaleString()} NZD</strong>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Domestic Carrier Towing:</span>
                  <strong className="font-mono text-slate-900">${landedPrice.zoneDeliveryNZD.toLocaleString()} NZD</strong>
                </div>
              </div>
            </div>

            {/* Administrative Operational Authority */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                Administrative Central Stock Authority
              </span>

              {isReserved ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>24-Hour Atomic Hold Active</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Reserving Dealership: <strong>{activeHold?.dealerName || "Auckland Nissan City"}</strong> ({activeHold?.dealerCode || "AKL-101"}).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/admin/reservations")}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View in Reservations Queue</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    {isWithdrawn
                      ? "This vehicle is currently hidden from dealer purchasing catalog. Republish to make it available for 24h holds."
                      : "This vehicle is live on the dealer purchasing catalogue and eligible for 24h atomic exclusivity holds."}
                  </p>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(v.id)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                      isWithdrawn
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-[0_4px_16px_rgba(5,150,105,0.3)]"
                        : "btn-outline text-rose-700 hover:bg-rose-50 hover:border-rose-200"
                    }`}
                  >
                    {isWithdrawn ? (
                      <>
                        <Unlock className="w-4 h-4 text-emerald-300" />
                        <span>Republish to Franchise Catalogue</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-rose-500" />
                        <span>Withdraw from Dealer Access</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // B. MAIN CENTRAL INVENTORY OVERVIEW TABLE
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner                                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
              Central Stock Control
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Yokohama &amp; Kobe Dispatch
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Central Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central export vehicle repository, Japanese yard staging (Yokohama/Kobe), and franchise dealer publication controls.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 font-mono text-slate-700 font-bold border border-slate-200 shadow-2xs">
            {filteredVehicles.length} of {vehicles.length} Units Displayed
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Filter & Search Bar                                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stock ID, chassis VIN, or model..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-all font-medium"
            />
          </div>

          <div className="w-full sm:w-44">
            <select
              value={modelFilter}
              onChange={(e) => {
                audio.playSubtleClick();
                setModelFilter(e.target.value);
              }}
              aria-label="Filter by model"
              className="w-full px-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-all cursor-pointer font-medium"
            >
              <option value="ALL">All Models</option>
              <option value="Note">Note e-Power</option>
              <option value="X-Trail">X-Trail</option>
              <option value="Serena">Serena</option>
              <option value="Leaf">Leaf EV</option>
              <option value="Ariya">Ariya</option>
              <option value="Kicks">Kicks</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-auto overflow-x-auto text-xs">
            {[
              { id: "ALL", label: "All Units", count: vehicles.length },
              { id: "AVAILABLE", label: "Available", count: vehicles.filter((v) => v.status === "AVAILABLE").length },
              { id: "RESERVED", label: "Reserved", count: vehicles.filter((v) => v.status === "RESERVED").length },
              { id: "WITHDRAWN", label: "Withdrawn", count: vehicles.filter((v) => v.status === "WITHDRAWN").length },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setStatusFilter(st.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  statusFilter === st.id
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-500 hover:text-slate-800 font-medium"
                }`}
              >
                <span>{st.label}</span>
                <span className="text-[10px] font-mono text-slate-400 font-normal">
                  ({st.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Central Inventory Table (Light Executive Outline UI)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-soft overflow-hidden">
        <div className="overflow-x-auto touch-scroll navy-scrollbar">
          <table className="w-full text-left text-xs text-slate-600 min-w-[840px]">
            {/* Clean Light Executive Table Header */}
            <thead className="bg-slate-50/90 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Vehicle &amp; Stock ID</th>
                <th className="py-3.5 px-4">Chassis / VIN</th>
                <th className="py-3.5 px-4">Grade &amp; Odo</th>
                <th className="py-3.5 px-4">FOB Price (JPY)</th>
                <th className="py-3.5 px-4">Zone 1 Landed</th>
                <th className="py-3.5 px-4">Yard Staging</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => {
                const price = calculateLandedPrice(vehicle.fobPriceJPY, "ZONE_1");
                const isWithdrawn = vehicle.status === "WITHDRAWN";
                const isReserved = vehicle.status === "RESERVED";

                return (
                  <tr
                    key={vehicle.id}
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedVehicleId(vehicle.id);
                    }}
                    className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                  >
                    {/* Vehicle & Stock ID */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="w-14 h-10 object-contain rounded-xl border border-slate-200/90 bg-white p-1 shrink-0 select-none group-hover:scale-105 transition-transform shadow-2xs flex items-center justify-center">
                          <img
                            src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                            alt={vehicle.model || "Vehicle"}
                            className="w-full h-full object-contain filter drop-shadow-2xs"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-[#E11D48] transition-colors truncate">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold border border-slate-200/80">
                              #{vehicle.stockId}
                            </span>
                            <span className="text-[11px] text-slate-400 truncate">
                              · {vehicle.grade || "e-Power"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Chassis / VIN */}
                    <td className="py-4 px-4">
                      <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/70 text-slate-700">
                        {vehicle.vinChassis}
                      </span>
                    </td>

                    {/* Grade & Odo */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 font-bold text-slate-900 text-xs">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                        <span>Grade {vehicle.auctionGrade}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                        <Gauge className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{vehicle.odometerKm.toLocaleString()} km</span>
                      </div>
                    </td>

                    {/* FOB Price (JPY) */}
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        ¥{vehicle.fobPriceJPY.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Japan Base
                      </div>
                    </td>

                    {/* Zone 1 Landed */}
                    <td className="py-4 px-4">
                      <div className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                        ${price.totalBuyPriceNZD.toLocaleString()}{" "}
                        <span className="text-[10px] font-semibold text-slate-400">NZD</span>
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        Zone 1 Landed
                      </div>
                    </td>

                    {/* Yard Staging */}
                    <td className="py-4 px-4 text-slate-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px] font-medium">{vehicle.location}</span>
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {isReserved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold">
                          <Lock className="w-3 h-3 text-amber-500" />
                          <span>RESERVED</span>
                        </span>
                      ) : isWithdrawn ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold">
                          <span>WITHDRAWN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>AVAILABLE</span>
                        </span>
                      )}
                    </td>

                    {/* Actions Column (Horizontal, Non-wrapping aligned) */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playSubtleClick();
                            setSelectedVehicleId(vehicle.id);
                          }}
                          className="btn-outline text-xs py-1.5 px-3 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Inspect</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(vehicle.id);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                            isWithdrawn
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "btn-outline text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                          }`}
                        >
                          {isWithdrawn ? "Republish" : "Withdraw"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
