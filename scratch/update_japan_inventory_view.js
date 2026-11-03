const fs = require('fs');

const filePath = 'components/japan/JapanInventoryView.tsx';

const newCode = `"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Vehicle } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import JapanInventoryDetailsView from "./JapanInventoryDetailsView";
import {
  Search,
  Plus,
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  ArrowUpDown,
  Car,
  Filter,
  Eye,
  MoreVertical,
  Star,
  MapPin,
  Clock,
  Layers,
  Upload,
} from "lucide-react";

interface JapanInventoryViewProps {
  onNavigateAdd: () => void;
  onNavigateBatch: () => void;
}

export default function JapanInventoryView({
  onNavigateAdd,
  onNavigateBatch,
}: JapanInventoryViewProps) {
  const { vehicles, toggleVehicleStatus } = useProgramme();
  const searchParams = useSearchParams();
  const urlVehicleId = searchParams?.get("id") || searchParams?.get("vehicleId") || searchParams?.get("stockId");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<Vehicle | null>(() => {
    if (urlVehicleId) {
      return vehicles.find((v) => v.id === urlVehicleId || v.stockId === urlVehicleId) || null;
    }
    return null;
  });

  const handleToggleStatus = (vehicleId: string) => {
    audio.playSubtleClick();
    toggleVehicleStatus(vehicleId);
  };

  // If a vehicle is selected, display the full inner details page (Not a modal)
  if (selectedVehicleForDetails) {
    return (
      <JapanInventoryDetailsView
        vehicleId={selectedVehicleForDetails.id}
        onBack={() => setSelectedVehicleForDetails(null)}
        onToggleStatus={handleToggleStatus}
      />
    );
  }

  const filteredVehicles = vehicles.filter((v) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchStock = v.stockId.toLowerCase().includes(q);
      const matchModel = v.model.toLowerCase().includes(q);
      const matchVin = v.vinChassis.toLowerCase().includes(q);
      if (!matchStock && !matchModel && !matchVin) return false;
    }

    if (statusFilter !== "ALL" && v.status !== statusFilter) {
      return false;
    }

    return true;
  });

  const availableCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const reservedCount = vehicles.filter((v) => v.status === "RESERVED").length;
  const withdrawnCount = vehicles.filter((v) => v.status === "WITHDRAWN").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner                                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
              Japan Export Stock Control
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
              Yokohama &amp; Kobe Dispatch
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Export Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nissan Motor Co. Japan · Central vehicle repository, yard marshalling, and franchise publication controls.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onNavigateBatch();
            }}
            className="btn-outline text-xs py-2 px-3.5"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Batch Upload</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onNavigateAdd();
            }}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white text-xs font-bold transition-all shadow-[0_4px_16px_rgba(225,29,72,0.3)] cursor-pointer flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Executive 4-KPI Metric Strip                             */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Total Listed
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {vehicles.length}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Yokohama &amp; Kobe Bays
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Available to NZ
          </span>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {availableCount}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Franchise Catalog Active
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Dealer Reserved
          </span>
          <div className="text-2xl font-black text-amber-600 font-mono">
            {reservedCount}
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            24h Atomic Exclusivity
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
            Primary Staging Yard
          </span>
          <div className="text-xl font-black text-slate-900 truncate">
            Yokohama Terminal
          </div>
          <span className="text-xs text-slate-500 font-medium block truncate">
            Bay 14 Marshalling Base
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Search & Status Filter Toolbar                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stock ID, chassis VIN, or model..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-auto overflow-x-auto text-xs">
          {[
            { id: "ALL", label: "All Units", count: vehicles.length },
            { id: "AVAILABLE", label: "Available", count: availableCount },
            { id: "RESERVED", label: "Reserved", count: reservedCount },
            { id: "WITHDRAWN", label: "Withdrawn", count: withdrawnCount },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setStatusFilter(st.id);
              }}
              className={\`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 \${
                statusFilter === st.id
                  ? "bg-white text-slate-900 shadow-2xs font-black"
                  : "text-slate-500 hover:text-slate-800 font-medium"
              }\`}
            >
              <span>{st.label}</span>
              <span className="text-[10px] font-mono text-slate-400 font-normal">
                ({st.count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Inventory Table (Clean, Refined Light Header)             */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto touch-scroll navy-scrollbar">
          <table className="w-full text-left text-xs min-w-[760px]">
            {/* Clean Light Executive Table Header (Replaced Heavy Solid Dark) */}
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Vehicle / Model</th>
                <th className="py-3.5 px-4">Stock ID &amp; VIN</th>
                <th className="py-3.5 px-4">Grade &amp; Odo</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">FOB Price (JPY)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => {
                const isAvailable = vehicle.status === "AVAILABLE";
                const isReserved = vehicle.status === "RESERVED";
                const isWithdrawn = vehicle.status === "WITHDRAWN";

                return (
                  <tr
                    key={vehicle.id}
                    onClick={() => {
                      audio.playSubtleClick();
                      setSelectedVehicleForDetails(vehicle);
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Vehicle & Model */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={vehicle.images?.[0] || "/images/cars/kicks.png"}
                          alt={vehicle.model || "Vehicle"}
                          className="w-14 h-10 object-contain rounded-xl border border-slate-200 bg-slate-50 p-0.5 shrink-0 select-none group-hover:scale-105 transition-transform"
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#E11D48] transition-colors">
                            {vehicle.year} {vehicle.model}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {vehicle.grade || "Standard Edition"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stock ID & VIN */}
                    <td className="py-4 px-4 font-mono">
                      <div className="font-bold text-slate-800">#{vehicle.stockId}</div>
                      <div className="text-[10px] text-slate-400">{vehicle.vinChassis}</div>
                    </td>

                    {/* Grade & Odometer */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Grade {vehicle.auctionGrade}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {vehicle.odometerKm.toLocaleString()} km
                      </div>
                    </td>

                    {/* Yard Location */}
                    <td className="py-4 px-4 text-slate-600 truncate max-w-[150px]">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{vehicle.location}</span>
                      </div>
                    </td>

                    {/* FOB Price JPY */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-900 text-sm">
                      ¥{vehicle.fobPriceJPY.toLocaleString()}
                    </td>

                    {/* Status Pill Badge */}
                    <td className="py-4 px-4">
                      {isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                          AVAILABLE
                        </span>
                      ) : isReserved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-50 text-amber-800 border border-amber-300">
                          <Clock className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                          <span>RESERVED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-600 border border-slate-200">
                          WITHDRAWN
                        </span>
                      )}
                    </td>

                    {/* Action Column - Strictly Right Aligned with Clean Details Button */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2.5">
                        {/* Toggle or Status Hint */}
                        {isReserved ? (
                          <span className="text-[11px] font-mono text-amber-700 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60 font-semibold">
                            Held by Dealer
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStatus(vehicle.id);
                            }}
                            className={\`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer \${
                              isAvailable
                                ? "border-slate-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }\`}
                          >
                            {isAvailable ? "Withdraw" : "Publish"}
                          </button>
                        )}

                        {/* Details Action Button - Rightmost */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.playSubtleClick();
                            setSelectedVehicleForDetails(vehicle);
                          }}
                          className="btn-outline text-xs py-1.5 px-3 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          <span>Details</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(filePath, newCode, 'utf8');
console.log("Successfully overhauled JapanInventoryView.tsx!");

