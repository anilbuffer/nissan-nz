"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { audio } from "@/lib/sound";
import { useProgramme } from "@/lib/programme-context";
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
  Globe,
  Briefcase,
  Check,
} from "lucide-react";

// Registration Categories
export type RegistrationCategory = "DEALER_NZ" | "JAPAN_HQ" | "PROGRAMME_USER";

// Category 1: NZ Dealer Form Data
interface DealerFormData {
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

// Category 2: Japan HQ Form Data
interface JapanHQFormData {
  facilityName: string;
  facilityCode: string;
  corporateNumber: string;
  yardPort: string;
  physicalAddress: string;
  postalCode: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  acceptTerms: boolean;
  acceptCostBoundary: boolean;
}

// Category 3: Programme / Other User Form Data (exact fields from user specification)
interface ProgrammeUserFormData {
  fullName: string;
  organisation: string;
  department: string;
  jobTitle: string;
  businessEmail: string;
  contactNumber: string;
  requestedRole: "READONLY_PROGRAMME_USER";
  accessJustification: string;
  acceptCompliance: boolean;
}

// Steps definitions
const DEALER_NZ_STEPS = [
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

const JAPAN_HQ_STEPS = [
  {
    id: 1,
    title: "Japan HQ & Marshalling Facility",
    subtitle: "Japan facility profile, facility code & lead coordinator",
    icon: Globe,
  },
  {
    id: 2,
    title: "Export Protocol & Terms",
    subtitle: "Pre-export inspection, FOB policy & freight booking",
    icon: FileText,
  },
  {
    id: 3,
    title: "Review & Submit",
    subtitle: "Final verification & export desk authorization",
    icon: ShieldCheck,
  },
];

const PROGRAMME_USER_STEPS = [
  {
    id: 1,
    title: "Step 1 – User information",
    subtitle: "Individual profile, organisation & direct contact details",
    icon: User,
  },
  {
    id: 2,
    title: "Step 2 – Programme Role & Scope",
    subtitle: "Access level, operational scope & governance terms",
    icon: ShieldCheck,
  },
  {
    id: 3,
    title: "Step 3 – Review & Submit",
    subtitle: "Information summary & application submission",
    icon: CheckCircle2,
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

export const JAPAN_PORTS = [
  "Yokohama Port (Kanagawa)",
  "Kobe Port (Hyogo)",
  "Nagoya Port (Aichi)",
  "Osaka Port (Kansai)",
  "Hakata / Moji Port (Fukuoka)",
];

export default function DealerRegistrationWizard() {
  const router = useRouter();
  const { registerDealerApplication, addUser } = useProgramme();

  // Active Category State
  const [category, setCategory] = useState<RegistrationCategory>("DEALER_NZ");
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Category 1: NZ Dealer Form Data
  const [dealerData, setDealerData] = useState<DealerFormData>({
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

  // Category 2: Japan HQ Form Data
  const [japanData, setJapanData] = useState<JapanHQFormData>({
    facilityName: "",
    facilityCode: "",
    corporateNumber: "",
    yardPort: "Yokohama Port (Kanagawa)",
    physicalAddress: "",
    postalCode: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    acceptTerms: false,
    acceptCostBoundary: false,
  });

  // Category 3: Programme User Form Data
  const [programmeData, setProgrammeData] = useState<ProgrammeUserFormData>({
    fullName: "",
    organisation: "",
    department: "",
    jobTitle: "",
    businessEmail: "",
    contactNumber: "",
    requestedRole: "READONLY_PROGRAMME_USER",
    accessJustification: "",
    acceptCompliance: false,
  });

  // Helper for active steps
  const activeSteps =
    category === "DEALER_NZ"
      ? DEALER_NZ_STEPS
      : category === "JAPAN_HQ"
        ? JAPAN_HQ_STEPS
        : PROGRAMME_USER_STEPS;

  // Selected NZ Location
  const selectedLocation =
    NZ_LOCATIONS.find(
      (loc) => loc.city.toLowerCase() === (dealerData.region || "").toLowerCase()
    ) || NZ_LOCATIONS[0];

  // Category switch handler
  const handleCategoryChange = (newCat: RegistrationCategory) => {
    audio.playSubtleClick();
    setCategory(newCat);
    setCurrentStep(1);
    setErrors({});
    setIsSubmitted(false);
  };

  // Updaters
  const updateDealerField = (field: keyof DealerFormData, value: DealerFormData[keyof DealerFormData]) => {
    setDealerData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateJapanField = (field: keyof JapanHQFormData, value: JapanHQFormData[keyof JapanHQFormData]) => {
    setJapanData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const updateProgrammeField = (field: keyof ProgrammeUserFormData, value: ProgrammeUserFormData[keyof ProgrammeUserFormData]) => {
    setProgrammeData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Quick Demo Autofill for active category
  const handleQuickFillDemo = () => {
    audio.playSuccessChime();
    setErrors({});

    if (category === "DEALER_NZ") {
      setDealerData({
        dealershipName: "Hawke's Bay Nissan Hastings",
        dealerCode: "NZ-NIS-HBY06",
        nzbn: "9429039918273",
        region: "Napier / Hastings (Hawke's Bay)",
        physicalAddress: "105 Karamu Road North, Hastings 4122",
        postalCode: "4122",
        contactName: "Cameron Scott",
        contactEmail: "cameron@hbnissan.co.nz",
        contactPhone: "+64 6 878 9100",
        acceptTerms: true,
        acceptCostBoundary: true,
      });
    } else if (category === "JAPAN_HQ") {
      setJapanData({
        facilityName: "Nissan Motor Co. Global HQ / Yokohama Operations",
        facilityCode: "JP-NIS-YOK01",
        corporateNumber: "1020001015674",
        yardPort: "Yokohama Port (Kanagawa)",
        physicalAddress: "1-1-1 Takashima, Nishi-ku, Yokohama, Kanagawa 220-8686",
        postalCode: "220-8686",
        contactName: "Kenji Takahashi",
        contactEmail: "k-takahashi@nissan-global.com",
        contactPhone: "+81 45 523 5523",
        acceptTerms: true,
        acceptCostBoundary: true,
      });
    } else {
      setProgrammeData({
        fullName: "Elena Campbell",
        organisation: "Nissan New Zealand NSC",
        department: "Customs, Supply Chain & Compliance",
        jobTitle: "Senior Vehicle Compliance Officer",
        businessEmail: "elena.campbell@nissan.co.nz",
        contactNumber: "+64 9 271 8800",
        requestedRole: "READONLY_PROGRAMME_USER",
        accessJustification: "Operational oversight for landed vehicle compliance, MR2A certifications, and logistics tracking.",
        acceptCompliance: true,
      });
    }
  };

  // Validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (category === "DEALER_NZ") {
      if (step === 1) {
        if (!dealerData.dealershipName.trim()) newErrors.dealershipName = "Legal / Trading Name is required";
        if (!dealerData.dealerCode.trim()) newErrors.dealerCode = "Nissan Dealer Code is required";
        if (!dealerData.physicalAddress.trim()) newErrors.physicalAddress = "Physical delivery address is required";
        if (!dealerData.contactName.trim()) newErrors.contactName = "Primary Contact Name is required";
        if (!dealerData.contactEmail.trim() || !dealerData.contactEmail.includes("@")) {
          newErrors.contactEmail = "Valid business email is required";
        }
        if (!dealerData.contactPhone.trim()) newErrors.contactPhone = "Direct phone number is required";
      }
      if (step === 2) {
        if (!dealerData.acceptTerms || !dealerData.acceptCostBoundary) {
          newErrors.acceptTerms = "Terms of Trade and Commercial Cost Boundary must be accepted";
        }
      }
    } else if (category === "JAPAN_HQ") {
      if (step === 1) {
        if (!japanData.facilityName.trim()) newErrors.facilityName = "HQ Facility / Branch Name is required";
        if (!japanData.facilityCode.trim()) newErrors.facilityCode = "Nissan Japan Facility Code is required";
        if (!japanData.physicalAddress.trim()) newErrors.physicalAddress = "Physical facility / yard address is required";
        if (!japanData.contactName.trim()) newErrors.contactName = "Authorized Export Lead Name is required";
        if (!japanData.contactEmail.trim() || !japanData.contactEmail.includes("@")) {
          newErrors.contactEmail = "Valid business email is required";
        }
        if (!japanData.contactPhone.trim()) newErrors.contactPhone = "Direct phone number is required";
      }
      if (step === 2) {
        if (!japanData.acceptTerms || !japanData.acceptCostBoundary) {
          newErrors.acceptTerms = "Japan Export Protocol & FOB alignment must be accepted";
        }
      }
    } else {
      // Programme User (Category 3)
      if (step === 1) {
        if (!programmeData.fullName.trim()) newErrors.fullName = "Full Name is required";
        if (!programmeData.organisation.trim()) newErrors.organisation = "Organisation / Company is required";
        if (!programmeData.department.trim()) newErrors.department = "Department is required";
        if (!programmeData.jobTitle.trim()) newErrors.jobTitle = "Job Title is required";
        if (!programmeData.businessEmail.trim() || !programmeData.businessEmail.includes("@")) {
          newErrors.businessEmail = "Valid business email is required";
        }
        if (!programmeData.contactNumber.trim()) newErrors.contactNumber = "Contact Number is required";
      }
      if (step === 2) {
        if (!programmeData.acceptCompliance) {
          newErrors.acceptCompliance = "Data governance & confidentiality agreement must be accepted";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      audio.playSubtleClick();
      setCurrentStep((prev) => Math.min(prev + 1, activeSteps.length));
    }
  };

  const handleBack = () => {
    audio.playSubtleClick();
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      audio.playSubtleClick();
      setCurrentStep(stepId);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(1) && validateStep(2)) {
      audio.playSuccessChime();

      if (category === "DEALER_NZ") {
        registerDealerApplication({
          legalTradingName: dealerData.dealershipName,
          dealerCode: dealerData.dealerCode,
          nzbn: dealerData.nzbn,
          region: dealerData.region,
          address: dealerData.physicalAddress,
          primaryContactName: dealerData.contactName,
          primaryContactEmail: dealerData.contactEmail,
          primaryContactPhone: dealerData.contactPhone,
          pricingZoneId: selectedLocation.zoneId,
          termsAcceptedVersion: "v2026.1",
          costBoundaryAccepted: true,
          category: "DEALER_NZ",
          registrationRole: "NZ Dealer",
        });
      } else if (category === "JAPAN_HQ") {
        registerDealerApplication({
          legalTradingName: japanData.facilityName,
          dealerCode: japanData.facilityCode,
          nzbn: japanData.corporateNumber,
          region: japanData.yardPort,
          address: japanData.physicalAddress,
          primaryContactName: japanData.contactName,
          primaryContactEmail: japanData.contactEmail,
          primaryContactPhone: japanData.contactPhone,
          pricingZoneId: "ZONE_1",
          termsAcceptedVersion: "v2026.1-JP-EXPORT",
          costBoundaryAccepted: true,
          category: "JAPAN_HQ",
          registrationRole: "Nissan Japan",
        });
      } else {
        addUser({
          name: programmeData.fullName,
          email: programmeData.businessEmail,
          phone: programmeData.contactNumber,
          department: programmeData.department,
          title: programmeData.jobTitle,
          dealershipName: programmeData.organisation,
          role: programmeData.requestedRole,
          category: "PROGRAMME_USER",
          registrationRole: "Programme",
          active: false,
        });
      }

      setIsSubmitted(true);
    }
  };

  const progressPercent = Math.round(((currentStep - 1) / (activeSteps.length - 1)) * 100);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: Pinned Desktop Canvas                         */}
      {/* ─────────────────────────────────────────────────────────── */}
      <aside className="relative overflow-hidden w-full lg:w-[350px] xl:w-[380px] lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto bg-[#000000] border-b lg:border-b-0 lg:border-r border-[#27272A] text-white flex flex-col justify-between p-6 sm:p-8 shrink-0">
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-6">
          {/* Brand Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center shrink-0">
              <img
                src="/nissan-logo.png"
                alt="Nissan Logo"
                className="w-10 h-10 object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]"
              />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block leading-tight">
                Nissan New Zealand
              </span>
              <h2 className="font-bold text-base text-white tracking-tight leading-tight">
                {category === "DEALER_NZ"
                  ? "Dealer Onboarding"
                  : category === "JAPAN_HQ"
                    ? "Japan HQ Onboarding"
                    : "Programme Access"}
              </h2>
            </div>
          </div>

          {/* Micro Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-300 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">
              {category === "DEALER_NZ"
                ? "NZ Franchise Application"
                : category === "JAPAN_HQ"
                  ? "Japan Export Entity"
                  : "Programme / Others"}
            </span>
          </div>

          {/* Minimal Progress Bar */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Progress</span>
              <span className="font-mono text-white font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-[11px]">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800/90 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-slate-400 via-slate-200 to-white transition-all duration-500 rounded-full"
                style={{ width: `${Math.max(progressPercent, 10)}%` }}
              />
            </div>
          </div>

          {/* Clean Step Indicators */}
          <nav aria-label="Registration Steps" className="space-y-1.5">
            {activeSteps.map((step) => {
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id || isSubmitted;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepClick(step.id)}
                  disabled={step.id > currentStep}
                  className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${isActive
                      ? "bg-white/10 text-white shadow-xs border border-white/15 backdrop-blur-md font-bold"
                      : isPassed
                        ? "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                        : "text-slate-500 cursor-not-allowed opacity-40 border border-transparent"
                    }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-all ${isActive
                        ? "bg-white text-black shadow-xs"
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
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
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
      {/* RIGHT SIDE: Category Switcher & Step Canvas                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <main className="relative flex-1 flex flex-col justify-center p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto bg-gradient-to-br from-slate-50 via-[#F8FAFC] to-slate-100/60 min-h-screen">
        <div className="relative z-10 max-w-2xl w-full mx-auto my-auto space-y-5">

          {/* Global Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900">
                {category === "DEALER_NZ"
                  ? "Dealer NZ Registration"
                  : category === "JAPAN_HQ"
                    ? "User/Dealer Japan HQ Registration"
                    : "User Others / Programme Registration"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official registration application for the Nissan Used Vehicle Programme
              </p>
            </div>

            {/* Quick Demo Autofill Pill */}
            {!isSubmitted && (
              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-black border border-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pre-fill Application Data</span>
              </button>
            )}
          </div>

          {/* ───────────────────────────────────────────────────────── */}
          {/* CATEGORY SELECTOR TABS                                   */}
          {/* ───────────────────────────────────────────────────────── */}
          {!isSubmitted && (
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCategoryChange("DEALER_NZ")}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left sm:text-center transition-all cursor-pointer flex items-center sm:justify-center gap-2 ${category === "DEALER_NZ"
                      ? "bg-[#0A0A0A] text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                    }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span>1. Dealer NZ Registration</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange("JAPAN_HQ")}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left sm:text-center transition-all cursor-pointer flex items-center sm:justify-center gap-2 ${category === "JAPAN_HQ"
                      ? "bg-[#0A0A0A] text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                    }`}
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span>2. Japan HQ Registration</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange("PROGRAMME_USER")}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left sm:text-center transition-all cursor-pointer flex items-center sm:justify-center gap-2 ${category === "PROGRAMME_USER"
                      ? "bg-[#0A0A0A] text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/60"
                    }`}
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span>3. User Others / Programme</span>
                </button>
              </div>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────── */}
          {/* SUCCESS CONFIRMATION VIEW                                 */}
          {/* ───────────────────────────────────────────────────────── */}
          {isSubmitted ? (
            <div className="bg-white rounded-[16px] border border-slate-200 p-8 sm:p-12 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200/80 flex items-center justify-center mx-auto text-emerald-600 shadow-[0_8px_30px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Application Successfully Logged</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {category === "DEALER_NZ"
                    ? "Dealership Onboarding Received"
                    : category === "JAPAN_HQ"
                      ? "Japan HQ Onboarding Received"
                      : "Programme User Application Received"}
                </h2>
                <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {category === "DEALER_NZ" && (
                    <>
                      Thank you, <strong className="text-slate-900">{dealerData.contactName}</strong>. Your franchise application for{" "}
                      <strong className="text-slate-900">{dealerData.dealershipName}</strong> (Code:{" "}
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">
                        {dealerData.dealerCode}
                      </code>
                      ) is securely stored in the programme database.
                    </>
                  )}
                  {category === "JAPAN_HQ" && (
                    <>
                      Thank you, <strong className="text-slate-900">{japanData.contactName}</strong>. Your Japan HQ export registration for{" "}
                      <strong className="text-slate-900">{japanData.facilityName}</strong> (Code:{" "}
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">
                        {japanData.facilityCode}
                      </code>
                      ) is securely registered for export coordination.
                    </>
                  )}
                  {category === "PROGRAMME_USER" && (
                    <>
                      Thank you, <strong className="text-slate-900">{programmeData.fullName}</strong>. Your application for{" "}
                      <strong className="text-slate-900">{programmeData.organisation}</strong> ({programmeData.jobTitle}) has been submitted for administrative access review.
                    </>
                  )}
                </p>
              </div>

              {/* Status Callout */}
              <div className="bg-gradient-to-br from-amber-50/90 to-amber-50/40 border border-amber-200/80 rounded-2xl p-5 text-left text-xs text-amber-900 space-y-2 shadow-2xs">
                <div className="font-bold flex items-center gap-2 text-sm text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    {category === "PROGRAMME_USER"
                      ? "Current State: Pending Administrator Access Approval"
                      : "Current State: Blocked Pending Autohub Authorization (AC-01)"}
                  </span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {category === "DEALER_NZ" && (
                    "Under the Nissan Used Vehicle Programme security rules, stock catalogue visibility and price calculations remain blocked until an Autohub Administrator verifies your dealer code and assigns your Geographic Pricing Zone."
                  )}
                  {category === "JAPAN_HQ" && (
                    "Under Japan Export Operations guidelines, export release authorizations remain locked until the Autohub Operations Desk verifies your facility credentials and designates your primary marshalling yard route."
                  )}
                  {category === "PROGRAMME_USER" && (
                    "User access roles are reviewed by the Nissan New Zealand Programme Administrator to ensure appropriate permissions. You will receive an automated activation link once approved."
                  )}
                </p>
                <div className="pt-1 text-[11px] text-amber-700">
                  Automated notification will be delivered to{" "}
                  <strong className="font-mono">
                    {category === "DEALER_NZ"
                      ? dealerData.contactEmail
                      : category === "JAPAN_HQ"
                        ? japanData.contactEmail
                        : programmeData.businessEmail}
                  </strong>
                  .
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download Application Copy</span>
                </button>
              </div>
            </div>
          ) : (
            /* ───────────────────────────────────────────────────────── */
            /* WIZARD FORM CONTAINER                                     */
            /* ───────────────────────────────────────────────────────── */
            <div className="bg-white rounded-[16px] border border-slate-200 p-7 sm:p-10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              {/* Step Header */}
              <div className="mb-7 pb-5 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-800">
                    Step {currentStep} of {activeSteps.length}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                    {activeSteps[currentStep - 1].title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    {activeSteps[currentStep - 1].subtitle}
                  </p>
                </div>
              </div>

              {/* ======================================================= */}
              {/* CATEGORY 1: DEALER NZ REGISTRATION                      */}
              {/* ======================================================= */}
              {category === "DEALER_NZ" && (
                <>
                  {/* Step 1: Dealership & Authorized Buyer */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Dealership Entity */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shadow-xs">
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
                            <Building2 className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="text"
                              value={dealerData.dealershipName}
                              onChange={(e) => updateDealerField("dealershipName", e.target.value)}
                              placeholder="e.g. Auckland Nissan City Ltd"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.dealershipName ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.dealershipName && (
                            <p className="text-[11px] text-rose-600">{errors.dealershipName}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Nissan Dealer Code *
                            </label>
                            <input
                              type="text"
                              value={dealerData.dealerCode}
                              onChange={(e) => updateDealerField("dealerCode", e.target.value.toUpperCase())}
                              placeholder="e.g. NZ-NIS-AKL04"
                              className={`w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.dealerCode ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                            {errors.dealerCode && (
                              <p className="text-[11px] text-rose-600">{errors.dealerCode}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              NZBN (NZ Business Number)
                            </label>
                            <input
                              type="text"
                              value={dealerData.nzbn}
                              onChange={(e) => updateDealerField("nzbn", e.target.value)}
                              placeholder="942903829..."
                              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Geographic Region / Island *
                            </label>
                            <select
                              value={dealerData.region}
                              onChange={(e) => updateDealerField("region", e.target.value)}
                              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer shadow-xs"
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
                              value={dealerData.postalCode}
                              onChange={(e) => updateDealerField("postalCode", e.target.value)}
                              placeholder="e.g. 1051"
                              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Dealership Physical Delivery Address *
                          </label>
                          <div className="relative group">
                            <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="text"
                              value={dealerData.physicalAddress}
                              onChange={(e) => updateDealerField("physicalAddress", e.target.value)}
                              placeholder="Street address where vehicles will be delivered"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.physicalAddress ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.physicalAddress && (
                            <p className="text-[11px] text-rose-600">{errors.physicalAddress}</p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            Standard pricing includes two NZ domestic carrier delivery movements to this address.
                          </p>
                        </div>
                      </div>

                      {/* Primary Authorized Buyer */}
                      <div className="space-y-4 pt-5 border-t border-slate-200/80">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shadow-xs">
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
                            value={dealerData.contactName}
                            onChange={(e) => updateDealerField("contactName", e.target.value)}
                            placeholder="e.g. Jason Bell"
                            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactName ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                              } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                          />
                          {errors.contactName && (
                            <p className="text-[11px] text-rose-600">{errors.contactName}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Business Email *
                            </label>
                            <div className="relative group">
                              <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                              <input
                                type="email"
                                value={dealerData.contactEmail}
                                onChange={(e) => updateDealerField("contactEmail", e.target.value)}
                                placeholder="jason@dealership.co.nz"
                                className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactEmail ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                  } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                              />
                            </div>
                            {errors.contactEmail && (
                              <p className="text-[11px] text-rose-600">{errors.contactEmail}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Direct Phone / Mobile *
                            </label>
                            <div className="relative group">
                              <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                              <input
                                type="tel"
                                value={dealerData.contactPhone}
                                onChange={(e) => updateDealerField("contactPhone", e.target.value)}
                                placeholder="+64 21 000 0000"
                                className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactPhone ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                  } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                              />
                            </div>
                            {errors.contactPhone && (
                              <p className="text-[11px] text-rose-600">{errors.contactPhone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Commercial Boundary & Terms */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-xs">
                        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-100/70 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <span>Dealer-Visible Commercial Boundary</span>
                          </span>
                          <span className="font-mono text-[10px] font-semibold bg-white px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 shadow-2xs">
                            v2026.1 Official Policy
                          </span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-5 space-y-4 text-xs divide-y divide-slate-100">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                              <div className="w-5 h-5 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </div>
                              <span>Included in Total Buy Price (Guaranteed Fixed Landed):</span>
                            </div>
                            <ul className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 pt-1">
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>Vehicle FOB acquisition cost (Japan JPY to NZD)</span>
                              </li>
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>Standard door-to-door RoRo ocean freight &amp; marine cover</span>
                              </li>
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>NZ Customs border processing, tariffs &amp; 15% NZ GST</span>
                              </li>
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>Standard entry compliance pass (MR2A &amp; 1-year WoF)</span>
                              </li>
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>Two standard domestic delivery carrier movements</span>
                              </li>
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>Nissan NZ certified programme component fee</span>
                              </li>
                            </ul>
                          </div>

                          <div className="space-y-2.5 pt-3.5">
                            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                              <div className="w-5 h-5 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                                !
                              </div>
                              <span>Potential Additional Costs (Requires Prior Dealership Approval):</span>
                            </div>
                            <ul className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 pt-1">
                              <li className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/80">
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>Non-standard structural or mechanical compliance repairs</span>
                              </li>
                              <li className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/80">
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>LVVTA repair certification or engineering evidence</span>
                              </li>
                              <li className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/80">
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>MPI border biosecurity flag &amp; decontamination treatment</span>
                              </li>
                              <li className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/80">
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>Non-standard demurrage storage or regional re-delivery</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-200/80 text-[11px] text-slate-500 italic">
                          Notice: Fixed pricing assumes a standard compliance pass. Any separately chargeable work will be evidenced prior to work execution.
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label
                          className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${dealerData.acceptTerms && dealerData.acceptCostBoundary
                              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                              : errors.acceptTerms
                                ? "bg-rose-50/40 border-rose-300 ring-2 ring-rose-500/20"
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={dealerData.acceptTerms && dealerData.acceptCostBoundary}
                            onChange={(e) => {
                              updateDealerField("acceptTerms", e.target.checked);
                              updateDealerField("acceptCostBoundary", e.target.checked);
                            }}
                            className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 shrink-0 cursor-pointer"
                          />
                          <span className="text-xs text-slate-700 leading-snug">
                            I accept the <strong className="text-slate-900 font-bold">Nissan NZ Terms of Trade (v2026.1)</strong> and acknowledge the <strong className="text-slate-900 font-bold">Commercial Cost Boundary</strong>. *
                          </span>
                        </label>

                        {errors.acceptTerms && (
                          <p className="text-[11px] text-rose-600 font-medium">{errors.acceptTerms}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review & Submit */}
                  {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                          <span className="font-bold text-slate-900 tracking-tight">1. Dealership Entity</span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-xs text-slate-900 font-semibold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Dealership:</span>
                            <strong className="text-slate-900 font-semibold">{dealerData.dealershipName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Dealer Code:</span>
                            <strong className="text-slate-900 font-mono font-bold">{dealerData.dealerCode}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Location &amp; Zone:</span>
                            <span className="text-slate-900 font-medium">
                              {dealerData.region} ({selectedLocation.zoneId})
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Physical Address:</span>
                            <span className="text-slate-900 truncate block">{dealerData.physicalAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                          <span className="font-bold text-slate-900 tracking-tight">2. Primary Authorized Buyer</span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-xs text-slate-900 font-semibold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Contact Name:</span>
                            <strong className="text-slate-900 font-semibold">{dealerData.contactName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Business Email:</span>
                            <strong className="text-slate-900 font-mono">{dealerData.contactEmail}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Direct Phone:</span>
                            <span className="text-slate-900 font-mono">{dealerData.contactPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2 text-emerald-900 shadow-2xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/60">
                          <div className="font-bold flex items-center gap-2 text-emerald-950">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Commercial Boundary &amp; Terms Confirmed</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs text-emerald-800 font-semibold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Terms of Trade (v2026.1) and Additional-Cost Boundary acknowledgements have been evidenced and will be archived with an immutable audit event upon submission.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ======================================================= */}
              {/* CATEGORY 2: JAPAN HQ REGISTRATION                       */}
              {/* ======================================================= */}
              {category === "JAPAN_HQ" && (
                <>
                  {/* Step 1: Japan HQ Entity & Lead Coordinator */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {/* Facility Entity */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shadow-xs">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Nissan Japan HQ &amp; Export Marshalling Facility
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              HQ facility profile, corporate number and Japanese marshalling port
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Japan Facility / Branch Legal Name *
                          </label>
                          <div className="relative group">
                            <Building2 className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="text"
                              value={japanData.facilityName}
                              onChange={(e) => updateJapanField("facilityName", e.target.value)}
                              placeholder="e.g. Nissan Motor Co. Global HQ / Yokohama Operations"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.facilityName ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.facilityName && (
                            <p className="text-[11px] text-rose-600">{errors.facilityName}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Nissan Japan Facility Code *
                            </label>
                            <input
                              type="text"
                              value={japanData.facilityCode}
                              onChange={(e) => updateJapanField("facilityCode", e.target.value.toUpperCase())}
                              placeholder="e.g. JP-NIS-YOK01"
                              className={`w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.facilityCode ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                            {errors.facilityCode && (
                              <p className="text-[11px] text-rose-600">{errors.facilityCode}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Japan Corporate Number (法人番号)
                            </label>
                            <input
                              type="text"
                              value={japanData.corporateNumber}
                              onChange={(e) => updateJapanField("corporateNumber", e.target.value)}
                              placeholder="1020001015674"
                              className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Export Marshalling Port *
                            </label>
                            <select
                              value={japanData.yardPort}
                              onChange={(e) => updateJapanField("yardPort", e.target.value)}
                              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer shadow-xs"
                            >
                              {JAPAN_PORTS.map((port) => (
                                <option key={port} value={port}>
                                  {port}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Postal Code</label>
                            <input
                              type="text"
                              value={japanData.postalCode}
                              onChange={(e) => updateJapanField("postalCode", e.target.value)}
                              placeholder="e.g. 220-8686"
                              className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Physical Facility / Depot Address in Japan *
                          </label>
                          <div className="relative group">
                            <MapPin className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="text"
                              value={japanData.physicalAddress}
                              onChange={(e) => updateJapanField("physicalAddress", e.target.value)}
                              placeholder="1-1-1 Takashima, Nishi-ku, Yokohama, Kanagawa"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.physicalAddress ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.physicalAddress && (
                            <p className="text-[11px] text-rose-600">{errors.physicalAddress}</p>
                          )}
                        </div>
                      </div>

                      {/* Lead Export Coordinator */}
                      <div className="space-y-4 pt-5 border-t border-slate-200/80">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shadow-xs">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Authorized Export Lead Coordinator
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Designated Japan coordinator responsible for FOB settlement &amp; vehicle handovers
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Coordinator Full Name *
                          </label>
                          <input
                            type="text"
                            value={japanData.contactName}
                            onChange={(e) => updateJapanField("contactName", e.target.value)}
                            placeholder="e.g. Kenji Takahashi"
                            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactName ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                              } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                          />
                          {errors.contactName && (
                            <p className="text-[11px] text-rose-600">{errors.contactName}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Business Email *
                            </label>
                            <div className="relative group">
                              <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                              <input
                                type="email"
                                value={japanData.contactEmail}
                                onChange={(e) => updateJapanField("contactEmail", e.target.value)}
                                placeholder="k-takahashi@nissan-global.com"
                                className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactEmail ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                  } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                              />
                            </div>
                            {errors.contactEmail && (
                              <p className="text-[11px] text-rose-600">{errors.contactEmail}</p>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                              Direct Phone / Mobile *
                            </label>
                            <div className="relative group">
                              <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                              <input
                                type="tel"
                                value={japanData.contactPhone}
                                onChange={(e) => updateJapanField("contactPhone", e.target.value)}
                                placeholder="+81 45 523 5523"
                                className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactPhone ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                  } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                              />
                            </div>
                            {errors.contactPhone && (
                              <p className="text-[11px] text-rose-600">{errors.contactPhone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Japan Export Terms & Protocol */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white shadow-xs">
                        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-50 to-slate-100/70 border-b border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <span>Japan Export &amp; Pre-Shipment Boundary Protocol</span>
                          </span>
                          <span className="font-mono text-[10px] font-semibold bg-white px-2.5 py-1 rounded-full border border-slate-200 text-slate-600 shadow-2xs">
                            v2026.1-JP-EXPORT
                          </span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-5 space-y-4 text-xs divide-y divide-slate-100">
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs">
                              <div className="w-5 h-5 rounded-full bg-emerald-100/80 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                ✓
                              </div>
                              <span>Standard Export Operations Covered by Programme:</span>
                            </div>
                            <ul className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 pt-1">
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>JPY FOB vehicle acquisition payout within standard settlement schedule</span>
                              </li>
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>Official Japanese Export Certificate (Yushutsu Massho) processing</span>
                              </li>
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>Pre-shipment radiation inspection &amp; border biosecurity clearance check</span>
                              </li>
                              <li className="flex items-start gap-2 bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/80">
                                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                                <span>Up to 30 days yard marshalling at designated export wharf</span>
                              </li>
                            </ul>
                          </div>

                          <div className="space-y-2.5 pt-3.5">
                            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs">
                              <div className="w-5 h-5 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center text-[10px] font-bold">
                                !
                              </div>
                              <span>Yard Extra / Non-Standard Conditions:</span>
                            </div>
                            <ul className="grid grid-cols-1 gap-2 text-[11px] text-slate-600 pt-1">
                              <li className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/80">
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>Wharf demurrage storage exceeding 30 calendar days</span>
                              </li>
                              <li className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/80">
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>Inland Tokyo / Nagoya transport beyond nominated export terminal</span>
                              </li>
                              <li className="flex items-start gap-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/80">
                                <span className="text-amber-600 font-bold shrink-0">•</span>
                                <span>EV high-voltage traction battery cell rectification prior to shipment</span>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <div className="px-5 py-2.5 bg-slate-50/80 border-t border-slate-200/80 text-[11px] text-slate-500 italic">
                          Notice: Japan export facility agrees to maintain vehicle availability during the 24-hour programme hold window.
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label
                          className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${japanData.acceptTerms && japanData.acceptCostBoundary
                              ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                              : errors.acceptTerms
                                ? "bg-rose-50/40 border-rose-300 ring-2 ring-rose-500/20"
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={japanData.acceptTerms && japanData.acceptCostBoundary}
                            onChange={(e) => {
                              updateJapanField("acceptTerms", e.target.checked);
                              updateJapanField("acceptCostBoundary", e.target.checked);
                            }}
                            className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 shrink-0 cursor-pointer"
                          />
                          <span className="text-xs text-slate-700 leading-snug">
                            I accept the <strong className="text-slate-900 font-bold">Nissan Global Japan Export Protocol (v2026.1-JP-EXPORT)</strong> and confirm marshalling facility alignment. *
                          </span>
                        </label>

                        {errors.acceptTerms && (
                          <p className="text-[11px] text-rose-600 font-medium">{errors.acceptTerms}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review & Submit */}
                  {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                          <span className="font-bold text-slate-900 tracking-tight">1. Japan Export Entity</span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-xs text-slate-900 font-semibold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Facility Name:</span>
                            <strong className="text-slate-900 font-semibold">{japanData.facilityName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Facility Code:</span>
                            <strong className="text-slate-900 font-mono font-bold">{japanData.facilityCode}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Export Port:</span>
                            <span className="text-slate-900 font-medium">{japanData.yardPort}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Physical Address:</span>
                            <span className="text-slate-900 truncate block">{japanData.physicalAddress}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                          <span className="font-bold text-slate-900 tracking-tight">2. Export Lead Coordinator</span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-xs text-slate-900 font-semibold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Coordinator Name:</span>
                            <strong className="text-slate-900 font-semibold">{japanData.contactName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Business Email:</span>
                            <strong className="text-slate-900 font-mono">{japanData.contactEmail}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Direct Phone:</span>
                            <span className="text-slate-900 font-mono">{japanData.contactPhone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2 text-emerald-900 shadow-2xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200/60">
                          <div className="font-bold flex items-center gap-2 text-emerald-950">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Export Protocol &amp; Marshalling Terms Confirmed</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs text-emerald-800 font-semibold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Japan Export Marshalling Protocol (v2026.1-JP-EXPORT) terms have been verified and will be archived with an immutable audit event upon submission.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ======================================================= */}
              {/* CATEGORY 3: USER OTHERS / PROGRAMME (ATTACHED FORMS)    */}
              {/* ======================================================= */}
              {category === "PROGRAMME_USER" && (
                <>
                  {/* Step 1 – User information (Strictly implements attached user form) */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shadow-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                            Step 1 – User information
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Please provide your official organisation profile and contact credentials
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Field 1: Full Name */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Full Name *
                          </label>
                          <div className="relative group">
                            <User className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="text"
                              value={programmeData.fullName}
                              onChange={(e) => updateProgrammeField("fullName", e.target.value)}
                              placeholder="e.g. Elena Campbell"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.fullName ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.fullName && (
                            <p className="text-[11px] text-rose-600">{errors.fullName}</p>
                          )}
                        </div>

                        {/* Field 2: Organisation / Company */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Organisation / Company *
                          </label>
                          <div className="relative group">
                            <Building2 className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="text"
                              value={programmeData.organisation}
                              onChange={(e) => updateProgrammeField("organisation", e.target.value)}
                              placeholder="e.g. Nissan New Zealand NSC"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.organisation ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.organisation && (
                            <p className="text-[11px] text-rose-600">{errors.organisation}</p>
                          )}
                        </div>

                        {/* Field 3: Department */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Department *
                          </label>
                          <div className="relative group">
                            <Briefcase className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="text"
                              value={programmeData.department}
                              onChange={(e) => updateProgrammeField("department", e.target.value)}
                              placeholder="e.g. Customs, Supply Chain & Compliance"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.department ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.department && (
                            <p className="text-[11px] text-rose-600">{errors.department}</p>
                          )}
                        </div>

                        {/* Field 4: Job Title */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Job Title *
                          </label>
                          <input
                            type="text"
                            value={programmeData.jobTitle}
                            onChange={(e) => updateProgrammeField("jobTitle", e.target.value)}
                            placeholder="e.g. Senior Vehicle Compliance Manager"
                            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.jobTitle ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                              } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                          />
                          {errors.jobTitle && (
                            <p className="text-[11px] text-rose-600">{errors.jobTitle}</p>
                          )}
                        </div>

                        {/* Field 5: Business Email */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Business Email *
                          </label>
                          <div className="relative group">
                            <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="email"
                              value={programmeData.businessEmail}
                              onChange={(e) => updateProgrammeField("businessEmail", e.target.value)}
                              placeholder="elena.campbell@nissan.co.nz"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.businessEmail ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.businessEmail && (
                            <p className="text-[11px] text-rose-600">{errors.businessEmail}</p>
                          )}
                        </div>

                        {/* Field 6: Contact Number */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Contact Number *
                          </label>
                          <div className="relative group">
                            <Phone className="w-4 h-4 text-slate-400 group-focus-within:text-slate-900 absolute left-3.5 top-3 transition-colors" />
                            <input
                              type="tel"
                              value={programmeData.contactNumber}
                              onChange={(e) => updateProgrammeField("contactNumber", e.target.value)}
                              placeholder="+64 9 271 8800"
                              className={`w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border ${errors.contactNumber ? "border-rose-500 ring-2 ring-rose-500/20" : "border-slate-200/90"
                                } text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs`}
                            />
                          </div>
                          {errors.contactNumber && (
                            <p className="text-[11px] text-rose-600">{errors.contactNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Programme Role & Access Scope */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center shadow-xs">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Step 2 – Programme Role &amp; Scope
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Select your requested access role and confirm data governance terms
                            </p>
                          </div>
                        </div>

                        {/* Role Selection Cards */}
                        <div className="space-y-2.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Requested Programme Role *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => updateProgrammeField("requestedRole", "READONLY_PROGRAMME_USER")}
                              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5 ${programmeData.requestedRole === "READONLY_PROGRAMME_USER"
                                  ? "bg-slate-50 border-slate-900 ring-2 ring-slate-900/10 shadow-xs"
                                  : "bg-white border-slate-200 hover:border-slate-300"
                                }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">Programme User</span>
                                {programmeData.requestedRole === "READONLY_PROGRAMME_USER" && (
                                  <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                                    <Check className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 leading-relaxed">
                                Read-only access to vehicle catalogue, landed pricing, shipping milestones, and logistics status.
                              </p>
                            </button>
                          </div>
                        </div>

                        {/* Access Justification */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Operational Justification / Access Purpose
                          </label>
                          <textarea
                            rows={3}
                            value={programmeData.accessJustification}
                            onChange={(e) => updateProgrammeField("accessJustification", e.target.value)}
                            placeholder="Briefly describe your operational role or requirements for accessing the programme portal..."
                            className="w-full px-3.5 py-2.5 text-xs bg-slate-50/70 hover:bg-slate-50/90 focus:bg-white rounded-xl border border-slate-200/90 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all shadow-xs"
                          />
                        </div>

                        {/* Governance Agreement Checkbox */}
                        <div className="space-y-1.5 pt-1">
                          <label
                            className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${programmeData.acceptCompliance
                                ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                                : errors.acceptCompliance
                                  ? "bg-rose-50/40 border-rose-300 ring-2 ring-rose-500/20"
                                  : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={programmeData.acceptCompliance}
                              onChange={(e) => updateProgrammeField("acceptCompliance", e.target.checked)}
                              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 shrink-0 cursor-pointer"
                            />
                            <span className="text-xs text-slate-700 leading-snug">
                              I agree to comply with the <strong className="text-slate-900 font-bold">Nissan NZ Data Governance &amp; Confidentiality Principles</strong>. *
                            </span>
                          </label>

                          {errors.acceptCompliance && (
                            <p className="text-[11px] text-rose-600 font-medium">{errors.acceptCompliance}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Review & Submit */}
                  {currentStep === 3 && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Summary Table exactly presenting the 6 fields from Step 1 */}
                      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                          <span className="font-bold text-slate-900 tracking-tight">Step 1 – User information</span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-xs text-slate-900 font-semibold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Full Name:</span>
                            <strong className="text-slate-900 font-semibold">{programmeData.fullName}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Organisation / Company:</span>
                            <strong className="text-slate-900 font-semibold">{programmeData.organisation}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Department:</span>
                            <span className="text-slate-900 font-medium">{programmeData.department}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Job Title:</span>
                            <span className="text-slate-900 font-medium">{programmeData.jobTitle}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Business Email:</span>
                            <strong className="text-slate-900 font-mono">{programmeData.businessEmail}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Contact Number:</span>
                            <span className="text-slate-900 font-mono">{programmeData.contactNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Scope & Role Summary */}
                      <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-3.5 text-xs">
                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                          <span className="font-bold text-slate-900 tracking-tight">Step 2 – Role &amp; Governance</span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-xs text-slate-900 font-semibold cursor-pointer hover:underline"
                          >
                            Edit
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Requested Role:</span>
                            <strong className="text-slate-900 font-semibold">
                              {programmeData.requestedRole === "READONLY_PROGRAMME_USER"
                                ? "Programme User (Read-Only)"
                                : "Programme Auditor"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Governance Status:</span>
                            <span className="text-emerald-700 font-semibold">Acknowledged &amp; Accepted</span>
                          </div>
                          {programmeData.accessJustification && (
                            <div className="sm:col-span-2 pt-1 border-t border-slate-200/60">
                              <span className="text-slate-400 block text-[11px]">Access Justification:</span>
                              <p className="text-slate-700 italic">{programmeData.accessJustification}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs space-y-2 text-emerald-900 shadow-2xs">
                        <div className="font-bold flex items-center gap-2 text-emerald-950">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Ready for Submission</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          Your profile will be verified by the Programme Administrator. Once confirmed, you will receive activation instructions at your business email.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ───────────────────────────────────────────────────── */}
              {/* NAVIGATION CONTROLS FOOTER                            */}
              {/* ───────────────────────────────────────────────────── */}
              <div className="mt-7 pt-5 border-t border-slate-100 flex items-center justify-between">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous Step</span>
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>Cancel Application</span>
                  </Link>
                )}

                {currentStep < activeSteps.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98] group cursor-pointer"
                  >
                    <span>Continue to Step {currentStep + 1}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#0A0A0A] hover:bg-[#444444] text-white text-xs font-semibold transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {category === "DEALER_NZ"
                        ? "Submit Dealership Application"
                        : category === "JAPAN_HQ"
                          ? "Submit Japan HQ Application"
                          : "Submit Programme Access Application"}
                    </span>
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
