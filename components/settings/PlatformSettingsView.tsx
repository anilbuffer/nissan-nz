"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useProgramme } from "@/lib/programme-context";
import { OFFICIAL_PRICING_ZONES } from "@/lib/pricing-calculator";
import { UserRole } from "@/lib/types";
import { audio } from "@/lib/sound";
import {
  User,
  LogOut,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Briefcase,
  Hash,
  Award,
  Edit3,
  Save,
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
} from "lucide-react";

interface PlatformSettingsViewProps {
  onBack: () => void;
}

export default function PlatformSettingsView({ onBack }: PlatformSettingsViewProps) {
  const router = useRouter();
  const { currentUser, currentDealer, logout, updateCurrentUser, updateCurrentDealer } = useAuth();
  const { updateUser, updateDealerProfile, logAudit } = useProgramme();

  const role: UserRole = currentUser?.role || "DEALER_USER";

  // ─────────────────────────────────────────────────────────────
  // ROLE CONFIGURATION & LABELS
  // ─────────────────────────────────────────────────────────────
  const getRoleConfig = () => {
    switch (role) {
      case "AUTOHUB_ADMIN":
        return {
          tierBadge: "Tier 1 · Full Platform Authority",
          tierShort: "Tier 1",
          roleTitle: "Operations Central Controller",
          securityBadge: "Verified Platform Master Key (MFA)",
          defaultEntityName: "AutoHub Operations Center (Auckland HQ)",
          stationLabel: "Operations Center HQ",
          defaultStationValue: "Auckland Harbour Logistics Central, New Zealand",
          codeLabel: "Operations Node ID",
          defaultCodeValue: "NODE-NZ-HQ-01",
          jurisdictionLabel: "System Jurisdiction",
          defaultJurisdictionValue: "National Network & Export Gateways (NZ & Japan)",
        };

      case "NISSAN_JAPAN":
        return {
          tierBadge: "Tier 2 · Export Procurement & Yard Marshalling",
          tierShort: "Tier 2",
          roleTitle: "Yokohama Export Marshalling Director",
          securityBadge: "Verified Nissan Japan Authority (MFA)",
          defaultEntityName: "Nissan Motor Co., Ltd. (Japan Export Division)",
          stationLabel: "Export Marshalling Base",
          defaultStationValue: "Yokohama Terminal (Bay 14) & Kobe Export Yard, Japan",
          codeLabel: "Export Terminal Code",
          defaultCodeValue: "JP-YOK-EXP-08",
          jurisdictionLabel: "Yard Operations Jurisdiction",
          defaultJurisdictionValue: "USS Auctions, JEVIC Digital Verification & RoRo Vessels",
        };

      case "DEALER_ADMIN": {
        const zoneId = currentDealer?.pricingZoneId || currentUser?.zoneId || "ZONE_1";
        const zone = OFFICIAL_PRICING_ZONES[zoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;
        return {
          tierBadge: "Tier 3 · Franchise Dealer Principal",
          tierShort: "Tier 3",
          roleTitle: "Franchise Principal & Executive Director",
          securityBadge: "Verified Nissan Franchise SSO (MFA)",
          defaultEntityName: currentDealer?.legalTradingName || "Auckland Nissan City Ltd",
          stationLabel: "Franchise Showroom Address",
          defaultStationValue: currentDealer?.address || "360 Great South Road, Greenlane, Auckland 1051",
          codeLabel: "Franchise Dealer Code",
          defaultCodeValue: currentDealer?.dealerCode || "NZ-NIS-AKL01",
          jurisdictionLabel: "Assigned Pricing Zone",
          defaultJurisdictionValue: `${zoneId} — ${zone.zoneName} ($${zone.deliveryCostNZD} NZD Towing)`,
        };
      }

      case "DEALER_USER": {
        const zoneId = currentDealer?.pricingZoneId || currentUser?.zoneId || "ZONE_1";
        const zone = OFFICIAL_PRICING_ZONES[zoneId] || OFFICIAL_PRICING_ZONES.ZONE_1;
        return {
          tierBadge: "Tier 4 · Franchise Sales & Inventory Buyer",
          tierShort: "Tier 4",
          roleTitle: "Authorised Dealership Wholesale Buyer",
          securityBadge: "Verified Franchise Buyer (MFA)",
          defaultEntityName: currentDealer?.legalTradingName || "Auckland Nissan City Ltd",
          stationLabel: "Dealership Showroom Depot",
          defaultStationValue: currentDealer?.address || "360 Great South Road, Greenlane, Auckland 1051",
          codeLabel: "Dealer Franchise Code",
          defaultCodeValue: currentDealer?.dealerCode || "NZ-NIS-AKL01",
          jurisdictionLabel: "Assigned Delivery Zone",
          defaultJurisdictionValue: `${zoneId} — ${zone.zoneName}`,
        };
      }

      case "READONLY_PROGRAMME_USER":
      default:
        return {
          tierBadge: "Tier 5 · Regulatory Read-Only Auditor",
          tierShort: "Tier 5",
          roleTitle: "Principal Border Compliance Auditor",
          securityBadge: "Verified Regulatory Audit Key (MFA)",
          defaultEntityName: "New Zealand Transport Agency (NZTA) & Customs Regulatory Liaison",
          stationLabel: "Regulatory Inspection Depot",
          defaultStationValue: "Border Compliance Branch, Auckland Harbour & Lyttelton Port",
          codeLabel: "Auditor Accreditation ID",
          defaultCodeValue: "NZ-REG-AUDIT-409",
          jurisdictionLabel: "Audit Boundary",
          defaultJurisdictionValue: "Read-Only Cryptographic Access (Zero Order/Price Mutation Authority)",
        };
    }
  };

  const config = getRoleConfig();

  // Resolved dynamic entity details
  const activeEntityName =
    currentUser?.dealershipName || currentDealer?.legalTradingName || config.defaultEntityName;
  const activeStationValue =
    currentUser?.address || currentDealer?.address || config.defaultStationValue;
  const activeCodeValue =
    currentUser?.orgCode || currentDealer?.dealerCode || config.defaultCodeValue;
  const activeJurisdictionValue = currentUser?.jurisdiction || config.defaultJurisdictionValue;

  // ─────────────────────────────────────────────────────────────
  // 1. EDITABLE PERSONAL & ORGANIZATIONAL DETAILS STATE
  // ─────────────────────────────────────────────────────────────
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    title: "",
    department: "",
    entityName: "",
    stationAddress: "",
    orgCode: "",
  });

  // Populate form state whenever currentUser or currentDealer changes
  useEffect(() => {
    setFormData({
      name: currentUser?.name || "David Miller",
      email: currentUser?.email || "dealer@aucklandnissan.co.nz",
      phone: currentUser?.phone || "+64 9 520 8899",
      title: currentUser?.title || config.roleTitle,
      department: currentUser?.department || "Operations",
      entityName: activeEntityName,
      stationAddress: activeStationValue,
      orgCode: activeCodeValue,
    });
  }, [currentUser, currentDealer]);

  const handleCancelProfileEdit = () => {
    audio.playSubtleClick();
    setFormData({
      name: currentUser?.name || "David Miller",
      email: currentUser?.email || "dealer@aucklandnissan.co.nz",
      phone: currentUser?.phone || "+64 9 520 8899",
      title: currentUser?.title || config.roleTitle,
      department: currentUser?.department || "Operations",
      entityName: activeEntityName,
      stationAddress: activeStationValue,
      orgCode: activeCodeValue,
    });
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  const validateProfileForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Full name is required (at least 2 characters).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = "Please enter a valid business email address.";
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 6) {
      errors.phone = "Valid contact phone is required (at least 6 digits).";
    }
    if (!formData.title.trim()) {
      errors.title = "Designation / Job Title is required.";
    }
    if (!formData.department.trim()) {
      errors.department = "Department name is required.";
    }
    if (!formData.entityName.trim()) {
      errors.entityName = "Organization or Dealership name is required.";
    }
    if (!formData.stationAddress.trim()) {
      errors.stationAddress = "Depot, Showroom or Station address is required.";
    }
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) {
      audio.playWarningChime();
      return;
    }

    setIsSavingProfile(true);
    audio.playSubtleClick();

    setTimeout(() => {
      const updates = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        title: formData.title.trim(),
        department: formData.department.trim(),
        dealershipName: formData.entityName.trim(),
        address: formData.stationAddress.trim(),
        orgCode: formData.orgCode.trim(),
      };

      // 1. Update AuthContext currentUser
      updateCurrentUser(updates);

      // 2. If dealer, update dealer account state as well
      if (currentDealer) {
        updateCurrentDealer({
          legalTradingName: formData.entityName.trim(),
          address: formData.stationAddress.trim(),
          primaryContactName: formData.name.trim(),
          primaryContactEmail: formData.email.trim(),
          primaryContactPhone: formData.phone.trim(),
          dealerCode: formData.orgCode.trim() || currentDealer.dealerCode,
        });
        updateDealerProfile(currentDealer.id, {
          legalTradingName: formData.entityName.trim(),
          address: formData.stationAddress.trim(),
          primaryContactName: formData.name.trim(),
          primaryContactEmail: formData.email.trim(),
          primaryContactPhone: formData.phone.trim(),
          dealerCode: formData.orgCode.trim() || currentDealer.dealerCode,
        });
      }

      // 3. Update in programme context list
      if (currentUser?.id) {
        updateUser(currentUser.id, updates);
      }

      // 4. Log audit entry
      logAudit({
        actorName: formData.name.trim(),
        actorEmail: formData.email.trim(),
        actorRole: role,
        action: "USER_PROFILE_UPDATED",
        category: "AUTHENTICATION",
        objectType: "UserAccount",
        objectId: currentUser?.id || "CURRENT_USER",
        details: `Profile and contact credentials updated for ${formData.name.trim()} (${role}).`,
      });

      audio.playSuccessChime();
      setIsSavingProfile(false);
      setIsEditingProfile(false);
      setProfileSuccessMsg("Personal details and credentials have been updated successfully!");

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setProfileSuccessMsg(null);
      }, 5000);
    }, 450);
  };

  // ─────────────────────────────────────────────────────────────
  // 2. CHANGE PASSWORD STATE & LOGIC
  // ─────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordErrors, setPasswordErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
    general?: string;
  }>({});
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordLastChangedText, setPasswordLastChangedText] = useState("Never");

  useEffect(() => {
    if (currentUser?.passwordLastChanged) {
      setPasswordLastChangedText(currentUser.passwordLastChanged);
    }
  }, [currentUser?.passwordLastChanged]);

  // Live password requirements
  const passwordCriteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };
  }, [newPassword]);

  // Dynamic strength score (0 to 4)
  const strengthScore = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (passwordCriteria.minLength) score += 1;
    if (passwordCriteria.hasUpper && passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    if (passwordCriteria.hasSpecial) score += 1;
    return score;
  }, [newPassword, passwordCriteria]);

  const strengthLabel = useMemo(() => {
    switch (strengthScore) {
      case 0:
        return { text: "Too Short", color: "text-slate-400", barColor: "bg-slate-200" };
      case 1:
        return { text: "Weak", color: "text-rose-600", barColor: "bg-rose-500" };
      case 2:
        return { text: "Fair", color: "text-amber-600", barColor: "bg-amber-500" };
      case 3:
        return { text: "Good", color: "text-sky-600", barColor: "bg-sky-500" };
      case 4:
        return { text: "Strong", color: "text-emerald-600", barColor: "bg-emerald-500" };
      default:
        return { text: "Fair", color: "text-slate-400", barColor: "bg-slate-200" };
    }
  }, [strengthScore]);

  const handleClearPasswordForm = () => {
    audio.playSubtleClick();
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { current?: string; new?: string; confirm?: string; general?: string } = {};

    if (!currentPassword.trim()) {
      errors.current = "Active password is required to authorize change.";
    }

    if (newPassword.length < 8) {
      errors.new = "New password must be at least 8 characters long.";
    } else if (strengthScore < 2) {
      errors.new = "Password is too weak. Please combine uppercase, numbers, or symbols.";
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.new = "New password cannot be identical to current password.";
    }

    if (!confirmPassword) {
      errors.confirm = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      errors.confirm = "Passwords do not match. Please re-enter.";
    }

    if (Object.keys(errors).length > 0) {
      audio.playWarningChime();
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setIsUpdatingPassword(true);
    audio.playSubtleClick();

    setTimeout(() => {
      const nowFormatted = new Date().toLocaleDateString("en-NZ", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Update timestamp on currentUser
      updateCurrentUser({ passwordLastChanged: `Updated on ${nowFormatted}` });
      setPasswordLastChangedText(`Updated on ${nowFormatted}`);

      // Log security audit trail
      logAudit({
        actorName: currentUser?.name || "Authorized Operator",
        actorEmail: currentUser?.email || "operator@nissan.co.nz",
        actorRole: role,
        action: "PASSWORD_CHANGED",
        category: "AUTHENTICATION",
        objectType: "UserAccount",
        objectId: currentUser?.id || "CURRENT_USER",
        details: `Account authentication password changed successfully for ${currentUser?.email} (${role}).`,
      });

      audio.playSuccessChime();
      setIsUpdatingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccessMsg(
        "✓ Password changed successfully! Your new authentication credentials are active."
      );

      setTimeout(() => {
        setPasswordSuccessMsg(null);
      }, 6000);
    }, 550);
  };

  const handleLogout = () => {
    audio.playSubtleClick();
    logout();
    router.push("/");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-12">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. Header Navigation Bar                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onBack();
            }}
            className="btn-outline shrink-0 flex items-center gap-1.5"
            title="Go back to portal"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                Account Details &amp; Settings
              </h1>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-[#FFF5F5] text-[#C3002F] border border-[#FFE3E3] font-mono">
                {role.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage authenticated operator credentials, contact information, and account security.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn-outline hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-slate-700 self-start sm:self-auto shrink-0 flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Global Profile Success Banner */}
      {profileSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setProfileSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. User Identity Card (Clean Executive Header)              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-16 h-16 rounded-2xl bg-[#0A0A0A] text-white font-bold text-2xl flex items-center justify-center shadow-xs ring-4 ring-slate-100 shrink-0">
            {currentUser?.name?.charAt(0) || "U"}
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight truncate">
                {currentUser?.name || "David Miller"}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono">
                {config.tierBadge}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium truncate">
              {currentUser?.title || config.roleTitle} ·{" "}
              <strong className="text-slate-800 font-bold">{activeEntityName}</strong>
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold self-start sm:self-auto font-mono shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{config.securityBadge}</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. CARD 1: Personal Contact & Profile Details (EDITABLE)    */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#C3002F]">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Personal Contact &amp; Details
              </h3>
              <p className="text-xs text-slate-500">
                Official operator profile information as registered in the portal.
              </p>
            </div>
          </div>

          {!isEditingProfile ? (
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                setIsEditingProfile(true);
              }}
              className="btn-outline hover:border-[#C3002F]/30 hover:bg-[#FFF5F5] hover:text-[#C3002F] text-slate-700 text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleCancelProfileEdit}
                disabled={isSavingProfile}
                className="btn-outline text-xs flex items-center gap-1.5 py-1.5 px-3"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#C3002F] hover:bg-[#A10026] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isSavingProfile ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSavingProfile ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </div>

        {/* VIEW MODE: Read-Only Overview */}
        {!isEditingProfile ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-medium">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Full Name
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-semibold">
                    Primary
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900">
                  {currentUser?.name || "David Miller"}
                </div>
              </div>

              {/* Business Email */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Direct Business Email
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-semibold">
                    Verified
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900 truncate font-mono">
                  {currentUser?.email || "dealer@aucklandnissan.co.nz"}
                </div>
              </div>

              {/* Contact Telephone */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Direct Contact Phone</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 font-mono">
                  {currentUser?.phone || "+64 9 520 8899"}
                </div>
              </div>

              {/* Designation & Department */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Designation &amp; Department</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser?.title || config.roleTitle} ·{" "}
                  {currentUser?.department || "Operations"}
                </div>
              </div>
            </div>

            {/* Organization Quick Context */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Entity / Dealership</span>
                <span className="font-semibold text-slate-900 truncate block mt-0.5">
                  {activeEntityName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{config.stationLabel}</span>
                <span className="font-semibold text-slate-900 truncate block mt-0.5">
                  {activeStationValue}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">{config.codeLabel}</span>
                <span className="font-semibold text-slate-900 font-mono block mt-0.5">
                  {activeCodeValue}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* EDIT MODE: Active Form */
          <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Edit your personal profile information below. Updates will apply immediately to your session and portal communications.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Full Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (profileErrors.name) setProfileErrors({ ...profileErrors, name: "" });
                  }}
                  placeholder="e.g. David Miller"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border ${
                    profileErrors.name
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all`}
                />
                {profileErrors.name && (
                  <p className="text-[11px] text-rose-600">{profileErrors.name}</p>
                )}
              </div>

              {/* Direct Business Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Direct Business Email</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (profileErrors.email) setProfileErrors({ ...profileErrors, email: "" });
                  }}
                  placeholder="e.g. dealer@aucklandnissan.co.nz"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border ${
                    profileErrors.email
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all font-mono`}
                />
                {profileErrors.email && (
                  <p className="text-[11px] text-rose-600">{profileErrors.email}</p>
                )}
              </div>

              {/* Contact Telephone */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Direct Contact Phone</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: "" });
                  }}
                  placeholder="e.g. +64 9 520 8899"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border ${
                    profileErrors.phone
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all font-mono`}
                />
                {profileErrors.phone && (
                  <p className="text-[11px] text-rose-600">{profileErrors.phone}</p>
                )}
              </div>

              {/* Designation / Job Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Designation / Job Title</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (profileErrors.title) setProfileErrors({ ...profileErrors, title: "" });
                  }}
                  placeholder="e.g. Senior Buyer & Fleet Specialist"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border ${
                    profileErrors.title
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all`}
                />
                {profileErrors.title && (
                  <p className="text-[11px] text-rose-600">{profileErrors.title}</p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Department / Operational Division</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.department}
                  onChange={(e) => {
                    setFormData({ ...formData, department: e.target.value });
                    if (profileErrors.department)
                      setProfileErrors({ ...profileErrors, department: "" });
                  }}
                  placeholder="e.g. Vehicle Sales & Pre-Owned"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border ${
                    profileErrors.department
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all`}
                />
                {profileErrors.department && (
                  <p className="text-[11px] text-rose-600">{profileErrors.department}</p>
                )}
              </div>

              {/* Entity / Dealership Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Entity / Dealership Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.entityName}
                  onChange={(e) => {
                    setFormData({ ...formData, entityName: e.target.value });
                    if (profileErrors.entityName)
                      setProfileErrors({ ...profileErrors, entityName: "" });
                  }}
                  placeholder="e.g. Auckland Nissan City Ltd"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border ${
                    profileErrors.entityName
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all`}
                />
                {profileErrors.entityName && (
                  <p className="text-[11px] text-rose-600">{profileErrors.entityName}</p>
                )}
              </div>

              {/* Showroom / Base Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{config.stationLabel}</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.stationAddress}
                  onChange={(e) => {
                    setFormData({ ...formData, stationAddress: e.target.value });
                    if (profileErrors.stationAddress)
                      setProfileErrors({ ...profileErrors, stationAddress: "" });
                  }}
                  placeholder="e.g. 360 Great South Road, Greenlane, Auckland 1051"
                  className={`w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border ${
                    profileErrors.stationAddress
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all`}
                />
                {profileErrors.stationAddress && (
                  <p className="text-[11px] text-rose-600">{profileErrors.stationAddress}</p>
                )}
              </div>

              {/* Identifier / Node / Dealer Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>{config.codeLabel}</span>
                </label>
                <input
                  type="text"
                  value={formData.orgCode}
                  onChange={(e) => setFormData({ ...formData, orgCode: e.target.value })}
                  placeholder="e.g. NZ-NIS-AKL01"
                  className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-slate-200 text-slate-900 outline-none focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10 font-mono transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCancelProfileEdit}
                disabled={isSavingProfile}
                className="btn-outline text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C3002F] hover:bg-[#A10026] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isSavingProfile ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSavingProfile ? "Saving Updates..." : "Save Profile Details"}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. CARD 2: Organization & Credential Details               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-[#C3002F]" />
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Organization Credentials &amp; Authority
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Entity / Organization */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Entity / Organization</span>
            </div>
            <div className="text-xs font-semibold text-slate-900 truncate">
              {activeEntityName}
            </div>
          </div>

          {/* Base Location / Showroom / Terminal */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.stationLabel}</span>
            </div>
            <div className="text-xs font-semibold text-slate-900 truncate">
              {activeStationValue}
            </div>
          </div>

          {/* Identifier Code / Node Code */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.codeLabel}</span>
            </div>
            <div className="text-xs font-semibold text-slate-900 font-mono">
              {activeCodeValue}
            </div>
          </div>

          {/* Operational Jurisdiction / Zone */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-medium">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>{config.jurisdictionLabel}</span>
            </div>
            <div className="text-xs font-semibold text-slate-900 truncate">
              {activeJurisdictionValue}
            </div>
          </div>
        </div>

        {/* Reassurance Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
          <span>Identity authenticated under Nissan Motor Corporation New Zealand RBAC Security Framework.</span>
          <span className="font-mono text-[11px] text-slate-400">MFA Session Active</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 5. CARD 3: CHANGE PASSWORD SECTION                          */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#C3002F]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Change Password
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                  Authentication &amp; Security
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your account password to ensure secure access across all portal operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{passwordLastChangedText}</span>
          </div>
        </div>

        {/* Password Success Notification */}
        {passwordSuccessMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setPasswordSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Field 1: Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Current Password</span>
                  <span className="text-rose-500">*</span>
                </span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordErrors.current)
                      setPasswordErrors({ ...passwordErrors, current: undefined });
                  }}
                  placeholder="Enter current password"
                  className={`w-full pl-3.5 pr-10 py-2.5 text-xs bg-white rounded-xl border ${
                    passwordErrors.current
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showCurrentPassword ? "Hide password" : "Show password"}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.current ? (
                <p className="text-[11px] text-rose-600">{passwordErrors.current}</p>
              ) : (
                <p className="text-[11px] text-slate-400">
                  Required to verify your active authorization.
                </p>
              )}
            </div>

            {/* Field 2: New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>New Password</span>
                  <span className="text-rose-500">*</span>
                </span>
                {newPassword && (
                  <span className={`text-[11px] font-semibold ${strengthLabel.color}`}>
                    {strengthLabel.text}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordErrors.new) setPasswordErrors({ ...passwordErrors, new: undefined });
                  }}
                  placeholder="Enter new password (min. 8 chars)"
                  className={`w-full pl-3.5 pr-10 py-2.5 text-xs bg-white rounded-xl border ${
                    passwordErrors.new
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator Bars */}
              {newPassword ? (
                <div className="space-y-1 pt-1">
                  <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strengthScore >= 1 ? strengthLabel.barColor : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strengthScore >= 2 ? strengthLabel.barColor : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strengthScore >= 3 ? strengthLabel.barColor : "bg-slate-200"
                      }`}
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strengthScore >= 4 ? strengthLabel.barColor : "bg-slate-200"
                      }`}
                    />
                  </div>
                  {passwordErrors.new && (
                    <p className="text-[11px] text-rose-600">{passwordErrors.new}</p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">Minimum 8 characters with numbers &amp; letters.</p>
              )}
            </div>

            {/* Field 3: Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Confirm New Password</span>
                  <span className="text-rose-500">*</span>
                </span>
                {confirmPassword && newPassword && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${
                      newPassword === confirmPassword ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {newPassword === confirmPassword ? (
                      <>
                        <Check className="w-3 h-3" /> Match
                      </>
                    ) : (
                      "Mismatch"
                    )}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordErrors.confirm)
                      setPasswordErrors({ ...passwordErrors, confirm: undefined });
                  }}
                  placeholder="Re-enter new password"
                  className={`w-full pl-3.5 pr-10 py-2.5 text-xs bg-white rounded-xl border ${
                    passwordErrors.confirm
                      ? "border-rose-400 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/10"
                  } text-slate-900 outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {passwordErrors.confirm ? (
                <p className="text-[11px] text-rose-600">{passwordErrors.confirm}</p>
              ) : (
                <p className="text-[11px] text-slate-400">Must match your new password exactly.</p>
              )}
            </div>
          </div>

          {/* Interactive Password Requirements Checklist */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <span className="text-slate-700 text-xs font-semibold block">
              Security Standard Requirements:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordCriteria.minLength ? "text-emerald-700 font-semibold" : "text-slate-500"
                }`}
              >
                {passwordCriteria.minLength ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1 shrink-0" />
                )}
                <span>8+ Characters</span>
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordCriteria.hasUpper && passwordCriteria.hasLower
                    ? "text-emerald-700 font-semibold"
                    : "text-slate-500"
                }`}
              >
                {passwordCriteria.hasUpper && passwordCriteria.hasLower ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1 shrink-0" />
                )}
                <span>Upper &amp; Lowercase</span>
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordCriteria.hasNumber ? "text-emerald-700 font-semibold" : "text-slate-500"
                }`}
              >
                {passwordCriteria.hasNumber ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1 shrink-0" />
                )}
                <span>At least 1 Number</span>
              </div>

              <div
                className={`flex items-center gap-1.5 transition-colors ${
                  passwordCriteria.hasSpecial ? "text-emerald-700 font-semibold" : "text-slate-500"
                }`}
              >
                {passwordCriteria.hasSpecial ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-1 shrink-0" />
                )}
                <span>Special Character (!@#$)</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClearPasswordForm}
              disabled={isUpdatingPassword || (!currentPassword && !newPassword && !confirmPassword)}
              className="btn-outline text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1.5 disabled:opacity-40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C3002F] hover:bg-[#A10026] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isUpdatingPassword ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{isUpdatingPassword ? "Updating Password..." : "Update Password"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
