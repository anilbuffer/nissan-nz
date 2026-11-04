"use client";

import React from "react";
import { getStatusStyle } from "@/lib/status-helpers";

interface StatusBadgeProps {
  status: string | null | undefined;
  customLabel?: string;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Universal StatusBadge component for Nissan NZ Platform.
 * Enforces uniform typography, title-casing, informative color semantics,
 * and soft elevation across all platform views.
 */
export default function StatusBadge({
  status,
  customLabel,
  showDot = true,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const style = getStatusStyle(status);
  const label = customLabel || style.label;

  const sizeClass =
    size === "sm"
      ? "text-[10px] px-2 py-0.5"
      : "text-[11px] px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClass} ${style.badgeClass} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dotClass}`}
          aria-hidden="true"
        />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

