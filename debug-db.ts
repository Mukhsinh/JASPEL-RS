import { createAdminClient } from './lib/supabase/server'

async function debug() {
    const supabase = await createAdminClient()
    const { data: pools } = await supabase.from('t_pool').select('period').limit(5)
    console.log('Pool Periods:', pools)

    const { data: assessments } = await supabase.from('t_kpi_assessments').select('period').limit(5)
    console.log('Assessment Periods:', assessments)
}

debug()
