"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { UserAccount, DealerAccount, UserRole } from "./types";
import { MOCK_USERS, MOCK_DEALERS } from "./mock-data";

interface AuthContextType {
  currentUser: UserAccount | null;
  currentDealer: DealerAccount | null;
  loginAs: (email: string) => boolean;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentDealer, setCurrentDealer] = useState<DealerAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Clear persistent auto-session so the Login Page opens by default on fresh visit
    try {
      localStorage.removeItem("autohub_session_email");
    } catch (e) { }
    setIsLoading(false);
  }, []);

  const loginAs = (email: string): boolean => {
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      localStorage.setItem("autohub_session_email", user.email);
      if (user.dealerId) {
        const dealer = MOCK_DEALERS.find((d) => d.id === user.dealerId);
        setCurrentDealer(dealer || null);
      } else {
        setCurrentDealer(null);
      }
      return true;
    }
    return false;
  };

  const switchRole = (role: UserRole) => {
    const targetUser = MOCK_USERS.find((u) => u.role === role);
    if (targetUser) {
      loginAs(targetUser.email);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentDealer(null);
    localStorage.removeItem("autohub_session_email");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentDealer,
        loginAs,
        switchRole,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

