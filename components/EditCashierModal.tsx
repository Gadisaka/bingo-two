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

const cashierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be exactly 10 digits"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

interface EditCashierModalProps {
  cashier: Cashier;
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
      <DialogContent className="sm:max-w-[500px]">
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
