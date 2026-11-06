"use client";

import React, { Suspense, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function OrderDetailPageContent() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string) || "ORD_1793869798968_d7l9l";

  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.role === "AUTOHUB_ADMIN") {
        router.replace(`/admin/orders/${id}`);
      } else if (currentUser.role === "READONLY_PROGRAMME_USER") {
        router.replace(`/programme/orders/${id}`);
      } else if (currentUser.role === "NISSAN_JAPAN") {
        router.replace("/japan/inventory");
      } else if (currentUser.role === "DEALER_APPLICANT") {
        router.replace("/dealer/profile");
      } else {
        router.replace(`/dealer/orders/${id}`);
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

  const portal =
    currentUser.role === "AUTOHUB_ADMIN"
      ? "admin"
      : currentUser.role === "READONLY_PROGRAMME_USER"
        ? "programme"
        : "dealer";

  return <DashboardShell initialOrderId={id} portal={portal} />;
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C3002F] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderDetailPageContent />
    </Suspense>
  );
}

