import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function checkSchema() {
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Querying m_employees columns...')
    const { data, error } = await supabase
        .from('m_employees')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error:', error.message)
        return
    }

    if (data && data.length > 0) {
        console.log('Columns in m_employees:', Object.keys(data[0]))
    } else {
        // If table is empty, we might need another way to get schema
        console.log('Table is empty. Trying to get columns via RPC if available...')
        // We can try to insert a dummy record and rollback or just check if address fails specifically
        const { error: testError } = await supabase
            .from('m_employees')
            .select('address')
            .limit(1)

        if (testError) {
            console.log('Confirmed: address column is MISSING.', testError.message)
        } else {
            console.log('Address column exists.')
        }
    }
}

checkSchema()
