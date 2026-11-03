"use client";

import React, { useState } from "react";
import { Vehicle, VehicleStatus } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  Car,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Save,
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

  // All fields initially free-value / empty text with clean placeholders
  const [stockId, setStockId] = useState("");
  const [vinChassis, setVinChassis] = useState("");
  const [model, setModel] = useState("");
  const [grade, setGrade] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [odometerKm, setOdometerKm] = useState<number | "">("");
  const [transmission, setTransmission] = useState("");
  const [color, setColor] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [driveType, setDriveType] = useState("");
  const [engineCc, setEngineCc] = useState<number | "">("");
  const [auctionGrade, setAuctionGrade] = useState("");
  const [interiorGrade, setInteriorGrade] = useState("");
  const [exteriorGrade, setExteriorGrade] = useState("");
  const [location, setLocation] = useState("");
  const [fobPriceJPY, setFobPriceJPY] = useState<number | "">("");
  const [defectsText, setDefectsText] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishedStatus, setPublishedStatus] = useState<VehicleStatus>("AVAILABLE");

  // Optional 1-click test intake demo loader
  const handleLoadPreset = (presetKey: "note" | "ariya" | "serena") => {
    audio.playSubtleClick();
    if (presetKey === "note") {
      setStockId(`NIS-2026-${Math.floor(9060 + Math.random() * 30)}`);
      setVinChassis(`E13-0${Math.floor(10000 + Math.random() * 90000)}`);
      setModel("Note e-Power");
      setGrade("X Package Custom");
      setYear(2023);
      setOdometerKm(19400);
      setTransmission("e-Power Drive");
      setColor("Pearl White Two-Tone");
      setFuelType("e-Power");
      setDriveType("2WD");
      setEngineCc(1200);
      setAuctionGrade("4.5");
      setInteriorGrade("A");
      setExteriorGrade("A");
      setLocation("Yokohama Yard (Bay 3)");
      setFobPriceJPY(1880000);
      setDefectsText("USS Tokyo auction grade 4.5. Clean vehicle history, zero panel repairs detected.");
      setImageUrl("/images/cars/note.png");
    } else if (presetKey === "ariya") {
      setStockId(`NIS-2026-${Math.floor(9060 + Math.random() * 30)}`);
      setVinChassis(`FE0-00${Math.floor(1000 + Math.random() * 9000)}`);
      setModel("Ariya");
      setGrade("B6 Premier Edition");
      setYear(2023);
      setOdometerKm(14800);
      setTransmission("Automatic");
      setColor("Akatsuki Copper & Black");
      setFuelType("100% Electric");
      setDriveType("e-4ORCE AWD");
      setEngineCc(0);
      setAuctionGrade("5.0");
      setInteriorGrade("A");
      setExteriorGrade("A");
      setLocation("Yokohama Yard (Bay 1)");
      setFobPriceJPY(3950000);
      setDefectsText("Pristine showroom demonstration grade. ProPILOT 2.0 autonomous highway cruise certified.");
      setImageUrl("/images/cars/ariya.png");
    } else {
      setStockId(`NIS-2026-${Math.floor(9060 + Math.random() * 30)}`);
      setVinChassis(`C27-4${Math.floor(10000 + Math.random() * 90000)}`);
      setModel("Serena e-Power");
      setGrade("Highway Star V");
      setYear(2022);
      setOdometerKm(31200);
      setTransmission("e-Power Drive");
      setColor("Diamond Black");
      setFuelType("e-Power");
      setDriveType("2WD");
      setEngineCc(1200);
      setAuctionGrade("4.0");
      setInteriorGrade("B");
      setExteriorGrade("B");
      setLocation("Kobe Export Terminal");
      setFobPriceJPY(2550000);
      setDefectsText("Clean dual electric power sliding doors, factory alloy wheels in good order.");
      setImageUrl("/images/cars/serena.png");
    }
  };

  // Calculate live preview landed price for Zone 1 if FOB is provided
  const liveLanded = fobPriceJPY ? calculateLandedPrice(Number(fobPriceJPY), "ZONE_1") : null;

  const handlePresetImage = (url: string) => {
    audio.playSubtleClick();
    setImageUrl(url);
  };

  const handleSubmit = (e: React.FormEvent, targetStatus: "DRAFT" | "AVAILABLE") => {
    e.preventDefault();
    if (!vinChassis.trim()) {
      alert("VIN / Chassis number is mandatory.");
      return;
    }

    setIsSubmitting(true);
    audio.playSubtleClick();

    const statusValue = targetStatus === "AVAILABLE" ? "AVAILABLE" : "WITHDRAWN";
    setPublishedStatus(statusValue);

    const finalStockId = stockId.trim() || `NIS-2026-${Math.floor(9050 + Math.random() * 50)}`;
    const finalYear = year ? Number(year) : 2023;
    const finalOdo = odometerKm ? Number(odometerKm) : 0;
    const finalFob = fobPriceJPY ? Number(fobPriceJPY) : 0;
    const finalModel = model.trim() || "Nissan Note";
    const finalGrade = grade.trim() || "Standard Grade";
    const finalImage = imageUrl.trim() || "/images/cars/note.png";

    addVehicle({
      stockId: finalStockId,
      vinChassis: vinChassis.trim().toUpperCase(),
      make: "Nissan",
      model: finalModel,
      grade: finalGrade,
      year: finalYear,
      odometerKm: finalOdo,
      transmission: (transmission || "Automatic") as Vehicle["transmission"],
      color: color.trim() || "Pearl White",
      fuelType: (fuelType || "Petrol") as Vehicle["fuelType"],
      driveType: (driveType || "2WD") as Vehicle["driveType"],
      engineCc: engineCc ? Number(engineCc) : 1200,
      auctionGrade: auctionGrade || "4.5",
      interiorGrade: interiorGrade || "B",
      exteriorGrade: exteriorGrade || "B",
      location: location || "Yokohama Yard (Bay 1)",
      images: [finalImage],
      conditionReportUrl: "https://example.com/reports/yokohama_pass.pdf",
      knownDefects: defectsText ? [defectsText] : ["Clean pass"],
      fobPriceJPY: finalFob,
      status: statusValue,
    });

    setTimeout(() => {
      audio.playSuccessChime();
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans">
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
            <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
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
        <div className="bg-white rounded-[24px] border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] max-w-2xl mx-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Vehicle Registered Successfully
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Export unit <strong className="text-slate-800 font-mono font-bold">#{stockId || "NIS-NEW"}</strong> ({vinChassis}) is now saved with status:{" "}
              <span className="font-bold text-emerald-700">{publishedStatus}</span>.
            </p>
          </div>

          {/* Snapshot Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model &amp; Year:</span>
              <strong className="text-slate-900">{year || "—"} Nissan {model || "Vehicle"} ({grade || "Standard"})</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Auction Grade &amp; Odo:</span>
              <strong className="text-slate-900">Grade {auctionGrade || "—"} · {odometerKm ? Number(odometerKm).toLocaleString() : 0} km</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FOB Base Price:</span>
              <strong className="font-mono text-slate-900">¥{fobPriceJPY ? Number(fobPriceJPY).toLocaleString() : 0} JPY</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Yard Staging:</span>
              <strong className="text-slate-900">{location || "Yokohama Yard"}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setIsSuccess(false);
                setVinChassis("");
                setStockId("");
                setModel("");
                setGrade("");
                setYear("");
                setOdometerKm("");
                setFobPriceJPY("");
                setColor("");
              }}
              className="btn-outline w-full sm:w-auto text-xs py-2.5 px-4 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>Register Another Vehicle</span>
            </button>

            <button
              type="button"
              onClick={onSuccessReturn}
              className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
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
            {/* Quick Demo Autofill Bar */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-[#C3002F]" />
                <span className="font-bold text-slate-900">Optional Demo Autofill:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadPreset("note")}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  ⚡ Note e-Power (¥1.88M)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset("ariya")}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  ⚡ Ariya EV AWD (¥3.95M)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset("serena")}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  ⚡ Serena e-Power (¥2.55M)
                </button>
              </div>
            </div>

            {/* Section 1: Identification & Provenance */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Hash className="w-4 h-4 text-[#C3002F]" />
                <span>1. Identification &amp; Japanese Yard Staging</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Stock ID</label>
                  <input
                    type="text"
                    value={stockId}
                    onChange={(e) => setStockId(e.target.value)}
                    placeholder="e.g. NIS-2026-9055"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
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
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Yard Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium cursor-pointer transition-colors"
                  >
                    <option value="">Select Yard Location...</option>
                    <option value="Yokohama Yard (Bay 1)">Yokohama Yard (Bay 1)</option>
                    <option value="Yokohama Yard (Bay 2)">Yokohama Yard (Bay 2)</option>
                    <option value="Yokohama Yard (Bay 3)">Yokohama Yard (Bay 3)</option>
                    <option value="Yokohama Yard (Bay 4)">Yokohama Yard (Bay 4)</option>
                    <option value="Yokohama Yard (Bay 5)">Yokohama Yard (Bay 5)</option>
                    <option value="Yokohama Yard (Bay 7)">Yokohama Yard (Bay 7)</option>
                    <option value="Kobe Export Terminal">Kobe Export Terminal</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Vehicle Technical Specifications */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Car className="w-4 h-4 text-slate-600" />
                <span>2. Technical Specifications &amp; Powertrain</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Model *</label>
                  <input
                    type="text"
                    list="nissan-models"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Note e-Power, X-Trail, Ariya..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-bold placeholder-slate-400 transition-colors"
                  />
                  <datalist id="nissan-models">
                    <option value="Note e-Power" />
                    <option value="Leaf" />
                    <option value="X-Trail" />
                    <option value="Serena e-Power" />
                    <option value="Kicks e-Power" />
                    <option value="Dayz" />
                    <option value="Elgrand" />
                    <option value="Navara" />
                    <option value="Ariya" />
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Grade / Trim</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. X Package, Highway Star, Premier"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Manufacture Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="e.g. 2023"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Odometer (km)</label>
                  <input
                    type="number"
                    value={odometerKm}
                    onChange={(e) => setOdometerKm(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="e.g. 24000"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Transmission</label>
                  <input
                    type="text"
                    list="nissan-transmissions"
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    placeholder="e.g. e-Power Drive, Automatic, CVT"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium placeholder-slate-400 transition-colors"
                  />
                  <datalist id="nissan-transmissions">
                    <option value="e-Power Drive" />
                    <option value="Automatic" />
                    <option value="CVT" />
                    <option value="Manual" />
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Powertrain / Fuel</label>
                  <input
                    type="text"
                    list="nissan-fuels"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    placeholder="e.g. e-Power, 100% Electric, Petrol"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium placeholder-slate-400 transition-colors"
                  />
                  <datalist id="nissan-fuels">
                    <option value="e-Power" />
                    <option value="100% Electric" />
                    <option value="Hybrid" />
                    <option value="Petrol" />
                    <option value="Diesel" />
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Exterior Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Pearl White, Diamond Black"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Drivetrain</label>
                  <input
                    type="text"
                    list="nissan-drivetrains"
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value)}
                    placeholder="e.g. 2WD, 4WD, e-4ORCE AWD"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium placeholder-slate-400 transition-colors"
                  />
                  <datalist id="nissan-drivetrains">
                    <option value="2WD" />
                    <option value="4WD" />
                    <option value="e-4ORCE AWD" />
                    <option value="AWD" />
                  </datalist>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Engine Displacement (cc)</label>
                  <input
                    type="number"
                    value={engineCc}
                    onChange={(e) => setEngineCc(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="e.g. 1200 (or 0 for EV)"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: USS Auction Condition & FOB Pricing */}
            <div className="bg-white rounded-[24px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>3. USS Auction Condition &amp; Raw FOB Pricing</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Auction Grade</label>
                  <select
                    value={auctionGrade}
                    onChange={(e) => setAuctionGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="">Select Grade...</option>
                    <option value="5.0">★ 5.0 (Near New)</option>
                    <option value="4.5">★ 4.5 (Excellent)</option>
                    <option value="4.0">★ 4.0 (Good)</option>
                    <option value="3.5">★ 3.5 (Fair)</option>
                    <option value="RA">★ RA (Repaired Minor)</option>
                    <option value="R">★ R (Repaired)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Interior Grade</label>
                  <select
                    value={interiorGrade}
                    onChange={(e) => setInteriorGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="">Select Grade...</option>
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
                    className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="">Select Grade...</option>
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
                    onChange={(e) => setFobPriceJPY(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="e.g. 1850000"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] text-sm placeholder-slate-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Inspection Remarks / Known Defects</label>
                <input
                  type="text"
                  value={defectsText}
                  onChange={(e) => setDefectsText(e.target.value)}
                  placeholder="e.g. Clean USS auction pass, minor stone chip on mirror..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Vehicle Studio Image Asset</label>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g. /images/cars/note.png or https://..."
                    className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
                  {[
                    { label: "Note", path: "/images/cars/note.png" },
                    { label: "Leaf", path: "/images/cars/leaf.png" },
                    { label: "X-Trail", path: "/images/cars/xtrail.png" },
                    { label: "Serena", path: "/images/cars/serena.png" },
                    { label: "Kicks", path: "/images/cars/kicks.png" },
                    { label: "Dayz", path: "/images/cars/dayz.png" },
                    { label: "Elgrand", path: "/images/cars/elgrand.png" },
                    { label: "Navara", path: "/images/cars/navara.png" },
                    { label: "Ariya", path: "/images/cars/ariya.png" },
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

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={onSuccessReturn}
                className="btn-outline text-xs py-2.5 px-4 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, "DRAFT")}
                  className="btn-outline text-xs py-2.5 px-4 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save as Draft (Staging Yard)</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, "AVAILABLE")}
                  className="py-2.5 px-6 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Publish to Central Catalogue</span>
                </button>
              </div>
            </div>
          </form>

          {/* Right Column (4 cols): Live Interactive Vehicle Preview Card */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white rounded-[24px] border border-slate-200 p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
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
                  src={imageUrl || "/images/cars/note.png"}
                  alt={model || "Nissan Vehicle Preview"}
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.1)] relative z-10 select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/cars/note.png";
                  }}
                />

                <div className="absolute top-3 left-3 z-20 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-[11px] font-bold border border-slate-200/80 shadow-2xs flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Grade {auctionGrade || "—"}</span>
                </div>

                <div className="absolute top-3 right-3 z-20 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-700 font-mono text-[10px] font-bold border border-slate-200/80 shadow-2xs">
                  {stockId ? `#${stockId}` : "#NEW-UNIT"}
                </div>
              </div>

              {/* Vehicle Title & Specifications */}
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 tracking-tight leading-snug">
                  {model ? `Nissan - ${model}` : "Nissan Vehicle Spec"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {year || "Year"} · {fuelType || "Powertrain"} · {grade || "Grade / Trim"}
                </p>
              </div>

              {/* 4-Stat Mini Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Odometer</span>
                  <strong className="text-slate-900 font-mono text-xs font-bold block">
                    {odometerKm ? `${Number(odometerKm).toLocaleString()} km` : "— km"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Raw FOB JPY</span>
                  <strong className="text-slate-900 font-mono text-xs font-bold block">
                    {fobPriceJPY ? `¥${Number(fobPriceJPY).toLocaleString()}` : "— JPY"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Transmission</span>
                  <span className="text-slate-700 text-xs font-medium block truncate">{transmission || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Yard Bay</span>
                  <span className="text-slate-700 text-xs font-medium block truncate">{location ? location.split("(")[0]?.trim() : "—"}</span>
                </div>
              </div>

              {/* Estimated Guaranteed Landed Buy Price for Zone 1 */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-slate-900 font-mono tracking-tight block leading-tight">
                    {liveLanded ? `$${liveLanded.totalBuyPriceNZD.toLocaleString()}` : "$— NZD"}
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
