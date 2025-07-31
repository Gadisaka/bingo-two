"use client"; // make sure this is a client component

import { useEffect, useState } from "react";
import { Gamepad2, CreditCard, User, UserCog, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Metrics = {
  games: {
    today: number;
    weekly: number;
    total: number;
  };
  revenue: {
    today: number;
    weekly: number;
    total: number;
  };
  users: {
    admins: number;
    agents: number;
    cashiers: number;
  };
};

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        const data = await res.json();
        setMetrics(data);
      } catch (err: any) {
        // @ts-ignore - Error type handling
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-950 rounded-sm shadow py-4 px-3 flex items-center justify-between border border-gray-200 dark:border-gray-700"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
      {/* Game Metrics */}
      <MetricCard
        title="Today Game"
        value={metrics.games.today}
        icon={<Gamepad2 className="h-4 w-4" />}
      />
      <MetricCard
        title="Weekly Game"
        value={metrics.games.weekly}
        icon={<Gamepad2 className="h-4 w-4" />}
      />
      <MetricCard
        title="Total Game"
        value={metrics.games.total}
        icon={<Gamepad2 className="h-4 w-4" />}
      />

      {/* Revenue Metrics */}
      <MetricCard
        title="Today Revenue"
        value={metrics.revenue.today}
        icon={<CreditCard className="h-4 w-4" />}
        isCurrency
      />
      <MetricCard
        title="Weekly Revenue"
        value={metrics.revenue.weekly}
        icon={<CreditCard className="h-4 w-4" />}
        isCurrency
      />
      <MetricCard
        title="Total Revenue"
        value={metrics.revenue.total}
        icon={<CreditCard className="h-4 w-4" />}
        isCurrency
      />

      {/* User Metrics */}
      <MetricCard
        title="Admins"
        value={metrics.users.admins}
        icon={<User className="h-4 w-4" />}
      />
      <MetricCard
        title="Agents"
        value={metrics.users.agents}
        icon={<UserCog className="h-4 w-4" />}
      />
      <MetricCard
        title="Cashiers"
        value={metrics.users.cashiers}
        icon={<Wallet className="h-4 w-4" />}
      />
    </div>
  );
}

type MetricCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  isCurrency?: boolean;
};

function MetricCard({
  title,
  value,
  icon,
  isCurrency = false,
}: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-950 rounded-sm shadow py-4 px-3 flex items-center justify-between border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
        <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {isCurrency ? `$${value.toLocaleString()}` : value.toLocaleString()}
        </div>
      </div>
      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
        {icon}
      </div>
    </div>
  );
}
