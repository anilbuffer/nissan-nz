"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { audio } from "@/lib/sound";
import GlobalSearchModal from "./GlobalSearchModal";
import {
  Search,
  Bell,
  PanelLeft,
  Menu,
  CheckCircle2,
  Sparkles,
  Ship,
  X,
} from "lucide-react";

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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Sample real-time notifications
  const notifications = [
    {
      id: "1",
      title: "New Japan Stock Batch Available",
      desc: "24 new verified Nissan Note e-Power & X-Trail units released by Tokyo team.",
      time: "10m ago",
      icon: Sparkles,
      iconColor: "text-emerald-500 bg-emerald-50",
      unread: true,
    },
    {
      id: "2",
      title: "Vessel RoRo Departure Confirmed",
      desc: "Voyage Trans-Pacific V.48 departed Yokohama Port heading toward Auckland.",
      time: "2h ago",
      icon: Ship,
      iconColor: "text-blue-500 bg-blue-50",
      unread: true,
    },
    {
      id: "3",
      title: "Pricing Zone 1 Confirmed",
      desc: "Your dealership fixed-cost profile is active at standard metro rate.",
      time: "1d ago",
      icon: CheckCircle2,
      iconColor: "text-slate-500 bg-slate-50",
      unread: false,
    },
  ];

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

        {/* Mobile App Branding Mark on small screens */}
        <div className="lg:hidden flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#E11D48] to-[#881337] flex items-center justify-center font-black text-white text-xs shadow-xs">
            D
          </div>
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
            <Search className="w-4 h-4 text-slate-400 group-hover:text-[#E11D48] absolute left-3.5 pointer-events-none transition-colors" />
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

      {/* Right: Quick Search Button on mobile, Notifications, Role Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E11D48] ring-2 ring-white animate-pulse" />
          </button>

          {isNotificationsOpen && (
            <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm rounded-2xl bg-white border border-slate-200 shadow-hover p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-slate-900">Notifications</h4>
                  <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                    2 New
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => audio.playSubtleClick()}
                  className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  Mark all read
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pt-1 navy-scrollbar">
                {notifications.map((n) => {
                  const Icon = n.icon;
                  return (
                    <div
                      key={n.id}
                      className="py-3 flex items-start gap-3 hover:bg-slate-50/70 p-2 rounded-xl transition-colors cursor-pointer"
                      onClick={() => audio.playSubtleClick()}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${n.iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                          {n.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setIsNotificationsOpen(false);
                    router.push("/dealer/orders");
                  }}
                  className="text-xs font-semibold text-[#E11D48] hover:text-[#BE123C] cursor-pointer"
                >
                  View All Programme Activity →
                </button>
              </div>
            </div>
          )}
        </div>

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
