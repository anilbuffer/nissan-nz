"use client";

import React, { useState } from "react";
import { UserRole, ZoneId, DealerAccount, UserAccount } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  X,
  UserPlus,
  Mail,
  User,
  Phone,
  Building2,
  Shield,
  MapPin,
  DollarSign,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealers: DealerAccount[];
  onInvite: (user: Omit<UserAccount, "id">) => void;
}

export default function InviteUserModal({
  isOpen,
  onClose,
  dealers,
  onInvite,
}: InviteUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+64 ");
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Sales & Pre-Owned");
  const [role, setRole] = useState<UserRole>("DEALER_USER");
  const [dealerId, setDealerId] = useState<string>(dealers[0]?.id || "");
  const [holdingLimitNZD, setHoldingLimitNZD] = useState(350000);
  const [maxActiveHolds, setMaxActiveHolds] = useState(3);
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const selectedDealer = dealers.find((d) => d.id === dealerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter the user's full name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid business email address.");
      return;
    }

    setIsSubmitting(true);
    audio.playSubtleClick();

    setTimeout(() => {
      let dealershipName = "Central Operations";
      let zoneId: ZoneId | undefined = undefined;

      if (role === "DEALER_USER" || role === "DEALER_ADMIN") {
        dealershipName = selectedDealer?.legalTradingName || "Authorised Dealer";
        zoneId = selectedDealer?.pricingZoneId || "ZONE_1";
      } else if (role === "NISSAN_JAPAN") {
        dealershipName = "Nissan Motor Co. Japan (Yokohama HQ)";
      } else if (role === "AUTOHUB_ADMIN") {
        dealershipName = "AutoHub Central Operations (Auckland HQ)";
      } else if (role === "READONLY_AUDITOR") {
        dealershipName = "Independent Regulatory Audit Branch";
      }

      onInvite({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        title: title.trim() || "Operations Specialist",
        department: department.trim(),
        role,
        dealerId: (role === "DEALER_USER" || role === "DEALER_ADMIN") ? dealerId : undefined,
        dealershipName,
        zoneId,
        holdingLimitNZD: (role === "DEALER_USER" || role === "DEALER_ADMIN") ? holdingLimitNZD : 0,
        maxActiveHolds: (role === "DEALER_USER" || role === "DEALER_ADMIN") ? maxActiveHolds : 0,
        mfaEnabled,
        active: true,
        avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 1000)}?auto=format&fit=crop&w=150&q=80`,
      });

      audio.playSuccessChime();
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#0A1322] text-white flex items-center justify-between border-b border-[#1B2A42]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#BE123C] flex items-center justify-center text-white shadow-soft">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Invite Platform User
              </h2>
              <p className="text-xs text-slate-300">
                Grant role-based access to Nissan NZ Used Vehicle Programme
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#E11D48]" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name & Business Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Legal Name <span className="text-[#E11D48]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Macpherson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Business Email Address <span className="text-[#E11D48]">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. liam@otagonissan.co.nz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent text-xs"
                />
              </div>
            </div>
          </div>

          {/* Phone & Job Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Direct Phone / Mobile
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="tel"
                  placeholder="+64 9 520 8899"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Job Title & Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Inventory Buyer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent text-xs"
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Platform Role & Security Level <span className="text-[#E11D48]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: "DEALER_USER",
                  label: "Dealership Buyer / Sales",
                  desc: "Browse stock, view landed NZD, place 24h holds",
                },
                {
                  id: "DEALER_ADMIN",
                  label: "Dealer Principal",
                  desc: "Full dealership authority, terms approval, team management",
                },
                {
                  id: "AUTOHUB_ADMIN",
                  label: "Platform Operations Controller",
                  desc: "Central controller, RoRo tracking, dealer onboarding",
                },
                {
                  id: "NISSAN_JAPAN",
                  label: "Japan Procurement & Yard",
                  desc: "Export marshalling, batch upload, JEVIC inspections",
                },
                {
                  id: "READONLY_AUDITOR",
                  label: "Compliance & Financial Auditor",
                  desc: "Read-only access to audit logs, MR2A, and customs",
                },
              ].map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    audio.playSubtleClick();
                    setRole(r.id as UserRole);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    role === r.id
                      ? "border-[#E11D48] bg-rose-50/50 shadow-xs ring-1 ring-[#E11D48]"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{r.label}</span>
                    {role === r.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E11D48]" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dealership Assignment (if dealer role) */}
          {(role === "DEALER_USER" || role === "DEALER_ADMIN") && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assigned Certified Dealership <span className="text-[#E11D48]">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <select
                    value={dealerId}
                    onChange={(e) => setDealerId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E11D48] text-xs cursor-pointer"
                  >
                    {dealers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.legalTradingName} ({d.dealerCode} · {d.pricingZoneId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedDealer && (
                <div className="flex items-center gap-4 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedDealer.region}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-[#0A1322]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Zone: {selectedDealer.pricingZoneId}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    Purchasing Authority Limit (NZD)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="number"
                      step={25000}
                      value={holdingLimitNZD}
                      onChange={(e) => setHoldingLimitNZD(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    Max Concurrent Holds
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxActiveHolds}
                    onChange={(e) => setMaxActiveHolds(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MFA Checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="mfa"
              checked={mfaEnabled}
              onChange={(e) => setMfaEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-[#E11D48] focus:ring-[#E11D48] border-slate-300 cursor-pointer"
            />
            <label htmlFor="mfa" className="text-xs text-slate-700 cursor-pointer">
              <span className="font-semibold block text-slate-900">
                Enforce Multi-Factor Authentication (MFA / TOTP)
              </span>
              <span className="text-[11px] text-slate-500">
                User must configure an authenticator app upon first sign-in before accessing wholesale pricing.
              </span>
            </label>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Sending Invitation...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Send Invitation & Magic Link</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

