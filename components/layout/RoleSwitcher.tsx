"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import { audio } from "@/lib/sound";
import { Car, Shield, Globe2, ChevronDown, Check } from "lucide-react";

interface RoleOption {
  role: UserRole;
  label: string;
  sublabel: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  iconBg: string;
}

const ROLES: RoleOption[] = [
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
];

export default function RoleSwitcher() {
  const router = useRouter();
  const { currentUser, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeRoleOption =
    ROLES.find((r) => r.role === currentUser?.role) || ROLES[0];
  const ActiveIcon = activeRoleOption.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectRole = (role: UserRole) => {
    audio.playSoftChime();
    switchRole(role);
    setIsOpen(false);
    if (role === "AUTOHUB_ADMIN") {
      router.push("/admin/dashboard");
    } else if (role === "NISSAN_JAPAN") {
      router.push("/japan/inventory");
    } else if (role === "READONLY_AUDITOR") {
      router.push("/admin/audit");
    } else {
      router.push("/dealer/stocks");
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          audio.playSubtleClick();
          setIsOpen(!isOpen);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Switch active workspace role"
        className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-xl bg-[#0F1B2E] hover:bg-[#142239] border border-[#1B2A42] hover:border-slate-600 text-white transition-all text-xs focus-visible:ring-2 focus-visible:ring-crimson-500 cursor-pointer shadow-soft"
      >
        <div className={`p-1.5 rounded-lg ${activeRoleOption.iconBg}`}>
          <ActiveIcon className="w-3.5 h-3.5" />
        </div>
        <div className="text-left hidden md:block">
          <div className="font-semibold text-white leading-tight flex items-center gap-1.5">
            <span className="truncate max-w-[120px]">{activeRoleOption.label}</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${activeRoleOption.badgeColor}`}
            >
              {activeRoleOption.badge}
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
            }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-72 max-w-xs rounded-2xl bg-[#0F1B2E] border border-[#1B2A42] shadow-hover py-2 z-50 text-white backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="px-3.5 py-2 border-b border-[#1B2A42] mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Workspace View
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulate distinct persona permissions
            </p>
          </div>

          <div className="space-y-1 px-1.5">
            {ROLES.map((option) => {
              const Icon = option.icon;
              const isSelected = currentUser?.role === option.role;

              return (
                <button
                  key={option.role}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectRole(option.role)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left text-xs cursor-pointer ${isSelected
                    ? "bg-white/10 text-white font-medium border border-white/10"
                    : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${option.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{option.label}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${option.badgeColor}`}
                        >
                          {option.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{option.sublabel}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 px-3 border-t border-[#1B2A42] text-[10px] text-slate-400 flex items-center justify-between">
            <span>Audio Chime Enabled</span>
            <span className="text-emerald-400 font-mono">Web Audio API</span>
          </div>
        </div>
      )}
    </div>
  );
}
