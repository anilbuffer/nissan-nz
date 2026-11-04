"use client";

import React, { useState } from "react";
import { audio } from "@/lib/sound";
import {
  Download,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Table as TableIcon,
  Code2,
  CheckCircle2,
  Info,
} from "lucide-react";

interface CsvTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATE_HEADERS = [
  { key: "StockID", required: false, type: "String", desc: "Unique stock ID (e.g. NIS-2026-9051, auto-generated if left blank)" },
  { key: "VIN", required: true, type: "String", desc: "Mandatory Japanese Chassis/VIN stamp (e.g. E13-051829)" },
  { key: "Model", required: true, type: "String", desc: "Vehicle model designation (e.g. Note e-Power, X-Trail, Ariya)" },
  { key: "Grade", required: false, type: "String", desc: "Auction trim / spec grade (e.g. X Package, Highway Star)" },
  { key: "Year", required: true, type: "Integer", desc: "Model manufacturing year (e.g. 2023)" },
  { key: "KM", required: true, type: "Integer", desc: "Certified odometer reading in kilometres (e.g. 14200)" },
  { key: "FOB_JPY", required: true, type: "Integer", desc: "Acquisition price in Japanese Yen (e.g. 1950000)" },
  { key: "Location", required: false, type: "String", desc: "Japanese marshalling / port yard (e.g. Yokohama Export Yard)" },
];

const SAMPLE_CSV_ROWS = [
  {
    StockID: "NIS-2026-9051",
    VIN: "E13-051829",
    Model: "Note e-Power",
    Grade: "X Package",
    Year: 2023,
    KM: 14200,
    FOB_JPY: 1950000,
    Location: "Yokohama Export Yard",
  },
  {
    StockID: "NIS-2026-9052",
    VIN: "T32-901842",
    Model: "X-Trail Hybrid",
    Grade: "20Xi 4WD",
    Year: 2022,
    KM: 31000,
    FOB_JPY: 2580000,
    Location: "Yokohama Export Yard",
  },
  {
    StockID: "NIS-2026-9053",
    VIN: "C27-418291",
    Model: "Serena e-Power",
    Grade: "Highway Star",
    Year: 2022,
    KM: 27500,
    FOB_JPY: 2790000,
    Location: "Kobe Logistics Port",
  },
  {
    StockID: "NIS-2026-9054",
    VIN: "FE0-008412",
    Model: "Ariya B6",
    Grade: "Premier 4WD",
    Year: 2023,
    KM: 11400,
    FOB_JPY: 3850000,
    Location: "Nagoya Staging Yard",
  },
  {
    StockID: "NIS-2026-9055",
    VIN: "ZE1-184920",
    Model: "Leaf e+",
    Grade: "G Grade",
    Year: 2022,
    KM: 18900,
    FOB_JPY: 2250000,
    Location: "Yokohama Export Yard",
  },
];

const RAW_CSV_CONTENT = `StockID,VIN,Model,Grade,Year,KM,FOB_JPY,Location
NIS-2026-9051,E13-051829,Note e-Power,X Package,2023,14200,1950000,Yokohama Export Yard
NIS-2026-9052,T32-901842,X-Trail Hybrid,20Xi 4WD,2022,31000,2580000,Yokohama Export Yard
NIS-2026-9053,C27-418291,Serena e-Power,Highway Star,2022,27500,2790000,Kobe Logistics Port
NIS-2026-9054,FE0-008412,Ariya B6,Premier 4WD,2023,11400,3850000,Nagoya Staging Yard
NIS-2026-9055,ZE1-184920,Leaf e+,G Grade,2022,18900,2250000,Yokohama Export Yard`;

export default function CsvTemplateModal({ isOpen, onClose }: CsvTemplateModalProps) {
  const [activeTab, setActiveTab] = useState<"TABLE" | "RAW">("TABLE");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    audio.playSubtleClick();
    const blob = new Blob([RAW_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "nissan_japan_vehicle_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    audio.playSuccessChime();
  };

  const handleCopyCsv = () => {
    audio.playSubtleClick();
    navigator.clipboard.writeText(RAW_CSV_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-template-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 font-sans"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-[20px] border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Official Specification
                </span>
                <span className="text-[11px] font-mono text-slate-400">RFC 4180 UTF-8</span>
              </div>
              <h2 id="csv-template-modal-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                Japanese Vehicle Export Batch CSV Template
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">
          {/* Information Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#C3002F] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-0.5">Required Schema Specification</span>
              The batch ingestion engine expects an 8-column header row:{" "}
              <code className="font-mono text-[11px] font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                StockID, VIN, Model, Grade, Year, KM, FOB_JPY, Location
              </code>
              . You can populate this template in Microsoft Excel, Google Sheets, or any CSV editor.
            </div>
          </div>

          {/* Column Dictionary Pill Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Field Specification ({TEMPLATE_HEADERS.length} Columns)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {TEMPLATE_HEADERS.map((h) => (
                <div
                  key={h.key}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900">{h.key}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        h.required
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}
                    >
                      {h.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* View Mode Tabs: Table Preview vs Raw CSV */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Template Data Preview
              </h3>

              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setActiveTab("TABLE");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "TABLE"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setActiveTab("RAW");
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "RAW"
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Raw CSV</span>
                </button>
              </div>
            </div>

            {/* Table View */}
            {activeTab === "TABLE" ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto touch-scroll navy-scrollbar">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 text-slate-700 font-bold">StockID</th>
                        <th className="py-2.5 px-3 text-slate-700 font-bold">VIN</th>
                        <th className="py-2.5 px-3 text-slate-700 font-bold">Model</th>
                        <th className="py-2.5 px-3 text-slate-700 font-bold">Grade</th>
                        <th className="py-2.5 px-3 text-slate-700 font-bold">Year</th>
                        <th className="py-2.5 px-3 text-slate-700 font-bold">KM</th>
                        <th className="py-2.5 px-3 text-slate-700 font-bold text-right">FOB (JPY)</th>
                        <th className="py-2.5 px-3 text-slate-700 font-bold">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {SAMPLE_CSV_ROWS.map((row) => (
                        <tr key={row.VIN} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2 px-3 font-bold text-slate-900">{row.StockID}</td>
                          <td className="py-2 px-3 text-slate-700">{row.VIN}</td>
                          <td className="py-2 px-3 font-sans font-semibold text-slate-900">{row.Model}</td>
                          <td className="py-2 px-3 font-sans text-slate-500">{row.Grade}</td>
                          <td className="py-2 px-3 text-slate-700">{row.Year}</td>
                          <td className="py-2 px-3 text-slate-700">{row.KM.toLocaleString()} km</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            ¥{row.FOB_JPY.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 font-sans text-slate-600">{row.Location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Raw CSV View */
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#0A0A0A] p-4 text-slate-100 font-mono text-xs shadow-inner">
                <pre className="overflow-x-auto whitespace-pre leading-relaxed select-all">
                  {RAW_CSV_CONTENT}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyCsv}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy CSV to Clipboard</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#C3002F] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download .CSV Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

