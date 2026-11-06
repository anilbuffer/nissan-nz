"use client";

import React from "react";
import { Vehicle, UserRole } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { COMPONENT_B_BREAKDOWN } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import { X, Lock, CheckCircle2 } from "lucide-react";

interface PricingComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  componentA: number;
  componentB: number;
  roleOverride?: UserRole;
}

export default function PricingComponentModal({
  isOpen,
  onClose,
  vehicle,
  componentA,
  componentB,
  roleOverride,
}: PricingComponentModalProps) {
  const { currentUser } = useAuth();
  if (!isOpen) return null;

  const role: UserRole = roleOverride || currentUser?.role || "DEALER_USER";
  const isApplicant = role === "DEALER_APPLICANT";
  const isJapan = role === "NISSAN_JAPAN";
  const fobJPY = vehicle.fobPriceJPY || 2186175;
  const totalAB = componentA + componentB;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-breakdown-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/40 backdrop-blur-xs overflow-hidden animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden my-auto max-h-[92vh] sm:max-h-[85vh] flex flex-col font-sans">
        {/* ─────────────────────────────────────────────────────────── */}
        {/* 1. Header (Clean & Minimalist, Ultra-Responsive)            */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2
              id="pricing-breakdown-title"
              className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 truncate"
            >
              Pricing Component Breakdown
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
              {vehicle.make} {vehicle.model} · Stock #{vehicle.stockId?.replace(/^#/, "")}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Close"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* 2. Scrollable Body: Role-Based [A + B] or Japan Baseline    */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="px-3 sm:px-6 py-3 sm:py-5 overflow-y-auto flex-1 space-y-3 sm:space-y-4 text-slate-800">
          {/* APPLICANT RESTRICTION NOTICE */}
          {isApplicant ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Lock className="w-4 h-4 text-slate-600" />
                <span>Commercial Pricing Restricted</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                Detailed commercial landed price breakdowns are restricted to verified franchise dealerships. This section unlocks upon account verification by Autohub NZ Operations.
              </p>
            </div>
          ) : isJapan ? (
            /* JAPAN PORTAL CONFIDENTIAL EXPORT BASELINE VIEW */
            <div className="space-y-3 sm:space-y-4">
              {/* Table Card with Outlines & Dividers */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                <div className="bg-slate-50/90 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-900 tracking-wider uppercase min-w-0 truncate">
                    Japanese Baseline Component
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 whitespace-nowrap">
                    Amount (JPY)
                  </span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-3 sm:px-4 py-2.5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="font-normal text-slate-600 text-xs">
                      Vehicle Purchase (Official Auction Settlement)
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap">
                      ¥{Math.round(fobJPY * 0.92).toLocaleString()} JPY
                    </span>
                  </div>

                  <div className="px-3 sm:px-4 py-2.5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="font-normal text-slate-600 text-xs">
                      Pre-Export JEVIC Digital Odometer &amp; Customs
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap">
                      ¥{Math.round(fobJPY * 0.08).toLocaleString()} JPY
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Summary Card */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-3 sm:p-4 flex items-center justify-between gap-2 shadow-2xs">
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    Total Japanese FOB Baseline
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">
                    Terminal export staging baseline prior to RoRo embarkation
                  </div>
                </div>
                <div className="font-mono text-base sm:text-xl font-bold text-slate-950 shrink-0 whitespace-nowrap">
                  ¥{fobJPY.toLocaleString()} JPY
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Strict confidentiality: Zero NZ landed pricing, customs, or margins are exposed.</span>
              </div>
            </div>
          ) : (
            /* Structured [A + B] Table Cell Outline & Divider Layout */
            <div className="space-y-3 sm:space-y-4">
              {/* ─── COMPONENT A TABLE CARD ─── */}
              <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs">
                {/* Table Header Bar */}
                <div className="bg-slate-50/90 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      A
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 tracking-wider uppercase truncate sm:whitespace-normal">
                      Component A · Vehicle &amp; Export
                    </span>
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 shrink-0 whitespace-nowrap text-right">
                    ${componentA.toLocaleString()} <span className="text-[10px] sm:text-xs text-slate-500 font-sans font-semibold">NZD</span>
                  </div>
                </div>

                {/* Table Cell Rows with Dividers (Clean Single-Line Premium Layout) */}
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-3 sm:px-4 py-2.5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="font-normal text-slate-600 text-xs">
                      FOB Purchase Price <span className="font-mono text-slate-500 font-normal text-xs">(¥{fobJPY.toLocaleString()} JPY)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap text-right">
                      ${componentA.toLocaleString()}
                    </span>
                  </div>

                  <div className="px-3 sm:px-4 py-2.5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="font-normal text-slate-600 text-xs">
                      JEVIC Odometer &amp; Export Clearance
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-[10px] uppercase tracking-wider shrink-0 whitespace-nowrap">
                      Included
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── COMPONENT B TABLE CARD ─── */}
              <div className="rounded-xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs">
                {/* Table Header Bar */}
                <div className="bg-slate-50/90 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      B
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 tracking-wider uppercase truncate sm:whitespace-normal">
                      Component B · Fixed NZ Import
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-mono text-[10px] sm:text-xs font-bold shrink-0 whitespace-nowrap">
                    ${componentB.toLocaleString()} Fixed
                  </span>
                </div>

                {/* Table Cell Rows with Dividers (Clean Single-Line Premium Layout) */}
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="px-3 sm:px-4 py-2.5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="font-normal text-slate-600 text-xs">
                      Ocean RoRo Freight (Japan → NZ)
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap text-right">
                      ${COMPONENT_B_BREAKDOWN.oceanFreightNZD.toLocaleString()}
                    </span>
                  </div>

                  <div className="px-3 sm:px-4 py-2.5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="font-normal text-slate-600 text-xs">
                      Marine Cargo Insurance &amp; Port Fees
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap text-right">
                      ${COMPONENT_B_BREAKDOWN.marineInsuranceAndPortNZD.toLocaleString()}
                    </span>
                  </div>

                  <div className="px-3 sm:px-4 py-2.5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="font-normal text-slate-600 text-xs">
                      MPI Biosecurity Border Treatment
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap text-right">
                      ${COMPONENT_B_BREAKDOWN.mpiBiosecurityNZD.toLocaleString()}
                    </span>
                  </div>

                  <div className="px-3 sm:px-4 py-2.5 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <span className="font-normal text-slate-600 text-xs">
                      NZTA MR2A Entry Compliance
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap text-right">
                      ${COMPONENT_B_BREAKDOWN.mr2aComplianceNZD.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Subtotal Footer */}
                <div className="bg-slate-50/60 px-3 sm:px-4 py-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Contractually Fixed Base</span>
                  <span className="font-mono font-bold text-slate-900 text-xs shrink-0 whitespace-nowrap">${componentB.toLocaleString()} NZD</span>
                </div>
              </div>

              {/* ─── FINAL WHOLESALE SETTLEMENT: ESTIMATED LANDED PRICE (A + B) ─── */}
              <div className="rounded-xl border border-slate-200/90 bg-slate-50 p-3 sm:p-4 flex items-center justify-between gap-2.5 shadow-2xs mt-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                    Estimated Landed Price <span className="whitespace-nowrap">(A + B)</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Delivered to Auckland port baseline
                  </div>
                </div>
                <div className="text-sm sm:text-base md:text-xl font-bold text-slate-950 shrink-0 whitespace-nowrap text-right flex items-baseline gap-1">
                  <span>${totalAB.toLocaleString()}</span>
                  <span className="text-[10px] sm:text-xs font-sans text-slate-500 font-bold">NZD</span>
                </div>
              </div>

              {/* Legal Footnote Disclaimer */}
              <p className="text-[10px] sm:text-[11px] text-slate-400 pt-0.5 leading-normal">
                Excludes On-Road Costs (ORC) &amp; dealer retail margin. Governed by Section 6.2 Master Terms.
              </p>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* 3. Fixed Footer: Dark Close Button (Nissan Brand Color)     */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-white border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#27272A] text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-2xs text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
