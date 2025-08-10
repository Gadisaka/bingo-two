"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import { useEffect, useState } from "react";
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
  password: z.string().min(6, "Password must be at least 6 characters"),
  walletBalance: z.preprocess(
    (val) => Number(val),
    z.number().nonnegative().optional()
  ),
  agentPercentage: z.preprocess(
    (val) => Number(val),
    z.number().min(0).max(100).optional()
  ),
  autoLock: z.boolean().optional(),
  winCutTable: z.array(winCutTableSchema).optional(),
});

interface CreateCashierModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCashierModal({
  open,
  onClose,
  onSuccess,
}: CreateCashierModalProps) {
  const form = useForm({
    resolver: zodResolver(cashierSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      walletBalance: 0,
      agentPercentage: 0,
      autoLock: true,
      winCutTable: [
        { minCards: 1, maxCards: 5, percent5to30: 0, percentAbove30: 5 },
        { minCards: 6, maxCards: 10, percent5to30: 5, percentAbove30: 10 },
        { minCards: 11, maxCards: 15, percent5to30: 10, percentAbove30: 15 },
        { minCards: 16, maxCards: 20, percent5to30: 15, percentAbove30: 20 },
      ] as z.infer<typeof winCutTableSchema>[],
    },
  });

  const onSubmit = async (values: z.infer<typeof cashierSchema>) => {
    try {
      const response = await fetch("/api/cashiers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          walletBalance: values.walletBalance ?? 0,
          agentPercentage: values.agentPercentage ?? 0,
          autoLock: values.autoLock ?? true,
          winCutTable: values.winCutTable ?? [],
        }),
      });

      if (response.ok) {
        toast.success("Cashier created successfully");
        onSuccess();
        form.reset();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to create cashier");
      }
    } catch (error) {
      toast.error("An error occurred while creating cashier");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Cashier</DialogTitle>
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
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Cashier</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
