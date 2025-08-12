"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import CashierIncomeTable from "@/components/CashierIncomeTable";
import DateRangePicker from "@/components/DateRangePicker";
import SearchFilter from "@/components/SearchFilter";

interface CashierIncome {
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

export default function ReportsPage() {
  const [cashiers, setCashiers] = useState<CashierIncome[]>([]);
  const [totals, setTotals] = useState<Totals>({
    dailyIncome: 0,
    weeklyIncome: 0,
    monthlyIncome: 0,
    totalIncome: 0,
    totalRevenue: 0,
    totalBetAmount: 0,
    totalRegisteredNumbers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });

  const fetchCashierIncomes = async (search = "", range = dateRange) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        from: range.from || "",
        to: range.to || "",
      }).toString();

      const res = await fetch(`/api/reports/cashier-income?${query}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Cashier income API error:", res.status, errorText);
        toast.error(`Failed to fetch cashier income: ${res.status}`);
        setCashiers([]);
        setTotals({
          dailyIncome: 0,
          weeklyIncome: 0,
          monthlyIncome: 0,
          totalIncome: 0,
          totalRevenue: 0,
          totalBetAmount: 0,
          totalRegisteredNumbers: 0,
        });
        return;
      }

      const data = await res.json();
      console.log("Cashier income data received:", data);

      if (data.cashiers && Array.isArray(data.cashiers)) {
        setCashiers(data.cashiers);
        setTotals(
          data.totals || {
            dailyIncome: 0,
            weeklyIncome: 0,
            monthlyIncome: 0,
            totalIncome: 0,
            totalRevenue: 0,
            totalBetAmount: 0,
            totalRegisteredNumbers: 0,
          }
        );
      } else {
        console.error("Invalid cashier income data:", data);
        toast.error("Invalid cashier income data received");
        setCashiers([]);
        setTotals({
          dailyIncome: 0,
          weeklyIncome: 0,
          monthlyIncome: 0,
          totalIncome: 0,
          totalRevenue: 0,
          totalBetAmount: 0,
          totalRegisteredNumbers: 0,
        });
      }
    } catch (err) {
      console.error("Error fetching cashier income:", err);
      toast.error("Failed to fetch cashier income");
      setCashiers([]);
      setTotals({
        dailyIncome: 0,
        weeklyIncome: 0,
        monthlyIncome: 0,
        totalIncome: 0,
        totalRevenue: 0,
        totalBetAmount: 0,
        totalRegisteredNumbers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashierIncomes();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchCashierIncomes(term);
  };

  const handleDateChange = (range: { from: string; to: string }) => {
    setDateRange(range);
    fetchCashierIncomes(searchTerm, range);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Cashier Income Reports</h1>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <SearchFilter
          placeholder="Search by cashier name or phone..."
          onSearch={handleSearch}
        />
        <DateRangePicker onChange={handleDateChange} />
      </div>

      <CashierIncomeTable
        cashiers={cashiers}
        totals={totals}
        loading={loading}
      />
    </div>
  );
}
