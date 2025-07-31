export type ReportData = {
  totalCall: number;
  registeredNumbers: number;
  revenue: number;
  betAmount: number;
  date: string | Date;
  status?: string;
  walletDeduction?: number;
};

export async function createReport(reportData: ReportData) {
  const response = await fetch("/api/reports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reportData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Failed to create report" }));
    throw new Error(errorData.error || "Failed to create report");
  }

  return response.json();
}
