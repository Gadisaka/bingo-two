"use client";

import { useEffect, useState } from "react";
// @ts-ignore - Prisma type import issue
import { Report } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";
import ReportTable from "@/components/ReportTable";
import AgentIncomeTable from "@/components/AgentIncomeTable";
import AgentIncomeSummary from "@/components/AgentIncomeSummary";
import SalesSummary from "@/components/SalesSummary";
import DateRangePicker from "@/components/DateRangePicker";
import SearchFilter from "@/components/SearchFilter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [agentIncomes, setAgentIncomes] = useState<AgentIncome[]>([]);
  const [totals, setTotals] = useState<Totals>({
    dailyIncome: 0,
    weeklyIncome: 0,
    monthlyIncome: 0,
    totalIncome: 0,
    totalRevenue: 0,
    totalBetAmount: 0,
    totalRegisteredNumbers: 0,
  });
  const [salesTotals, setSalesTotals] = useState({
    totalCall: 0,
    registeredNumbers: 0,
    revenue: 0,
    betAmount: 0,
    totalBet: 0,
    cashierCommission: 0,
    agentCommission: 0,
    adminCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });
  const [activeTab, setActiveTab] = useState("agent-income");

  const fetchReports = async (page = 1, search = "", range = dateRange) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        search,
        from: range.from || "",
        to: range.to || "",
      }).toString();

      const res = await fetch(`/api/reports?${query}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Reports API error:", res.status, errorText);
        toast.error(`Failed to fetch reports: ${res.status}`);
        setReports([]);
        setTotalPages(1);
        setCurrentPage(1);
        return;
      }

      const data = await res.json();
      console.log("Reports data received:", data);

      if (data.reports && Array.isArray(data.reports)) {
        setReports(data.reports);
        setTotalPages(data.pagination?.totalPages || 1);
        setCurrentPage(data.pagination?.page || 1);

        // Set sales totals if available
        if (data.sums) {
          setSalesTotals({
            totalCall: data.sums.totalCall || 0,
            registeredNumbers: data.sums.registeredNumbers || 0,
            revenue: data.sums.revenue || 0,
            betAmount: data.sums.betAmount || 0,
            totalBet: data.sums.totalBet || 0,
            cashierCommission: data.sums.cashierCommission || 0,
            agentCommission: data.sums.agentCommission || 0,
            adminCommission: data.sums.adminCommission || 0,
          });
        }
      } else {
        console.error("Invalid reports data:", data);
        toast.error("Invalid reports data received");
        setReports([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      toast.error("Failed to fetch reports");
      setReports([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentIncomes = async (search = "", range = dateRange) => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        from: range.from || "",
        to: range.to || "",
      }).toString();

      const res = await fetch(`/api/reports/agent-income?${query}`);

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Agent income API error:", res.status, errorText);
        toast.error(`Failed to fetch agent income: ${res.status}`);
        setAgentIncomes([]);
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
      console.log("Agent income data received:", data);

      if (data.agents && Array.isArray(data.agents)) {
        setAgentIncomes(data.agents);
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
        console.error("Invalid agent income data:", data);
        toast.error("Invalid agent income data received");
        setAgentIncomes([]);
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
      console.error("Error fetching agent income:", err);
      toast.error("Failed to fetch agent income");
      setAgentIncomes([]);
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
    if (activeTab === "agent-income") {
      fetchAgentIncomes();
    } else {
      fetchReports();
    }
  }, [activeTab]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (activeTab === "agent-income") {
      fetchAgentIncomes(term);
    } else {
      fetchReports(1, term);
    }
  };

  const handlePageChange = (page: number) => {
    if (activeTab === "sales") {
      fetchReports(page, searchTerm);
    }
  };

  const handleDateChange = (range: { from: string; to: string }) => {
    setDateRange(range);
    if (activeTab === "agent-income") {
      fetchAgentIncomes(searchTerm, range);
    } else {
      fetchReports(1, searchTerm, range);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchTerm("");
    setCurrentPage(1);
    setDateRange({ from: "", to: "" });

    // Reset data when switching tabs
    if (value === "agent-income") {
      setReports([]);
      setSalesTotals({
        totalCall: 0,
        registeredNumbers: 0,
        revenue: 0,
        betAmount: 0,
        totalBet: 0,
        cashierCommission: 0,
        agentCommission: 0,
        adminCommission: 0,
      });
    } else {
      setAgentIncomes([]);
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
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Report Management</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agent-income">Agent Income Reports</TabsTrigger>
          <TabsTrigger value="sales">Sales Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="agent-income" className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <SearchFilter
              placeholder="Search by agent name or phone..."
              onSearch={handleSearch}
            />
            <DateRangePicker onChange={handleDateChange} />
          </div>

          {/* <AgentIncomeSummary
            totals={totals}
            onRefresh={() => fetchAgentIncomes(searchTerm, dateRange)}
            loading={loading}
          /> */}
          <AgentIncomeTable
            agents={agentIncomes}
            totals={totals}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <SearchFilter
              placeholder="Search by agent/cashier phone..."
              onSearch={handleSearch}
            />
            <DateRangePicker onChange={handleDateChange} />
          </div>
          {/* 
          <SalesSummary
            totals={salesTotals}
            onRefresh={() => fetchReports(currentPage, searchTerm, dateRange)}
            loading={loading}
          /> */}
          <ReportTable reports={reports} loading={loading} />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
