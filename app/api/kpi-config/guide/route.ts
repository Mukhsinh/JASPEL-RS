import { NextResponse } from 'next/server'
import { generateSystemGuide } from '@/lib/export/guide-generator'

export async function GET() {
  try {
    // Generate the comprehensive system guide
    const pdfBuffer = await generateSystemGuide()
    
    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)
    
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Panduan_Sistem_JASPEL_${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    })
    
  } catch (error) {
    console.error('Error generating system guide:', error)
    return NextResponse.json(
      { error: 'Gagal menghasilkan panduan sistem' },
      { status: 500 }
    )
  }
}