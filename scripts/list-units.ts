import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function debugUnits() {
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Querying m_units...')
    const { data, error } = await supabase
        .from('m_units')
        .select('id, code, name')

    if (error) {
        console.error('Error:', error.message)
        return
    }

    console.log('Units found:', data?.length)
    if (data) {
        data.forEach(u => console.log(`ID: ${u.id}, Code: "${u.code}", Name: "${u.name}"`))
    }
}

debugUnits()
