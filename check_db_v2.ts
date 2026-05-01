
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load .env.local from the current directory
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkColumns() {
    console.log('Direct select check for m_employees...')
    const { data: selectData, error: selectError } = await supabase
        .from('m_employees')
        .select('*')
        .limit(1)

    if (selectError) {
        console.error('Error selecting from m_employees:', selectError)
    } else {
        const columns = Object.keys(selectData[0] || {})
        console.log('Columns in m_employees:', columns)

        const required = ['bank_name', 'bank_account_number', 'bank_account_holder']
        const missing = required.filter(col => !columns.includes(col))

        if (missing.length > 0) {
            console.log('MISSING COLUMNS:', missing)
        } else {
            console.log('All required columns exist.')
        }
    }
}

checkColumns()
