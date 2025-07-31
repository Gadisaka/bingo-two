"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/common/mainlayout";
import { LayoutDashboard, Gamepad2, FileText } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "agent")) {
      router.replace("/"); // redirect unauthorized users
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user || user.role !== "agent") return null;

  return (
    <DashboardLayout
      title="Agent Dashboard"
      sidebarItems={[
        {
          name: "Dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          path: "/agent",
        },
        {
          name: "Cashiers",
          icon: <Gamepad2 className="h-4 w-4" />,
          path: "/agent/manage",
        },
        {
          name: "Reports",
          icon: <FileText className="h-4 w-4" />,
          path: "/agent/report",
        },
      ]}
    >
      {children}
    </DashboardLayout>
  );
}
