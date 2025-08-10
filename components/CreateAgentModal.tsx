"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z
    .string()
    .length(10, "Phone must be exactly 10 digits")
    .regex(/^\d+$/, "Phone must contain only numbers"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  walletBalance: z.preprocess(
    (val) => Number(val),
    z.number().nonnegative().optional()
  ),
  adminPercentage: z.preprocess(
    (val) => Number(val),
    z.number().min(0).max(100).optional()
  ),
  autoLock: z.boolean().optional(),
});

interface CreateAgentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  adminId: number; // <-- Required adminId prop
}

export default function CreateAgentModal({
  open,
  onClose,
  onSuccess,
  adminId,
}: CreateAgentModalProps) {
  const form = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      walletBalance: 0,
      adminPercentage: 20,
      autoLock: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof agentSchema>) => {
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          adminId, // Include adminId
          walletBalance: values.walletBalance ?? 0,
          adminPercentage: values.adminPercentage ?? 20,
          autoLock: values.autoLock ?? true,
        }),
      });

      if (response.ok) {
        toast.success("Agent created successfully");
        onSuccess();
        form.reset();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create agent");
      }
    } catch (error) {
      toast.error("An error occurred while creating agent");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Agent name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="walletBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Wallet Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Initial wallet amount"
                      {...field}
                      value={
                        typeof field.value === "number" ||
                        typeof field.value === "string"
                          ? field.value
                          : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Percentage (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="20"
                      {...field}
                      value={
                        typeof field.value === "number" ||
                        typeof field.value === "string"
                          ? field.value
                          : ""
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="autoLock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Auto Lock</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Automatically lock when wallet is insufficient
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Agent</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
