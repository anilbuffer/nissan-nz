"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && currentUser) {
      if (currentUser.role === "AUTOHUB_ADMIN") {
        router.replace("/admin/dashboard");
      } else if (currentUser.role === "NISSAN_JAPAN") {
        router.replace("/japan/inventory");
      } else if (currentUser.role === "READONLY_AUDITOR") {
        router.replace("/admin/audit");
      } else {
        router.replace("/dealer/stocks");
      }
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#070D18] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E11D48] flex items-center justify-center font-bold text-lg animate-pulse">
            D
          </div>
          <p className="text-xs text-slate-400 font-mono">Loading Dealer Order Platform...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render the clean Login Page
  if (!currentUser) {
    return <LoginPage />;
  }

  // Brief redirecting splash
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
