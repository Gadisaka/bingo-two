"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/common/mainlayout";
import { LayoutDashboard, Gamepad2, FileText, User } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/"); // replace to prevent going back to admin
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    // optionally render nothing because redirect is triggered
    return null;
  }

  return (
    <DashboardLayout
      title="Admin Dashboard"
      sidebarItems={[
        {
          name: "Voucher",
          icon: <FileText className="h-4 w-4" />,
          path: "https://admin.goldbingo.net/",
          external: true,
        },
        {
          name: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          path: "/admin",
        },
        {
          name: "Agents",
          icon: <Gamepad2 className="h-4 w-4" />,
          path: "/admin/manage",
        },
        {
          name: "Reports",
          icon: <FileText className="h-4 w-4" />,
          path: "/admin/report",
        },
        {
          name: "Profile",
          icon: <User className="h-4 w-4" />,
          path: "/admin/profile",
        },
      ]}
    >
      {children}
    </DashboardLayout>
  );
}
