"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { audio } from "@/lib/sound";
import {
  Car,
  Package,
  Layers,
  FileText,
  Shield,
  Users,
  User,
  Clock,
  Download,
  PlusCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MapPin,
  Settings,
  ChevronUp,
  LayoutDashboard,
  ShoppingBag,
  Building2,
  X,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string | number;
  badgeColor?: string;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, currentDealer, logout } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen && onCloseMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Prevent body scrolling when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  // Navigation configurations based on role
  const getNavItems = (): NavItem[] => {
    if (currentUser?.role === "DEALER_USER" || currentUser?.role === "DEALER_ADMIN") {
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
    }

    if (pathname.startsWith("/admin") || currentUser?.role === "AUTOHUB_ADMIN" || currentUser?.role === "READONLY_AUDITOR") {
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
    }

    // Nissan Japan
    return [
      {
        id: "japan-inventory",
        label: "Inventory",
        icon: Car,
        href: "/japan/inventory",
      },
      {
        id: "japan-upload",
        label: "Batch Upload",
        icon: FileSpreadsheet,
        href: "/japan/upload",
      },
      {
        id: "japan-add-single",
        label: "Add Vehicle",
        icon: PlusCircle,
        href: "/japan/add-vehicle",
      },
    ];
  };

  const navItems = getNavItems();

  const getPanelInfo = () => {
    if (currentUser?.role === "READONLY_AUDITOR") {
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
      const rawName = currentDealer?.legalTradingName || currentUser?.dealershipName || "Auckland Nissan";
      const shortName = rawName
        .replace(/\s+(Ltd|Limited|Co\.|Corp)\.?$/i, "")
        .replace(/\s+City$/i, "")
        .toUpperCase();

      return {
        section: "DEALER PORTAL",
        badge: shortName,
        badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        roleDesc: currentDealer?.legalTradingName || currentUser?.dealershipName || "Auckland Nissan City",
      };
    }
    return {
      section: "JAPAN PORTAL",
      badge: "NISSAN JAPAN HQ",
      badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      roleDesc: "Yokohama Export Control",
    };
  };

  const panelInfo = getPanelInfo();

  const handleItemClick = (item: NavItem) => {
    audio.playSubtleClick();
    if (onTabChange) {
      onTabChange(item.id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
    router.push(item.href);
  };

  const isItemActive = (item: NavItem) => {
    if (pathname === item.href) return true;
    if (item.href !== "/" && pathname.startsWith(item.href)) return true;
    if (activeTab === item.id) return true;
    return false;
  };

  const renderNavContent = (isMobileDrawer = false) => {
    const collapsed = isMobileDrawer ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full justify-between select-none">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 bg-rose-600/10 rounded-full blur-2xl" />

        {/* Top Branding Section */}
        <div className="relative z-10">
          <div className="h-[60px] flex items-center justify-between px-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E11D48] via-[#BE123C] to-[#881337] flex items-center justify-center font-black text-white shadow-[0_2px_12px_rgba(225,29,72,0.4)] ring-1 ring-white/20 shrink-0">
                D
              </div>
              {!collapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <h1 className="font-extrabold text-sm tracking-tight text-white truncate">
                    Dealer Order Platform
                  </h1>
                  <p className="text-[10px] text-slate-400 truncate">{panelInfo.roleDesc}</p>
                </div>
              )}
            </div>

            {/* Mobile Drawer Close Button */}
            {isMobileDrawer && (
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation menu"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Static Portal Section Header */}
          {!collapsed && (
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {panelInfo.section}
              </span>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap truncate max-w-[130px] inline-block ${panelInfo.badgeColor}`}
                title={panelInfo.badge}
              >
                {panelInfo.badge}
              </span>
            </div>
          )}

          {/* Navigation Items List */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)] navy-scrollbar" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    aria-current={active ? "page" : undefined}
                    className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${active
                      ? "bg-gradient-to-r from-white/[0.14] to-white/[0.04] text-white border border-white/15 shadow-[0_2px_12px_rgba(0,0,0,0.25)] ring-1 ring-white/10"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
                      } ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    {/* Glowing left pip on active tab */}
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#E11D48] shadow-[0_0_8px_rgba(225,29,72,0.8)]" />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${active ? "text-[#E11D48] scale-110" : "text-slate-400 group-hover:text-slate-300"
                        }`}
                    />

                    {!collapsed && (
                      <div className="flex-1 truncate text-left">
                        <span className="truncate">{item.label}</span>
                      </div>
                    )}
                  </button>

                  {/* Floating Tooltip in Mini Mode */}
                  {collapsed && hoveredItem === item.id && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-[#0D1829] text-white border border-slate-800 text-xs font-semibold shadow-2xl whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150">
                      <span>{item.label}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section: Opens Settings & Logout Popover */}
        <div className="relative z-20 p-3 border-t border-slate-800/80 bg-[#060B14]">
          {!collapsed ? (
            <div>
              {/* Clickable Profile Card */}
              <div
                onClick={() => {
                  audio.playSubtleClick();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                title="Click for Settings & Logout"
                className={`flex items-center justify-between p-2 rounded-2xl transition-all cursor-pointer group ${pathname === "/settings" || activeTab === "settings"
                  ? "bg-gradient-to-r from-white/[0.12] to-white/[0.04] border border-white/15 ring-1 ring-white/10"
                  : isProfileMenuOpen
                    ? "bg-white/10 border border-white/10"
                    : "hover:bg-white/[0.06] border border-transparent"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-700 font-bold text-xs text-white shadow-xs flex items-center justify-center shrink-0">
                      {currentUser?.name.charAt(0) || "U"}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070D18]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate group-hover:text-rose-200 transition-colors">
                      {currentUser?.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {currentUser?.email}
                    </div>
                  </div>
                </div>

                <ChevronUp
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isProfileMenuOpen ? "rotate-180 text-white" : "group-hover:text-white"
                    }`}
                />
              </div>

              {/* Popover Menu with Settings and Logout */}
              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute bottom-full mb-2 left-3 right-3 bg-[#0D1829]/95 border border-slate-800/90 rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Signed in as
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5">
                        {currentUser?.name}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setIsProfileMenuOpen(false);
                        if (onTabChange) onTabChange("settings");
                        if (onCloseMobile) onCloseMobile();
                        router.push("/settings");
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${pathname === "/settings" || activeTab === "settings"
                        ? "bg-[#E11D48] text-white"
                        : "text-slate-200 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      <User className="w-4 h-4 text-slate-300" />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setIsProfileMenuOpen(false);
                        if (onCloseMobile) onCloseMobile();
                        logout();
                        router.push("/");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                }}
                title="Click for Settings & Logout"
                aria-label="User account & options"
                className={`relative w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-white transition-all cursor-pointer ${pathname === "/settings" || activeTab === "settings"
                  ? "ring-2 ring-[#E11D48]"
                  : "hover:ring-2 hover:ring-rose-500/50"
                  }`}
              >
                {currentUser?.name.charAt(0) || "U"}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070D18]" />
              </button>

              {/* Collapsed Popover Menu */}
              {isProfileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileMenuOpen(false)}
                  />
                  <div className="absolute bottom-full mb-2 left-2 w-48 bg-[#0D1829]/95 border border-slate-800/90 rounded-2xl p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                    <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Signed in as
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5">
                        {currentUser?.name}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setIsProfileMenuOpen(false);
                        if (onTabChange) onTabChange("settings");
                        if (onCloseMobile) onCloseMobile();
                        router.push("/settings");
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${pathname === "/settings" || activeTab === "settings"
                        ? "bg-[#E11D48] text-white"
                        : "text-slate-200 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      <User className="w-4 h-4 text-slate-300" />
                      <span>My Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setIsProfileMenuOpen(false);
                        if (onCloseMobile) onCloseMobile();
                        logout();
                        router.push("/");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop & Laptop Persistent Sidebar (Hidden on <1024px) */}
      <aside
        className={`hidden lg:flex relative h-full bg-[#070D18] border-r border-slate-800/80 flex-col justify-between transition-sidebar z-30 select-none overflow-hidden shrink-0 ${isCollapsed ? "w-[76px]" : "w-[248px]"
          }`}
        aria-label="Platform Sidebar Navigation"
      >
        {renderNavContent(false)}
      </aside>

      {/* 2. iPad & Mobile Slide-Out Drawer (<1024px) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Frosted Backdrop */}
          <div
            className="fixed inset-0 drawer-backdrop animate-in fade-in duration-200"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <aside
            className="relative z-50 w-[290px] sm:w-[320px] max-w-[85vw] h-full bg-[#070D18] border-r border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between animate-in slide-in-from-left duration-300 ease-spring"
            aria-label="Mobile Navigation Drawer"
          >
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
