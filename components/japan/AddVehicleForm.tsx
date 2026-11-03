"use client";

import React, { useState } from "react";
import { Vehicle } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  Car,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Save,
  Lock,
  Star,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Compass,
  FileCheck2,
  Image as ImageIcon,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Hash,
} from "lucide-react";

interface AddVehicleFormProps {
  onSuccessReturn: () => void;
}

export default function AddVehicleForm({ onSuccessReturn }: AddVehicleFormProps) {
  const { addVehicle } = useProgramme();

  const [stockId, setStockId] = useState("NIS-2026-9055");
  const [vinChassis, setVinChassis] = useState("E13-098412");
  const [model, setModel] = useState("Note e-Power");
  const [grade, setGrade] = useState("X Package");
  const [year, setYear] = useState(2022);
  const [odometerKm, setOdometerKm] = useState(26000);
  const [transmission, setTransmission] = useState("e-Power Drive");
  const [color, setColor] = useState("Pearl White");
  const [fuelType, setFuelType] = useState("e-Power");
  const [driveType, setDriveType] = useState("2WD");
  const [engineCc, setEngineCc] = useState(1200);
  const [auctionGrade, setAuctionGrade] = useState("4.5");
  const [interiorGrade, setInteriorGrade] = useState("A");
  const [exteriorGrade, setExteriorGrade] = useState("A");
  const [location, setLocation] = useState("Yokohama Yard (Bay 5)");
  const [fobPriceJPY, setFobPriceJPY] = useState(1850000);
  const [defectsText, setDefectsText] = useState("Verified USS clean pass, minor stone chip on left mirror.");
  const [imageUrl, setImageUrl] = useState("/images/cars/kicks.png");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishedStatus, setPublishedStatus] = useState<"AVAILABLE" | "WITHDRAWN">("AVAILABLE");

  // Calculate live preview landed price for Zone 1
  const liveLanded = calculateLandedPrice(fobPriceJPY || 1850000, "ZONE_1");

  const handlePresetImage = (url: string) => {
    audio.playSubtleClick();
    setImageUrl(url);
  };

  const handleSubmit = (e: React.FormEvent, targetStatus: "DRAFT" | "AVAILABLE") => {
    e.preventDefault();
    if (!vinChassis.trim()) {
      alert("VIN Chassis number is mandatory.");
      return;
    }

    setIsSubmitting(true);
    audio.playSubtleClick();

    const statusValue = targetStatus === "AVAILABLE" ? "AVAILABLE" : "WITHDRAWN";
    setPublishedStatus(statusValue);

    addVehicle({
      stockId,
      vinChassis,
      make: "Nissan",
      model,
      grade,
      year,
      odometerKm,
      transmission: transmission as Vehicle["transmission"],
      color,
      fuelType: fuelType as Vehicle["fuelType"],
      driveType: driveType as Vehicle["driveType"],
      engineCc,
      auctionGrade,
      interiorGrade,
      exteriorGrade,
      location,
      images: [imageUrl],
      conditionReportUrl: "https://example.com/reports/yokohama_pass.pdf",
      knownDefects: defectsText ? [defectsText] : ["Clean pass"],
      fobPriceJPY,
      status: statusValue,
    });

    setTimeout(() => {
      audio.playSuccessChime();
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner & Top Navigation                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onSuccessReturn();
            }}
            className="btn-outline"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Inventory</span>
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Nissan Japan HQ</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Inventory</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-bold">Add Single Vehicle</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Add Single Export Vehicle
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700 border border-slate-200 shadow-2xs">
            Export Terminal Staging
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Success Feedback Screen                                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isSuccess ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-6 shadow-2xs max-w-2xl mx-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Vehicle Registered Successfully
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Export unit <strong className="text-slate-800 font-mono font-bold">#{stockId}</strong> ({vinChassis}) is now saved with status:{" "}
              <span className="font-bold text-emerald-700">{publishedStatus}</span>.
            </p>
          </div>

          {/* Snapshot Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model &amp; Year:</span>
              <strong className="text-slate-900">{year} Nissan {model} ({grade})</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Auction Grade &amp; Odo:</span>
              <strong className="text-slate-900">Grade {auctionGrade} · {odometerKm.toLocaleString()} km</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FOB Base Price:</span>
              <strong className="font-mono text-slate-900">¥{fobPriceJPY.toLocaleString()} JPY</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Yard Staging:</span>
              <strong className="text-slate-900">{location}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setIsSuccess(false);
                setVinChassis("");
                setStockId(`NIS-2026-${Math.floor(9050 + Math.random() * 50)}`);
              }}
              className="btn-outline w-full sm:w-auto text-xs py-2.5 px-4"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>Register Another Vehicle</span>
            </button>

            <button
              type="button"
              onClick={onSuccessReturn}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(225,29,72,0.35)] cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <span>Return to Inventory Listing</span>
            </button>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────── */
        /* 3. Main Form & Live Interactive Vehicle Preview             */
        /* ─────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Input Fields Form */}
          <form className="lg:col-span-8 space-y-6">
            {/* Section 1: Identification & Provenance */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Hash className="w-4 h-4 text-[#E11D48]" />
                <span>1. Identification &amp; Japanese Yard Staging</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Stock ID *</label>
                  <input
                    type="text"
                    required
                    value={stockId}
                    onChange={(e) => setStockId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">VIN / Chassis Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E13-098412"
                    value={vinChassis}
                    onChange={(e) => setVinChassis(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Yard Location *</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 font-medium cursor-pointer"
                  >
                    <option value="Yokohama Yard (Bay 1)">Yokohama Yard (Bay 1)</option>
                    <option value="Yokohama Yard (Bay 2)">Yokohama Yard (Bay 2)</option>
                    <option value="Yokohama Yard (Bay 4)">Yokohama Yard (Bay 4)</option>
                    <option value="Yokohama Yard (Bay 5)">Yokohama Yard (Bay 5)</option>
                    <option value="Yokohama Yard (Bay 7)">Yokohama Yard (Bay 7)</option>
                    <option value="Kobe Export Terminal">Kobe Export Terminal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Vehicle Technical Specifications */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <Car className="w-4 h-4 text-slate-600" />
                <span>2. Technical Specifications &amp; Powertrain</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Model *</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 font-bold cursor-pointer"
                  >
                    <option value="Note e-Power">Nissan Note e-Power</option>
                    <option value="X-Trail">Nissan X-Trail</option>
                    <option value="Serena e-Power">Nissan Serena e-Power</option>
                    <option value="Leaf e+">Nissan Leaf e+</option>
                    <option value="Ariya">Nissan Ariya</option>
                    <option value="Kicks e-Power">Nissan Kicks e-Power</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Grade / Trim</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Manufacture Year *</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2022)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Odometer (km) *</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 cursor-pointer font-medium"
                  >
                    <option value="e-Power Drive">e-Power Drive</option>
                    <option value="Automatic">Automatic</option>
                    <option value="CVT">CVT</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Powertrain / Fuel</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 cursor-pointer font-medium"
                  >
                    <option value="e-Power">e-Power</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="100% Electric">100% Electric</option>
                    <option value="Petrol">Petrol</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Exterior Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Drivetrain</label>
                  <select
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 cursor-pointer font-medium"
                  >
                    <option value="2WD">2WD</option>
                    <option value="4WD">4WD</option>
                    <option value="e-4ORCE AWD">e-4ORCE AWD</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Engine Displacement (cc)</label>
                  <input
                    type="number"
                    value={engineCc}
                    onChange={(e) => setEngineCc(parseInt(e.target.value) || 1200)}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: USS Auction Condition & FOB Pricing */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>3. USS Auction Condition &amp; Raw FOB Pricing</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Auction Grade *</label>
                  <select
                    value={auctionGrade}
                    onChange={(e) => setAuctionGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 cursor-pointer"
                  >
                    <option value="5.0">★ 5.0 (Near New)</option>
                    <option value="4.5">★ 4.5 (Excellent)</option>
                    <option value="4.0">★ 4.0 (Good)</option>
                    <option value="RA">★ RA (Repaired Minor)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Interior Grade</label>
                  <select
                    value={interiorGrade}
                    onChange={(e) => setInteriorGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 cursor-pointer"
                  >
                    <option value="A">Grade A (Immaculate)</option>
                    <option value="B">Grade B (Normal Wear)</option>
                    <option value="C">Grade C (Wear / Marks)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Exterior Grade</label>
                  <select
                    value={exteriorGrade}
                    onChange={(e) => setExteriorGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 cursor-pointer"
                  >
                    <option value="A">Grade A (Factory Clean)</option>
                    <option value="B">Grade B (Minor Blemishes)</option>
                    <option value="C">Grade C (Scratches/Dents)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">FOB Price (JPY) *</label>
                  <input
                    type="number"
                    required
                    value={fobPriceJPY}
                    onChange={(e) => setFobPriceJPY(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-black bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Inspection Remarks / Known Defects</label>
                <input
                  type="text"
                  value={defectsText}
                  onChange={(e) => setDefectsText(e.target.value)}
                  placeholder="Inspector comments on tires, glass, minor blemishes..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Vehicle Studio Image Asset</label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image asset URL or path..."
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
                  {[
                    { label: "Kicks", path: "/images/cars/kicks.png" },
                    { label: "Leaf", path: "/images/cars/leaf.png" },
                    { label: "X-Trail", path: "/images/cars/xtrail.png" },
                  ].map((p) => (
                    <button
                      key={p.path}
                      type="button"
                      onClick={() => handlePresetImage(p.path)}
                      className="px-2.5 py-0.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Consistent Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={onSuccessReturn}
                className="btn-outline text-xs py-2.5 px-4"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, "DRAFT")}
                  className="btn-outline text-xs py-2.5 px-4"
                >
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save as Draft (Withdrawn)</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, "AVAILABLE")}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(225,29,72,0.35)] cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Publish to Programme</span>
                </button>
              </div>
            </div>
          </form>

          {/* Right Column (4 cols): Live Interactive Vehicle Preview Card */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Live Catalogue Preview
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                  Dealer Visible
                </span>
              </div>

              {/* Studio Car Photo Preview with Ground Shadow */}
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                <div className="absolute bottom-3 w-4/5 h-4 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />
                <img
                  src={imageUrl || "/images/cars/kicks.png"}
                  alt={model}
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.1)] relative z-10 select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/cars/kicks.png";
                  }}
                />

                <div className="absolute top-3 left-3 z-20 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-[11px] font-bold border border-slate-200/80 shadow-2xs flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Grade {auctionGrade}</span>
                </div>

                <div className="absolute top-3 right-3 z-20 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-700 font-mono text-[10px] font-bold border border-slate-200/80 shadow-2xs">
                  #{stockId}
                </div>
              </div>

              {/* Vehicle Title & Specifications */}
              <div className="space-y-1">
                <h3 className="font-black text-base text-slate-900 tracking-tight leading-snug">
                  Nissan - {model}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {year} · {fuelType} · {grade}
                </p>
              </div>

              {/* 4-Stat Mini Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Odometer</span>
                  <strong className="text-slate-900 font-mono text-xs font-bold block">{odometerKm.toLocaleString()} km</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Raw FOB JPY</span>
                  <strong className="text-slate-900 font-mono text-xs font-bold block">¥{fobPriceJPY.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Transmission</span>
                  <span className="text-slate-700 text-xs font-medium block truncate">{transmission}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Yard Bay</span>
                  <span className="text-slate-700 text-xs font-medium block truncate">{location.split("(")[0]?.trim()}</span>
                </div>
              </div>

              {/* Estimated Guaranteed Landed Buy Price for Zone 1 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-slate-900 font-mono tracking-tight block leading-tight">
                    ${liveLanded.totalBuyPriceNZD.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Est. Landed (Zone 1 NZD)
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Fixed Pricing
                </span>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 space-y-1">
              <strong className="text-slate-900 font-bold block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>JEVIC &amp; Export Verification</span>
              </strong>
              <p className="text-[11px] leading-relaxed">
                Publishing this unit automatically triggers digital odometer verification hashing and pre-clears standard MR2A compliance for New Zealand delivery.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
