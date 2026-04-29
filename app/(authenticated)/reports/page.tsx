'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, TrendingUp, Building2, IdCard, FileSpreadsheet, FileDown } from 'lucide-react'

type ReportType = 'incentive' | 'kpi-achievement' | 'unit-comparison' | 'employee-slip'

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const downloadMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setShowDownloadMenu(false)
      }
    }

    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDownloadMenu])

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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Laporan</h1>
        <p className="text-gray-600 mt-2">Buat dan ekspor berbagai laporan</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((report) => {
          const Icon = report.icon
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
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pilih Periode</label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border rounded-md w-full max-w-xs"
            />
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

      {/* Report Preview */}
      {reportData && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Pratinjau Laporan</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left font-semibold">NIP/NIK</th>
                  <th className="border p-2 text-left font-semibold">NAMA PEGAWAI</th>
                  <th className="border p-2 text-left font-semibold">UNIT</th>
                  <th className="border p-2 text-right font-semibold">P1</th>
                  <th className="border p-2 text-right font-semibold">P2</th>
                  <th className="border p-2 text-right font-semibold">P3</th>
                  <th className="border p-2 text-right font-semibold">TOTAL SKOR</th>
                  <th className="border p-2 text-right font-semibold">GROSS INSENTIF</th>
                  <th className="border p-2 text-right font-semibold">PAJAK</th>
                  <th className="border p-2 text-right font-semibold">NET INSENTIF</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border p-2">{row.employee_code || '-'}</td>
                    <td className="border p-2 font-medium">{row.employee_name}</td>
                    <td className="border p-2">{row.unit}</td>
                    <td className="border p-2 text-right">{row.p1_score}</td>
                    <td className="border p-2 text-right">{row.p2_score}</td>
                    <td className="border p-2 text-right">{row.p3_score}</td>
                    <td className="border p-2 text-right font-bold text-blue-700">{row.total_score}</td>
                    <td className="border p-2 text-right font-medium">
                      {(parseFloat(row.gross_incentive) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border p-2 text-right text-red-600">
                      {(parseFloat(row.tax_amount) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border p-2 text-right font-bold text-green-700">
                      {(parseFloat(row.net_incentive) || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
