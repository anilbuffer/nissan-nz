import type { Metadata } from "next";
import DealerRegistrationWizard from "@/components/onboarding/DealerRegistrationWizard";

export const metadata: Metadata = {
  title: "Registration Portal | Nissan Used Vehicle Programme",
  description: "Official registration application for Nissan New Zealand Dealers, Japan Export HQ, and Programme Users.",
};

export default function RegisterPage() {
  return <DealerRegistrationWizard />;
}

