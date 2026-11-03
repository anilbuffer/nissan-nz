import type { Metadata } from "next";
import DealerRegistrationWizard from "@/components/onboarding/DealerRegistrationWizard";

export const metadata: Metadata = {
  title: "Dealer Registration | Dealer Order Platform",
  description: "Official franchise onboarding application for Nissan Used Vehicle Programme New Zealand.",
};

export default function RegisterPage() {
  return <DealerRegistrationWizard />;
}

