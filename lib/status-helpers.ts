export interface StatusStyle {
  label: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * Standardized status mappings across all platform pages.
 * Ensures consistent title-case human text and informative, restrained color semantics:
 * - Emerald: Active, Available, Approved, Confirmed, Delivered (Success/Positive)
 * - Amber: Pending Approval, Active Hold, In Progress (Action Pending / Time-sensitive)
 * - Sky: In Transit, Allocated, Verification, Booked (Logistics / Operational)
 * - Orange: Action Required, Awaiting Cost Approval (Warning)
 * - Rose: Declined, Suspended, Withdrawn, Rejected (Negative / Inactive)
 * - Slate: Draft, Expired, Released, Cancelled (Neutral / Historical)
 */
export function getStatusStyle(rawStatus?: string | null): StatusStyle {
  if (!rawStatus) {
    return {
      label: "Unknown",
      badgeClass: "bg-slate-100 text-slate-600 border-slate-200 shadow-2xs",
      dotClass: "bg-slate-400",
    };
  }

  const normalized = rawStatus.trim().toUpperCase();

  switch (normalized) {
    // --- Positive / Success / Active States (Emerald) ---
    case "AVAILABLE":
      return {
        label: "Available",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
        dotClass: "bg-emerald-500",
      };
    case "APPROVED":
      return {
        label: "Approved",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
        dotClass: "bg-emerald-500",
      };
    case "ACTIVE":
      return {
        label: "Active",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
        dotClass: "bg-emerald-500",
      };
    case "CONFIRMED":
    case "CONFIRMED_ALLOCATED":
    case "ORDER_CONFIRMED":
      return {
        label: "Confirmed Allocation",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
        dotClass: "bg-emerald-500",
      };
    case "READY_FOR_DELIVERY":
      return {
        label: "Ready for Delivery",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
        dotClass: "bg-emerald-500",
      };
    case "DELIVERED":
      return {
        label: "Delivered",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
        dotClass: "bg-emerald-500",
      };

    // --- Time-Sensitive / Pending States (Amber) ---
    case "RESERVED":
    case "ACTIVE_HOLD":
    case "HOLD":
      return {
        label: "Active Hold",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs",
        dotClass: "bg-amber-500",
      };
    case "PENDING_APPROVAL":
    case "PENDING":
    case "PENDING_DEALER_APPROVAL":
      return {
        label: "Pending Approval",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs",
        dotClass: "bg-amber-500",
      };
    case "NZ_BORDER_PROCESSING":
      return {
        label: "Customs Release",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs",
        dotClass: "bg-amber-500",
      };
    case "COMPLIANCE":
      return {
        label: "Entry Compliance",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs",
        dotClass: "bg-amber-500",
      };

    // --- Logistics / Informative Operational States (Sky) ---
    case "ALLOCATED":
      return {
        label: "Allocated",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs",
        dotClass: "bg-sky-500",
      };
    case "IN_TRANSIT":
    case "TRANSIT":
      return {
        label: "In Transit",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs",
        dotClass: "bg-sky-500",
      };
    case "BOOKED_FOR_SHIPPING":
      return {
        label: "Booked for Shipping",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs",
        dotClass: "bg-sky-500",
      };
    case "JAPAN_VERIFICATION":
      return {
        label: "Japan Verification",
        badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs",
        dotClass: "bg-sky-500",
      };

    // --- Warnings / Attention Required (Orange) ---
    case "RETURNED_FOR_INFO":
      return {
        label: "Action Required",
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200/80 shadow-2xs",
        dotClass: "bg-orange-500",
      };
    case "AWAITING_ADDITIONAL_COST":
      return {
        label: "Awaiting Cost Approval",
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200/80 shadow-2xs",
        dotClass: "bg-orange-500",
      };

    // --- Negative / Destructive / Suspended States (Rose) ---
    case "REJECTED":
    case "DECLINED":
      return {
        label: "Declined",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs",
        dotClass: "bg-rose-500",
      };
    case "SUSPENDED":
    case "INACTIVE":
      return {
        label: "Suspended",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs",
        dotClass: "bg-rose-500",
      };
    case "WITHDRAWN":
      return {
        label: "Withdrawn",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs",
        dotClass: "bg-rose-500",
      };

    // --- Neutral / Historical / Archival States (Slate) ---
    case "DRAFT":
      return {
        label: "Draft",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200 shadow-2xs",
        dotClass: "bg-slate-400",
      };
    case "SOLD":
    case "BUYED":
      return {
        label: "Sold",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200 shadow-2xs",
        dotClass: "bg-slate-400",
      };
    case "EXPIRED":
      return {
        label: "Expired",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200 shadow-2xs",
        dotClass: "bg-slate-400",
      };
    case "RELEASED":
      return {
        label: "Released",
        badgeClass: "bg-slate-100 text-slate-600 border-slate-200 shadow-2xs",
        dotClass: "bg-slate-400",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        badgeClass: "bg-slate-100 text-slate-500 border-slate-200 shadow-2xs",
        dotClass: "bg-slate-400",
      };

    default:
      // Formats screaming SNAKE_CASE into clean Title Case
      const formatted = rawStatus
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return {
        label: formatted,
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200 shadow-2xs",
        dotClass: "bg-slate-400",
      };
  }
}

