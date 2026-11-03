"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { audio } from "@/lib/sound";
import {
  Car,
  Package,
  MapPin,
  Menu,
  LayoutDashboard,
  ShoppingBag,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  Layers,
} from "lucide-react";

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onOpenMenu: () => void;
}

export default function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenMenu,
}: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const getTabs = () => {
    if (pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN") {
      return [
        {
          id: "admin-dashboard",
          label: "Dashboard",
          icon: LayoutDashboard,
          href: "/admin/dashboard",
        },
        {
          id: "admin-catalogue",
          label: "Catalogue",
          icon: Car,
          href: "/admin/catalogue",
        },
        {
          id: "admin-orders",
          label: "Orders",
          icon: ShoppingBag,
          href: "/admin/orders",
        },
      ];
    }

    if (pathname.startsWith("/japan") || currentUser?.role === "NISSAN_JAPAN") {
      return [
        {
          id: "japan-inventory",
          label: "Inventory",
          icon: Car,
          href: "/japan/inventory",
        },
        {
          id: "japan-add-single",
          label: "Add Unit",
          icon: PlusCircle,
          href: "/japan/add-vehicle",
        },
        {
          id: "japan-upload",
          label: "Batch",
          icon: FileSpreadsheet,
          href: "/japan/upload",
        },
      ];
    }

    // Default: Dealer Portal
    return [
      {
        id: "dealer-stock",
        label: "Stock",
        icon: Car,
        href: "/dealer/stocks",
      },
      {
        id: "dealer-orders",
        label: "Orders",
        icon: Package,
        href: "/dealer/orders",
      },
      {
        id: "dealer-profile",
        label: "Dealership",
        icon: MapPin,
        href: "/dealer/profile",
      },
    ];
  };

  const tabs = getTabs();

  const isTabActive = (tab: { id: string; href: string }) => {
    if (pathname === tab.href) return true;
    if (tab.href !== "/" && pathname.startsWith(tab.href)) return true;
    if (activeTab === tab.id) return true;
    return false;
  };

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 mobile-bottom-nav pb-safe border-t border-slate-800/80"
    >
      <div className="grid grid-cols-4 items-center h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isTabActive(tab);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onTabChange(tab.id);
                router.push(tab.href);
              }}
              className={`relative flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
                active ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {active && (
                <span className="absolute -top-1 w-8 h-1 rounded-full bg-[#E11D48] shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
              )}
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  active ? "bg-white/10 text-[#E11D48]" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              </div>
              <span
                className={`text-[10px] tracking-tight font-medium ${
                  active ? "font-bold text-white" : "text-slate-400"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* 4th Tab: "More / Menu" Trigger */}
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            onOpenMenu();
          }}
          className="relative flex flex-col items-center justify-center py-1 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <div className="p-1.5 rounded-xl hover:bg-white/10">
            <Menu className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className="text-[10px] tracking-tight font-medium text-slate-400">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}

