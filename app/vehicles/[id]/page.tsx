"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function VehicleDetailPageContent() {
  const { currentUser } = useAuth();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "VEH_001";

  if (!currentUser) {
    return <LoginPage />;
  }

  return <DashboardShell initialVehicleId={id} />;
}

export default function VehicleDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8">
          <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VehicleDetailPageContent />
    </Suspense>
  );
}
