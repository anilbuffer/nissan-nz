"use client";

import React from "react";
import { Order, OrderMilestone } from "@/lib/types";
import { Check, MapPin } from "lucide-react";

export interface OrderCorridorTimelineProps {
  order: Order;
  className?: string;
}

interface CorridorStage {
  number: number;
  id: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isPending: boolean;
  actor?: string;
}

/**
 * Format timestamps to match reference format: "DD/MM/YYYY, HH:mm NZST"
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

/**
 * Maps the internal OrderMilestone status to the 5 corridor stages
 */
function getCorridorStageIndex(currentMilestone: OrderMilestone): {
  activeStageIndex: number; // 0 to 4
  isAllDelivered: boolean;
} {
  switch (currentMilestone) {
    case "ORDER_CONFIRMED":
    case "JAPAN_VERIFICATION":
      return { activeStageIndex: 0, isAllDelivered: false };
    case "BOOKED_FOR_SHIPPING":
    case "IN_TRANSIT":
      return { activeStageIndex: 1, isAllDelivered: false };
    case "NZ_BORDER_PROCESSING":
      return { activeStageIndex: 2, isAllDelivered: false };
    case "COMPLIANCE":
    case "AWAITING_ADDITIONAL_COST":
    case "READY_FOR_DELIVERY":
      return { activeStageIndex: 3, isAllDelivered: false };
    case "DELIVERED":
      return { activeStageIndex: 4, isAllDelivered: true };
    default:
      return { activeStageIndex: 1, isAllDelivered: false };
  }
}

export default function OrderCorridorTimeline({
  order,
  className = "",
}: OrderCorridorTimelineProps) {
  const { activeStageIndex, isAllDelivered } = getCorridorStageIndex(
    order.currentMilestone
  );

  // Helper to extract timestamp from order milestone records
  const getMilestoneTimestamp = (keys: OrderMilestone[]): string | undefined => {
    for (const k of keys) {
      const found = order.milestones?.find((m) => m.key === k);
      if (found?.completedAt) return found.completedAt;
    }
    return undefined;
  };

  // Helper to extract ETA if not yet completed
  const getMilestoneEta = (keys: OrderMilestone[]): string | undefined => {
    for (const k of keys) {
      const found = order.milestones?.find((m) => m.key === k);
      if (found?.eta) return found.eta;
    }
    return undefined;
  };

  // Build the 5 corridor stages with Nissan NZ automotive brand data
  const stages: CorridorStage[] = [
    {
      number: 1,
      id: "facility",
      title: "Received At Facility",
      description:
        "USS/JAA auction pass, physical pre-export inspection & JEVIC digital odometer verification.",
      location: "Yokohama Export Marshalling Yard, Japan",
      timestamp: formatCorridorDate(
        getMilestoneTimestamp(["JAPAN_VERIFICATION", "ORDER_CONFIRMED"]) ||
        order.orderedAt ||
        "2026-09-08T21:00:00Z"
      ),
      isCompleted: isAllDelivered || activeStageIndex > 0,
      isCurrent: !isAllDelivered && activeStageIndex === 0,
      isPending: false,
      actor: "Japan Logistics Hub & JEVIC Verification",
    },
    {
      number: 2,
      id: "transit",
      title: "In Transit",
      description:
        "Departed international export terminal on scheduled RoRo carrier across Pacific corridor.",
      location: `En Route to Ports of Auckland (Vessel: ${order.vesselName || "Trans-Pacific RoRo V.48"})`,
      timestamp:
        activeStageIndex >= 1 || isAllDelivered
          ? formatCorridorDate(
            getMilestoneTimestamp(["IN_TRANSIT", "BOOKED_FOR_SHIPPING"]) ||
            getMilestoneEta(["IN_TRANSIT"]) ||
            "2026-09-10T06:30:00Z"
          )
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 1,
      isCurrent: !isAllDelivered && activeStageIndex === 1,
      isPending: !isAllDelivered && activeStageIndex < 1,
      actor: "Trans-Pacific RoRo Lines",
    },
    {
      number: 3,
      id: "arrived_nz",
      title: "Arrived in NZ",
      description:
        "Vessel berth discharge, MPI biosecurity heat treatment, and NZ Customs GST clearance.",
      location: "Ports of Auckland Cargo Terminal (POAL)",
      timestamp:
        activeStageIndex >= 2 || isAllDelivered
          ? formatCorridorDate(
            getMilestoneTimestamp(["NZ_BORDER_PROCESSING"]) ||
            getMilestoneEta(["NZ_BORDER_PROCESSING"]) ||
            order.etaDeliveryDate
          )
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 2,
      isCurrent: !isAllDelivered && activeStageIndex === 2,
      isPending: !isAllDelivered && activeStageIndex < 2,
      actor: "NZ Customs & MPI Biosecurity",
    },
    {
      number: 4,
      id: "out_for_delivery",
      title: "Out For Delivery",
      description:
        "MR2A technical compliance pass, 1-year WoF certification, and regional linehaul transport.",
      location: "VINZ / VTNZ Compliance Depot & Auckland Metro Logistics Hub",
      timestamp:
        activeStageIndex >= 3 || isAllDelivered
          ? formatCorridorDate(
            getMilestoneTimestamp(["COMPLIANCE", "READY_FOR_DELIVERY"]) ||
            getMilestoneEta(["COMPLIANCE", "READY_FOR_DELIVERY"]) ||
            order.etaDeliveryDate
          )
          : "Pending",
      isCompleted: isAllDelivered || activeStageIndex > 3,
      isCurrent: !isAllDelivered && activeStageIndex === 3,
      isPending: !isAllDelivered && activeStageIndex < 3,
      actor: "VINZ Compliance & Domestic Carrier",
    },
    {
      number: 5,
      id: "delivered",
      title: "Delivered",
      description:
        "Final delivery handover to franchise receiving yard. Receiving inspection sign-off.",
      location: order.deliveryAddress
        ? `${order.dealerName || "Auckland Nissan City Ltd"} (${order.deliveryAddress})`
        : order.dealerName || "Auckland Nissan City Ltd",
      timestamp: isAllDelivered
        ? formatCorridorDate(
          getMilestoneTimestamp(["DELIVERED"]) || order.etaDeliveryDate
        )
        : "Pending",
      isCompleted: isAllDelivered,
      isCurrent: false,
      isPending: !isAllDelivered,
      actor: "Franchise Receiving Yard Principal",
    },
  ];

  return (
    <div className={`space-y-0 ${className}`}>
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;

        return (
          <div key={stage.id} className="flex gap-3 sm:gap-4.5">
            {/* Left: Circle + Connector Line */}
            <div className="flex flex-col items-center shrink-0 w-7 sm:w-8">
              {/* Circle Badge */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-colors ${stage.isCompleted
                  ? "border-2 border-emerald-500 bg-white text-emerald-600"
                  : stage.isCurrent
                    ? "border-2 border-blue-500 bg-blue-50 text-blue-600"
                    : "border-2 border-slate-200 bg-white text-slate-400 font-semibold"
                  }`}
              >
                {stage.isCompleted ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.75] text-emerald-600" />
                ) : (
                  <span>{stage.number}</span>
                )}
              </div>

              {/* Continuous connecting line downward to next circle */}
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 transition-colors ${stage.isCompleted ? "bg-emerald-500" : "bg-slate-200"
                    }`}
                />
              )}
            </div>

            {/* Right: Milestone White Card Matching Reference Layout */}
            <div
              className={`flex-1 min-w-0 ${!isLast ? "pb-3.5 sm:pb-4.5" : ""
                }`}
            >
              <div
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs ${stage.isCurrent
                  ? "border-blue-300 ring-2 ring-blue-500/10 shadow-xs"
                  : "border-slate-200"
                  }`}
              >
                {/* Top Row: Title + Current Pill (Left) & Date / Pending (Right) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                      {stage.number}. {stage.title}
                    </h4>
                    {stage.isCurrent && (
                      <span className="text-[10px] sm:text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono">
                        Current Milestone
                      </span>
                    )}
                  </div>

                  <div
                    className={`text-xs font-mono sm:text-right shrink-0 ${stage.timestamp === "Pending"
                      ? "text-slate-400"
                      : "text-slate-500 font-medium"
                      }`}
                  >
                    {stage.timestamp}
                  </div>
                </div>

                {/* Middle Row: Description */}
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-1 sm:mt-1.5">
                  {stage.description}
                </p>

                {/* Bottom Row: Location with MapPin Icon */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-3 sm:mt-3.5 pt-1 sm:pt-0">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{stage.location}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
