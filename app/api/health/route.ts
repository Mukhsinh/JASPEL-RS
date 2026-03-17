import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Quick database connectivity check
    const { data, error } = await supabase
      .from('m_units')
      .select('id')
      .limit(1)
    
    if (error) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          database: 'disconnected',
          error: error.message 
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}