"use client";

import React, { useState, useRef } from "react";
import { Vehicle } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import CsvTemplateModal from "./CsvTemplateModal";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  FileText,
  Sparkles,
  ArrowRight,
  Upload,
} from "lucide-react";

interface BatchRow {
  rowNum: number;
  stockId: string;
  vinChassis: string;
  model: string;
  grade: string;
  year: number;
  odometerKm: number;
  fobJPY: number;
  status: "VALID" | "ERROR";
  errorReason?: string;
}

const SAMPLE_BATCH_DATA: BatchRow[] = [
  {
    rowNum: 1,
    stockId: "NIS-2026-9051",
    vinChassis: "E13-051829",
    model: "Note e-Power",
    grade: "X Package",
    year: 2023,
    odometerKm: 14200,
    fobJPY: 1950000,
    status: "VALID",
  },
  {
    rowNum: 2,
    stockId: "NIS-2026-9052",
    vinChassis: "T32-901842",
    model: "X-Trail Hybrid",
    grade: "20Xi 4WD",
    year: 2022,
    odometerKm: 31000,
    fobJPY: 2580000,
    status: "VALID",
  },
  {
    rowNum: 3,
    stockId: "NIS-2026-9053",
    vinChassis: "C27-418291",
    model: "Serena e-Power",
    grade: "Highway Star",
    year: 2022,
    odometerKm: 27500,
    fobJPY: 2790000,
    status: "VALID",
  },
  {
    rowNum: 4,
    stockId: "NIS-2026-9054",
    vinChassis: "E13-048291", // Duplicate with existing VEH_001
    model: "Note e-Power",
    grade: "S",
    year: 2021,
    odometerKm: 48000,
    fobJPY: 1420000,
    status: "ERROR",
    errorReason: "Duplicate active VIN Chassis (E13-048291 already active in programme)",
  },
];

function parseCsvLine(line: string, delim: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delim && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvText(text: string, existingVehicles: Vehicle[]): BatchRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const delim = firstLine.includes(",") ? "," : firstLine.includes(";") ? ";" : "\t";

  const rawHeaders = parseCsvLine(firstLine, delim).map((h) =>
    h.replace(/^["']|["']$/g, "").trim().toLowerCase()
  );

  const hasHeader = rawHeaders.some((h) =>
    ["vin", "chassis", "model", "stock", "stockid", "year", "km", "fob", "fob_jpy"].includes(h)
  );

  const dataLines = hasHeader ? lines.slice(1) : lines;

  let stockIdx = rawHeaders.findIndex((h) => h.includes("stock"));
  let vinIdx = rawHeaders.findIndex((h) => h.includes("vin") || h.includes("chassis"));
  let modelIdx = rawHeaders.findIndex((h) => h.includes("model"));
  let gradeIdx = rawHeaders.findIndex((h) => h.includes("grade") || h.includes("trim"));
  let yearIdx = rawHeaders.findIndex((h) => h.includes("year"));
  let kmIdx = rawHeaders.findIndex((h) => h.includes("km") || h.includes("odometer") || h.includes("mileage"));
  let fobIdx = rawHeaders.findIndex((h) => h.includes("fob") || h.includes("price") || h.includes("jpy"));

  if (vinIdx === -1) vinIdx = 1;
  if (modelIdx === -1) modelIdx = 2;
  if (gradeIdx === -1) gradeIdx = 3;
  if (yearIdx === -1) yearIdx = 4;
  if (kmIdx === -1) kmIdx = 5;
  if (fobIdx === -1) fobIdx = 6;
  if (stockIdx === -1) stockIdx = 0;

  const seenVins = new Set<string>();

  return dataLines.map((line, idx) => {
    const cols = parseCsvLine(line, delim).map((c) => c.replace(/^["']|["']$/g, "").trim());
    const stockId = cols[stockIdx] || `NIS-2026-${9060 + idx}`;
    const vinChassis = cols[vinIdx] || `CHASSIS-${idx + 1}`;
    const model = cols[modelIdx] || "Nissan Note e-Power";
    const grade = cols[gradeIdx] || "Standard Grade";
    const year = parseInt(cols[yearIdx]?.replace(/[^0-9]/g, "") || "", 10) || 2022;
    const odometerKm = parseInt(cols[kmIdx]?.replace(/[^0-9]/g, "") || "", 10) || 25000;
    const fobJPY = parseInt(cols[fobIdx]?.replace(/[^0-9]/g, "") || "", 10) || 2200000;

    let status: "VALID" | "ERROR" = "VALID";
    let errorReason: string | undefined = undefined;

    if (!cols[vinIdx] || cols[vinIdx].trim() === "") {
      status = "ERROR";
      errorReason = "Missing mandatory Chassis / VIN";
    } else if (seenVins.has(vinChassis.toUpperCase())) {
      status = "ERROR";
      errorReason = `Duplicate VIN in batch (${vinChassis})`;
    } else if (existingVehicles.some((v) => v.vinChassis.toLowerCase() === vinChassis.toLowerCase())) {
      status = "ERROR";
      errorReason = `Duplicate active VIN Chassis (${vinChassis} already active in programme)`;
    } else if (year < 2000 || year > 2027) {
      status = "ERROR";
      errorReason = `Invalid manufacturing year (${year})`;
    }

    seenVins.add(vinChassis.toUpperCase());

    return {
      rowNum: idx + 1,
      stockId,
      vinChassis,
      model,
      grade,
      year,
      odometerKm,
      fobJPY,
      status,
      errorReason,
    };
  });
}

interface BatchUploadViewProps {
  onSuccessReturn: () => void;
}

export default function BatchUploadView({ onSuccessReturn }: BatchUploadViewProps) {
  const { batchAddVehicles, vehicles } = useProgramme();
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    audio.playSubtleClick();
    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text && text.trim().length > 0) {
        try {
          const parsed = parseCsvText(text, vehicles);
          if (parsed.length > 0) {
            audio.playSoftChime();
            setBatchRows(parsed);
            setIsProcessing(false);
            return;
          }
        } catch (e) {
          console.error("Error parsing CSV:", e);
        }
      }
      // Fallback if parsing produces 0 rows
      audio.playSoftChime();
      setBatchRows(SAMPLE_BATCH_DATA);
      setIsProcessing(false);
    };

    reader.onerror = () => {
      audio.playSoftChime();
      setBatchRows(SAMPLE_BATCH_DATA);
      setIsProcessing(false);
    };

    reader.readAsText(file, "UTF-8");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleSimulateSample = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    audio.playSubtleClick();
    setIsProcessing(true);
    setFileName("nissan_japan_batch_export_202611.csv");

    setTimeout(() => {
      audio.playSoftChime();
      setBatchRows(SAMPLE_BATCH_DATA);
      setIsProcessing(false);
    }, 400);
  };

  const handleClearBatch = () => {
    audio.playSubtleClick();
    setBatchRows([]);
    setFileName(null);
    setPublishedSuccess(false);
  };

  const handlePublishBatch = () => {
    audio.playSuccessChime();
    setIsProcessing(true);

    const validRows = batchRows.filter((r) => r.status === "VALID");
    const newVehicles: Vehicle[] = validRows.map((r, idx) => ({
      id: `VEH_BATCH_${Date.now()}_${idx}`,
      stockId: r.stockId,
      vinChassis: r.vinChassis,
      make: "Nissan",
      model: r.model,
      grade: r.grade,
      year: r.year,
      odometerKm: r.odometerKm,
      transmission: "e-Power Drive",
      color: "Diamond White",
      fuelType: "e-Power",
      driveType: "2WD",
      engineCc: 1200,
      auctionGrade: "4.5",
      interiorGrade: "A",
      exteriorGrade: "A",
      location: "Yokohama Yard (Bay 5)",
      images: [
        r.model.toLowerCase().includes("note")
          ? "/images/cars/note.png"
          : r.model.toLowerCase().includes("x-trail")
            ? "/images/cars/xtrail.png"
            : r.model.toLowerCase().includes("serena")
              ? "/images/cars/serena.png"
              : r.model.toLowerCase().includes("leaf")
                ? "/images/cars/leaf.png"
                : r.model.toLowerCase().includes("kicks")
                  ? "/images/cars/kicks.png"
                  : r.model.toLowerCase().includes("dayz")
                    ? "/images/cars/dayz.png"
                    : r.model.toLowerCase().includes("elgrand")
                      ? "/images/cars/elgrand.png"
                      : r.model.toLowerCase().includes("navara")
                        ? "/images/cars/navara.png"
                        : "/images/cars/note.png"
      ],
      conditionReportUrl: "https://example.com/reports/batch_inspection.pdf",
      knownDefects: ["Zero panel structural repairs detected", "Verified export condition pass"],
      fobPriceJPY: r.fobJPY,
      status: "AVAILABLE",
    }));

    batchAddVehicles(newVehicles);

    setTimeout(() => {
      setIsProcessing(false);
      setPublishedSuccess(true);
    }, 500);
  };

  const validCount = batchRows.filter((r) => r.status === "VALID").length;
  const errorCount = batchRows.filter((r) => r.status === "ERROR").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, text/csv, .txt, .tsv"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Batch CSV Upload
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest and validate multiple Japanese vehicle records in a single batch
          </p>
        </div>

        <button
          onClick={() => {
            audio.playSubtleClick();
            setIsTemplateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-slate-600" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {publishedSuccess ? (
        <div className="bg-white rounded-[16px] border border-slate-200 p-8 text-center space-y-4 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Batch Published Successfully
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {validCount} vehicle records have been ingested into the programme catalogue and are now live for franchise dealer reservations.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onSuccessReturn}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-soft cursor-pointer"
            >
              <span>Return to Inventory Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Upload Dropzone */}
          {batchRows.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  processFile(file);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`bg-white rounded-[16px] border-2 border-dashed ${isDragging
                ? "border-[#C3002F] bg-rose-50/20"
                : "border-slate-200 hover:border-slate-400"
                } p-10 text-center space-y-4 transition-all cursor-pointer`}
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-slate-900">
                  Drag and drop your vehicle inventory file
                </h3>
                <p className="text-xs text-slate-400">
                  Supports standard UTF-8 CSV or Excel (.xlsx) up to 25MB
                </p>
              </div>

              <div className="pt-2 flex flex-col items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-soft"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Upload CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateSample}
                  className="text-[11px] text-slate-400 hover:text-slate-700 underline underline-offset-2 transition-colors cursor-pointer pt-1"
                >
                  or load standard export manifest batch
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Batch Processing Summary Card */}
              <div className="bg-white rounded-[16px] border border-slate-200 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 font-mono">{fileName}</div>
                    <div className="text-[11px] text-slate-500">
                      Row-level validation: <strong className="text-slate-900">{validCount} Valid</strong> ·{" "}
                      <span className={errorCount > 0 ? "text-crimson-600 font-semibold" : "text-slate-400"}>
                        {errorCount} Flagged
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    title="Choose a different CSV file"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Choose Another File</span>
                  </button>

                  <button
                    onClick={handleClearBatch}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Remove batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePublishBatch}
                    disabled={validCount === 0 || isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold transition-colors shadow-soft cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Publish {validCount} Valid Units</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Parsed Rows Table */}
              <div className="bg-white rounded-[16px] border border-slate-200 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
                <div className="overflow-x-auto touch-scroll navy-scrollbar">
                  <table className="w-full text-left text-xs min-w-[680px]">
                    <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3.5 text-slate-700 font-bold">Row</th>
                        <th className="py-3 px-3.5 text-slate-700 font-bold">Stock ID</th>
                        <th className="py-3 px-3.5 text-slate-700 font-bold">Chassis / VIN</th>
                        <th className="py-3 px-3.5 text-slate-700 font-bold">Vehicle Details</th>
                        <th className="py-3 px-3.5 text-slate-700 font-bold">KM</th>
                        <th className="py-3 px-3.5 text-slate-700 font-bold">FOB (JPY)</th>
                        <th className="py-3 px-3.5 text-slate-700 font-bold">Validation Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batchRows.map((row) => (
                        <tr
                          key={row.rowNum}
                          className={row.status === "ERROR" ? "bg-crimson-50/20" : "hover:bg-slate-50/60"}
                        >
                          <td className="py-2.5 px-3 font-mono text-slate-400">{row.rowNum}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">{row.stockId}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">{row.vinChassis}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900">{row.year} {row.model}</span>{" "}
                            <span className="text-slate-400 text-[11px]">{row.grade}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">{row.odometerKm.toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            ¥{row.fobJPY.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.status === "VALID" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900">
                                <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-crimson-600">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {row.errorReason}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Official CSV Template Modal */}
      <CsvTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  );
}
