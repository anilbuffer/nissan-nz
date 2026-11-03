"use client";

import React, { useState } from "react";
import { useProgramme } from "@/lib/programme-context";
import { useAuth } from "@/lib/auth-context";
import { UserAccount, UserRole, ZoneId } from "@/lib/types";
import { audio } from "@/lib/sound";
import UserDetailsView from "./UserDetailsView";
import InviteUserModal from "./InviteUserModal";
import {
  Users,
  UserCheck,
  UserPlus,
  Shield,
  ShieldCheck,
  Building2,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Lock,
  Unlock,
  LogIn,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Eye,
  Trash2,
  AlertCircle,
} from "lucide-react";

export default function UserManagementView() {
  const { users, dealers, addUser, toggleUserStatus } = useProgramme();
  const { loginAs, currentUser } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // If a user is selected, render their full details page
  if (selectedUserId) {
    return (
      <UserDetailsView
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
      />
    );
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    // Search query matches name, email, dealership, phone
    const matchesSearch =
      !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.dealershipName && u.dealershipName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));

    // Role filter
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    // Zone filter
    const matchesZone = zoneFilter === "ALL" || u.zoneId === zoneFilter;

    // Status filter
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && u.active) ||
      (statusFilter === "SUSPENDED" && !u.active);

    return matchesSearch && matchesRole && matchesZone && matchesStatus;
  });

  // KPI calculations
  const totalUsers = users.length;
  const dealerUsersCount = users.filter(
    (u) => u.role === "DEALER_USER" || u.role === "DEALER_ADMIN"
  ).length;
  const adminUsersCount = users.filter((u) => u.role === "AUTOHUB_ADMIN").length;
  const japanUsersCount = users.filter((u) => u.role === "NISSAN_JAPAN").length;
  const mfaEnabledCount = users.filter((u) => u.mfaEnabled).length;
  const mfaPercentage = Math.round((mfaEnabledCount / totalUsers) * 100) || 0;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "AUTOHUB_ADMIN":
        return {
          label: "Operations Controller",
          bg: "bg-rose-50 text-[#E11D48] border-rose-200",
          dot: "bg-[#E11D48]",
        };
      case "NISSAN_JAPAN":
        return {
          label: "Japan Procurement",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          dot: "bg-blue-600",
        };
      case "DEALER_ADMIN":
        return {
          label: "Dealer Principal",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-600",
        };
      case "DEALER_USER":
        return {
          label: "Dealership Buyer",
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-500",
        };
      case "READONLY_AUDITOR":
        return {
          label: "Compliance Auditor",
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

  return (
    <div className="space-y-6 pb-12">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Banner & Actions                                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#E11D48]">
              Platform Operations Admin
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Directory Synchronized
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            User Management ({users.length})
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee franchise dealer buyer credentials, Yokohama export leads, and operational permissions across New Zealand.
          </p>
        </div>

        <button
          onClick={() => {
            audio.playSubtleClick();
            setIsInviteModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer self-start sm:self-auto shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite New User</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. KPI Metric Cards                                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Total Platform Users</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">{totalUsers}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">100% Identity Verified</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Dealership Buyers</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">{dealerUsersCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across 5 Geographic Zones</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Operations Controllers</span>
            <Shield className="w-4 h-4 text-[#E11D48]" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">{adminUsersCount}</div>
          <div className="text-[10px] text-[#E11D48] font-medium mt-1">Central Authority</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Japan Export Leads</span>
            <UserCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900">{japanUsersCount}</div>
          <div className="text-[10px] text-blue-600 mt-1">Yokohama & JEVIC</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">MFA Security Rate</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-700">{mfaPercentage}%</div>
          <div className="text-[10px] text-slate-400 mt-1">{mfaEnabledCount} of {totalUsers} Enforced</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. Search & Filter Bar                                     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by legal name, email, dealership, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#E11D48] focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E11D48] cursor-pointer"
            >
              <option value="ALL">All Platform Roles</option>
              <option value="DEALER_USER">Dealer Buyer</option>
              <option value="DEALER_ADMIN">Dealer Principal</option>
              <option value="AUTOHUB_ADMIN">Operations Controller</option>
              <option value="NISSAN_JAPAN">Japan Procurement</option>
              <option value="READONLY_AUDITOR">Compliance Auditor</option>
            </select>

            {/* Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E11D48] cursor-pointer"
            >
              <option value="ALL">All Pricing Zones</option>
              <option value="ZONE_1">Zone 1 (Auckland)</option>
              <option value="ZONE_2">Zone 2 (Waikato/BOP)</option>
              <option value="ZONE_3">Zone 3 (Wellington)</option>
              <option value="ZONE_4">Zone 4 (Canterbury)</option>
              <option value="ZONE_5">Zone 5 (Otago/Southland)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#E11D48] cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Users</option>
              <option value="SUSPENDED">Suspended Users</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-900">{filteredUsers.length}</strong> of {users.length} authorized users
          </span>
          {(searchQuery || roleFilter !== "ALL" || zoneFilter !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setZoneFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="text-[#E11D48] hover:underline font-semibold cursor-pointer text-[11px]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto touch-scroll navy-scrollbar">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-[#0A1322] text-white uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-semibold">User & Contact</th>
                <th className="py-3 px-4 font-semibold">Role Authority</th>
                <th className="py-3 px-4 font-semibold">Dealership & Zone</th>
                <th className="py-3 px-4 font-semibold">Security (MFA)</th>
                <th className="py-3 px-4 font-semibold">Holding Limit</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    No platform users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleBadge = getRoleBadge(user.role);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => {
                        audio.playSubtleClick();
                        setSelectedUserId(user.id);
                      }}
                    >
                      {/* User & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                            alt={user.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-[#E11D48] transition-colors flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {currentUser?.id === user.id && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                            {user.title && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{user.title}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Authority */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dot}`}></span>
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* Dealership & Zone */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 truncate max-w-[200px]">
                          {user.dealershipName}
                        </div>
                        {user.zoneId ? (
                          <span className="inline-block mt-0.5 text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                            {user.zoneId.replace("_", " ")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">All NZ Coverage</span>
                        )}
                      </td>

                      {/* Security (MFA) */}
                      <td className="py-3.5 px-4">
                        {user.mfaEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>MFA Enforced</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Shield className="w-3 h-3 text-amber-500" />
                            <span>Optional</span>
                          </span>
                        )}
                      </td>

                      {/* Holding Limit */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {user.holdingLimitNZD ? (
                          <div>
                            <div>${user.holdingLimitNZD.toLocaleString()}</div>
                            <div className="text-[10px] text-slate-400 font-sans">
                              {user.maxActiveHolds || 0} active holds max
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            user.active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-[#E11D48] border border-rose-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.active ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          ></span>
                          <span>{user.active ? "Active" : "Suspended"}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              audio.playSubtleClick();
                              setSelectedUserId(user.id);
                            }}
                            title="View Full User Details"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              audio.playSubtleClick();
                              toggleUserStatus(user.id);
                            }}
                            title={user.active ? "Suspend User" : "Activate User"}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              user.active
                                ? "border-slate-200 text-slate-600 hover:text-[#E11D48] hover:bg-rose-50"
                                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {user.active ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {currentUser?.id !== user.id && (
                            <button
                              onClick={() => {
                                audio.playSuccessChime();
                                loginAs(user.email);
                              }}
                              title="Login As This User (Session Switch)"
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#E11D48] hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <LogIn className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        dealers={dealers}
        onInvite={(newUser) => addUser(newUser)}
      />
    </div>
  );
}

