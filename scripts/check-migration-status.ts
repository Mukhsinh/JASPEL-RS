import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying weighted score migration to t_kpi_assessments...')

  try {
    // We use rpc call to run raw SQL if available, or just execute multiple statements
    // Since we don't have a direct 'sql' rpc usually, we'll use the REST API to check if we can run it
    // Actually, the best way for raw SQL with service key is usually via a direct Postgres connection or a custom RPC

    // However, we can try to use a dummy table or just explain that we'll try to drop and add.
    // wait, Supabase JS client doesn't support raw SQL execution directly unless there is an 'exec' or 'sql' function.

    console.log('\n📝 SQL to execute:')
    console.log(`
      ALTER TABLE t_kpi_assessments 
      DROP COLUMN IF EXISTS score;

      ALTER TABLE t_kpi_assessments 
      ADD COLUMN score DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE 
          WHEN target_value > 0 AND (realization_value / target_value * 100) >= 100 THEN weight_percentage
          WHEN target_value > 0 THEN ROUND((realization_value / target_value * weight_percentage / 100)::numeric, 2)
          ELSE 0 
        END
      ) STORED;
    `)

    // We'll try to use a trick to run SQL if the 'sql' RPC or similar exists, but it's risky
    // Instead, I'll recommend the user to run it in the SQL Editor since I've verified the MCP issues.

    console.log('\n⚠️  Notice: The Supabase JS client with Service Role Key does not support raw DDL (ALTER TABLE) directly via the standard API endpoints.')
    console.log('The safest path is to use the Supabase SQL Editor in the Dashboard.')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

applyMigration()
