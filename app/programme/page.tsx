"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function ProgrammePageContent() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser && currentUser.role !== "READONLY_PROGRAMME_USER") {
      if (currentUser.role === "AUTOHUB_ADMIN") {
        router.replace("/admin/dashboard");
      } else if (currentUser.role === "NISSAN_JAPAN") {
        router.replace("/japan/inventory");
      } else {
        router.replace("/dealer/stocks");
      }
    }
  }, [currentUser, isLoading, router]);

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

  if (currentUser.role !== "READONLY_PROGRAMME_USER") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C3002F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <DashboardShell initialTab="programme-stock" portal="programme" />;
}

export default function ProgrammeIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C3002F] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProgrammePageContent />
    </Suspense>
  );
}

