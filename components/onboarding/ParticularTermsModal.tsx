"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  FileText,
  Shield,
  CheckCircle2,
  ArrowDown,
  Lock,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { audio } from "@/lib/sound";

interface ParticularTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isAlreadyAccepted?: boolean;
}

export default function ParticularTermsModal({
  isOpen,
  onClose,
  onAccept,
  isAlreadyAccepted = false,
}: ParticularTermsModalProps) {
  const [activeTab, setActiveTab] = useState<"TERMS" | "PRIVACY">("TERMS");
  const [scrollProgress, setScrollProgress] = useState(isAlreadyAccepted ? 100 : 0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(isAlreadyAccepted);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset or initialize state when opening modal
  useEffect(() => {
    if (isOpen) {
      if (isAlreadyAccepted) {
        setScrollProgress(100);
        setHasScrolledToBottom(true);
      } else {
        setScrollProgress(0);
        setHasScrolledToBottom(false);
      }
    }
  }, [isOpen, isAlreadyAccepted]);

  // Handle scroll tracking
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 5) {
      setScrollProgress(100);
      setHasScrolledToBottom(true);
      return;
    }

    const progress = Math.min(100, Math.round((scrollTop / maxScroll) * 100));
    setScrollProgress(progress);

    // If reached 95% or within 30px of bottom, unlock agreement
    if (progress >= 95 || scrollTop + clientHeight >= scrollHeight - 30) {
      setHasScrolledToBottom(true);
    }
  };

  // Scroll to bottom helper
  const handleScrollToBottom = () => {
    audio.playSubtleClick();
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto">
        {/* ─────────────────────────────────────────────────────────── */}
        {/* HEADER                                                      */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="bg-white px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/90 text-[#C3002F] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                Particular Terms of Trade
              </h2>
              <p className="text-xs text-slate-500 leading-tight mt-0.5">
                Official Nissan NZ Programme &amp; AutoHub Logistics Documentation • v2.4 (2026.2)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* TAB NAVIGATION                                              */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="px-5 sm:px-6 border-b border-slate-200/80 bg-slate-50/50 flex items-center gap-6 shrink-0">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setActiveTab("TERMS");
            }}
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
            onClick={() => {
              audio.playSubtleClick();
              setActiveTab("PRIVACY");
            }}
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
          className="relative flex-1 overflow-y-auto p-5 sm:p-7 text-xs text-slate-700 leading-relaxed space-y-5 bg-white select-text"
        >
          {activeTab === "TERMS" ? (
            <>
              {/* Document Header */}
              <div className="space-y-1 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  Nissan NZ Used Vehicle Programme Particular Terms of Trade
                </h3>
                <p className="font-bold text-slate-800 text-xs">
                  Authorized Dealerships &amp; Trade Customers Only
                </p>
              </div>

              {/* Preamble */}
              <div className="space-y-2.5 text-slate-600">
                <p>
                  These Particular Terms of Trade apply to direct Japan used vehicle procurement,
                  wharf marshalling, shipping logistics, customs entry, MR2A compliance certification,
                  and domestic transport arranged through the Nissan NZ Dealer Order Platform by{" "}
                  <strong className="text-slate-900 font-semibold">AutoHub New Zealand Ltd</strong>{" "}
                  (&quot;AutoHub&quot;, &quot;we&quot;, &quot;us&quot; or &quot;our&quot;) in
                  authorized partnership with{" "}
                  <strong className="text-slate-900 font-semibold">Nissan Motor Co. (New Zealand) Ltd</strong>.
                </p>
                <p>
                  &quot;Nissan Used Vehicle Programme&quot; refers to the franchised dealer procurement
                  and allocation service and is governed by strict brand standards and commercial cost
                  boundaries.
                </p>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 font-medium text-slate-800">
                  By registering an authorized dealership account, requesting a vehicle allocation,
                  or placing a purchase order, the customer confirms that it is acquiring the relevant
                  motor vehicles <strong className="font-bold">in trade and for business purposes</strong>.
                </p>
              </div>

              {/* Clause 1 */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">1. Acceptance of Terms</h4>
                <p className="text-slate-600">
                  By creating a dealer account, confirming an allocation hold, or otherwise instructing
                  us to proceed with vehicle order fulfillment, the customer agrees to these Terms of
                  Trade.
                </p>
                <p className="text-slate-600">
                  The customer warrants that the person accepting these terms or confirming vehicle
                  orders has full corporate authority to bind the dealership.
                </p>
                <p className="text-slate-600">
                  These terms apply together with the accepted landed pricing schedule and any specific
                  conditions detailed within each vehicle dossier.
                </p>
              </div>

              {/* Clause 2 */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">2. AutoHub &amp; Programme Role</h4>
                <p className="text-slate-600">
                  AutoHub provides end-to-end commercial procurement, Japanese export clearance, RoRo ocean
                  shipping, New Zealand border clearance, entry compliance, and nationwide logistics
                  coordination.
                </p>
                <p className="text-slate-600">
                  Vehicles are acquired from verified Japanese wholesale sources and certified Nissan export
                  stocks. AutoHub guarantees compliance with official Japanese Export Certificate (Yushutsu
                  Massho) standards and verified odometer documentation.
                </p>
              </div>

              {/* Clause 3: Commercial Boundary */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">
                  3. Commercial Cost Boundary &amp; Guaranteed Landed Price
                </h4>
                <p className="text-slate-600">
                  The Total Buy Price quoted on the dealer platform is a{" "}
                  <strong className="font-semibold text-slate-900">Guaranteed Fixed Landed Price</strong>.
                  The boundary of inclusions and separately chargeable items is strictly defined as follows:
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
                      <li>Low Volume Vehicle Technical Association (LVVTA) certification</li>
                      <li>MPI biosecurity quarantine flag &amp; specialized decontamination heat treatment</li>
                      <li>Storage or demurrage exceeding 30 calendar days due to dealer hold</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Clause 4 */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">4. Allocation &amp; Decision Window</h4>
                <p className="text-slate-600">
                  Authorized dealerships receive an exclusive 24-hour reservation window upon selecting
                  incoming vehicle stock. Upon expiry of the window or prior dealer confirmation, the
                  allocation converts to a firm, binding commercial purchase commitment.
                </p>
              </div>

              {/* Clause 5 */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">5. Risk &amp; Marine Insurance</h4>
                <p className="text-slate-600">
                  Risk during ocean voyage is covered under AutoHub&apos;s comprehensive open marine cargo
                  policy. Risk passes to the dealership upon physical delivery and sign-off at the nominated
                  dealership facility.
                </p>
              </div>

              {/* Clause 6 */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">6. Inspection &amp; Transit Claims</h4>
                <p className="text-slate-600">
                  The dealership must inspect each vehicle upon delivery. Any physical transit discrepancy
                  must be endorsed on the delivery consignment note and reported within 48 hours of physical
                  receipt.
                </p>
              </div>

              {/* Clause 7 */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">7. Payment &amp; Settlement</h4>
                <p className="text-slate-600">
                  Payment is processed through the dealership&apos;s pre-approved Nissan Financial Services (NFSI)
                  wholesale inventory credit facility or direct electronic funds transfer prior to dispatch from
                  the compliance center.
                </p>
              </div>

              {/* Clause 8 */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">8. Title &amp; PPSA</h4>
                <p className="text-slate-600">
                  Title in each vehicle remains with AutoHub until full payment of the Total Landed Price has
                  been received. The dealership grants AutoHub a security interest under the Personal Property
                  Securities Act 1999 (PPSA).
                </p>
              </div>

              {/* Clause 9: Business-to-Business Supply */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">9. Business-to-Business Supply</h4>
                <p className="text-slate-600">
                  The Nissan Used Vehicle Programme is intended exclusively for customers acquiring motor
                  vehicles in trade.
                </p>
                <p className="text-slate-600">
                  Where the customer acquires vehicles or services for business purposes, the parties agree,
                  to the maximum extent permitted by law, that the{" "}
                  <strong className="font-bold text-slate-900">Consumer Guarantees Act 1993</strong> and
                  sections 9, 12A, and 13 of the <strong className="font-bold text-slate-900">Fair Trading Act 1986</strong>{" "}
                  do not apply.
                </p>
              </div>

              {/* Clause 10: Governing Law */}
              <div className="space-y-1.5 pt-2">
                <h4 className="font-bold text-slate-900 text-xs">10. Governing Law</h4>
                <p className="text-slate-600">
                  These terms and each vehicle transaction are governed exclusively by the laws of{" "}
                  <strong className="font-bold text-slate-900">New Zealand</strong>. The parties submit to the
                  jurisdiction of the New Zealand courts.
                </p>
              </div>

              {/* Final Confirmation Banner */}
              <div className="pt-2">
                <p className="font-bold text-slate-900 text-xs bg-slate-100/80 p-3 rounded-xl border border-slate-200">
                  By accepting these Particular Terms of Trade, the customer confirms that it has read,
                  understood, and accepted the Commercial Boundary &amp; Terms of Trade in full.
                </p>
              </div>

              {/* Green End of Document Indicator (Visible when scrolled to bottom) */}
              {hasScrolledToBottom && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>You have reached the end of the Particular Terms of Trade.</span>
                </div>
              )}
            </>
          ) : (
            /* ───────────────────────────────────────────────────────── */
            /* PRIVACY POLICY TAB                                        */
            /* ───────────────────────────────────────────────────────── */
            <>
              <div className="space-y-1 pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                  Nissan NZ &amp; AutoHub Dealership Privacy Policy
                </h3>
                <p className="font-bold text-slate-800 text-xs">
                  Compliance with New Zealand Privacy Act 2020
                </p>
              </div>

              <div className="space-y-3 text-slate-600">
                <p>
                  This Privacy Policy outlines how Nissan Motor Co. (New Zealand) Ltd and AutoHub New Zealand Ltd
                  collect, store, use, and protect dealership and authorized user information within the Dealer
                  Order Platform.
                </p>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-xs">1. Information We Collect</h4>
                  <p>
                    We collect dealership business information including legal trading entity name, NZBN, Nissan
                    dealer code, authorized buyer contact details (name, business email, direct phone), facility delivery
                    addresses, and financial clearing account references.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-xs">2. Purpose of Collection</h4>
                  <p>
                    Collected data is strictly used for order processing, allocation management, NZ Customs border
                    declarations, Ministry for Primary Industries (MPI) biosecurity filings, MR2A compliance
                    registration, and delivery logistics coordination.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-xs">3. Security &amp; Storage</h4>
                  <p>
                    All dealership records are encrypted in transit using 256-bit TLS encryption and stored in secure
                    datacenter facilities compliant with ISO/IEC 27001 standards. Access is restricted to authorized
                    AutoHub logistics operators and Nissan NZ programme administrators.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-xs">4. Dealer Rights</h4>
                  <p>
                    In accordance with the New Zealand Privacy Act 2020, dealerships have the right to request access
                    to and correction of their registered profile and contact records at any time.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* STICKY SCROLL WARNING PILL (When not at bottom)             */}
        {/* ─────────────────────────────────────────────────────────── */}
        {!hasScrolledToBottom && activeTab === "TERMS" && (
          <div className="bg-[#FFFBEB] border-t border-b border-[#FDE68A] px-4 py-2 flex items-center justify-between text-xs text-[#92400E] shrink-0 transition-all">
            <div className="flex items-center gap-2">
              <ArrowDown className="w-4 h-4 text-[#C3002F] animate-bounce shrink-0" />
              <span className="font-medium text-[11px] sm:text-xs">
                Please scroll through and view the entire terms to enable acceptance
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-[#FDE68A] text-slate-800 shrink-0">
              {scrollProgress}%
            </span>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────── */}
        {/* FOOTER                                                      */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="p-4 px-5 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium self-start sm:self-auto">
            {hasScrolledToBottom ? (
              <span className="text-slate-600 flex items-center gap-1">
                ✓ Terms fully viewed. You may now accept.
              </span>
            ) : (
              <span className="text-slate-400">Scroll down to read all terms.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Close
            </button>

            {!hasScrolledToBottom ? (
              <button
                type="button"
                onClick={handleScrollToBottom}
                className="px-4 py-2 text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Scroll to Agree (↓)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  audio.playSuccessChime();
                  onAccept();
                  onClose();
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#C3002F] hover:bg-[#A10026] active:scale-[0.98] rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Accept &amp; Agree to Terms</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

