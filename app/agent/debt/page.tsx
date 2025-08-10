"use client";

import { useEffect, useState } from "react";

interface DebtData {
  agentId: number;
  agentName: string;
  debtBalance: number;
  walletBalance: number;
  autoLock: boolean;
  adminPercentage: number;
}

export default function AgentDebtPage() {
  const [data, setData] = useState<DebtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meRes.ok) throw new Error("Unauthorized");
        const me = await meRes.json();
        const id = me?.user?.id;
        const res = await fetch(`/api/agents/${id}/debt`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch debt");
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-xl p-6 space-y-3">
      <h1 className="text-xl font-semibold">Agent Debt</h1>
      <div className="flex justify-between">
        <span>Name</span>
        <span>{data.agentName}</span>
      </div>
      <div className="flex justify-between">
        <span>Wallet</span>
        <span>${data.walletBalance.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Debt</span>
        <span className="text-yellow-700">${data.debtBalance.toFixed(2)}</span>
      </div>
      <div className="flex justify-between">
        <span>Auto Lock</span>
        <span>{data.autoLock ? "Enabled" : "Disabled"}</span>
      </div>
      <div className="flex justify-between">
        <span>Admin %</span>
        <span>{data.adminPercentage}%</span>
      </div>
    </div>
  );
}
