"use client";

// @ts-ignore - Prisma type import issue
import { Report } from "@prisma/client";
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

interface Props {
  reports: Report[];
  loading: boolean;
}

export default function ReportTable({ reports, loading }: Props) {
  // Safety check for undefined reports
  if (!reports || !Array.isArray(reports)) {
    console.error(
      "ReportTable: reports is undefined or not an array:",
      reports
    );
    return (
      <div className="rounded-md border p-4 text-center text-muted-foreground">
        Error: Unable to load reports data
      </div>
    );
  }

  const totals = reports.reduce(
    (acc, report) => ({
      totalCall: acc.totalCall + report.totalCall,
      registeredNumbers: acc.registeredNumbers + report.registeredNumbers,
      revenue: acc.revenue + report.revenue,
      betAmount: acc.betAmount + report.betAmount,
      totalBet: acc.totalBet + (report as any).totalBet,
      cashierCommission:
        acc.cashierCommission + (report as any).cashierCommission,
      agentCommission: acc.agentCommission + (report as any).agentCommission,
      adminCommission: acc.adminCommission + (report as any).adminCommission,
    }),
    {
      totalCall: 0,
      registeredNumbers: 0,
      revenue: 0,
      betAmount: 0,
      totalBet: 0,
      cashierCommission: 0,
      agentCommission: 0,
      adminCommission: 0,
    } as any
  );

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Total Calls</TableHead>
            <TableHead>Players</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Bet/Player</TableHead>
            <TableHead>Total Bet</TableHead>
            <TableHead>WinCut %</TableHead>
            <TableHead>Cashier Comm</TableHead>
            <TableHead>Agent Comm</TableHead>
            <TableHead>Admin Comm</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cashier</TableHead>
            <TableHead>Agent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 14 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : reports.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={14}
                className="text-center py-6 text-muted-foreground"
              >
                No reports found
              </TableCell>
            </TableRow>
          ) : (
            <>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.id}</TableCell>
                  <TableCell>
                    {new Date(
                      (report as any).createdAt ?? report.date
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell>{report.totalCall}</TableCell>
                  <TableCell>{report.registeredNumbers}</TableCell>
                  <TableCell>${report.revenue.toFixed(2)}</TableCell>
                  <TableCell>${report.betAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    ${((report as any).totalBet ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {((report as any).appliedWinCutPercent ?? 0).toFixed(1)}%
                  </TableCell>
                  <TableCell>
                    ${((report as any).cashierCommission ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ${((report as any).agentCommission ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    ${((report as any).adminCommission ?? 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        report.status === "ACTIVE" ? "default" : "destructive"
                      }
                    >
                      {report.status === "ACTIVE" ? "Completed" : "Cancelled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {(report as any).cashier?.name ?? report.cashierId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Agent: {(report as any).cashier?.agent?.name ?? "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(report as any).cashier?.agent?.name ?? "N/A"}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              <TableRow className="bg-muted font-semibold">
                <TableCell colSpan={4}>Total</TableCell>
                <TableCell>${totals.revenue.toFixed(2)}</TableCell>
                <TableCell>${totals.betAmount.toFixed(2)}</TableCell>
                <TableCell>${totals.totalBet.toFixed(2)}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>${totals.cashierCommission.toFixed(2)}</TableCell>
                <TableCell>${totals.agentCommission.toFixed(2)}</TableCell>
                <TableCell>${totals.adminCommission.toFixed(2)}</TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
