"use client";

import React, { useState } from "react";
import { Order, AdditionalCostItem } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  X,
  AlertTriangle,
  Upload,
  FileCheck2,
  DollarSign,
  ShieldAlert,
} from "lucide-react";

interface AdditionalCostCreatorModalProps {
  order: Order | null;
  onClose: () => void;
  onSubmit: (orderId: string, costItem: AdditionalCostItem) => void;
}

export default function AdditionalCostCreatorModal({
  order,
  onClose,
  onSubmit,
}: AdditionalCostCreatorModalProps) {
  const [description, setDescription] = useState(
    "Front brake rotor skimming required for MR2A entry compliance certification pass."
  );
  const [amountNZD, setAmountNZD] = useState(380);
  const [evidenceFileName, setEvidenceFileName] = useState("mr2a_rotor_defects_scan.jpg");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    audio.playSubtleClick();

    const newCostItem: AdditionalCostItem = {
      id: `COST_${Date.now()}`,
      type: "COMPLIANCE_REPAIR",
      description,
      amountNZD,
      evidenceDocumentUrl: "https://example.com/reports/evidence_scan.pdf",
      status: "PENDING_DEALER_APPROVAL",
      proposedAt: new Date().toISOString(),
      notes: "Flagged during entry compliance physical inspection at Auckland compliance facility.",
    };

    setTimeout(() => {
      audio.playSuccessChime();
      setIsSubmitting(false);
      onSubmit(order.id, newCostItem);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-hover border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A1322] text-white flex items-center justify-between border-b border-[#1B2A42]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-white text-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Attach Compliance Variation (US-18)</h3>
              <p className="text-[10px] text-slate-400">Autohub Operations Defect Logging</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1B2A42] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {/* Order Context */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between font-mono font-bold text-slate-900">
              <span>{order.orderNumber}</span>
              <span className="text-[#E11D48]">{order.dealerName}</span>
            </div>
            <div className="text-slate-600">
              {order.vehicle.year} {order.vehicle.make} {order.vehicle.model} ({order.vehicle.vinChassis})
            </div>
          </div>

          {/* Defect Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              Repair Description (MR2A Compliance Requirement)
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs text-slate-800"
              placeholder="Detail the unexpected mechanical or compliance defect requiring work..."
            />
          </div>

          {/* Cost Amount NZD */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              Quoted Remediation Cost (NZD)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                required
                min={1}
                value={amountNZD}
                onChange={(e) => setAmountNZD(parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono text-xs text-slate-900"
              />
            </div>
          </div>

          {/* Photographic Evidence Attachment */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              Photographic / Inspection Report Evidence
            </label>
            <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span className="font-mono text-slate-700">{evidenceFileName}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">1.2 MB · Attached</span>
            </div>
          </div>

          {/* Terms Policy Notice */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Per Autohub Terms of Trade (v2026.1), unexpected entry repairs require explicit dealer authorization before work proceeds and cannot be invoiced without dealer consent.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting ? "Submitting..." : "Submit Variation for Dealer Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

