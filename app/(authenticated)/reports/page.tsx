'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, TrendingUp, Building2, IdCard, FileSpreadsheet, FileDown, BarChart2, ClipboardCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts'

type ReportType = 'incentive' | 'kpi-achievement' | 'unit-comparison' | 'employee-slip'

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('all')
  const [selectedEmployee, setSelectedEmployee] = useState('all')
  const [detailLevel, setDetailLevel] = useState<'summary' | 'detail'>('summary')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [availableUnits, setAvailableUnits] = useState<any[]>([])
  const [availableEmployees, setAvailableEmployees] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const downloadMenuRef = useRef<HTMLDivElement>(null)

  // Fetch units and employees
  useEffect(() => {
    setIsMounted(true)
    const fetchData = async () => {
      const respUnits = await fetch('/api/reports/generate/metadata?type=units')
      const units = await respUnits.json()
      setAvailableUnits(units.data || [])

      const respEmployees = await fetch('/api/reports/generate/metadata?type=employees')
      const employees = await respEmployees.json()
      setAvailableEmployees(employees.data || [])
    }
    fetchData()
  }, [])

  const reportTypes = [
    {
      id: 'incentive' as ReportType,
      title: 'Laporan Insentif',
      description: 'Distribusi insentif detail dengan skor P1, P2, P3',
      icon: FileText,
      color: 'text-blue-600',
    },
    {
      id: 'kpi-achievement' as ReportType,
      title: 'Laporan Pencapaian KPI',
      description: 'Realisasi KPI dan persentase pencapaian',
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      id: 'unit-comparison' as ReportType,
      title: 'Laporan Perbandingan Unit',
      description: 'Bandingkan kinerja antar unit',
      icon: Building2,
      color: 'text-purple-600',
    },
    {
      id: 'employee-slip' as ReportType,
      title: 'Slip Pegawai',
      description: 'Slip insentif pegawai individual',
      icon: IdCard,
      color: 'text-orange-600',
    },
  ]

  const handleGenerateReport = async () => {
    if (!selectedReport || !selectedPeriod) {
      setError('Pilih jenis laporan dan periode')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedReport,
          period: selectedPeriod,
          unitId: selectedUnit === 'all' ? null : selectedUnit,
          employeeId: selectedEmployee === 'all' ? null : selectedEmployee,
          detailLevel
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat laporan')
      }

      if (data.data && data.data.length === 0) {
        setError(`Tidak ada data untuk periode ${selectedPeriod}`)
        setReportData(null)
      } else {
        setReportData(data.data)
        setError(null)
      }
    } catch (err) {
      setError((err as Error).message)
      setReportData(null)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadGuide = async () => {
    try {
      const selectedUnitName = selectedUnit === 'all'
        ? 'Seluruh Unit'
        : availableUnits.find(u => u.id === selectedUnit)?.name || 'Unit'

      const response = await fetch('/api/reports/assessment-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitName: selectedUnitName }),
      })

      if (!response.ok) throw new Error('Gagal mengunduh petunjuk')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Petunjuk_Penilaian_${selectedUnitName.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (!reportData || !selectedReport || !selectedPeriod) return

    setShowDownloadMenu(false)

    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: selectedReport,
          period: selectedPeriod,
          format,
          data: reportData,
        }),
      })

      if (!response.ok) {
        throw new Error('Ekspor gagal')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedReport}-${selectedPeriod}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  if (!isMounted) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Laporan</h1>
          <p className="text-gray-600 mt-2">Buat dan ekspor berbagai laporan</p>
        </div>
        <Button
          onClick={handleDownloadGuide}
          variant="outline"
          className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          <ClipboardCheck className="w-4 h-4" />
          Unduh Petunjuk Penilaian
        </Button>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon || FileText
          return (
            <Card
              key={report.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-lg ${selectedReport === report.id
                ? 'ring-2 ring-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
                }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-6 h-6 ${report.color}`} />
                <div className="flex-1">
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Period Selection and Generate */}
      {selectedReport && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pilih Periode</label>
                <input
                  type="month"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 border rounded-md w-full"
                />
              </div>

              {selectedReport !== 'unit-comparison' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Kerja</label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => {
                      setSelectedUnit(e.target.value)
                      setSelectedEmployee('all')
                    }}
                    className="px-3 py-2 border rounded-md w-full"
                  >
                    <option value="all">Semua Unit</option>
                    {availableUnits.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedReport !== 'unit-comparison' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Cari & Pilih Pegawai</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Cari nama..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm w-full"
                    />
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm w-full"
                    >
                      <option value="all">Semua Pegawai</option>
                      {availableEmployees
                        .filter(e => (selectedUnit === 'all' || e.unit_id === selectedUnit) &&
                          (searchTerm === '' || e.full_name.toLowerCase().includes(searchTerm.toLowerCase())))
                        .map(e => (
                          <option key={e.id} value={e.id}>{e.full_name} ({e.employee_code || '-'})</option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {selectedReport === 'kpi-achievement' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Level Detail</label>
                  <select
                    value={detailLevel}
                    onChange={(e) => setDetailLevel(e.target.value as any)}
                    className="px-3 py-2 border rounded-md w-full"
                  >
                    <option value="summary">Ringkasan (Rekap)</option>
                    <option value="detail">Detail (Sub-Indikator)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleGenerateReport}
                disabled={!selectedReport || !selectedPeriod || isGenerating}
              >
                {isGenerating ? 'Membuat Laporan...' : 'Buat Laporan'}
              </Button>

              {reportData && (
                <div className="relative" ref={downloadMenuRef}>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Unduh Laporan
                  </Button>

                  {showDownloadMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left rounded-t-lg"
                      >
                        <FileDown className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium text-sm">Format PDF</div>
                          <div className="text-xs text-gray-500">Unduh sebagai PDF</div>
                        </div>
                      </button>
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={() => handleExport('excel')}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left rounded-b-lg"
                      >
                        <FileSpreadsheet className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-medium text-sm">Format Excel</div>
                          <div className="text-xs text-gray-500">Unduh sebagai XLSX</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                {error}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Report Chart (Optional for Comparison) */}
      {selectedReport === 'unit-comparison' && reportData && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-purple-700 flex items-center gap-2">
            {BarChart2 ? <BarChart2 className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            Statistik Performa Unit
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportData.map((row: any, idx: number) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 transition-hover hover:shadow-md">
                <div className="text-sm text-gray-500">{row.unit_name}</div>
                <div className="text-2xl font-bold text-blue-600">{row.average_score}</div>
                <div className="text-xs text-gray-400 mt-1">{row.employee_count} Pegawai</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Report Preview */}
      {reportData && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Pratinjau Laporan</h2>
          <div className="overflow-x-auto">
            {selectedReport === 'incentive' || selectedReport === 'employee-slip' ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left font-semibold">NIP/NIK</th>
                    <th className="border p-2 text-left font-semibold">NIK</th>
                    <th className="border p-2 text-left font-semibold">NAMA PEGAWAI</th>
                    <th className="border p-2 text-left font-semibold">UNIT</th>
                    <th className="border p-2 text-left font-semibold">BANK</th>
                    <th className="border p-2 text-right font-semibold">P1</th>
                    <th className="border p-2 text-right font-semibold">P2</th>
                    <th className="border p-2 text-right font-semibold">P3</th>
                    <th className="border p-2 text-right font-semibold">SKOR</th>
                    <th className="border p-2 text-right font-semibold">PIR</th>
                    <th className="border p-2 text-right font-semibold">GROSS</th>
                    <th className="border p-2 text-right font-semibold">PAJAK</th>
                    <th className="border p-2 text-right font-semibold">NET</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2 whitespace-nowrap">{row.employee_code || '-'}</td>
                      <td className="border p-2 whitespace-nowrap">{row.nik || '-'}</td>
                      <td className="border p-2 font-medium min-w-[150px]">{row.employee_name}</td>
                      <td className="border p-2 whitespace-nowrap">{row.unit}</td>
                      <td className="border p-2 text-xs">
                        <div className="font-semibold">{row.bank_name || '-'}</div>
                        <div className="text-gray-500">{row.bank_account_number || '-'}</div>
                      </td>
                      <td className="border p-2 text-right">{(parseFloat(row.p1_score) || 0).toFixed(2)}</td>
                      <td className="border p-2 text-right">{(parseFloat(row.p2_score) || 0).toFixed(2)}</td>
                      <td className="border p-2 text-right">{(parseFloat(row.p3_score) || 0).toFixed(2)}</td>
                      <td className="border p-2 text-right font-bold text-blue-700">{(parseFloat(row.total_score) || 0).toFixed(2)}</td>
                      <td className="border p-2 text-right whitespace-nowrap text-purple-600">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(row.pir_value) || 0)}
                      </td>
                      <td className="border p-2 text-right whitespace-nowrap">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(row.gross_incentive) || 0)}
                      </td>
                      <td className="border p-2 text-right whitespace-nowrap text-red-600">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(row.tax_amount) || 0)}
                      </td>
                      <td className="border p-2 text-right font-bold text-green-700 whitespace-nowrap">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(row.net_incentive) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : selectedReport === 'unit-comparison' ? (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left font-semibold">UNIT</th>
                    <th className="border p-2 text-right font-semibold">RATA-RATA SKOR</th>
                    <th className="border p-2 text-right font-semibold">TOTAL INSENTIF</th>
                    <th className="border p-2 text-right font-semibold">JUMLAH PEGAWAI</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium">{row.unit_name}</td>
                      <td className="border p-2 text-right font-bold text-blue-700">{row.average_score}</td>
                      <td className="border p-2 text-right font-bold text-green-700">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(row.total_incentive) || 0)}
                      </td>
                      <td className="border p-2 text-right">{row.employee_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left font-semibold">NAMA</th>
                    <th className="border p-2 text-left font-semibold">INDIKATOR</th>
                    <th className="border p-2 text-right font-semibold">BOBOT</th>
                    <th className="border p-2 text-right font-semibold">PENCAPAIAN</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-2 font-medium">{row.employee_name || row.unit_name}</td>
                      <td className="border p-2">{row.indicator}</td>
                      <td className="border p-2 text-right">{row.weight}</td>
                      <td className="border p-2 text-right font-bold text-blue-700">{row.achievement_percentage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
