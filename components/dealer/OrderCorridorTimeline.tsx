"use client";

import React from "react";
import { Order, OrderMilestone } from "@/lib/types";
import { Check, MapPin } from "lucide-react";

export interface OrderCorridorTimelineProps {
  order: Order;
  className?: string;
}

interface BrandMilestoneStage {
  number: number;
  key: OrderMilestone;
  title: string;
  description: string;
  location: string;
  actor: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
}

/**
 * Format timestamps to standard format: "DD/MM/YYYY, HH:mm NZST"
 */
function formatCorridorDate(dateStr?: string): string {
  if (!dateStr) return "Pending";
  if (dateStr.toLowerCase().includes("pending")) return "Pending";

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return dateStr;
    }
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year}, ${hours}:${mins} NZST`;
  } catch {
    return dateStr;
  }
}

const BRAND_SEQUENCE: OrderMilestone[] = [
  "ORDER_CONFIRMED",
  "JAPAN_VERIFICATION",
  "BOOKED_FOR_SHIPPING",
  "IN_TRANSIT",
  "NZ_BORDER_PROCESSING",
  "COMPLIANCE",
  "READY_FOR_DELIVERY",
  "DELIVERED",
];

export default function OrderCorridorTimeline({
  order,
  className = "",
}: OrderCorridorTimelineProps) {
  // Normalize milestone (AWAITING_ADDITIONAL_COST corresponds to COMPLIANCE phase)
  const normalizedMilestone: OrderMilestone =
    order.currentMilestone === "AWAITING_ADDITIONAL_COST"
      ? "COMPLIANCE"
      : order.currentMilestone;

  const currentIdx = BRAND_SEQUENCE.indexOf(normalizedMilestone);
  const activeStageIndex = currentIdx >= 0 ? currentIdx : 3;
  const isAllDelivered = order.currentMilestone === "DELIVERED";

  // Helper to extract timestamp from order milestone records
  const getMilestoneTimestamp = (key: OrderMilestone): string | undefined => {
    const found = order.milestones?.find((m) => m.key === key);
    if (found?.completedAt) return found.completedAt;
    return undefined;
  };

  const getMilestoneEta = (key: OrderMilestone): string | undefined => {
    const found = order.milestones?.find((m) => m.key === key);
    if (found?.eta) return found.eta;
    return undefined;
  };

  // Build the 8 brand order milestone stages
  const stages: BrandMilestoneStage[] = [
    {
      number: 1,
      key: "ORDER_CONFIRMED",
      title: "Order Confirmed",
      description: "Wholesale allocation accepted and registered into Nissan NZ programme schedule.",
      location: "Nissan Central Operations Hub, Auckland",
      actor: "Dealership & Autohub Ops",
      timestamp: formatCorridorDate(getMilestoneTimestamp("ORDER_CONFIRMED") || order.orderedAt || "2026-09-08T21:00:00Z"),
      isCompleted: isAllDelivered || activeStageIndex > 0,
      isCurrent: !isAllDelivered && activeStageIndex === 0,
      isPending: false,
    },
    {
      number: 2,
      key: "JAPAN_VERIFICATION",
      title: "Verification",
      description: "USS/JAA auction pass, physical pre-export inspection & JEVIC digital odometer certification.",
      location: "Yokohama Export Marshalling Yard, Japan",
      actor: "Japan Logistics Hub & JEVIC Verification",
      timestamp:
        activeStageIndex >= 1 || isAllDelivered
          ? formatCorridorDate(getMilestoneTimestamp("JAPAN_VERIFICATION") || "2026-09-09T04:15:00Z")
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 1,
      isCurrent: !isAllDelivered && activeStageIndex === 1,
      isPending: !isAllDelivered && activeStageIndex < 1,
    },
    {
      number: 3,
      key: "BOOKED_FOR_SHIPPING",
      title: "Shipment",
      description: "RoRo vessel space confirmed and port berth staging completed.",
      location: "Port of Yokohama Berth 4",
      actor: "AutoHub Shipping Ops",
      timestamp:
        activeStageIndex >= 2 || isAllDelivered
          ? formatCorridorDate(getMilestoneTimestamp("BOOKED_FOR_SHIPPING") || "2026-09-10T02:00:00Z")
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 2,
      isCurrent: !isAllDelivered && activeStageIndex === 2,
      isPending: !isAllDelivered && activeStageIndex < 2,
    },
    {
      number: 4,
      key: "IN_TRANSIT",
      title: "Transit",
      description: `Departed international export terminal on scheduled RoRo carrier across Pacific corridor.`,
      location: `En Route to Ports of Auckland (Vessel: ${order.vesselName || "Trans-Pacific RoRo V.48"})`,
      actor: "Trans-Pacific RoRo Lines",
      timestamp:
        activeStageIndex >= 3 || isAllDelivered
          ? formatCorridorDate(getMilestoneTimestamp("IN_TRANSIT") || getMilestoneEta("IN_TRANSIT") || "2026-09-12T06:30:00Z")
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 3,
      isCurrent: !isAllDelivered && activeStageIndex === 3,
      isPending: !isAllDelivered && activeStageIndex < 3,
    },
    {
      number: 5,
      key: "NZ_BORDER_PROCESSING",
      title: "Customs Release",
      description: "Vessel berth discharge, MPI biosecurity heat treatment, and NZ Customs GST import entry clearance.",
      location: "Ports of Auckland Cargo Terminal (POAL)",
      actor: "NZ Customs & MPI Biosecurity",
      timestamp:
        activeStageIndex >= 4 || isAllDelivered
          ? formatCorridorDate(getMilestoneTimestamp("NZ_BORDER_PROCESSING") || getMilestoneEta("NZ_BORDER_PROCESSING") || "2026-09-24T09:00:00Z")
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 4,
      isCurrent: !isAllDelivered && activeStageIndex === 4,
      isPending: !isAllDelivered && activeStageIndex < 4,
    },
    {
      number: 6,
      key: "COMPLIANCE",
      title: "MR2A",
      description: "NZTA physical safety inspection pass, brake roller testing, and 1-year WoF certification.",
      location: "VINZ / VTNZ Compliance Depot, Auckland",
      actor: "VTNZ / VINZ Entry Certifiers",
      timestamp:
        activeStageIndex >= 5 || isAllDelivered
          ? formatCorridorDate(getMilestoneTimestamp("COMPLIANCE") || getMilestoneEta("COMPLIANCE") || "2026-09-27T11:45:00Z")
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 5,
      isCurrent: !isAllDelivered && activeStageIndex === 5,
      isPending: !isAllDelivered && activeStageIndex < 5,
    },
    {
      number: 7,
      key: "READY_FOR_DELIVERY",
      title: "Delivery Ready",
      description: "MR2A compliance plate affixed; vehicle dispatched via certified domestic linehaul carrier.",
      location: "Auckland Metro Linehaul Staging Depot",
      actor: "AutoHub Domestic Carrier",
      timestamp:
        activeStageIndex >= 6 || isAllDelivered
          ? formatCorridorDate(getMilestoneTimestamp("READY_FOR_DELIVERY") || getMilestoneEta("READY_FOR_DELIVERY") || order.etaDeliveryDate || "2026-10-02T08:00:00Z")
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 6,
      isCurrent: !isAllDelivered && activeStageIndex === 6,
      isPending: !isAllDelivered && activeStageIndex < 6,
    },
    {
      number: 8,
      key: "DELIVERED",
      title: "Delivered",
      description: "Physical handover completed, receiving condition log signed, and vehicle entered into yard stock.",
      location: order.deliveryAddress
        ? `${order.dealerName || "Auckland Nissan City Ltd"} (${order.deliveryAddress})`
        : order.dealerName || "Auckland Nissan City Ltd Receiving Yard",
      actor: "Franchise Receiving Yard Principal",
      timestamp: isAllDelivered
        ? formatCorridorDate(getMilestoneTimestamp("DELIVERED") || order.etaDeliveryDate || "2026-10-04T15:30:00Z")
        : "Pending",
      isCompleted: isAllDelivered,
      isCurrent: false,
      isPending: !isAllDelivered,
    },
  ];

  return (
    <div className={`space-y-0 ${className}`}>
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;

        return (
          <div key={stage.key} className="flex gap-2.5 sm:gap-3.5">
            {/* Left: Circle + Connector Line */}
            <div className="flex flex-col items-center shrink-0 w-6">
              {/* Circle Badge */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 z-10 transition-colors ${
                  stage.isCompleted
                    ? "border border-emerald-500 bg-emerald-50 text-emerald-700 shadow-2xs"
                    : stage.isCurrent
                    ? "border border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/15 shadow-2xs font-bold"
                    : "border border-slate-200 bg-white text-slate-400 font-semibold"
                }`}
              >
                {stage.isCompleted ? (
                  <Check className="w-3 h-3 stroke-[2.75] text-emerald-600" />
                ) : (
                  <span>{stage.number}</span>
                )}
              </div>

              {/* Continuous connecting line downward to next circle */}
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 transition-colors ${
                    stage.isCompleted ? "bg-emerald-500" : "bg-slate-200"
                  }`}
                />
              )}
            </div>

            {/* Right: Milestone Sleek Compact Card */}
            <div className={`flex-1 min-w-0 ${!isLast ? "pb-1.5 sm:pb-2" : ""}`}>
              <div
                className={`rounded-xl border py-2 px-3 sm:px-3.5 transition-all text-xs ${
                  stage.isCurrent
                    ? "bg-blue-50/50 border-blue-200 shadow-2xs"
                    : stage.isCompleted
                    ? "bg-white border-slate-200 shadow-2xs"
                    : "bg-slate-50/40 border-slate-200/60"
                }`}
              >
                {/* Top Row: Title + Current Pill (Left) & Date / Pending (Right) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span
                      className={`font-bold text-xs tracking-tight truncate ${
                        stage.isCurrent
                          ? "text-blue-950 font-bold"
                          : stage.isCompleted
                          ? "text-slate-900 font-bold"
                          : "text-slate-600 font-semibold"
                      }`}
                    >
                      {stage.number}. {stage.title}
                    </span>
                    {stage.isCurrent && (
                      <span className="text-[9px] font-semibold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.2 rounded-full font-mono shrink-0">
                        Current Milestone
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[10px] font-mono shrink-0 ${
                      stage.timestamp === "Pending"
                        ? "text-slate-400"
                        : "text-slate-600 font-semibold"
                    }`}
                  >
                    {stage.timestamp}
                  </span>
                </div>

                {/* Middle Row: Description */}
                <p className={`text-[11px] leading-snug mt-0.5 ${
                  stage.isCurrent ? "text-slate-600 font-medium" : stage.isCompleted ? "text-slate-500" : "text-slate-400"
                }`}>
                  {stage.description}
                </p>

                {/* Bottom Row: Location with MapPin Icon & Actor */}
                <div className={`flex items-center justify-between gap-2 text-[10px] font-mono mt-1.5 pt-1.5 border-t ${
                  stage.isCurrent ? "border-blue-100/80 text-blue-900/60" : "border-slate-100 text-slate-400"
                }`}>
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{stage.location}</span>
                  </div>
                  <span className="shrink-0 hidden sm:inline text-slate-400">
                    {stage.actor}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
