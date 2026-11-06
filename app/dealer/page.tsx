"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "@/components/login/LoginPage";

export default function DealerIndexPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.role === "DEALER_USER" || currentUser.role === "DEALER_ADMIN") {
        router.replace("/dealer/stocks");
      } else if (currentUser.role === "AUTOHUB_ADMIN") {
        router.replace("/admin/dashboard");
      } else if (currentUser.role === "NISSAN_JAPAN") {
        router.replace("/japan/inventory");
      } else if (currentUser.role === "READONLY_PROGRAMME_USER") {
        router.replace("/programme/stock");
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

