"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../AuthContext";
import { useGameStatusStore } from "@/lib/stores/gameStatusStore";

type SidebarItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

type TopbarAction = {
  icon: React.ReactNode;
  func?: () => void;
  href?: string;
  tooltip?: string;
};

type LayoutProps = {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  topbarActions?: TopbarAction[];
  title?: string;
};

export default function DashboardLayout({
  children,
  sidebarItems,
  topbarActions = [],
  title = "Dashboard",
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Force darkMode to false
  const darkMode = false;
  const pathname = usePathname();
  const router = useRouter();

  // Remove darkMode useEffect hooks

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    localStorage.clear();
    //clear all cookies
    document.cookie.split(";").forEach(function (c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    router.push("/");
  };

  const currentGameStatus = useGameStatusStore(
    (state) => state.currentGameStatus
  );

  // Remove darkMode toggle from enhancedTopbarActions
  const enhancedTopbarActions = [...topbarActions];

  return (
    <div
      className={`flex h-screen w-full flex-col overflow-hidden transition-colors duration-200`}
    >
      {/* Top Bar */}
      <header
        className={`fixed inset-x-0 top-0 z-40 h-16  ${
          title === "Cashier Dashboard"
            ? "bg-[#09519E] text-white"
            : "bg-white border-b shadow-lg"
        } flex items-center justify-between px-4 shadow-sm`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-md text-gray-500 hover:bg-gray-100`}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1
            className={`text-lg font-semibold text-gray-800 ${
              title === "Cashier Dashboard" &&
              "text-yellow-500 font-bold text-2xl"
            } `}
          >
            {title}
          </h1>
        </div>

        {/* Center text for cashier role */}
        {/* {title === "Cashier Dashboard" && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <h2 className={`text-5xl font-bold font-pacifico text-orange-400`}>
              EthioStar{" "}
              <span className="text-white">
                Bin<span className="text-green-500">g</span>o
              </span>
            </h2>
          </div>
        )} */}

        <div className="flex items-center gap-2">
          {enhancedTopbarActions.map((action, index) => (
            <ActionButton key={index} action={action} darkMode={darkMode} />
          ))}
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 border-r transition-all duration-300 ease-in-out z-30
          ${
            darkMode
              ? "bg-[#1f2937] border-gray-800"
              : "bg-white border-gray-200"
          }
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-full flex-col">
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors
                      ${
                        pathname === item.path
                          ? darkMode
                            ? "bg-gray-700 text-blue-400"
                            : "bg-gray-50 text-blue-600"
                          : darkMode
                          ? "text-gray-300 hover:bg-gray-800"
                          : "text-gray-600 hover:bg-gray-100"
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                    {pathname === item.path && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout Button */}
          <div
            className={`p-4 border-t ${
              darkMode ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors
              ${
                darkMode
                  ? "text-gray-300 hover:bg-gray-800"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 pt-16
          ${darkMode ? "bg-[#111725]" : "bg-gray-50"}
        `}
      >
        <div className="">{children}</div>
      </main>
    </div>
  );
}

function ActionButton({
  action,
  darkMode,
}: {
  action: TopbarAction;
  darkMode: boolean;
}) {
  const className = `p-2 rounded-md transition-colors ${
    darkMode
      ? "text-gray-300 hover:bg-gray-800"
      : "text-gray-500 hover:bg-gray-100"
  }`;

  if (action.href) {
    return (
      <Link
        href={action.href}
        className={className}
        title={action.tooltip}
        aria-label={action.tooltip}
      >
        {action.icon}
      </Link>
    );
  }

  return (
    <button
      onClick={action.func}
      className={className}
      title={action.tooltip}
      aria-label={action.tooltip}
    >
      {action.icon}
    </button>
  );
}
