"use client";

import { useState } from "react";
// @ts-ignore - Prisma type import issue
import { Cashier as PrismaCashier } from "@prisma/client";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ChangePasswordModal from "@/components/ChangePasswordModal"; // adjust path if needed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Cashier = PrismaCashier & {
  walletBalance?: number;
  debtBalance?: number;
  agentPercentage?: number;
  autoLock?: boolean;
};

interface CashierTableProps {
  cashiers: Cashier[];
  loading: boolean;
  onRefresh: () => void;
}

export default function CashierTable({
  cashiers,
  loading,
  onRefresh,
}: CashierTableProps) {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState<Cashier | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpCashier, setTopUpCashier] = useState<Cashier | null>(null);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpDebt, setTopUpDebt] = useState<number | null>(null);

  const handleViewDetail = (cashierId: number) => {
    router.push(`/agent/manage/${cashierId}`);
  };

  const handleOpenPasswordModal = (cashier: Cashier) => {
    setSelectedCashier(cashier);
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (
    cashierId: number,
    newPassword: string
  ) => {
    setChangingPassword(true);
    try {
      const res = await fetch(`/api/cashiers/${cashierId}/password`, {
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
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpCashier || topUpAmount <= 0) return;
    setTopUpLoading(true);
    setTopUpError(null);
    setTopUpDebt(null);
    try {
      const res = await fetch(`/api/cashiers/${topUpCashier.id}/topup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: topUpAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTopUpError(data.error || "Failed to top up wallet");
        if (data.error && data.error.includes("debt")) {
          setTopUpDebt(data.agent?.debtBalance ?? null);
        }
        return;
      }
      toast.success("Wallet topped up successfully");
      setTopUpModalOpen(false);
      setTopUpAmount(0);
      onRefresh();
    } catch {
      setTopUpError("An error occurred while topping up wallet");
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Debt</TableHead>
              <TableHead>Agent %</TableHead>
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
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : cashiers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No cashiers found
                </TableCell>
              </TableRow>
            ) : (
              cashiers.map((cashier) => (
                <TableRow key={cashier.id}>
                  <TableCell>{cashier.id}</TableCell>
                  <TableCell>{cashier.name}</TableCell>
                  <TableCell>{cashier.phone}</TableCell>
                  <TableCell>
                    ${(cashier.walletBalance ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ${(cashier.debtBalance ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {cashier.agentPercentage !== undefined
                      ? cashier.agentPercentage + "%"
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {cashier.autoLock !== undefined
                      ? cashier.autoLock
                        ? "Yes"
                        : "No"
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        cashier.status === "ACTIVE" ? "default" : "destructive"
                      }
                    >
                      {cashier.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(cashier.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleViewDetail(cashier.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenPasswordModal(cashier)}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setTopUpCashier(cashier);
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
      </div>

      {selectedCashier && (
        <ChangePasswordModal
          open={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          agent={selectedCashier}
          onSuccess={onRefresh}
          onChangePassword={handleChangePassword}
          loading={changingPassword}
        />
      )}

      {topUpCashier && (
        <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Top Up Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="font-medium mb-1">
                  Cashier: {topUpCashier.name}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Current Balance: $
                  {(topUpCashier.walletBalance ?? 0).toFixed(2)}
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
                {topUpError && (
                  <div className="text-red-600 text-sm mt-2">{topUpError}</div>
                )}
                {topUpDebt !== null && (
                  <div className="text-yellow-700 text-sm mt-2">
                    Agent Debt after top-up: ${topUpDebt.toFixed(2)}
                  </div>
                )}
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
                  {topUpLoading ? (
                    <span className="animate-spin mr-2">⏳</span>
                  ) : null}
                  Top Up
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
