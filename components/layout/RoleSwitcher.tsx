"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import { audio } from "@/lib/sound";
import { Car, Shield, Globe2, ChevronDown, Check, Eye } from "lucide-react";

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
    label: "Dealer Portal",
    sublabel: "David Miller · Auckland Nissan",
    badge: "DEALER",
    badgeColor: "bg-red-50 text-[#C3002F] border-red-200",
    icon: Car,
    iconBg: "bg-red-50 text-[#C3002F]",
  },
  {
    role: "AUTOHUB_ADMIN",
    label: "Admin Ops",
    sublabel: "Sarah Jenkins · Central Operations",
    badge: "ADMIN",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    icon: Shield,
    iconBg: "bg-slate-100 text-slate-800",
  },
  {
    role: "NISSAN_JAPAN",
    label: "Japan HQ",
    sublabel: "Kenji Sato · Export Marshalling",
    badge: "JAPAN HQ",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    icon: Globe2,
    iconBg: "bg-slate-100 text-slate-700",
  },
  {
    role: "READONLY_PROGRAMME_USER",
    label: "Programme",
    sublabel: "Marcus Vance · NSC Governance",
    badge: "PROGRAMME",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Eye,
    iconBg: "bg-indigo-50 text-indigo-700",
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
    } else if (role === "READONLY_PROGRAMME_USER") {
      router.push("/programme/stock");
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
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 transition-all text-xs font-medium cursor-pointer shadow-2xs"
      >
        <div className={`p-1 rounded-md ${activeRoleOption.iconBg}`}>
          <ActiveIcon className="w-3.5 h-3.5" />
        </div>
        <div className="text-left hidden md:block">
          <div className="font-semibold text-slate-900 leading-tight flex items-center gap-1.5">
            <span className="truncate max-w-[130px]">{activeRoleOption.label}</span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${activeRoleOption.badgeColor}`}
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
          className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm rounded-[16px] bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] py-2 z-50 text-slate-900 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3.5 py-2 border-b border-slate-100 mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Switch Persona Role
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Simulate role-based views across the 21 MVP user stories
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
                      ? "bg-slate-50 text-slate-900 font-semibold border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${option.iconBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5 truncate">
                        <span className="truncate">{option.label}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border shrink-0 ${option.badgeColor}`}
                        >
                          {option.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{option.sublabel}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#C3002F] shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 px-3.5 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Nissan Used Vehicle Programme</span>
            <span className="text-[#C3002F] font-mono font-semibold">MVP v2026.1</span>
          </div>
        </div>
      )}
    </div>
  );
}
