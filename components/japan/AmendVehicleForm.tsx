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
  Edit3,
  AlertCircle,
} from "lucide-react";

interface AmendVehicleFormProps {
  vehicleId: string;
  onSuccessReturn: () => void;
  onViewDetails?: (vehicleId: string) => void;
}

export default function AmendVehicleForm({
  vehicleId,
  onSuccessReturn,
  onViewDetails,
}: AmendVehicleFormProps) {
  const { vehicles, updateVehicle } = useProgramme();

  // Find vehicle by ID or stockId
  const vehicle = useMemo(() => {
    return vehicles.find((v) => v.id === vehicleId || v.stockId === vehicleId);
  }, [vehicles, vehicleId]);

  // ───────────────────────────────────────────────────────────
  // A. Vehicle Identification State
  // ───────────────────────────────────────────────────────────
  const [stockId, setStockId] = useState(vehicle?.stockId || "");
  const [vinChassis, setVinChassis] = useState(vehicle?.vinChassis || "");
  const [make, setMake] = useState(vehicle?.make || "Nissan");
  const [model, setModel] = useState(vehicle?.model || "");
  const [grade, setGrade] = useState(vehicle?.grade || "");
  const [year, setYear] = useState<number | "">(vehicle?.year ?? "");
  const [odometerKm, setOdometerKm] = useState<number | "">(vehicle?.odometerKm ?? "");
  const [odometerUnit, setOdometerUnit] = useState<"km" | "mi">(vehicle?.odometerUnit || "km");
  const [transmission, setTransmission] = useState(vehicle?.transmission || "e-Power Drive");
  const [color, setColor] = useState(vehicle?.color || "Pearl White");
  const [fuelType, setFuelType] = useState(vehicle?.fuelType || "e-Power");
  const [driveType, setDriveType] = useState(vehicle?.driveType || "2WD");
  const [engineCc, setEngineCc] = useState<number | "">(vehicle?.engineCc ?? 1200);
  const [location, setLocation] = useState(vehicle?.location || "Yokohama Export Terminal");

  // ───────────────────────────────────────────────────────────
  // B. Vehicle Condition State
  // ───────────────────────────────────────────────────────────
  const [overallCondition, setOverallCondition] = useState(
    vehicle?.overallCondition || "★ 4.5 - Excellent Clean Japanese Condition"
  );
  const [auctionGrade, setAuctionGrade] = useState(vehicle?.auctionGrade || "4.5");
  const [interiorGrade, setInteriorGrade] = useState(vehicle?.interiorGrade || "A");
  const [exteriorGrade, setExteriorGrade] = useState(vehicle?.exteriorGrade || "A");
  const [conditionSummary, setConditionSummary] = useState(vehicle?.conditionSummary || "");
  const [knownDefects, setKnownDefects] = useState(vehicle?.knownDefects?.join("\n") || "");

  // ───────────────────────────────────────────────────────────
  // C. Vehicle Pricing Inputs State
  // ───────────────────────────────────────────────────────────
  const [fobPriceJPY, setFobPriceJPY] = useState<number | "">(vehicle?.fobPriceJPY ?? "");
  const [currency, setCurrency] = useState<"JPY" | "NZD" | "USD">(vehicle?.currency || "JPY");
  const [purchasePriceBasis, setPurchasePriceBasis] = useState<"FOB" | "CIF" | "EXW">(
    vehicle?.purchasePriceBasis || "FOB"
  );

  // ───────────────────────────────────────────────────────────
  // D. Images & Documents State
  // ───────────────────────────────────────────────────────────
  const [images, setImages] = useState<string[]>(vehicle?.images || []);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [uploadedDocs, setUploadedDocs] = useState<VehicleSupportingDoc[]>(
    vehicle?.supportingDocuments || [
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
    ]
  );

  // Drag and drop state for images
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Drag and drop state for supporting documents
  const [isDraggingDoc, setIsDraggingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // ───────────────────────────────────────────────────────────
  // E. Listing Information State
  // ───────────────────────────────────────────────────────────
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status || "AVAILABLE");
  const [createdAt, setCreatedAt] = useState(vehicle?.createdAt || new Date().toISOString().slice(0, 10));
  const [stockReference, setStockReference] = useState(vehicle?.stockReference || "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Sync state if vehicle changes
  useEffect(() => {
    if (vehicle) {
      setStockId(vehicle.stockId);
      setVinChassis(vehicle.vinChassis);
      setMake(vehicle.make || "Nissan");
      setModel(vehicle.model);
      setGrade(vehicle.grade || "");
      setYear(vehicle.year);
      setOdometerKm(vehicle.odometerKm);
      setOdometerUnit(vehicle.odometerUnit || "km");
      setTransmission(vehicle.transmission || "Automatic");
      setColor(vehicle.color || "Pearl White");
      setFuelType(vehicle.fuelType || "e-Power");
      setDriveType(vehicle.driveType || "2WD");
      setEngineCc(vehicle.engineCc ?? 1200);
      setLocation(vehicle.location || "Yokohama Export Terminal");
      setOverallCondition(vehicle.overallCondition || "★ 4.5 - Excellent Clean Japanese Condition");
      setAuctionGrade(vehicle.auctionGrade || "4.5");
      setInteriorGrade(vehicle.interiorGrade || "A");
      setExteriorGrade(vehicle.exteriorGrade || "A");
      setConditionSummary(vehicle.conditionSummary || "");
      setKnownDefects(vehicle.knownDefects?.join("\n") || "");
      setFobPriceJPY(vehicle.fobPriceJPY);
      setCurrency(vehicle.currency || "JPY");
      setPurchasePriceBasis(vehicle.purchasePriceBasis || "FOB");
      setImages(vehicle.images || []);
      if (vehicle.supportingDocuments && vehicle.supportingDocuments.length > 0) {
        setUploadedDocs(vehicle.supportingDocuments);
      }
      setStatus(vehicle.status || "AVAILABLE");
      setCreatedAt(vehicle.createdAt || new Date().toISOString().slice(0, 10));
      setStockReference(vehicle.stockReference || "");
    }
  }, [vehicle]);

  // Multi-Photo Handlers
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

  // Supporting Documents Upload Handlers
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

  // Computed preview variables
  const hasTitleDetails = model.trim().length > 0;
  const specTokens = [
    grade || "",
    fuelType || "",
    transmission || "",
    color || "",
  ].filter(Boolean);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent, overrideStatus?: VehicleStatus) => {
    e.preventDefault();
    if (!vehicle) return;

    if (!vinChassis.trim()) {
      alert("Please specify a valid Japanese Chassis / VIN.");
      return;
    }
    if (!model.trim()) {
      alert("Please specify a vehicle Model designation.");
      return;
    }

    setIsSubmitting(true);
    audio.playSubtleClick();

    const targetStatus = overrideStatus || status;
    const parsedDefects = knownDefects
      .split("\n")
      .map((d) => d.trim())
      .filter(Boolean);

    const updatedData: Partial<Vehicle> = {
      vinChassis: vinChassis.trim().toUpperCase(),
      make: make.trim() || "Nissan",
      model: model.trim(),
      grade: grade.trim(),
      year: Number(year) || 2023,
      odometerKm: Number(odometerKm) || 0,
      odometerUnit,
      transmission: transmission as Vehicle["transmission"],
      color: color.trim() || "Pearl White",
      fuelType: fuelType as Vehicle["fuelType"],
      driveType: driveType as Vehicle["driveType"],
      engineCc: Number(engineCc) || 1200,
      location,
      overallCondition,
      auctionGrade,
      interiorGrade,
      exteriorGrade,
      conditionSummary: conditionSummary.trim(),
      knownDefects: parsedDefects.length > 0 ? parsedDefects : ["Clean pass verified"],
      fobPriceJPY: Number(fobPriceJPY) || 0,
      currency,
      purchasePriceBasis,
      images,
      supportingDocuments: uploadedDocs,
      status: targetStatus,
      stockReference: stockReference.trim(),
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    updateVehicle(vehicle.id, updatedData);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      audio.playSuccessChime();
    }, 400);
  };

  if (!vehicle) {
    return (
      <div className="bg-white rounded-[16px] border border-slate-200 p-8 sm:p-12 text-center space-y-4 max-w-lg mx-auto my-12 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Vehicle Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested export vehicle unit could not be located in central inventory.
        </p>
        <button
          type="button"
          onClick={onSuccessReturn}
          className="btn-outline text-xs py-2 px-4 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Inventory</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-8xl mx-auto animate-in fade-in duration-300 font-sans pb-12">
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
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                Amend Vehicle Specifications
              </h1>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-bold border border-slate-200">
                #{vehicle.stockId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Central Fleet Catalogue Management · VIN:{" "}
              <span className="font-mono font-semibold text-slate-700">{vehicle.vinChassis}</span>
            </p>
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
              Vehicle Amendments Saved Successfully
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Export unit <strong className="text-slate-800 font-bold">#{stockId}</strong> ({vinChassis}) has been updated in the central catalogue with status:{" "}
              <span className="font-bold text-emerald-700">{status}</span>.
            </p>
          </div>

          {/* Snapshot Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Model &amp; Year:</span>
              <strong className="text-slate-900">
                {year || "—"} {make} {model || "Vehicle"} ({grade || "Standard"})
              </strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Auction Grade &amp; Odo:</span>
              <strong className="text-slate-900">
                Grade {auctionGrade || "—"} · {odometerKm ? Number(odometerKm).toLocaleString() : 0} {odometerUnit}
              </strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Currency:</span>
              <strong className="text-slate-900">{currency}</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FOB Price (JPY):</span>
              <strong className="text-slate-900">¥{fobPriceJPY ? Number(fobPriceJPY).toLocaleString() : 0} JPY</strong>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">FOB Price (NZD Equivalent):</span>
              <strong className="text-slate-900">${nzdEquivalent.toLocaleString()} NZD</strong>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500">Images &amp; Documents Attached:</span>
              <strong className="text-slate-900">
                {images.length} Photos · {uploadedDocs.length} Docs
              </strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setIsSuccess(false);
              }}
              className="btn-outline w-full sm:w-auto text-xs py-2.5 px-4 cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-slate-400" />
              <span>Continue Editing</span>
            </button>

            {onViewDetails && (
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  onViewDetails(vehicle.id);
                }}
                className="btn-outline w-full sm:w-auto text-xs py-2.5 px-4 cursor-pointer"
              >
                <Eye className="w-4 h-4 text-slate-400" />
                <span>View Vehicle Details</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onSuccessReturn();
              }}
              className="py-2.5 px-6 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto active:scale-[0.98]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Inventory</span>
            </button>
          </div>
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────── */
        /* Main Two-Column Layout                                      */
        /* ─────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column (8 cols): Interactive Amendment Form */}
          <form onSubmit={handleSubmit} className="xl:col-span-8 space-y-6">

            {/* ───────────────────────────────────────────────────────── */}
            {/* SECTION A. VEHICLE IDENTIFICATION                         */}
            {/* ───────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                  <Hash className="w-4 h-4 text-[#C3002F]" />
                  <span>A. Vehicle Identification</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Section 1 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 block">Stock ID</label>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                      Central Unit
                    </span>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={stockId}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-100 rounded-xl border border-slate-200 text-slate-900 cursor-default select-all"
                  />
                  <span className="text-[11px] text-slate-500 block">Fixed catalogue stock reference</span>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Chassis / VIN *</label>
                  <input
                    type="text"
                    required
                    value={vinChassis}
                    onChange={(e) => setVinChassis(e.target.value.toUpperCase())}
                    placeholder="e.g. E12-123456"
                    className="w-full px-3.5 py-2 text-xs font-mono font-semibold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
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
                  <label className="text-xs font-bold text-slate-800 block">Model Designation *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Note e-POWER, Leaf, Serena, X-Trail"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-semibold placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Variant / Trim / Grade</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g. Medalist, Nismo, Highway Star"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Model Year *</label>
                  <input
                    type="number"
                    required
                    min={2015}
                    max={2026}
                    value={year}
                    onChange={(e) => setYear(e.target.value === "" ? "" : parseInt(e.target.value) || 0)}
                    placeholder="e.g. 2023"
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
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
                      className="w-full pl-3.5 pr-20 py-2 text-xs font-mono font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      km (JEVIC)
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Transmission</label>
                  <select
                    value={transmission}
                    onChange={(e) => setTransmission(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium cursor-pointer transition-colors"
                  >
                    <option value="Automatic">Automatic Transmission</option>
                    <option value="e-Power Drive">e-Power Drive (One-Pedal)</option>
                    <option value="CVT">CVT Continuously Variable</option>
                    <option value="Manual">Manual Shift</option>
                  </select>
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
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium cursor-pointer transition-colors"
                  >
                    <option value="e-Power">e-Power (Electric Generator)</option>
                    <option value="100% Electric">100% Electric (EV Zero Emission)</option>
                    <option value="Hybrid">Hybrid Powertrain</option>
                    <option value="Petrol">Petrol Internal Combustion</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Drive System</label>
                  <select
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium cursor-pointer transition-colors"
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
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] font-medium cursor-pointer transition-colors"
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
                    <option value="Osaka Marshalling Terminal">Osaka Marshalling Terminal</option>
                    <option value="Port of Auckland Delivery Yard">Port of Auckland Delivery Yard</option>
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
                  <span>B. Vehicle Condition &amp; Inspection Assessment</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Section 2 of 5</span>
              </div>

              {/* Overall Vehicle Condition */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Overall Condition Assessment</label>
                <select
                  value={overallCondition}
                  onChange={(e) => setOverallCondition(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
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
                    className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
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
                  <label className="text-xs font-bold text-slate-800 block">Interior Grade</label>
                  <select
                    value={interiorGrade}
                    onChange={(e) => setInteriorGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="A">Grade A (Immaculate Showroom)</option>
                    <option value="B">Grade B (Normal Commuter Wear)</option>
                    <option value="C">Grade C (Visible Blemishes / Marks)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Exterior Grade</label>
                  <select
                    value={exteriorGrade}
                    onChange={(e) => setExteriorGrade(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="A">Grade A (Factory Clean)</option>
                    <option value="B">Grade B (Minor Blemishes)</option>
                    <option value="C">Grade C (Scratches / Dents)</option>
                  </select>
                </div>
              </div>

              {/* Condition Summary */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-800 block">Condition Summary Dossier</label>
                <textarea
                  rows={2}
                  value={conditionSummary}
                  onChange={(e) => setConditionSummary(e.target.value)}
                  placeholder="Provide overview of overall vehicle condition, body integrity, and inspection notes..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                />
              </div>

              {/* Known Defects */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    Recorded Defect Items / Inspection Markings
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">One item per line</span>
                </div>
                <textarea
                  rows={2}
                  value={knownDefects}
                  onChange={(e) => setKnownDefects(e.target.value)}
                  placeholder="e.g. Minor stone chip on lower front bumper (A1)&#10;Factory alloys in immaculate condition"
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
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
                  <span>C. Commercial Pricing &amp; Yard Logistics</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Section 3 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Acquisition Price (JPY) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
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
                      className="w-full pl-8 pr-3.5 py-2 text-xs font-bold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 block">Baseline raw acquisition cost at export terminal</span>
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
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                      $
                    </span>
                    <input
                      type="text"
                      readOnly
                      value={fobPriceJPY ? `${nzdEquivalent.toLocaleString()} NZD` : "— NZD"}
                      className="w-full pl-8 pr-3.5 py-2 text-xs font-bold bg-slate-100 rounded-xl border border-slate-200 text-slate-800 focus:outline-none cursor-default"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Official rate: {JPY_TO_NZD_EXCHANGE_RATE}
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

              {/* Parallel 2-Column Grid for Both File Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* COLUMN 1: VEHICLE IMAGES */}
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
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {images.map((img, idx) => (
                          <div
                            key={idx}
                            className={`group relative aspect-[4/3] rounded-xl overflow-hidden border transition-all ${activePreviewIdx === idx
                              ? "border-slate-900 ring-2 ring-slate-900/20"
                              : "border-slate-200 hover:border-slate-300"
                              }`}
                          >
                            <img
                              src={img}
                              alt={`Car angle ${idx + 1}`}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => {
                                audio.playSubtleClick();
                                setActivePreviewIdx(idx);
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-md bg-white/90 hover:bg-rose-600 text-slate-600 hover:text-white transition-colors flex items-center justify-center shadow-xs cursor-pointer opacity-80 group-hover:opacity-100"
                              title="Delete photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white font-mono text-[9px] font-bold leading-none">
                                Primary
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* COLUMN 2: SUPPORTING DOCUMENTS */}
                <div className="space-y-3">
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold shrink-0">
                        Documents
                      </span>
                      <label className="text-xs font-bold text-slate-800 truncate">
                        Inspection Dossiers ({uploadedDocs.length})
                      </label>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">PDF, DOC, DOCX</span>
                  </div>

                  {/* Drag & Drop Documents Dropzone */}
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
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleDocFileInputChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-2 text-slate-600 shadow-2xs">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Drag &amp; drop inspection files, or <span className="text-slate-950 underline underline-offset-2">browse files</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Auction sheets, JEVIC certificates, MR2A
                    </p>
                  </div>

                  {/* List of Attached Documents */}
                  {uploadedDocs.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Attached Documents ({uploadedDocs.length})
                      </span>
                      <div className="space-y-1.5">
                        {uploadedDocs.map((doc, dIdx) => (
                          <div
                            key={dIdx}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
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
                  <span>E. Listing &amp; Publication Status</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Section 5 of 5</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Listing Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                    className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] cursor-pointer transition-colors"
                  >
                    <option value="AVAILABLE">Available — Published to Programme Catalogue</option>
                    <option value="DRAFT">Draft — Inbound Japanese Yard Preparation</option>
                    <option value="RESERVED">Reserved — Held by Franchise Dealer</option>
                    <option value="ALLOCATED">Allocated — Confirmed Order In Transit</option>
                    <option value="WITHDRAWN">Withdrawn — Delisted from Catalogue</option>
                    <option value="SOLD">Sold — Delivered to NZ Dealer Network</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Created Date</label>
                  <input
                    type="date"
                    value={createdAt}
                    onChange={(e) => setCreatedAt(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] transition-colors"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-800 block">Relevant Stock Reference</label>
                  <input
                    type="text"
                    value={stockReference}
                    onChange={(e) => setStockReference(e.target.value)}
                    placeholder="e.g. USS-Tokyo-Lot#4021"
                    className="w-full px-3.5 py-2 text-xs font-normal bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0A0A0A]/10 focus:border-[#0A0A0A] placeholder-slate-400 transition-colors"
                  />
                  <span className="text-[11px] text-slate-500 block">Japanese auction lot number or AutoHub reference</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">Last Updated Date</label>
                  <input
                    type="text"
                    readOnly
                    value={new Date().toISOString().slice(0, 10)}
                    className="w-full px-3.5 py-2 text-xs font-normal bg-slate-100 rounded-xl border border-slate-200 text-slate-700 cursor-default"
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
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Save &amp; Apply Amendments</span>
                </button>
              </div>
            </div>
          </form>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* Right Column: Live Interactive Catalogue Preview            */}
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
                          : status === "SOLD"
                            ? "bg-purple-50 text-purple-800 border-purple-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              {/* Responsive Container */}
              <div className="grid grid-cols-1 md:grid-cols-12 xl:grid-cols-1 gap-5 items-start">
                <div className="md:col-span-5 xl:col-span-12 space-y-2">
                  {/* Studio Car Photo Preview */}
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
                        #{stockId}
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-[16/10] w-full rounded-2xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center select-none">
                      <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-white text-slate-700 font-mono text-[11px] font-semibold border border-slate-200 shadow-2xs flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>Grade {auctionGrade || "—"}</span>
                      </div>

                      <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-white text-slate-700 font-mono text-[10px] font-semibold border border-slate-200 shadow-2xs">
                        #{stockId}
                      </div>

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

                  {/* Interactive Thumbnail Angles Switcher */}
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
                            Rate: {JPY_TO_NZD_EXCHANGE_RATE}
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
                Amending this record updates all associated catalogue specifications, USS condition reports, and pricing baseline for unit{" "}
                <span className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">
                  #{stockId}
                </span>{" "}
                across both franchise dealer listings and central audit trails.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
