// PDF Export temporarily disabled for build compatibility

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
 * Generate incentive slip PDF - temporarily disabled
 */
export async function generateIncentiveSlipPDF(data: IncentiveSlipData) {
  throw new Error("PDF export sementara dinonaktifkan untuk kompatibilitas build")
}

/**
 * Generate summary report PDF - temporarily disabled
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
) {
  throw new Error("PDF export sementara dinonaktifkan untuk kompatibilitas build")
}

/**
 * Export report to PDF - temporarily disabled
 */
export async function exportToPDF(options: ReportExportOptions): Promise<Buffer> {
  throw new Error("PDF export sementara dinonaktifkan untuk kompatibilitas build")
}