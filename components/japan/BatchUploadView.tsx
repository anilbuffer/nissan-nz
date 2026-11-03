"use client";

import React, { useState } from "react";
import { Vehicle } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
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

interface BatchUploadViewProps {
  onSuccessReturn: () => void;
}

export default function BatchUploadView({ onSuccessReturn }: BatchUploadViewProps) {
  const { batchAddVehicles } = useProgramme();
  const [batchRows, setBatchRows] = useState<BatchRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  const handleSimulateUpload = () => {
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
        "/images/cars/nissan-note.jpg",
        "/images/cars/nissan-suv.png",
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Batch CSV Upload
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ingest and validate multiple Japanese vehicle records in a single batch (US-06)
          </p>
        </div>

        <button
          onClick={() => {
            audio.playSubtleClick();
            alert("Downloading official CSV template: StockID, VIN, Model, Grade, Year, KM, FOB_JPY, Location.");
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {publishedSuccess ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-4 shadow-soft">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Batch Published Successfully</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              {validCount} validated vehicles have been published and are now visible to approved Nissan NZ dealers.
            </p>
          </div>

          <button
            onClick={onSuccessReturn}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Back to Inventory
          </button>
        </div>
      ) : (
        <>
          {/* Upload Dropzone */}
          {batchRows.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 p-10 text-center space-y-4 transition-colors">
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

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleSimulateUpload}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-soft"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Load Sample Japan Export Batch</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Batch Processing Summary Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                    onClick={handleClearBatch}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Remove batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handlePublishBatch}
                    disabled={validCount === 0 || isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold transition-colors shadow-soft cursor-pointer"
                  >
                    <span>Publish {validCount} Valid Units</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Parsed Rows Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto touch-scroll navy-scrollbar">
                  <table className="w-full text-left text-xs min-w-[680px]">
                    <thead className="bg-[#0A1322] text-white text-[10px] font-bold uppercase tracking-wider border-b border-[#1B2A42]">
                      <tr>
                        <th className="py-3 px-3.5 text-slate-200">Row</th>
                        <th className="py-3 px-3.5 text-slate-200">Stock ID</th>
                        <th className="py-3 px-3.5 text-slate-200">Chassis / VIN</th>
                        <th className="py-3 px-3.5 text-slate-200">Vehicle Details</th>
                        <th className="py-3 px-3.5 text-slate-200">KM</th>
                        <th className="py-3 px-3.5 text-slate-200">FOB (JPY)</th>
                        <th className="py-3 px-3.5 text-slate-200">Validation Status</th>
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
    </div>
  );
}

