"use client";

import React from "react";
import { Check, AlertCircle } from "lucide-react";

export default function CommercialBoundaryView() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Clean Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pricing Terms & Boundary
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Nissan NZ Programme Commercial Boundary (v2026.1)
        </p>
      </div>

      {/* Two Column Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Included */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-soft space-y-3">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Included in Total Buy Price</h2>
            <span className="text-[10px] font-medium text-slate-500">Fixed Landed</span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold mt-0.5">•</span>
              <span>Vehicle acquisition cost (FOB Japan JPY to NZD)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold mt-0.5">•</span>
              <span>Standard door-to-door RoRo ocean freight</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold mt-0.5">•</span>
              <span>NZ Customs clearance & 15% NZ GST</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold mt-0.5">•</span>
              <span>Standard entry compliance pass (MR2A)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-900 font-bold mt-0.5">•</span>
              <span>Two standard NZ delivery carrier movements</span>
            </li>
          </ul>
        </div>

        {/* Separately Chargeable */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-soft space-y-3">
          <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Potential Additional Cost</h2>
            <span className="text-[10px] font-medium text-slate-500">Requires Prior Approval</span>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold mt-0.5">•</span>
              <span>Non-standard compliance repairs (rust, seatbelts, etc.)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold mt-0.5">•</span>
              <span>Specialized LVVTA engineering certification</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold mt-0.5">•</span>
              <span>Border flag bio-security decontamination</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold mt-0.5">•</span>
              <span>Demurrage storage or non-standard secondary transport</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-400 font-bold mt-0.5">•</span>
              <span>Dealer-requested accessories or modifications</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Policy statement */}
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <strong>Notice:</strong> Fixed landed pricing assumes a standard compliance pass. Any remedial repair work required to achieve MR2A certification will be evidenced with photographic documentation and quoted for dealer approval before work proceeds.
      </div>
    </div>
  );
}
