import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Add cover page function
function addCoverPage(doc: jsPDF, unit: any, appSettings: any) {
  // Background color for header
  doc.setFillColor(41, 128, 185)
  doc.rect(0, 0, 210, 80, 'F')
  
  // Logo placeholder (if logo exists)
  if (appSettings.logo) {
    // For now, just add a placeholder box
    doc.setFillColor(255, 255, 255)
    doc.rect(85, 20, 40, 40, 'F')
    doc.setTextColor(41, 128, 185)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(appSettings.appName || 'JASPEL', 105, 45, { align: 'center' })
  } else {
    // Just show app name
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(appSettings.appName || 'JASPEL', 105, 45, { align: 'center' })
  }
  
  // Title
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('LAPORAN STRUKTUR KPI', 105, 110, { align: 'center' })
  
  doc.setFontSize(18)
  doc.text(`Unit: ${unit.code} - ${unit.name}`, 105, 130, { align: 'center' })
  
  // Organization info
  if (appSettings.organizationName) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(appSettings.organizationName, 105, 150, { align: 'center' })
  }
  
  // Developer info
  if (appSettings.developerName) {
    doc.setFontSize(12)
    doc.text(`Dikembangkan oleh: ${appSettings.developerName}`, 105, 170, { align: 'center' })
  }
  
  // Date
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 105, 200, { align: 'center' })
  
  // Footer text on cover
  if (appSettings.footerText) {
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    const footerLines = doc.splitTextToSize(appSettings.footerText, 170)
    let footerY = 250
    footerLines.forEach((line: string) => {
      doc.text(line, 105, footerY, { align: 'center' })
      footerY += 5
    })
  }
}

// Add footer to all pages
function addFooterToAllPages(doc: jsPDF, appSettings: any) {
  const pageCount = doc.getNumberOfPages()
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    
    // Page number (skip on cover page)
    if (i > 1) {
      doc.text(`Halaman ${i - 1} dari ${pageCount - 1}`, 105, 285, { align: 'center' })
    }
    
    // Footer text
    if (appSettings.footerText) {
      const footerLines = doc.splitTextToSize(appSettings.footerText, 170)
      let footerY = 290
      footerLines.forEach((line: string) => {
        if (footerY < 295) { // Ensure it fits on page
          doc.text(line, 105, footerY, { align: 'center' })
          footerY += 4
        }
      })
    }
    
    // Print timestamp
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 20, 285)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const unitId = searchParams.get('unitId')
    const format = searchParams.get('format') || 'excel'

    if (!unitId) {
      return NextResponse.json({ error: 'Unit ID diperlukan' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get settings for app info
    const { data: settingsData } = await supabase
      .from('t_settings')
      .select('key, value')
      .in('key', ['company_info', 'footer'])

    let appSettings = {
      appName: 'JASPEL',
      developerName: '',
      organizationName: '',
      logo: '',
      footerText: ''
    }

    if (settingsData) {
      const companyInfo = settingsData.find(s => s.key === 'company_info')?.value || {}
      const footerInfo = settingsData.find(s => s.key === 'footer')?.value || {}
      
      appSettings = {
        appName: companyInfo.appName || 'JASPEL',
        developerName: companyInfo.developerName || '',
        organizationName: companyInfo.name || '',
        logo: companyInfo.logo || '',
        footerText: typeof footerInfo === 'string' ? footerInfo : (footerInfo.text || '')
      }
    }

    // Get unit info
    const { data: unit, error: unitError } = await supabase
      .from('m_units')
      .select('code, name')
      .eq('id', unitId)
      .single()

    if (unitError || !unit) {
      return NextResponse.json({ error: 'Unit tidak ditemukan' }, { status: 404 })
    }

    // Get KPI categories first
    const { data: categories, error: categoriesError } = await supabase
      .from('m_kpi_categories')
      .select('*')
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .order('category')

    if (categoriesError) {
      return NextResponse.json({ error: 'Gagal mengambil data kategori KPI' }, { status: 500 })
    }

    // Get indicators for each category
    const categoriesWithData = []
    for (const category of categories || []) {
      const { data: indicators, error: indicatorsError } = await supabase
        .from('m_kpi_indicators')
        .select('*')
        .eq('category_id', category.id)
        .eq('is_active', true)
        .order('code')

      if (indicatorsError) {
        console.error('Error fetching indicators:', indicatorsError)
        continue
      }

      // Get sub indicators for each indicator
      const indicatorsWithSubs = []
      for (const indicator of indicators || []) {
        const { data: subIndicators, error: subError } = await supabase
          .from('m_kpi_sub_indicators')
          .select('*')
          .eq('indicator_id', indicator.id)
          .eq('is_active', true)
          .order('code')

        if (subError) {
          console.error('Error fetching sub indicators:', subError)
        }

        indicatorsWithSubs.push({
          ...indicator,
          m_kpi_sub_indicators: subIndicators || []
        })
      }

      categoriesWithData.push({
        ...category,
        m_kpi_indicators: indicatorsWithSubs
      })
    }

    if (categoriesError) {
      return NextResponse.json({ error: 'Gagal mengambil data KPI' }, { status: 500 })
    }

    if (format === 'excel') {
      return generateExcelReport(unit, categoriesWithData || [], appSettings)
    } else if (format === 'pdf') {
      return generatePDFReport(unit, categoriesWithData || [], appSettings)
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
      cat.weight_percentage.toString(),
      indicators.length.toString(),
      subIndicatorCount.toString()
    ])

    totalCategories++
    totalIndicators += indicators.length
    totalSubIndicators += subIndicatorCount
    totalCategoryWeight += Number(cat.weight_percentage)
  })

  summaryData.push(
    [],
    ['TOTAL', totalCategoryWeight.toString(), totalIndicators.toString(), totalSubIndicators.toString()],
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
        categoryData.push(['SUB INDIKATOR:', 'Kode', 'Nama', 'Bobot (%)', 'Target', 'Satuan', 'Kriteria Penilaian'])
        
        let totalSubWeight = 0
        subIndicators.forEach((sub: any) => {
          totalSubWeight += Number(sub.weight_percentage)
          
          // Handle scoring criteria
          let criteriaText = '-'
          if (sub.scoring_criteria && Array.isArray(sub.scoring_criteria)) {
            criteriaText = sub.scoring_criteria.map((criteria: any, index: number) => 
              `Skor ${index + 1}: ${criteria.min_value || 0}-${criteria.max_value || 100} (${criteria.label || 'N/A'})`
            ).join('; ')
          }
          
          categoryData.push([
            '',
            sub.code,
            sub.name,
            sub.weight_percentage,
            sub.target_value,
            sub.measurement_unit || '-',
            criteriaText
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

function generatePDFReport(unit: any, categories: any[], appSettings: any) {
  const doc = new jsPDF()
  let yPos = 20

  // Add cover page
  addCoverPage(doc, unit, appSettings)
  
  // Add new page for content
  doc.addPage()
  yPos = 20

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(41, 128, 185)
  doc.text('LAPORAN STRUKTUR KPI', 105, yPos, { align: 'center' })
  yPos += 15
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text(`Unit: ${unit.code} - ${unit.name}`, 105, yPos, { align: 'center' })
  yPos += 10
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 105, yPos, { align: 'center' })
  yPos += 20

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

  // Check if we need a new page
  if (yPos > 200) {
    doc.addPage()
    yPos = 20
  }

  autoTable(doc, {
    head: [['Kategori', 'Bobot (%)', 'Indikator', 'Sub Indikator']],
    body: summaryTableData,
    startY: yPos,
    theme: 'grid',
    headStyles: { 
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: { 
      fontSize: 9,
      textColor: [0, 0, 0]
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 20, right: 20 }
  })

  yPos = (doc as any).lastAutoTable.finalY + 15

  // Validation status
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('STATUS VALIDASI:', 20, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const validationStatus = totalCategoryWeight === 100 ? 'VALID' : `TIDAK VALID (${totalCategoryWeight}%)`
  const statusColor = totalCategoryWeight === 100 ? [0, 128, 0] : [255, 0, 0]
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
  doc.text(`Bobot Kategori: ${validationStatus}`, 20, yPos)
  doc.setTextColor(0, 0, 0)
  yPos += 20

  // Detail for each category
  categories.forEach((category, catIndex) => {
    // Check if we need a new page
    if (yPos > 220) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(41, 128, 185)
    doc.text(`${category.category}: ${category.category_name}`, 20, yPos)
    yPos += 12

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Bobot: ${category.weight_percentage}%`, 20, yPos)
    yPos += 8

    if (category.description) {
      const descLines = doc.splitTextToSize(`Deskripsi: ${category.description}`, 170)
      descLines.forEach((line: string) => {
        doc.text(line, 20, yPos)
        yPos += 5
      })
    }
    yPos += 8

    // Indicators for each category
    const indicators = category.m_kpi_indicators || []
    if (indicators.length > 0) {
      // Check if we need a new page for the table
      if (yPos > 200) {
        doc.addPage()
        yPos = 20
      }

      const indicatorTableData = indicators.map((ind: any) => [
        ind.code || '-',
        ind.name || '-',
        `${ind.weight_percentage || 0}%`,
        (ind.target_value || 0).toString(),
        ind.measurement_unit || '-',
        (ind.m_kpi_sub_indicators?.length || 0).toString()
      ])

      autoTable(doc, {
        head: [['Kode', 'Nama Indikator', 'Bobot', 'Target', 'Satuan', 'Sub Indikator']],
        body: indicatorTableData,
        startY: yPos,
        theme: 'striped',
        headStyles: { 
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold'
        },
        bodyStyles: { 
          fontSize: 8,
          textColor: [0, 0, 0]
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 50 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 }
        }
      })

      yPos = (doc as any).lastAutoTable.finalY + 15

      // Sub indicators for each indicator
      indicators.forEach((indicator: any) => {
        const subIndicators = indicator.m_kpi_sub_indicators || []
        if (subIndicators.length > 0) {
          // Check if we need a new page
          if (yPos > 200) {
            doc.addPage()
            yPos = 20
          }

          doc.setFontSize(11)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(155, 89, 182)
          doc.text(`Sub Indikator: ${indicator.code} - ${indicator.name}`, 20, yPos)
          yPos += 10

          const subTableData = subIndicators.map((sub: any) => {
            // Handle scoring criteria safely
            let criteriaText = '-'
            try {
              if (sub.scoring_criteria && Array.isArray(sub.scoring_criteria)) {
                criteriaText = sub.scoring_criteria.map((criteria: any, index: number) => 
                  `Skor ${index + 1}: ${criteria.min_value || 0}-${criteria.max_value || 100}`
                ).join(', ')
                
                // Truncate if too long
                if (criteriaText.length > 50) {
                  criteriaText = criteriaText.substring(0, 47) + '...'
                }
              }
            } catch (error) {
              criteriaText = '-'
            }
            
            return [
              sub.code || '-',
              sub.name || '-',
              `${sub.weight_percentage || 0}%`,
              (sub.target_value || 0).toString(),
              criteriaText
            ]
          })

          autoTable(doc, {
            head: [['Kode', 'Nama Sub Indikator', 'Bobot', 'Target', 'Kriteria Penilaian']],
            body: subTableData,
            startY: yPos,
            theme: 'plain',
            headStyles: { 
              fillColor: [155, 89, 182],
              textColor: [255, 255, 255],
              fontSize: 8,
              fontStyle: 'bold'
            },
            bodyStyles: { 
              fontSize: 7,
              textColor: [0, 0, 0]
            },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: 20 },
              1: { cellWidth: 40 },
              2: { cellWidth: 20 },
              3: { cellWidth: 20 },
              4: { cellWidth: 70 }
            }
          })

          yPos = (doc as any).lastAutoTable.finalY + 10

          // Validation for sub indicators
          const totalSubWeight = subIndicators.reduce((sum: number, sub: any) => 
            sum + Number(sub.weight_percentage || 0), 0)
          
          doc.setFontSize(9)
          doc.setFont('helvetica', 'italic')
          const subValidation = totalSubWeight === 100 ? 'VALID' : `PERLU PENYESUAIAN (${totalSubWeight}%)`
          const subColor = totalSubWeight === 100 ? [0, 128, 0] : [255, 140, 0]
          doc.setTextColor(subColor[0], subColor[1], subColor[2])
          doc.text(`Validasi Bobot Sub Indikator: ${subValidation}`, 20, yPos)
          doc.setTextColor(0, 0, 0)
          yPos += 12
        }
      })

      // Validation for indicators in this category
      const totalIndicatorWeight = indicators.reduce((sum: number, ind: any) => 
        sum + Number(ind.weight_percentage || 0), 0)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      const indValidation = totalIndicatorWeight === 100 ? 'VALID' : `PERLU PENYESUAIAN (${totalIndicatorWeight}%)`
      const indColor = totalIndicatorWeight === 100 ? [0, 128, 0] : [255, 140, 0]
      doc.setTextColor(indColor[0], indColor[1], indColor[2])
      doc.text(`Validasi Bobot Indikator: ${indValidation}`, 20, yPos)
      doc.setTextColor(0, 0, 0)
      yPos += 20
    }
  })

  // Add footer to all pages
  addFooterToAllPages(doc, appSettings)

  const buffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Laporan_KPI_${unit.code}_${new Date().toISOString().split('T')[0]}.pdf"`
    }
  })
}