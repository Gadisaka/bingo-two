"use client";

// @ts-ignore - Prisma type import issue
import { Agent } from "@prisma/client";
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Wallet</TableHead>
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
                <TableCell>${agent.wallet.toFixed(2)}</TableCell>
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedAgent && (
        <>
          <ChangePasswordModal
            open={passwordModalOpen}
            onClose={() => setPasswordModalOpen(false)}
            agent={selectedAgent}
            onSuccess={onRefresh}
            onChangePassword={handleChangePassword}
            loading={changingPassword}
          />
        </>
      )}
    </div>
  );
}
