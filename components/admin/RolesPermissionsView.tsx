"use client";

import React, { useState } from "react";
import { useProgramme } from "@/lib/programme-context";
import { UserRole } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Lock,
  Unlock,
  RotateCcw,
  Save,
  Users,
  Building2,
  Car,
  DollarSign,
  FileSpreadsheet,
  Eye,
} from "lucide-react";

interface PermissionDef {
  key: string;
  name: string;
  description: string;
  category: "INVENTORY" | "COMMERCIAL" | "COMPLIANCE" | "ADMINISTRATION";
}

const PERMISSION_DEFINITIONS: PermissionDef[] = [
  // 1. Inventory & Vehicle Catalog
  {
    key: "inventory.browse",
    name: "Browse Stock Catalog",
    description: "Search, filter, and inspect live Tokyo/Yokohama inventory.",
    category: "INVENTORY",
  },
  {
    key: "inventory.view_fob",
    name: "View JPY FOB Wholesale",
    description: "Access supplier baseline auction purchase cost in Japanese Yen.",
    category: "INVENTORY",
  },
  {
    key: "inventory.view_landed",
    name: "View Landed NZD Buy Price",
    description: "Inspect itemized delivery, freight, GST, and MR2A compliance costs.",
    category: "INVENTORY",
  },
  {
    key: "inventory.reserve_hold",
    name: "24-Hour Atomic Hold Lock",
    description: "Execute exclusive reservation lock preventing duplicate allocation.",
    category: "INVENTORY",
  },
  {
    key: "inventory.create_edit",
    name: "Add & Edit Vehicle Specs",
    description: "Create stock entries, edit VIN chassis, powertrain, and auction grade.",
    category: "INVENTORY",
  },
  {
    key: "inventory.batch_upload",
    name: "Batch Manifest Excel Upload",
    description: "Ingest bulk vehicle manifests via Excel (.xlsx) and CSV spreadsheets.",
    category: "INVENTORY",
  },

  // 2. Commercial & Pricing Operations
  {
    key: "commercial.view_margins",
    name: "Retail Gross Margin Calculator",
    description: "View benchmark trade price, estimated gross profit, and dealer ROI.",
    category: "COMMERCIAL",
  },
  {
    key: "commercial.configure_zones",
    name: "Configure Pricing Zones (1-5)",
    description: "Update domestic delivery tariffs and compliance pricing constants.",
    category: "COMMERCIAL",
  },
  {
    key: "commercial.approve_dealers",
    name: "Approve Dealer Onboarding",
    description: "Review franchise applications, assign pricing zones, and clear credit.",
    category: "COMMERCIAL",
  },
  {
    key: "commercial.override_costs",
    name: "Attach Additional Logistic Costs",
    description: "Add or dispute port storage, demurrage, and compliance repair charges.",
    category: "COMMERCIAL",
  },

  // 3. Inspection & Border Compliance
  {
    key: "compliance.view_auction_sheet",
    name: "Inspect Auction Sheets & Defects",
    description: "Access high-resolution Japanese auction inspection sheets and defect maps.",
    category: "COMPLIANCE",
  },
  {
    key: "compliance.jevic_signoff",
    name: "JEVIC Odometer Sign-Off",
    description: "Verify electronic odometer authenticity and radiation safety stamp.",
    category: "COMPLIANCE",
  },
  {
    key: "compliance.mr2a_certification",
    name: "MR2A Entry Certification",
    description: "Issue 1-year WoF, brake roller results, and Landata registration clearance.",
    category: "COMPLIANCE",
  },
  {
    key: "compliance.biosecurity_export",
    name: "Biosecurity & MPI Clearance",
    description: "Export quarantine heat treatment and border biosecurity dossiers.",
    category: "COMPLIANCE",
  },

  // 4. Platform Administration & Governance
  {
    key: "admin.manage_users",
    name: "User Account Management",
    description: "Invite platform personnel, assign dealerships, and revoke sessions.",
    category: "ADMINISTRATION",
  },
  {
    key: "admin.manage_roles",
    name: "Modify RBAC Matrix",
    description: "Configure granular operational boundaries and privilege matrices.",
    category: "ADMINISTRATION",
  },
  {
    key: "admin.view_audit_log",
    name: "Immutable Audit Event Log",
    description: "Inspect chronological ledger of all platform commercial actions.",
    category: "ADMINISTRATION",
  },
  {
    key: "admin.export_financials",
    name: "Export Financial & Customs Dossiers",
    description: "Generate CSV reports for NZ Customs, IRD GST returns, and accounting.",
    category: "ADMINISTRATION",
  },
];

// Initial default permission matrix
const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  AUTOHUB_ADMIN: [
    "inventory.browse",
    "inventory.view_fob",
    "inventory.view_landed",
    "inventory.reserve_hold",
    "inventory.create_edit",
    "inventory.batch_upload",
    "commercial.view_margins",
    "commercial.configure_zones",
    "commercial.approve_dealers",
    "commercial.override_costs",
    "compliance.view_auction_sheet",
    "compliance.jevic_signoff",
    "compliance.mr2a_certification",
    "compliance.biosecurity_export",
    "admin.manage_users",
    "admin.manage_roles",
    "admin.view_audit_log",
    "admin.export_financials",
  ],
  NISSAN_JAPAN: [
    "inventory.browse",
    "inventory.view_fob",
    "inventory.create_edit",
    "inventory.batch_upload",
    "compliance.view_auction_sheet",
    "compliance.jevic_signoff",
    "compliance.biosecurity_export",
    "commercial.override_costs",
  ],
  DEALER_ADMIN: [
    "inventory.browse",
    "inventory.view_landed",
    "inventory.reserve_hold",
    "commercial.view_margins",
    "compliance.view_auction_sheet",
    "admin.manage_users",
  ],
  DEALER_USER: [
    "inventory.browse",
    "inventory.view_landed",
    "inventory.reserve_hold",
    "commercial.view_margins",
    "compliance.view_auction_sheet",
  ],
  READONLY_AUDITOR: [
    "compliance.view_auction_sheet",
    "compliance.jevic_signoff",
    "compliance.mr2a_certification",
    "admin.view_audit_log",
    "admin.export_financials",
  ],
};

const ROLES_META: {
  role: UserRole;
  title: string;
  subtitle: string;
  badgeBg: string;
  badgeText: string;
  tier: string;
  tierLabel: string;
  description: string;
}[] = [
  {
    role: "AUTOHUB_ADMIN",
    title: "Operations Central Controller",
    subtitle: "Full Platform Administration",
    badgeBg: "bg-rose-50 border-rose-200",
    badgeText: "text-[#E11D48]",
    tier: "Tier 1 · Full Authority",
    tierLabel: "Tier 1",
    description: "Central platform management, RoRo transit scheduling, dealer approvals, and cost overrides.",
  },
  {
    role: "NISSAN_JAPAN",
    title: "Yokohama Procurement Lead",
    subtitle: "Japan Export Marshalling",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-700",
    tier: "Tier 2 · Export Procurement",
    tierLabel: "Tier 2",
    description: "Stock creation, batch manifests, JEVIC odometer verification, and Japan yard marshalling.",
  },
  {
    role: "DEALER_ADMIN",
    title: "Franchise Dealer Principal",
    subtitle: "Dealership Executive Governance",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
    tier: "Tier 3 · Franchise Executive",
    tierLabel: "Tier 3",
    description: "Dealership governance, terms acceptance, gross profit visibility, and sales team invites.",
  },
  {
    role: "DEALER_USER",
    title: "Dealership Sales & Buyer",
    subtitle: "Direct Wholesale Purchasing",
    badgeBg: "bg-slate-100 border-slate-200",
    badgeText: "text-slate-800",
    tier: "Tier 4 · Inventory Buyer",
    tierLabel: "Tier 4",
    description: "Vehicle search, 360 photography, landed NZD buy prices, and 24-hour atomic hold lock.",
  },
  {
    role: "READONLY_AUDITOR",
    title: "Border Compliance Auditor",
    subtitle: "Independent Regulatory Audit",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
    tier: "Tier 5 · Regulatory Read-Only",
    tierLabel: "Tier 5",
    description: "Independent audit trail inspection, MR2A compliance verification, and customs exports.",
  },
];

export const WHO_ENTERS_WHAT = [
  {
    id: 1,
    information: "Vehicle model, year, grade",
    enteredBy: "Nissan Japan",
    actorBadge: "bg-purple-50 text-purple-700 border-purple-200",
    category: "Stock Specification",
    component: "Single & Batch Vehicle Entry",
    description: "Export yard vehicle catalog profile, manufacture year, and auction grade classification.",
  },
  {
    id: 2,
    information: "Chassis / VIN / Stock ID",
    enteredBy: "Nissan Japan",
    actorBadge: "bg-purple-50 text-purple-700 border-purple-200",
    category: "Identity & Provenance",
    component: "Vehicle Ingestion Engine",
    description: "Original Japanese deregistration document number and unique chassis tracking identifier.",
  },
  {
    id: 3,
    information: "Odometer and specifications",
    enteredBy: "Nissan Japan",
    actorBadge: "bg-purple-50 text-purple-700 border-purple-200",
    category: "Technical Parameters",
    component: "Certified Inspection Ingestion",
    description: "JEVIC certified digital odometer reading (km), powertrain, displacement, and fuel type.",
  },
  {
    id: 4,
    information: "Vehicle photographs",
    enteredBy: "Nissan Japan",
    actorBadge: "bg-purple-50 text-purple-700 border-purple-200",
    category: "Media & Imagery",
    component: "Multi-Angle Photo Storage",
    description: "High-resolution exterior, interior, engine bay, chassis, and tyre condition photo suite.",
  },
  {
    id: 5,
    information: "Condition report and defects",
    enteredBy: "Nissan Japan",
    actorBadge: "bg-purple-50 text-purple-700 border-purple-200",
    category: "Quality Assurance",
    component: "Auction Sheet & Defect Mapping",
    description: "Japanese auction inspection sheets, panel scratch/dent map, interior grade, and radiation stamp.",
  },
  {
    id: 6,
    information: "Vehicle acquisition cost",
    enteredBy: "Nissan Japan, subject to confirmation",
    actorBadge: "bg-purple-50 text-purple-700 border-purple-200",
    category: "Baseline Procurement",
    component: "FOB JPY Wholesale Pricing",
    description: "Wholesale Japan purchase cost in JPY, confirmed prior to export manifest clearance.",
  },
  {
    id: 7,
    information: "Geographic zones",
    enteredBy: "Autohub Admin",
    actorBadge: "bg-blue-50 text-blue-700 border-blue-200",
    category: "Logistics Policy",
    component: "Dealer Approval & Zone Mapping",
    description: "Assignments of Zones 1–5 to approved franchise dealerships based on their physical delivery depot.",
  },
  {
    id: 8,
    information: "Fixed-cost profiles",
    enteredBy: "Autohub Admin",
    actorBadge: "bg-blue-50 text-blue-700 border-blue-200",
    category: "Tariff Baseline",
    component: "Programme Cost Constants",
    description: "Door-to-door RoRo ocean freight, marine insurance cover, and Auckland/Lyttelton port charges.",
  },
  {
    id: 9,
    information: "Standard delivery costs",
    enteredBy: "Autohub Admin",
    actorBadge: "bg-blue-50 text-blue-700 border-blue-200",
    category: "Domestic Movement",
    component: "Linehaul Transport Profiles",
    description: "Two-stage NZ domestic delivery carrier movements to the dealership's physical facility.",
  },
  {
    id: 10,
    information: "Compliance cost components",
    enteredBy: "Autohub Admin",
    actorBadge: "bg-blue-50 text-blue-700 border-blue-200",
    category: "Regulatory Entry",
    component: "MR2A Compliance Schedule",
    description: "Standard entry compliance pass, 1-year WoF, brake roller results, and Landata administration.",
  },
  {
    id: 11,
    information: "Programme component",
    enteredBy: "Autohub Admin",
    actorBadge: "bg-blue-50 text-blue-700 border-blue-200",
    category: "Franchise Governance",
    component: "Nissan Programme Policy",
    description: "Nissan New Zealand certified used vehicle programme royalty and quality seal fee.",
  },
  {
    id: 12,
    information: "Final dealer price calculation",
    enteredBy: "Backend pricing engine",
    actorBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    category: "Deterministic Pricing",
    component: "Landed Pricing Engine",
    description: "Automated real-time calculation producing guaranteed landed buy price with zero dealer estimation.",
  },
  {
    id: 13,
    information: "Dealer-visible Total Buy Price",
    enteredBy: "Dealer Portal",
    actorBadge: "bg-rose-50 text-rose-700 border-rose-200",
    category: "Franchise Interface",
    component: "Stock Catalog & Detail View",
    description: "Clean, transparent landed buy price presented to authorized dealership buyers.",
  },
];

export default function RolesPermissionsView() {
  const { users } = useProgramme();

  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, string[]>>(
    DEFAULT_ROLE_PERMISSIONS
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>("AUTOHUB_ADMIN");
  const [isSaved, setIsSaved] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const togglePermission = (role: UserRole, permKey: string) => {
    audio.playSubtleClick();
    setIsSaved(false);
    setRolePermissions((prev) => {
      const currentList = prev[role] || [];
      const hasPerm = currentList.includes(permKey);
      const nextList = hasPerm
        ? currentList.filter((k) => k !== permKey)
        : [...currentList, permKey];
      return { ...prev, [role]: nextList };
    });
  };

  const handleSave = () => {
    audio.playSuccessChime();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    audio.playSubtleClick();
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    setIsSaved(false);
  };

  const categories = [
    { id: "ALL", label: "All Operational Categories" },
    { id: "INVENTORY", label: "Vehicle & Catalog" },
    { id: "COMMERCIAL", label: "Pricing & Commercial" },
    { id: "COMPLIANCE", label: "JEVIC & Compliance" },
    { id: "ADMINISTRATION", label: "Governance & Security" },
  ];

  const filteredPermissions = PERMISSION_DEFINITIONS.filter(
    (p) => filterCategory === "ALL" || p.category === filterCategory
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner & Action Buttons                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
              Governance & Security Framework
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● RBAC Matrix Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Roles & Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure granular operational boundaries, financial visibility, and regulatory sign-offs across all 5 platform user tiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save RBAC Matrix</span>
          </button>
        </div>
      </div>

      {/* Save Notification Toast */}
      {isSaved && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Role permissions matrix updated successfully across all active platform sessions.</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* Granular RBAC Privilege Matrix                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-6 animate-in fade-in duration-200">
          {/* 2. Clean Executive Platform Roles Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {ROLES_META.map((meta) => {
              const userCount = users.filter((u) => u.role === meta.role).length;
              const permCount = (rolePermissions[meta.role] || []).length;
              const isSelected = selectedRole === meta.role;

              return (
                <div
                  key={meta.role}
                  onClick={() => {
                    audio.playSubtleClick();
                    setSelectedRole(meta.role);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                    isSelected
                      ? "bg-white border-slate-300 ring-2 ring-[#E11D48]/15 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                  }`}
                >
                  {/* Subtle top brand indicator for active role */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#E11D48] via-[#FB7185] to-[#E11D48]" />
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono tracking-wider text-slate-600 uppercase px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80">
                        {meta.tierLabel}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 font-mono">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{userCount} Users</span>
                      </span>
                    </div>

                    <div className="pt-0.5">
                      <h3 className={`font-black text-sm tracking-tight leading-tight transition-colors ${
                        isSelected ? "text-slate-900" : "text-slate-800 group-hover:text-[#E11D48]"
                      }`}>
                        {meta.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-1">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Privileges
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-colors ${
                      isSelected
                        ? "bg-[#E11D48]/10 text-[#E11D48] border border-[#E11D48]/20"
                        : "bg-slate-100 text-slate-700 border border-slate-200/60"
                    }`}>
                      {permCount}/{PERMISSION_DEFINITIONS.length} Perms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Role Focused Scope Strip */}
          {(() => {
            const currentMeta = ROLES_META.find((m) => m.role === selectedRole);
            if (!currentMeta) return null;
            const currentPermCount = (rolePermissions[selectedRole] || []).length;

            return (
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-bold text-slate-800 text-[11px] border border-slate-200 shrink-0">
                    {currentMeta.tierLabel} Scope
                  </span>
                  <div>
                    <strong className="text-slate-900 font-bold mr-1.5">{currentMeta.title}:</strong>
                    <span className="text-slate-500">{currentMeta.description}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-600">
                  <span className="font-bold text-slate-900">{currentPermCount} of {PERMISSION_DEFINITIONS.length}</span>
                  <span>Perms Active</span>
                </div>
              </div>
            );
          })()}

          {/* 3. Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  audio.playSubtleClick();
                  setFilterCategory(cat.id);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                  filterCategory === cat.id
                    ? "bg-[#0A1322] text-white shadow-2xs font-semibold"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 4. Granular Permissions Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto touch-scroll navy-scrollbar">
              <table className="w-full text-left text-xs border-collapse min-w-[780px]">
                <thead className="bg-[#0A1322] text-white uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold w-[360px]">
                      Operational Capability &amp; Scope
                    </th>
                    {ROLES_META.map((meta) => (
                      <th
                        key={meta.role}
                        className={`py-3.5 px-3 font-semibold text-center min-w-[130px] ${
                          selectedRole === meta.role ? "bg-[#1B2A42]" : ""
                        }`}
                      >
                        <div className="truncate">{meta.title}</div>
                        <div className="text-[9px] font-normal text-slate-400 normal-case mt-0.5">
                          {meta.role}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPermissions.map((perm) => {
                    return (
                      <tr key={perm.key} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{perm.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                              {perm.key}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                            {perm.description}
                          </p>
                        </td>

                        {ROLES_META.map((meta) => {
                          const isAllowed = (rolePermissions[meta.role] || []).includes(perm.key);
                          const isHighlight = selectedRole === meta.role;

                          return (
                            <td
                              key={meta.role}
                              onClick={() => togglePermission(meta.role, perm.key)}
                              className={`py-3.5 px-3 text-center align-middle cursor-pointer group transition-colors ${
                                isHighlight ? "bg-slate-50/80" : ""
                              }`}
                            >
                              <div className="flex items-center justify-center">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                                    isAllowed
                                      ? meta.role === "AUTOHUB_ADMIN"
                                        ? "bg-[#E11D48] text-white shadow-2xs"
                                        : "bg-emerald-500 text-white shadow-2xs"
                                      : "border border-slate-200 text-transparent group-hover:border-slate-300"
                                  }`}
                                >
                                  {isAllowed ? (
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  ) : (
                                    <span className="text-[9px] text-slate-300 opacity-0 group-hover:opacity-100">
                                      +
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. Policy Enforcement Notice                               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-900 block">
            Commercial Principle: Zero Blind Purchasing
          </span>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Certified franchise dealers are exclusively permitted to hold vehicles when itemized landed prices are fully calculated in NZD. Only central controllers (AUTOHUB_ADMIN) and export marshalling directors (NISSAN_JAPAN) hold raw JPY FOB wholesale cost visibility.
          </p>
        </div>
      </div>
    </div>
  );
}

