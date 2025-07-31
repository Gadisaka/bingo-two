// app/cashiers/page.tsx
"use client";

import { useEffect, useState } from "react";
// @ts-ignore - Prisma type import issue
import { Cashier } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Pagination from "@/components/Pagination";
import CashierTable from "@/components/CashierTable";
import CreateCashierModal from "@/components/CreateCashierModal";
import SearchFilter from "@/components/SearchFilter";

export default function CashiersPage() {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const fetchCashiers = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/cashiers?page=${page}&search=${search}`);
      const data = await res.json();
      setCashiers(data.cashiers);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      toast.error("Failed to fetch cashiers");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCashiers();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchCashiers(1, term); // Reset to page 1 when searching
  };

  const handlePageChange = (page: number) => {
    fetchCashiers(page, searchTerm);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchCashiers(currentPage, searchTerm);
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Cashier Management</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Cashier
        </Button>
      </div>

      <div className="mb-6">
        <SearchFilter
          placeholder="Search by phone..."
          onSearch={handleSearch}
        />
      </div>

      <CashierTable
        cashiers={cashiers}
        loading={loading}
        onRefresh={() => fetchCashiers(currentPage, searchTerm)}
      />

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <CreateCashierModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
