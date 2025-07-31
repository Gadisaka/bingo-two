'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useEffect, useState } from 'react'

const cashierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

interface CreateCashierModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateCashierModal({ open, onClose, onSuccess }: CreateCashierModalProps) {
  const form = useForm({
    resolver: zodResolver(cashierSchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
    }
  })

  const onSubmit = async (values: z.infer<typeof cashierSchema>) => {
    try {
      const response = await fetch('/api/cashiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        toast.success('Cashier created successfully')
        onSuccess()
        form.reset()
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to create cashier')
      }
    } catch (error) {
      toast.error('An error occurred while creating cashier')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
                        const val = e.target.value.replace(/\D/g, '')
                        field.onChange(val)
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
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Create Cashier
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
