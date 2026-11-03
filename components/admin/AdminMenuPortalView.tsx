"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useProgramme } from "@/lib/programme-context";
import { audio } from "@/lib/sound";
import {
  LayoutDashboard,
  Car,
  ShoppingBag,
  Clock,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Sparkles,
  Users,
  Shield,
} from "lucide-react";

interface AdminMenuPortalViewProps {
  onNavigateTab: (tabId: string) => void;
}

export default function AdminMenuPortalView({ onNavigateTab }: AdminMenuPortalViewProps) {
  const router = useRouter();
  const { vehicles, orders, dealers, users } = useProgramme();

  const availableStockCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const heldVehicles = vehicles.filter((v) => v.status === "RESERVED");
  const pendingDealers = dealers.filter((d) => d.status === "PENDING_APPROVAL");

  const menuItems = [
    {
      num: "01",
      id: "admin-dashboard",
      title: "Dashboard",
      subtitle: "Command & Operations KPIs",
      description: "Real-time operations command center, RoRo logistics velocity, port transit schedules, and system alerts.",
      icon: LayoutDashboard,
      badge: "Command Center",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      statValue: "Live Operations",
      statLabel: "Yokohama & Auckland Ports",
      href: "/admin/dashboard",
      accent: "from-blue-500/10 via-transparent to-transparent hover:border-blue-300",
      iconBg: "bg-blue-600 text-white",
    },
    {
      num: "02",
      id: "admin-catalogue",
      title: "Vehicle Catalogue",
      subtitle: "Certified Japan Stock",
      description: "Browse certified export inventory, evaluate condition grading, and review dealer-facing landed pricing.",
      icon: Car,
      badge: `${availableStockCount} Available`,
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      statValue: `${availableStockCount} Units`,
      statLabel: "Ready for allocation",
      href: "/admin/catalogue",
      accent: "from-emerald-500/10 via-transparent to-transparent hover:border-emerald-300",
      iconBg: "bg-emerald-600 text-white",
    },
    {
      num: "03",
      id: "admin-orders",
      title: "Orders",
      subtitle: "Allocation & RoRo Shipping",
      description: "Track confirmed dealer purchases, RoRo ocean vessel shipments, customs entry, and landed deliveries.",
      icon: ShoppingBag,
      badge: `${orders.length} Active`,
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      statValue: `${orders.length} Shipments`,
      statLabel: "Transit & compliance",
      href: "/admin/orders",
      accent: "from-purple-500/10 via-transparent to-transparent hover:border-purple-300",
      iconBg: "bg-purple-600 text-white",
    },
    {
      num: "04",
      id: "admin-reservations",
      title: "Reservations",
      subtitle: "24-Hour Atomic Hold Queue",
      description: "Manage exclusive dealer reservation locks, hold expiry countdown timers, releases, and priority queues.",
      icon: Clock,
      badge: `${heldVehicles.length} Active Holds`,
      badgeColor: heldVehicles.length > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-600 border-slate-200",
      statValue: `${heldVehicles.length} Holds`,
      statLabel: "Lock active",
      href: "/admin/reservations",
      accent: "from-amber-500/10 via-transparent to-transparent hover:border-amber-300",
      iconBg: "bg-amber-600 text-white",
    },
    {
      num: "05",
      id: "admin-dealers",
      title: "Dealers",
      subtitle: "Franchise Network & Approvals",
      description: "Oversee registered Nissan franchise dealerships, assign geographic pricing zones, and review onboarding.",
      icon: Building2,
      badge: pendingDealers.length > 0 ? `${pendingDealers.length} Pending Approval` : "All Verified",
      badgeColor: pendingDealers.length > 0 ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-700 border-slate-200",
      statValue: `${dealers.length} Dealerships`,
      statLabel: "5 NZ Geographic Zones",
      href: "/admin/dealers",
      accent: "from-rose-500/10 via-transparent to-transparent hover:border-rose-300",
      iconBg: "bg-[#E11D48] text-white",
    },
    {
      num: "06",
      id: "admin-inventory",
      title: "Inventory",
      subtitle: "Yard Management & Cost Control",
      description: "Japan export yard inventory controller, chassis inspection records, FOB rates, and commercial cost boundaries.",
      icon: Layers,
      badge: `${vehicles.length} Total Units`,
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
      statValue: `${vehicles.length} Registered`,
      statLabel: "Yokohama & Kobe yards",
      href: "/admin/inventory",
      accent: "from-slate-500/10 via-transparent to-transparent hover:border-slate-300",
      iconBg: "bg-slate-900 text-white",
    },
    {
      num: "07",
      id: "admin-users",
      title: "User Management",
      subtitle: "Team Access & Permissions",
      description: "Administer platform operators, dealer principals, invite new staff with RBAC role assignments, and review security logs.",
      icon: Users,
      badge: `${users.length} Active Users`,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      statValue: `${users.length} Operators`,
      statLabel: "Across 3 Organisations",
      href: "/admin/users",
      accent: "from-blue-500/10 via-transparent to-transparent hover:border-blue-300",
      iconBg: "bg-blue-700 text-white",
    },
    {
      num: "08",
      id: "admin-roles",
      title: "Roles & Permissions",
      subtitle: "Governance & RBAC Matrix",
      description: "Define granular permission boundaries, audit capability matrices across Admin, Dealer, and Japan logistics personas.",
      icon: Shield,
      badge: "4 Roles Active",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      statValue: "RBAC Governance",
      statLabel: "Zero-Trust Enforcement",
      href: "/admin/roles",
      accent: "from-emerald-500/10 via-transparent to-transparent hover:border-emerald-300",
      iconBg: "bg-emerald-700 text-white",
    },
  ];

  const handleNavigate = (item: typeof menuItems[0]) => {
    audio.playSubtleClick();
    onNavigateTab(item.id);
    router.push(item.href);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner & Status                                  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
                Platform Operations Admin
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Central Controller Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Platform Operations Menu
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Autohub New Zealand Operations &amp; Nissan Japan Export Hub. Direct access to all operational departments, inventory controllers, and dealer allocations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Active Scope
              </span>
              <span className="text-xs font-mono font-bold text-slate-800 block">
                Central Operations (Auckland HQ)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Operations Menu Cards (Grid of 8 Modules)               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleNavigate(item)}
              className={`bg-white rounded-3xl border border-slate-200/90 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between group cursor-pointer relative overflow-hidden bg-gradient-to-b ${item.accent}`}
            >
              <div>
                {/* Top Row: Number + Icon + Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 block">
                        Item {item.num}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h2 className="text-xl font-black text-slate-900 group-hover:text-[#E11D48] transition-colors tracking-tight">
                  {item.title}
                </h2>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Row: Stats & Action Arrow */}
              <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block font-mono">
                    {item.statValue}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {item.statLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-[#E11D48] transition-colors">
                  <span>Open</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Operational Summary Strip                                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Autohub ISO 9001 Logistics &amp; NZTA MR2A Border Verification Active</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
          <span>Yokohama RoRo Schedule: Direct Bi-Weekly</span>
          <span>●</span>
          <span>MPI Biosecurity: Pre-Cleared</span>
        </div>
      </div>
    </div>
  );
}

