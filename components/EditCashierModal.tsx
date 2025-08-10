"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
// @ts-ignore - Prisma type import issue
import { Cashier } from "@prisma/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import WinCutTableEditor from "./WinCutTableEditor";

const winCutTableSchema = z.object({
  minCards: z.number().min(1),
  maxCards: z.number().min(1),
  percent5to30: z.number().min(0).max(100),
  percentAbove30: z.number().min(0).max(100),
});

const cashierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  walletBalance: z.preprocess(
    (val) => Number(val),
    z.number().nonnegative().optional()
  ),
  agentPercentage: z.preprocess(
    (val) => Number(val),
    z.number().min(0).max(100).optional()
  ),
  autoLock: z.boolean().optional(),
  debtBalance: z.preprocess(
    (val) => Number(val),
    z.number().nonnegative().optional()
  ),
  winCutTable: z.array(winCutTableSchema).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

interface EditCashierModalProps {
  cashier: Cashier & { winCutTables?: any[] };
  open: boolean;
  onClose: () => void;
  onSuccess: (cashier: Cashier) => void;
}

export default function EditCashierModal({
  cashier,
  open,
  onClose,
  onSuccess,
}: EditCashierModalProps) {
  const form = useForm({
    resolver: zodResolver(cashierSchema),
    defaultValues: {
      name: cashier.name,
      phone: cashier.phone,
      walletBalance: cashier.walletBalance ?? 0,
      agentPercentage: cashier.agentPercentage ?? 0,
      autoLock: cashier.autoLock ?? true,
      debtBalance: cashier.debtBalance ?? 0,
      winCutTable:
        cashier.winCutTables?.map((w: any) => ({
          minCards: w.minCards,
          maxCards: w.maxCards,
          percent5to30: w.percent5to30,
          percentAbove30: w.percentAbove30,
        })) ?? [],
      status: cashier.status,
    },
  });

  const onSubmit = async (values: z.infer<typeof cashierSchema>) => {
    try {
      const response = await fetch(`/api/cashiers/${cashier.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const updatedCashier = await response.json();
        onSuccess(updatedCashier);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update cashier");
      }
    } catch (error) {
      toast.error("An error occurred while updating cashier");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Cashier</DialogTitle>
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
                    <Input placeholder="Cashier name" {...field} />
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
                    <Input
                      placeholder="Phone number"
                      maxLength={10}
                      minLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        field.onChange(val);
                      }}
                    />
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
                  <FormLabel>Wallet Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Wallet amount"
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
              name="debtBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debt Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Debt amount"
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
              name="agentPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Percentage (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0"
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
            <FormField
              control={form.control}
              name="winCutTable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Win Cut Table</FormLabel>
                  <FormControl>
                    <WinCutTableEditor
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
