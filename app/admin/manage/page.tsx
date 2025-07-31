// app/agents/page.tsx
"use client";

import { useEffect, useState } from "react";
// @ts-ignore - Prisma type import issue
import { Agent } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Pagination from "@/components/Pagination";
import AgentTable from "@/components/AgentTable";
import CreateAgentModal from "@/components/CreateAgentModal";
import SearchFilter from "@/components/SearchFilter";
import { useAuth } from "@/components/AuthContext";

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  const fetchAgents = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/agents?page=${page}&search=${search}`);
      const data = await res.json();
      setAgents(data.agents);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } catch (error) {
      toast.error("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    fetchAgents(1, term); // Reset to page 1 when searching
  };

  const handlePageChange = (page: number) => {
    fetchAgents(page, searchTerm);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchAgents(currentPage, searchTerm);
  };

  return (
    <div className="">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Agent Management</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Agent
        </Button>
      </div>

      <div className="mb-6">
        <SearchFilter
          placeholder="Search by phone..."
          onSearch={(e) => handleSearch(e)}
        />
      </div>

      <AgentTable
        agents={agents}
        loading={loading}
        onRefresh={() => fetchAgents(currentPage, searchTerm)}
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

      <CreateAgentModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        adminId={user?.id ?? 0}
      />
    </div>
  );
}
