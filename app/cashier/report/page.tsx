"use client";

import { useEffect, useState } from "react";
// @ts-ignore - Prisma type import issue
import { Report } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";
import ReportTable from "@/components/ReportTable";
import DateRangePicker from "@/components/DateRangePicker";
import SearchFilter from "@/components/SearchFilter";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: "",
    to: "",
  });

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

  useEffect(() => {
    fetchReports();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchReports(1, term);
  };

  const handlePageChange = (page: number) => {
    fetchReports(page, searchTerm);
  };

  const handleDateChange = (range: { from: string; to: string }) => {
    setDateRange(range);
    fetchReports(1, searchTerm, range);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold">Report Management</h1>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <SearchFilter
          placeholder="Search by agent/cashier phone..."
          onSearch={handleSearch}
        />
        <DateRangePicker onChange={handleDateChange} />
      </div>

      <ReportTable reports={reports} loading={loading} />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
