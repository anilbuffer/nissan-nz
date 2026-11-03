"use client";

import React, { useState } from "react";
import { X, CheckCircle2, ShieldCheck, FileText, AlertTriangle, Building2, Mail, Phone, MapPin } from "lucide-react";
import { MOCK_PRICING_ZONES } from "@/lib/mock-data";

interface DealerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DealerRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: DealerRegistrationModalProps) {
  const [dealershipName, setDealershipName] = useState("");
  const [dealerCode, setDealerCode] = useState("");
  const [nzbn, setNzbn] = useState("");
  const [physicalAddress, setPhysicalAddress] = useState("");
  const [region, setRegion] = useState("Auckland");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  
  // Mandatory checkboxes - unticked by default as per US-02
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptCostBoundary, setAcceptCostBoundary] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms || !acceptCostBoundary) {
      alert("Both Terms of Trade and Commercial Cost Boundary must be accepted.");
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-2xl sm:rounded-3xl shadow-hover border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-[#0A1322] px-6 py-5 text-white flex items-center justify-between border-b border-[#1B2A42]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-crimson-600 flex items-center justify-center font-bold text-lg text-white shadow-soft">
              D
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white">Nissan Dealer Onboarding Application</h3>
              <p className="text-xs text-slate-400">Dealer Order Platform · New Zealand</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Application Submitted for Review</h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Thank you, <span className="font-semibold text-slate-900">{contactName}</span>. Your dealership application for{" "}
              <span className="font-semibold text-slate-900">{dealershipName}</span> has been received.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left max-w-md mx-auto text-xs text-amber-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Status: Pending Programme Authorization (AC-01)</span>
              </div>
              <p>
                In accordance with programme security requirements, stock catalogue access is restricted until administrators confirm your dealer code and assign your regional pricing zone.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                  onSuccess();
                }}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Dealership Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Building2 className="w-4 h-4 text-crimson-600" />
                <span>1. Dealership Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Legal / Trading Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. South Auckland Nissan Ltd"
                    value={dealershipName}
                    onChange={(e) => setDealershipName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Nissan Dealer Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NZ-NIS-AKL04"
                    value={dealerCode}
                    onChange={(e) => setDealerCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">NZBN (NZ Business Number)</label>
                  <input
                    type="text"
                    placeholder="94290..."
                    value={nzbn}
                    onChange={(e) => setNzbn(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Geographic Region *</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-600"
                  >
                    <option value="Auckland">Auckland Metro (Zone 1)</option>
                    <option value="Waikato">Waikato / Bay of Plenty (Zone 2)</option>
                    <option value="Wellington">Wellington / Lower North Island (Zone 3)</option>
                    <option value="Canterbury">Canterbury / South Island (Zone 4)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-medium text-slate-700">Dealership Physical Address *</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Street address for standard NZ delivery movements"
                      value={physicalAddress}
                      onChange={(e) => setPhysicalAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Contact Details */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Mail className="w-4 h-4 text-crimson-600" />
                <span>2. Authorized Dealer Contact</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jason Bell"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Business Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jason@dealership.co.nz"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Direct Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+64 21 000 0000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-crimson-500/20 focus:border-crimson-600"
                  />
                </div>
              </div>
            </div>

            {/* Mandatory Commercial Acknowledgements (US-02) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <FileText className="w-4 h-4 text-crimson-600" />
                <span>3. Commercial Boundary & Terms Acceptance</span>
              </div>

              {/* Price boundary explainer card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-2">
                <div className="font-semibold text-slate-800 flex items-center justify-between">
                  <span>Programme Fixed-Price vs Separately Chargeable Boundary</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-mono">v2026.1</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="font-medium text-emerald-700 block mb-0.5">✅ Included in Total Buy Price:</span>
                    Vehicle FOB cost, door-to-door RoRo shipping, customs clearance, NZ GST, standard MR2A compliance inspection, and 2 standard delivery movements.
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="font-medium text-amber-700 block mb-0.5">⚠️ Potential Additional Cost:</span>
                    Non-standard compliance repairs, engineering certifications, border flags, demurrage, or requested accessories (quoted & approved prior to work).
                  </div>
                </div>
              </div>

              {/* Checkbox 1: Terms of Trade */}
              <label className="flex items-start gap-3 p-3 bg-white hover:bg-slate-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-crimson-600 focus:ring-crimson-500 border-slate-300"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Acceptance of Nissan NZ Programme Terms of Trade (v2026.1)</strong>
                  I confirm that our dealership accepts the Terms of Trade governing stock assessment, allocation timelines, and binding purchase conditions.
                </span>
              </label>

              {/* Checkbox 2: Additional Cost Boundary */}
              <label className="flex items-start gap-3 p-3 bg-white hover:bg-slate-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={acceptCostBoundary}
                  onChange={(e) => setAcceptCostBoundary(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-crimson-600 focus:ring-crimson-500 border-slate-300"
                />
                <span className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Commercial Additional-Cost Boundary Acknowledgement</strong>
                  I acknowledge that fixed prices assume a standard compliance pass. Any unexpected repairs or certifications will be evidenced and approved separately before work commences.
                </span>
              </label>
            </div>

            {/* Submit CTA */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!acceptTerms || !acceptCostBoundary}
                className={`px-5 py-2.5 text-sm font-semibold rounded-xl text-white shadow-soft transition-all flex items-center gap-2 ${
                  acceptTerms && acceptCostBoundary
                    ? "bg-crimson-600 hover:bg-crimson-700 cursor-pointer shadow-crimson-600/20"
                    : "bg-slate-300 cursor-not-allowed text-slate-500"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Submit Application for Verification
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

