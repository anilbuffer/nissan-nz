"use client";

import React, { useState, useRef } from "react";
import { Order, AdditionalCostItem } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  X,
  AlertTriangle,
  FileCheck2,
  Paperclip,
  Wrench,
  Send,
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
  // 1. Text field for Category entered manually
  const [category, setCategory] = useState("Non-Standard Compliance Repair");
  const [description, setDescription] = useState(
    "Front brake pad replacement, headlamp alignment & rotor skimming"
  );
  const [amountNZD, setAmountNZD] = useState<number | string>(380);
  const [notes, setNotes] = useState("VINZ Entry Inspection Dossier #MR2A-0924");
  const [error, setError] = useState<string | null>(null);

  // Attached evidence file state
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: string;
  } | null>({
    name: "MR2A_Compliance_Defect_Remediation.pdf",
    size: "1.4 MB",
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
    setError(null);

    if (!category.trim()) {
      setError("Please specify the additional cost category.");
      return;
    }

    if (!description.trim()) {
      setError("Please provide a description of the repair or work scope.");
      return;
    }

    const numAmount = Number(amountNZD);
    if (!numAmount || numAmount <= 0) {
      setError("Please specify a valid amount in NZD.");
      return;
    }

    setIsSubmitting(true);
    audio.playSubtleClick();

    // Submits with status "PENDING_DEALER_APPROVAL" so the relevant dealer can review and approve or reject it
    const newCostItem: AdditionalCostItem = {
      id: `COST_${Date.now()}`,
      type: category.trim(),
      description: description.trim(),
      amountNZD: numAmount,
      evidenceDocumentUrl: attachedFile?.name || undefined,
      status: "PENDING_DEALER_APPROVAL",
      proposedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    setTimeout(() => {
      audio.playSuccessChime();
      setIsSubmitting(false);
      onSubmit(order.id, newCostItem);
      onClose();
    }, 300);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200 font-sans"
    >
      <div className="relative w-full max-w-xl bg-white rounded-[24px] border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col animate-in zoom-in-95 duration-200">
        {/* Sleek Header */}
        <div className="px-6 py-5 bg-white flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#C3002F] border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 tracking-tight">Attach Additional Cost</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Order #{order.orderNumber} · {order.dealerName} · {order.vehicle.year} {order.vehicle.make} {order.vehicle.model}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[82vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* 1. Category Manual Text Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Additional Cost Category *</span>
              <span className="text-[10px] text-slate-400 font-normal">Enter category title manually</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Non-Standard Compliance Repair, LVVTA Certification, Biosecurity Decontamination"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C3002F] transition-all shadow-xs"
            />
          </div>

          {/* 2. Description & Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Item Description &amp; Scope of Work *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Front brake pad replacement, headlamp alignment & rotor skimming"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C3002F] transition-all shadow-xs"
            />
          </div>

          {/* 3. Amount in NZD */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Cost Amount (NZD Excl. GST) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-slate-400">
                NZ$
              </span>
              <input
                type="number"
                min={1}
                step={10}
                value={amountNZD}
                onChange={(e) => setAmountNZD(e.target.value)}
                placeholder="350"
                className="w-full pl-12 pr-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C3002F] transition-all shadow-xs"
              />
            </div>
          </div>

          {/* 4. Operational & Compliance Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Compliance Reference / Notes</span>
              <span className="text-[10px] text-slate-400 font-normal">Optional</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VINZ Entry Inspection Dossier #MR2A-0924"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C3002F] transition-all shadow-xs"
            />
          </div>

          {/* 5. Attached File / Evidence Document */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 block">
                Inspection Evidence / Repair Quote
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

            {attachedFile && attachedFile.name ? (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/90 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-900 block truncate">
                      {attachedFile?.name || "Evidence Document"}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {attachedFile?.size || "Document"}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800">
                        Evidence Attached
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
                className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${isDragging
                  ? "border-[#C3002F] bg-red-50/50"
                  : "border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-400"
                  }`}
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-500">
                  <Paperclip className="w-4 h-4 text-slate-600" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-slate-700 block">
                    Click to attach evidence file or drag &amp; drop
                  </span>
                  <span className="text-[11px] text-slate-400 block font-sans">
                    Upload official mechanic quote, MR2A report, or photo
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 active:scale-[0.98]"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>{isSubmitting ? "Submitting..." : "Submit for Dealer Approval"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
