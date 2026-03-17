'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar, Filter, Download } from 'lucide-react'

interface DashboardFiltersProps {
  onFilterChange?: (filters: FilterState) => void
  showUnitFilter?: boolean
  showPeriodFilter?: boolean
  showExport?: boolean
}

export interface FilterState {
  period: string
  unit?: string
  year: string
}

export function DashboardFilters({ 
  onFilterChange, 
  showUnitFilter = false,
  showPeriodFilter = true,
  showExport = true
}: DashboardFiltersProps) {
  const currentYear = new Date().getFullYear()
  const [filters, setFilters] = useState<FilterState>({
    period: 'month',
    year: currentYear.toString(),
    unit: 'all'
  })

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
          </div>

          {showPeriodFilter && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <select
                value={filters.period}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">Minggu Ini</option>
                <option value="month">Bulan Ini</option>
                <option value="quarter">Kuartal Ini</option>
                <option value="year">Tahun Ini</option>
                <option value="custom">Kustom</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {showUnitFilter && (
            <div className="flex items-center gap-2">
              <select
                value={filters.unit}
                onChange={(e) => handleFilterChange('unit', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Unit</option>
                {/* Unit options will be populated dynamically */}
              </select>
            </div>
          )}

          {showExport && (
            <Button variant="outline" size="sm" className="ml-auto">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
