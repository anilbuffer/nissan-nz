"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Check,
  X,
  User,
  Car,
  Shield,
  Globe2,
  FileText,
} from "lucide-react";
import { MOCK_USERS } from "@/lib/mock-data";
import { audio } from "@/lib/sound";

export type ForgotPasswordStep = "EMAIL_REQUEST" | "VERIFY_OTP" | "NEW_PASSWORD" | "SUCCESS";

interface ForgotPasswordFlowProps {
  initialEmail?: string;
  onBackToLogin: (newPassword?: string, updatedEmail?: string) => void;
  onDirectLogin?: (email: string) => void;
}

const DEMO_RESET_CODE = "519403";

export default function ForgotPasswordFlow({
  initialEmail = "dealer@aucklandnissan.co.nz",
  onBackToLogin,
  onDirectLogin,
}: ForgotPasswordFlowProps) {
  // Step State
  const [currentStep, setCurrentStep] = useState<ForgotPasswordStep>("EMAIL_REQUEST");

  // Step 1: Email Request State
  const [resetEmail, setResetEmail] = useState(initialEmail || "dealer@aucklandnissan.co.nz");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Step 2: OTP Verification State
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(45);
  const [resendSuccessNotice, setResendSuccessNotice] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Step 3: New Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Auto-focus OTP input on Step 2
  useEffect(() => {
    if (currentStep === "VERIFY_OTP") {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === "VERIFY_OTP" && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendCountdown]);

  // Masked email for display (e.g. d***r@aucklandnissan.co.nz)
  const maskedEmail = useMemo(() => {
    const parts = resetEmail.trim().split("@");
    if (parts.length !== 2) return resetEmail;
    const name = parts[0];
    const domain = parts[1];
    if (name.length <= 2) return `${name}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }, [resetEmail]);

  // Matched User in mock data (if any)
  const matchedUser = useMemo(() => {
    return MOCK_USERS.find(
      (u) => u.email.toLowerCase() === resetEmail.trim().toLowerCase()
    );
  }, [resetEmail]);

  // Password validation criteria
  const passwordCriteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };
  }, [newPassword]);

  // Password strength score (0 to 4)
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
    if (strengthScore <= 1) return { text: "Weak", color: "bg-rose-500", textColor: "text-rose-600" };
    if (strengthScore === 2) return { text: "Fair", color: "bg-amber-500", textColor: "text-amber-600" };
    if (strengthScore === 3) return { text: "Good", color: "bg-blue-500", textColor: "text-blue-600" };
    return { text: "Strong", color: "bg-emerald-500", textColor: "text-emerald-600" };
  }, [strengthScore]);

  const allCriteriaMet =
    passwordCriteria.minLength &&
    passwordCriteria.hasUpper &&
    passwordCriteria.hasLower &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSpecial;

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // ───────────────────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────────────────

  // STEP 1: Submit Email for Verification Code
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    const trimmed = resetEmail.trim();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      audio.playWarningChime();
      setEmailError("Please enter a valid business email address.");
      return;
    }

    setIsSendingCode(true);

    setTimeout(() => {
      audio.playSoftChime();
      setIsSendingCode(false);
      setOtpCode("");
      setOtpError("");
      setResendCountdown(45);
      setResendSuccessNotice(false);
      setCurrentStep("VERIFY_OTP");
    }, 450);
  };

  // STEP 2: Auto-fill Demo OTP
  const handleAutoFillOtp = () => {
    audio.playSubtleClick();
    setOtpCode(DEMO_RESET_CODE);
    setOtpError("");
    otpInputRef.current?.focus();
  };

  // STEP 2: Resend Code
  const handleResendCode = () => {
    if (resendCountdown > 0) return;
    audio.playSoftChime();
    setResendCountdown(45);
    setResendSuccessNotice(true);
    setOtpError("");
    setTimeout(() => setResendSuccessNotice(false), 4000);
  };

  // STEP 2: Verify OTP Code
  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpCode.replace(/\D/g, "");

    if (entered.length < 6) {
      audio.playWarningChime();
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (entered !== DEMO_RESET_CODE) {
      audio.playWarningChime();
      setOtpError(`Invalid code. Enter demo code ${DEMO_RESET_CODE} or click Auto-fill.`);
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    setTimeout(() => {
      audio.playSubtleClick();
      setIsVerifyingOtp(false);
      setCurrentStep("NEW_PASSWORD");
    }, 400);
  };

  // STEP 3: Reset Password
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!allCriteriaMet) {
      audio.playWarningChime();
      setPasswordError("Please satisfy all password security requirements.");
      return;
    }

    if (!passwordsMatch) {
      audio.playWarningChime();
      setPasswordError("Password confirmation does not match.");
      return;
    }

    setIsResettingPassword(true);

    setTimeout(() => {
      // Store in localStorage for session persistence
      try {
        localStorage.setItem(`autohub_user_pwd_${resetEmail.toLowerCase().trim()}`, newPassword);
      } catch (err) {
        // Safe ignore
      }

      audio.playSuccessChime();
      setIsResettingPassword(false);
      setCurrentStep("SUCCESS");
    }, 550);
  };

  // Preset role quick-select
  const handleSelectPresetEmail = (email: string) => {
    audio.playSubtleClick();
    setResetEmail(email);
    setEmailError("");
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* STEPPER HEADER                                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Back Link & Security Badge */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              audio.playSubtleClick();
              onBackToLogin();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Sign In</span>
          </button>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            <KeyRound className="w-3 h-3 text-[#C3002F]" />
            <span>Password Recovery</span>
          </span>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <div
            className={`h-1.5 rounded-full transition-all ${currentStep === "EMAIL_REQUEST"
                ? "bg-[#C3002F]"
                : "bg-emerald-600"
              }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${currentStep === "EMAIL_REQUEST"
                ? "bg-slate-200"
                : currentStep === "VERIFY_OTP"
                  ? "bg-[#C3002F]"
                  : "bg-emerald-600"
              }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${currentStep === "EMAIL_REQUEST" || currentStep === "VERIFY_OTP"
                ? "bg-slate-200"
                : currentStep === "NEW_PASSWORD"
                  ? "bg-[#C3002F]"
                  : "bg-emerald-600"
              }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all ${currentStep === "SUCCESS" ? "bg-emerald-600" : "bg-slate-200"
              }`}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 1: ENTER EMAIL / ACCOUNT IDENTIFICATION               */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentStep === "EMAIL_REQUEST" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Reset your password
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Enter your verified Nissan NZ account email. We will send a secure 6-digit verification code to authenticate your request.
            </p>
          </div>

          {/* Quick preset account chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Select Authorized Profile
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleSelectPresetEmail("dealer@aucklandnissan.co.nz")}
                className={`p-2 text-left rounded-xl border text-xs transition-all flex items-center gap-2 cursor-pointer ${resetEmail === "dealer@aucklandnissan.co.nz"
                    ? "border-[#C3002F] bg-crimson-50/40 text-slate-900 font-semibold"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
              >
                <Car className="w-3.5 h-3.5 text-[#C3002F] shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[11px] truncate">Dealer Principal</div>
                  <div className="text-[10px] text-slate-400 truncate">Auckland Nissan</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresetEmail("ops@autohub.co.nz")}
                className={`p-2 text-left rounded-xl border text-xs transition-all flex items-center gap-2 cursor-pointer ${resetEmail === "ops@autohub.co.nz"
                    ? "border-[#C3002F] bg-crimson-50/40 text-slate-900 font-semibold"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
              >
                <Shield className="w-3.5 h-3.5 text-[#C3002F] shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[11px] truncate">Admin Operations</div>
                  <div className="text-[10px] text-slate-400 truncate">AutoHub NZ</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresetEmail("kenji.sato@nissan.co.jp")}
                className={`p-2 text-left rounded-xl border text-xs transition-all flex items-center gap-2 cursor-pointer ${resetEmail === "kenji.sato@nissan.co.jp"
                    ? "border-[#C3002F] bg-crimson-50/40 text-slate-900 font-semibold"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
              >
                <Globe2 className="w-3.5 h-3.5 text-[#C3002F] shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[11px] truncate">Nissan Japan HQ</div>
                  <div className="text-[10px] text-slate-400 truncate">Yokohama Export</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPresetEmail("cameron.scott@nissan.co.nz")}
                className={`p-2 text-left rounded-xl border text-xs transition-all flex items-center gap-2 cursor-pointer ${resetEmail === "cameron.scott@nissan.co.nz"
                    ? "border-[#C3002F] bg-crimson-50/40 text-slate-900 font-semibold"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#C3002F] shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-[11px] truncate">Programme User</div>
                  <div className="text-[10px] text-slate-400 truncate">Nissan NZ Corporate</div>
                </div>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {emailError && (
              <div className="p-3 rounded-xl bg-crimson-50 border border-crimson-200 text-crimson-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#C3002F]" />
                <span>{emailError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">
                Corporate Account Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  placeholder="name@nissan.co.nz"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] transition-all shadow-soft"
                />
              </div>

              {/* Verified badge if recognized */}
              {matchedUser && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Verified account: {matchedUser.name} ({matchedUser.dealershipName || matchedUser.title})
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSendingCode}
              className="w-full py-3 px-4 bg-[#0A0A0A] hover:bg-[#27272A] text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-soft flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isSendingCode ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 2: ENTER VERIFICATION CODE (OTP)                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentStep === "VERIFY_OTP" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-250">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Verify your security code
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              We sent a 6-digit one-time passcode to your email. Enter the code below to proceed.
            </p>

            {/* Masked Email Pill with Change Action */}
            <div className="pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono font-medium text-slate-900">{maskedEmail}</span>
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    setCurrentStep("EMAIL_REQUEST");
                  }}
                  className="text-[#C3002F] hover:underline font-semibold ml-1 cursor-pointer"
                >
                  Change
                </button>
              </div>
            </div>
          </div>

          {/* Demo helper card */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C3002F]" />
                <span>One-Time Passcode Dispatch</span>
              </span>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="text-[11px] font-bold text-[#C3002F] hover:text-[#A10026] hover:underline cursor-pointer"
              >
                Auto-fill ({DEMO_RESET_CODE})
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              For testing convenience, use code <strong className="font-mono text-slate-900">{DEMO_RESET_CODE}</strong> or click Auto-fill above.
            </p>
          </div>

          {resendSuccessNotice && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>A new verification code has been dispatched to {resetEmail}.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            {otpError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">
                6-Digit Security Code
              </label>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  if (otpError) setOtpError("");
                }}
                placeholder="000000"
                className="w-full h-12 px-4 bg-white text-slate-900 text-xl font-mono tracking-widest text-center rounded-xl border border-slate-300 focus:outline-none focus:border-[#C3002F] focus:ring-2 focus:ring-[#C3002F]/15 transition-all placeholder-slate-300"
              />
            </div>

            {/* Resend Link */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Didn&apos;t receive code?</span>
              {resendCountdown > 0 ? (
                <span className="font-medium text-slate-400">
                  Resend available in {resendCountdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="font-semibold text-[#C3002F] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifyingOtp}
              className="w-full py-3 px-4 bg-[#0A0A0A] hover:bg-[#27272A] text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-soft flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isVerifyingOtp ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Verify Code &amp; Continue</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 3: CREATE NEW PASSWORD                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentStep === "NEW_PASSWORD" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-250">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Create new password
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Choose a strong password with at least 8 characters for <strong className="text-slate-800">{resetEmail}</strong>.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            {passwordError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {/* Field 1: New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] transition-all shadow-soft"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Password Strength:</span>
                    <span className={`font-semibold ${strengthLabel.textColor}`}>{strengthLabel.text}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${strengthScore >= 1 ? strengthLabel.color : "bg-transparent"}`} />
                    <div className={`h-full transition-all ${strengthScore >= 2 ? strengthLabel.color : "bg-transparent"}`} />
                    <div className={`h-full transition-all ${strengthScore >= 3 ? strengthLabel.color : "bg-transparent"}`} />
                    <div className={`h-full transition-all ${strengthScore >= 4 ? strengthLabel.color : "bg-transparent"}`} />
                  </div>
                </div>
              )}
            </div>

            {/* Field 2: Confirm Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">Confirm New Password</label>
                {confirmPassword && (
                  <span
                    className={`text-[11px] font-semibold flex items-center gap-1 ${passwordsMatch ? "text-emerald-600" : "text-rose-600"
                      }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>Mismatch</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C3002F]/20 focus:border-[#C3002F] transition-all shadow-soft"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Interactive Requirements Checklist */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 block">Password Requirements:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                >
                  {passwordCriteria.minLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span>At least 8 characters</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper && passwordCriteria.hasLower
                      ? "text-emerald-700 font-medium"
                      : "text-slate-500"
                    }`}
                >
                  {passwordCriteria.hasUpper && passwordCriteria.hasLower ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span>Upper &amp; lowercase letters</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                >
                  {passwordCriteria.hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span>At least one number (0-9)</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                >
                  {passwordCriteria.hasSpecial ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                  )}
                  <span>Special character (!@#$...)</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isResettingPassword || !allCriteriaMet || !passwordsMatch}
              className="w-full py-3 px-4 bg-[#0A0A0A] hover:bg-[#27272A] text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-soft flex items-center justify-center gap-2 group cursor-pointer active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResettingPassword ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Save New Password</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STEP 4: SUCCESS CONFIRMATION                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {currentStep === "SUCCESS" && (
        <div className="space-y-6 text-center animate-in zoom-in-95 duration-300 py-2">
          {/* Animated Success Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center shadow-soft">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Password Reset Complete!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Your password has been securely updated. You can now use your new credentials to sign into the Nissan NZ Platform.
            </p>
          </div>

          {/* Account Snapshot Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 text-left space-y-2">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-400">Account</span>
              <span className="font-semibold text-slate-900 font-mono">{resetEmail}</span>
            </div>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
              <span className="text-slate-400">Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified &amp; Protected</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Security Shield</span>
              <span className="text-slate-600 font-medium">AutoHub 2FA Active</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                audio.playSubtleClick();
                onBackToLogin(newPassword, resetEmail);
              }}
              className="w-full py-3.5 px-4 bg-[#0A0A0A] hover:bg-[#27272A] text-white rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-soft flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onDirectLogin && (
              <button
                type="button"
                onClick={() => {
                  audio.playSuccessChime();
                  onDirectLogin(resetEmail);
                }}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>Direct Access to Dashboard</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

