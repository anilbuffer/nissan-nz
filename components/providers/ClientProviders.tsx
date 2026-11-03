"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { ProgrammeProvider } from "@/lib/programme-context";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProgrammeProvider>{children}</ProgrammeProvider>
    </AuthProvider>
  );
}
