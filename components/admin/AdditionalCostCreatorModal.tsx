"use client";

import React, { useState, useRef } from "react";
import { Order, AdditionalCostItem } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  X,
  AlertTriangle,
  Upload,
  FileCheck2,
  DollarSign,
  ShieldAlert,
  Paperclip,
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
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
  } | null>({
    name: "mr2a_rotor_defects_scan.jpg",
    size: "1.2 MB",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!order) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      setAttachedFile({
        name: file.name,
        size: sizeStr,
      });
      audio.playSoftChime();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      setAttachedFile({
        name: file.name,
        size: sizeStr,
      });
      audio.playSoftChime();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    audio.playSubtleClick();

    const newCostItem: AdditionalCostItem = {
      id: `COST_${Date.now()}`,
      type: "COMPLIANCE_REPAIR",
      description,
      amountNZD,
      evidenceDocumentUrl: attachedFile?.name || "evidence_scan.pdf",
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
      <div className="relative w-full max-w-lg bg-white rounded-[24px] border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Attach Additional Cost</h3>
              <p className="text-[11px] text-slate-500 font-mono">Autohub Operations Defect Logging</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Order Context */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex justify-between font-mono font-bold text-slate-900">
              <span>{order.orderNumber}</span>
              <span className="text-[#C3002F]">{order.dealerName}</span>
            </div>
            <div className="text-slate-600">
              {order.vehicle.year} {order.vehicle.make} {order.vehicle.model} ({order.vehicle.vinChassis})
            </div>
          </div>

          {/* Defect Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              Repair Description (MR2A Compliance Requirement) *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs text-slate-800 transition-all shadow-xs"
              placeholder="Detail the unexpected mechanical or compliance defect requiring work..."
            />
          </div>

          {/* Cost Amount NZD */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
              Quoted Remediation Cost (NZD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                required
                min={1}
                value={amountNZD}
                onChange={(e) => setAmountNZD(parseInt(e.target.value) || 0)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs text-slate-900 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Attached File Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                Attached File / Evidence Document
              </label>
              <span className="text-[10px] text-slate-400 font-mono">PDF, PNG, JPG (Max 15MB)</span>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
            />

            {attachedFile ? (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-900 block truncate">
                      {attachedFile.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {attachedFile.size}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                        Attached
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  isDragging
                    ? "border-[#C3002F] bg-red-50/50"
                    : "border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-400"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-500">
                  <Paperclip className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-700 block">
                    Click to attach file or drag &amp; drop
                  </span>
                  <span className="text-[11px] text-slate-400 block font-sans">
                    Attach photographic evidence or inspection report scan
                  </span>
                </div>
              </div>
            )}
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
              className="px-6 py-2 rounded-xl bg-[#C3002F] hover:bg-[#9B0026] text-white font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? "Submitting..." : "Submit Variation for Dealer Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
