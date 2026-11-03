"use client";

import React, { useState } from "react";
import { useProgramme } from "@/lib/programme-context";
import { ZoneId, ReservationConfig } from "@/lib/types";
import {
  DEFAULT_PRICING_CONFIG,
  OFFICIAL_PRICING_ZONES,
  PricingConfig,
} from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  RotateCcw,
  Save,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sliders,
  Lock,
} from "lucide-react";

interface AdminPricingConfigViewProps {
  onNavigateTab?: (tabId: string) => void;
}

export default function AdminPricingConfigView({ }: AdminPricingConfigViewProps = {}) {
  const {
    pricingConfig,
    updatePricingConfig,
    resetPricingConfig,
    reservationConfig,
    updateReservationConfig,
  } = useProgramme();

  // Local draft state for editing amounts
  const [draftConfig, setDraftConfig] = useState<PricingConfig>(pricingConfig);
  const [draftReservationConfig, setDraftReservationConfig] = useState<ReservationConfig>(reservationConfig);
  const [referenceFobJPY, setReferenceFobJPY] = useState<number>(2000000);
  const [selectedZone, setSelectedZone] = useState<ZoneId>("ZONE_5");
  const [showAllZones, setShowAllZones] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleNumericChange = (
    key: keyof Omit<PricingConfig, "zoneDeliveryMatrix">,
    value: number
  ) => {
    setDraftConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleZoneChange = (zoneId: ZoneId, value: number) => {
    setDraftConfig((prev) => ({
      ...prev,
      zoneDeliveryMatrix: {
        ...prev.zoneDeliveryMatrix,
        [zoneId]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    audio.playSuccessChime();
    updatePricingConfig(draftConfig);
    updateReservationConfig(draftReservationConfig);
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    audio.playSubtleClick();
    setDraftConfig(DEFAULT_PRICING_CONFIG);
    resetPricingConfig();
    setHasChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Calculations for live breakdown
  const exchangeRate = draftConfig.exchangeRateJPYtoNZD || 0.01085;
  const fobNZD = Math.round(referenceFobJPY * exchangeRate);
  const oceanFreight = Number(draftConfig.oceanFreightNZD) || 0;
  const customsFee = Number(draftConfig.customsProcessingNZD) || 0;
  const compliance = Number(draftConfig.complianceInspectionNZD) || 0;
  const zoneDelivery = Number(draftConfig.zoneDeliveryMatrix?.[selectedZone]) || 0;
  const programmeFee = Number(draftConfig.programmeFeeNZD) || 0;

  // 15% GST on CIF base (FOB + Freight + Customs processing fee)
  const taxableImportBase = fobNZD + oceanFreight + customsFee;
  const gstNZD = Math.round(taxableImportBase * (draftConfig.gstRate || 0.15));
  const customsAndGstCombined = customsFee + gstNZD;

  // Total Buy Price (Landed, Complied, and Delivered)
  const totalBuyPrice =
    fobNZD +
    oceanFreight +
    customsAndGstCombined +
    compliance +
    zoneDelivery +
    programmeFee;

  const zoneKeys: ZoneId[] = ["ZONE_1", "ZONE_2", "ZONE_3", "ZONE_4", "ZONE_5"];

  // Fixed Cost Profile Pricing (Tariff Subtotal for Selected Zone)
  const fixedCostProfileNZD = oceanFreight + customsFee + compliance + zoneDelivery + programmeFee;

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-200 font-sans text-slate-800 pb-16">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Clean Top Header Bar                                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Pricing Configuration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure wholesale landed pricing components, delivery rates, and programme fees.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Reset to default settings"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges && !saveSuccess}
            className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${hasChanges
              ? "bg-[#0A0A0A] hover:bg-[#444444] text-white active:scale-[0.98]"
              : "bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
              }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{hasChanges ? "Save Changes" : "Saved"}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pricing configuration saved and applied across the network.</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveSuccess(false)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Core Pricing Component Table                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4 sm:px-6">Pricing Component</th>
              <th className="py-3 px-4 w-44 sm:w-52">Amount (Editable)</th>
              <th className="py-3 px-4 sm:px-6 text-right">Calculated / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* 1. FOB Acquisition Price */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 sm:px-6 font-medium text-slate-900">
                FOB Acquisition Price
              </td>
              <td className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                    ¥
                  </span>
                  <input
                    type="number"
                    step="50000"
                    value={referenceFobJPY}
                    onChange={(e) => {
                      setReferenceFobJPY(Math.max(0, Number(e.target.value)));
                      setHasChanges(true);
                    }}
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono font-medium text-slate-700">
                ~${fobNZD.toLocaleString()} NZD
              </td>
            </tr>

            {/* 2. Ocean Freight & Port Handling */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 sm:px-6 font-medium text-slate-900">
                Ocean Freight &amp; Port Handling
              </td>
              <td className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="25"
                    value={draftConfig.oceanFreightNZD}
                    onChange={(e) => handleNumericChange("oceanFreightNZD", Number(e.target.value))}
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono font-medium text-slate-700">
                ${oceanFreight.toLocaleString()} NZD
              </td>
            </tr>

            {/* 3. Customs Processing & GST */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 sm:px-6">
                <div className="font-medium text-slate-900">Customs Processing &amp; GST</div>
              </td>
              <td className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="10"
                    value={draftConfig.customsProcessingNZD}
                    onChange={(e) => handleNumericChange("customsProcessingNZD", Number(e.target.value))}
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono font-medium text-slate-700">
                ${customsAndGstCombined.toLocaleString()} NZD
              </td>
            </tr>

            {/* 4. MR2A Compliance & Inspection */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 sm:px-6 font-medium text-slate-900">
                MR2A Compliance &amp; Inspection
              </td>
              <td className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="20"
                    value={draftConfig.complianceInspectionNZD}
                    onChange={(e) => handleNumericChange("complianceInspectionNZD", Number(e.target.value))}
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono font-medium text-slate-700">
                ${compliance.toLocaleString()} NZD
              </td>
            </tr>

            {/* 5. Domestic NZ Delivery */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 sm:px-6">
                <div className="font-medium text-slate-900">Domestic NZ Delivery</div>
                {/* Zone selector pill buttons */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {zoneKeys.map((zid) => {
                    const isSelected = selectedZone === zid;
                    const code = zid.replace("ZONE_", "Z");
                    return (
                      <button
                        key={zid}
                        type="button"
                        onClick={() => setSelectedZone(zid)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${isSelected
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {code}
                      </button>
                    );
                  })}
                  <span className="text-[11px] text-slate-500 ml-1">
                    {OFFICIAL_PRICING_ZONES[selectedZone]?.coverage || selectedZone}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="50"
                    value={draftConfig.zoneDeliveryMatrix?.[selectedZone] ?? 1750}
                    onChange={(e) => handleZoneChange(selectedZone, Number(e.target.value))}
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono font-medium text-slate-700">
                ${zoneDelivery.toLocaleString()} NZD
              </td>
            </tr>

            {/* 6. Nissan Programme Component */}
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="py-3 px-4 sm:px-6">
                <div className="font-medium text-slate-900">Nissan Programme Component</div>

              </td>
              <td className="py-3 px-4">
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="25"
                    value={draftConfig.programmeFeeNZD}
                    onChange={(e) => handleNumericChange("programmeFeeNZD", Number(e.target.value))}
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-mono font-bold text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </td>
              <td className="py-3 px-4 sm:px-6 text-right">
                <span className="font-mono font-medium text-slate-700">
                  ${programmeFee.toLocaleString()} NZD
                </span>
                <span className="text-[10px] text-slate-400 block">Configured amount</span>
              </td>
            </tr>

            {/* 7. Fixed Cost Profile Pricing (Tariff Subtotal) */}
            <tr className="bg-slate-50/70 border-t border-slate-200">
              <td className="py-3 px-4 sm:px-6">
                <div className="font-bold text-slate-900 text-xs sm:text-sm">
                  Fixed Cost Profile Pricing
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-block px-2.5 py-1 rounded bg-slate-200/80 text-slate-700 text-xs font-semibold font-mono">
                  Tariff Profile Subtotal
                </span>
              </td>
              <td className="py-3 px-4 sm:px-6 text-right font-mono font-bold text-slate-900">
                +${fixedCostProfileNZD.toLocaleString()} NZD
              </td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Collapsible 5-Zone Towing Matrix (Minimal)               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-3">
        <button
          type="button"
          onClick={() => setShowAllZones(!showAllZones)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-950 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>All 5 Geographic Delivery Zones</span>
            <span className="text-[11px] font-normal text-slate-400">
              (Quick view &amp; edit)
            </span>
          </div>
          {showAllZones ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {showAllZones && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 animate-in fade-in">
            {zoneKeys.map((zid) => {
              const z = OFFICIAL_PRICING_ZONES[zid];
              const cost = draftConfig.zoneDeliveryMatrix?.[zid] ?? z.deliveryCostNZD;
              const isSelected = selectedZone === zid;

              return (
                <div
                  key={zid}
                  onClick={() => setSelectedZone(zid)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${isSelected
                    ? "bg-slate-50 border-slate-900 ring-1 ring-slate-900"
                    : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-800 mb-1">
                    <span>{zid.replace("ZONE_", "Z")}</span>
                    <span className="font-normal text-slate-400 text-[10px]">
                      {z.zoneName.split("-")[1]?.trim() || ""}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[11px] font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="50"
                      value={cost}
                      onChange={(e) => handleZoneChange(zid, Number(e.target.value))}
                      className="w-full pl-5 pr-1.5 py-1 rounded border border-slate-200 bg-white font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Reservation Expiry & Warning Rules (US-15)              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 text-[#C3002F]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Reservation Expiry &amp; Warning Rules
              </h2>
              <p className="text-[11px] text-slate-500">
                Programme parameters governing dealer exclusivity windows and auto-release lifecycle
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
            Active Rules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Default Hold Duration */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800">
                Default Exclusivity Window
              </label>
              <span className="font-mono font-bold text-slate-900">
                {draftReservationConfig.defaultHoldHours} Hours
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="72"
              step="6"
              value={draftReservationConfig.defaultHoldHours}
              onChange={(e) => {
                setDraftReservationConfig((prev) => ({
                  ...prev,
                  defaultHoldHours: Number(e.target.value),
                }));
                setHasChanges(true);
              }}
              className="w-full accent-[#C3002F] cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Standard dealer exclusivity period upon reservation request submission.
            </p>
          </div>

          {/* Warning Notification Threshold */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800">
                Warning Notification Threshold
              </label>
              <span className="font-mono font-bold text-amber-700">
                {draftReservationConfig.warningThresholdHours} Hours Prior
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              step="1"
              value={draftReservationConfig.warningThresholdHours}
              onChange={(e) => {
                setDraftReservationConfig((prev) => ({
                  ...prev,
                  warningThresholdHours: Number(e.target.value),
                }));
                setHasChanges(true);
              }}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Dispatches reminder notice and marks countdown with warning pulse badge.
            </p>
          </div>

          {/* Auto-Release Toggle */}
          <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block">
                Automatic Stock Release on Expiry
              </span>
              <span className="text-[10px] text-slate-500 block">
                Returns vehicles to open catalogue if unconfirmed at window elapse
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={draftReservationConfig.autoReleaseOnExpiry}
                onChange={(e) => {
                  setDraftReservationConfig((prev) => ({
                    ...prev,
                    autoReleaseOnExpiry: e.target.checked,
                  }));
                  setHasChanges(true);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C3002F]" />
            </label>
          </div>

          {/* Max Active Holds per Dealership */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800">
                Max Concurrent Holds per Dealership
              </label>
              <span className="font-mono font-bold text-slate-900">
                {draftReservationConfig.maxActiveHoldsPerDealer} Units
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={draftReservationConfig.maxActiveHoldsPerDealer}
              onChange={(e) => {
                setDraftReservationConfig((prev) => ({
                  ...prev,
                  maxActiveHoldsPerDealer: Number(e.target.value),
                }));
                setHasChanges(true);
              }}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">
              Prevents monopolisation of certified Japan inventory.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
