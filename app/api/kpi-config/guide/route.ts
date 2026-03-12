import { NextResponse } from 'next/server'
import { generateSystemGuide } from '@/lib/export/guide-generator'

export async function GET() {
  try {
    // Generate the comprehensive system guide
    const pdfBuffer = await generateSystemGuide()
    
    // Set response headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="Panduan_Sistem_JASPEL_${new Date().toISOString().split('T')[0]}.pdf"`)
    headers.set('Content-Length', pdfBuffer.length.toString())
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers
    })
    
  } catch (error) {
    console.error('Error generating system guide:', error)
    return NextResponse.json(
      { error: 'Gagal menghasilkan panduan sistem' },
      { status: 500 }
    )
  }
}