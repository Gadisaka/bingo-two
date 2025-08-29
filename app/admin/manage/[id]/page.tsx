// app/agents/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
// @ts-ignore - Prisma type import issue
import { Agent } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Pencil, ArrowLeft, Wallet, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";
import EditAgentModal from "@/components/EditAgentModal";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";

interface AgentStats {
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
    cashiers: number;
  };
}

interface Cashier {
  id: string;
  name: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  agentId: string;
}

export default function AgentDetailPage() {
  const params = useParams();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [agentRes, statsRes, cashiersRes] = await Promise.all([
          fetch(`/api/agents/${params.id}`),
          fetch(`/api/agents/${params.id}/stats`),
          fetch(`/api/agents/${params.id}/cashiers`),
        ]);

        if (!agentRes.ok || !statsRes.ok || !cashiersRes.ok)
          throw new Error("Failed to fetch data");

        const [agentData, statsData, cashiersData] = await Promise.all([
          agentRes.json(),
          statsRes.json(),
          cashiersRes.json(),
        ]);

        setAgent(agentData);
        setStats(statsData);
        setCashiers(cashiersData);
      } catch (error) {
        toast.error("Failed to load agent data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleUpdateSuccess = (updatedAgent: Agent) => {
    setAgent(updatedAgent);
    setEditModalOpen(false);
    toast.success("Agent updated successfully");
  };

  const handleDeleteAgent = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/agents/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Get the actual error message from the server
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `Server error: ${response.status}`;
        console.error("Delete agent error:", errorMessage);
        toast.error(`Failed to delete agent: ${errorMessage}`);
        return;
      }

      toast.success("Agent and all associated cashiers deleted successfully");
      router.push("/admin");
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast.error(
        `Failed to delete agent: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleCashierStatus = async (
    cashierId: string,
    isActive: boolean
  ) => {
    try {
      const response = await fetch(`/api/cashiers/${cashierId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update cashier status");
      }

      setCashiers((prev) =>
        prev.map((cashier) =>
          cashier.id === cashierId
            ? { ...cashier, status: isActive ? "ACTIVE" : "INACTIVE" }
            : cashier
        )
      );

      toast.success(
        `Cashier ${isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      console.error("Error updating cashier:", error);
      toast.error("Failed to update cashier status");
    }
  };

  const handleDeleteCashier = async (cashierId: string) => {
    try {
      const response = await fetch(`/api/cashiers/${cashierId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete cashier");
      }

      setCashiers((prev) => prev.filter((cashier) => cashier.id !== cashierId));
      toast.success("Cashier deleted successfully");
    } catch (error) {
      console.error("Error deleting cashier:", error);
      toast.error("Failed to delete cashier");
    }
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

  if (!agent) return <div className="p-8 text-center">Agent not found</div>;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to Agents
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => setEditModalOpen(true)} className="gap-2">
            <Pencil size={16} />
            Edit Agent
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-2"
          >
            <Trash2 size={16} />
            Delete Agent
          </Button>
        </div>
      </div>

      {/* Agent Details Card */}
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <Badge
                variant={agent.status === "ACTIVE" ? "default" : "destructive"}
              >
                {agent.status}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span>{agent.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Agent ID</span>
                <span>{agent.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created At</span>
                <span>
                  {format(new Date(agent.createdAt), "MMM dd, yyyy HH:mm")}
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
              $
              {(agent as any).walletBalance !== undefined
                ? `$${(agent as any).walletBalance.toFixed(2)}`
                : `$${(agent as any).wallet?.toFixed(2)}`}
            </div>
            <div className="text-sm text-yellow-700">
              Debt: ${((agent as any).debtBalance ?? 0).toFixed(2)}
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
          cashiers={stats?.total.cashiers || 0}
        />
      </div>

      {/* Cashiers Section */}
      <div className="border rounded-lg p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Cashiers ({cashiers.length})
        </h2>
        {cashiers.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No cashiers found for this agent.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashiers.map((cashier) => (
                <TableRow key={cashier.id}>
                  <TableCell className="font-medium">{cashier.name}</TableCell>
                  <TableCell>{cashier.phone}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        cashier.status === "ACTIVE" ? "default" : "secondary"
                      }
                    >
                      {cashier.status === "ACTIVE" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(cashier.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={cashier.status === "ACTIVE"}
                      onCheckedChange={(checked) =>
                        handleToggleCashierStatus(cashier.id, checked)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this cashier?"
                          )
                        ) {
                          handleDeleteCashier(cashier.id);
                        }
                      }}
                      className="gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Delete Agent Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agent? This action cannot be
              undone. All cashiers under this agent will also be permanently
              deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAgent}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editModalOpen && agent && (
        <EditAgentModal
          agent={agent}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}
