"use client";

import React, { useState } from "react";
import { Vehicle } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  Fingerprint,
  Gauge,
  ShieldCheck,
  Layers,
  ChevronRight,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

export type SpecTabId = "provenance" | "powertrain" | "compliance" | "listing";

export interface VehicleSpecificationsTabsProps {
  vehicle: Vehicle;
  isAdmin?: boolean;
  copiedVin?: boolean;
  onCopyVin?: (e?: any) => void;
  className?: string;
}

interface TabConfig {
  id: SpecTabId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabConfig[] = [
  {
    id: "provenance",
    title: "Provenance & Identification",
    icon: Fingerprint,
  },
  {
    id: "powertrain",
    title: "Powertrain & Mechanical",
    icon: Gauge,
  },
  {
    id: "compliance",
    title: "Compliance & Verification",
    icon: ShieldCheck,
  },
  {
    id: "listing",
    title: "Listing & Intake Profile",
    icon: Layers,
  },
];

export default function VehicleSpecificationsTabs({
  vehicle,
  isAdmin = false,
  copiedVin: externalCopiedVin,
  onCopyVin: externalOnCopyVin,
  className = "",
}: VehicleSpecificationsTabsProps) {
  const [activeTab, setActiveTab] = useState<SpecTabId>("provenance");
  const [localCopiedVin, setLocalCopiedVin] = useState(false);

  const copiedVin = externalCopiedVin !== undefined ? externalCopiedVin : localCopiedVin;

  const handleCopy = (e?: React.MouseEvent) => {
    if (externalOnCopyVin) {
      externalOnCopyVin(e);
    } else {
      audio.playSubtleClick();
      navigator.clipboard.writeText(vehicle.vinChassis);
      setLocalCopiedVin(true);
      setTimeout(() => setLocalCopiedVin(false), 2000);
    }
  };

  const handleTabClick = (tabId: SpecTabId) => {
    audio.playSubtleClick();
    setActiveTab(tabId);
  };

  const isAvailable = vehicle.status === "AVAILABLE";
  const isReserved = vehicle.status === "RESERVED";
  const isAllocated = vehicle.status === "ALLOCATED";
  const isWithdrawn = vehicle.status === "WITHDRAWN";
  const isSold = vehicle.status === "SOLD" || (vehicle.status as any) === "BUYED";

  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div
      className={`bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-5 ${className}`}
    >
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Bar: Vehicle Specifications & Listing Record     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-700" />
          <span>Vehicle Specifications &amp; Listing Record</span>
        </h3>
        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold self-start sm:self-auto">
          NZTA Certified
        </span>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Symmetric Layout: Left Tabs + Right Content             */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Side Card: Single-tile Tab Buttons */}
        <div className="lg:col-span-5 xl:col-span-4 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-200/70">
              Specification Categories
            </span>

            {/* Mobile / Tablet: Horizontal on small screens */}
            <div className="flex lg:hidden overflow-x-auto no-scrollbar gap-1.5 pb-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isActive
                        ? "bg-[#0A0A0A] text-white shadow-xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className="whitespace-nowrap">{tab.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop: Clean Single-tile Vertical Stack */}
            <div className="hidden lg:flex flex-col gap-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isActive
                        ? "bg-[#0A0A0A] text-white border-[#0A0A0A] shadow-xs"
                        : "bg-white hover:bg-slate-100/90 text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate">{tab.title}</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive ? "text-white translate-x-0.5" : "text-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimalist Unit Indicator on Left Side */}
          <div className="pt-2 border-t border-slate-200/70 hidden lg:flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Unit #{vehicle.stockId}</span>
            <span className="font-sans font-semibold text-slate-700">{vehicle.make || "Nissan"} {vehicle.model}</span>
          </div>
        </div>

        {/* Right Side Card: Specifications for Active Tab */}
        <div className="lg:col-span-7 xl:col-span-8 p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex flex-col justify-between space-y-3">
          <div className="space-y-2.5">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {currentTab.title}
              </span>
              {activeTab === "provenance" && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-900 cursor-pointer transition-colors"
                  title="Copy Chassis / VIN"
                >
                  {copiedVin ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy VIN</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* TAB 1: Provenance & Identification */}
            {activeTab === "provenance" && (
              <div className="divide-y divide-slate-200/60 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Chassis / VIN:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-900 select-all">
                      {vehicle.vinChassis}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      title="Copy VIN"
                      className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {copiedVin ? (
                        <Check className="w-3 h-3 text-slate-900" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Stock Serial ID:</span>
                  <span className="font-mono font-bold text-slate-800">#{vehicle.stockId}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Make &amp; Model:</span>
                  <span className="font-bold text-slate-900">
                    {vehicle.make || "Nissan"} {vehicle.model}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2 gap-4">
                  <span className="text-slate-500 shrink-0">Variant / Trim:</span>
                  <span className="font-semibold text-slate-800 text-right break-words">
                    {vehicle.grade}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Model Year:</span>
                  <span className="font-mono font-bold text-slate-900">{vehicle.year}</span>
                </div>
              </div>
            )}

            {/* TAB 2: Powertrain & Mechanical */}
            {activeTab === "powertrain" && (
              <div className="divide-y divide-slate-200/60 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Powertrain:</span>
                  <span className="font-semibold text-slate-900">{vehicle.fuelType}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Displacement:</span>
                  <span className="font-mono font-medium text-slate-800">
                    {vehicle.engineCc && vehicle.engineCc > 0
                      ? `${vehicle.engineCc.toLocaleString()} cc`
                      : "Electric Motor"}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Transmission:</span>
                  <span className="font-medium text-slate-800">{vehicle.transmission}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Drive System:</span>
                  <span className="font-mono font-bold text-slate-900">{vehicle.driveType || "2WD"}</span>
                </div>

                <div className="flex items-center justify-between py-2 gap-4">
                  <span className="text-slate-500 shrink-0">Exterior Colour:</span>
                  <span className="font-medium text-slate-800 text-right break-words">
                    {vehicle.color || "Factory Original"}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: Compliance & Verification */}
            {activeTab === "compliance" && (
              <div className="divide-y divide-slate-200/60 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">JEVIC Odometer:</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-slate-500" />
                    <span>Certified Pass</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">NZTA Entry:</span>
                  <span className="font-semibold text-slate-700 flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-slate-500" />
                    <span>MR2A Cleared</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Biosecurity / Rad:</span>
                  <span className="font-mono font-medium text-slate-700 text-[11px]">
                    Passed (&lt;0.08 µSv/h)
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Certified Date:</span>
                  <span className="font-mono text-slate-700">
                    {vehicle.inspectionDate || vehicle.createdAt}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Stock Reference:</span>
                  <span className="font-mono text-slate-700">{vehicle.stockReference}</span>
                </div>
              </div>
            )}

            {/* TAB 4: Listing & Intake Profile */}
            {activeTab === "listing" && (
              <div className="divide-y divide-slate-200/60 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Listing Status:</span>
                  {isAvailable ? (
                    <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      AVAILABLE
                    </span>
                  ) : isReserved ? (
                    <span className="font-bold text-amber-800 bg-amber-50 border border-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      RESERVED
                    </span>
                  ) : isAllocated ? (
                    <span className="font-bold text-sky-700 bg-sky-50 border border-sky-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      ALLOCATED
                    </span>
                  ) : isWithdrawn ? (
                    <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      WITHDRAWN
                    </span>
                  ) : isSold ? (
                    <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      SOLD
                    </span>
                  ) : (
                    <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono text-[10px] px-2 py-0.5 rounded-full">
                      {vehicle.status}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-2 gap-4">
                  <span className="text-slate-500 shrink-0">Yard Staging:</span>
                  <span
                    className="font-medium text-slate-800 text-[11px] text-right truncate max-w-[220px]"
                    title={vehicle.location}
                  >
                    {vehicle.location}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Created Date:</span>
                  <span className="font-mono text-slate-700 text-[11px]">{vehicle.createdAt}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Last Updated:</span>
                  <span className="font-mono text-slate-700 text-[11px]">{vehicle.updatedAt}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500">Pricing Basis:</span>
                  <span className="font-mono text-slate-800 font-bold text-[11px]">
                    {isAdmin
                      ? `${vehicle.purchasePriceBasis || "FOB"} (${vehicle.currency || "JPY"})`
                      : "Wholesale Landed (NZD)"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Minimalist Footer Status */}
          <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Verified Record</span>
            <span className="text-slate-600 font-sans font-medium">Japanese Export Intake Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
}
