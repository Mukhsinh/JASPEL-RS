const { createClient } = require('@supabase/supabase-js')

async function debug() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://omlbijupllrglmebbqnn.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tbGJpanVwbGxyZ2xtZWJicW5uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY5MjExMSwiZXhwIjoyMDg4MjY4MTExfQ.xi0dZznj9Nybfsyw-mEP1459l0GnQqZmwQmfievYq8U'
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Assuming the user DID run the SQL query, they might have run the SQL query for the double divide by 100 fix.
  // We can fetch P1 assessments for Amalinda to see if any score is greater than its weight_percentage!
  const { data: amalinda } = await supabase.from('m_employees').select('id, full_name, m_units(id, name)').ilike('full_name', '%Amalinda%').single()

  if (amalinda) {
    const { data: assessments } = await supabase
      .from('t_kpi_assessments')
      .select(`
        id,
        realization_value,
        target_value,
        weight_percentage,
        achievement_percentage,
        score,
        m_kpi_indicators (
          name,
          m_kpi_categories (
            category
          )
        )
      `)
      .eq('employee_id', amalinda.id)
      .eq('period', '2026-01')

    console.log("Assessments:")
    assessments?.forEach(a => {
      console.log(`Cat: ${a.m_kpi_indicators?.m_kpi_categories?.category}, Weight: ${a.weight_percentage}, Achv: ${a.achievement_percentage}, Score: ${a.score}, Realiz: ${a.realization_value}, Trgt: ${a.target_value}, Name: ${a.m_kpi_indicators?.name}`)
    })
  }

}

debug()
