'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface UnitPerformance {
  id: string
  name: string
  employeeCount: number
  avgScore: number
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  status: 'excellent' | 'good' | 'average' | 'poor'
}

interface UnitPerformanceTableProps {
  units: UnitPerformance[]
}

const statusColors = {
  excellent: 'bg-green-100 text-green-800',
  good: 'bg-blue-100 text-blue-800',
  average: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800'
}

const statusLabels = {
  excellent: 'Sangat Baik',
  good: 'Baik',
  average: 'Cukup',
  poor: 'Perlu Perbaikan'
}

export function UnitPerformanceTable({ units }: UnitPerformanceTableProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performa Unit</CardTitle>
        <CardDescription>Ringkasan performa per unit organisasi</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit</TableHead>
              <TableHead className="text-center">Jumlah Pegawai</TableHead>
              <TableHead className="text-center">Rata-rata Skor</TableHead>
              <TableHead className="text-center">Tren</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  Belum ada data unit
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.name}</TableCell>
                  <TableCell className="text-center">{unit.employeeCount}</TableCell>
                  <TableCell className="text-center font-bold">{unit.avgScore.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(unit.trend)}
                      <span className="text-sm">{unit.trendValue}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={statusColors[unit.status]}>
                      {statusLabels[unit.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
