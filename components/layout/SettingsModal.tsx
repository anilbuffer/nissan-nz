"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { audio } from "@/lib/sound";
import { UserRole } from "@/lib/types";
import {
  X,
  Settings,
  User,
  Shield,
  Car,
  Globe2,
  Volume2,
  VolumeX,
  Bell,
  Check,
  LogOut,
  MapPin,
  Mail,
  Phone,
  KeyRound,
  Sparkles,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RoleOption {
  role: UserRole;
  label: string;
  sublabel: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  iconBg: string;
  email: string;
}

const ROLES: RoleOption[] = [
  {
    role: "DEALER_USER",
    label: "Auckland Nissan City",
    sublabel: "David Miller · General Manager",
    badge: "DEALER (ZONE 1)",
    badgeColor: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    icon: Car,
    iconBg: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    email: "dealer@aucklandnissan.co.nz",
  },
  {
    role: "AUTOHUB_ADMIN",
    label: "Autohub Platform Operations",
    sublabel: "Sarah Jenkins · Operations Lead",
    badge: "CENTRAL ADMIN",
    badgeColor: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    icon: Shield,
    iconBg: "bg-blue-50 text-blue-600 border border-blue-200",
    email: "ops@autohub.co.nz",
  },
  {
    role: "NISSAN_JAPAN",
    label: "Nissan Japan HQ & Export Yards",
    sublabel: "Kenji Sato · Tokyo Export Coordinator",
    badge: "JAPAN HQ",
    badgeColor: "bg-purple-500/15 text-purple-600 border-purple-500/30",
    icon: Globe2,
    iconBg: "bg-purple-50 text-purple-600 border border-purple-200",
    email: "kenji.sato@nissan.co.jp",
  },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { currentUser, currentDealer, switchRole, logout } = useAuth();
  const [isMuted, setIsMuted] = useState(audio.getMuted());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACCOUNT" | "ROLES" | "PREFERENCES">("ROLES");

  if (!isOpen) return null;

  const handleToggleSound = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      audio.playSoftChime();
    }
  };

  const handleRoleSelect = (role: UserRole) => {
    audio.playSoftChime();
    switchRole(role);
    onClose();
  };

  const handleLogout = () => {
    audio.playSubtleClick();
    onClose();
    logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Platform Settings
              </h3>
              <p className="text-xs text-slate-500">
                Manage persona, preferences and account scope
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs with Touch Scrolling */}
        <div className="px-4 sm:px-6 pt-3 flex gap-2 border-b border-slate-100 bg-white overflow-x-auto hide-scrollbar touch-scroll">
          {[
            { id: "ROLES", label: "Switch Persona / Role", icon: Shield },
            { id: "ACCOUNT", label: "My Profile", icon: User },
            { id: "PREFERENCES", label: "Preferences & Audio", icon: Volume2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  audio.playSubtleClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${isActive
                  ? "border-[#E11D48] text-[#E11D48]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          {/* TAB 1: SWITCH PERSONA / ROLES */}
          {activeTab === "ROLES" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>Select active test persona to preview other portals:</span>
                <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  MVP Live Switch
                </span>
              </div>

              <div className="space-y-2.5">
                {ROLES.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentUser?.role === item.role;

                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleRoleSelect(item.role)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-[#E11D48]/30"
                        : "bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300"
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2.5 rounded-xl shrink-0 ${isActive
                            ? "bg-white/10 text-white border border-white/20"
                            : item.iconBg
                            }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-extrabold truncate ${isActive ? "text-white" : "text-slate-900"
                                }`}
                            >
                              {item.label}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${isActive
                                ? "bg-white/15 text-slate-200 border-white/20"
                                : item.badgeColor
                                }`}
                            >
                              {item.badge}
                            </span>
                          </div>
                          <p
                            className={`text-[11px] truncate mt-0.5 ${isActive ? "text-slate-300" : "text-slate-500"
                              }`}
                          >
                            {item.sublabel} · {item.email}
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <div className="px-2.5 py-1 rounded-full bg-[#E11D48] text-white font-mono text-[10px] font-bold flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>ACTIVE</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 hover:text-slate-700 shrink-0">
                          Switch →
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MY PROFILE */}
          {activeTab === "ACCOUNT" && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0A1322] text-white font-black text-lg flex items-center justify-center shrink-0 border border-slate-700">
                  {currentUser?.name.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">
                    {currentUser?.name}
                  </h4>
                  <p className="text-slate-500 text-[11px] truncate">{currentUser?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {currentUser?.role}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> Email:
                  </span>
                  <span className="font-medium text-slate-900">{currentUser?.email}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone:
                  </span>
                  <span className="font-medium text-slate-900 font-mono">
                    {currentUser?.phone || "+64 9 520 8900"}
                  </span>
                </div>

                {currentDealer && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500 flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> Dealership:
                    </span>
                    <span className="font-medium text-slate-900">
                      {currentDealer.legalTradingName} ({currentDealer.dealerCode})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 flex items-center gap-2">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Authentication:
                  </span>
                  <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-bold border border-emerald-200">
                    MFA TOTP Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES & AUDIO */}
          {activeTab === "PREFERENCES" && (
            <div className="space-y-3.5 text-xs">
              {/* Sound FX Toggle */}
              <div className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700">
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">Audio Micro-Interactions</h5>
                    <p className="text-[11px] text-slate-500">
                      Subtle tactile sound effects for button clicks, allocation holds and tab changes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${!isMuted
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                >
                  {!isMuted ? "Enabled" : "Muted"}
                </button>
              </div>

              {/* Order Notifications */}
              <div className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">24-Hour Hold Expiry Alerts</h5>
                    <p className="text-[11px] text-slate-500">
                      Real-time notifications when an atomic hold is nearing 24-hour expiration
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setNotificationsEnabled(!notificationsEnabled);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border ${notificationsEnabled
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                >
                  {notificationsEnabled ? "Enabled" : "Off"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

