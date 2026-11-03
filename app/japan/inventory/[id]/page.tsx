"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function JapanVehicleDetailPageContent() {
  const { currentUser, isLoading } = useAuth();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "VEH_001";

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

  return <DashboardShell initialVehicleId={id} portal="japan" initialTab="japan-inventory" />;
}

export default function JapanVehicleDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JapanVehicleDetailPageContent />
    </Suspense>
  );
}

