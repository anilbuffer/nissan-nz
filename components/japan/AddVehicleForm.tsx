"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Vehicle, VehicleStatus, VehicleSupportingDoc } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { JPY_TO_NZD_EXCHANGE_RATE } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  Car,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Save,
  Star,
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  Hash,
  UploadCloud,
  X,
  FileText,
  DollarSign,
  Tag,
  Calendar,
  Layers,
  Image as ImageIcon,
  Paperclip,
  Trash2,
} from "lucide-react";

interface AddVehicleFormProps {
  onSuccessReturn: () => void;
}

export default function AddVehicleForm({ onSuccessReturn }: AddVehicleFormProps) {
  const { vehicles, addVehicle } = useProgramme();

  // ───────────────────────────────────────────────────────────
  // A. Vehicle Identification State
  // ───────────────────────────────────────────────────────────
  // Calculate next sequential serial stock ID based on existing vehicles
  const nextSerialStockId = useMemo(() => {
    let maxSeq = 9066;
    vehicles.forEach((v) => {
      const match = v.stockId.match(/NIS-2026-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxSeq) maxSeq = num;
      }
    });
    return `NIS-2026-${maxSeq + 1}`;
  }, [vehicles]);

  const [stockId, setStockId] = useState("");

  useEffect(() => {
    if (!stockId && nextSerialStockId) {
      setStockId(nextSerialStockId);
    }
  }, [nextSerialStockId, stockId]);
  const [vinChassis, setVinChassis] = useState("");
  const [make, setMake] = useState("Nissan");
  const [model, setModel] = useState("");
  const [grade, setGrade] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [odometerKm, setOdometerKm] = useState<number | "">("");
  const [odometerUnit, setOdometerUnit] = useState<"km" | "mi">("km");
  const [transmission, setTransmission] = useState("");
  const [color, setColor] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [driveType, setDriveType] = useState("");
  const [engineCc, setEngineCc] = useState<number | "">("");

  // ───────────────────────────────────────────────────────────
  // B. Vehicle Condition State
  // ───────────────────────────────────────────────────────────
  const [overallCondition, setOverallCondition] = useState("★ 4.5 - Excellent Clean Japanese Condition");
  const [auctionGrade, setAuctionGrade] = useState("4.5");
  const [interiorGrade, setInteriorGrade] = useState("A");
  const [exteriorGrade, setExteriorGrade] = useState("A");
  const [knownDefects, setKnownDefects] = useState("");
  const [conditionReportName, setConditionReportName] = useState("USS_Tokyo_Official_Auction_Sheet.pdf");
  const [supportingDocName, setSupportingDocName] = useState("JEVIC_Digital_Odometer_Certificate.pdf");

  // ───────────────────────────────────────────────────────────
  // C. Vehicle Pricing Inputs State
  // ───────────────────────────────────────────────────────────
  const [fobPriceJPY, setFobPriceJPY] = useState<number | "">("");
  const [currency, setCurrency] = useState<"JPY" | "NZD" | "USD">("JPY");
  const [purchasePriceBasis, setPurchasePriceBasis] = useState<"FOB" | "CIF" | "EXW">("FOB");

  // ───────────────────────────────────────────────────────────
  // D. Images & Documents State (Multiple Photos & Uploads)
  // ───────────────────────────────────────────────────────────
  const [images, setImages] = useState<string[]>([]);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<VehicleSupportingDoc[]>([
    {
      name: "USS_Tokyo_Inspection_Pass.pdf",
      type: "AUCTION_SHEET",
      url: "https://example.com/reports/yokohama_pass.pdf",
      size: "2.4 MB",
      uploadedAt: new Date().toISOString().slice(0, 10),
    },
    {
      name: "JEVIC_Pre_Shipment_Verification.pdf",
      type: "JEVIC_CERTIFICATE",
      url: "https://example.com/reports/jevic_pass.pdf",
      size: "1.1 MB",
      uploadedAt: new Date().toISOString().slice(0, 10),
    },
  ]);

  // Drag and drop state for images
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const conditionDocInputRef = useRef<HTMLInputElement>(null);
  const supportingDocInputRef = useRef<HTMLInputElement>(null);

  // ───────────────────────────────────────────────────────────
  // E. Listing Information State (MVP Lifecycle)
  // ───────────────────────────────────────────────────────────
  const [status, setStatus] = useState<VehicleStatus>("AVAILABLE");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString().slice(0, 10));
  const [stockReference, setStockReference] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ───────────────────────────────────────────────────────────
  // Multi-Photo Drag & Drop Handlers
  // ───────────────────────────────────────────────────────────
  const processImageFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`File ${file.name} is not an image.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, event.target!.result as string]);
          audio.playSubtleClick();
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFiles(e.dataTransfer.files);
    }
  };

  const handleImageFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFiles(e.target.files);
    }
  };

  const handleRemoveImage = (idxToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    if (activePreviewIdx >= images.length - 1) {
      setActivePreviewIdx(Math.max(0, images.length - 2));
    }
    audio.playSubtleClick();
  };

  // Document Upload Handlers
  const handleConditionDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setConditionReportName(file.name);
      audio.playSubtleClick();
    }
  };

  const handleSupportingDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSupportingDocName(file.name);
      setUploadedDocs((prev) => [
        ...prev,
        {
          name: file.name,
          type: "SUPPORTING_DOC",
          url: "https://example.com/reports/custom_doc.pdf",
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
        },
      ]);
      audio.playSubtleClick();
    }
  };

  const handleRemoveDoc = (docName: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.name !== docName));
    audio.playSubtleClick();
  };

  // Real-time Parallel Pricing Conversion
  const nzdEquivalent = fobPriceJPY
    ? Math.round(Number(fobPriceJPY) * JPY_TO_NZD_EXCHANGE_RATE)
    : 0;

  // ───────────────────────────────────────────────────────────
  // Form Submission
  // ───────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent, overrideStatus?: VehicleStatus) => {
    e.preventDefault();
    if (!vinChassis.trim()) {
      alert("VIN / Chassis number is mandatory.");
      return;
    }

    setIsSubmitting(true);
    audio.playSubtleClick();

    const targetStatus = overrideStatus || status;
    const finalStockId = stockId.trim() || nextSerialStockId;
    const finalYear = year ? Number(year) : 2023;
    const finalOdo = odometerKm ? Number(odometerKm) : 0;
    const finalFob = fobPriceJPY ? Number(fobPriceJPY) : 0;
    const finalModel = model.trim() || "Nissan Note e-Power";
    const finalGrade = grade.trim() || "Standard Grade";
    const finalImages = images.length > 0 ? images : ["/images/cars/note.png"];
    const finalRef = stockReference.trim() || `USS-JAA-${finalStockId.slice(-4)}`;

    addVehicle({
      stockId: finalStockId,
      vinChassis: vinChassis.trim().toUpperCase(),
      make: make.trim() || "Nissan",
      model: finalModel,
      grade: finalGrade,
      year: finalYear,
      odometerKm: finalOdo,
      odometerUnit: odometerUnit,
      transmission: (transmission || "Automatic") as Vehicle["transmission"],
      color: color.trim() || "Pearl White",
      fuelType: (fuelType || "e-Power") as Vehicle["fuelType"],
      driveType: (driveType || "2WD") as Vehicle["driveType"],
      engineCc: engineCc ? Number(engineCc) : 1200,
      auctionGrade: auctionGrade || "4.5",
      interiorGrade: interiorGrade || "A",
      exteriorGrade: exteriorGrade || "A",
      overallCondition: overallCondition,
      conditionSummary: `${overallCondition}. ${knownDefects || "Clean pre-export pass verified."}`,
      location: "Yokohama Export Terminal",
      images: finalImages,
      conditionReportUrl: "https://example.com/reports/yokohama_pass.pdf",
      conditionReportName: conditionReportName,
      supportingDocuments: uploadedDocs,
      knownDefects: knownDefects ? [knownDefects] : ["Clean pre-export inspection pass"],
      fobPriceJPY: finalFob,
      currency: currency,
      purchasePriceBasis: purchasePriceBasis,
      status: targetStatus,
      stockReference: finalRef,
      createdAt: createdAt,
      updatedAt: new Date().toISOString().slice(0, 10),
    });

    setTimeout(() => {
      audio.playSuccessChime();
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 400);
  };


  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans pb-12">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* Top Header & Breadcrumb Bar                                */}
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
      {/* Success Feedback Screen                                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isSuccess ? (
        <div className="bg-white rounded-[16px] border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] max-w-2xl mx-auto animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Vehicle Registered Successfully
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Export unit <strong className="text-slate-800 font-mono font-bold">#{stockId || "NIS-NEW"}</strong> ({vinChassis}) is now saved into central programme inventory with status:{" "}
              <span className="font-bold text-emerald-700">{status}</span>.
            </p>
          </div>

          {/* Snapshot Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model &amp; Year:</span>
              <strong className="text-slate-900">{year || "—"} {make} {model || "Vehicle"} ({grade || "Standard"})</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Auction Grade &amp; Odo:</span>
              <strong className="text-slate-900">Grade {auctionGrade || "—"} · {odometerKm ? Number(odometerKm).toLocaleString() : 0} {odometerUnit}</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Currency:</span>
              <strong className="text-slate-900 font-mono">{currency}</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FOB Price (JPY):</span>
              <strong className="font-mono text-slate-900">¥{fobPriceJPY ? Number(fobPriceJPY).toLocaleString() : 0} JPY</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FOB Price (NZD Equivalent):</span>
              <strong className="font-mono text-slate-900">${nzdEquivalent.toLocaleString()} NZD</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Images &amp; Documents Attached:</span>
              <strong className="text-slate-900">{images.length} Photos</strong>
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
                setImages([]);
                setKnownDefects("");
                setStockReference("");
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
        /* Main 5-Section Intake Form & Live Catalogue Preview         */
        /* ─────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Structured Form Sections A through E */}
          <form className="lg:col-span-8 space-y-6" onSubmit={(e) => handleSubmit(e)}>

            {/* ───────────────────────────────────────────────────────── */}
            {/* SECTION A. VEHICLE IDENTIFICATION                         */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Hash className="w-4 h-4 text-[#C3002F]" />
                  <span>A. Vehicle Identification</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">Section 1 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">Stock ID</label>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Auto-Generated
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={stockId || nextSerialStockId}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-100 rounded-xl border border-slate-200 text-slate-900 cursor-default select-all"
                  />
                  <span className="text-[10px] text-slate-400 block font-mono">Sequential stock reference</span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Chassis / VIN *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E13-098412 or FE0-004128"
                    value={vinChassis}
                    onChange={(e) => setVinChassis(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 block">Mandatory Japanese chassis / VIN stamp</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Make</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    placeholder="Nissan"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-semibold transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Note e-Power, X-Trail, Serena e-Power, Ariya..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Variant / Trim</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. Highway Star V, X Package, Premier"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Model Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="e.g. 2023"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Odometer Reading</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={odometerKm}
                      onChange={(e) => setOdometerKm(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                      placeholder="e.g. 24000"
                      className="flex-1 px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                    />
                    <select
                      value={odometerUnit}
                      onChange={(e) => setOdometerUnit(e.target.value as "km" | "mi")}
                      className="px-2.5 py-2 text-xs font-mono font-bold bg-slate-100 rounded-xl border border-slate-200 text-slate-700 cursor-pointer"
                    >
                      <option value="km">km</option>
                      <option value="mi">mi</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Transmission</label>
                  <input
                    type="text"
                    
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    placeholder="e.g. Automatic, e-Power Drive, CVT"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium placeholder-slate-400 transition-colors"
                  />
                  
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Exterior Colour</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Pearl White Two-Tone, Diamond Black"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Powertrain / Fuel</label>
                  <input
                    type="text"
                    
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    placeholder="e.g. e-Power, 100% Electric, Petrol"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium placeholder-slate-400 transition-colors"
                  />
                  
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* SECTION B. VEHICLE CONDITION                              */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>B. Vehicle Condition</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">Section 2 of 5</span>
              </div>

              {/* Overall Vehicle Condition / Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Overall Vehicle Condition / Grade</label>
                <select
                  value={overallCondition}
                  onChange={(e) => setOverallCondition(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                >
                  <option value="★ 5.0 - Showroom Pristine Condition">★ 5.0 - Showroom Pristine Condition (Demonstration Grade)</option>
                  <option value="★ 4.5 - Excellent Clean Japanese Condition">★ 4.5 - Excellent Clean Japanese Condition (Minimal Wear)</option>
                  <option value="★ 4.0 - Good Clean Fleet Condition">★ 4.0 - Good Clean Fleet Condition (Normal Commuter)</option>
                  <option value="★ 3.5 - Fair Commercial Road Wear">★ 3.5 - Fair Commercial Road Wear</option>
                  <option value="★ RA - Minor Repaired Pass">★ RA - Minor Repaired Pass (Factory Repaired Verified)</option>
                  <option value="★ R - Repaired History">★ R - Repaired History</option>
                </select>
              </div>

              {/* Auction, Interior & Exterior Grades */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Auction Grade</label>
                  <select
                    value={auctionGrade}
                    onChange={(e) => setAuctionGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
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
                    <option value="A">Grade A (Factory Clean)</option>
                    <option value="B">Grade B (Minor Blemishes)</option>
                    <option value="C">Grade C (Scratches/Dents)</option>
                  </select>
                </div>
              </div>

              {/* Known Defects */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-700 block">Known Defects &amp; Inspection Remarks</label>
                <textarea
                  rows={2}
                  value={knownDefects}
                  onChange={(e) => setKnownDefects(e.target.value)}
                  placeholder="e.g. Minor scratch rear bumper (A1), clean panel pass, zero structural repairs detected."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                />
              </div>

              {/* Condition Report & Supporting Document Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Condition Report</span>
                      <span className="text-xs font-medium text-slate-800 truncate block">{conditionReportName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => conditionDocInputRef.current?.click()}
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shrink-0 cursor-pointer shadow-2xs"
                  >
                    Upload New
                  </button>
                  <input
                    ref={conditionDocInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleConditionDocUpload}
                    className="hidden"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Supporting Document</span>
                      <span className="text-xs font-medium text-slate-800 truncate block">{supportingDocName}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => supportingDocInputRef.current?.click()}
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shrink-0 cursor-pointer shadow-2xs"
                  >
                    Upload New
                  </button>
                  <input
                    ref={supportingDocInputRef}
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleSupportingDocUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* SECTION C. VEHICLE PRICING INPUTS                         */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>C. Vehicle Pricing Inputs</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">Section 3 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Vehicle Acquisition Price *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      {currency === "JPY" ? "¥" : "$"}
                    </span>
                    <input
                      type="number"
                      required
                      value={fobPriceJPY}
                      onChange={(e) => setFobPriceJPY(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                      placeholder="e.g. 1850000"
                      className="w-full pl-8 pr-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Direct Japanese auction acquisition price</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Currency</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase() as "JPY" | "NZD" | "USD")}
                    placeholder="JPY"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 block font-mono">Default: JPY</span>
                </div>

                {/* Purchase Price Basis field: Hidden for now */}

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-xs font-bold text-slate-700 block">Equivalent Amount (NZD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={fobPriceJPY ? `${nzdEquivalent.toLocaleString()} NZD` : "— NZD"}
                      className="w-full pl-8 pr-3.5 py-2 text-xs font-mono font-bold bg-slate-100 rounded-xl border border-slate-200 text-slate-700 focus:outline-none cursor-default"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Real-time indicative conversion (FX: 0.01085)
                  </span>
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* SECTION D. IMAGES AND DOCUMENTS                           */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>Images &amp; Supporting Documents</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">Section 4 of 5</span>
              </div>

              {/* Upload Multiple Vehicle Photographs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    Upload Multiple Vehicle Photographs ({images.length} added)
                  </label>
                  <span className="text-[11px] text-slate-400">Transparent PNG studio cutout recommended</span>
                </div>

                {/* Drag & Drop Multi-Image Dropzone */}
                <div
                  onDragOver={handleImageDragOver}
                  onDragLeave={handleImageDragLeave}
                  onDrop={handleImageDrop}
                  onClick={() => imageInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center transition-all cursor-pointer ${isDraggingImage
                    ? "border-[#0A0A0A] bg-slate-100 ring-2 ring-[#0A0A0A]/10"
                    : "border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50"
                    }`}
                >
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageFileInputChange}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2.5 text-slate-500 shadow-2xs">
                    <UploadCloud className="w-6 h-6 text-slate-500" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Drag &amp; drop multiple vehicle images here, or <span className="text-[#0A0A0A] underline underline-offset-2">browse files</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Upload exterior angles, interior, dashboard, and defects photos (PNG, JPG, WEBP)
                  </p>
                </div>

                {/* Thumbnail Gallery of Uploaded Photos */}
                {images.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Uploaded Vehicle Photos ({images.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative aspect-[4/3] rounded-xl border overflow-hidden p-1 bg-slate-50 group ${idx === 0 ? "border-[#0A0A0A] ring-2 ring-[#0A0A0A]/10" : "border-slate-200"
                            }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-contain"
                          />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-[#0A0A0A] text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Supporting Documents: Hidden for now as requested */}
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* SECTION E. LISTING INFORMATION                            */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>E. Listing Information</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">Section 5 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Listing Status Dropdown with All MVP Lifecycles */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Listing Status (MVP Lifecycle)</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                    className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="DRAFT">Draft — Inbound Japanese Yard Preparation</option>
                    <option value="AVAILABLE">Available — Published to Central Dealer Catalogue</option>
                    <option value="RESERVED">Reserved — Dealer 24-Hour Exclusivity Hold</option>
                    <option value="ALLOCATED">Allocated — Confirmed Wholesale Order</option>
                    <option value="WITHDRAWN">Withdrawn — Yard Rectification / Hold</option>
                    <option value="SOLD">Sold / Completed — Dealership Handover Done</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Created Date</label>
                  <input
                    type="date"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block">Relevant Stock Reference</label>
                  <input
                    type="text"
                    value={stockReference}
                    onChange={(e) => setStockReference(e.target.value)}
                    placeholder="e.g. USS-TYO-8841 / JEVIC-NZ-102"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                  <span className="text-[10px] text-slate-400 block">Japanese auction lot number or AutoHub reference</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Last Updated Date</label>
                  <input
                    type="text"
                    readOnly
                    value={new Date().toISOString().slice(0, 10)}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-100 rounded-xl border border-slate-200 text-slate-600 cursor-default"
                  />
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* Form Action Buttons                                       */}
            {/* ───────────────────────────────────────────────────────── */}
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
                  <span>Save as Draft</span>
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Vehicle Record</span>
                </button>
              </div>
            </div>
          </form>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Right Column (4 cols): Live Interactive Catalogue Preview   */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Live Catalogue Preview
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${status === "AVAILABLE"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : status === "RESERVED"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : status === "ALLOCATED"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}>
                  {status}
                </span>
              </div>

              {/* Studio Car Photo Preview */}
              <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-4">
                <div className="absolute bottom-3 w-4/5 h-4 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />
                <img
                  src={images[activePreviewIdx] || images[0] || "/images/cars/note.png"}
                  alt={model || "Nissan Vehicle Preview"}
                  className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.1)] relative z-10 select-none transition-all duration-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/cars/note.png";
                  }}
                />

                <div className="absolute top-3 left-3 z-20 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-[11px] font-bold border border-slate-200/80 shadow-2xs flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Grade {auctionGrade || "4.5"}</span>
                </div>

                <div className="absolute top-3 right-3 z-20 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-slate-700 font-mono text-[10px] font-bold border border-slate-200/80 shadow-2xs">
                  {stockId ? `#${stockId}` : "#NEW-UNIT"}
                </div>
              </div>

              {/* Interactive Thumbnail Angles Switcher in Live Preview */}
              {images.length > 1 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                    Preview Angles ({images.length})
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          audio.playSubtleClick();
                          setActivePreviewIdx(idx);
                        }}
                        className={`w-12 h-9 rounded-lg overflow-hidden border p-0.5 shrink-0 transition-all cursor-pointer bg-slate-50 ${activePreviewIdx === idx
                          ? "border-[#0A0A0A] ring-2 ring-[#0A0A0A]/20 bg-white"
                          : "border-slate-200 opacity-60 hover:opacity-100"
                          }`}
                      >
                        <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle Title & Specifications */}
              <div className="space-y-1">
                <h3 className="font-bold text-base text-slate-900 tracking-tight leading-snug">
                  {year || "2023"} {make} {model || "Vehicle"}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {grade || "Standard Trim"} · {transmission || "Automatic"} · {color || "Color"}
                </p>
                <div className="text-[11px] text-emerald-700 font-medium">
                  {overallCondition}
                </div>
              </div>

              {/* 4-Stat Mini Grid */}
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Odometer</span>
                  <strong className="text-slate-900 font-mono text-xs font-bold block">
                    {odometerKm ? `${Number(odometerKm).toLocaleString()} ${odometerUnit}` : "— km"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Currency</span>
                  <strong className="text-slate-900 font-mono text-xs font-bold block truncate">
                    {currency}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Transmission</span>
                  <span className="text-slate-700 text-xs font-medium block truncate">{transmission || "—"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Photos / Docs</span>
                  <span className="text-slate-700 text-xs font-medium block truncate">
                    {images.length} photos uploaded
                  </span>
                </div>
              </div>

              {/* Parallel FOB Pricing (JPY & NZD) */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    FOB Price (JPY)
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono tracking-tight block">
                    {fobPriceJPY ? `¥${Number(fobPriceJPY).toLocaleString()}` : "¥—"}
                  </span>
                </div>

                <div className="space-y-0.5 sm:text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    FOB Price (NZD)
                  </span>
                  <span className="text-lg font-bold text-slate-900 font-mono tracking-tight block">
                    {fobPriceJPY ? `$${nzdEquivalent.toLocaleString()} NZD` : "$— NZD"}
                  </span>
                </div>
              </div>

              {stockReference && (
                <div className="pt-1 text-[11px] font-mono text-slate-400 border-t border-slate-100">
                  Ref: <strong className="text-slate-600">{stockReference}</strong>
                </div>
              )}
            </div>

            {/* Quick Tips Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 space-y-1">
              <strong className="text-slate-900 font-bold block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>JEVIC &amp; Export Verification</span>
              </strong>
              <p className="text-[11px] leading-relaxed">
                Saving this record associates all uploaded photographs, USS condition reports, and JEVIC certificates directly with stock #{stockId || "NIS-NEW"}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
