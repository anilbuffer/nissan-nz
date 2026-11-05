"use client";

import React, { useState, useRef, useEffect } from "react";
import { FileText, Shield, CheckCircle2 } from "lucide-react";
import { audio } from "@/lib/sound";

interface NissanParticularTermsCardProps {
  isAccepted: boolean;
  onAccept: () => void;
  onToggleAccept?: (accepted: boolean) => void;
  category?: "DEALER_NZ" | "JAPAN_HQ" | "PROGRAMME_USER";
  error?: string;
}

export default function NissanParticularTermsCard({
  isAccepted,
  onAccept,
  onToggleAccept,
  category = "DEALER_NZ",
  error,
}: NissanParticularTermsCardProps) {
  const [activeTab, setActiveTab] = useState<"TERMS" | "PRIVACY">("TERMS");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Always initialize to unscrolled state on mount unless already accepted
  useEffect(() => {
    if (isAccepted) {
      setIsScrolledToEnd(true);
      setScrollProgress(100);
    } else {
      setIsScrolledToEnd(false);
      setScrollProgress(0);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // When category changes, reset scroll position and states
  useEffect(() => {
    if (isAccepted) {
      setIsScrolledToEnd(true);
      setScrollProgress(100);
    } else {
      setIsScrolledToEnd(false);
      setScrollProgress(0);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
  }, [category]);

  // When isAccepted changes from false to true, ensure scrolled state is active
  useEffect(() => {
    if (isAccepted) {
      setIsScrolledToEnd(true);
      setScrollProgress(100);
    }
  }, [isAccepted]);

  // Track scroll position to update % and trigger State 1 -> State 2 with a soft reading delay
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // Safety guard: ensure the scrollable canvas has rendered its contents
    if (!scrollHeight || scrollHeight <= clientHeight + 100) return;

    const maxScroll = scrollHeight - clientHeight;
    const progress = Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100)));
    setScrollProgress(progress);

    // Unlocks State 2 with a natural 400ms reading delay once user reaches the bottom
    if (scrollTop > 150 && (progress >= 92 || scrollTop + clientHeight >= scrollHeight - 30)) {
      if (!isScrolledToEnd && !scrollTimeoutRef.current) {
        scrollTimeoutRef.current = setTimeout(() => {
          audio.playSubtleClick();
          setIsScrolledToEnd(true);
          scrollTimeoutRef.current = null;
        }, 400); // Soft 400ms reading pause delay before revealing green banner
      }
    } else {
      // If user scrolls back up before the delay timer completes, cancel it
      if (scrollTimeoutRef.current && !isScrolledToEnd) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    }
  };

  // Helper when clicking "Scroll to Agree (↓)"
  const handleScrollToAgree = () => {
    audio.playSubtleClick();
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      setTimeout(() => {
        if (scrollRef.current) {
          const { scrollHeight, clientHeight } = scrollRef.current;
          if (scrollHeight > clientHeight + 100) {
            setScrollProgress(100);
            setIsScrolledToEnd(true);
          }
        }
      }, 450);
    }
  };

  // Switch tab and reset view
  const handleTabSwitch = (tab: "TERMS" | "PRIVACY") => {
    audio.playSubtleClick();
    setActiveTab(tab);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  // Handle clicking the red "Accept & Agree to Terms" or green "Accepted & Agreed" button
  const handleAcceptClick = () => {
    audio.playSuccessChime();
    if (isAccepted) {
      if (onToggleAccept) {
        onToggleAccept(false);
      }
    } else {
      if (onToggleAccept) {
        onToggleAccept(true);
      } else {
        onAccept();
      }
    }
  };

  return (
    <div
      className={`rounded-2xl border ${error ? "border-rose-400 ring-2 ring-rose-500/20" : "border-slate-200/90"
        } overflow-hidden bg-white shadow-soft transition-all`}
    >
      {/* ─────────────────────────────────────────────────────────── */}
      {/* CARD HEADER                                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white px-4 sm:px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100/90 text-[#C3002F] flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              {category === "JAPAN_HQ"
                ? "Nissan Global Japan Export Protocol & Terms"
                : "Particular Terms of Trade"}
            </h3>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TABS (Particular Terms of Trade / Privacy Policy)           */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-6 border-b border-slate-200/80 bg-slate-50/60 flex items-center gap-6">
        <button
          type="button"
          onClick={() => handleTabSwitch("TERMS")}
          className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === "TERMS"
            ? "text-[#C3002F] border-[#C3002F]"
            : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
        >
          <FileText className="w-4 h-4" />
          <span>Particular Terms of Trade</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSwitch("PRIVACY")}
          className={`py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === "PRIVACY"
            ? "text-[#C3002F] border-[#C3002F]"
            : "text-slate-500 border-transparent hover:text-slate-800"
            }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy Policy</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SCROLLABLE DOCUMENT CANVAS                                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-[360px] sm:h-[400px] overflow-y-auto p-5 sm:p-7 text-xs text-slate-700 leading-relaxed space-y-5 bg-white select-text scroll-smooth"
      >
        {activeTab === "TERMS" ? (
          <>
            {/* Document Header */}
            <div className="space-y-1 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900 tracking-tight">
                {category === "JAPAN_HQ"
                  ? "Nissan Global Japan Export Protocol & Marshalling Standards"
                  : "Nissan NZ Used Vehicle Programme Particular Terms of Trade"}
              </h4>
              <p className="font-bold text-slate-800 text-[10px]">
                Trade Customers &amp; Authorized Dealership Network Only
              </p>
            </div>

            {/* Preamble */}
            <div className="space-y-2 text-slate-600">
              <p>
                These Particular Terms of Trade apply to direct Japan vehicle allocation, procurement,
                wharf marshalling, ocean transit, customs clearance, MR2A entry compliance, and domestic
                carrier delivery services arranged through the Nissan NZ Dealer Platform by{" "}
                <strong className="text-slate-900 font-semibold">AutoHub New Zealand Ltd</strong>{" "}
                (&quot;AutoHub&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) in
                operational partnership with{" "}
                <strong className="text-slate-900 font-semibold">Nissan Motor Co. (New Zealand) Ltd</strong>.
              </p>
              <p>
                &quot;Nissan Used Vehicle Programme&quot; refers to the franchised procurement service and
                is governed by strict brand quality controls and guaranteed landed cost boundaries.
              </p>
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 font-medium text-slate-800">
                By opening an account, confirming an allocation hold, or placing an order, the customer
                confirms that it is acquiring the relevant motor vehicles{" "}
                <strong className="font-bold">in trade and for business purposes</strong>.
              </p>
            </div>

            {/* 1. Acceptance of Terms */}
            <div className="space-y-1.5 pt-1">
              <h5 className="font-bold text-slate-900 text-xs">1. Acceptance of Terms</h5>
              <p className="text-slate-600">
                By creating a dealer account, confirming an allocation, or instructing vehicle fulfillment,
                the dealership agrees to these Terms of Trade.
              </p>
              <p className="text-slate-600">
                The dealership warrants that the individual accepting these terms or approving orders has full
                corporate authority to bind the entity.
              </p>
            </div>

            {/* 2. AutoHub & Programme Role */}
            <div className="space-y-1.5 pt-1">
              <h5 className="font-bold text-slate-900 text-xs">2. AutoHub &amp; Programme Role</h5>
              <p className="text-slate-600">
                AutoHub provides specialized commercial vehicle procurement, wharf marshalling, Japanese
                export deregistration (Yushutsu Massho), RoRo shipping, New Zealand entry compliance pass,
                and nationwide dealer yard logistics.
              </p>
            </div>

            {/* 3. Commercial Boundary & Landed Pricing */}
            <div className="space-y-2 pt-1">
              <h5 className="font-bold text-slate-900 text-xs">
                3. Commercial Boundary &amp; Guaranteed Landed Price
              </h5>
              <p className="text-slate-600">
                The Total Buy Price displayed in the portal represents a{" "}
                <strong className="font-bold text-slate-900">Guaranteed Fixed Landed Price</strong>. The
                boundary of inclusions and separately chargeable items is strictly defined as follows:
              </p>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl text-slate-700 space-y-1.5">
                  <span className="font-bold text-emerald-900 text-[11px] block uppercase tracking-wider">
                    Included in Total Buy Price (Guaranteed Landed Boundary):
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-950">
                    <li>Vehicle FOB acquisition cost (Japan JPY converted to NZD)</li>
                    <li>Standard RoRo ocean freight &amp; full marine transit insurance</li>
                    <li>NZ Customs border processing, import tariffs &amp; 15% NZ GST</li>
                    <li>Standard entry compliance pass (MR2A &amp; 1-year WoF certificate)</li>
                    <li>Two standard domestic delivery carrier movements (Wharf/Compliance to Yard)</li>
                    <li>Nissan NZ certified programme inspection and warranty component fee</li>
                  </ul>
                </div>

                <div className="bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-slate-700 space-y-1.5">
                  <span className="font-bold text-amber-900 text-[11px] block uppercase tracking-wider">
                    Potential Additional Costs (Requires Prior Dealership Approval):
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-950">
                    <li>Non-standard structural repairs or major mechanical rectification</li>
                    <li>Low Volume Vehicle Technical Association (LVVTA) engineering certification</li>
                    <li>MPI biosecurity quarantine flag &amp; specialized decontamination heat treatment</li>
                    <li>Demurrage storage exceeding 30 calendar days or remote re-delivery rerouting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Allocation Window */}
            <div className="space-y-1.5 pt-1">
              <h5 className="font-bold text-slate-900 text-xs">4. Allocation &amp; Decision Window</h5>
              <p className="text-slate-600">
                Dealerships hold an exclusive 24-hour reservation window upon stock selection. Upon
                confirmation or window expiration with order commitment, the allocation becomes a firm,
                binding commercial purchase obligation.
              </p>
            </div>

            {/* 5. Transit Risk & Claims */}
            <div className="space-y-1.5 pt-1">
              <h5 className="font-bold text-slate-900 text-xs">5. Risk &amp; Delivery Inspection</h5>
              <p className="text-slate-600">
                Ocean voyage risk is fully covered by AutoHub open marine cargo insurance. Risk transfers to the
                dealership upon physical receipt at the nominated facility. Any physical transit discrepancy
                must be noted on the carrier consignment note within 48 hours.
              </p>
            </div>

            {/* 6. Payment Terms */}
            <div className="space-y-1.5 pt-1">
              <h5 className="font-bold text-slate-900 text-xs">6. Payment &amp; Settlement Terms</h5>
              <p className="text-slate-600">
                Settlement is executed via pre-approved Nissan Financial Services (NFSI) wholesale inventory
                credit facility or direct electronic bank settlement prior to compliance dispatch.
              </p>
            </div>

            {/* 7. Business-to-Business Supply */}
            <div className="space-y-1.5 pt-1">
              <h5 className="font-bold text-slate-900 text-xs">7. Business-to-Business Supply</h5>
              <p className="text-slate-600">
                Supply is strictly between commercial trade parties. To the maximum extent permitted by New
                Zealand law, the{" "}
                <strong className="font-bold text-slate-900">Consumer Guarantees Act 1993</strong> and
                sections 9, 12A, and 13 of the <strong className="font-bold text-slate-900">Fair Trading Act 1986</strong>{" "}
                do not apply.
              </p>
            </div>

            {/* 8. Governing Law */}
            <div className="space-y-1.5 pt-1">
              <h5 className="font-bold text-slate-900 text-xs">8. Governing Law</h5>
              <p className="text-slate-600">
                These terms are governed exclusively by the laws of{" "}
                <strong className="font-bold text-slate-900">New Zealand</strong> and subject to the
                jurisdiction of the New Zealand courts.
              </p>
            </div>

            <div className="pt-2">
              <p className="font-bold text-slate-900 text-xs bg-slate-100/80 p-3 rounded-xl border border-slate-200">
                By accepting these Particular Terms of Trade, the dealer confirms that it has read,
                understood, and accepted the Commercial Boundary &amp; Terms of Trade in full.
              </p>
            </div>

            {/* Single text line fade green banner visible when full read/scrolled */}
            {isScrolledToEnd && (
              <div className="p-2.5 sm:p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center gap-2.5 text-xs font-semibold transition-all duration-700 animate-in fade-in slide-in-from-bottom-1">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>You have reached the end of the Particular Terms of Trade.</span>
              </div>
            )}
          </>
        ) : (
          /* ───────────────────────────────────────────────────────── */
          /* PRIVACY POLICY TAB CONTENT                                */
          /* ───────────────────────────────────────────────────────── */
          <>
            <div className="space-y-1 pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                Nissan NZ &amp; AutoHub Dealership Privacy Policy
              </h4>
              <p className="font-bold text-slate-800 text-xs">
                Compliance with New Zealand Privacy Act 2020
              </p>
            </div>

            <div className="space-y-3 text-slate-600">
              <p>
                This Privacy Policy outlines how Nissan Motor Co. (New Zealand) Ltd and AutoHub New Zealand Ltd
                collect, store, use, and protect dealership and authorized user records within the Dealer Order
                Platform.
              </p>

              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-900 text-xs">1. Information We Collect</h5>
                <p>
                  We collect dealership business information including legal trading entity name, NZBN, Nissan
                  dealer code, authorized buyer credentials, facility delivery addresses, and financial clearing
                  records.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-900 text-xs">2. Purpose of Collection</h5>
                <p>
                  Collected records are strictly utilized for order fulfillment, NZ Customs declarations, MPI
                  biosecurity clearances, MR2A vehicle compliance registration, and logistics transport.
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-900 text-xs">3. Security &amp; Storage</h5>
                <p>
                  All dealership records are encrypted with 256-bit TLS encryption in transit and stored in
                  secure ISO/IEC 27001 compliant datacenter infrastructure. Access is restricted to authorized
                  AutoHub logistics operators and Nissan NZ programme staff.
                </p>
              </div>
            </div>

            {/* Single text line fade green banner visible when full read/scrolled */}
            {isScrolledToEnd && (
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] flex items-center gap-2.5 text-xs sm:text-sm font-semibold transition-all duration-700 animate-in fade-in slide-in-from-bottom-1">
                <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                <span>You have reached the end of the Privacy Policy.</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* AMBER WARNING BAR (EXACTLY MATCHING IMAGE 1)                */}
      {/* ─────────────────────────────────────────────────────────── */}
      {!isScrolledToEnd && (
        <div className="bg-[#FFFBEB] border-t border-b border-[#FDE68A] px-5 py-2.5 flex items-center justify-between text-xs text-[#92400E]">
          <div className="flex items-center gap-2">
            <span className="text-[#DC2626] font-bold text-base leading-none">↓</span>
            <span className="font-medium text-[#78350F] text-xs">
              Please scroll through and view the entire terms to enable acceptance
            </span>
          </div>
          <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded border border-[#FDE68A] text-[#78350F] shrink-0">
            {scrollProgress}%
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FOOTER (MATCHING IMAGE 1 WHEN INCOMPLETE, IMAGE 2 WHEN DONE) */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="px-5 sm:px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
        <div className="text-xs text-slate-500 font-normal">
          {isScrolledToEnd ? (
            <span className="flex items-center gap-1.5 text-slate-600">
              <span>✓ Terms fully viewed. You may now accept.</span>
            </span>
          ) : (
            <span>Scroll down to read all terms.</span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Close
          </button>

          {!isScrolledToEnd ? (
            /* ───────────────────────────────────────────────────── */
            /* IMAGE 1: SCROLL TO AGREE (DISABLED STYLE)             */
            /* ───────────────────────────────────────────────────── */
            <button
              type="button"
              onClick={handleScrollToAgree}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#E8EDF5] hover:bg-[#DCE4F0] text-[#64748B] hover:text-[#334155] border border-[#CBD5E1] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4 text-[#94A3B8]" />
              <span>Scroll to Agree (↓)</span>
            </button>
          ) : (
            /* ───────────────────────────────────────────────────── */
            /* BRAND BLACK "ACCEPT & AGREE TO TERMS"                 */
            /* ───────────────────────────────────────────────────── */
            <button
              type="button"
              onClick={handleAcceptClick}
              className={`px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-300 cursor-pointer active:scale-[0.98] ${isAccepted
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-[#0A0A0A] hover:bg-[#262626] text-white shadow-black/20 ring-2 ring-black/10 animate-in fade-in zoom-in-95 duration-500 hover:scale-[1.02]"
                }`}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{isAccepted ? "Accepted & Agreed" : "Accept & Agree to Terms"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
