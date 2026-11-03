"use client";

import React, { useState } from "react";
import { Order, OrderMilestone, AdditionalCostItem } from "@/lib/types";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import AdditionalCostCreatorModal from "./AdditionalCostCreatorModal";
import {
  Ship,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Calendar,
  Anchor,
  FileCheck2,
  Search,
  Filter,
  Check,
} from "lucide-react";

const MILESTONE_SEQUENCE: { key: OrderMilestone; label: string }[] = [
  { key: "ORDER_CONFIRMED", label: "Order Confirmed" },
  { key: "JAPAN_VERIFICATION", label: "Japan Verification" },
  { key: "BOOKED_FOR_SHIPPING", label: "Booked Shipping" },
  { key: "IN_TRANSIT", label: "In Transit (RoRo)" },
  { key: "NZ_BORDER_PROCESSING", label: "NZ Border" },
  { key: "COMPLIANCE", label: "MR2A Compliance" },
  { key: "READY_FOR_DELIVERY", label: "Ready Delivery" },
  { key: "DELIVERED", label: "Delivered Yard" },
];

export default function AllocationMilestonesView() {
  const { orders, advanceOrderMilestone, attachAdditionalCost: addCost } = useProgramme();
  const [selectedOrderForCost, setSelectedOrderForCost] = useState<Order | null>(null);
  const [editingMilestoneOrderId, setEditingMilestoneOrderId] = useState<string | null>(null);
  const [nextMilestoneKey, setNextMilestoneKey] = useState<OrderMilestone>("NZ_BORDER_PROCESSING");
  const [milestoneNotes, setMilestoneNotes] = useState("MPI biosecurity heat treatment and border discharge verified.");
  const [editingEta, setEditingEta] = useState<string>("");
  const [editingVessel, setEditingVessel] = useState<string>("");
  const [editingVoyage, setEditingVoyage] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [milestoneFilter, setMilestoneFilter] = useState("ALL");

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.vehicle.vinChassis.toLowerCase().includes(q) ||
      order.vehicle.model.toLowerCase().includes(q) ||
      order.dealerName.toLowerCase().includes(q);

    const matchesMilestone =
      milestoneFilter === "ALL" ||
      (milestoneFilter === "IN_TRANSIT" && (order.currentMilestone === "IN_TRANSIT" || order.currentMilestone === "BOOKED_FOR_SHIPPING")) ||
      (milestoneFilter === "BORDER" && (order.currentMilestone === "NZ_BORDER_PROCESSING" || order.currentMilestone === "COMPLIANCE" || order.currentMilestone === "AWAITING_ADDITIONAL_COST")) ||
      (milestoneFilter === "READY" && (order.currentMilestone === "READY_FOR_DELIVERY" || order.currentMilestone === "DELIVERED"));

    return matchesSearch && matchesMilestone;
  });

  const startEditingMilestone = (order: Order) => {
    audio.playSubtleClick();
    if (editingMilestoneOrderId === order.id) {
      setEditingMilestoneOrderId(null);
    } else {
      setEditingMilestoneOrderId(order.id);
      setNextMilestoneKey(order.currentMilestone);
      setMilestoneNotes(
        order.milestones.find((m) => m.key === order.currentMilestone)?.notes ||
        "Carrier progression verified by Autohub Logistics."
      );
      setEditingEta(order.etaDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
      setEditingVessel(order.vesselName || "Trans-Pacific RoRo V.49");
      setEditingVoyage(order.voyageNumber || "TP-2649");
    }
  };

  const handleAdvanceMilestone = (orderId: string) => {
    audio.playSuccessChime();
    advanceOrderMilestone(orderId, nextMilestoneKey, milestoneNotes, {
      etaDeliveryDate: editingEta,
      vesselName: editingVessel,
      voyageNumber: editingVoyage,
    });
    setEditingMilestoneOrderId(null);
    setNotification(`Order ${orderId} successfully advanced to ${nextMilestoneKey.replace(/_/g, " ")}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCostCreated = (orderId: string, costItem: AdditionalCostItem) => {
    addCost(orderId, costItem);
    setNotification(`Additional compliance cost item attached to Order ${orderId}.`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner (Clean Executive Outline Style)            */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
            Orders Milestones
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor confirmed dealer allocations, Pacific maritime transit, entry compliance certification, and dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs self-start sm:self-auto">
          <div className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 font-mono text-slate-800 font-bold shadow-2xs">
            {filteredOrders.length} of {orders.length} Active Orders
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Filter & Search Controls (Unified Clean Canvas)          */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, VIN, model, or dealer..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/70 self-start sm:self-auto">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "IN_TRANSIT", label: "On Vessel" },
            { id: "BORDER", label: "NZ Compliance" },
            { id: "READY", label: "Ready / Yard" },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setMilestoneFilter(chip.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${milestoneFilter === chip.id
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-800"
                }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Order Cards with Cohesive Milestone Stepper             */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400 shadow-2xs">
            No wholesale orders match your search criteria.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isEditingThis = editingMilestoneOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-[16px] border border-slate-200 p-6 sm:p-7 space-y-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-all"
              >
                {/* Order Meta Header */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-slate-100">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-24 sm:w-28 h-18 sm:h-20 rounded-2xl border border-slate-200/80 bg-slate-50 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <img
                        src={order.vehicle?.images?.[0] || "/images/cars/kicks.png"}
                        alt={order.vehicle?.model || "Vehicle"}
                        className="w-full h-full object-contain filter drop-shadow-xs select-none"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-xs text-slate-900">
                          {order.orderNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                          {order.pricingZoneId}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base tracking-tight truncate">
                        {order.vehicle.year} {order.vehicle.make} - {order.vehicle.model}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        VIN: {order.vehicle.vinChassis} · Dealer: <strong className="text-slate-800 font-semibold">{order.dealerName}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Financial & Shipping Info */}
                  <div className="flex flex-col sm:flex-row lg:flex-col sm:items-end gap-1.5 text-xs shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-base font-bold text-slate-900 font-mono tracking-tight">
                      ${order.priceBreakdown.totalBuyPriceNZD.toLocaleString()} <span className="text-xs text-slate-400 font-normal">NZD Landed</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Ship className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.vesselName} ({order.voyageNumber})</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      ETA Delivery: <strong className="text-slate-800 font-mono font-semibold">{order.etaDeliveryDate}</strong>
                    </div>
                  </div>
                </div>

                {/* 8-Stage Milestone Progression Stepper (Calm, Unified Theme - NO RAINBOW BOXES) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <span>Logistics Progression Milestone</span>
                    <span className="font-mono text-slate-900 font-bold lowercase">
                      current: <strong className="text-[#C3002F] uppercase">{order.currentMilestone.replace(/_/g, " ")}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {MILESTONE_SEQUENCE.map((stage, idx) => {
                      const milestoneObj = order.milestones.find((m) => m.key === stage.key);
                      const isDone = !!milestoneObj?.completedAt;
                      const isCurrent = order.currentMilestone === stage.key;

                      return (
                        <div
                          key={stage.key}
                          className={`p-2.5 rounded-xl text-center text-xs border transition-all ${isDone
                            ? "bg-slate-50 border-slate-200 text-slate-700"
                            : isCurrent
                              ? "bg-slate-900 text-white border-slate-900 font-bold shadow-xs"
                              : "bg-white border-slate-200/60 text-slate-400"
                            }`}
                        >
                          <div className="text-[11px] font-semibold truncate leading-tight">
                            {stage.label}
                          </div>
                          <div className="text-[10px] mt-1 font-mono flex items-center justify-center gap-1">
                            {isDone ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> Passed
                              </span>
                            ) : isCurrent ? (
                              <span className="text-amber-300 font-bold animate-pulse">● Active</span>
                            ) : (
                              <span className="text-slate-400 opacity-70">Step {idx + 1}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Cost Notice (Calm & Professional Alert) */}
                {order.additionalCosts.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-xs space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Compliance Remediation Variation Attached ({order.additionalCosts[0].status})</span>
                      </div>
                      <span className="font-mono font-bold text-amber-950 text-sm">
                        +${order.additionalCosts[0].amountNZD.toLocaleString()} NZD
                      </span>
                    </div>
                    <p className="text-amber-800 text-[11px] leading-relaxed">
                      {order.additionalCosts[0].description}
                    </p>
                  </div>
                )}

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="text-slate-500 text-[11px]">
                    Carrier log: <span className="text-slate-700 font-medium">Standard Yokohama coastal departure confirmed.</span>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderForCost(order)}
                      className="btn-outline text-xs py-2 px-3.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Additional Cost</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => startEditingMilestone(order)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                    >
                      <span>Update Milestone &amp; EDD</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Advance Milestone & EDD Inline Drawer */}
                {isEditingThis && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4 animate-in fade-in text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>Logistics Progression: Order {order.orderNumber}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                          {order.pricingZoneId}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Autohub Admin Controls</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Destination Milestone
                        </label>
                        <select
                          value={nextMilestoneKey}
                          onChange={(e) => setNextMilestoneKey(e.target.value as OrderMilestone)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        >
                          <option value="ORDER_CONFIRMED">1. Order Confirmed</option>
                          <option value="JAPAN_VERIFICATION">2. Japan Verification</option>
                          <option value="BOOKED_FOR_SHIPPING">3. Booked for Shipping</option>
                          <option value="IN_TRANSIT">4. In Transit (Pacific RoRo)</option>
                          <option value="NZ_BORDER_PROCESSING">5. NZ Border Processing</option>
                          <option value="COMPLIANCE">6. MR2A Entry Compliance</option>
                          <option value="READY_FOR_DELIVERY">7. Ready for Delivery</option>
                          <option value="DELIVERED">8. Delivered to Dealership Yard</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Estimated Delivery Date (EDD)
                        </label>
                        <input
                          type="date"
                          value={editingEta}
                          onChange={(e) => setEditingEta(e.target.value)}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Carrier Vessel Name
                        </label>
                        <input
                          type="text"
                          value={editingVessel}
                          onChange={(e) => setEditingVessel(e.target.value)}
                          placeholder="e.g. Trans-Pacific RoRo V.49"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Voyage / Booking Ref
                        </label>
                        <input
                          type="text"
                          value={editingVoyage}
                          onChange={(e) => setEditingVoyage(e.target.value)}
                          placeholder="e.g. TP-2649"
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Carrier &amp; Verification Progress Notes
                      </label>
                      <input
                        type="text"
                        value={milestoneNotes}
                        onChange={(e) => setMilestoneNotes(e.target.value)}
                        placeholder="e.g. MPI biosecurity clearance completed at Auckland wharf discharge."
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => setEditingMilestoneOrderId(null)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdvanceMilestone(order.id)}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save Milestone &amp; Carrier Progress</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Additional Cost Creator Modal */}
      <AdditionalCostCreatorModal
        order={selectedOrderForCost}
        onClose={() => setSelectedOrderForCost(null)}
        onSubmit={handleCostCreated}
      />
    </div>
  );
}
