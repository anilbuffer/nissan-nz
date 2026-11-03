"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Car,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Smartphone,
  Sparkles,
  FileText,
  User,
  Copy,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { MOCK_USERS } from "@/lib/mock-data";
import { audio } from "@/lib/sound";
import DealerRegistrationModal from "@/components/onboarding/DealerRegistrationModal";

type ActiveTab = "DEALER" | "ADMIN" | "JAPAN" | "PROGRAMME";
type AuthStep = "CREDENTIALS" | "MFA";

export default function LoginPage() {
  const router = useRouter();
  const { loginAs } = useAuth();

  // Primary credential states
  const [activeTab, setActiveTab] = useState<ActiveTab>("DEALER");
  const [email, setEmail] = useState("dealer@aucklandnissan.co.nz");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // 2FA / MFA States (Matching Reference Authenticator UI)
  const [authStep, setAuthStep] = useState<AuthStep>("CREDENTIALS");
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [expectedOtp, setExpectedOtp] = useState("849201");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showManualKey, setShowManualKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const authInputRef = useRef<HTMLInputElement>(null);

  // Focus the authenticator code input when entering MFA step
  useEffect(() => {
    if (authStep === "MFA") {
      setTimeout(() => {
        authInputRef.current?.focus();
      }, 150);
    }
  }, [authStep]);

  const handleTabChange = (tab: ActiveTab) => {
    audio.playSubtleClick();
    setActiveTab(tab);
    setErrorMsg("");
    setAuthStep("CREDENTIALS");
    setAuthenticatorCode("");
    setOtpError("");
    setShowManualKey(false);

    if (tab === "DEALER") {
      setEmail("dealer@aucklandnissan.co.nz");
    } else if (tab === "ADMIN") {
      setEmail("ops@autohub.co.nz");
    } else if (tab === "JAPAN") {
      setEmail("kenji.sato@nissan.co.jp");
    } else {
      setEmail("marcus.vance@nissan.co.nz");
    }
  };

  // Step 1: Submit Credentials & Dispatch 2FA OTP
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    setTimeout(() => {
      const user = MOCK_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (user) {
        audio.playSubtleClick();
        const demoCode = "849201";
        setExpectedOtp(demoCode);
        setAuthenticatorCode("");
        setOtpError("");
        setShowManualKey(false);
        setAuthStep("MFA");
      } else {
        audio.playWarningChime();
        setErrorMsg("Unrecognized email address. Click 'Auto-fill demo' to use a pre-configured dealer account.");
      }
      setIsSubmitting(false);
    }, 400);
  };

  // Copy secret key helper
  const handleCopyKey = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("JBSWY3DPEHPK3PXP");
    }
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // 1-Click Auto-fill OTP for demo/testing convenience
  const handleAutoFillOtp = () => {
    audio.playSubtleClick();
    setAuthenticatorCode(expectedOtp);
    setOtpError("");
    authInputRef.current?.focus();
  };

  // Step 2: Verify Authenticator Code & Complete Portal Sign-In
  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = authenticatorCode.replace(/\D/g, "");

    if (enteredCode.length < 6) {
      audio.playWarningChime();
      setOtpError("Please enter the complete 6-digit authenticator code.");
      return;
    }

    if (enteredCode !== expectedOtp) {
      audio.playWarningChime();
      setOtpError("Invalid verification code. Enter 849201 or click Auto-fill.");
      return;
    }

    setIsVerifying(true);
    setOtpError("");

    setTimeout(() => {
      audio.playSuccessChime();
      const success = loginAs(email);

      if (success) {
        const foundUser = MOCK_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase().trim()
        );
        if (foundUser?.role === "READONLY_PROGRAMME_USER" || activeTab === "PROGRAMME") {
          router.push("/programme/stock");
        } else if (foundUser?.role === "NISSAN_JAPAN" || activeTab === "JAPAN") {
          router.push("/japan/inventory");
        } else if (foundUser?.role === "AUTOHUB_ADMIN" || activeTab === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dealer/stocks");
        }
      } else {
        setOtpError("Session authorization failed. Please try again.");
        setIsVerifying(false);
      }
    }, 450);
  };

  const getPortalButtonText = () => {
    if (activeTab === "DEALER") return "Continue to Dealer Portal";
    if (activeTab === "ADMIN") return "Continue to Admin Console";
    if (activeTab === "JAPAN") return "Continue to Japan Inventory";
    return "Continue to Programme View";
  };

  // Mask email for realistic privacy display (e.g. d***r@aucklandnissan.co.nz)
  const getMaskedEmail = () => {
    const parts = email.split("@");
    if (parts.length !== 2) return email;
    const user = parts[0];
    const domain = parts[1];
    if (user.length <= 2) return `${user}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* LEFT HALF: Minimal & Clean Dark Brand Canvas               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-1/2 bg-[#000000] flex flex-col justify-between p-6 sm:p-10 lg:p-16 overflow-hidden text-white border-b lg:border-b-0 lg:border-r border-[#27272A]">
        {/* Subtle background ambient glow */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-crimson-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Project Name & Programme Badge */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-24 h-24 flex items-center justify-center shrink-0">
            <img
              src="/nissan-logo.png"
              alt="Nissan Logo"
              className="w-20 h-20 object-contain drop-shadow-[0_2px_10px_rgba(255,255,255,0.25)]"
            />
          </div>
          <div>
            <h1 className="font-bold text-lg lg:text-2xl text-white">
              Nissan
            </h1>
          </div>
        </div>

        {/* Center: Clean & Minimal Hero (Short, Ultra-Premium Style) */}
        <div className="relative z-10 my-10 lg:my-0 space-y-4 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C3002F]" />
            <span className="font-medium">2FA · Bank-Grade Access Security</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-[1.12]">
            Direct Japan Stock.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C3002F] via-[#FB7185] to-[#FDA4AF]">
              Landed &amp; Protected.
            </span>
          </h2>
        </div>

        {/* Minimal Footer */}
        <div className="relative z-10 flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-white/10 font-sans">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span>Powered by</span>
            <strong className="text-slate-200 font-semibold tracking-wide">AutoHub</strong>
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* RIGHT HALF: Light Canvas Modern Sign-In Card               */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">

          {/* ═══════════════════════════════════════════════════════ */}
          {/* STAGE 1: CREDENTIALS (Email & Password)                 */}
          {/* ═══════════════════════════════════════════════════════ */}
          {authStep === "CREDENTIALS" ? (
            <>
              {/* Card Header */}
              <div className="space-y-1.5">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Sign in to Platform
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select your workspace and enter your registered credentials.
                </p>
              </div>

              {/* Role Toggle Tabs (4 Roles) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1 text-center">
                <button
                  type="button"
                  onClick={() => handleTabChange("DEALER")}
                  className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${activeTab === "DEALER"
                    ? "bg-white text-slate-900 shadow-soft font-bold"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <Car className={`w-3.5 h-3.5 shrink-0 ${activeTab === "DEALER" ? "text-[#C3002F]" : "text-slate-400"}`} />
                  <span className="truncate">Dealer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("ADMIN")}
                  className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${activeTab === "ADMIN"
                    ? "bg-white text-slate-900 shadow-soft font-bold"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <Shield className={`w-3.5 h-3.5 shrink-0 ${activeTab === "ADMIN" ? "text-[#C3002F]" : "text-slate-400"}`} />
                  <span className="truncate">Admin Ops</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("JAPAN")}
                  className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${activeTab === "JAPAN"
                    ? "bg-white text-slate-900 shadow-soft font-bold"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <Globe2 className={`w-3.5 h-3.5 shrink-0 ${activeTab === "JAPAN" ? "text-[#C3002F]" : "text-slate-400"}`} />
                  <span className="truncate">Japan HQ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange("PROGRAMME")}
                  className={`py-2 text-[11px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer truncate ${activeTab === "PROGRAMME"
                    ? "bg-white text-slate-900 shadow-soft font-bold"
                    : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  <FileText className={`w-3.5 h-3.5 shrink-0 ${activeTab === "PROGRAMME" ? "text-[#C3002F]" : "text-slate-400"}`} />
                  <span className="truncate">Programme</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-700 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">
                      {activeTab === "DEALER"
                        ? "Registered Dealer Email"
                        : activeTab === "ADMIN"
                          ? "Autohub Operations Email"
                          : activeTab === "JAPAN"
                            ? "Nissan Japan Email"
                            : "Programme Representative Email"}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        if (activeTab === "DEALER") setEmail("dealer@aucklandnissan.co.nz");
                        if (activeTab === "ADMIN") setEmail("ops@autohub.co.nz");
                        if (activeTab === "JAPAN") setEmail("kenji.sato@nissan.co.jp");
                        if (activeTab === "PROGRAMME") setEmail("marcus.vance@nissan.co.nz");
                      }}
                      className="text-[11px] font-semibold text-[#C3002F] hover:text-[#A10026] hover:underline cursor-pointer"
                    >
                      Auto-fill demo
                    </button>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@dealership.co.nz"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] transition-all shadow-soft"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => alert("Password reset link will be sent to the registered email.")}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] transition-all shadow-soft"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#0A0A0A] hover:bg-[#444444] text-white rounded-xl font-medium text-sm transition-all shadow-soft shadow-[#0A0A0A]/20 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{getPortalButtonText()}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Dealer Registration Action */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-center">
                <span className="text-xs text-slate-400 block font-medium">
                  New Nissan NZ Dealership or Franchisee?
                </span>
                <Link
                  href="/register"
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs active:scale-[0.99] group cursor-pointer"
                >
                  <span>Register Dealership Application</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C3002F] transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            </>
          ) : (
            /* ═══════════════════════════════════════════════════════ */
            /* STAGE 2: 2FA MFA / AUTHENTICATOR APP (Matching Ref)     */
            /* ═══════════════════════════════════════════════════════ */
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Header Title */}
              <div className="space-y-2.5">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1527] tracking-tight">
                  Protect your account
                </h2>

                {/* Email Pill with Change Action */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-500 stroke-[2.2]" />
                    <span className="font-medium text-slate-800">{email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        audio.playSubtleClick();
                        setAuthStep("CREDENTIALS");
                        setOtpError("");
                      }}
                      className="text-slate-500 hover:text-slate-900 underline underline-offset-2 ml-1 text-xs cursor-pointer font-medium"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Instruction */}
                <p className="text-sm text-slate-600 leading-snug">
                  Scan this QR code with an authenticator app, then enter its six-digit code.
                </p>
              </div>

              {/* QR Code Card */}
              <div className="w-56 h-56 sm:w-60 sm:h-60 mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex items-center justify-center">
                <svg
                  viewBox="0 0 29 29"
                  className="w-full h-full text-slate-950"
                  fill="currentColor"
                  shapeRendering="crispEdges"
                >
                  {/* Top-Left Finder Pattern */}
                  <path d="M0 0h7v7H0z M1 1v5h5V1z M2 2h3v3H2z" fillRule="evenodd" />
                  {/* Top-Right Finder Pattern */}
                  <path d="M22 0h7v7h-7z M23 1v5h5V1z M24 2h3v3h-3z" fillRule="evenodd" />
                  {/* Bottom-Left Finder Pattern */}
                  <path d="M0 22h7v7H0z M1 23v5h5v-5z M2 24h3v3H2z" fillRule="evenodd" />
                  {/* Alignment Pattern Bottom-Right */}
                  <path d="M20 20h5v5h-5z M21 21v3h3v-3z M22 22h1v1h-1z" fillRule="evenodd" />

                  {/* Timing Patterns */}
                  <path d="M8 6h1v1H8z M10 6h1v1h-1z M12 6h1v1h-1z M14 6h1v1h-1z M16 6h1v1h-1z M18 6h1v1h-1z M20 6h1v1h-1z" />
                  <path d="M6 8h1v1H6z M6 10h1v1H6z M6 12h1v1H6z M6 14h1v1H6z M6 16h1v1H6z M6 18h1v1H6z M6 20h1v1H6z" />

                  {/* High Density Data Matrix Dots (Matching authentic TOTP QR Codes) */}
                  {/* Top-middle zone */}
                  <rect x="8" y="0" width="1" height="2" />
                  <rect x="10" y="1" width="2" height="1" />
                  <rect x="13" y="0" width="1" height="3" />
                  <rect x="15" y="1" width="1" height="1" />
                  <rect x="17" y="0" width="2" height="1" />
                  <rect x="20" y="1" width="1" height="2" />
                  <rect x="8" y="3" width="2" height="1" />
                  <rect x="11" y="4" width="1" height="2" />
                  <rect x="14" y="3" width="2" height="2" />
                  <rect x="17" y="4" width="1" height="1" />
                  <rect x="19" y="3" width="2" height="1" />

                  {/* Center zone */}
                  <rect x="8" y="8" width="2" height="2" />
                  <rect x="11" y="7" width="1" height="1" />
                  <rect x="13" y="8" width="3" height="1" />
                  <rect x="17" y="8" width="2" height="1" />
                  <rect x="20" y="7" width="1" height="2" />
                  <rect x="23" y="8" width="2" height="1" />
                  <rect x="26" y="8" width="3" height="1" />

                  <rect x="8" y="11" width="1" height="2" />
                  <rect x="10" y="10" width="2" height="1" />
                  <rect x="13" y="10" width="1" height="3" />
                  <rect x="15" y="12" width="2" height="1" />
                  <rect x="18" y="10" width="1" height="2" />
                  <rect x="21" y="11" width="2" height="1" />
                  <rect x="24" y="10" width="1" height="2" />
                  <rect x="26" y="12" width="2" height="1" />

                  <rect x="0" y="8" width="1" height="3" />
                  <rect x="2" y="9" width="2" height="1" />
                  <rect x="4" y="11" width="1" height="2" />
                  <rect x="1" y="13" width="3" height="1" />
                  <rect x="3" y="15" width="2" height="2" />
                  <rect x="0" y="18" width="2" height="1" />
                  <rect x="4" y="18" width="2" height="2" />
                  <rect x="1" y="20" width="2" height="1" />

                  <rect x="8" y="14" width="3" height="1" />
                  <rect x="12" y="14" width="1" height="2" />
                  <rect x="14" y="15" width="2" height="1" />
                  <rect x="17" y="13" width="1" height="3" />
                  <rect x="19" y="15" width="2" height="1" />
                  <rect x="22" y="13" width="2" height="2" />
                  <rect x="25" y="15" width="1" height="2" />
                  <rect x="27" y="14" width="2" height="1" />

                  <rect x="7" y="17" width="2" height="1" />
                  <rect x="10" y="17" width="1" height="2" />
                  <rect x="12" y="18" width="3" height="1" />
                  <rect x="16" y="17" width="1" height="2" />
                  <rect x="18" y="18" width="1" height="1" />
                  <rect x="23" y="17" width="2" height="1" />
                  <rect x="26" y="18" width="2" height="2" />

                  {/* Bottom zone */}
                  <rect x="8" y="21" width="2" height="1" />
                  <rect x="11" y="20" width="1" height="3" />
                  <rect x="13" y="22" width="2" height="1" />
                  <rect x="16" y="21" width="2" height="2" />
                  <rect x="19" y="20" width="1" height="1" />
                  <rect x="26" y="21" width="3" height="1" />

                  <rect x="8" y="24" width="1" height="2" />
                  <rect x="10" y="25" width="3" height="1" />
                  <rect x="14" y="24" width="2" height="1" />
                  <rect x="17" y="25" width="2" height="2" />
                  <rect x="20" y="26" width="2" height="1" />
                  <rect x="23" y="26" width="3" height="1" />
                  <rect x="27" y="24" width="1" height="3" />

                  <rect x="8" y="27" width="3" height="2" />
                  <rect x="12" y="28" width="2" height="1" />
                  <rect x="15" y="27" width="1" height="2" />
                  <rect x="18" y="28" width="2" height="1" />
                  <rect x="22" y="28" width="3" height="1" />
                </svg>
              </div>

              {/* Red Toggle: Cannot scan the code? */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualKey(!showManualKey)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E53935] hover:text-[#C3002F] transition-colors cursor-pointer select-none"
                >
                  <span className="text-[10px] transform transition-transform">
                    {showManualKey ? "▼" : "▶"}
                  </span>
                  <span>Cannot scan the code?</span>
                </button>

                {showManualKey && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="text-slate-600 font-medium">
                      Enter this key manually into your authenticator app:
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-200">
                      <code className="font-mono font-bold text-slate-900 tracking-wider">
                        JBSW Y3DP EHPK 3PXP
                      </code>
                      <button
                        type="button"
                        onClick={handleCopyKey}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedKey ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500">
                        Passcode:{" "}
                        <strong className="font-mono text-slate-900">{expectedOtp}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={handleAutoFillOtp}
                        className="text-[11px] font-bold text-[#C3002F] hover:underline cursor-pointer"
                      >
                        Auto-fill demo code
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Authenticator Form */}
              <form onSubmit={handleOtpVerify} className="space-y-4 pt-1">
                {otpError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                    {otpError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="authenticatorCode"
                      className="block text-sm font-bold text-slate-900"
                    >
                      Authenticator code
                    </label>
                    {!showManualKey && (
                      <button
                        type="button"
                        onClick={handleAutoFillOtp}
                        className="text-[11px] font-medium text-slate-400 hover:text-[#C3002F] transition-colors cursor-pointer"
                      >
                        Auto-fill ({expectedOtp})
                      </button>
                    )}
                  </div>
                  <input
                    ref={authInputRef}
                    id="authenticatorCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={authenticatorCode}
                    onChange={(e) => {
                      setAuthenticatorCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                      if (otpError) setOtpError("");
                    }}
                    className="w-full h-12 px-4 bg-white text-slate-900 text-lg font-mono tracking-widest rounded-xl border border-slate-300 focus:outline-none focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/15 transition-all shadow-2xs"
                  />
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3.5 px-4 bg-[#0A0A0A] hover:bg-[#444444] active:bg-[#222222] text-white rounded-xl font-bold text-base transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verify and finish"
                  )}
                </button>
              </form>

              {/* Back to Email Sign In */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setAuthStep("CREDENTIALS");
                    setOtpError("");
                  }}
                  className="text-xs sm:text-sm font-medium text-[#4B6B94] hover:text-[#25426B] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  ← Back to Email Sign In
                </button>
              </div>
            </div>
          )}

          {/* Footer badge */}
          <div className="pt-2 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5 font-sans">
            <span>Powered by</span>
            <strong className="text-slate-700 font-semibold tracking-wide">AutoHub</strong>
          </div>
        </div>
      </div>

      {/* Registration & Terms Acceptance Modal */}
      <DealerRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSuccess={() => {
          setActiveTab("DEALER");
          setEmail("dealer@aucklandnissan.co.nz");
        }}
      />
    </div>
  );
}
