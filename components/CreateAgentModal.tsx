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
  wallet: z.preprocess(
    (val) => Number(val),
    z.number().nonnegative().optional()
  ),
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
      wallet: 0,
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
          wallet: values.wallet ?? 0,
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
              name="wallet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wallet (optional)</FormLabel>
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
