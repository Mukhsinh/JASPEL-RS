import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')

        const supabase = await createAdminClient()

        if (type === 'units') {
            const { data, error } = await supabase
                .from('m_units')
                .select('id, name')
                .order('name')

            if (error) throw error
            return NextResponse.json({ success: true, data })
        }

        if (type === 'employees') {
            const { data, error } = await supabase
                .from('m_employees')
                .select('id, full_name, unit_id')
                .eq('is_active', true)
                .order('full_name')

            if (error) throw error
            return NextResponse.json({ success: true, data })
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    } catch (error: any) {
        console.error('Metadata fetch error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
