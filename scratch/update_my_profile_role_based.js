const fs = require('fs');

const filePath = 'components/settings/PlatformSettingsView.tsx';

const newCode = `"use client";

import React, { useState } from "react";
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
  Shield,
  KeyRound,
  FileCheck2,
  CheckCircle2,
  ExternalLink,
  Car,
  Lock,
  Layers,
  ArrowUpRight,
  Download,
  Clock,
  Award,
} from "lucide-react";

interface PlatformSettingsViewProps {
  onBack: () => void;
}

export default function PlatformSettingsView({ onBack }: PlatformSettingsViewProps) {
  const router = useRouter();
  const { currentUser, currentDealer, logout } = useAuth();
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const role: UserRole = currentUser?.role || "DEALER_USER";

  const handleLogout = () => {
    audio.playSubtleClick();
    logout();
    router.push("/");
  };

  const handleActionClick = (action: { label: string; href?: string; type?: string }) => {
    audio.playSubtleClick();
    if (action.href) {
      router.push(action.href);
    } else if (action.type === "DOWNLOAD_TERMS") {
      audio.playSuccessChime();
      setActionNotice("Downloading signed Nissan NZ Terms of Trade & Wholesale Allocation Agreement (v2026.1 PDF)...");
      setTimeout(() => setActionNotice(null), 4000);
    } else if (action.type === "EXPORT_AUDIT") {
      audio.playSuccessChime();
      setActionNotice("Exporting SHA-256 cryptographic audit manifest & MR2A compliance records (CSV/PDF)...");
      setTimeout(() => setActionNotice(null), 4000);
    }
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
          metrics: [
            { label: "Platform Clearance", value: "Master Superadmin", sub: "All 5 Roles Governed" },
            { label: "Active Privileges", value: "18 / 18 Enabled", sub: "Unrestricted Authority" },
            { label: "Wholesale Facility", value: "$2,500,000 NZD", sub: "Platform Allocation Pool" },
            { label: "Security Protocol", value: "MFA Hardware Token", sub: "Session Verified" },
          ],
          capabilities: [
            {
              title: "24h Hold Override & Release",
              desc: "Administrative authority to inspect, confirm wholesale allocation, or release 24h exclusivity locks.",
              icon: Lock,
            },
            {
              title: "Franchise Dealer Governance",
              desc: "Authorize new dealer onboarding, verify NZBN credentials, and assign geographic pricing zones.",
              icon: Building2,
            },
            {
              title: "RBAC & Security Management",
              desc: "Configure granular permissions, view immutable audit logs, and oversee user authorizations.",
              icon: ShieldCheck,
            },
          ],
          quickActions: [
            { label: "Manage Roles & Permissions", href: "/admin/roles", isPrimary: true, icon: KeyRound },
            { label: "Review Dealership Applications", href: "/admin/dealers", icon: Building2 },
            { label: "Inspect Cryptographic Audit Logs", href: "/admin/audit", icon: ShieldCheck },
          ],
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
          metrics: [
            { label: "Export Marshalling", value: "Yokohama & Kobe", sub: "Primary Staging Yards" },
            { label: "JEVIC Authority", value: "Level 3 Sign-off", sub: "Digital Odometer Tamper Check" },
            { label: "Ingestion Batch", value: "100 Units / Upload", sub: "USS Auction Integration" },
            { label: "Acquisition Baseline", value: "Raw JPY FOB", sub: "Direct Japan Procurement" },
          ],
          capabilities: [
            {
              title: "Japanese Inventory Ingestion",
              desc: "Create single vehicle records or batch upload Tokyo/Yokohama USS auction sheets and 360 photography.",
              icon: Car,
            },
            {
              title: "JEVIC Tamper Certification",
              desc: "Execute digital odometer verification and generate cryptographically bound pre-export inspection sheets.",
              icon: FileCheck2,
            },
            {
              title: "Yard Staging & RoRo Transit",
              desc: "Manage vehicle dispatch from Japanese export yards and coordinate shipping line carrier schedules.",
              icon: MapPin,
            },
          ],
          quickActions: [
            { label: "Batch Upload Japanese Inventory", href: "/japan/upload", isPrimary: true, icon: ArrowUpRight },
            { label: "Inspect Japanese Yard Stock", href: "/japan/inventory", icon: Car },
            { label: "Add Single Export Vehicle", href: "/japan/add-vehicle", icon: Layers },
          ],
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
          metrics: [
            { label: "Assigned Delivery Zone", value: zoneId, sub: `$${zone.deliveryCostNZD} NZD Domestic Towing` },
            { label: "Approved Floorplan", value: "$600,000 NZD", sub: "Tier 1 Franchise Facility" },
            { label: "Concurrent 24h Holds", value: "6 Vehicles Max", sub: "Atomic Exclusivity Lock" },
            { label: "Franchise Agreement", value: "v2026.1 Bound", sub: "Commercial Boundary Accepted" },
          ],
          capabilities: [
            {
              title: "Wholesale Allocation Sign-off",
              desc: "Authority to lock 24h exclusivity holds and issue confirmed purchase orders on Japanese stock.",
              icon: CheckCircle2,
            },
            {
              title: "Commercial Cost Boundary Governance",
              desc: "Enforce pre-approved landed cost boundaries and authorize domestic delivery scheduling.",
              icon: FileCheck2,
            },
            {
              title: "Dealership Staff Management",
              desc: "Invite showroom sales buyers, manage buyer floorplan limits, and revoke procurement tokens.",
              icon: User,
            },
          ],
          quickActions: [
            { label: "View Dealership Profile & Floorplan", href: "/dealer/profile", isPrimary: true, icon: Building2 },
            { label: "Browse Live Japanese Inventory", href: "/dealer/stocks", icon: Car },
            { label: "Download Signed Terms Agreement", type: "DOWNLOAD_TERMS", icon: Download },
          ],
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
          metrics: [
            { label: "Commercial Zone", value: zoneId, sub: `$${zone.deliveryCostNZD} NZD Landed Towing` },
            { label: "Assigned Holding Limit", value: "$350,000 NZD", sub: "Approved Floorplan Access" },
            { label: "Concurrent Holds", value: "3 Vehicles Max", sub: "24h Exclusivity Lock Limit" },
            { label: "Pricing Security", value: "Guaranteed NZD", sub: "FOB Baseline Protected" },
          ],
          capabilities: [
            {
              title: "24h Atomic Exclusivity Lock",
              desc: "Place instantaneous 24-hour holds on live Tokyo/Yokohama inventory with zero counter-party sniping.",
              icon: Clock,
            },
            {
              title: "Fixed Landed NZD Calculation",
              desc: "View guaranteed all-inclusive landed pricing with domestic towing, 15% GST, customs, and MR2A WoF.",
              icon: FileCheck2,
            },
            {
              title: "USS Auction Inspection Dossier",
              desc: "Access verified 360 studio photography, JEVIC odometer verification, and USS Japanese inspection sheets.",
              icon: Car,
            },
          ],
          quickActions: [
            { label: "Browse Live Stock Catalog", href: "/dealer/stocks", isPrimary: true, icon: Car },
            { label: "View Active Exclusivity Holds", href: "/dealer/holds", icon: Clock },
            { label: "Track Confirmed Shipments", href: "/dealer/orders", icon: Layers },
          ],
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
          metrics: [
            { label: "Audit Clearance", value: "Tier 5 Read-Only", sub: "Independent Compliance" },
            { label: "Cryptographic Ledger", value: "SHA-256 Tamper-Proof", sub: "Immutable Event Log" },
            { label: "MR2A Standards", value: "NZTA Certified", sub: "Structural Pass Verification" },
            { label: "JEVIC Inspection", value: "Direct Certificate Access", sub: "Anti-Fraud Mileage Check" },
          ],
          capabilities: [
            {
              title: "Cryptographic Audit Trail Inspection",
              desc: "Inspect immutable SHA-256 event logs for all dealer logins, vehicle reservations, and cost modifications.",
              icon: ShieldCheck,
            },
            {
              title: "JEVIC & MR2A Import Compliance",
              desc: "Verify Japanese odometer certificates and New Zealand Transport Agency border clearance documentation.",
              icon: FileCheck2,
            },
            {
              title: "Regulatory Export Generation",
              desc: "Generate compliant digital manifests for New Zealand Customs Service and biosecurity authorities.",
              icon: Download,
            },
          ],
          quickActions: [
            { label: "Inspect Cryptographic Audit Trail", href: "/admin/audit", isPrimary: true, icon: ShieldCheck },
            { label: "Verify JEVIC & MR2A Records", href: "/admin/inventory", icon: FileCheck2 },
            { label: "Export Regulatory Audit Manifest", type: "EXPORT_AUDIT", icon: Download },
          ],
        };
    }
  };

  const config = getRoleConfig();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Top Header & Navigation                                  */}
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
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Platform</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700 font-medium">{config.tierShort}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-bold">My Profile</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              My Profile &amp; Role Identity
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

      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. User Identity Card (Clean Executive Presentation)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-100">
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

        {/* 4-Stat Role-Specific Executive Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {config.metrics.map((m, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                {m.label}
              </span>
              <div className="text-sm sm:text-base font-black text-slate-900 font-mono truncate">
                {m.value}
              </div>
              <span className="text-[11px] text-slate-500 font-medium block truncate">
                {m.sub}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Role-Specific Profile & Operational Details              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              Operational Credentials &amp; Station Details
            </h3>
            <p className="text-xs text-slate-500">
              Personal contact details, organization credentials, and regulatory jurisdiction tailored to your role.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Role: <strong className="text-slate-800">{role}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name</span>
            </div>
            <div className="text-sm font-bold text-slate-900">
              {currentUser?.name || "David Miller"}
            </div>
          </div>

          {/* Email */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Direct Business Email</span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono truncate">
              {currentUser?.email || "dealer@aucklandnissan.co.nz"}
            </div>
          </div>

          {/* Direct Phone */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Direct Telephone</span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {currentUser?.phone || "+64 9 520 8899"}
            </div>
          </div>

          {/* Title & Department */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Designation &amp; Department</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {currentUser?.title || config.roleTitle} · {currentUser?.department || "Operations"}
            </div>
          </div>

          {/* Entity / Dealership */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Entity / Dealership / Organization</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {config.entityName}
            </div>
          </div>

          {/* Station / Base Location */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.stationLabel}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {config.stationValue}
            </div>
          </div>

          {/* Identifier Code */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.codeLabel}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {config.codeValue}
            </div>
          </div>

          {/* Jurisdiction / Zone */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.jurisdictionLabel}</span>
            </div>
            <div className="text-sm font-bold text-slate-900 truncate">
              {config.jurisdictionValue}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Role-Specific Operational Capabilities & Authority       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-5">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Role Operational Authority &amp; Capabilities
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Key operational privileges and permissions granted to the <strong className="text-slate-800">{config.roleTitle}</strong> role.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
                    <Icon className="w-4 h-4 text-slate-700" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">
                    {cap.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {cap.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Role-Specific Functional Quick Actions                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight">
            Role Operations &amp; Quick Actions
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct operational actions corresponding strictly to your authorized role workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {config.quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleActionClick(action)}
                className={
                  action.isPrimary
                    ? "py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white font-bold text-xs transition-all shadow-[0_4px_16px_rgba(225,29,72,0.35)] cursor-pointer flex items-center gap-2 active:scale-[0.98]"
                    : "btn-outline py-2.5 px-4 text-xs"
                }
              >
                <Icon className="w-4 h-4" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <span>Identity authenticated under Nissan Motor Corporation New Zealand RBAC Framework.</span>
          <span className="font-mono text-[11px] text-slate-400">Security Clearance Verified</span>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(filePath, newCode, 'utf8');
console.log("Successfully overhauled PlatformSettingsView.tsx with role-specific details and actions!");

