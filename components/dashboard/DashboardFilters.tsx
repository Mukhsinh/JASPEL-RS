'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar, Filter, Download } from 'lucide-react'

interface DashboardFiltersProps {
  onFilterChange?: (filters: FilterState) => void
  showUnitFilter?: boolean
  showPeriodFilter?: boolean
  showExport?: boolean
  units?: Array<{ id: string, name: string }>
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
  showExport = true,
  units = []
}: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentYear = new Date().getFullYear()

  const currentUnit = searchParams.get('unit_id') || 'all'
  const currentYearVal = searchParams.get('year') || currentYear.toString()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || !value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`?${params.toString()}`)
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
                value={searchParams.get('period') || 'month'}
                onChange={(e) => handleFilterChange('period', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Bulan">
                  <option value="M-01">Januari</option>
                  <option value="M-02">Februari</option>
                  <option value="M-03">Maret</option>
                  <option value="M-04">April</option>
                  <option value="M-05">Mei</option>
                  <option value="M-06">Juni</option>
                  <option value="M-07">Juli</option>
                  <option value="M-08">Agustus</option>
                  <option value="M-09">September</option>
                  <option value="M-10">Oktober</option>
                  <option value="M-11">November</option>
                  <option value="M-12">Desember</option>
                </optgroup>
                <optgroup label="Kuartal">
                  <option value="Q-1">Kuartal 1</option>
                  <option value="Q-2">Kuartal 2</option>
                  <option value="Q-3">Kuartal 3</option>
                  <option value="Q-4">Kuartal 4</option>
                </optgroup>
                <optgroup label="Semester">
                  <option value="S-1">Semester 1</option>
                  <option value="S-2">Semester 2</option>
                </optgroup>
                <optgroup label="Lainnya">
                  <option value="full-year">Akhir Tahun</option>
                  <option value="month">Bulan Ini</option>
                </optgroup>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <select
              value={currentYearVal}
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
                value={currentUnit}
                onChange={(e) => handleFilterChange('unit_id', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Unit</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
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
