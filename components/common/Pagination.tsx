"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { audio } from "@/lib/sound";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
  itemName = "entries",
  className = "",
}: PaginationProps) {
  if (totalItems === 0) return null;

  const validTotalPages = Math.max(1, totalPages);
  const validCurrentPage = Math.min(Math.max(1, currentPage), validTotalPages);

  const startItem = (validCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(validCurrentPage * itemsPerPage, totalItems);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > validTotalPages || newPage === validCurrentPage) return;
    try {
      audio.playSubtleClick();
    } catch {
      // Audio fallback
    }
    onPageChange(newPage);
  };

  // Generate page numbers to display with smart ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (validTotalPages <= 7) {
      return Array.from({ length: validTotalPages }, (_, i) => i + 1);
    }

    if (validCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", validTotalPages];
    }

    if (validCurrentPage >= validTotalPages - 3) {
      return [
        1,
        "...",
        validTotalPages - 4,
        validTotalPages - 3,
        validTotalPages - 2,
        validTotalPages - 1,
        validTotalPages,
      ];
    }

    return [
      1,
      "...",
      validCurrentPage - 1,
      validCurrentPage,
      validCurrentPage + 1,
      "...",
      validTotalPages,
    ];
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`bg-white rounded-[16px] border border-slate-200 p-4 sm:p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${className}`}
      aria-label="Pagination Navigation"
    >
      {/* Item Range Info */}
      <div className="text-slate-500 font-medium text-center sm:text-left">
        Showing{" "}
        <span className="font-bold text-slate-900 font-mono">{startItem}</span>
        {" - "}
        <span className="font-bold text-slate-900 font-mono">{endItem}</span>
        {" of "}
        <span className="font-bold text-slate-900 font-mono">{totalItems}</span>
        {" "}{itemName}
        <span className="text-slate-400 font-normal ml-1">
          (max {itemsPerPage} per page)
        </span>
      </div>

      {/* Navigation Controls */}
      {validTotalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
          {/* Previous Page */}
          <button
            type="button"
            onClick={() => handlePageChange(validCurrentPage - 1)}
            disabled={validCurrentPage <= 1}
            aria-label="Previous Page"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 select-none font-bold"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = p === validCurrentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-label={`Page ${p}`}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
                    isCurrent
                      ? "bg-[#0A0A0A] text-white shadow-xs"
                      : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => handlePageChange(validCurrentPage + 1)}
            disabled={validCurrentPage >= validTotalPages}
            aria-label="Next Page"
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-all font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

