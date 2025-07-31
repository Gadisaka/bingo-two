// app/agents/components/ChangeStatusModal.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
// @ts-ignore - Prisma type import issue
import { Agent } from "@prisma/client";

interface ChangeStatusModalProps {
  open: boolean;
  onClose: () => void;
  agent: Agent;
  onSuccess: () => void;
}

export default function ChangeStatusModal({
  open,
  onClose,
  agent,
  onSuccess,
}: ChangeStatusModalProps) {
  const newStatus = agent.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  const handleStatusChange = async () => {
    try {
      const response = await fetch(`/api/agents/${agent.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Agent status changed to ${newStatus}`);
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to change status");
      }
    } catch (error) {
      toast.error("An error occurred while changing status");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Agent Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>
            Are you sure you want to change {agent.name}'s status from{" "}
            <span className="font-bold">{agent.status}</span> to{" "}
            <span className="font-bold">{newStatus}</span>?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant={newStatus === "ACTIVE" ? "default" : "destructive"}
              onClick={handleStatusChange}
            >
              Confirm
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
