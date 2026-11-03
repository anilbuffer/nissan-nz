"use client";

import React, { useState, useMemo } from "react";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { calculateLandedPrice } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { Vehicle, ReservationRequest, Order, ZoneId } from "@/lib/types";
import {
  Car,
  Lock,
  Ship,
  Building2,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  AlertCircle,
  Truck,
  ExternalLink,
  ChevronRight,
  Layers,
  Calendar,
  X,
  FileSpreadsheet,
  BadgeAlert,
  Info,
  Check,
} from "lucide-react";

interface ProgrammeUserPortalViewProps {
  initialSubTab?: "stock" | "reservations" | "orders" | "reports";
}

export default function ProgrammeUserPortalView({
  initialSubTab = "stock",
}: ProgrammeUserPortalViewProps) {
  const { currentUser } = useAuth();
  const { vehicles, reservations, orders, dealers, auditLogs } = useProgramme();

  const [activeTab, setActiveTab] = useState<"stock" | "reservations" | "orders" | "reports">(
    initialSubTab
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZone, setSelectedZone] = useState<ZoneId>("ZONE_1");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedVehicleForDossier, setSelectedVehicleForDossier] = useState<Vehicle | null>(null);
  const [selectedOrderForDossier, setSelectedOrderForDossier] = useState<Order | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Executive Totals
  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  const reservedVehicles = vehicles.filter((v) => v.status === "RESERVED");
  const allocatedVehicles = vehicles.filter((v) => v.status === "ALLOCATED");
  const activeHolds = reservations.filter((r) => r.status === "ACTIVE_HOLD");
  const activeOrders = orders.filter((o) => o.currentMilestone !== "DELIVERED");

  const totalWholesaleJPY = vehicles.reduce((sum, v) => sum + (v.fobPriceJPY || 0), 0);
  const totalWholesaleNZD = Math.round(totalWholesaleJPY * 0.01085);
  const totalHoldValue = activeHolds.reduce((acc, h) => acc + (h.priceSnapshot?.totalBuyPriceNZD || 0), 0);

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return vehicles.filter((v) => {
      const matchSearch =
        !q ||
        v.stockId.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.vinChassis.toLowerCase().includes(q) ||
        v.color.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  // Filtered Holds
  const filteredHolds = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return reservations.filter((r) => {
      if (!q) return true;
      return (
        r.dealerName?.toLowerCase().includes(q) ||
        r.vehicle?.model.toLowerCase().includes(q) ||
        r.vehicle?.stockId.toLowerCase().includes(q) ||
        r.vehicleId.toLowerCase().includes(q)
      );
    });
  }, [reservations, searchQuery]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.dealerName.toLowerCase().includes(q) ||
        o.vehicle?.model.toLowerCase().includes(q) ||
        o.vesselName?.toLowerCase().includes(q) ||
        o.currentMilestone.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery]);

  // CSV & XLSX Export Helpers
  const handleExportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    audio.playSubtleClick();
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join(
        "\n"
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadToast(`Exported ${filename}.csv successfully.`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  const handleExportXLSX = (sheetName: string, headers: string[], rows: (string | number)[][]) => {
    audio.playSubtleClick();
    // Native XML SpreadsheetML compatible with Microsoft Excel
    const xmlHeader = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0A0A0A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Cell">
   <Font ss:Color="#1E293B"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${sheetName}">
  <Table>`;

    const xmlRows = [
      `<Row ss:StyleID="Header">${headers
        .map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`)
        .join("")}</Row>`,
      ...rows.map(
        (r) =>
          `<Row ss:StyleID="Cell">${r
            .map((val) => {
              const isNum = typeof val === "number";
              return `<Cell><Data ss:Type="${isNum ? "Number" : "String"}">${val}</Data></Cell>`;
            })
            .join("")}</Row>`
      ),
    ].join("\n");

    const xmlFooter = `</Table></Worksheet></Workbook>`;
    const blob = new Blob([xmlHeader + xmlRows + xmlFooter], {
      type: "application/vnd.ms-excel",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sheetName}_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadToast(`Exported ${sheetName}.xlsx with native styling.`);
    setTimeout(() => setDownloadToast(null), 4000);
  };

  // 8 Milestones Definition
  const MILESTONES_ORDER = [
    "JAPAN_EXPORT_PREPARATION",
    "EXPORT_CUSTOMS_CLEARED",
    "VESSEL_LOADED",
    "OCEAN_TRANSIT",
    "NZ_PORT_ARRIVAL",
    "CUSTOMS_NZTA_INSPECTION",
    "INLAND_LOGISTICS",
    "DELIVERED",
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-150 font-sans text-slate-800 pb-16">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header: Programme User Portal Banner                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 px-5 py-4 sm:px-6 sm:py-4.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C3002F]">
              Authorised Programme Governance
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              Read-Only Programme User
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hidden sm:inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-600" />
              <span>NSC Oversight Clearance</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A0A0A]">
            Nissan NZ Programme User Portal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">
            Dedicated read-only interface providing access to authorised central stock, active exclusivity reservations, shipping milestones, and operational reporting.
          </p>
        </div>

        {/* Global Action Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Operational Reports</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stock")}
            className="px-3.5 py-2 rounded-xl bg-[#C3002F] hover:bg-[#A10026] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
          >
            <Car className="w-3.5 h-3.5 text-white" />
            <span>Authorised Stock</span>
          </button>
        </div>
      </div>

      {/* Read-Only Mode Informational Banner */}
      <div className="px-4 py-2.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5 shadow-2xs">
        <Info className="w-4 h-4 text-blue-600 shrink-0" />
        <div className="min-w-0 font-normal">
          <strong className="font-semibold">Programme Read-Only Mode:</strong> You are signed in as an authorised Programme User ({currentUser?.email}). You have full visibility across Japanese stock inventory, exclusivity locks, and door-to-door milestones. Transactional mutations (stock reservations, status changes, order dispatch) are restricted to authorised franchise dealers and Autohub central administrators.
        </div>
      </div>

      {/* Download Notification Toast */}
      {downloadToast && (
        <div className="px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{downloadToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Executive Programme Telemetry Strip                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveTab("stock")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${activeTab === "stock"
            ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md"
            : "bg-white border-slate-200 hover:border-slate-300"
            }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={activeTab === "stock" ? "text-slate-300" : "text-slate-500"}>Authorised Stock</span>
            <Car className={`w-3.5 h-3.5 ${activeTab === "stock" ? "text-white" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums">{availableVehicles.length}</span>
            <span className={`text-[10px] ${activeTab === "stock" ? "text-slate-300" : "text-slate-400"}`}>
              live / {vehicles.length} total
            </span>
          </div>
          <span className={`text-[10px] font-mono tabular-nums block truncate mt-0.5 ${activeTab === "stock" ? "text-slate-300" : "text-slate-500"}`}>
            ${(totalWholesaleNZD / 1000).toFixed(0)}k NZD wholesale valuation
          </span>
        </div>

        <div
          onClick={() => setActiveTab("reservations")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${activeTab === "reservations"
            ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md"
            : "bg-white border-slate-200 hover:border-slate-300"
            }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={activeTab === "reservations" ? "text-slate-300" : "text-slate-500"}>Exclusivity Holds</span>
            <Lock className={`w-3.5 h-3.5 ${activeTab === "reservations" ? "text-blue-400" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums">{activeHolds.length}</span>
            <span className={`text-[10px] ${activeTab === "reservations" ? "text-slate-300" : "text-slate-400"}`}>
              locked units
            </span>
          </div>
          <span className={`text-[10px] font-mono tabular-nums block truncate mt-0.5 ${activeTab === "reservations" ? "text-slate-300" : "text-slate-500"}`}>
            ${totalHoldValue.toLocaleString()} NZD in exclusivity
          </span>
        </div>

        <div
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${activeTab === "orders"
            ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md"
            : "bg-white border-slate-200 hover:border-slate-300"
            }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={activeTab === "orders" ? "text-slate-300" : "text-slate-500"}>Shipping Pipeline</span>
            <Ship className={`w-3.5 h-3.5 ${activeTab === "orders" ? "text-indigo-400" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums">{activeOrders.length}</span>
            <span className={`text-[10px] ${activeTab === "orders" ? "text-slate-300" : "text-slate-400"}`}>
              orders in-transit
            </span>
          </div>
          <span className={`text-[10px] block truncate mt-0.5 ${activeTab === "orders" ? "text-slate-300" : "text-slate-500"}`}>
            8-stage RoRo transit &amp; compliance
          </span>
        </div>

        <div
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-3 rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all cursor-pointer ${activeTab === "reports"
            ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-md"
            : "bg-white border-slate-200 hover:border-slate-300"
            }`}
        >
          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className={activeTab === "reports" ? "text-slate-300" : "text-slate-500"}>Programme Reports</span>
            <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === "reports" ? "text-emerald-400" : "text-slate-400"}`} />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black font-mono tabular-nums">{dealers.length}</span>
            <span className={`text-[10px] ${activeTab === "reports" ? "text-slate-300" : "text-slate-400"}`}>
              franchise dealers
            </span>
          </div>
          <span className={`text-[10px] block truncate mt-0.5 ${activeTab === "reports" ? "text-slate-300" : "text-slate-500"}`}>
            CSV &amp; XLSX live export available
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Sub-Navigation Tabs & Universal Filter Bar               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[24px] border border-slate-200 p-3 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { id: "stock", label: "Authorised Vehicle Stock", icon: Car, count: vehicles.length },
            { id: "reservations", label: "Authorised Reservations", icon: Lock, count: activeHolds.length },
            { id: "orders", label: "Wholesale Orders Pipeline", icon: Ship, count: orders.length },
            { id: "reports", label: "Programme Reports & Export", icon: FileSpreadsheet, count: null },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${active
                  ? "bg-[#0A0A0A] text-white shadow-2xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? "text-rose-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full font-bold ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Zone Pricing Perspective */}
        <div className="flex items-center gap-2">
          {activeTab === "stock" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Zone Pricing:</span>
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value as ZoneId)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] cursor-pointer"
              >
                <option value="ZONE_1">Zone 1 (Auckland Metro)</option>
                <option value="ZONE_2">Zone 2 (North Island Upper)</option>
                <option value="ZONE_3">Zone 3 (Central North Island)</option>
                <option value="ZONE_4">Zone 4 (Wellington &amp; South Entry)</option>
                <option value="ZONE_5">Zone 5 (South Island Regional)</option>
              </select>
            </div>
          )}

          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search model, stock ID, dealer..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] focus:border-[#0A0A0A] font-sans transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. TAB 1: Authorised Vehicle Stock & Catalogue              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Central Japanese Vehicle Stock &amp; Catalogue
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold">
                {filteredVehicles.length} Units Listed
              </span>
            </div>

            {/* Quick Status Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {["ALL", "AVAILABLE", "RESERVED", "ALLOCATED", "WITHDRAWN"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${statusFilter === status
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto touch-scroll navy-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 min-w-[840px]">
              <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Vehicle Spec</th>
                  <th className="py-2.5 px-3">Stock ID &amp; VIN</th>
                  <th className="py-2.5 px-3">Grade &amp; Condition</th>
                  <th className="py-2.5 px-3">Odometer</th>
                  <th className="py-2.5 px-3">FOB (JPY)</th>
                  <th className="py-2.5 px-3">{selectedZone.replace("_", " ")} Landed (NZD)</th>
                  <th className="py-2.5 px-3">Catalogue Status</th>
                  <th className="py-2.5 px-3 text-right">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredVehicles.map((vehicle) => {
                  const price = calculateLandedPrice(vehicle.fobPriceJPY, selectedZone);
                  return (
                    <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Vehicle Spec */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-7 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            <img
                              src={vehicle.images?.[0] || "/images/cars/note.png"}
                              alt={vehicle.model}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {vehicle.grade} · {vehicle.color} · {vehicle.transmission || "Automatic"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Stock ID & VIN */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        <div className="font-bold text-slate-900">#{vehicle.stockId}</div>
                        <div className="text-[10px] text-slate-400">{vehicle.vinChassis}</div>
                      </td>

                      {/* Grade & Condition */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                          {vehicle.grade}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Ext: {vehicle.exteriorGrade || "4.5"} / Int: {vehicle.interiorGrade || "B"}
                        </div>
                      </td>

                      {/* Odometer */}
                      <td className="py-2.5 px-3 font-mono">
                        {vehicle.odometerKm.toLocaleString()} km
                      </td>

                      {/* FOB Price */}
                      <td className="py-2.5 px-3 font-mono">
                        ¥{vehicle.fobPriceJPY.toLocaleString()}
                      </td>

                      {/* Total Buy Landed Price */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        <div>${price.totalBuyPriceNZD.toLocaleString()} NZD</div>
                        <div className="text-[9px] text-slate-400 font-normal">
                          Includes CIF, Tariff, Compliance
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${vehicle.status === "AVAILABLE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : vehicle.status === "RESERVED"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : vehicle.status === "ALLOCATED"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : vehicle.status === "WITHDRAWN"
                                  ? "bg-slate-800 text-white border border-slate-900"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                        >
                          {vehicle.status}
                        </span>
                      </td>

                      {/* Dossier Action */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            setSelectedVehicleForDossier(vehicle);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. TAB 2: Authorised Reservations & Active 24h Holds       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "reservations" && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Authorised Exclusivity Holds &amp; Reservation Records
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-mono font-bold">
                {filteredHolds.length} Recorded Holds
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Total Hold Valuation: ${totalHoldValue.toLocaleString()} NZD
            </span>
          </div>

          <div className="overflow-x-auto touch-scroll navy-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 min-w-[840px]">
              <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Vehicle &amp; Stock ID</th>
                  <th className="py-2.5 px-3">Holding Dealership</th>
                  <th className="py-2.5 px-3">Held Since &amp; Expiry</th>
                  <th className="py-2.5 px-3">Price Snapshot (NZD)</th>
                  <th className="py-2.5 px-3">Terms Version</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredHolds.map((reservation) => {
                  const diffMs = new Date(reservation.expiresAt).getTime() - Date.now();
                  const hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                  const minutesRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
                  const isActive = reservation.status === "ACTIVE_HOLD";

                  return (
                    <tr key={reservation.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Vehicle & Stock ID */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">
                          {reservation.vehicle?.year} {reservation.vehicle?.model}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500">
                          #{reservation.vehicle?.stockId} · VIN: {reservation.vehicle?.vinChassis}
                        </div>
                      </td>

                      {/* Holding Dealership */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{reservation.dealerName}</div>
                        <div className="font-mono text-[10px] text-slate-400">ID: {reservation.dealerId}</div>
                      </td>

                      {/* Held Since & Expiry */}
                      <td className="py-2.5 px-3 font-mono">
                        {isActive ? (
                          <div className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[11px]">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>{hoursRemaining}h {minutesRemaining}m remaining</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Expired / Released</span>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Expires: {new Date(reservation.expiresAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>

                      {/* Price Snapshot */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        ${reservation.priceSnapshot?.totalBuyPriceNZD?.toLocaleString()} NZD
                        <div className="text-[10px] text-slate-400 font-normal">
                          Zone: {reservation.priceSnapshot?.zoneId}
                        </div>
                      </td>

                      {/* Terms Version */}
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {reservation.termsVersionSnapshot || "v2026.1"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${reservation.status === "ACTIVE_HOLD"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : reservation.status === "CONFIRMED_ALLOCATED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                        >
                          {reservation.status}
                        </span>
                      </td>

                      {/* Details View */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            const matchedVehicle = vehicles.find((v) => v.id === reservation.vehicleId);
                            if (matchedVehicle) setSelectedVehicleForDossier(matchedVehicle);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Vehicle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 6. TAB 3: Wholesale Orders Pipeline & Milestones           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Wholesale Order Records &amp; RoRo Logistics Pipeline
              </h2>
              <span className="px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-mono font-bold">
                {filteredOrders.length} Recorded Shipments
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Active Shipments: {activeOrders.length}
            </span>
          </div>

          <div className="overflow-x-auto touch-scroll navy-scrollbar">
            <table className="w-full text-left text-xs text-slate-700 min-w-[860px]">
              <thead className="bg-[#0A0A0A] text-white text-[10px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Order &amp; Vehicle</th>
                  <th className="py-2.5 px-3">Destination Dealer</th>
                  <th className="py-2.5 px-3">Carrier / Vessel &amp; ETA</th>
                  <th className="py-2.5 px-3">Door-to-Door Milestones (8 Stages)</th>
                  <th className="py-2.5 px-3">Total Landed Price</th>
                  <th className="py-2.5 px-3 text-right">Order Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredOrders.map((order) => {
                  const currentIdx = MILESTONES_ORDER.indexOf(order.currentMilestone);
                  const progressPct = Math.round(((currentIdx + 1) / MILESTONES_ORDER.length) * 100);
                  const pendingCost = order.additionalCosts?.find((c) => c.status === "PENDING_DEALER_APPROVAL");

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Order & Vehicle */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900 font-mono">{order.orderNumber}</div>
                        <div className="text-[11px] text-slate-700">
                          {order.vehicle?.year} {order.vehicle?.model}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          Stock #{order.vehicle?.stockId}
                        </div>
                      </td>

                      {/* Destination Dealer */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{order.dealerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{order.dealerId}</div>
                      </td>

                      {/* Carrier & ETA */}
                      <td className="py-2.5 px-3 text-[11px]">
                        <div className="font-medium text-slate-800">{order.vesselName || "RoRo Ocean Carrier"}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          ETA Port: {order.etaDeliveryDate || "Pending Vessel Booking"}
                        </div>
                      </td>

                      {/* Milestone Progress */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold text-slate-800 bg-slate-100 px-2 py-0.2 rounded border border-slate-200">
                            {order.currentMilestone.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {progressPct}%
                          </span>
                        </div>

                        {/* 8-stage progress track */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex gap-0.5">
                          {MILESTONES_ORDER.map((step, idx) => (
                            <div
                              key={step}
                              className={`h-full flex-1 transition-all ${idx <= currentIdx ? "bg-emerald-500" : "bg-slate-200"
                                }`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Total Landed Price */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        <div>${order.priceBreakdown?.totalBuyPriceNZD?.toLocaleString()} NZD</div>
                        {pendingCost ? (
                          <span className="inline-block mt-0.5 font-bold text-[10px] text-[#C3002F] bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            +${pendingCost.amountNZD.toLocaleString()} Repair Req
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal">Standard Wholesale CIF</span>
                        )}
                      </td>

                      {/* Order Dossier View */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            audio.playSubtleClick();
                            setSelectedOrderForDossier(order);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Order Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 7. TAB 4: Programme Reports & Multi-Dataset Export          */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {/* Executive Analytics Card */}
          <div className="bg-white rounded-[24px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Programme Operational Intelligence &amp; Data Exports
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Download live data feeds in native CSV and styled Microsoft Excel (XLSX) format for reporting, customs filing, and dealer network compliance.
                </p>
              </div>
            </div>

            {/* 4 Dataset Export Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Dataset 1: Stock Inventory */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Japanese Stock Inventory</span>
                  <Car className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Full catalogue roster with Stock ID, VIN, year, grade, odometer, FOB JPY, and Zone 1-5 buy prices.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleExportCSV(
                        "Nissan_Authorised_Stock",
                        ["Stock ID", "Model", "Year", "VIN", "Grade", "Odometer KM", "FOB JPY", "Status"],
                        vehicles.map((v) => [v.stockId, v.model, v.year, v.vinChassis, v.grade, v.odometerKm, v.fobPriceJPY, v.status])
                      )
                    }
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleExportXLSX(
                        "Stock_Inventory",
                        ["Stock ID", "Model", "Year", "VIN", "Grade", "Odometer KM", "FOB JPY", "Status"],
                        vehicles.map((v) => [v.stockId, v.model, v.year, v.vinChassis, v.grade, v.odometerKm, v.fobPriceJPY, v.status])
                      )
                    }
                    className="flex-1 py-2 px-3 bg-[#C3002F] hover:bg-[#A10026] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-white" />
                    <span>XLSX</span>
                  </button>
                </div>
              </div>

              {/* Dataset 2: 24h Exclusivity Queue */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">24h Exclusivity Queue</span>
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Active and historical hold requests, dealer identification, locked price snapshot, and cancellation covenants.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleExportCSV(
                        "Nissan_Exclusivity_Holds",
                        ["Reservation ID", "Vehicle ID", "Model", "Dealer", "Expires At", "Total Buy NZD", "Status"],
                        reservations.map((r) => [
                          r.id,
                          r.vehicleId,
                          r.vehicle?.model || "",
                          r.dealerName,
                          r.expiresAt,
                          r.priceSnapshot?.totalBuyPriceNZD || 0,
                          r.status,
                        ])
                      )
                    }
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleExportXLSX(
                        "Exclusivity_Holds",
                        ["Reservation ID", "Vehicle ID", "Model", "Dealer", "Expires At", "Total Buy NZD", "Status"],
                        reservations.map((r) => [
                          r.id,
                          r.vehicleId,
                          r.vehicle?.model || "",
                          r.dealerName,
                          r.expiresAt,
                          r.priceSnapshot?.totalBuyPriceNZD || 0,
                          r.status,
                        ])
                      )
                    }
                    className="flex-1 py-2 px-3 bg-[#C3002F] hover:bg-[#A10026] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-white" />
                    <span>XLSX</span>
                  </button>
                </div>
              </div>

              {/* Dataset 3: Wholesale Shipping Orders */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Wholesale Orders Pipeline</span>
                  <Ship className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Allocated orders, ocean vessels, 8 door-to-door milestones, delivery ETAs, and defect remediation.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleExportCSV(
                        "Nissan_Wholesale_Orders",
                        ["Order Number", "Model", "Dealer", "Vessel", "Milestone", "ETA Delivery", "Total Landed NZD"],
                        orders.map((o) => [
                          o.orderNumber,
                          o.vehicle?.model || "",
                          o.dealerName,
                          o.vesselName || "",
                          o.currentMilestone,
                          o.etaDeliveryDate || "",
                          o.priceBreakdown?.totalBuyPriceNZD || 0,
                        ])
                      )
                    }
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleExportXLSX(
                        "Wholesale_Orders",
                        ["Order Number", "Model", "Dealer", "Vessel", "Milestone", "ETA Delivery", "Total Landed NZD"],
                        orders.map((o) => [
                          o.orderNumber,
                          o.vehicle?.model || "",
                          o.dealerName,
                          o.vesselName || "",
                          o.currentMilestone,
                          o.etaDeliveryDate || "",
                          o.priceBreakdown?.totalBuyPriceNZD || 0,
                        ])
                      )
                    }
                    className="flex-1 py-2 px-3 bg-[#C3002F] hover:bg-[#A10026] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-white" />
                    <span>XLSX</span>
                  </button>
                </div>
              </div>

              {/* Dataset 4: Franchise Dealership Directory */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Franchise Dealer Directory</span>
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Authorised dealer network listing, legal trading names, NZBN codes, pricing zone assignments, and contacts.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleExportCSV(
                        "Nissan_Franchise_Dealers",
                        ["Dealer Code", "Trading Name", "NZBN", "Pricing Zone", "Primary Contact", "Email", "Status"],
                        dealers.map((d) => [
                          d.dealerCode,
                          d.legalTradingName,
                          d.nzbn,
                          d.pricingZoneId,
                          d.primaryContactName,
                          d.primaryContactEmail,
                          d.status,
                        ])
                      )
                    }
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-slate-400" />
                    <span>CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleExportXLSX(
                        "Franchise_Dealers",
                        ["Dealer Code", "Trading Name", "NZBN", "Pricing Zone", "Primary Contact", "Email", "Status"],
                        dealers.map((d) => [
                          d.dealerCode,
                          d.legalTradingName,
                          d.nzbn,
                          d.pricingZoneId,
                          d.primaryContactName,
                          d.primaryContactEmail,
                          d.status,
                        ])
                      )
                    }
                    className="flex-1 py-2 px-3 bg-[#C3002F] hover:bg-[#A10026] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3 h-3 text-white" />
                    <span>XLSX</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 8. MODAL: Read-Only Vehicle Dossier Modal                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedVehicleForDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    #{selectedVehicleForDossier.stockId}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Authorised Stock Roster
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {selectedVehicleForDossier.year} {selectedVehicleForDossier.make} {selectedVehicleForDossier.model}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicleForDossier(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vehicle Photos Preview */}
            <div className="h-44 sm:h-52 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center overflow-hidden">
              <img
                src={selectedVehicleForDossier.images?.[0] || "/images/cars/note.png"}
                alt={selectedVehicleForDossier.model}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Specifications Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Auction Grade</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{selectedVehicleForDossier.grade}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Odometer</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  {selectedVehicleForDossier.odometerKm.toLocaleString()} km
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FOB (Japan)</span>
                <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                  ¥{selectedVehicleForDossier.fobPriceJPY.toLocaleString()}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Zone 1 Buy Price</span>
                <span className="font-mono font-bold text-[#C3002F] text-sm mt-0.5 block">
                  ${calculateLandedPrice(selectedVehicleForDossier.fobPriceJPY, "ZONE_1").totalBuyPriceNZD.toLocaleString()} NZD
                </span>
              </div>
            </div>

            {/* Read-Only Notice Bar */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span className="font-medium">
                Governance Clearance: Read-Only. Transactional exclusivity holds can be placed only by authorised dealers.
              </span>
              <button
                type="button"
                onClick={() => setSelectedVehicleForDossier(null)}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 9. MODAL: Read-Only Order Milestone Dossier Modal           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {selectedOrderForDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150 font-sans max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {selectedOrderForDossier.orderNumber}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Wholesale Order Record
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {selectedOrderForDossier.vehicle?.year} {selectedOrderForDossier.vehicle?.model}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderForDossier(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Door to Door Stepper */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Door-to-Door RoRo Logistics Milestones
              </span>
              <div className="space-y-1.5">
                {MILESTONES_ORDER.map((stage, idx) => {
                  const currentIdx = MILESTONES_ORDER.indexOf(selectedOrderForDossier.currentMilestone);
                  const isCompleted = idx < currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div
                      key={stage}
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs ${isCurrent
                        ? "bg-slate-900 text-white border-slate-900 font-bold"
                        : isCompleted
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono border">
                          {isCompleted ? "✓" : idx + 1}
                        </span>
                        <span>{stage.replace(/_/g, " ")}</span>
                      </div>
                      <span className="font-mono text-[10px]">
                        {isCurrent ? "Current Milestone" : isCompleted ? "Completed" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrderForDossier(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

