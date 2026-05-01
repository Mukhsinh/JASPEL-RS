import { NextRequest, NextResponse } from 'next/server'
import { generateAssessmentGuidePDF } from '@/lib/export/pdf-export'

export async function POST(request: NextRequest) {
    try {
        const { unitName } = await request.json()

        const pdfBytes = await generateAssessmentGuidePDF(unitName)

        return new Response(pdfBytes as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Petunjuk_Penilaian_${(unitName || 'Unit').replace(/\s+/g, '_')}.pdf"`,
            },
        })
    } catch (error: any) {
        console.error('Assessment Guide generation error:', error)
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        )
    }
}
