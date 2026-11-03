"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function JapanTabPageContent() {
  const { currentUser, isLoading } = useAuth();
  const params = useParams();
  const tab = Array.isArray(params?.tab) ? params.tab[0] : (params?.tab as string) || "inventory";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return <DashboardShell initialTab={tab} portal="japan" />;
}

export default function JapanTabPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JapanTabPageContent />
    </Suspense>
  );
}

