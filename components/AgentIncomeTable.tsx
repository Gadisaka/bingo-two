"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, TrendingUp, TrendingDown, Download } from "lucide-react";

interface AgentIncome {
  id: number;
  name: string;
  phone: string;
  status: string;
  dailyIncome: number;
  weeklyIncome: number;
  monthlyIncome: number;
  totalIncome: number;
  totalRevenue: number;
  totalBetAmount: number;
  totalRegisteredNumbers: number;
  cashierCount: number;
  reportCount: number;
}

interface Totals {
  dailyIncome: number;
  weeklyIncome: number;
  monthlyIncome: number;
  totalIncome: number;
  totalRevenue: number;
  totalBetAmount: number;
  totalRegisteredNumbers: number;
}

interface Props {
  agents: AgentIncome[];
  totals: Totals;
  loading: boolean;
}

type SortField =
  | "name"
  | "dailyIncome"
  | "weeklyIncome"
  | "monthlyIncome"
  | "totalIncome"
  | "totalRevenue"
  | "totalBetAmount"
  | "totalRegisteredNumbers"
  | "cashierCount"
  | "reportCount";

export default function AgentIncomeTable({ agents, totals, loading }: Props) {
  const [sortField, setSortField] = useState<SortField>("totalIncome");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Agent Name",
      "Phone",
      "Status",
      "Daily Income",
      "Weekly Income",
      "Monthly Income",
      "Total Income",
      "Total Revenue",
      "Total Bet Amount",
      "Cashier Count",
    ];

    const csvData = [
      headers.join(","),
      ...sortedAgents.map((agent) =>
        [
          `"${agent.name}"`,
          `"${agent.phone}"`,
          agent.status,
          agent.dailyIncome.toFixed(2),
          agent.weeklyIncome.toFixed(2),
          agent.monthlyIncome.toFixed(2),
          agent.totalIncome.toFixed(2),
          agent.totalRevenue.toFixed(2),
          agent.totalBetAmount.toFixed(2),
          agent.cashierCount,
        ].join(",")
      ),
      // Add totals row
      [
        '"TOTAL"',
        "",
        "",
        totals.dailyIncome.toFixed(2),
        totals.weeklyIncome.toFixed(2),
        totals.monthlyIncome.toFixed(2),
        totals.totalIncome.toFixed(2),
        totals.totalRevenue.toFixed(2),
        totals.totalBetAmount.toFixed(2),
        "",
      ].join(","),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `agent-income-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedAgents = [...agents].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(field)}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        {children}
        <ArrowUpDown className="ml-2 h-4 w-4" />
        {sortField === field &&
          (sortDirection === "asc" ? (
            <TrendingUp className="ml-1 h-3 w-3 text-blue-600" />
          ) : (
            <TrendingDown className="ml-1 h-3 w-3 text-red-600" />
          ))}
      </Button>
    </TableHead>
  );

  if (loading) {
    return (
      <div className="rounded-md border overflow-x-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Agent Income Details</h3>
          <Button disabled variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Daily Income</TableHead>
              <TableHead>Weekly Income</TableHead>
              <TableHead>Monthly Income</TableHead>
              <TableHead>Total Income</TableHead>
              <TableHead>Total Revenue</TableHead>
              <TableHead>Total Bet</TableHead>
              {/* <TableHead>Players</TableHead> */}
              <TableHead>Cashiers</TableHead>
              {/* <TableHead>Reports</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="rounded-md border p-4 text-center text-muted-foreground">
        No agents found
      </div>
    );
  }
  return (
    <div className="rounded-md border overflow-x-auto">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Agent Income Details</h3>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="name">Agent</SortableHeader>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <SortableHeader field="dailyIncome">Daily Income</SortableHeader>
            <SortableHeader field="weeklyIncome">Weekly Income</SortableHeader>
            <SortableHeader field="monthlyIncome">
              Monthly Income
            </SortableHeader>
            <SortableHeader field="totalIncome">Total Income</SortableHeader>
            <SortableHeader field="totalRevenue">Total Revenue</SortableHeader>
            <SortableHeader field="totalBetAmount">Total Bet</SortableHeader>
            {/* <SortableHeader field="totalRegisteredNumbers">
              Players
            </SortableHeader> */}
            <SortableHeader field="cashierCount">Cashiers</SortableHeader>
            {/* <SortableHeader field="reportCount">Reports</SortableHeader> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgents.map((agent) => (
            <TableRow key={agent.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{agent.name}</TableCell>
              <TableCell className="font-mono text-sm">{agent.phone}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    agent.status === "ACTIVE" ? "default" : "destructive"
                  }
                >
                  {agent.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-black font-semibold">
                ${agent.dailyIncome.toFixed(2)}
              </TableCell>
              <TableCell className="text-black font-semibold">
                ${agent.weeklyIncome.toFixed(2)}
              </TableCell>
              <TableCell className="text-black font-semibold">
                ${agent.monthlyIncome.toFixed(2)}
              </TableCell>
              <TableCell className="text-black font-semibold text-lg">
                ${agent.totalIncome.toFixed(2)}
              </TableCell>
              <TableCell className="font-mono">
                ${agent.totalRevenue.toFixed(2)}
              </TableCell>
              <TableCell className="font-mono">
                ${agent.totalBetAmount.toFixed(2)}
              </TableCell>
              {/* <TableCell className="font-mono">
                  {agent.totalRegisteredNumbers.toLocaleString()}
                </TableCell> */}
              <TableCell className="text-center">
                {agent.cashierCount}
              </TableCell>
              {/* <TableCell className="text-center">{agent.reportCount}</TableCell> */}
            </TableRow>
          ))}

          {/* Totals Row */}
          <TableRow className="bg-gray-400 font-semibold">
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-black">
              ${totals.dailyIncome.toFixed(2)}
            </TableCell>
            <TableCell className="text-black">
              ${totals.weeklyIncome.toFixed(2)}
            </TableCell>
            <TableCell className="text-black">
              ${totals.monthlyIncome.toFixed(2)}
            </TableCell>
            <TableCell className="text-black text-lg">
              ${totals.totalIncome.toFixed(2)}
            </TableCell>
            <TableCell className="font-mono">
              ${totals.totalRevenue.toFixed(2)}
            </TableCell>
            <TableCell className="font-mono">
              ${totals.totalBetAmount.toFixed(2)}
            </TableCell>
            <TableCell colSpan={1} />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
