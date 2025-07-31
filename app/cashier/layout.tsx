"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/common/mainlayout";
import {
  LayoutDashboard,
  Gamepad2,
  FileText,
  Gift,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { toast } from "sonner";

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const [showWallet, setShowWallet] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const router = useRouter();

  // Load toggle state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("showWallet");
    if (saved !== null) {
      setShowWallet(saved === "true");
    }
  }, []);

  // Save toggle state to localStorage on change
  useEffect(() => {
    localStorage.setItem("showWallet", showWallet.toString());
  }, [showWallet]);

  // Redirect if not authorized
  useEffect(() => {
    if (!loading && (!user || user.role !== "cashier")) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // fetchWallet function wrapped with useCallback to avoid recreation
  const fetchWallet = useCallback(async () => {
    if (!user || user.role !== "cashier") return;

    try {
      const res = await fetch("/api/dashboard/wallet", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch wallet");
      const data = await res.json();
      setWalletBalance(data.wallet);
    } catch (error) {
      toast.error("Failed to load wallet balance");
      setWalletBalance(null);
    }
  }, [user]);

  // Fetch wallet on mount and when user changes
  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user || user.role !== "cashier") return null;

  return (
    <DashboardLayout
      title="Cashier Dashboard"
      sidebarItems={[
        {
          name: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          path: "/cashier",
        },
        {
          name: "Game",
          icon: <Gamepad2 className="h-4 w-4" />,
          path: "/cashier/game",
        },
        // {
        //   name: "Jackpot",
        //   icon: <Gift className="h-4 w-4" />,
        //   path: "/cashier/jackpot",
        // },
        {
          name: "Reports",
          icon: <FileText className="h-4 w-4" />,
          path: "/cashier/report",
        },
      ]}
      topbarActions={[
        {
          icon: (
            <div
              className={`flex select-none items-center gap-2 rounded-md border px-3 py-1 text-sm font-medium shadow-sm transition
          ${
            walletBalance !== null && walletBalance < 2000
              ? "border-red-400 text-red-400 dark:border-red-700 dark:text-red-400"
              : "border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          }`}
              title={showWallet ? "Hide wallet balance" : "Show wallet balance"}
              onClick={() => {
                setShowWallet((c) => !c);
                fetchWallet(); // fetch wallet on click
              }}
            >
              <Wallet
                className="h-5 w-5"
                color={
                  walletBalance !== null && walletBalance < 2000
                    ? "rgb(220 38 38)" // Tailwind's red-600 color
                    : "rgb(37 99 235)" // Tailwind's blue-600 color
                }
              />
              <span className="tracking-widest font-mono">
                {showWallet && walletBalance !== null
                  ? `$${walletBalance.toLocaleString()}`
                  : "****"}
              </span>
            </div>
          ),
          func: () => {}, // You can keep this empty or remove if unused
        },
      ]}
    >
      {children}
    </DashboardLayout>
  );
}
