"use client";

import React, { useState, useMemo } from "react";
import { AuditEvent } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  Download,
  Search,
  Filter,
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";

export default function AuditExportView() {
  const { auditLogs, vehicles } = useProgramme();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const mActor = log.actorName.toLowerCase().includes(q);
        const mAction = log.action.toLowerCase().includes(q);
        const mObj = log.objectId.toLowerCase().includes(q);
        const mDetails = log.details.toLowerCase().includes(q);
        if (!mActor && !mAction && !mObj && !mDetails) return false;
      }

      if (categoryFilter !== "ALL" && log.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, categoryFilter]);

  // Export Audit Trail to CSV
  const handleExportAuditCSV = () => {
    audio.playSuccessChime();
    const headers = [
      "Event ID",
      "Timestamp",
      "Actor Name",
      "Actor Role",
      "Action",
      "Category",
      "Object ID",
      "Details",
      "Before Value",
      "After Value",
    ];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.actorName}"`,
      l.actorRole,
      l.action,
      l.category,
      l.objectId,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.beforeValue ? JSON.stringify(l.beforeValue).replace(/"/g, '""') : "—"}"`,
      `"${l.afterValue ? JSON.stringify(l.afterValue).replace(/"/g, '""') : "—"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Autohub_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice("Audit trail CSV export generated successfully.");
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  // Export Stock to CSV
  const handleExportStockCSV = () => {
    audio.playSuccessChime();
    const headers = ["Stock ID", "Chassis VIN", "Model", "Grade", "Year", "Odometer", "Fuel", "Drive", "FOB JPY", "Zone 1 Landed NZD", "Status", "Location"];
    const rows = vehicles.map((v) => {
      const price = calculateLandedPrice(v.fobPriceJPY, "ZONE_1");
      return [
        v.stockId,
        v.vinChassis,
        `"${v.model}"`,
        `"${v.grade}"`,
        v.year,
        v.odometerKm,
        v.fuelType,
        v.driveType,
        v.fobPriceJPY,
        price.totalBuyPriceNZD,
        v.status,
        `"${v.location}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Nissan_NZ_Stock_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadNotice("Programme stock CSV export downloaded successfully.");
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner & CSV Export Actions                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
              Compliance &amp; Reporting
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Immutable Ledger (US-20, US-21)
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Programme Audit Trail &amp; Data Export
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically timestamped record of dealer onboarding, pricing profile calculations, atomic vehicle holds, and logistics transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportStockCSV}
            className="px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-2xs hover:border-slate-300 active:scale-[0.98]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Stock (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handleExportAuditCSV}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] to-[#BE123C] hover:from-[#BE123C] hover:to-[#9F1239] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-xs hover:shadow active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Filter & Search Controls                                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor, action, object ID, or details..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {["ALL", "ALLOCATION", "RESERVATION", "TERMS", "INVENTORY", "PRICING"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setCategoryFilter(cat);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80"
                }`}
              >
                {cat === "ALL" ? "All" : cat.charAt(0) + cat.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Audit Event Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto touch-scroll navy-scrollbar">
          <table className="w-full text-left text-xs text-slate-600 min-w-[840px]">
            <thead className="bg-[#0A1322] text-white text-[10px] font-bold uppercase tracking-wider border-b border-[#1B2A42]">
              <tr>
                <th className="py-3.5 px-5 text-slate-200">Timestamp</th>
                <th className="py-3.5 px-4 text-slate-200">Actor &amp; Role</th>
                <th className="py-3.5 px-4 text-slate-200">Event Action</th>
                <th className="py-3.5 px-4 text-slate-200">Category</th>
                <th className="py-3.5 px-4 text-slate-200">Object Ref</th>
                <th className="py-3.5 px-5 text-slate-200">Details</th>
                <th className="py-3.5 px-4 text-slate-200">State Diff (Before → After)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("en-NZ", {
                      timeZone: "Pacific/Auckland",
                      year: "numeric",
                      month: "short",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900">{log.actorName}</div>
                    <div className="text-[10px] font-mono text-slate-400">{log.actorRole}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {log.action}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-semibold text-slate-700">
                      {log.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 font-semibold">
                    {log.objectId}
                  </td>

                  <td className="py-3.5 px-5 text-slate-600 max-w-xs">
                    {log.details}
                  </td>

                  <td className="py-3.5 px-4 min-w-[200px]">
                    {log.beforeValue || log.afterValue ? (
                      <div className="space-y-1 font-mono text-[10px]">
                        {log.beforeValue && (
                          <div className="p-1 rounded bg-rose-50 text-rose-800 border border-rose-150 truncate max-w-[240px]" title={JSON.stringify(log.beforeValue)}>
                            <span className="font-bold">Before: </span>
                            {JSON.stringify(log.beforeValue)}
                          </div>
                        )}
                        {log.afterValue && (
                          <div className="p-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-150 truncate max-w-[240px]" title={JSON.stringify(log.afterValue)}>
                            <span className="font-bold">After: </span>
                            {JSON.stringify(log.afterValue)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 font-mono text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

