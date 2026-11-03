const fs = require('fs');
const path = require('path');

// 1. Refine RoleSwitcher.tsx
const roleSwitcherPath = path.join(__dirname, '..', 'components', 'layout', 'RoleSwitcher.tsx');
let roleContent = fs.readFileSync(roleSwitcherPath, 'utf8');

// Replace ROLES array with clean monochrome badges and icons
const oldRolesArray = `const ROLES: RoleOption[] = [
  {
    role: "DEALER_USER",
    label: "Auckland Nissan",
    sublabel: "David Miller · Sales Buyer",
    badge: "BUYER",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: Car,
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    role: "DEALER_ADMIN",
    label: "Bay of Plenty Nissan",
    sublabel: "Marcus Vance · Dealer Principal",
    badge: "PRINCIPAL",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: Car,
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    role: "AUTOHUB_ADMIN",
    label: "Platform Operations",
    sublabel: "Sarah Jenkins · Central Controller",
    badge: "ADMIN",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Shield,
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    role: "NISSAN_JAPAN",
    label: "Nissan Japan HQ",
    sublabel: "Kenji Sato · Export Marshalling",
    badge: "JAPAN",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: Globe2,
    iconBg: "bg-purple-500/10 text-purple-400",
  },
  {
    role: "READONLY_AUDITOR",
    label: "Regulatory Audit",
    sublabel: "Elena Campbell · Customs/NZTA",
    badge: "AUDITOR",
    badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Shield,
    iconBg: "bg-amber-500/10 text-amber-400",
  },
];`;

const newRolesArray = `const ROLES: RoleOption[] = [
  {
    role: "DEALER_USER",
    label: "Auckland Nissan",
    sublabel: "David Miller · Sales Buyer",
    badge: "BUYER",
    badgeColor: "bg-white/10 text-white border-white/20",
    icon: Car,
    iconBg: "bg-white/10 text-white",
  },
  {
    role: "DEALER_ADMIN",
    label: "Bay of Plenty Nissan",
    sublabel: "Marcus Vance · Dealer Principal",
    badge: "PRINCIPAL",
    badgeColor: "bg-white/10 text-white border-white/20",
    icon: Car,
    iconBg: "bg-white/10 text-white",
  },
  {
    role: "AUTOHUB_ADMIN",
    label: "Platform Operations",
    sublabel: "Sarah Jenkins · Central Controller",
    badge: "ADMIN",
    badgeColor: "bg-white/10 text-white border-white/20",
    icon: Shield,
    iconBg: "bg-white/10 text-white",
  },
  {
    role: "NISSAN_JAPAN",
    label: "Nissan Japan HQ",
    sublabel: "Kenji Sato · Export Marshalling",
    badge: "JAPAN",
    badgeColor: "bg-white/10 text-white border-white/20",
    icon: Globe2,
    iconBg: "bg-white/10 text-white",
  },
  {
    role: "READONLY_AUDITOR",
    label: "Regulatory Audit",
    sublabel: "Elena Campbell · Customs/NZTA",
    badge: "AUDITOR",
    badgeColor: "bg-white/10 text-white border-white/20",
    icon: Shield,
    iconBg: "bg-white/10 text-white",
  },
];`;

roleContent = roleContent.replace(oldRolesArray.replace(/\r\n/g, '\n'), newRolesArray);
// Also replace selected check icon with Nissan Red #C3002F
roleContent = roleContent.replace(/text-emerald-400/g, 'text-[#C3002F]');
fs.writeFileSync(roleSwitcherPath, roleContent, 'utf8');
console.log('RoleSwitcher.tsx updated with clean corporate monochrome/red styling.');

// 2. Refine Sidebar.tsx getPanelInfo
const sidebarPath = path.join(__dirname, '..', 'components', 'layout', 'Sidebar.tsx');
let sidebarContent = fs.readFileSync(sidebarPath, 'utf8');

sidebarContent = sidebarContent.replace(/badgeColor: "bg-amber-500\/15 text-amber-400 border-amber-500\/30"/g, 'badgeColor: "bg-white/10 text-white border-white/20"');
sidebarContent = sidebarContent.replace(/badgeColor: "bg-blue-500\/15 text-blue-400 border-blue-500\/30"/g, 'badgeColor: "bg-white/10 text-white border-white/20"');
sidebarContent = sidebarContent.replace(/badgeColor: "bg-emerald-500\/15 text-emerald-400 border-emerald-500\/30"/g, 'badgeColor: "bg-white/10 text-white border-white/20"');
sidebarContent = sidebarContent.replace(/badgeColor: "bg-purple-500\/15 text-purple-400 border-purple-500\/30"/g, 'badgeColor: "bg-white/10 text-white border-white/20"');

// Ambient glow to Nissan Red
sidebarContent = sidebarContent.replace(/bg-rose-600\/10/g, 'bg-[#C3002F]/10');
sidebarContent = sidebarContent.replace(/shadow-\[0_0_8px_rgba\(225,29,72,0\.8\)\]/g, 'shadow-[0_0_8px_rgba(195,0,47,0.7)]');

fs.writeFileSync(sidebarPath, sidebarContent, 'utf8');
console.log('Sidebar.tsx panel badges updated.');

// 3. Refine LoginPage.tsx
const loginPath = path.join(__dirname, '..', 'components', 'login', 'LoginPage.tsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');

// Replace blue ambient glow with Nissan Red glow
loginContent = loginContent.replace(/bg-blue-600\/10/g, 'bg-white/5');

// Update role tabs to clean monochrome / Nissan Red
loginContent = loginContent.replace(
  '<Car className="w-3.5 h-3.5 text-emerald-600 shrink-0" />',
  '<Car className={`w-3.5 h-3.5 shrink-0 ${activeTab === "DEALER" ? "text-[#C3002F]" : "text-slate-400"}`} />'
);
loginContent = loginContent.replace(
  '<Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />',
  '<Shield className={`w-3.5 h-3.5 shrink-0 ${activeTab === "ADMIN" ? "text-[#C3002F]" : "text-slate-400"}`} />'
);
loginContent = loginContent.replace(
  '<Globe2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />',
  '<Globe2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === "JAPAN" ? "text-[#C3002F]" : "text-slate-400"}`} />'
);

// Auto fill demo link to Nissan Red
loginContent = loginContent.replace(
  'className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"',
  'className="text-[11px] font-semibold text-[#C3002F] hover:text-[#A10026] hover:underline cursor-pointer"'
);

// Sign-in button shadow
loginContent = loginContent.replace(/shadow-crimson-600\/20/g, 'shadow-[#0A0A0A]/20');

fs.writeFileSync(loginPath, loginContent, 'utf8');
console.log('LoginPage.tsx color refinements applied.');

