import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getCompanyInfoServer, getSettingServer } from '@/lib/services/settings.server.service'

interface IncentiveSlipData {
  period: string
  employeeCode: string
  nik?: string
  employeeName: string
  unit: string
  taxStatus: string
  employeeStatus?: string
  taxType?: string
  bankName?: string
  bankAccountNumber?: string
  bankAccountHolder?: string
  p1Score: number
  p2Score: number
  p3Score: number
  p1Weighted: number
  p2Weighted: number
  p3Weighted: number
  finalScore: number
  pirValue: number
  totalSkorUnit: number
  unitProportion: number
  grossIncentive: number
  taxAmount: number
  netIncentive: number
}

function checkPageBreak(doc: any, yPos: number, neededHeight: number) {
  if (yPos + neededHeight > doc.internal.pageSize.height - 20) {
    doc.addPage()
    return 20 // Return new Y position
  }
  return yPos
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
  // Add logo if exists
  if (companyInfo.logo) {
    try {
      // Basic image support (base64 or URL)
      if (companyInfo.logo.startsWith('data:image') || companyInfo.logo.startsWith('http')) {
        doc.addImage(companyInfo.logo, 'PNG', 15, 8, 22, 22)
      }
    } catch (e) {
      console.error('Error adding logo to PDF:', e)
    }
  }

  const centerX = doc.internal.pageSize.width / 2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(companyInfo.name || 'JASPEL ENTERPRISE', centerX, 15, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(companyInfo.address || 'Jakarta, Indonesia', centerX, 22, { align: 'center' })

  if (companyInfo.phone || companyInfo.email) {
    const contact = [companyInfo.phone, companyInfo.email].filter(Boolean).join(' | ')
    doc.setFontSize(8)
    doc.text(contact, centerX, 27, { align: 'center' })
  }

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(15, 32, doc.internal.pageSize.width - 15, 32)
  doc.setLineWidth(0.2)
  doc.line(15, 33, doc.internal.pageSize.width - 15, 33)
}

/**
 * Generate incentive slip PDF
 */
export async function generateIncentiveSlipPDF(data: IncentiveSlipData | IncentiveSlipData[]): Promise<Uint8Array> {
  const doc = new jsPDF()
  const companyInfo = await getCompanyInfoServer()
  const footerSetting = await getSettingServer('footer')
  const footerText = footerSetting?.data?.text || 'Laporan dihasilkan secara otomatis oleh JASPEL System'

  const items = Array.isArray(data) ? data : [data]

  for (let i = 0; i < items.length; i++) {
    const slip = items[i]
    if (i > 0) doc.addPage()

    await addKopSurat(doc, companyInfo)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('SLIP INSENTIF KINERJA (JASPEL)', 105, 42, { align: 'center' })

    // Employee Info
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    // Left column
    doc.text(`Periode: ${slip.period || '-'}`, 15, 52)
    doc.text(`Pegawai: ${slip.employeeName}`, 15, 57)
    doc.text(`NIP/NIK: ${slip.employeeCode}`, 15, 62)
    doc.text(`NIK: ${slip.nik || '-'}`, 15, 67)
    doc.text(`Unit: ${slip.unit}`, 15, 72)

    // Right column (Bank Details)
    const rightX = 120
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMASI PEMBAYARAN:', rightX, 52)
    doc.setFont('helvetica', 'normal')
    doc.text(`Nama Bank: ${slip.bankName || '-'}`, rightX, 57)
    doc.text(`No. Rekening: ${slip.bankAccountNumber || '-'}`, rightX, 62)
    doc.text(`Nama Pemilik: ${slip.bankAccountHolder || '-'}`, rightX, 67)

    // Summary Table
    autoTable(doc, {
      startY: 80,
      head: [['Komponen Penilaian', 'Skor', 'Bobot (%)', 'Nilai Tertimbang']],
      body: [
        ['P1 (Kinerja Utama/Posisi)', slip.p1Score.toFixed(2), '55%', slip.p1Weighted.toFixed(2)],
        ['P2 (Kinerja Tambahan)', slip.p2Score.toFixed(2), '25%', slip.p2Weighted.toFixed(2)],
        ['P3 (Perilaku/Potensi)', slip.p3Score.toFixed(2), '20%', slip.p3Weighted.toFixed(2)],
        [{ content: 'Total Skor Akhir', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }, '-', '-', { content: slip.finalScore.toFixed(2), styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 }
    })

    // === RINCIAN PIR (Poin Indeks Rupiah) ===
    let yPos = (doc as any).lastAutoTable.finalY + 8
    doc.setDrawColor(200, 200, 200)
    doc.line(15, yPos - 3, doc.internal.pageSize.width - 15, yPos - 3)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('A. PERHITUNGAN PIR (Poin Indeks Rupiah)', 15, yPos + 1)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    const fmtRp = (val: number) => `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    const fmtNum = (val: number) => val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const allocatedForUnit = slip.pirValue * slip.totalSkorUnit

    yPos += 7
    doc.text(`Formula: PIR = (Alokasi Dana Unit) / Total Skor Seluruh Pegawai di Unit`, 15, yPos)
    yPos += 5
    doc.text(`Proporsi Unit ${slip.unit}`, 20, yPos)
    doc.text(`: ${fmtNum(slip.unitProportion)}%`, 85, yPos)
    yPos += 5
    doc.text(`Total Skor Kolektif Unit`, 20, yPos)
    doc.text(`: ${fmtNum(slip.totalSkorUnit)} poin`, 85, yPos)
    yPos += 5
    doc.text(`Alokasi Dana Unit`, 20, yPos)
    doc.text(`: ${fmtRp(allocatedForUnit)}`, 85, yPos)
    yPos += 6
    doc.setFont('helvetica', 'bold')
    doc.text(`Nilai PIR (per 1 poin)`, 20, yPos)
    doc.text(`: ${fmtRp(slip.pirValue)}`, 85, yPos)
    yPos += 3

    // === PERHITUNGAN INSENTIF BRUTO ===
    yPos = checkPageBreak(doc, yPos, 40)
    yPos += 6
    doc.setDrawColor(220, 220, 220)
    doc.line(15, yPos - 3, doc.internal.pageSize.width - 15, yPos - 3)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('B. PERHITUNGAN INSENTIF BRUTO', 15, yPos + 1)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Formula: Insentif Bruto = Total Skor Individu × PIR`, 15, yPos)
    yPos += 5
    doc.text(`Total Skor Anda`, 20, yPos)
    doc.text(`: ${fmtNum(slip.finalScore)} poin`, 85, yPos)
    yPos += 5
    doc.text(`Nilai PIR`, 20, yPos)
    doc.text(`: ${fmtRp(slip.pirValue)}`, 85, yPos)
    yPos += 6
    doc.setFont('helvetica', 'bold')
    doc.text(`Insentif Bruto`, 20, yPos)
    doc.text(`: ${fmtRp(slip.grossIncentive)}`, 85, yPos)
    yPos += 3

    // === PERHITUNGAN PPh 21 ===
    yPos = checkPageBreak(doc, yPos, 85)
    yPos += 6
    doc.setDrawColor(220, 220, 220)
    doc.line(15, yPos - 3, doc.internal.pageSize.width - 15, yPos - 3)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('C. PERHITUNGAN PPh 21', 15, yPos + 1)
    yPos += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)

    const empStatusRaw = slip.employeeStatus ? slip.employeeStatus.toUpperCase() : '-'
    const empTaxTypeRaw = slip.taxType ? slip.taxType.toUpperCase() : '-'

    if (empStatusRaw === 'ASN' && empTaxTypeRaw === 'FINAL') {
      doc.text(`Status Kepegawaian: ${empStatusRaw} | Jenis Pajak: ${empTaxTypeRaw}`, 15, yPos)
      yPos += 5
      doc.text(`PPh 21 Pegawai ASN dengan status Final: DIKECUALIKAN (0%)`, 20, yPos)
      yPos += 6
      doc.setFont('helvetica', 'bold')
      doc.text(`Potongan PPh 21`, 20, yPos)
      doc.text(`: Rp 0`, 85, yPos)
    } else {
      doc.text(`Status Kepegawaian: ${empStatusRaw === 'ACTIVE' ? 'PEGAWAI AKTIF' : empStatusRaw} | Jenis Pajak: ${empTaxTypeRaw}`, 15, yPos)
      yPos += 5
      doc.text(`PTKP: ${slip.taxStatus}`, 15, yPos)
      yPos += 6

      // Show bracket detail
      doc.text(`Estimasi Penghasilan Bruto Tahunan (Bruto Bulan Ini × 12 bulan):`, 20, yPos)
      yPos += 5
      const annualGross = slip.grossIncentive * 12
      doc.text(`= ${fmtRp(annualGross)} /tahun`, 23, yPos)
      yPos += 6

      doc.text(`Tarif Progresif PPh 21 (UU HPP):`, 20, yPos)
      yPos += 5
      doc.setFontSize(8)
      doc.text(`• s.d. Rp 60.000.000       → 5%`, 23, yPos); yPos += 4
      doc.text(`• Rp 60.000.000 - 250.000.000  → 15%`, 23, yPos); yPos += 4
      doc.text(`• Rp 250.000.000 - 500.000.000 → 25%`, 23, yPos); yPos += 4
      doc.text(`• Di atas Rp 500.000.000       → 30%`, 23, yPos); yPos += 5

      doc.setFontSize(9)
      // Show computed values
      let annualTax = 0
      const lines: string[] = []
      if (annualGross <= 60_000_000) {
        annualTax = annualGross * 0.05
        lines.push(`${fmtRp(annualGross)} × 5% = ${fmtRp(annualTax)}`)
      } else if (annualGross <= 250_000_000) {
        const t1 = 60_000_000 * 0.05
        const t2 = (annualGross - 60_000_000) * 0.15
        annualTax = t1 + t2
        lines.push(`Rp 60.000.000 × 5% = ${fmtRp(t1)}`)
        lines.push(`${fmtRp(annualGross - 60_000_000)} × 15% = ${fmtRp(t2)}`)
      } else if (annualGross <= 500_000_000) {
        const t1 = 60_000_000 * 0.05
        const t2 = 190_000_000 * 0.15
        const t3 = (annualGross - 250_000_000) * 0.25
        annualTax = t1 + t2 + t3
        lines.push(`Rp 60.000.000 × 5% = ${fmtRp(t1)}`)
        lines.push(`Rp 190.000.000 × 15% = ${fmtRp(t2)}`)
        lines.push(`${fmtRp(annualGross - 250_000_000)} × 25% = ${fmtRp(t3)}`)
      } else {
        const t1 = 60_000_000 * 0.05
        const t2 = 190_000_000 * 0.15
        const t3 = 250_000_000 * 0.25
        const t4 = (annualGross - 500_000_000) * 0.30
        annualTax = t1 + t2 + t3 + t4
        lines.push(`Rp 60.000.000 × 5% = ${fmtRp(t1)}`)
        lines.push(`Rp 190.000.000 × 15% = ${fmtRp(t2)}`)
        lines.push(`Rp 250.000.000 × 25% = ${fmtRp(t3)}`)
        lines.push(`${fmtRp(annualGross - 500_000_000)} × 30% = ${fmtRp(t4)}`)
      }

      doc.text(`Perhitungan Pajak Tahunan:`, 20, yPos)
      yPos += 5
      for (const line of lines) {
        doc.text(`  ${line}`, 23, yPos)
        yPos += 4
      }
      yPos += 2
      doc.setFont('helvetica', 'bold')
      doc.text(`Total Pajak Tahunan`, 20, yPos)
      doc.text(`: ${fmtRp(annualTax)}`, 85, yPos)
      yPos += 5
      const monthlyTax = Math.round(annualTax / 12)
      doc.text(`Potongan Pajak per Bulan`, 20, yPos)
      doc.text(`: ${fmtRp(monthlyTax)}`, 85, yPos)
    }

    // === INSENTIF NETTO ===
    yPos = checkPageBreak(doc, yPos, 35)
    yPos += 7
    doc.setDrawColor(44, 62, 80)
    doc.setLineWidth(0.5)
    doc.line(15, yPos - 2, doc.internal.pageSize.width - 15, yPos - 2)
    doc.setLineWidth(0.2)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('D. INSENTIF NETTO (DITERIMA)', 15, yPos + 3)
    yPos += 9

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Insentif Bruto`, 20, yPos)
    doc.text(`: ${fmtRp(slip.grossIncentive)}`, 85, yPos)
    yPos += 5
    doc.text(`Potongan PPh 21`, 20, yPos)
    doc.text(`: (${fmtRp(slip.taxAmount)})`, 85, yPos)
    yPos += 2
    doc.setDrawColor(150, 150, 150)
    doc.line(85, yPos, 180, yPos)
    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(`INSENTIF NETTO`, 20, yPos)
    doc.text(`: ${fmtRp(slip.netIncentive)}`, 85, yPos)

    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text(footerText, 105, pageHeight - 10, { align: 'center' })
  }

  return new Uint8Array(doc.output('arraybuffer'))
}

/**
 * Generate summary report PDF
 */
export async function generateSummaryReportPDF(
  results: any[],
  period: string,
  reportType: string
): Promise<Uint8Array> {
  const doc = new jsPDF('landscape')
  const companyInfo = await getCompanyInfoServer()
  const footerSetting = await getSettingServer('footer')

  await addKopSurat(doc, companyInfo)

  const centerX = doc.internal.pageSize.width / 2

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')

  let title = `LAPORAN REKAPITULASI PEMBAYARAN JASPEL - PERIODE ${period}`
  if (reportType === 'kpi-achievement') title = `LAPORAN PENCAPAIAN KPI - PERIODE ${period}`
  if (reportType === 'unit-comparison') title = `LAPORAN PERBANDINGAN UNIT - PERIODE ${period}`

  doc.text(title, centerX, 42, { align: 'center' })

  let head = []
  let body = []

  if (reportType === 'kpi-achievement') {
    head = [['No', 'Kategori', 'Indikator', 'Target', 'Realisasi', 'Capaian (%)', 'Nilai', 'Gap']]
    body = results.map((r, i) => [
      i + 1,
      r.category,
      r.indicator_name,
      r.target_value,
      r.realization_value,
      r.achievement_percentage,
      r.score,
      r.gap
    ])
  } else if (reportType === 'unit-comparison') {
    head = [['No', 'Unit', 'Rata-Rata Skor', 'Total Insentif', 'Jumlah Pegawai']]
    body = results.map((r, i) => [
      i + 1,
      r.unit_name,
      r.average_score,
      parseFloat(String(r.total_incentive)).toLocaleString('id-ID'),
      r.employee_count
    ])
  } else {
    // Default to incentive
    head = [['No', 'NIP/NIK', 'NIK', 'Nama Pegawai', 'Unit', 'P1', 'P2', 'P3', 'Skor Akhir', 'Insentif Bruto', 'Pajak', 'Insentif Neto']]
    body = results.map((r, i) => [
      i + 1,
      r.employee_code || '-',
      r.nik || '-',
      r.employee_name,
      r.unit,
      r.p1_score || '-',
      r.p2_score || '-',
      r.p3_score || '-',
      typeof r.total_score === 'number' ? r.total_score.toFixed(2) : r.total_score,
      parseFloat(String(r.gross_incentive)).toLocaleString('id-ID'),
      parseFloat(String(r.tax_amount)).toLocaleString('id-ID'),
      parseFloat(String(r.net_incentive)).toLocaleString('id-ID')
    ])
  }

  // Draw main table
  autoTable(doc, {
    startY: reportType === 'kpi-achievement' ? 60 : 50,
    head,
    body,
    theme: 'grid',
    headStyles: { fillColor: [44, 62, 80], textColor: 255 },
    styles: { fontSize: 8 },
    didParseCell: function (data) {
      if (reportType === 'kpi-achievement' && data.section === 'body' && data.column.index === 7) {
        // Gap column color coding
        const gapVal = parseFloat(data.cell.raw as string);
        if (gapVal > 0) {
          data.cell.styles.textColor = [34, 197, 94]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else if (gapVal < 0) {
          data.cell.styles.textColor = [239, 68, 68]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  })

  // Add Employee Name and Recap for KPI if specifically requested / or for all
  if (reportType === 'kpi-achievement' && results.length > 0) {
    const employeeName = results[0].employee_name || results[0].unit_name || '-';
    doc.setFontSize(10);
    doc.text(`Pegawai: ${employeeName}`, 15, 52);

    let totalScore = 0;
    // Simple sum of all scores for recap
    for (const r of results) {
      totalScore += parseFloat(r.score || 0);
    }

    const lastY = (doc as any).lastAutoTable.finalY + 10;

    // Draw Recap Table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Tabel Rekapitulasi Pencapaian', 15, lastY - 2);

    autoTable(doc, {
      startY: lastY,
      head: [['Komponen', 'Deskripsi', 'Total Nilai']],
      body: [
        ['Total Pencapaian', `Total Nilai dari Keseluruhan Indikator Pegawai/Unit`, totalScore.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80], textColor: 255 },
      styles: { fontSize: 9 }
    })
  }

  // Footer for landscape
  const pageHeight = doc.internal.pageSize.height
  const footerText = footerSetting?.data?.text || 'Laporan dihasilkan secara otomatis oleh JASPEL System'
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(footerText, centerX, pageHeight - 10, { align: 'center' })

  return new Uint8Array(doc.output('arraybuffer'))
}

/**
 * Export report to PDF
 */
export async function exportToPDF(options: ReportExportOptions): Promise<Uint8Array> {
  if (options.reportType === 'employee-slip') {
    const slips = options.data.map(item => {
      const parseNum = (val: any) => {
        if (typeof val === 'number') return val
        if (!val) return 0
        const strVal = String(val)
        if (strVal.includes(',')) {
          return parseFloat(strVal.replace(/\./g, '').replace(/,/g, '.')) || 0
        }
        return parseFloat(strVal) || 0
      }
      return {
        period: options.period,
        employeeCode: item.employee_code || '-',
        nik: item.nik || '-',
        employeeName: item.employee_name,
        unit: item.unit,
        taxStatus: item.tax_status || 'Non-PKP',
        employeeStatus: item.employee_status || '-',
        taxType: item.tax_type || '-',
        bankName: item.bank_name,
        bankAccountNumber: item.bank_account_number,
        bankAccountHolder: item.bank_account_holder,
        p1Score: parseFloat(item.p1_score) || 0,
        p2Score: parseFloat(item.p2_score) || 0,
        p3Score: parseFloat(item.p3_score) || 0,
        p1Weighted: (parseFloat(item.p1_score) || 0) * 0.55,
        p2Weighted: (parseFloat(item.p2_score) || 0) * 0.25,
        p3Weighted: (parseFloat(item.p3_score) || 0) * 0.20,
        finalScore: parseFloat(item.total_score) || 0,
        pirValue: parseNum(item.pir_value),
        totalSkorUnit: parseNum(item.total_skor_unit),
        unitProportion: parseNum(item.unit_proportion),
        grossIncentive: parseNum(item.gross_incentive),
        taxAmount: parseNum(item.tax_amount),
        netIncentive: parseNum(item.net_incentive),
      }
    })
    return await generateIncentiveSlipPDF(slips)
  } else {
    return await generateSummaryReportPDF(options.data, options.period, options.reportType)
  }
}

/**
 * Generate Assessment Guide PDF
 */
export async function generateAssessmentGuidePDF(unitName: string = 'Seluruh Unit'): Promise<Uint8Array> {
  const doc = new jsPDF()
  const companyInfo = await getCompanyInfoServer()
  const footerSetting = await getSettingServer('footer')
  const footerText = footerSetting?.data?.text || 'Laporan dihasilkan secara otomatis oleh JASPEL System'

  await addKopSurat(doc, companyInfo)

  const centerX = doc.internal.pageSize.width / 2

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('PETUNJUK PENILAIAN KPI (JASPEL)', centerX, 42, { align: 'center' })
  doc.setFontSize(11)
  doc.text(`Unit Kerja: ${unitName}`, centerX, 49, { align: 'center' })

  doc.setFontSize(12)
  doc.text('1. Komponen Penilaian', 15, 60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  autoTable(doc, {
    startY: 65,
    head: [['Komponen', 'Bobot', 'Deskripsi']],
    body: [
      ['P1 (Kinerja Utama/Posisi)', '55%', 'Penilaian capaian indikator kinerja utama sesuai tupoksi.'],
      ['P2 (Kinerja Tambahan)', '25%', 'Penilaian aktivitas/tugas tambahan di luar tupoksi utama.'],
      ['P3 (Perilaku/Potensi)', '20%', 'Penilaian sikap, kedisiplinan, dan potensi pengembangan.'],
    ],
    theme: 'striped'
  })

  const nextY = (doc as any).lastAutoTable.finalY + 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('2. Kalkulasi Skor Akhir', 15, nextY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Skor Akhir = (Skor P1 x 0.55) + (Skor P2 x 0.25) + (Skor P3 x 0.20)', 15, nextY + 7)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('3. Kalkulasi Insentif (PIR)', 15, nextY + 20)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('PIR (Poin Indeks Rupiah) = Alokasi Unit / Total Skor Unit', 15, nextY + 27)
  doc.setFont('courier', 'normal')
  doc.text('Insentif Bruto = Total Skor Pegawai x PIR', 20, nextY + 34)

  doc.setFont('helvetica', 'normal')
  doc.text('Dimana Alokasi Unit = Net Pool x Proporsi Unit (%).', 15, nextY + 42)
  doc.text('Insentif Netto = Bruto - PPh 21 (progresif UU HPP).', 15, nextY + 49)

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text(footerText, centerX, pageHeight - 10, { align: 'center' })

  return new Uint8Array(doc.output('arraybuffer'))
}