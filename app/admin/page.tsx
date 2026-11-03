"use client";

import React, { Suspense } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import LoginPage from "@/components/login/LoginPage";
import { useAuth } from "@/lib/auth-context";

function AdminPageContent() {
  const { currentUser, isLoading } = useAuth();

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

  return <DashboardShell initialTab="menu" portal="admin" />;
}

export default function AdminIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}

