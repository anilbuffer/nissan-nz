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
  updateCurrentUser: (updates: Partial<UserAccount>) => void;
  updateCurrentDealer: (updates: Partial<DealerAccount>) => void;
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
      let resolvedUser = { ...user };
      try {
        const stored = localStorage.getItem(`autohub_user_${user.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          resolvedUser = { ...resolvedUser, ...parsed };
        }
      } catch (e) { }

      setCurrentUser(resolvedUser);
      localStorage.setItem("autohub_session_email", resolvedUser.email);
      if (resolvedUser.dealerId) {
        const dealer = MOCK_DEALERS.find((d) => d.id === resolvedUser.dealerId);
        let resolvedDealer = dealer ? { ...dealer } : null;
        if (resolvedDealer) {
          try {
            const storedDealer = localStorage.getItem(`autohub_dealer_${resolvedDealer.id}`);
            if (storedDealer) {
              resolvedDealer = { ...resolvedDealer, ...JSON.parse(storedDealer) };
            }
          } catch (e) { }
        }
        setCurrentDealer(resolvedDealer);
      } else {
        setCurrentDealer(null);
      }
      return true;
    }
    return false;
  };

  const updateCurrentUser = (updates: Partial<UserAccount>) => {
    setCurrentUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      const idx = MOCK_USERS.findIndex((u) => u.id === prev.id || u.email.toLowerCase() === prev.email.toLowerCase());
      if (idx !== -1) {
        MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...updates };
      }
      try {
        localStorage.setItem(`autohub_user_${prev.id}`, JSON.stringify(updated));
        if (updated.email) {
          localStorage.setItem("autohub_session_email", updated.email);
        }
      } catch (e) { }
      return updated;
    });
  };

  const updateCurrentDealer = (updates: Partial<DealerAccount>) => {
    setCurrentDealer((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      const idx = MOCK_DEALERS.findIndex((d) => d.id === prev.id);
      if (idx !== -1) {
        MOCK_DEALERS[idx] = { ...MOCK_DEALERS[idx], ...updates };
      }
      try {
        localStorage.setItem(`autohub_dealer_${prev.id}`, JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
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
        updateCurrentUser,
        updateCurrentDealer,
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

