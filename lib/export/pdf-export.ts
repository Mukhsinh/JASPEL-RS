import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCompanyInfo, getSetting } from '@/lib/services/settings.service'

interface IncentiveSlipData {
  period: string
  employeeCode: string
  employeeName: string
  unit: string
  taxStatus: string
  p1Score: number
  p2Score: number
  p3Score: number
  p1Weighted: number
  p2Weighted: number
  p3Weighted: number
  finalScore: number
  grossIncentive: number
  taxAmount: number
  netIncentive: number
  indicators?: Array<{
    category: string
    name: string
    target: number
    realization: number
    achievement: number
    score: number
  }>
}

interface ReportExportOptions {
  reportType: string
  period: string
  data: any[]
}

/**
 * Helper to add professional Kop Surat (Header) to PDF
 */
async function addKopSurat(doc: jsPDF, companyInfo: any) {
  // Header background (optional light gray)
  // doc.setFillColor(245, 245, 245)
  // doc.rect(0, 0, 210, 40, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(companyInfo.name || 'JASPEL ENTERPRISE', 105, 15, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(companyInfo.address || 'Jakarta, Indonesia', 105, 22, { align: 'center' })

  doc.setLineWidth(0.5)
  doc.line(15, 27, 195, 27)
  doc.line(15, 28, 195, 28) // Double line effect
}

/**
 * Generate incentive slip PDF
 */
export async function generateIncentiveSlipPDF(data: IncentiveSlipData): Promise<Uint8Array> {
  const doc = new jsPDF()
  const companyInfo = await getCompanyInfo()
  const footerSetting = await getSetting('footer')
  const footerText = footerSetting?.data?.text || 'Laporan dihasilkan secara otomatis oleh JASPEL System'

  await addKopSurat(doc, companyInfo)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('SLIP INSENTIF KINERJA (JASPEL)', 105, 40, { align: 'center' })

  // Employee Info
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Periode: ${data.period}`, 15, 50)
  doc.text(`Nama: ${data.employeeName}`, 15, 55)
  doc.text(`NIP/NIK: ${data.employeeCode}`, 15, 60)
  doc.text(`Unit: ${data.unit}`, 15, 65)

  // Summary Table
  autoTable(doc, {
    startY: 75,
    head: [['Komponen', 'Skor', 'Bobot', 'Nilai Tertimbang']],
    body: [
      ['P1 (Kinerja Utama)', data.p1Score.toFixed(2), '60%', data.p1Weighted.toFixed(2)],
      ['P2 (Kinerja Tambahan)', data.p2Score.toFixed(2), '30%', data.p2Weighted.toFixed(2)],
      ['P3 (Perilaku)', data.p3Score.toFixed(2), '10%', data.p3Weighted.toFixed(2)],
      [{ content: 'Total Skor Akhir', styles: { fontStyle: 'bold' } }, '-', '-', { content: data.finalScore.toFixed(2), styles: { fontStyle: 'bold' } }],
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
  })

  // Financial Summary
  const lastY = (doc as any).lastAutoTable.finalY + 10
  doc.setFont('helvetica', 'bold')
  doc.text('PERHITUNGAN INSENTIF', 15, lastY)

  doc.setFont('helvetica', 'normal')
  doc.text(`Insentif Bruto: Rp ${data.grossIncentive.toLocaleString('id-ID')}`, 15, lastY + 7)
  doc.text(`Pajak (${data.taxStatus}): Rp ${data.taxAmount.toLocaleString('id-ID')}`, 15, lastY + 14)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Insentif Neto: Rp ${data.netIncentive.toLocaleString('id-ID')}`, 15, lastY + 24)

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(footerText, 105, pageHeight - 15, { align: 'center' })

  return new Uint8Array(doc.output('arraybuffer'))
}

/**
 * Generate summary report PDF
 */
export async function generateSummaryReportPDF(
  results: Array<{
    employeeCode: string
    employeeName: string
    unit: string
    finalScore: number
    grossIncentive: number
    taxAmount: number
    netIncentive: number
  }>,
  period: string
): Promise<Uint8Array> {
  const doc = new jsPDF('landscape')
  const companyInfo = await getCompanyInfo()

  await addKopSurat(doc, companyInfo)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`LAPORAN REKAPITULASI PEMBAYARAN JASPEL - PERIODE ${period}`, 148, 40, { align: 'center' })

  autoTable(doc, {
    startY: 50,
    head: [['No', 'NIP/NIK', 'Nama Pegawai', 'Unit', 'Skor Akhir', 'Insentif Bruto', 'Pajak', 'Insentif Neto']],
    body: results.map((r, i) => [
      i + 1,
      r.employeeCode,
      r.employeeName,
      r.unit,
      r.finalScore.toFixed(2),
      r.grossIncentive.toLocaleString('id-ID'),
      r.taxAmount.toLocaleString('id-ID'),
      r.netIncentive.toLocaleString('id-ID')
    ]),
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    styles: { fontSize: 9 }
  })

  return new Uint8Array(doc.output('arraybuffer'))
}

/**
 * Export report to PDF
 */
export async function exportToPDF(options: ReportExportOptions): Promise<Uint8Array> {
  if (options.reportType === 'incentive-slip') {
    if (options.data.length > 0) {
      return await generateIncentiveSlipPDF(options.data[0])
    }
    throw new Error('No data available for incentive slip')
  } else {
    return await generateSummaryReportPDF(options.data, options.period)
  }
}