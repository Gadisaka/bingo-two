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
  const totals = reports.reduce(
    (acc, report) => ({
      totalCall: acc.totalCall + report.totalCall,
      registeredNumbers: acc.registeredNumbers + report.registeredNumbers,
      revenue: acc.revenue + report.revenue,
      betAmount: acc.betAmount + report.betAmount,
    }),
    { totalCall: 0, registeredNumbers: 0, revenue: 0, betAmount: 0 }
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
            <TableHead>Bet Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Cashier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 8 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : reports.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
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
                    {new Date(report.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{report.totalCall}</TableCell>
                  <TableCell>{report.registeredNumbers}</TableCell>
                  <TableCell>${report.revenue.toFixed(2)}</TableCell>
                  <TableCell>${report.betAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        report.status === "ACTIVE" ? "default" : "destructive"
                      }
                    >
                      {report.status === "ACTIVE" ? "Completed" : "Cancelled"}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.cashierId}</TableCell>
                </TableRow>
              ))}

              {/* Totals Row */}
              <TableRow className="bg-muted font-semibold">
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell>{totals.registeredNumbers}</TableCell>
                <TableCell>${totals.revenue.toFixed(2)}</TableCell>
                <TableCell>${totals.betAmount.toFixed(2)}</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
