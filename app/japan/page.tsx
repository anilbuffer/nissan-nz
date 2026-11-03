"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import LoginPage from "@/components/login/LoginPage";

export default function JapanIndexPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace("/japan/inventory");
    }
  }, [currentUser, isLoading, router]);

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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#E11D48] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

