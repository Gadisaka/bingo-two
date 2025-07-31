"use client";

import { useState } from "react";
// @ts-ignore - Prisma type import issue
import { Cashier } from "@prisma/client";
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
import { Eye, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ChangePasswordModal from "@/components/ChangePasswordModal"; // adjust path if needed

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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
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
    </>
  );
}
