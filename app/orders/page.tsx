"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "@/components/login/LoginPage";

function OrdersRedirectContent() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.role === "AUTOHUB_ADMIN") {
        router.replace("/admin/orders");
      } else if (currentUser.role === "READONLY_PROGRAMME_USER") {
        router.replace("/programme/orders");
      } else {
        router.replace("/dealer/orders");
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#C3002F] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#C3002F] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrdersRedirectContent />
    </Suspense>
  );
}

