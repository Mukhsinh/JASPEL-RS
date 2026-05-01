import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrate() {
    console.log('🔧 Creating t_history_pir table...')

    const { error } = await supabase.rpc('exec_sql', {
        query: `
      CREATE TABLE IF NOT EXISTS t_history_pir (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        period VARCHAR(7) NOT NULL,
        unit_id UUID NOT NULL REFERENCES m_units(id),
        unit_name VARCHAR(255),
        net_pool_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
        proportion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
        allocated_for_unit DECIMAL(18,2) NOT NULL DEFAULT 0,
        total_skor_kolektif DECIMAL(10,2) NOT NULL DEFAULT 0,
        pir_value DECIMAL(18,4) NOT NULL DEFAULT 0,
        employee_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_history_pir_period ON t_history_pir(period);
      CREATE INDEX IF NOT EXISTS idx_history_pir_unit ON t_history_pir(unit_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_history_pir_period_unit ON t_history_pir(period, unit_id);
    `
    })

    if (error) {
        // If exec_sql doesn't exist, try direct SQL via REST
        console.log('RPC not available, trying direct approach...')

        // Try creating table by inserting and catching error
        const { error: checkError } = await supabase
            .from('t_history_pir')
            .select('id')
            .limit(1)

        if (checkError && checkError.message.includes('does not exist')) {
            console.error('❌ Table does not exist. Please create it manually via Supabase SQL Editor:')
            console.log(`
CREATE TABLE IF NOT EXISTS t_history_pir (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period VARCHAR(7) NOT NULL,
  unit_id UUID NOT NULL REFERENCES m_units(id),
  unit_name VARCHAR(255),
  net_pool_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
  proportion_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  allocated_for_unit DECIMAL(18,2) NOT NULL DEFAULT 0,
  total_skor_kolektif DECIMAL(10,2) NOT NULL DEFAULT 0,
  pir_value DECIMAL(18,4) NOT NULL DEFAULT 0,
  employee_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_pir_period ON t_history_pir(period);
CREATE INDEX IF NOT EXISTS idx_history_pir_unit ON t_history_pir(unit_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_history_pir_period_unit ON t_history_pir(period, unit_id);
ALTER TABLE t_history_pir ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated read" ON t_history_pir FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow service role full" ON t_history_pir FOR ALL TO service_role USING (true) WITH CHECK (true);
      `)
        } else {
            console.log('✅ Table t_history_pir already exists or accessible.')
        }
    } else {
        console.log('✅ Migration completed successfully!')
    }
}

migrate().catch(console.error)
