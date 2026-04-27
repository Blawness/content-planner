'use client'

import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FORMAT_OPTIONS, STATUS_OPTIONS } from './constants'

interface FilterBarProps {
  searchQuery: string
  statusFilter: string
  formatFilter: string
  totalCount: number
  filteredCount: number
  isFiltering: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onFormatChange: (value: string) => void
  onReset: () => void
}

export function FilterBar({
  searchQuery,
  statusFilter,
  formatFilter,
  totalCount,
  filteredCount,
  isFiltering,
  onSearchChange,
  onStatusChange,
  onFormatChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari topik, headline, atau hook..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Status Dropdown */}
        <Select value={statusFilter || '__all__'} onValueChange={(value) => onStatusChange(value === '__all__' || value === null ? '' : value)}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua Status</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Format Dropdown */}
        <Select value={formatFilter || '__all__'} onValueChange={(value) => onFormatChange(value === '__all__' || value === null ? '' : value)}>
          <SelectTrigger className="w-[180px] h-10">
            <SelectValue placeholder="Semua Format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Semua Format</SelectItem>
            {FORMAT_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filter Badge and Reset */}
        {isFiltering && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {filteredCount} dari {totalCount} item
            </Badge>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReset}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}