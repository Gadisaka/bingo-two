// components/SearchFilter.tsx
'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useState, KeyboardEvent } from 'react'

interface SearchFilterProps {
  placeholder?: string
  onSearch: (term: string) => void
  className?: string
}

export default function SearchFilter({ 
  placeholder = 'Search...', 
  onSearch,
  className = ''
}: SearchFilterProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex-1">
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <Button 
        onClick={handleSearch}
        variant="outline"
        size="sm"
        disabled={!searchTerm.trim()}
      >
        Search
      </Button>
    </div>
  )
}