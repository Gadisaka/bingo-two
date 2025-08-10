"use client";

// @ts-ignore - Prisma type import issue
import { Agent as PrismaAgent } from "@prisma/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, Key, Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ChangePasswordModal from "./ChangePasswordModal";
import ChangeStatusModal from "./ChangeStatusModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Agent = PrismaAgent & {
  walletBalance?: number;
  debtBalance?: number;
  adminPercentage?: number;
  autoLock?: boolean;
};

interface AgentTableProps {
  agents: Agent[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AgentTable({
  agents,
  loading,
  onRefresh,
}: AgentTableProps) {
  const router = useRouter();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpAgent, setTopUpAgent] = useState<Agent | null>(null);

  const handleViewDetail = (agentId: number) => {
    router.push(`/admin/manage/${agentId}`);
  };

  const handleChangePassword = async (agentId: number, newPassword: string) => {
    setChangingPassword(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || "Failed to change password");
        return;
      }

      toast.success("Password changed successfully");
      onRefresh();
      setPasswordModalOpen(false);
    } catch {
      toast.error("An error occurred while changing password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAgent || topUpAmount <= 0) return;
    setTopUpLoading(true);
    try {
      const res = await fetch(`/api/agents/${topUpAgent.id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: topUpAmount }),
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to top up wallet");
        return;
      }
      toast.success("Wallet topped up successfully");
      setTopUpModalOpen(false);
      setTopUpAmount(0);
      onRefresh();
    } catch {
      toast.error("An error occurred while topping up wallet");
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Wallet</TableHead>
            <TableHead>Debt</TableHead>
            <TableHead>Admin %</TableHead>
            <TableHead>AutoLock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))
          ) : agents.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No agents found
              </TableCell>
            </TableRow>
          ) : (
            agents.map((agent) => (
              <TableRow key={agent.id}>
                <TableCell>{agent.id}</TableCell>
                <TableCell>{agent.name}</TableCell>
                <TableCell>{agent.phone}</TableCell>
                <TableCell>
                  ${(agent.walletBalance ?? agent.wallet ?? 0).toFixed(2)}
                </TableCell>
                <TableCell>${(agent.debtBalance ?? 0).toFixed(2)}</TableCell>
                <TableCell>{agent.adminPercentage !== undefined ? agent.adminPercentage + '%' : 'N/A'}</TableCell>
                <TableCell>{agent.autoLock !== undefined ? (agent.autoLock ? 'Yes' : 'No') : 'N/A'}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      agent.status === "ACTIVE" ? "default" : "destructive"
                    }
                  >
                    {agent.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(agent.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetail(agent.id)}
                    aria-label="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedAgent(agent);
                      setPasswordModalOpen(true);
                    }}
                    aria-label="Change password"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTopUpAgent(agent);
                      setTopUpModalOpen(true);
                    }}
                    aria-label="Top up wallet"
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedAgent && (
        <ChangePasswordModal
          open={passwordModalOpen}
          onClose={() => setPasswordModalOpen(false)}
          agent={selectedAgent}
          onSuccess={onRefresh}
          onChangePassword={handleChangePassword}
          loading={changingPassword}
        />
      )}

      {topUpAgent && (
        <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Top Up Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-1">Agent: {topUpAgent.name}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  Current Balance: ${(topUpAgent.walletBalance ?? topUpAgent.wallet ?? 0).toFixed(2)}
                </div>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  disabled={topUpLoading}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTopUpModalOpen(false)}
                  disabled={topUpLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleTopUp}
                  disabled={topUpAmount <= 0 || topUpLoading}
                >
                  {topUpLoading ? <span className="animate-spin mr-2">⏳</span> : null}
                  Top Up
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
