const fs = require('fs');

const filePath = 'components/admin/RolesPermissionsView.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update ROLES_META definition to include subtitle and tierLabel
const oldRolesMeta = `const ROLES_META: {
  role: UserRole;
  title: string;
  badgeBg: string;
  badgeText: string;
  tier: string;
  description: string;
}[] = [
  {
    role: "AUTOHUB_ADMIN",
    title: "Operations Central Controller",
    badgeBg: "bg-rose-50 border-rose-200",
    badgeText: "text-[#E11D48]",
    tier: "Tier 1 · Full Authority",
    description: "Central platform management, RoRo transit scheduling, dealer approvals, and cost overrides.",
  },
  {
    role: "NISSAN_JAPAN",
    title: "Yokohama Procurement Lead",
    badgeBg: "bg-blue-50 border-blue-200",
    badgeText: "text-blue-700",
    tier: "Tier 2 · Export Procurement",
    description: "Stock creation, batch manifests, JEVIC odometer verification, and Japan yard marshalling.",
  },
  {
    role: "DEALER_ADMIN",
    title: "Franchise Dealer Principal",
    badgeBg: "bg-emerald-50 border-emerald-200",
    badgeText: "text-emerald-700",
    tier: "Tier 3 · Franchise Executive",
    description: "Dealership governance, terms acceptance, gross profit visibility, and sales team invites.",
  },
  {
    role: "DEALER_USER",
    title: "Dealership Sales & Buyer",
    badgeBg: "bg-slate-100 border-slate-200",
    badgeText: "text-slate-800",
    tier: "Tier 4 · Inventory Buyer",
    description: "Vehicle search, 360 photography, landed NZD buy prices, and 24-hour atomic hold lock.",
  },
  {
    role: "READONLY_AUDITOR",
    title: "Border Compliance Auditor",
    badgeBg: "bg-amber-50 border-amber-200",
    badgeText: "text-amber-800",
    tier: "Tier 5 · Regulatory Read-Only",
    description: "Independent audit trail inspection, MR2A compliance verification, and customs exports.",
  },
];`;

const newRolesMeta = `const ROLES_META: {
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
];`;

if (!content.includes(oldRolesMeta)) {
  console.error("Could not find oldRolesMeta target!");
  process.exit(1);
}
content = content.replace(oldRolesMeta, newRolesMeta);

// 2. Update the role cards grid and add the focused description strip
const oldCardsBlock = `          {/* 2. Platform Roles Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
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
                  className={\`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between \${
                    isSelected
                      ? "bg-white border-[#E11D48] shadow-md ring-1 ring-[#E11D48]"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                  }\`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full border \${meta.badgeBg} \${meta.badgeText}\`}>
                        {meta.tier}
                      </span>
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {meta.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                      {meta.description}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{userCount} Users</span>
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {permCount}/{PERMISSION_DEFINITIONS.length} Perms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>`;

const newCardsBlock = `          {/* 2. Clean Executive Platform Roles Selector */}
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
                  className={\`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden \${
                    isSelected
                      ? "bg-white border-slate-300 ring-2 ring-[#E11D48]/15 shadow-sm"
                      : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs"
                  }\`}
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
                      <h3 className={\`font-black text-sm tracking-tight leading-tight transition-colors \${
                        isSelected ? "text-slate-900" : "text-slate-800 group-hover:text-[#E11D48]"
                      }\`}>
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
                    <span className={\`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold transition-colors \${
                      isSelected
                        ? "bg-[#E11D48]/10 text-[#E11D48] border border-[#E11D48]/20"
                        : "bg-slate-100 text-slate-700 border border-slate-200/60"
                    }\`}>
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
          })()}`;

if (!content.includes(oldCardsBlock)) {
  console.error("Could not find oldCardsBlock target!");
  process.exit(1);
}
content = content.replace(oldCardsBlock, newCardsBlock);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully cleaned up role cards in RolesPermissionsView.tsx!");

