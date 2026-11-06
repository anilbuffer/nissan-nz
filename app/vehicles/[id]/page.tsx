"use client";

import React, { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function VehicleDetailPageContent() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "VEH_001";

  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.role === "AUTOHUB_ADMIN") {
        router.replace(`/admin/vehicles/${id}`);
      } else if (currentUser.role === "NISSAN_JAPAN") {
        router.replace(`/japan/inventory/${id}`);
      } else if (currentUser.role === "READONLY_PROGRAMME_USER") {
        router.replace(`/programme/vehicles/${id}`);
      } else {
        router.replace(`/dealer/vehicles/${id}`);
      }
    }
  }, [currentUser, isLoading, id, router]);

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C3002F] border-t-transparent rounded-full animate-spin" />
    </div>
  );
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
