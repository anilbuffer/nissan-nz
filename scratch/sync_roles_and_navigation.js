const fs = require('fs');

// 1. Update RoleSwitcher.tsx to include all 5 roles
const roleSwitcherPath = 'components/layout/RoleSwitcher.tsx';
let rsContent = fs.readFileSync(roleSwitcherPath, 'utf8');

const oldRolesArray = `const ROLES: RoleOption[] = [
  {
    role: "DEALER_USER",
    label: "Auckland Nissan",
    sublabel: "David Miller · Dealer",
    badge: "DEALER",
    badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: Car,
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    role: "AUTOHUB_ADMIN",
    label: "Platform Operations",
    sublabel: "Sarah Jenkins · Command Admin",
    badge: "ADMIN",
    badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: Shield,
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    role: "NISSAN_JAPAN",
    label: "Nissan Japan HQ",
    sublabel: "Kenji Sato · Tokyo Inventory",
    badge: "JAPAN",
    badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    icon: Globe2,
    iconBg: "bg-purple-500/10 text-purple-400",
  },
];`;

const newRolesArray = `const ROLES: RoleOption[] = [
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

if (rsContent.includes(oldRolesArray)) {
  rsContent = rsContent.replace(oldRolesArray, newRolesArray);
  fs.writeFileSync(roleSwitcherPath, rsContent, 'utf8');
  console.log("Successfully updated RoleSwitcher with all 5 roles!");
} else {
  console.log("Could not find oldRolesArray in RoleSwitcher.tsx");
}

// 2. Update Sidebar.tsx to include admin-audit and dynamic dealer panel info
const sidebarPath = 'components/layout/Sidebar.tsx';
let sbContent = fs.readFileSync(sidebarPath, 'utf8');

// Include FileCheck2 if needed or use FileText
const oldAdminNav = `    if (pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") {
      return [
        {
          id: "admin-dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/admin/dashboard",
        },
        {
          id: "admin-catalogue",
          label: "Vehicle Catalogue",
          icon: Car,
          href: "/admin/catalogue",
        },
        {
          id: "admin-orders",
          label: "Orders",
          icon: ShoppingBag,
          href: "/admin/orders",
        },
        {
          id: "admin-reservations",
          label: "Reservations",
          icon: Clock,
          href: "/admin/reservations",
        },
        {
          id: "admin-dealers",
          label: "Dealers",
          icon: Building2,
          href: "/admin/dealers",
        },
        {
          id: "admin-inventory",
          label: "Inventory",
          icon: Layers,
          href: "/admin/inventory",
        },
        {
          id: "admin-users",
          label: "User Management",
          icon: Users,
          href: "/admin/users",
        },
        {
          id: "admin-roles",
          label: "Roles & Permissions",
          icon: Shield,
          href: "/admin/roles",
        },
      ];
    }`;

const newAdminNav = `    if (pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN" || currentUser?.role === "READONLY_AUDITOR") {
      const isAuditor = currentUser?.role === "READONLY_AUDITOR";
      return [
        ...(!isAuditor ? [
          {
            id: "admin-dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/admin/dashboard",
          },
        ] : []),
        {
          id: "admin-catalogue",
          label: "Vehicle Catalogue",
          icon: Car,
          href: "/admin/catalogue",
        },
        ...(!isAuditor ? [
          {
            id: "admin-orders",
            label: "Orders",
            icon: ShoppingBag,
            href: "/admin/orders",
          },
        ] : []),
        {
          id: "admin-reservations",
          label: "Reservations",
          icon: Clock,
          href: "/admin/reservations",
        },
        ...(!isAuditor ? [
          {
            id: "admin-dealers",
            label: "Dealers",
            icon: Building2,
            href: "/admin/dealers",
          },
        ] : []),
        {
          id: "admin-inventory",
          label: "Inventory",
          icon: Layers,
          href: "/admin/inventory",
        },
        ...(!isAuditor ? [
          {
            id: "admin-users",
            label: "User Management",
            icon: Users,
            href: "/admin/users",
          },
        ] : []),
        {
          id: "admin-roles",
          label: "Roles & Permissions",
          icon: Shield,
          href: "/admin/roles",
        },
        {
          id: "admin-audit",
          label: "Audit Logs",
          icon: FileText,
          href: "/admin/audit",
        },
      ];
    }`;

if (sbContent.includes(oldAdminNav)) {
  sbContent = sbContent.replace(oldAdminNav, newAdminNav);
}

const oldPanelInfo = `    if (pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") {
      return {
        section: "ADMIN PORTAL",
        badge: "AUTOHUB OPERATIONS",
        badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        roleDesc: "Autohub NZ Operations",
      };
    }
    if (currentUser?.role === "DEALER_USER" || currentUser?.role === "DEALER_ADMIN") {
      return {
        section: "DEALER PORTAL",
        badge: "AUCKLAND NISSAN",
        badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        roleDesc: currentDealer?.legalTradingName || "Auckland Nissan City",
      };
    }`;

const newPanelInfo = `    if (currentUser?.role === "READONLY_AUDITOR") {
      return {
        section: "AUDIT PORTAL",
        badge: "REGULATORY AUDITOR",
        badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        roleDesc: "NZTA & Customs Audit",
      };
    }
    if (pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") {
      return {
        section: "ADMIN PORTAL",
        badge: "AUTOHUB OPERATIONS",
        badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
        roleDesc: "Autohub NZ Operations",
      };
    }
    if (currentUser?.role === "DEALER_USER" || currentUser?.role === "DEALER_ADMIN") {
      return {
        section: "DEALER PORTAL",
        badge: currentDealer?.legalTradingName?.toUpperCase() || currentUser?.dealershipName?.toUpperCase() || "FRANCHISE DEALERSHIP",
        badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        roleDesc: currentDealer?.legalTradingName || currentUser?.dealershipName || "Auckland Nissan City",
      };
    }`;

if (sbContent.includes(oldPanelInfo)) {
  sbContent = sbContent.replace(oldPanelInfo, newPanelInfo);
}

fs.writeFileSync(sidebarPath, sbContent, 'utf8');
console.log("Successfully updated Sidebar navigation and panel info!");

