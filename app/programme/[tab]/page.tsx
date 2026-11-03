"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function ProgrammeTabPageContent() {
  const { currentUser, isLoading } = useAuth();
  const params = useParams();
  const rawTab = Array.isArray(params?.tab) ? params.tab[0] : (params?.tab as string) || "reservations";
  const tab = (rawTab === "reports" || rawTab === "stock") ? "reservations" : rawTab;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C3002F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <DashboardShell initialTab={`programme-${tab}`} portal="programme" />;
}

export default function ProgrammeTabPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C3002F] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProgrammeTabPageContent />
    </Suspense>
  );
}

