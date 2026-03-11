import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')
    const format = searchParams.get('format') || 'excel'

    if (!unitId) {
      return NextResponse.json({ error: 'Unit ID diperlukan' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get unit info
    const { data: unit, error: unitError } = await supabase
      .from('m_units')
      .select('code, name')
      .eq('id', unitId)
      .single()

    if (unitError || !unit) {
      return NextResponse.json({ error: 'Unit tidak ditemukan' }, { status: 404 })
    }

    // Get complete KPI structure
    const { data: categories, error: categoriesError } = await supabase
      .from('m_kpi_categories')
      .select(`
        id,
        category,
        category_name,
        weight_percentage,
        description,
        m_kpi_indicators (
          id,
          code,
          name,
          target_value,
          weight_percentage,
          measurement_unit,
          description,
          m_kpi_sub_indicators (
            id,
            code,
            name,
            target_value,
            weight_percentage,
            score_1,
            score_2,
            score_3,
            score_4,
            score_5,
            score_1_label,
            score_2_label,
            score_3_label,
            score_4_label,
            score_5_label,
            measurement_unit,
            description
          )
        )
      `)
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .order('category')

    if (categoriesError) {
      return NextResponse.json({ error: 'Gagal mengambil data KPI' }, { status: 500 })
    }

    if (format === 'excel') {
      return generateExcelReport(unit, categories || [])
    } else if (format === 'pdf') {
      return generatePDFReport(unit, categories || [])
    } else {
      return NextResponse.json({ error: 'Format tidak didukung' }, { status: 400 })
    }

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Gagal mengekspor laporan' }, { status: 500 })
  }
}

function generateExcelReport(unit: any, categories: any[]) {
  const workbook = XLSX.utils.book_new()

  // Summary Sheet
  const summaryData = [
    ['LAPORAN STRUKTUR KPI'],
    ['Unit:', `${unit.code} - ${unit.name}`],
    ['Tanggal:', new Date().toLocaleDateString('id-ID')],
    [],
    ['RINGKASAN STRUKTUR KPI'],
    ['Kategori', 'Bobot (%)', 'Jumlah Indikator', 'Jumlah Sub Indikator'],
  ]

  let totalCategories = 0
  let totalIndicators = 0
  let totalSubIndicators = 0
  let totalCategoryWeight = 0

  categories.forEach(cat => {
    const indicators = cat.m_kpi_indicators || []
    const subIndicatorCount = indicators.reduce((sum: number, ind: any) => 
      sum + (ind.m_kpi_sub_indicators?.length || 0), 0)
    
    summaryData.push([
      `${cat.category} - ${cat.category_name}`,
      cat.weight_percentage,
      indicators.length,
      subIndicatorCount
    ])

    totalCategories++
    totalIndicators += indicators.length
    totalSubIndicators += subIndicatorCount
    totalCategoryWeight += Number(cat.weight_percentage)
  })

  summaryData.push(
    [],
    ['TOTAL', totalCategoryWeight, totalIndicators, totalSubIndicators],
    [],
    ['Validasi Bobot Kategori:', totalCategoryWeight === 100 ? 'VALID ✓' : `TIDAK VALID (${totalCategoryWeight}%)`]
  )

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

  // Detail sheets for each category
  categories.forEach(category => {
    const categoryData = [
      [`KATEGORI ${category.category}: ${category.category_name}`],
      ['Bobot Kategori:', `${category.weight_percentage}%`],
      ['Deskripsi:', category.description || '-'],
      [],
      ['INDIKATOR DAN SUB INDIKATOR'],
      []
    ]

    const indicators = category.m_kpi_indicators || []
    let totalIndicatorWeight = 0

    indicators.forEach((indicator: any) => {
      totalIndicatorWeight += Number(indicator.weight_percentage)
      
      categoryData.push([
        'INDIKATOR:',
        indicator.code,
        indicator.name,
        `Bobot: ${indicator.weight_percentage}%`,
        `Target: ${indicator.target_value}`,
        `Satuan: ${indicator.measurement_unit || '-'}`
      ])

      if (indicator.description) {
        categoryData.push(['Deskripsi:', indicator.description])
      }

      // Add sub indicators
      const subIndicators = indicator.m_kpi_sub_indicators || []
      if (subIndicators.length > 0) {
        categoryData.push([])
        categoryData.push(['SUB INDIKATOR:', 'Kode', 'Nama', 'Bobot (%)', 'Target', 'Satuan', 'Skor 1', 'Skor 2', 'Skor 3', 'Skor 4', 'Skor 5'])
        
        let totalSubWeight = 0
        subIndicators.forEach((sub: any) => {
          totalSubWeight += Number(sub.weight_percentage)
          categoryData.push([
            '',
            sub.code,
            sub.name,
            sub.weight_percentage,
            sub.target_value,
            sub.measurement_unit || '-',
            `${sub.score_1} (${sub.score_1_label})`,
            `${sub.score_2} (${sub.score_2_label})`,
            `${sub.score_3} (${sub.score_3_label})`,
            `${sub.score_4} (${sub.score_4_label})`,
            `${sub.score_5} (${sub.score_5_label})`
          ])
        })
        
        categoryData.push([])
        categoryData.push(['Total Bobot Sub Indikator:', `${totalSubWeight}%`, totalSubWeight === 100 ? 'VALID ✓' : 'PERLU PENYESUAIAN'])
      }
      
      categoryData.push([])
    })

    categoryData.push([])
    categoryData.push(['VALIDASI BOBOT INDIKATOR'])
    categoryData.push(['Total Bobot Indikator:', `${totalIndicatorWeight}%`])
    categoryData.push(['Status:', totalIndicatorWeight === 100 ? 'VALID ✓' : `PERLU PENYESUAIAN (harus 100%)`])

    const categorySheet = XLSX.utils.aoa_to_sheet(categoryData)
    XLSX.utils.book_append_sheet(workbook, categorySheet, category.category)
  })

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Laporan_KPI_${unit.code}_${new Date().toISOString().split('T')[0]}.xlsx"`
    }
  })
}

function generatePDFReport(unit: any, categories: any[]) {
  const doc = new jsPDF()
  let yPos = 20

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('LAPORAN STRUKTUR KPI', 105, yPos, { align: 'center' })
  yPos += 10
  
  doc.setFontSize(14)
  doc.text(`Unit: ${unit.code} - ${unit.name}`, 105, yPos, { align: 'center' })
  yPos += 8
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 105, yPos, { align: 'center' })
  yPos += 15

  // Summary table
  const summaryTableData = categories.map(cat => {
    const indicators = cat.m_kpi_indicators || []
    const subIndicatorCount = indicators.reduce((sum: number, ind: any) => 
      sum + (ind.m_kpi_sub_indicators?.length || 0), 0)
    
    return [
      `${cat.category} - ${cat.category_name}`,
      `${cat.weight_percentage}%`,
      indicators.length.toString(),
      subIndicatorCount.toString()
    ]
  })

  const totalIndicators = categories.reduce((sum, cat) => {
    const indicators = cat.m_kpi_indicators || []
    return sum + indicators.length
  }, 0)

  const totalSubIndicators = categories.reduce((sum, cat) => {
    const indicators = cat.m_kpi_indicators || []
    return sum + indicators.reduce((indSum: number, ind: any) => 
      indSum + (ind.m_kpi_sub_indicators?.length || 0), 0)
  }, 0)

  const totalCategoryWeight = categories.reduce((sum, cat) => sum + Number(cat.weight_percentage), 0)

  summaryTableData.push([
    'TOTAL',
    `${totalCategoryWeight}%`,
    totalIndicators.toString(),
    totalSubIndicators.toString()
  ])

  autoTable(doc, {
    head: [['Kategori', 'Bobot (%)', 'Indikator', 'Sub Indikator']],
    body: summaryTableData,
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
    styles: { fontSize: 9 }
  })

  yPos = (doc as any).lastAutoTable.finalY + 10

  // Validation status
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('STATUS VALIDASI:', 20, yPos)
  yPos += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const validationStatus = totalCategoryWeight === 100 ? 'VALID ✓' : `TIDAK VALID (${totalCategoryWeight}%)`
  doc.text(`Bobot Kategori: ${validationStatus}`, 20, yPos)
  yPos += 15

  // Detail for each category
  categories.forEach((category, catIndex) => {
    if (yPos > 240) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`${category.category}: ${category.category_name}`, 20, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Bobot: ${category.weight_percentage}%`, 20, yPos)
    yPos += 5

    if (category.description) {
      doc.text(`Deskripsi: ${category.description}`, 20, yPos)
      yPos += 5
    }
    yPos += 5

    // Indicators for each category
    const indicators = category.m_kpi_indicators || []
    if (indicators.length > 0) {
      const indicatorTableData = indicators.map((ind: any) => [
        ind.code,
        ind.name,
        `${ind.weight_percentage}%`,
        ind.target_value.toString(),
        ind.measurement_unit || '-',
        (ind.m_kpi_sub_indicators?.length || 0).toString()
      ])

      autoTable(doc, {
        head: [['Kode', 'Nama Indikator', 'Bobot', 'Target', 'Satuan', 'Sub Indikator']],
        body: indicatorTableData,
        startY: yPos,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        styles: { fontSize: 8 }
      })

      yPos = (doc as any).lastAutoTable.finalY + 10

      // Sub indicators for each indicator
      indicators.forEach((indicator: any) => {
        const subIndicators = indicator.m_kpi_sub_indicators || []
        if (subIndicators.length > 0) {
          if (yPos > 240) {
            doc.addPage()
            yPos = 20
          }

          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.text(`Sub Indikator: ${indicator.code} - ${indicator.name}`, 20, yPos)
          yPos += 8

          const subTableData = subIndicators.map((sub: any) => [
            sub.code,
            sub.name,
            `${sub.weight_percentage}%`,
            `${sub.score_1}/${sub.score_2}/${sub.score_3}/${sub.score_4}/${sub.score_5}`,
            `${sub.score_1_label}/${sub.score_5_label}`
          ])

          autoTable(doc, {
            head: [['Kode', 'Nama Sub Indikator', 'Bobot', 'Skor (1-5)', 'Label Min/Max']],
            body: subTableData,
            startY: yPos,
            theme: 'plain',
            headStyles: { fillColor: [155, 89, 182] },
            styles: { fontSize: 7 }
          })

          yPos = (doc as any).lastAutoTable.finalY + 8

          // Validation for sub indicators
          const totalSubWeight = subIndicators.reduce((sum: number, sub: any) => sum + Number(sub.weight_percentage), 0)
          doc.setFontSize(9)
          doc.setFont('helvetica', 'italic')
          const subValidation = totalSubWeight === 100 ? 'VALID ✓' : `PERLU PENYESUAIAN (${totalSubWeight}%)`
          doc.text(`Validasi Bobot Sub Indikator: ${subValidation}`, 20, yPos)
          yPos += 10
        }
      })

      // Validation for indicators in this category
      const totalIndicatorWeight = indicators.reduce((sum: number, ind: any) => sum + Number(ind.weight_percentage), 0)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const indValidation = totalIndicatorWeight === 100 ? 'VALID ✓' : `PERLU PENYESUAIAN (${totalIndicatorWeight}%)`
      doc.text(`Validasi Bobot Indikator: ${indValidation}`, 20, yPos)
      yPos += 15
    }
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Halaman ${i} dari ${pageCount}`, 105, 285, { align: 'center' })
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 20, 285)
  }

  const buffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Laporan_KPI_${unit.code}_${new Date().toISOString().split('T')[0]}.pdf"`
    }
  })
}