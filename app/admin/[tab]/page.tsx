"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function AdminTabPageContent() {
  const { currentUser, isLoading } = useAuth();
  const params = useParams();
  const tab = Array.isArray(params?.tab) ? params.tab[0] : (params?.tab as string) || "dashboard";

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

  return <DashboardShell initialTab={tab} portal="admin" />;
}

export default function AdminTabPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminTabPageContent />
    </Suspense>
  );
}

