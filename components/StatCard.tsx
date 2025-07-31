// components/StatCard.tsx
'use client'

import { DollarSign, Users, Activity } from 'lucide-react'

interface StatCardProps {
  title: string
  games: number
  revenue: number
  cashiers?: number
}

export default function StatCard({ title, games, revenue, cashiers }: StatCardProps) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Games</span>
          </div>
          <span className="font-medium">{games.toLocaleString()}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Revenue</span>
          </div>
          <span className="font-medium">${revenue.toLocaleString()}</span>
        </div>
        
        {cashiers !== undefined && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Cashiers</span>
            </div>
            <span className="font-medium">{cashiers.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}