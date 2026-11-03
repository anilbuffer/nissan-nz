"use client";

import React, { useState } from "react";
import { Vehicle, AdditionalCostItem } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  X,
  PlusCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  Tag,
} from "lucide-react";

interface AddVehicleAdditionalCostModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onAddCost: (costItem: AdditionalCostItem) => void;
}

const COST_TYPES: {
  key: AdditionalCostItem["type"];
  label: string;
  desc: string;
  defaultAmount: number;
}[] = [
  {
    key: "CERTIFICATION",
    label: "LVVTA / Repair Certification",
    desc: "Engineering evidence or LVVTA certifier inspection pass",
    defaultAmount: 480,
  },
  {
    key: "COMPLIANCE_REPAIR",
    label: "Non-Standard Compliance Repair",
    desc: "Brake pad replacement, headlamp alignment or suspension repairs",
    defaultAmount: 350,
  },
  {
    key: "BORDER_FLAG",
    label: "MPI Biosecurity Decontamination",
    desc: "Wharf biosecurity hold, heat treatment or bio-wash fee",
    defaultAmount: 220,
  },
  {
    key: "STORAGE_TRANSPORT",
    label: "Demurrage / Non-Standard Linehaul",
    desc: "Wharf storage exceeding free period or secondary transport",
    defaultAmount: 180,
  },
  {
    key: "ACCESSORY",
    label: "Dealership Accessory Package",
    desc: "Towbar installation, privacy glass tinting, or full grooming",
    defaultAmount: 650,
  },
];

export default function AddVehicleAdditionalCostModal({
  vehicle,
  isOpen,
  onClose,
  onAddCost,
}: AddVehicleAdditionalCostModalProps) {
  const [selectedType, setSelectedType] = useState<AdditionalCostItem["type"]>("CERTIFICATION");
  const [description, setDescription] = useState("LVVTA repair certification & engineering sign-off pass");
  const [amountNZD, setAmountNZD] = useState<number>(480);
  const [notes, setNotes] = useState("Evidence: VINZ Compliance Dossier Ref #MR2A-0924");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !vehicle) return null;

  const handleSelectType = (typeKey: AdditionalCostItem["type"]) => {
    setSelectedType(typeKey);
    const item = COST_TYPES.find((t) => t.key === typeKey);
    if (item) {
      setDescription(item.desc);
      setAmountNZD(item.defaultAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Please provide a description for this cost item.");
      return;
    }

    if (!amountNZD || amountNZD <= 0) {
      setError("Please specify a valid amount in NZD.");
      return;
    }

    const newItem: AdditionalCostItem = {
      id: `COST_${Date.now()}`,
      type: selectedType,
      description: description.trim(),
      amountNZD: Number(amountNZD),
      status: "APPROVED",
      proposedAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
    };

    audio.playSuccessChime();
    onAddCost(newItem);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-[24px] border border-slate-200 shadow-2xl overflow-hidden my-auto flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0A0A0A] text-white flex items-center justify-between border-b border-[#27272A] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Attach Additional Cost</h3>
              <p className="text-[10px] text-slate-400">
                Vehicle: #{vehicle.stockId} · {vehicle.year} {vehicle.make} {vehicle.model}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#27272A] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cost Category Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Additional Cost Category *
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {COST_TYPES.map((type) => {
                const isSelected = selectedType === type.key;
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => handleSelectType(type.key)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-slate-50 border-slate-900 ring-2 ring-slate-900/10 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {type.label}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {type.desc}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                      ${type.defaultAmount} NZD
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Item Description &amp; Scope *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. LVVTA repair certification pass"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
            />
          </div>

          {/* Amount in NZD */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Amount (NZD Excl. GST or Landed Impact) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">
                NZ$
              </span>
              <input
                type="number"
                min={1}
                step={10}
                value={amountNZD}
                onChange={(e) => setAmountNZD(Number(e.target.value))}
                className="w-full pl-11 pr-3.5 py-2.5 text-sm font-mono font-bold bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Notes / Evidence Document */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Evidence Document / Operational Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VTNZ Compliance Pass Ref #4829"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Attach Additional Cost</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

