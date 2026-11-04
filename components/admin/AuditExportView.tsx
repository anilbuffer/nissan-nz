"use client";

import React, { useState, useMemo } from "react";
import { AuditEvent, Vehicle, Order, DealerAccount, ReservationRequest } from "@/lib/types";
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
  Layers,
  FileText,
  Clock,
  Car,
  Ship,
  Building2,
  Lock,
  ArrowRight,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Activity,
  AlertTriangle,
} from "lucide-react";

// XML escape helper for SpreadsheetML
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Client-side file downloader
function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// SpreadsheetML generator for native Excel / XLSX opening
function generateExcelXml(sheetName: string, headers: string[], rows: (string | number)[][]): string {
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11"/>
   <Interior ss:Color="#0A0A0A" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Font ss:Color="#1E293B" ss:Size="10"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="NumberData">
   <Font ss:Color="#0F172A" ss:Size="10"/>
   <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName)}">
  <Table>
   <Row ss:StyleID="Header" ss:Height="26">
    ${headers.map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`).join("")}
   </Row>
   ${rows
      .map(
        (r) => `
   <Row ss:StyleID="Data" ss:Height="20">
    ${r
            .map((val) => {
              const isNum = typeof val === "number";
              return `<Cell ss:StyleID="${isNum ? "NumberData" : "Data"}"><Data ss:Type="${isNum ? "Number" : "String"}">${escapeXml(
                String(val ?? "")
              )}</Data></Cell>`;
            })
            .join("")}
   </Row>`
      )
      .join("")}
  </Table>
 </Worksheet>
</Workbook>`;
}

export default function AuditExportView() {
  const { auditLogs, vehicles, orders, dealers, reservations } = useProgramme();

  const [activeTab, setActiveTab] = useState<"LEDGER" | "EXPORTS" | "ANALYTICS">("LEDGER");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<"ALL" | "24H" | "7D" | "30D">("ALL");
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Filtered audit events
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

      if (dateRangeFilter !== "ALL") {
        const eventTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (dateRangeFilter === "24H" && now - eventTime > 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === "7D" && now - eventTime > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === "30D" && now - eventTime > 30 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [auditLogs, searchQuery, dateRangeFilter]);

  // ─────────────────────────────────────────────────────────────────
  // Export Handlers (CSV & XLSX for all 5 core datasets)
  // ─────────────────────────────────────────────────────────────────

  const exportAuditLedger = (format: "CSV" | "XLSX") => {
    audio.playSuccessChime();
    const headers = [
      "Event ID",
      "Timestamp (UTC)",
      "Actor Name",
      "Actor Role",
      "Event Action",
      "Category",
      "Object Reference",
      "Details & Remarks",
      "State Before",
      "State After",
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.actorName,
      l.actorRole,
      l.action,
      l.category,
      l.objectId,
      l.details,
      l.beforeValue ? JSON.stringify(l.beforeValue) : "—",
      l.afterValue ? JSON.stringify(l.afterValue) : "—",
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    if (format === "CSV") {
      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
      triggerDownload(csv, `Nissan_NZ_Audit_Ledger_${dateStr}.csv`, "text/csv;charset=utf-8;");
    } else {
      const xml = generateExcelXml("Audit Ledger", headers, rows);
      triggerDownload(xml, `Nissan_NZ_Audit_Ledger_${dateStr}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    setDownloadNotice(`Audit Ledger (${format}) downloaded successfully with ${rows.length} records.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const exportStockCatalogue = (format: "CSV" | "XLSX") => {
    audio.playSuccessChime();
    const headers = [
      "Stock ID",
      "Chassis / VIN",
      "Make",
      "Model",
      "Grade",
      "Year",
      "Odometer (km)",
      "Fuel Type",
      "Drive Type",
      "Auction Grade",
      "FOB (JPY)",
      "Zone 1 Landed Total (NZD)",
      "Current Status",
      "Current Yard Location",
    ];

    const rows = vehicles.map((v) => {
      const price = calculateLandedPrice(v.fobPriceJPY, "ZONE_1");
      return [
        v.stockId,
        v.vinChassis,
        v.make,
        v.model,
        v.grade,
        v.year,
        v.odometerKm,
        v.fuelType,
        v.driveType,
        v.auctionGrade,
        v.fobPriceJPY,
        price.totalBuyPriceNZD,
        v.status,
        v.location || "Yokohama Yard",
      ];
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    if (format === "CSV") {
      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
      triggerDownload(csv, `Nissan_NZ_Stock_Inventory_${dateStr}.csv`, "text/csv;charset=utf-8;");
    } else {
      const xml = generateExcelXml("Inventory Schedule", headers, rows);
      triggerDownload(xml, `Nissan_NZ_Stock_Inventory_${dateStr}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    setDownloadNotice(`Stock Catalogue (${format}) downloaded successfully with ${rows.length} units.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const exportOrdersPipeline = (format: "CSV" | "XLSX") => {
    audio.playSuccessChime();
    const headers = [
      "Order Number",
      "Stock ID",
      "Vehicle Summary",
      "Dealership",
      "Pricing Zone",
      "Total Landed Price (NZD)",
      "Current Milestone",
      "Ocean Carrier Vessel",
      "Voyage Number",
      "Estimated Delivery Date",
      "Order Date",
      "Additional Costs Count",
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      o.vehicle?.stockId || o.vehicleId,
      `${o.vehicle?.year} ${o.vehicle?.make} ${o.vehicle?.model}`,
      o.dealerName,
      o.pricingZoneId,
      o.priceBreakdown?.totalBuyPriceNZD || 0,
      o.currentMilestone,
      o.vesselName || "RoRo Ocean Carrier",
      o.voyageNumber || "—",
      o.etaDeliveryDate || "TBD",
      o.orderedAt.slice(0, 10),
      o.additionalCosts?.length || 0,
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    if (format === "CSV") {
      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
      triggerDownload(csv, `Nissan_NZ_Orders_Pipeline_${dateStr}.csv`, "text/csv;charset=utf-8;");
    } else {
      const xml = generateExcelXml("Orders Pipeline", headers, rows);
      triggerDownload(xml, `Nissan_NZ_Orders_Pipeline_${dateStr}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    setDownloadNotice(`Orders Logistics Pipeline (${format}) downloaded successfully with ${rows.length} orders.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const exportReservationsQueue = (format: "CSV" | "XLSX") => {
    audio.playSuccessChime();
    const headers = [
      "Reservation Request ID",
      "Stock ID",
      "Vehicle Details",
      "Dealership",
      "Dealer Code",
      "Requested By",
      "Requested At (UTC)",
      "Holding Expires At",
      "Current Hold Status",
      "Agreed Landed Price (NZD)",
      "Terms Version Snapshot",
    ];

    const rows = reservations.map((r) => [
      r.requestId,
      r.vehicle?.stockId || r.vehicleId,
      `${r.vehicle?.year || ""} ${r.vehicle?.model || ""}`,
      r.dealerName,
      r.dealerCode,
      r.userName,
      r.requestedAt,
      r.expiresAt,
      r.status,
      r.priceSnapshot?.totalBuyPriceNZD || 0,
      r.termsVersionSnapshot || "v2026.1",
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    if (format === "CSV") {
      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
      triggerDownload(csv, `Nissan_NZ_Reservations_Queue_${dateStr}.csv`, "text/csv;charset=utf-8;");
    } else {
      const xml = generateExcelXml("Reservations Queue", headers, rows);
      triggerDownload(xml, `Nissan_NZ_Reservations_Queue_${dateStr}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    setDownloadNotice(`Reservations Queue (${format}) downloaded with ${rows.length} records.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const exportDealersRoster = (format: "CSV" | "XLSX") => {
    audio.playSuccessChime();
    const headers = [
      "Dealership Code",
      "Legal Trading Name",
      "NZBN",
      "Physical Address",
      "Assigned Pricing Zone",
      "Application Status",
      "Primary Contact Name",
      "Primary Contact Email",
      "Primary Contact Phone",
      "Terms Accepted Version",
      "Accepted At",
    ];

    const rows = dealers.map((d) => [
      d.dealerCode,
      d.legalTradingName,
      d.nzbn,
      d.address,
      d.pricingZoneId,
      d.status,
      d.primaryContactName,
      d.primaryContactEmail,
      d.primaryContactPhone,
      d.termsAcceptedVersion || "—",
      d.termsAcceptedAt || "—",
    ]);

    const dateStr = new Date().toISOString().slice(0, 10);
    if (format === "CSV") {
      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
      triggerDownload(csv, `Nissan_NZ_Franchise_Dealers_${dateStr}.csv`, "text/csv;charset=utf-8;");
    } else {
      const xml = generateExcelXml("Franchise Dealers", headers, rows);
      triggerDownload(xml, `Nissan_NZ_Franchise_Dealers_${dateStr}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    }

    setDownloadNotice(`Franchise Dealership Roster (${format}) downloaded with ${rows.length} dealers.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  // ─────────────────────────────────────────────────────────────────
  // Analytics Calculations
  // ─────────────────────────────────────────────────────────────────
  const eventsByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    auditLogs.forEach((l) => {
      counts[l.category] = (counts[l.category] || 0) + 1;
    });
    return counts;
  }, [auditLogs]);

  const topActors = useMemo(() => {
    const counts: Record<string, { count: number; role: string }> = {};
    auditLogs.forEach((l) => {
      if (!counts[l.actorName]) {
        counts[l.actorName] = { count: 1, role: l.actorRole };
      } else {
        counts[l.actorName].count += 1;
      }
    });
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [auditLogs]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200 font-sans text-slate-800 pb-16">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner & Global Actions                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Programme Audit History &amp; Data Export Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological ledger of all material user and system actions, with exportable CSV and XLSX datasets.
          </p>
        </div>

        {/* Global Quick Export Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => exportAuditLedger("CSV")}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Audit (CSV)</span>
          </button>
          <button
            type="button"
            onClick={() => exportAuditLedger("XLSX")}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Audit (XLSX)</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Primary Navigation Tabs                                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: "LEDGER", label: "Immutable Audit Ledger", icon: ShieldCheck, badge: filteredLogs.length },
          { id: "EXPORTS", label: "CSV / XLSX Export Center", icon: FileSpreadsheet, badge: "5 Datasets" },
          { id: "ANALYTICS", label: "Compliance & Activity Breakdown", icon: Activity, badge: null },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setActiveTab(tab.id as any);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${isActive
                ? "bg-[#0A0A0A] text-white shadow-xs"
                : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
                }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700"
                    }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. TAB 1: Immutable Audit Ledger                            */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "LEDGER" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by actor name, action, object reference, or details..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all font-sans"
                />
              </div>

              {/* Time window presets */}
              <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0 overflow-x-auto no-scrollbar">
                {[
                  { id: "ALL", label: "All Time" },
                  { id: "24H", label: "Past 24 Hours" },
                  { id: "7D", label: "Past 7 Days" },
                  { id: "30D", label: "Past 30 Days" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      setDateRangeFilter(preset.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${dateRangeFilter === preset.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Event Table */}
          <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="overflow-x-auto touch-scroll navy-scrollbar">
              <table className="w-full text-left text-xs text-slate-600 min-w-[900px]">
                <thead className="bg-slate-50 text-slate-700 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-slate-700 font-bold">Timestamp (NZST)</th>
                    <th className="py-3 px-4 text-slate-700 font-bold">Actor &amp; Role</th>
                    <th className="py-3 px-4 text-slate-700 font-bold">Action Code</th>
                    <th className="py-3 px-3 text-slate-700 font-bold">Category</th>
                    <th className="py-3 px-3 text-slate-700 font-bold">Object Ref</th>
                    <th className="py-3 px-4 text-slate-700 font-bold">Details &amp; Audit Trail Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                        No audit records matched your search or category filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString("en-NZ", {
                            timeZone: "Pacific/Auckland",
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{log.actorName}</div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                            {log.actorRole}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-[11px]">
                          {log.action}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-mono font-semibold text-slate-700">
                            {log.category}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-slate-700 text-[11px]">
                          {log.objectId}
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-sm text-[11px] leading-relaxed">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. TAB 2: Multi-Dataset CSV / XLSX Export Center            */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "EXPORTS" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Standard corporate CSV and styled Microsoft Excel (<strong>.XLSX</strong>) export files compatible with NZTA and Customs audit standards.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dataset 1: Immutable Audit Ledger */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    IMMUTABLE LEDGER
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {auditLogs.length} Events
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Programme Audit Trail
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Cryptographically timestamped ledger of dealer onboarding, pricing profile calculations, atomic exclusivity holds, and milestone updates.
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Schema: ID, Timestamp, Actor, Role, Action, Category, Object, Details
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => exportAuditLedger("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportAuditLedger("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>
              </div>
            </div>

            {/* Dataset 2: Japanese Export Catalogue */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    INVENTORY MASTER
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {vehicles.length} Units
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Export Stock &amp; Landed Prices
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  inventory specifications, year, odometer km, auction grades, FOB pricing (JPY), and domestic landed price schedules.
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Schema: Stock ID, VIN, Model, Grade, Year, Km, Fuel, Drive, FOB, Landed NZD, Status
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => exportStockCatalogue("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportStockCatalogue("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>
              </div>
            </div>

            {/* Dataset 3: Orders & Shipping Pipeline */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    LOGISTICS &amp; ORDERS
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {orders.length} Orders
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Wholesale Shipping Pipeline
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Active wholesale orders tracking RoRo vessels, voyage numbers, ETAs, 8-stage logistics milestones, and remediation variation sign-offs.
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Schema: Order #, Stock ID, Vehicle, Dealer, Price NZD, Milestone, Vessel, Voyage, ETA
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => exportOrdersPipeline("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportOrdersPipeline("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>
              </div>
            </div>

            {/* Dataset 4: Atomic Exclusivity Holds */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    RESERVATIONS
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {reservations.length} Holds
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Atomic Exclusivity Holds
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  24-hour exclusivity reservations log capturing dealer identity, request timestamps, expiry clocks, Terms of Trade v2026.1 snapshots.
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Schema: Request ID, Stock, Dealer, User, Requested At, Expires At, Status, Price
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => exportReservationsQueue("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportReservationsQueue("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>
              </div>
            </div>

            {/* Dataset 5: Franchise Dealership Network */}
            <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    FRANCHISE DIRECTORY
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {dealers.length} Dealers
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Dealer Network &amp; Pricing Zones
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Registered Nissan NZ franchise network with legal trading names, NZBN verification, assigned Geographic Zones (1–5), and principal contacts.
                </p>
                <div className="text-[10px] font-mono text-slate-400 pt-1">
                  Schema: Dealer Code, Legal Name, NZBN, Address, Pricing Zone, Status, Primary Contact
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => exportDealersRoster("CSV")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportDealersRoster("XLSX")}
                  className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download XLSX</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. TAB 3: Compliance & Activity Breakdown                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "ANALYTICS" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Events by Category */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Audit Ledger Events by Domain</span>
              </h3>

              <div className="space-y-2.5">
                {Object.entries(eventsByCategory).map(([cat, count]) => {
                  const percentage = Math.round((count / auditLogs.length) * 100);
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-slate-700">{cat}</span>
                        <span className="font-mono text-slate-500">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-slate-900 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card 2: Top Operational Actors */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                <span>Primary Operational Actors</span>
              </h3>

              <div className="divide-y divide-slate-100">
                {topActors.map((actor) => (
                  <div key={actor.name} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{actor.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 ml-2">
                        {actor.role}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-700">
                      {actor.count} operations
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
    </div>
  );
}
