"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { audio } from "@/lib/sound";
import {
  Building2,
  Mail,
  Phone,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Lock,
  ChevronRight,
  HelpCircle,
  Sparkles,
  Download,
} from "lucide-react";

interface FormData {
  dealershipName: string;
  dealerCode: string;
  nzbn: string;
  region: string;
  physicalAddress: string;
  postalCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  acceptTerms: boolean;
  acceptCostBoundary: boolean;
}

const STEPS = [
  {
    id: 1,
    title: "Dealership & Authorized Buyer",
    subtitle: "Entity profile, Nissan dealer code & primary credentials",
    icon: Building2,
  },
  {
    id: 2,
    title: "Commercial Boundary & Terms",
    subtitle: "Terms of Trade & landed pricing policy",
    icon: FileText,
  },
  {
    id: 3,
    title: "Review & Submit",
    subtitle: "Final verification & Autohub authorization",
    icon: ShieldCheck,
  },
];

export interface NZLocation {
  city: string;
  island: "North Island" | "South Island";
  zoneId: "ZONE_1" | "ZONE_2" | "ZONE_3" | "ZONE_4" | "ZONE_5";
  zoneName: string;
  deliveryNotes: string;
}

export const NZ_LOCATIONS: NZLocation[] = [
  // Zone 1: Upper North Island
  {
    city: "Auckland",
    island: "North Island",
    zoneId: "ZONE_1",
    zoneName: "Zone 1 - Upper North Island",
    deliveryNotes: "Direct Auckland Port clearance (<24h metro delivery)",
  },
  {
    city: "Whangārei / Northland",
    island: "North Island",
    zoneId: "ZONE_1",
    zoneName: "Zone 1 - Upper North Island",
    deliveryNotes: "Northern linehaul via Auckland port hub",
  },
  // Zone 2: Central North Island
  {
    city: "Hamilton / Waikato",
    island: "North Island",
    zoneId: "ZONE_2",
    zoneName: "Zone 2 - Central North Island",
    deliveryNotes: "Central arterial highway carrier dispatch",
  },
  {
    city: "Tauranga / Bay of Plenty",
    island: "North Island",
    zoneId: "ZONE_2",
    zoneName: "Zone 2 - Central North Island",
    deliveryNotes: "Port of Tauranga or arterial linehaul link",
  },
  {
    city: "Rotorua / Taupō",
    island: "North Island",
    zoneId: "ZONE_2",
    zoneName: "Zone 2 - Central North Island",
    deliveryNotes: "Central plateau linehaul delivery depot",
  },
  // Zone 3: Lower North Island
  {
    city: "Wellington",
    island: "North Island",
    zoneId: "ZONE_3",
    zoneName: "Zone 3 - Lower North Island",
    deliveryNotes: "Capital metro direct delivery pass",
  },
  {
    city: "Palmerston North / Manawatū",
    island: "North Island",
    zoneId: "ZONE_3",
    zoneName: "Zone 3 - Lower North Island",
    deliveryNotes: "Lower North Island central logistics depot",
  },
  {
    city: "Napier / Hastings (Hawke's Bay)",
    island: "North Island",
    zoneId: "ZONE_3",
    zoneName: "Zone 3 - Lower North Island",
    deliveryNotes: "East Coast arterial carrier movement",
  },
  {
    city: "New Plymouth / Taranaki",
    island: "North Island",
    zoneId: "ZONE_3",
    zoneName: "Zone 3 - Lower North Island",
    deliveryNotes: "Western arterial linehaul delivery",
  },
  // Zone 4: Upper South Island
  {
    city: "Christchurch / Canterbury",
    island: "South Island",
    zoneId: "ZONE_4",
    zoneName: "Zone 4 - Upper South Island",
    deliveryNotes: "Lyttelton Port arrival or Cook Strait coastal carrier",
  },
  {
    city: "Nelson / Marlborough / Blenheim",
    island: "South Island",
    zoneId: "ZONE_4",
    zoneName: "Zone 4 - Upper South Island",
    deliveryNotes: "Cook Strait coastal ferry & regional linehaul",
  },
  // Zone 5: Lower South Island
  {
    city: "Dunedin / Otago",
    island: "South Island",
    zoneId: "ZONE_5",
    zoneName: "Zone 5 - Lower South Island",
    deliveryNotes: "Southern regional carrier depot delivery",
  },
  {
    city: "Queenstown / Central Otago",
    island: "South Island",
    zoneId: "ZONE_5",
    zoneName: "Zone 5 - Lower South Island",
    deliveryNotes: "Southern Lakes linehaul delivery route",
  },
  {
    city: "Invercargill / Southland",
    island: "South Island",
    zoneId: "ZONE_5",
    zoneName: "Zone 5 - Lower South Island",
    deliveryNotes: "Deep South linehaul depot dispatch",
  },
];

export default function DealerRegistrationWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState<FormData>({
    dealershipName: "",
    dealerCode: "",
    nzbn: "",
    region: "Auckland",
    physicalAddress: "",
    postalCode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    acceptTerms: false,
    acceptCostBoundary: false,
  });

  // Automatically find Island, Pricing Zone, and linehaul notes from selected city
  const selectedLocation =
    NZ_LOCATIONS.find(
      (loc) => loc.city.toLowerCase() === (formData.region || "").toLowerCase()
    ) || NZ_LOCATIONS[0];

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    // STEP 1: Dealership Entity + Authorized Contact Validation
    if (step === 1) {
      if (!formData.dealershipName.trim()) newErrors.dealershipName = "Legal / Trading Name is required";
      if (!formData.dealerCode.trim()) newErrors.dealerCode = "Nissan Dealer Code is required";
      if (!formData.physicalAddress.trim()) newErrors.physicalAddress = "Physical delivery address is required";

      if (!formData.contactName.trim()) newErrors.contactName = "Primary Contact Name is required";
      if (!formData.contactEmail.trim() || !formData.contactEmail.includes("@")) {
        newErrors.contactEmail = "Valid business email is required";
      }
      if (!formData.contactPhone.trim()) newErrors.contactPhone = "Direct phone number is required";
    }

    // STEP 2: Commercial Boundary & Terms
    if (step === 2) {
      if (!formData.acceptTerms || !formData.acceptCostBoundary) {
        newErrors.acceptTerms = "Terms of Trade and Commercial Cost Boundary must be accepted";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      audio.playSubtleClick();
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    audio.playSubtleClick();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepId: number) => {
    // Only allow clicking previous steps or current step
    if (stepId < currentStep) {
      audio.playSubtleClick();
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(1) && validateStep(2)) {
      audio.playSuccessChime();
      setIsSubmitted(true);
    }
  };

  const progressPercent = Math.round(((currentStep - 1) / (STEPS.length - 1)) * 100);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: Pinned Desktop Canvas (Fixed Height & Sticky)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <aside className="relative overflow-hidden w-full lg:w-[350px] xl:w-[380px] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-[#070D18] border-b lg:border-b-0 lg:border-r border-[#1B2A42] text-white flex flex-col justify-between p-6 sm:p-8 lg:p-8 shrink-0">
        {/* Subtle background ambient glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E11D48] via-[#BE123C] to-[#881337] flex items-center justify-center font-black text-lg text-white shadow-soft shadow-crimson-600/30 ring-1 ring-white/20">
              D
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block leading-tight">
                Nissan New Zealand
              </span>
              <h1 className="font-bold text-base text-white tracking-tight leading-tight">
                Dealer Onboarding
              </h1>
            </div>
          </div>

          {/* Micro Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">Franchise Application</span>
          </div>

          {/* Minimal Progress Bar */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Progress</span>
              <span className="font-mono text-rose-400 font-bold px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[11px]">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#E11D48] via-[#F43F5E] to-[#FB7185] transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.6)]"
                style={{ width: `${Math.max(progressPercent, 10)}%` }}
              />
            </div>
          </div>

          {/* Clean Step Indicators (Less text, clean executive styling) */}
          <nav aria-label="Registration Steps" className="space-y-1.5">
            {STEPS.map((step) => {
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id || isSubmitted;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep}
                  className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${
                    isActive
                      ? "bg-white/10 text-white shadow-xs border border-white/15 backdrop-blur-md font-bold"
                      : isPassed
                      ? "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                      : "text-slate-500 cursor-not-allowed opacity-40 border border-transparent"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      isActive
                        ? "bg-[#E11D48] text-white shadow-xs"
                        : isPassed
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isPassed && !isActive ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>

                  <span className="text-xs truncate flex-1">
                    {step.title}
                  </span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Help & Navigation */}
        <div className="relative z-10 pt-4 border-t border-white/10 space-y-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all w-full justify-center shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
          <div className="text-center text-[10px] text-slate-500 font-mono">
            256-bit Encrypted · Nissan NZ v2026.2
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* RIGHT SIDE: Step Form Cards (Clean & Simple Light Canvas)  */}
      {/* ─────────────────────────────────────────────────────────── */}
      <main className="relative flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto bg-gradient-to-br from-slate-50 via-[#F8FAFC] to-slate-100/60 min-h-screen">
        {/* Subtle background ambient glow */}
        <div className="pointer-events-none absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/30 rounded-full blur-3xl -z-0" />
        <div className="pointer-events-none absolute bottom-0 left-10 w-[400px] h-[400px] bg-slate-200/40 rounded-full blur-3xl -z-0" />

        <div className="relative z-10 max-w-2xl w-full mx-auto my-auto">
          {/* SUCCESS CONFIRMATION VIEW (US-01 / AC-01) */}
          {isSubmitted ? (
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-8 sm:p-12 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.06)] space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto text-emerald-600 shadow-[0_8px_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Application Successfully Logged</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Dealership Onboarding Received
                </h2>
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  Thank you, <strong className="text-slate-900">{formData.contactName}</strong>. Your franchise application for{" "}
                  <strong className="text-slate-900">{formData.dealershipName}</strong> (Code:{" "}
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">
                    {formData.dealerCode}
                  </code>
                  ) is now securely stored in the programme database.
                </p>
              </div>

              {/* Status Callout - AC-01 Acceptance */}
              <div className="bg-gradient-to-br from-amber-50/90 to-amber-50/40 border border-amber-200/80 rounded-2xl p-5 text-left text-xs text-amber-900 space-y-2 shadow-2xs">
                <div className="font-bold flex items-center gap-2 text-sm text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Current State: Blocked Pending Autohub Authorization (AC-01)</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  Under the Nissan Used Vehicle Programme security rules, stock catalogue visibility and price calculations remain blocked until an Autohub Administrator verifies your dealer code and assigns your <strong>Geographic Pricing Zone</strong>.
                </p>
                <div className="pt-1 text-[11px] text-amber-700">
                  You will receive an automated notification at <strong className="font-mono">{formData.contactEmail}</strong> once approved.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    audio.playSubtleClick();
                    router.push("/");
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white text-xs font-bold transition-all shadow-[0_4px_18px_rgba(225,29,72,0.35)] hover:shadow-[0_6px_22px_rgba(225,29,72,0.45)] cursor-pointer active:scale-[0.99]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Sign In Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audio.playSuccessChime();
                    alert("Application PDF receipt generated with UTC timestamp and terms hash.");
                  }}
                  className="w-full sm:w-auto btn-outline text-xs py-3 px-6"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Application Copy</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-7 sm:p-10 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.06),0_1px_3px_rgba(0,0,0,0.02)]">
              {/* Step Header */}
              <div className="mb-8 pb-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200/80 text-[10px] font-bold uppercase tracking-wider text-[#E11D48]">
                    Step {currentStep} of {STEPS.length}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
                    {STEPS[currentStep - 1].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {STEPS[currentStep - 1].subtitle}
                  </p>
                </div>
              </div>

              {/* ────────────────────────────────────────────── */}
              {/* STEP 1: Dealership & Authorized Buyer          */}
              {/* ────────────────────────────────────────────── */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Subsection A: Dealership Entity */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/80 text-[#E11D48] border border-rose-200/70 flex items-center justify-center shadow-xs">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Dealership Legal Entity &amp; Facility
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Trading name, official dealer code and delivery yard location
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Legal / Trading Dealership Name *
                      </label>
                      <div className="relative group">
                        <Building2 className="w-4 h-4 text-slate-400 group-focus-within:text-[#E11D48] absolute left-3.5 top-3 transition-colors" />
                        <input
                          type="text"
                          value={formData.dealershipName}
                          onChange={(e) => updateField("dealershipName", e.target.value)}
                          placeholder="e.g. Auckland Nissan City Ltd"
                          className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.dealershipName
                              ? "border-crimson-500 ring-2 ring-crimson-500/20 bg-rose-50/20"
                              : "border-slate-200/90 hover:border-slate-300"
                            } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all shadow-xs`}
                        />
                      </div>
                      {errors.dealershipName && (
                        <p className="text-[11px] text-crimson-600">{errors.dealershipName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Nissan Dealer Code *
                        </label>
                        <input
                          type="text"
                          value={formData.dealerCode}
                          onChange={(e) => updateField("dealerCode", e.target.value.toUpperCase())}
                          placeholder="e.g. NZ-NIS-AKL04"
                          className={`w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.dealerCode
                              ? "border-crimson-500 ring-2 ring-crimson-500/20 bg-rose-50/20"
                              : "border-slate-200/90 hover:border-slate-300"
                            } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all shadow-xs`}
                        />
                        {errors.dealerCode && (
                          <p className="text-[11px] text-crimson-600">{errors.dealerCode}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          NZBN (NZ Business Number)
                        </label>
                        <input
                          type="text"
                          value={formData.nzbn}
                          onChange={(e) => updateField("nzbn", e.target.value)}
                          placeholder="942903829..."
                          className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Geographic Region / Island *
                        </label>
                        <select
                          value={formData.region}
                          onChange={(e) => updateField("region", e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 text-slate-900 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all cursor-pointer shadow-xs"
                        >
                          {NZ_LOCATIONS.map((loc) => (
                            <option key={loc.city} value={loc.city}>
                              {loc.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Postal Code</label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => updateField("postalCode", e.target.value)}
                          placeholder="e.g. 1051"
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Dealership Physical Delivery Address *
                      </label>
                      <div className="relative group">
                        <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-[#E11D48] absolute left-3.5 top-3 transition-colors" />
                        <input
                          type="text"
                          value={formData.physicalAddress}
                          onChange={(e) => updateField("physicalAddress", e.target.value)}
                          placeholder="Street address where vehicles will be delivered"
                          className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.physicalAddress
                              ? "border-crimson-500 ring-2 ring-crimson-500/20 bg-rose-50/20"
                              : "border-slate-200/90 hover:border-slate-300"
                            } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all shadow-xs`}
                        />
                      </div>
                      {errors.physicalAddress && (
                        <p className="text-[11px] text-crimson-600">{errors.physicalAddress}</p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        Standard pricing includes two NZ domestic carrier delivery movements to this address.
                      </p>
                    </div>
                  </div>

                  {/* Subsection B: Primary Authorized Buyer */}
                  <div className="space-y-4 pt-5 border-t border-slate-200/80">
                    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/80 text-blue-600 border border-blue-200/70 flex items-center justify-center shadow-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Primary Authorized Buyer &amp; Portal Credentials
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Designated Buyer / Principal authorized to place 24-hour atomic vehicle holds
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Primary Contact Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) => updateField("contactName", e.target.value)}
                        placeholder="e.g. Jason Bell"
                        className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactName
                            ? "border-crimson-500 ring-2 ring-crimson-500/20 bg-rose-50/20"
                            : "border-slate-200/90 hover:border-slate-300"
                          } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all shadow-xs`}
                      />
                      {errors.contactName && (
                        <p className="text-[11px] text-crimson-600">{errors.contactName}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Business Email *
                        </label>
                        <div className="relative group">
                          <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-[#E11D48] absolute left-3.5 top-3 transition-colors" />
                          <input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => updateField("contactEmail", e.target.value)}
                            placeholder="jason@dealership.co.nz"
                            className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactEmail
                                ? "border-crimson-500 ring-2 ring-crimson-500/20 bg-rose-50/20"
                                : "border-slate-200/90 hover:border-slate-300"
                              } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all shadow-xs`}
                          />
                        </div>
                        {errors.contactEmail && (
                          <p className="text-[11px] text-crimson-600">{errors.contactEmail}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Direct Phone / Mobile *
                        </label>
                        <div className="relative group">
                          <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-[#E11D48] absolute left-3.5 top-3 transition-colors" />
                          <input
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => updateField("contactPhone", e.target.value)}
                            placeholder="+64 21 000 0000"
                            className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactPhone
                                ? "border-crimson-500 ring-2 ring-crimson-500/20 bg-rose-50/20"
                                : "border-slate-200/90 hover:border-slate-300"
                              } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-[#E11D48] transition-all shadow-xs`}
                          />
                        </div>
                        {errors.contactPhone && (
                          <p className="text-[11px] text-crimson-600">{errors.contactPhone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────── */}
              {/* STEP 2: Commercial Boundary & Terms (US-02)    */}
              {/* ────────────────────────────────────────────── */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Single Unified Commercial Boundary Container with scroll-y */}
                  <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-xs">
                    {/* Header */}
                    <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-100/70 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-200/60 flex items-center justify-center text-[#E11D48]">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <span>Dealer-Visible Commercial Boundary</span>
                      </span>
                      <span className="font-mono text-[10px] font-semibold bg-white px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 shadow-2xs">
                        v2026.1 Official Policy
                      </span>
                    </div>

                    {/* Scrollable Single Card Body */}
                    <div className="max-h-[300px] overflow-y-auto p-5 space-y-4 text-xs divide-y divide-slate-100">
                      {/* Section 1: Included in Guaranteed Total Buy Price */}
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                          <div className="w-5 h-5 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                            ✓
                          </div>
                          <span>Included in Total Buy Price (Guaranteed Fixed Landed):</span>
                        </div>
                        <ul className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 pt-1">
                          <li className="flex items-start gap-2 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors p-2.5 rounded-xl border border-emerald-100/80">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>Vehicle FOB acquisition cost (Japan JPY to NZD)</span>
                          </li>
                          <li className="flex items-start gap-2 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors p-2.5 rounded-xl border border-emerald-100/80">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>Standard door-to-door RoRo ocean freight &amp; marine cover</span>
                          </li>
                          <li className="flex items-start gap-2 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors p-2.5 rounded-xl border border-emerald-100/80">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>NZ Customs border processing, tariffs &amp; 15% NZ GST</span>
                          </li>
                          <li className="flex items-start gap-2 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors p-2.5 rounded-xl border border-emerald-100/80">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>Standard entry compliance pass (MR2A &amp; 1-year WoF)</span>
                          </li>
                          <li className="flex items-start gap-2 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors p-2.5 rounded-xl border border-emerald-100/80">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>Two standard domestic delivery carrier movements</span>
                          </li>
                          <li className="flex items-start gap-2 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors p-2.5 rounded-xl border border-emerald-100/80">
                            <span className="text-emerald-600 font-bold shrink-0">✓</span>
                            <span>Nissan NZ certified programme component fee</span>
                          </li>
                        </ul>
                      </div>

                      {/* Section 2: Potential Additional Costs */}
                      <div className="space-y-2.5 pt-3.5">
                        <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                          <div className="w-5 h-5 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center text-[10px] font-black">
                            !
                          </div>
                          <span>Potential Additional Costs (Requires Prior Dealership Approval):</span>
                        </div>
                        <ul className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 pt-1">
                          <li className="flex items-start gap-2 bg-amber-50/40 hover:bg-amber-50/70 transition-colors p-2.5 rounded-xl border border-amber-100/80">
                            <span className="text-amber-600 font-bold shrink-0">•</span>
                            <span>Non-standard structural or mechanical compliance repairs</span>
                          </li>
                          <li className="flex items-start gap-2 bg-amber-50/40 hover:bg-amber-50/70 transition-colors p-2.5 rounded-xl border border-amber-100/80">
                            <span className="text-amber-600 font-bold shrink-0">•</span>
                            <span>LVVTA repair certification or engineering evidence</span>
                          </li>
                          <li className="flex items-start gap-2 bg-amber-50/40 hover:bg-amber-50/70 transition-colors p-2.5 rounded-xl border border-amber-100/80">
                            <span className="text-amber-600 font-bold shrink-0">•</span>
                            <span>Replacement parts &amp; labour beyond standard MR2A inspection</span>
                          </li>
                          <li className="flex items-start gap-2 bg-amber-50/40 hover:bg-amber-50/70 transition-colors p-2.5 rounded-xl border border-amber-100/80">
                            <span className="text-amber-600 font-bold shrink-0">•</span>
                            <span>MPI border biosecurity flag &amp; decontamination treatment</span>
                          </li>
                          <li className="flex items-start gap-2 bg-amber-50/40 hover:bg-amber-50/70 transition-colors p-2.5 rounded-xl border border-amber-100/80">
                            <span className="text-amber-600 font-bold shrink-0">•</span>
                            <span>Non-standard demurrage storage or regional re-delivery</span>
                          </li>
                          <li className="flex items-start gap-2 bg-amber-50/40 hover:bg-amber-50/70 transition-colors p-2.5 rounded-xl border border-amber-100/80">
                            <span className="text-amber-600 font-bold shrink-0">•</span>
                            <span>Dealer-requested accessories, towbars, tinting or grooming</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Notice Footer */}
                    <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-200/80 text-[11px] text-slate-500 italic">
                      Notice: Fixed pricing assumes a standard compliance pass. Any separately chargeable work will be identified, photographed, and evidenced prior to work execution.
                    </div>
                  </div>

                  {/* Single Line Mandatory Agreement Checkbox */}
                  <div className="space-y-1.5 pt-1">
                    <label
                      className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${formData.acceptTerms && formData.acceptCostBoundary
                          ? "bg-gradient-to-r from-emerald-50/60 to-emerald-50/20 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                          : errors.acceptTerms || errors.acceptCostBoundary
                            ? "bg-rose-50/40 border-rose-300 ring-2 ring-rose-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms && formData.acceptCostBoundary}
                        onChange={(e) => {
                          updateField("acceptTerms", e.target.checked);
                          updateField("acceptCostBoundary", e.target.checked);
                        }}
                        className="w-4 h-4 rounded text-[#E11D48] focus:ring-rose-500 border-slate-300 shrink-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-700 leading-snug">
                        I accept the <strong className="text-slate-900 font-bold">Nissan NZ Terms of Trade (v2026.1)</strong> and acknowledge the <strong className="text-slate-900 font-bold">Commercial Cost Boundary</strong>. *
                      </span>
                    </label>

                    {(errors.acceptTerms || errors.acceptCostBoundary) && (
                      <p className="text-[11px] text-rose-600 font-medium">
                        {errors.acceptTerms || errors.acceptCostBoundary}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────── */}
              {/* STEP 3: Review & Final Submission              */}
              {/* ────────────────────────────────────────────── */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                      <span className="font-bold text-slate-900 tracking-tight">1. Dealership Entity</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-[#E11D48] hover:text-[#BE123C] font-semibold cursor-pointer hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Dealership:</span>
                        <strong className="text-slate-900 font-semibold">{formData.dealershipName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Dealer Code:</span>
                        <strong className="text-slate-900 font-mono font-bold">{formData.dealerCode}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Location &amp; Pricing Profile:</span>
                        <span className="text-slate-900 font-medium">
                          {formData.region} · {selectedLocation.island} (<strong className="text-[#E11D48] font-mono">{selectedLocation.zoneId}</strong>)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Physical Address:</span>
                        <span className="text-slate-900 truncate block">{formData.physicalAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                      <span className="font-bold text-slate-900 tracking-tight">2. Primary Authorized Contact</span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-[#E11D48] hover:text-[#BE123C] font-semibold cursor-pointer hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Contact Name:</span>
                        <strong className="text-slate-900 font-semibold">{formData.contactName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Business Email:</span>
                        <strong className="text-slate-900 font-mono">{formData.contactEmail}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Direct Phone:</span>
                        <span className="text-slate-900 font-mono">{formData.contactPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-emerald-50/20 border border-emerald-200/80 text-xs space-y-2 text-emerald-900 shadow-2xs">
                    <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/60">
                      <div className="font-bold flex items-center gap-2 text-emerald-950">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>3. Commercial Boundary &amp; Terms Confirmed</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs text-[#E11D48] hover:text-[#BE123C] font-semibold cursor-pointer hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      Both Terms of Trade (v2026.1) and Additional-Cost Boundary acknowledgements have been evidenced and will be archived with an immutable UTC audit event upon submission.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Controls Footer */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous Step</span>
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cancel Application</span>
                  </Link>
                )}

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white text-xs font-semibold transition-all shadow-[0_4px_18px_rgba(225,29,72,0.35)] hover:shadow-[0_6px_22px_rgba(225,29,72,0.45)] active:scale-[0.99] group cursor-pointer"
                  >
                    <span>Continue to Step {currentStep + 1}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-[#E11D48] via-[#BE123C] to-[#9F1239] hover:from-[#BE123C] hover:to-[#881337] text-white text-xs font-semibold transition-all shadow-[0_4px_18px_rgba(225,29,72,0.35)] hover:shadow-[0_6px_22px_rgba(225,29,72,0.45)] active:scale-[0.99] cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit Dealership Application</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

