#!/usr/bin/env tsx

/**
 * Simulate exact form submission behavior
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use anon key like the form does
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function simulateFormSubmission() {
  console.log('🎭 Simulating Form Submission...\n')

  try {
    // 1. Simulate login first (form requires auth)
    console.log('1. Simulating login...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'superadmin@jaspel.com',
      password: 'superadmin123'
    })

    if (authError) {
      console.error('❌ Login failed:', authError.message)
      return
    }

    console.log('✅ Login successful')

    // 2. Get indicator (like form does)
    console.log('\n2. Getting indicator...')
    
    const { data: indicators, error: indicatorError } = await supabase
      .from('m_kpi_indicators')
      .select('id, name')
      .limit(1)

    if (indicatorError) {
      console.error('❌ Get indicator failed:', indicatorError.message)
      return
    }

    if (!indicators || indicators.length === 0) {
      console.log('⚠️ No indicators found')
      return
    }

    const indicator = indicators[0]
    console.log('✅ Got indicator:', indicator.name)

    // 3. Get existing sub indicators (for code generation)
    console.log('\n3. Getting existing sub indicators...')
    
    const { data: existingSubIndicators, error: existingError } = await supabase
      .from('m_kpi_sub_indicators')
      .select('code')
      .eq('indicator_id', indicator.id)

    if (existingError) {
      console.error('❌ Get existing failed:', existingError.message)
      return
    }

    console.log('✅ Got existing sub indicators:', existingSubIndicators?.length || 0)

    // 4. Simulate form data (exact structure from form)
    console.log('\n4. Preparing form data...')
    
    const formData = {
      name: 'Test Form Simulation',
      description: 'Test dari simulasi form submission',
      weight_percentage: '25.5', // Form sends as string
      target_value: '100', // Form sends as string
      measurement_unit: '%',
      scoring_criteria: [
        { score: 20, label: 'Sangat Kurang' },
        { score: 40, label: 'Kurang' },
        { score: 60, label: 'Cukup' },
        { score: 80, label: 'Baik' },
        { score: 100, label: 'Sangat Baik' }
      ]
    }

    // Generate code (exact logic from form)
    const existingCodes = existingSubIndicators?.map(s => {
      const match = s.code.match(/(\d+)$/)
      return match ? parseInt(match[1]) : 0
    }) || []
    
    const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0
    const newCode = `SUB${String(maxCode + 1).padStart(3, '0')}`

    // Prepare data (exact logic from form)
    const data = {
      indicator_id: indicator.id,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      weight_percentage: parseFloat(formData.weight_percentage),
      target_value: formData.target_value ? parseFloat(formData.target_value) : 100,
      measurement_unit: formData.measurement_unit.trim() || null,
      scoring_criteria: formData.scoring_criteria, // This is the key part
      is_active: true,
      code: newCode
    }

    console.log('📋 Data to submit:', {
      ...data,
      scoring_criteria: `[${data.scoring_criteria.length} criteria]`
    })

    // 5. Submit (exact method from form)
    console.log('\n5. Submitting data...')
    
    const { data: result, error: submitError } = await supabase
      .from('m_kpi_sub_indicators')
      .insert(data)
      .select()

    if (submitError) {
      console.error('❌ Submit failed:', submitError.message)
      console.error('❌ Error code:', submitError.code)
      console.error('❌ Error details:', submitError.details)
      console.error('❌ Error hint:', submitError.hint)
      
      // Check specific error types
      if (submitError.code === '42501') {
        console.log('🔍 Permission denied - RLS policy issue')
      } else if (submitError.code === '23514') {
        console.log('🔍 Check constraint violation')
      } else if (submitError.code === '23505') {
        console.log('🔍 Unique constraint violation')
      }
      
      return
    }

    console.log('✅ Submit successful!')
    console.log('📋 Created:', result[0].name)

    // 6. Test update (simulate edit)
    console.log('\n6. Testing update...')
    
    const updateData = {
      weight_percentage: 30.0,
      scoring_criteria: [
        { score: 25, label: 'Sangat Kurang Sekali' },
        { score: 50, label: 'Kurang' },
        { score: 75, label: 'Cukup Baik' },
        { score: 100, label: 'Sangat Baik' }
      ]
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('m_kpi_sub_indicators')
      .update(updateData)
      .eq('id', result[0].id)
      .select()

    if (updateError) {
      console.error('❌ Update failed:', updateError.message)
    } else {
      console.log('✅ Update successful!')
    }

    // 7. Clean up
    console.log('\n7. Cleaning up...')
    await supabase
      .from('m_kpi_sub_indicators')
      .delete()
      .eq('id', result[0].id)

    console.log('✅ Cleanup complete')

    console.log('\n🎉 Form simulation successful!')
    console.log('\n📋 The form should work correctly now.')

  } catch (error) {
    console.error('❌ Simulation failed:', error)
  }
}

simulateFormSubmission()