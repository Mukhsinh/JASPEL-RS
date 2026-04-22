'use client'

import { useState, memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Power, PowerOff, Plus, Download, Upload, FileSpreadsheet, FileText } from 'lucide-react'
import { UnitFormDialog } from './UnitFormDialog'
import { DeleteUnitDialog } from './DeleteUnitDialog'
import { createClient } from '@/lib/supabase/client'

interface Unit {
  id: string
  code: string
  name: string
  proportion_percentage: number
  is_active: boolean
  employees?: { count: number }[]
}

interface UnitTableProps {
  units: Unit[]
}

export const UnitTable = memo(function UnitTable({ units }: UnitTableProps) {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleAdd = () => {
    setSelectedUnit(null)
    setIsFormOpen(true)
  }

  const handleEdit = (unit: Unit) => {
    setSelectedUnit(unit)
    setIsFormOpen(true)
  }

  const handleDelete = (unit: Unit) => {
    setSelectedUnit(unit)
    setIsDeleteOpen(true)
  }

  const handleToggleActive = async (unit: Unit) => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('m_units')
        .update({
          is_active: !unit.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', unit.id)

      if (error) throw error

      // Refresh the page to show updated data
      window.location.reload()
    } catch (err) {
      console.error('Error toggling unit status:', err)
    }
  }

  const getEmployeeCount = (unit: Unit) => {
    return unit.employees?.[0]?.count || 0
  }

  const handleDownloadTemplate = () => {
    window.open('/api/units/template', '_blank')
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/units/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Import berhasil!\nBerhasil: ${result.success}\nGagal: ${result.failed}${result.errors.length > 0 ? '\n\nError:\n' + result.errors.join('\n') : ''}`)
        window.location.reload()
      } else {
        alert(`Import gagal: ${result.error}`)
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Terjadi kesalahan saat import')
    }

    // Reset input
    event.target.value = ''
  }

  const handleDownloadReport = (format: 'excel' | 'pdf') => {
    window.open(`/api/units/export?format=${format}`, '_blank')
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadTemplate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Unduh Template
          </Button>

          <Button
            onClick={() => document.getElementById('import-units')?.click()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
          <input
            id="import-units"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />

          <Button
            onClick={() => handleDownloadReport('excel')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Unduh Excel
          </Button>

          <Button
            onClick={() => handleDownloadReport('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <FileText className="mr-2 h-4 w-4" />
            Unduh PDF
          </Button>
        </div>

        <Button
          onClick={handleAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Unit
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode Unit</TableHead>
              <TableHead>Nama Unit</TableHead>
              <TableHead>Proporsi (%)</TableHead>
              <TableHead>Pegawai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-500">
                  Tidak ada unit ditemukan
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-medium">{unit.code}</TableCell>
                  <TableCell>{unit.name}</TableCell>
                  <TableCell>{unit.proportion_percentage.toFixed(2)}%</TableCell>
                  <TableCell>{getEmployeeCount(unit)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${unit.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {unit.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(unit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(unit)}
                      >
                        {unit.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(unit)}
                        disabled={getEmployeeCount(unit) > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UnitFormDialog
        unit={selectedUnit}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />

      <DeleteUnitDialog
        unit={selectedUnit}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  )
})
