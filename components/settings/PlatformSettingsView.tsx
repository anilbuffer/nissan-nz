"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { UserRole } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  User,
  LogOut,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Briefcase,
  Hash,
  Award,
} from "lucide-react";

interface PlatformSettingsViewProps {
  onBack: () => void;
}

export default function PlatformSettingsView({ onBack }: PlatformSettingsViewProps) {
  const router = useRouter();
  const { currentUser, currentDealer, logout } = useAuth();

  const role: UserRole = currentUser?.role || "DEALER_USER";

  const handleLogout = () => {
    audio.playSubtleClick();
    logout();
    router.push("/");
  };

  // ─────────────────────────────────────────────────────────────
  // ROLE-SPECIFIC PERSONA CONFIGURATIONS
  // ─────────────────────────────────────────────────────────────
  const getRoleConfig = () => {
    switch (role) {
      case "AUTOHUB_ADMIN":
        return {
          tierBadge: "Tier 1 · Full Platform Authority",
          tierShort: "Tier 1",
          roleTitle: "Operations Central Controller",
          securityBadge: "Verified Platform Master Key (MFA)",
          entityName: "AutoHub Operations Center (Auckland HQ)",
          stationLabel: "Operations Center HQ",
          stationValue: "Auckland Harbour Logistics Central, New Zealand",
          codeLabel: "Operations Node ID",
          codeValue: "NODE-NZ-HQ-01",
          jurisdictionLabel: "System Jurisdiction",
          jurisdictionValue: "National Network & Export Gateways (NZ & Japan)",
        };

      case "NISSAN_JAPAN":
        return {
          tierBadge: "Tier 2 · Export Procurement & Yard Marshalling",
          tierShort: "Tier 2",
          roleTitle: "Yokohama Export Marshalling Director",
          securityBadge: "Verified Nissan Japan Authority (MFA)",
          entityName: "Nissan Motor Co., Ltd. (Japan Export Division)",
          stationLabel: "Export Marshalling Base",
          stationValue: "Yokohama Terminal (Bay 14) & Kobe Export Yard, Japan",
          codeLabel: "Export Terminal Code",
          codeValue: "JP-YOK-EXP-08",
          jurisdictionLabel: "Yard Operations Jurisdiction",
          jurisdictionValue: "USS Auctions, JEVIC Digital Verification & RoRo Vessels",
        };

      case "DEALER_ADMIN": {
        const zoneId = currentDealer?.pricingZoneId || currentUser?.zoneId || "ZONE_1";
        const zone = OFFICIAL_PRICING_ZONES[zoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;
        return {
          tierBadge: "Tier 3 · Franchise Dealer Principal",
          tierShort: "Tier 3",
          roleTitle: "Franchise Principal & Executive Director",
          securityBadge: "Verified Nissan Franchise SSO (MFA)",
          entityName: currentDealer?.legalTradingName || currentUser?.dealershipName || "Auckland Nissan City Ltd",
          stationLabel: "Franchise Showroom Address",
          stationValue: currentDealer?.address || "360 Great South Road, Greenlane, Auckland 1051",
          codeLabel: "Franchise Dealer Code",
          codeValue: currentDealer?.dealerCode || "NZ-NIS-AKL01",
          jurisdictionLabel: "Assigned Pricing Zone",
          jurisdictionValue: `${zoneId} — ${zone.zoneName} ($${zone.deliveryCostNZD} NZD Towing)`,
        };
      }

      case "DEALER_USER": {
        const zoneId = currentDealer?.pricingZoneId || currentUser?.zoneId || "ZONE_1";
        const zone = OFFICIAL_PRICING_ZONES[zoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;
        return {
          tierBadge: "Tier 4 · Franchise Sales & Inventory Buyer",
          tierShort: "Tier 4",
          roleTitle: "Authorised Dealership Wholesale Buyer",
          securityBadge: "Verified Franchise Buyer (MFA)",
          entityName: currentDealer?.legalTradingName || currentUser?.dealershipName || "Auckland Nissan City Ltd",
          stationLabel: "Dealership Showroom Depot",
          stationValue: currentDealer?.address || "360 Great South Road, Greenlane, Auckland 1051",
          codeLabel: "Dealer Franchise Code",
          codeValue: currentDealer?.dealerCode || "NZ-NIS-AKL01",
          jurisdictionLabel: "Assigned Delivery Zone",
          jurisdictionValue: `${zoneId} — ${zone.zoneName}`,
        };
      }

      case "READONLY_AUDITOR":
      default:
        return {
          tierBadge: "Tier 5 · Regulatory Read-Only Auditor",
          tierShort: "Tier 5",
          roleTitle: "Principal Border Compliance Auditor",
          securityBadge: "Verified Regulatory Audit Key (MFA)",
          entityName: "New Zealand Transport Agency (NZTA) & Customs Regulatory Liaison",
          stationLabel: "Regulatory Inspection Depot",
          stationValue: "Border Compliance Branch, Auckland Harbour & Lyttelton Port",
          codeLabel: "Auditor Accreditation ID",
          codeValue: "NZ-REG-AUDIT-409",
          jurisdictionLabel: "Audit Boundary",
          jurisdictionValue: "Read-Only Cryptographic Access (Zero Order/Price Mutation Authority)",
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Navigation Bar                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onBack();
            }}
            className="btn-outline"
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Account Details
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-outline hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-slate-700 self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. User Identity Card (Clean Executive Header)              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#0A1322] text-white font-black text-2xl flex items-center justify-center shadow-xs ring-4 ring-slate-100 shrink-0">
            {currentUser?.name?.charAt(0) || "U"}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {currentUser?.name || "David Miller"}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                {config.tierBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentUser?.title || config.roleTitle} · <strong className="text-slate-800 font-bold">{config.entityName}</strong>
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold self-start sm:self-auto font-mono shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{config.securityBadge}</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. CARD 1: Personal Contact Details                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-4 h-4 text-[#E11D48]" />
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Personal Contact Details
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {currentUser?.name || "David Miller"}
            </div>
          </div>

          {/* Business Email */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Direct Business Email</span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono truncate">
              {currentUser?.email || "dealer@aucklandnissan.co.nz"}
            </div>
          </div>

          {/* Contact Telephone */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Direct Contact Phone</span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {currentUser?.phone || "+64 9 520 8899"}
            </div>
          </div>

          {/* Designation & Department */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Designation &amp; Department</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {currentUser?.title || config.roleTitle} · {currentUser?.department || "Operations"}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. CARD 2: Organization & Credential Details               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-[#E11D48]" />
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Organization Credentials
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Entity / Organization */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Entity / Organization</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {config.entityName}
            </div>
          </div>

          {/* Base Location / Showroom / Terminal */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.stationLabel}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {config.stationValue}
            </div>
          </div>

          {/* Identifier Code / Node Code */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.codeLabel}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {config.codeValue}
            </div>
          </div>

          {/* Operational Jurisdiction / Zone */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.jurisdictionLabel}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {config.jurisdictionValue}
            </div>
          </div>
        </div>

        {/* Reassurance Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <span>Identity authenticated under Nissan Motor Corporation New Zealand RBAC Security Framework.</span>
          <span className="font-mono text-[11px] text-slate-400">MFA Session Active</span>
        </div>
      </div>
    </div>
  );
}
