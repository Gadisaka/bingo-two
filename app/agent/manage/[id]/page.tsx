// app/cashiers/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
// @ts-ignore - Prisma type import issue
import { Cashier } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";
import EditCashierModal from "@/components/EditCashierModal";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface CashierStats {
  today: {
    games: number;
    revenue: number;
  };
  weekly: {
    games: number;
    revenue: number;
  };
  total: {
    games: number;
    revenue: number;
  };
}

export default function CashierDetailPage() {
  const params = useParams();
  const [cashier, setCashier] = useState<Cashier | null>(null);
  const [stats, setStats] = useState<CashierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [cashierRes, statsRes] = await Promise.all([
          fetch(`/api/cashiers/${params.id}`),
          fetch(`/api/cashiers/${params.id}/stats`),
        ]);

        if (!cashierRes.ok || !statsRes.ok)
          throw new Error("Failed to fetch data");

        const [cashierData, statsData] = await Promise.all([
          cashierRes.json(),
          statsRes.json(),
        ]);

        setCashier(cashierData);
        setStats(statsData);
      } catch (error) {
        toast.error("Failed to load cashier data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleUpdateSuccess = (updatedCashier: Cashier) => {
    setCashier(updatedCashier);
    setEditModalOpen(false);
    toast.success("Cashier updated successfully");
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>

        <div className="space-y-4 mt-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!cashier) return <div className="p-8 text-center">Cashier not found</div>;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Cashiers
        </Button>
        <Button onClick={() => setEditModalOpen(true)} className="gap-2">
          <Pencil size={16} />
          Edit Cashier
        </Button>
      </div>

      {/* Cashier Details Card */}
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{cashier.name}</h1>
              <Badge
                variant={
                  cashier.status === "ACTIVE" ? "default" : "destructive"
                }
              >
                {cashier.status}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{cashier.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cashier ID</span>
                <span>{cashier.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agent ID</span>
                <span>{cashier.agentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created At</span>
                <span>
                  {format(new Date(cashier.createdAt), "MMM dd, yyyy HH:mm")}
                </span>
              </div>
            </div>
          </div>
          <div className="border-l pl-6 md:w-1/3">
            <div className="flex items-center gap-4 mb-2">
              <Wallet className="h-6 w-6 text-primary" />
              <h2 className="text-lg font-semibold">Wallet</h2>
            </div>
            <div className="text-3xl font-bold mb-2">
              ${((cashier as any).walletBalance ?? 0).toFixed(2)}
            </div>
            <div className="text-sm text-yellow-700">
              Debt: ${((cashier as any).debtBalance ?? 0).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Today"
          games={stats?.today.games || 0}
          revenue={stats?.today.revenue || 0}
        />
        <StatCard
          title="This Week"
          games={stats?.weekly.games || 0}
          revenue={stats?.weekly.revenue || 0}
        />
        <StatCard
          title="All Time"
          games={stats?.total.games || 0}
          revenue={stats?.total.revenue || 0}
        />
      </div>

      {editModalOpen && cashier && (
        <EditCashierModal
          cashier={cashier}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
