"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Vehicle, VehicleStatus, VehicleSupportingDoc } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { JPY_TO_NZD_EXCHANGE_RATE } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { getModelAngleImages } from "@/lib/vehicle-media";
import {
  Car,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Save,
  Star,
  FileCheck2,
  ShieldCheck,
  Hash,
  UploadCloud,
  X,
  FileText,
  Trash2,
  DollarSign,
  Tag,
  Eye,
  Image as ImageIcon,
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
  const [fuelType, setFuelType] = useState("e-Power");
  const [driveType, setDriveType] = useState("2WD");
  const [engineCc, setEngineCc] = useState<number | "">(1200);
  const [location, setLocation] = useState("Yokohama Export Terminal");

  // ───────────────────────────────────────────────────────────
  // B. Vehicle Condition State
  // ───────────────────────────────────────────────────────────
  const [overallCondition, setOverallCondition] = useState("★ 4.5 - Excellent Clean Japanese Condition");
  const [auctionGrade, setAuctionGrade] = useState("4.5");
  const [interiorGrade, setInteriorGrade] = useState("A");
  const [exteriorGrade, setExteriorGrade] = useState("A");
  const [knownDefects, setKnownDefects] = useState("");
  const conditionReportName = "USS_Tokyo_Official_Auction_Sheet.pdf";

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

  // Drag and drop state for supporting documents
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

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

  // ───────────────────────────────────────────────────────────
  // Supporting Documents Upload Handlers
  // ───────────────────────────────────────────────────────────
  const processDocFiles = (files: FileList | File[]) => {
    Array.from(files).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isDoc = ext === "pdf" || ext === "doc" || ext === "docx" || file.type.includes("pdf") || file.type.includes("document");
      if (!isDoc) {
        alert(`File "${file.name}" is not a recognized document format (PDF, DOC, DOCX).`);
        return;
      }
      const lower = file.name.toLowerCase();
      const docType = lower.includes("jevic")
        ? "JEVIC_CERTIFICATE"
        : lower.includes("auction") || lower.includes("sheet") || lower.includes("uss")
          ? "AUCTION_SHEET"
          : lower.includes("mr2a")
            ? "MR2A_DOSSIER"
            : "SUPPORTING_DOC";

      setUploadedDocs((prev) => [
        ...prev,
        {
          name: file.name,
          type: docType,
          url: "https://example.com/reports/" + encodeURIComponent(file.name),
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          uploadedAt: new Date().toISOString().slice(0, 10),
        },
      ]);
      audio.playSubtleClick();
    });
  };

  const handleDocDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDoc(true);
  };

  const handleDocDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDoc(false);
  };

  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingDoc(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processDocFiles(e.dataTransfer.files);
    }
  };

  const handleDocFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processDocFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleRemoveDoc = (idxToRemove: number) => {
    setUploadedDocs((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    audio.playSubtleClick();
  };

  // Real-time Parallel Pricing Conversion
  const nzdEquivalent = fobPriceJPY
    ? Math.round(Number(fobPriceJPY) * JPY_TO_NZD_EXCHANGE_RATE)
    : 0;

  // Computed live catalogue preview variables
  const hasTitleDetails = Boolean(model.trim() || year);
  const specTokens = [grade.trim(), transmission.trim(), driveType, color.trim(), engineCc ? `${engineCc}cc` : ""].filter(Boolean);

  const getModelDefaultImages = (modelName: string): string[] => {
    return getModelAngleImages(modelName);
  };

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
    const finalImages = images.length > 0 ? images : getModelDefaultImages(finalModel);
    const finalRef = stockReference.trim() || `USS-JAA-${finalStockId.slice(-4)}`;
    const parsedDefects = knownDefects
      ? knownDefects.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      : ["Clean pre-export inspection pass"];

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
      location: location.trim() || "Yokohama Export Terminal",
      images: finalImages,
      conditionReportUrl: "https://example.com/reports/yokohama_pass.pdf",
      conditionReportName: conditionReportName,
      supportingDocuments: uploadedDocs,
      knownDefects: parsedDefects.length > 0 ? parsedDefects : ["Clean pre-export inspection pass"],
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
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              document.getElementById("live-catalogue-preview")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="xl:hidden px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
            title="Jump to live catalogue preview"
          >
            <Eye className="w-3.5 h-3.5 text-slate-300" />
            <span>Live Preview</span>
          </button>
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
              Export unit <strong className="text-slate-800  font-bold">#{stockId || "NIS-NEW"}</strong> ({vinChassis}) is now saved into central programme inventory with status:{" "}
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
              <strong className="text-slate-900 ">{currency}</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FOB Price (JPY):</span>
              <strong className=" text-slate-900">¥{fobPriceJPY ? Number(fobPriceJPY).toLocaleString() : 0} JPY</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FOB Price (NZD Equivalent):</span>
              <strong className=" text-slate-900">${nzdEquivalent.toLocaleString()} NZD</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Images &amp; Documents Attached:</span>
              <strong className="text-slate-900">{images.length} Photos · {uploadedDocs.length} Docs</strong>
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
                setUploadedDocs([]);
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols on desktop, full width on iPad/tablet): Structured Form Sections A through E */}
          <form className="xl:col-span-8 space-y-6" onSubmit={(e) => handleSubmit(e)}>

            {/* ───────────────────────────────────────────────────────── */}
            {/* SECTION A. VEHICLE IDENTIFICATION                         */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Hash className="w-4 h-4 text-[#C3002F]" />
                  <span>A. Vehicle Identification</span>
                </div>
                <span className="text-[11px]  text-slate-500 font-medium">Section 1 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 block">Stock ID</label>
                    <span className="text-[10px]  text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                      Auto-Generated
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={stockId || nextSerialStockId}
                    className="w-full px-3.5 py-2 text-xs  font-normal bg-slate-100 rounded-xl border border-slate-200 text-slate-900 cursor-default select-all"
                  />
                  <span className="text-[11px] text-slate-500 block ">Sequential stock reference</span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Chassis / VIN *</label>
                  <input
                    type="text"
                    required
                    value={vinChassis}
                    onChange={(e) => setVinChassis(e.target.value.toUpperCase())}
                    placeholder="e.g. E12-123456"
                    className="w-full px-3.5 py-2 text-xs  font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                  <span className="text-[11px] text-slate-500 block">Mandatory Japanese chassis / VIN stamp</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Make</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-normal transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Note e-POWER, Leaf, Serena, X-Trail"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-normal placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Variant / Trim</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. X, Nismo, Highway Star"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Model Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="e.g. 2023"
                    className="w-full px-3.5 py-2 text-xs  font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Odometer Reading (km) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={0}
                      value={odometerKm}
                      onChange={(e) => setOdometerKm(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                      placeholder="e.g. 28400"
                      className="w-full pl-3.5 pr-20 py-2 text-xs  font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]  font-semibold text-slate-500">
                      km (JEVIC)
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Transmission</label>
                  <input
                    type="text"
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value)}
                    placeholder="e.g. Automatic, e-Power Drive"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-normal placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Exterior Colour</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Pearl White, Brilliant Silver"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Powertrain / Fuel</label>
                  <input
                    type="text"
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value)}
                    placeholder="e.g. e-Power, Petrol, 100% Electric"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-normal placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Drive System</label>
                  <select
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-normal cursor-pointer transition-colors"
                  >
                    <option value="2WD">2WD (Front/Rear Wheel)</option>
                    <option value="4WD">4WD (Intelligent All-Wheel)</option>
                    <option value="e-4ORCE AWD">e-4ORCE AWD (Dual Motor)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Engine Capacity (cc)</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={engineCc}
                    onChange={(e) => setEngineCc(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="e.g. 1200"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-mono transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-3">
                  <label className="text-xs font-bold text-slate-800 block">Japanese Yard / Staging Terminal</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-normal cursor-pointer transition-colors"
                  >
                    <option value="Yokohama Export Terminal">Yokohama Export Terminal (Bay 14 Marshalling Base)</option>
                    <option value="Yokohama Yard (Bay 1)">Yokohama Yard (Bay 1)</option>
                    <option value="Yokohama Yard (Bay 2)">Yokohama Yard (Bay 2)</option>
                    <option value="Yokohama Yard (Bay 3)">Yokohama Yard (Bay 3)</option>
                    <option value="Kobe Export Terminal">Kobe Export Terminal</option>
                    <option value="Nagoya Port Terminal">Nagoya Port Terminal</option>
                    <option value="Osaka Marshalling Terminal">Osaka Marshalling Terminal</option>
                  </select>
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
                <span className="text-[11px]  text-slate-500 font-medium">Section 2 of 5</span>
              </div>

              {/* Overall Vehicle Condition / Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Overall Vehicle Condition / Grade</label>
                <select
                  value={overallCondition}
                  onChange={(e) => setOverallCondition(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
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
                  <label className="text-xs font-bold text-slate-800 block">Auction Grade</label>
                  <select
                    value={auctionGrade}
                    onChange={(e) => setAuctionGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs  font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
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
                  <label className="text-xs font-bold text-slate-800 block">Interior Grade</label>
                  <select
                    value={interiorGrade}
                    onChange={(e) => setInteriorGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="A">Grade A (Immaculate)</option>
                    <option value="B">Grade B (Normal Wear)</option>
                    <option value="C">Grade C (Wear / Marks)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Exterior Grade</label>
                  <select
                    value={exteriorGrade}
                    onChange={(e) => setExteriorGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="A">Grade A (Factory Clean)</option>
                    <option value="B">Grade B (Minor Blemishes)</option>
                    <option value="C">Grade C (Scratches/Dents)</option>
                  </select>
                </div>
              </div>

              {/* Known Defects */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-800 block">Known Defects &amp; Inspection Remarks</label>
                <textarea
                  rows={2}
                  value={knownDefects}
                  onChange={(e) => setKnownDefects(e.target.value)}
                  placeholder="Record any minor panel scratches, wear, or note verified clean inspection pass..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                />
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
                <span className="text-[11px]  text-slate-500 font-medium">Section 3 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Acquisition Price (JPY) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs  font-bold text-slate-500">
                      ¥
                    </span>
                    <input
                      type="number"
                      required
                      min={0}
                      step={10000}
                      value={fobPriceJPY}
                      onChange={(e) => setFobPriceJPY(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                      placeholder="e.g. 1850000"
                      className="w-full pl-8 pr-3.5 py-2 text-xs  font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 block ">Japanese purchase price baseline</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Pricing Terms Basis</label>
                  <select
                    value={purchasePriceBasis}
                    onChange={(e) => setPurchasePriceBasis(e.target.value as "FOB" | "CIF" | "EXW")}
                    className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="FOB">FOB (Free On Board)</option>
                    <option value="CIF">CIF (Cost, Ins., Freight)</option>
                    <option value="EXW">EXW (Ex-Works / Yard)</option>
                  </select>
                  <span className="text-[11px] text-slate-500 block">Incoterm contract basis</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Indicative Base (NZD)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs  font-bold text-slate-500">
                      $
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={fobPriceJPY ? `${nzdEquivalent.toLocaleString()} NZD` : "— NZD"}
                      className="w-full pl-8 pr-3.5 py-2 text-xs  font-bold bg-slate-100 rounded-xl border border-slate-200 text-slate-800 focus:outline-none cursor-default"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 ">
                    Official rate: 0.01085
                  </span>
                </div>
              </div>
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* SECTION D. IMAGES AND DOCUMENTS                           */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <ImageIcon className="w-4 h-4 text-slate-700" />
                  <span>Images &amp; Supporting Documents</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-medium">Section 4 of 5</span>
              </div>

              {/* Parallel 2-Column Grid for Both File Inputs in One Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* ─────────────────────────────────────────────────────── */}
                {/* COLUMN 1: VEHICLE IMAGES                                */}
                {/* ─────────────────────────────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold shrink-0">
                        Images
                      </span>
                      <label className="text-xs font-bold text-slate-800 truncate">
                        Vehicle Photographs ({images.length})
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">PNG, JPG, WEBP</span>
                  </div>

                  {/* Drag & Drop Multi-Image Dropzone */}
                  <div
                    onDragOver={handleImageDragOver}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                    onClick={() => imageInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${isDraggingImage
                        ? "border-slate-900 bg-slate-100 ring-2 ring-slate-900/10"
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
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-600 shadow-2xs">
                      <UploadCloud className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Drag &amp; drop vehicle images, or <span className="text-slate-950 underline underline-offset-2">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Angles, interior, dashboard, defects
                    </p>
                  </div>

                  {/* Thumbnail Gallery of Uploaded Photos */}
                  {images.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Uploaded Photos ({images.length})
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {images.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className={`relative aspect-[4/3] rounded-xl border overflow-hidden p-1 bg-slate-50 group ${idx === 0 ? "border-slate-900 ring-2 ring-slate-900/10" : "border-slate-200"
                              }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-full object-contain"
                            />
                            {idx === 0 && (
                              <span className="absolute top-1 left-1 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                                Main
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage(idx);
                              }}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-800 hover:bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs"
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

                {/* ─────────────────────────────────────────────────────── */}
                {/* COLUMN 2: SUPPORTING DOCUMENTS                         */}
                {/* ─────────────────────────────────────────────────────── */}
                <div className="space-y-3">
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold shrink-0">
                        Documents
                      </span>
                      <label className="text-xs font-bold text-slate-800 truncate">
                        Supporting Documents ({uploadedDocs.length})
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">PDF, DOC, DOCX</span>
                  </div>

                  {/* Drag & Drop Document Dropzone */}
                  <div
                    onDragOver={handleDocDragOver}
                    onDragLeave={handleDocDragLeave}
                    onDrop={handleDocDrop}
                    onClick={() => docInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${isDraggingDoc
                        ? "border-slate-900 bg-slate-100 ring-2 ring-slate-900/10"
                        : "border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50"
                      }`}
                  >
                    <input
                      ref={docInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,application/pdf"
                      onChange={handleDocFileInputChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-600 shadow-2xs">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Drag &amp; drop document files, or <span className="text-slate-950 underline underline-offset-2">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Auction sheets, JEVIC, MPI, MR2A dossiers
                    </p>
                  </div>

                  {/* Attached Documents List */}
                  {uploadedDocs.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Attached Documents ({uploadedDocs.length})
                      </span>
                      <div className="space-y-2">
                        {uploadedDocs.map((doc, dIdx) => (
                          <div
                            key={dIdx}
                            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5 hover:bg-slate-100/70 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-600 shadow-2xs">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-medium text-slate-900 truncate block">
                                  {doc.name}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                                  <span>{doc.size || "1.5 MB"}</span>
                                  <span>•</span>
                                  <span className="uppercase text-slate-600 font-sans font-medium">
                                    {doc.type.replace(/_/g, " ")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(dIdx)}
                              className="w-6 h-6 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
                              title="Remove document"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
                <span className="text-[11px]  text-slate-500 font-medium">Section 5 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Listing Status Dropdown: Initial entry can be Draft or Available */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Listing Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                    className="w-full px-3.5 py-2 text-xs font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="AVAILABLE">Available — Published to Programme Catalogue</option>
                    <option value="DRAFT">Draft — Inbound Japanese Yard Preparation</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Created Date</label>
                  <input
                    type="date"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs  font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Relevant Stock Reference</label>
                  <input
                    type="text"
                    value={stockReference}
                    onChange={(e) => setStockReference(e.target.value)}
                    placeholder="e.g. USS-Tokyo-Lot#4021"
                    className="w-full px-3.5 py-2 text-xs  font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                  <span className="text-[11px] text-slate-500 block">Japanese auction lot number or AutoHub reference</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Last Updated Date</label>
                  <input
                    type="text"
                    readOnly
                    value={new Date().toISOString().slice(0, 10)}
                    className="w-full px-3.5 py-2 text-xs  font-normal bg-slate-100 rounded-xl border border-slate-200 text-slate-700 cursor-default"
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
          {/* Right Column (4 cols on desktop, full width on iPad/tablet): Live Interactive Catalogue Preview */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div id="live-catalogue-preview" className="xl:col-span-4 space-y-4 xl:sticky xl:top-6">
            <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] uppercase font-bold tracking-wider text-slate-700">
                    Live Catalogue Preview
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="xl:hidden px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                  >
                    ↑ Top
                  </button>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${status === "AVAILABLE"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : status === "RESERVED"
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : status === "ALLOCATED"
                          ? "bg-sky-50 text-sky-800 border-sky-300"
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              {/* Responsive Container: on md: to <xl, side-by-side 2 cols; on xl, 1 col */}
              <div className="grid grid-cols-1 md:grid-cols-12 xl:grid-cols-1 gap-5 items-start">
                <div className="md:col-span-5 xl:col-span-12 space-y-2">
                  {/* Studio Car Photo Preview OR Default Blank Image */}
                  {images.length > 0 ? (
                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center p-4">
                      <div className="absolute bottom-3 w-4/5 h-4 bg-black/15 rounded-[50%] blur-md pointer-events-none transform scale-y-50" />
                      <img
                        src={images[activePreviewIdx] || images[0]}
                        alt={model || "Nissan Vehicle Preview"}
                        className="w-full h-full object-contain filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.12)] relative z-10 select-none transition-all duration-200"
                      />

                      <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-[11px] font-bold border border-slate-200/90 shadow-2xs flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Grade {auctionGrade || "—"}</span>
                      </div>

                      <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-slate-800 font-mono text-[10px] font-bold border border-slate-200/90 shadow-2xs">
                        {stockId ? `#${stockId}` : "#NEW-UNIT"}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="relative aspect-[16/10] w-full rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none"
                    >
                      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-white text-slate-700 font-mono text-[11px] font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Grade {auctionGrade || "—"}</span>
                      </div>

                      <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-white text-slate-700 font-mono text-[10px] font-semibold border border-slate-200 shadow-2xs">
                        {stockId ? `#${stockId}` : "#NEW-UNIT"}
                      </div>

                      {/* Centered Placeholder Graphic */}
                      <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-slate-400 mb-2.5">
                        <Car className="w-7 h-7 stroke-[1.5]" />
                      </div>

                      <span className="text-xs font-bold text-slate-800 block">
                        No Vehicle Photograph Added
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block max-w-[210px] leading-tight">
                        Vehicle preview will appear here when photos are added in Section D
                      </span>
                    </div>
                  )}

                  {/* Interactive Thumbnail Angles Switcher in Live Preview */}
                  {images.length > 1 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
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
                </div>

                <div className="md:col-span-7 xl:col-span-12 space-y-3">
                  {/* Vehicle Title & Specifications */}
                  <div className="space-y-1.5">
                    {hasTitleDetails ? (
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight leading-snug">
                        {year ? `${year} ` : ""}{make || "Nissan"} {model || "Vehicle"}
                      </h3>
                    ) : (
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-base text-slate-400 tracking-tight leading-snug italic">
                          {make || "Nissan"} Vehicle Model &amp; Year Pending
                        </h3>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Fill Model &amp; Year in Section A to update
                        </span>
                      </div>
                    )}

                    {specTokens.length > 0 ? (
                      <p className="text-xs text-slate-700 font-medium">
                        {specTokens.join(" · ")}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Trim · Transmission · Exterior Colour pending
                      </p>
                    )}

                    <div className="pt-0.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
                        <span className="truncate">{overallCondition}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4-Stat Mini Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 text-xs">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Odometer
                      </span>
                      {odometerKm !== "" && Number(odometerKm) >= 0 ? (
                        <strong className="text-slate-900 font-mono text-xs font-bold block truncate">
                          {Number(odometerKm).toLocaleString()} {odometerUnit}
                        </strong>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs block">
                          — km (Pending)
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Currency
                      </span>
                      <strong className="text-slate-900 font-mono text-xs font-bold block truncate">
                        {currency}
                      </strong>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Transmission
                      </span>
                      {transmission ? (
                        <span className="text-slate-900 text-xs font-medium block truncate">
                          {transmission}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic block">
                          —
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Photos / Docs
                      </span>
                      <span className="text-slate-700 text-xs font-medium block truncate">
                        {images.length > 0 || uploadedDocs.length > 0 ? (
                          <strong className="text-slate-900 font-semibold">{images.length} photos · {uploadedDocs.length} docs</strong>
                        ) : (
                          <span className="text-slate-400">0 photos · 0 docs</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Parallel FOB Pricing (JPY & NZD) */}
                  <div className="pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        FOB Price (JPY)
                      </span>
                      {fobPriceJPY ? (
                        <span className="text-xl font-black text-slate-950 font-mono tracking-tight block truncate">
                          ¥{Number(fobPriceJPY).toLocaleString()}
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="text-lg font-bold text-slate-400 font-mono block">
                            ¥ —
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Awaiting pricing
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5 sm:text-right min-w-0">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        FOB Price (NZD)
                      </span>
                      {fobPriceJPY ? (
                        <span className="text-xl font-black text-slate-950 font-mono tracking-tight block truncate">
                          ${nzdEquivalent.toLocaleString()}{" "}
                          <span className="text-xs font-bold text-slate-500 font-sans">
                            NZD
                          </span>
                        </span>
                      ) : (
                        <div className="space-y-0.5 sm:text-right">
                          <span className="text-lg font-bold text-slate-400 font-mono block">
                            $ — NZD
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Rate: 0.01085
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {stockReference && (
                    <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-200/80 flex items-center justify-between">
                      <span>Reference:</span>
                      <strong className="text-slate-800 font-semibold truncate ml-2">{stockReference}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-slate-900">JEVIC &amp; Export Verification</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Saving this record associates all uploaded photographs, USS condition reports, and JEVIC certificates directly with stock{" "}
                <span className=" font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                  #{stockId || "NIS-NEW"}
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
