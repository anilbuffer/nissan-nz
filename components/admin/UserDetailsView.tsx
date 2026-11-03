"use client";

import React, { useState } from "react";
import { UserAccount, DealerAccount, AuditEvent } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { useProgramme } from "@/lib/programme-context";
import { OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { audio } from "@/lib/sound";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle2,
  Lock,
  Unlock,
  RotateCcw,
  LogIn,
  AlertTriangle,
  History,
  Laptop,
  Check,
  Send,
  Trash2,
} from "lucide-react";

interface UserDetailsViewProps {
  userId: string;
  onBack: () => void;
}

export default function UserDetailsView({ userId, onBack }: UserDetailsViewProps) {
  const { users, dealers, auditLogs, toggleUserStatus, updateUser, deleteUser, vehicles, orders } = useProgramme();
  const { loginAs, currentUser } = useAuth();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const user = users.find((u) => u.id === userId);

  if (!user) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">User Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested user account may have been removed or does not exist.
        </p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-[#0A1322] text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Users Listing
        </button>
      </div>
    );
  }

  const dealer = dealers.find((d) => d.id === user.dealerId);
  const userZone = user.zoneId ? OFFICIAL_PRICING_ZONES[user.zoneId] : null;

  // Active holds placed by this user's dealership
  const activeDealerHolds = user.dealerId
    ? vehicles.filter((v) => v.status === "RESERVED" && v.reservedByDealerId === user.dealerId)
    : [];

  const totalDealerOrders = user.dealerId
    ? orders.filter((o) => o.dealerId === user.dealerId)
    : [];

  // Filter audit events for this user
  const userEvents = auditLogs.filter(
    (log) =>
      log.actorEmail.toLowerCase() === user.email.toLowerCase() ||
      log.objectId === user.id ||
      (user.dealerId && log.objectId === user.dealerId)
  );

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleStatus = () => {
    audio.playSubtleClick();
    toggleUserStatus(user.id);
    showNotification(
      user.active
        ? `Account for ${user.name} has been suspended.`
        : `Account for ${user.name} has been reactivated.`
    );
  };

  const handlePasswordReset = () => {
    audio.playSuccessChime();
    showNotification(`Password reset magic link dispatched to ${user.email}`);
  };

  const handleImpersonate = () => {
    audio.playSuccessChime();
    loginAs(user.email);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "AUTOHUB_ADMIN":
        return {
          label: "Operations Central Controller",
          bg: "bg-rose-50 text-[#E11D48] border-rose-200",
          dot: "bg-[#E11D48]",
        };
      case "NISSAN_JAPAN":
        return {
          label: "Japan Procurement Specialist",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-600",
        };
      case "DEALER_ADMIN":
        return {
          label: "Franchise Dealer Principal",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-600",
        };
      case "DEALER_USER":
        return {
          label: "Dealership Sales & Buyer",
          bg: "bg-slate-100 text-slate-800 border-slate-200",
          dot: "bg-slate-600",
        };
      case "READONLY_AUDITOR":
        return {
          label: "Regulatory Auditor",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          dot: "bg-amber-600",
        };
      default:
        return {
          label: role,
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
        };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#0A1322] text-white rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audio.playSubtleClick();
              onBack();
            }}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Users</span>
          </button>

          <div className="h-5 w-px bg-slate-200"></div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>User Management</span>
            <span>/</span>
            <span className="font-semibold text-slate-900">{user.name}</span>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePasswordReset}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Send className="w-3.5 h-3.5 text-slate-400" />
            <span>Send Reset Link</span>
          </button>

          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${user.active
              ? "border-rose-200 bg-rose-50 hover:bg-rose-100 text-[#E11D48]"
              : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
              }`}
          >
            {user.active ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Suspend Account</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Reactivate Account</span>
              </>
            )}
          </button>

          {currentUser?.id !== user.id && (
            <button
              onClick={handleImpersonate}
              title="Test platform as this user"
              className="px-3.5 py-1.5 rounded-xl bg-[#0A1322] hover:bg-[#1B2A42] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-rose-400" />
              <span>Login As User</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Hero Identity Banner                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt={user.name}
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.active ? "bg-emerald-500" : "bg-rose-500"
                  }`}
              ></span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {user.name}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleInfo.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${roleInfo.dot}`}></span>
                  <span>{roleInfo.label}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.active
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-[#E11D48] border border-rose-200"
                    }`}
                >
                  {user.active ? "Active Platform Member" : "Account Suspended"}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-600 mb-2">
                {user.title || "Platform Specialist"} · {user.department || "Operations & Commercial"}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-700">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium text-slate-700">{user.dealershipName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex sm:flex-row md:flex-col items-start md:items-end gap-2 text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
            <div className="text-[11px] text-slate-400">Account ID:</div>
            <div className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
              {user.id}
            </div>
            <div className="text-[10px] text-slate-400">
              Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active Member"}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. Detail Columns                                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Commercial & Dealership Assignment */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-[#E11D48]" />
            <h3 className="font-bold text-sm text-slate-900">Commercial & Zone Profile</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Assigned Dealership</span>
              <div className="font-semibold text-slate-900">{user.dealershipName}</div>
              {dealer && (
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Code: {dealer.dealerCode} · NZBN: {dealer.nzbn}
                </div>
              )}
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Geographic Pricing Zone</span>
              {userZone ? (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>{userZone.zoneName}</span>
                    <span className="font-mono text-emerald-600">${userZone.deliveryCostNZD} Deliv.</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{userZone.coverage}</p>
                </div>
              ) : (
                <div className="text-slate-500 italic">Central Operations (All NZ Zones)</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Purchasing Authority</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {user.holdingLimitNZD ? `$${user.holdingLimitNZD.toLocaleString()} NZD` : "Unlimited"}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Max Holds</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {user.maxActiveHolds ? `${user.maxActiveHolds} Vehicles` : "Unlimited"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
              <span>Current Active Holds:</span>
              <span className="font-bold text-slate-900 font-mono">{activeDealerHolds.length}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Lifetime Orders Processed:</span>
              <span className="font-bold text-slate-900 font-mono">{totalDealerOrders.length}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Security & Authentication Health */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-[#E11D48]" />
            <h3 className="font-bold text-sm text-slate-900">Security & Access Health</h3>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${user.mfaEnabled ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Two-Factor Authentication</span>
                  <span className="text-[11px] text-slate-500">
                    {user.mfaEnabled ? "Hardware TOTP App Active" : "MFA Not Configured"}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.mfaEnabled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {user.mfaEnabled ? "Compliant" : "Action Needed"}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Last Login Activity</span>
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.lastLoginAt ? user.lastLoginAt : "Never logged in"}</span>
              </div>
              {user.lastLoginIp && (
                <div className="text-[11px] font-mono text-slate-500 mt-0.5 pl-5">
                  IP: {user.lastLoginIp}
                </div>
              )}
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Authentication Provider</span>
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                <span>Nissan Okta SSO / Passwordless Magic Link</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Password Policy</span>
              <div className="flex items-center justify-between text-slate-700">
                <span>90-Day Rotation Status:</span>
                <span className="font-semibold text-emerald-600">Valid (Rotated 14d ago)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => showNotification("All active sessions revoked.")}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Revoke All Active Sessions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Chronological User Audit Trail                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#E11D48]" />
            <h3 className="font-bold text-sm text-slate-900">
              User Activity & Transaction History
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            {userEvents.length} recorded events
          </span>
        </div>

        {userEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No specific commercial events logged for this user yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {userEvents.slice(0, 8).map((evt) => (
              <div key={evt.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#E11D48] mt-1.5 shrink-0"></div>
                  <div>
                    <div className="font-semibold text-slate-900">{evt.action.replace(/_/g, " ")}</div>
                    <p className="text-slate-500 mt-0.5">{evt.details}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Target: {evt.objectType} · ID: {evt.objectId}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400 shrink-0 font-mono">
                  {new Date(evt.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

