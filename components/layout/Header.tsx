"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProgramme } from "@/lib/programme-context";
import { SystemNotification } from "@/lib/types";
import { audio } from "@/lib/sound";
import GlobalSearchModal from "./GlobalSearchModal";
import RoleSwitcher from "./RoleSwitcher";
import {
  Search,
  Bell,
  PanelLeft,
  Menu,
  CheckCircle2,
  Sparkles,
  Ship,
  X,
  Building2,
  Lock,
  Clock,
  AlertTriangle,
  AlertCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
  Car,
  Shield,
  Globe2,
  FileText,
} from "lucide-react";

function getNotificationMeta(type: string) {
  switch (type) {
    case "STOCK_NEW":
      return { icon: Sparkles, iconClass: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    case "HOLD_CREATED":
      return { icon: Lock, iconClass: "text-blue-600 bg-blue-50 border-blue-200" };
    case "HOLD_WARNING":
      return { icon: Clock, iconClass: "text-amber-600 bg-amber-50 border-amber-200" };
    case "HOLD_EXPIRED":
      return { icon: AlertTriangle, iconClass: "text-rose-600 bg-rose-50 border-rose-200" };
    case "ORDER_CONFIRMED":
      return { icon: CheckCircle2, iconClass: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    case "ORDER_MILESTONE":
      return { icon: Ship, iconClass: "text-indigo-600 bg-indigo-50 border-indigo-200" };
    case "COST_PROPOSAL":
      return { icon: AlertCircle, iconClass: "text-rose-600 bg-rose-50 border-rose-200" };
    case "COST_DECISION":
      return { icon: CheckCircle2, iconClass: "text-slate-600 bg-slate-50 border-slate-200" };
    case "DEALER_APPLICATION":
      return { icon: Building2, iconClass: "text-amber-600 bg-amber-50 border-amber-200" };
    case "DEALER_APPROVED":
      return { icon: ShieldCheck, iconClass: "text-emerald-600 bg-emerald-50 border-emerald-200" };
    case "DEALER_RETURNED":
      return { icon: RotateCcw, iconClass: "text-rose-600 bg-rose-50 border-rose-200" };
    default:
      return { icon: Bell, iconClass: "text-slate-600 bg-slate-50 border-slate-200" };
  }
}

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onSearchClick?: () => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (val: string) => void;
}

export default function Header({
  onToggleSidebar,
  isSidebarCollapsed = false,
  searchValue = "",
  onSearchChange,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, currentDealer, switchRole } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useProgramme();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Detect which of the 4 synchronized portals is currently active
  const currentPortal: "DEALER" | "ADMIN" | "JAPAN" | "PROGRAMME" = useMemo(() => {
    if (pathname.startsWith("/admin")) return "ADMIN";
    if (pathname.startsWith("/japan")) return "JAPAN";
    if (pathname.startsWith("/programme")) return "PROGRAMME";
    if (pathname.startsWith("/dealer")) return "DEALER";
    if (currentUser?.role === "AUTOHUB_ADMIN") return "ADMIN";
    if (currentUser?.role === "NISSAN_JAPAN") return "JAPAN";
    if (currentUser?.role === "READONLY_PROGRAMME_USER") return "PROGRAMME";
    return "DEALER";
  }, [pathname, currentUser?.role]);

  // Seamlessly switch role and portal view across the 4 synchronized portals
  const handleSwitchPortal = (portal: "DEALER" | "ADMIN" | "JAPAN" | "PROGRAMME") => {
    audio.playSoftChime();
    if (portal === "DEALER") {
      switchRole("DEALER_USER");
      router.push("/dealer/stocks");
    } else if (portal === "ADMIN") {
      switchRole("AUTOHUB_ADMIN");
      router.push("/admin/dashboard");
    } else if (portal === "JAPAN") {
      switchRole("NISSAN_JAPAN");
      router.push("/japan/inventory");
    } else if (portal === "PROGRAMME") {
      switchRole("READONLY_PROGRAMME_USER");
      router.push("/programme/stock");
    }
  };

  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dynamic role-scoped notification filtering (US-19)
  const visibleNotifications = useMemo(() => {
    return (notifications || []).filter((n) => {
      // 1. Role filtering
      if (n.targetRole && n.targetRole !== "ALL") {
        if (currentUser?.role !== n.targetRole) return false;
      }
      // 2. Dealership multi-tenant isolation
      if (n.dealerId && (currentUser?.role === "DEALER_USER" || currentUser?.role === "DEALER_ADMIN")) {
        if (currentDealer && n.dealerId !== currentDealer.id) return false;
      }
      return true;
    });
  }, [notifications, currentUser?.role, currentDealer?.id]);

  const unreadCount = visibleNotifications.filter((n) => n.unread).length;

  const handleNotificationClick = (n: SystemNotification) => {
    audio.playSubtleClick();
    markNotificationAsRead(n.id);
    setIsNotificationsOpen(false);
    if (n.linkUrl) {
      router.push(n.linkUrl);
    }
  };

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcut '/' or 'Cmd+K' / 'Ctrl+K' to open search modal
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === "/" &&
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA") ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        audio.playSubtleClick();
        setIsSearchModalOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);



  return (
    <header className="h-[60px] bg-white border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-4 sticky top-0 z-30 shrink-0">
      {/* Left: Sidebar Toggle Icon + Global Search Bar Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onToggleSidebar();
            }}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5 lg:hidden text-slate-700" />
            <PanelLeft className="w-5 h-5 hidden lg:block text-slate-600" />
          </button>
        )}

        {/* Top-Left Nissan Branding (Mobile & Collapsed Desktop) */}
        <div className={`flex items-center gap-2.5 shrink-0 ${isSidebarCollapsed ? "lg:flex" : "lg:hidden"}`}>
          <img
            src="/nissan-logo.png"
            alt="Nissan"
            className="w-7 h-7 object-contain drop-shadow-xs"
          />
          <span className="font-bold text-xs sm:text-sm tracking-tight text-slate-900 leading-none">
            Nissan
          </span>
        </div>

        {/* Desktop / Tablet Search Trigger Bar -> Opens Global Search Modal Listing */}
        <div
          onClick={() => {
            audio.playSubtleClick();
            setIsSearchModalOpen(true);
          }}
          className="relative flex-1 hidden sm:block cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsSearchModalOpen(true);
            }
          }}
        >
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-[#C3002F] absolute left-3.5 pointer-events-none transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              readOnly
              value={searchValue}
              placeholder="Search make, model, year or keyword..."
              className="w-full pl-9 pr-10 py-1.5 sm:py-2 text-xs sm:text-sm bg-white group-hover:bg-slate-50/80 rounded-xl border border-slate-200 group-hover:border-slate-300 text-slate-800 placeholder-slate-400 transition-all shadow-2xs font-medium cursor-pointer select-none"
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              {searchValue ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSearchChange) onSearchChange("");
                  }}
                  className="text-slate-400 hover:text-slate-600 p-0.5 text-xs cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-100 group-hover:bg-slate-200/80 border border-slate-200 rounded pointer-events-none transition-colors">
                  /
                </kbd>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Universal 4-Portal Switcher, Notifications, Role Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Universal 4-Portal Switcher Pill Bar (Matching media_1793712187996_53e634d8.png) */}
        <div
          role="tablist"
          aria-label="Universal 4-Portal Switcher"
          className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1 text-center shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={currentPortal === "DEALER"}
            onClick={() => handleSwitchPortal("DEALER")}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer truncate ${
              currentPortal === "DEALER"
                ? "bg-white text-slate-900 shadow-soft font-bold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            <Car
              className={`w-3.5 h-3.5 shrink-0 ${
                currentPortal === "DEALER" ? "text-[#C3002F]" : "text-slate-400"
              }`}
            />
            <span className="truncate">Dealer</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentPortal === "ADMIN"}
            onClick={() => handleSwitchPortal("ADMIN")}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer truncate ${
              currentPortal === "ADMIN"
                ? "bg-white text-slate-900 shadow-soft font-bold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            <Shield
              className={`w-3.5 h-3.5 shrink-0 ${
                currentPortal === "ADMIN" ? "text-[#C3002F]" : "text-slate-400"
              }`}
            />
            <span className="truncate">Admin Ops</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentPortal === "JAPAN"}
            onClick={() => handleSwitchPortal("JAPAN")}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer truncate ${
              currentPortal === "JAPAN"
                ? "bg-white text-slate-900 shadow-soft font-bold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            <Globe2
              className={`w-3.5 h-3.5 shrink-0 ${
                currentPortal === "JAPAN" ? "text-[#C3002F]" : "text-slate-400"
              }`}
            />
            <span className="truncate">Japan HQ</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={currentPortal === "PROGRAMME"}
            onClick={() => handleSwitchPortal("PROGRAMME")}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer truncate ${
              currentPortal === "PROGRAMME"
                ? "bg-white text-slate-900 shadow-soft font-bold"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
          >
            <FileText
              className={`w-3.5 h-3.5 shrink-0 ${
                currentPortal === "PROGRAMME" ? "text-[#C3002F]" : "text-slate-400"
              }`}
            />
            <span className="truncate">Programme</span>
          </button>
        </div>
        {/* Mobile Search Trigger Icon -> Opens Global Search Modal Listing */}
        <button
          type="button"
          onClick={() => {
            audio.playSubtleClick();
            setIsSearchModalOpen(true);
          }}
          aria-label="Open search modal"
          className="sm:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5 text-slate-600" />
        </button>

        {/* Real-time Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              setIsNotificationsOpen(!isNotificationsOpen);
            }}
            aria-label="View notifications"
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C3002F] ring-2 ring-white animate-pulse" />}
          </button>

          {isNotificationsOpen && (
            <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm rounded-[24px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                  {unreadCount > 0 ? (
                    <span className="text-[10px] bg-rose-50 text-[#C3002F] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                      {unreadCount} New
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                      All Read
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      audio.playSubtleClick();
                      markAllNotificationsAsRead();
                    }}
                    className="text-[11px] text-[#C3002F] hover:underline font-semibold cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pt-1 navy-scrollbar">
                {visibleNotifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 space-y-1">
                    <Bell className="w-6 h-6 mx-auto text-slate-300 stroke-[1.5]" />
                    <p className="text-xs font-semibold text-slate-600">No new notifications</p>
                    <p className="text-[11px] text-slate-400">All programme updates are current.</p>
                  </div>
                ) : (
                  visibleNotifications.map((n) => {
                    const meta = getNotificationMeta(n.type);
                    const Icon = meta.icon;
                    return (
                      <div
                        key={n.id}
                        className={`py-2.5 px-2 flex items-start gap-3 rounded-xl transition-colors cursor-pointer ${n.unread ? "bg-rose-50/40 hover:bg-rose-50/80" : "hover:bg-slate-50/80"
                          }`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className={`p-2 rounded-xl shrink-0 border ${meta.iconClass}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <p className={`text-xs truncate ${n.unread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                              {n.title}
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0 font-mono">{n.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                            {n.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-2.5 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setIsNotificationsOpen(false);
                    if (currentUser?.role === "AUTOHUB_ADMIN") router.push("/admin/orders");
                    else if (currentUser?.role === "READONLY_PROGRAMME_USER") router.push("/programme/orders");
                    else if (currentUser?.role === "NISSAN_JAPAN") router.push("/japan/inventory");
                    else router.push("/dealer/orders");
                  }}
                  className="text-xs font-semibold text-[#C3002F] hover:text-[#A10026] cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View All Programme Activity</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Role Switcher */}
        <RoleSwitcher />
      </div>

      {/* Universal Global Search Modal Listing */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={searchValue}
        onQueryChange={onSearchChange}
      />
    </header>
  );
}
