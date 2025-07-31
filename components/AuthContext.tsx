"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: number;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // login: (phone: string, password: string, role: string) => Promise<boolean>
  login: (
    phone: string,
    password: string,
    role: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  // async function login(phone: string, password: string, role: string) {
  //   try {
  //     const res = await fetch("/api/auth/login", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ phone, password, role }),
  //     })
  //     if (!res.ok) return false
  //     await fetchUser()
  //     return true
  //   } catch {
  //     return false
  //   }
  // }

  async function login(
    phone: string,
    password: string,
    role: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, message: data?.error || "Login failed" };
      }

      await fetchUser();
      return { success: true };
    } catch {
      return { success: false, message: "An unexpected error occurred" };
    }
  }

  async function logout() {
    // Clear cookie server side: create /api/auth/logout route that clears cookie
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
