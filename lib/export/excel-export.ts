import * as XLSX from 'xlsx'
import { getSetting, getCompanyInfo } from '@/lib/services/settings.service'

interface ExportData {
  headers: string[]
  data: any[][]
  sheetName?: string
  fileName?: string
}

interface ReportExportOptions {
  reportType: string
  period: string
  data: any[]
}

/**
 * Export report to Excel with formatting
 * Requirements: 12.5, 16.1, 16.2, 16.7
 */
export async function exportToExcel(options: ReportExportOptions): Promise<Buffer> {
  const { reportType, period, data } = options

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Prepare data based on report type
  let wsData: any[][] = []
  let sheetName = 'Report'

  switch (reportType) {
    case 'incentive':
      sheetName = 'Incentive Report'
      wsData = [
        ['NIP/NIK', 'Employee Name', 'Unit', 'P1 Score', 'P2 Score', 'P3 Score', 'Total Score', 'Gross Incentive', 'Tax Amount', 'Net Incentive'],
        ...data.map((row: any) => [
          row.employee_code || '-',
          row.employee_name,
          row.unit,
          row.p1_score,
          row.p2_score,
          row.p3_score,
          row.total_score,
          row.gross_incentive,
          row.tax_amount,
          row.net_incentive,
        ]),
      ]
      break

    case 'kpi-achievement':
      sheetName = 'KPI Achievement'
      wsData = [
        ['Indicator Name', 'Target Value', 'Realization Value', 'Achievement %'],
        ...data.map((row: any) => [
          row.indicator_name,
          row.target_value,
          row.realization_value,
          row.achievement_percentage,
        ]),
      ]
      break

    case 'unit-comparison':
      sheetName = 'Unit Comparison'
      wsData = [
        ['Unit Name', 'Average Score', 'Total Incentive', 'Employee Count'],
        ...data.map((row: any) => [
          row.unit_name,
          row.average_score,
          row.total_incentive,
          row.employee_count,
        ]),
      ]
      break

    case 'employee-slip':
      sheetName = 'Employee Slip'
      wsData = [
        ['NIP/NIK', 'Employee Name', 'Unit', 'P1 Score', 'P2 Score', 'P3 Score', 'Total Score', 'Gross Incentive', 'Tax Amount', 'Net Incentive'],
        ...data.map((row: any) => [
          row.employee_code || '-',
          row.employee_name,
          row.unit,
          row.p1_score,
          row.p2_score,
          row.p3_score,
          row.total_score,
          row.gross_incentive,
          row.tax_amount,
          row.net_incentive,
        ]),
      ]
      break

    default:
      throw new Error('Invalid report type')
  }

  // Fetch Company Info for Kop Surat
  const companyInfo = await getCompanyInfo()

  // Build Kop Surat
  const kopSurat = [
    [companyInfo.name.toUpperCase()],
    [`${companyInfo.address}`],
    [
      [
        companyInfo.phone ? `Telp: ${companyInfo.phone}` : null,
        companyInfo.email ? `Email: ${companyInfo.email}` : null
      ].filter(Boolean).join(' | ')
    ],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'],
    [sheetName.toUpperCase()],
    [`Periode: ${period}`],
    ['']
  ]

  // Prepend Kop Surat to wsData
  wsData = [...kopSurat, ...wsData]

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Apply formatting: Bold headers
  // Headers are now shifted down by kopSurat.length rows
  const headerRowIdx = kopSurat.length
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIdx, c: col })
    if (!ws[cellAddress]) continue
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: '2563EB' } }, // Professional Blue
    }
  }

  // Format Kop Surat Title to be bold and large
  for (let r = 0; r < kopSurat.length; r++) {
    const cell = XLSX.utils.encode_cell({ r, c: 0 })
    if (ws[cell]) {
      ws[cell].s = { font: { bold: true, sz: 14 } }
    }
  }

  // Set column widths based on content
  const colWidths = [
    { wch: 25 }, // First col usually name or indicator
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
  ]
  ws['!cols'] = colWidths

  // Add footer rows
  const { data: footerData } = await getSetting('footer')
  const footerText = footerData?.text || 'JASPEL Enterprise'
  const dateStr = new Date().toLocaleString('id-ID')

  // Add empty row and footer
  const footerRow = range.e.r + 2
  XLSX.utils.sheet_add_aoa(ws, [['']], { origin: footerRow })
  XLSX.utils.sheet_add_aoa(ws, [[footerText]], { origin: footerRow + 1 })
  XLSX.utils.sheet_add_aoa(ws, [[`Dicetak: ${dateStr}`]], { origin: footerRow + 2 })

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate buffer
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buffer as Buffer
}

/**
 * Export data to Excel file (client-side)
 */
export async function exportToExcelFile({
  headers,
  data,
  sheetName = 'Sheet1',
  fileName = 'export.xlsx'
}: ExportData) {
  // Create workbook
  const wb = XLSX.utils.book_new()

  // Fetch Company Info for Kop Surat
  const companyInfo = await getCompanyInfo()

  // Build Kop Surat
  const kopSurat = [
    [companyInfo.name.toUpperCase()],
    [`${companyInfo.address}`],
    [
      [
        companyInfo.phone ? `Telp: ${companyInfo.phone}` : null,
        companyInfo.email ? `Email: ${companyInfo.email}` : null
      ].filter(Boolean).join(' | ')
    ],
    ['━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'],
    [sheetName.toUpperCase()],
    ['']
  ]

  // Combine kop, headers and data
  const wsData = [...kopSurat, headers, ...data]

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  const colWidths = headers.map(() => ({ wch: 15 }))
  ws['!cols'] = colWidths

  const headerRowIdx = kopSurat.length
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')

  // Format headers
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRowIdx, c: col })
    if (!ws[cellAddress]) continue
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: '2563EB' } },
    }
  }

  // Format Kop
  for (let r = 0; r < kopSurat.length; r++) {
    const cell = XLSX.utils.encode_cell({ r, c: 0 })
    if (ws[cell]) ws[cell].s = { font: { bold: true } }
  }

  // Add footer rows
  const { data: footerData } = await getSetting('footer')
  const footerText = footerData?.text || 'JASPEL Enterprise'
  const dateStr = new Date().toLocaleString('id-ID')

  const footerRow = kopSurat.length + 1 + data.length + 2
  XLSX.utils.sheet_add_aoa(ws, [['']], { origin: footerRow })
  XLSX.utils.sheet_add_aoa(ws, [[footerText]], { origin: footerRow + 1 })
  XLSX.utils.sheet_add_aoa(ws, [[`Dicetak: ${dateStr}`]], { origin: footerRow + 2 })

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate Excel file
  XLSX.writeFile(wb, fileName)
}

/**
 * Export KPI realization template
 */
export async function exportKPITemplate(
  employees: Array<{ code: string; name: string }>,
  indicators: Array<{ code: string; name: string; target: number }>
) {
  const headers = [
    'Employee Code',
    'Employee Name',
    'Indicator Code',
    'Indicator Name',
    'Target',
    'Realization',
    'Notes'
  ]

  const data: any[][] = []

  employees.forEach(emp => {
    indicators.forEach(ind => {
      data.push([
        emp.code,
        emp.name,
        ind.code,
        ind.name,
        ind.target,
        '', // Empty for user input
        ''  // Empty for notes
      ])
    })
  })

  await exportToExcelFile({
    headers,
    data,
    sheetName: 'KPI Realization',
    fileName: 'kpi-realization-template.xlsx'
  })
}

/**
 * Export calculation results
 */
export async function exportCalculationResults(
  results: Array<{
    employeeCode: string
    employeeName: string
    unit: string
    p1Score: number
    p2Score: number
    p3Score: number
    finalScore: number
    grossIncentive: number
    taxAmount: number
    netIncentive: number
  }>,
  period: string
) {
  const headers = [
    'Employee Code',
    'Employee Name',
    'Unit',
    'P1 Score',
    'P2 Score',
    'P3 Score',
    'Final Score',
    'Gross Incentive',
    'Tax Amount',
    'Net Incentive'
  ]

  const data = results.map(r => [
    r.employeeCode,
    r.employeeName,
    r.unit,
    r.p1Score.toFixed(2),
    r.p2Score.toFixed(2),
    r.p3Score.toFixed(2),
    r.finalScore.toFixed(2),
    r.grossIncentive.toFixed(2),
    r.taxAmount.toFixed(2),
    r.netIncentive.toFixed(2)
  ])

  await exportToExcelFile({
    headers,
    data,
    sheetName: 'Calculation Results',
    fileName: `calculation-results-${period}.xlsx`
  })
}

/**
 * Parse Excel file for bulk import
 */
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })

        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        resolve(jsonData)
      } catch (error: any) {
        reject(error)
      }
    }

    reader.onerror = (error) => reject(error)
    reader.readAsBinaryString(file)
  })
}
