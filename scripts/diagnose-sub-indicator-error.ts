#!/usr/bin/env tsx

/**
 * Diagnose sub-indicator database error
 * Check table structure, constraints, and RLS policies
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function diagnoseSubIndicatorError() {
  console.log('🔍 Diagnosing Sub-Indicator Database Error...\n')

  try {
    // 1. Check table structure
    console.log('1. Checking table structure...')
    
    // Query information_schema
    const { data: schemaInfo, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'm_kpi_sub_indicators')
      .eq('table_schema', 'public')

    if (schemaError) {
      console.error('❌ Cannot get table structure:', schemaError)
    } else {
      console.log('📋 Table columns:')
      schemaInfo?.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`)
      })
    }

    // 2. Check constraints
    console.log('\n2. Checking table constraints...')
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'm_kpi_sub_indicators')
      .eq('table_schema', 'public')

    if (constraintsError) {
      console.error('❌ Cannot get constraints:', constraintsError)
    } else {
      console.log('🔒 Table constraints:')
      constraints?.forEach(constraint => {
        console.log(`   ${constraint.constraint_name}: ${constraint.constraint_type}`)
      })
    }

    // 3. Check specific constraint details
    console.log('\n3. Checking constraint details...')
    const { data: checkConstraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .in('constraint_name', ['check_scoring_criteria_is_array', 'check_scoring_criteria_valid'])

    if (checkError) {
      console.error('❌ Cannot get check constraints:', checkError)
    } else {
      console.log('✅ Check constraints:')
      checkConstraints?.forEach(constraint => {
        console.log(`   ${constraint.constraint_name}: ${constraint.check_clause}`)
      })
    }

    // 4. Test simple insert to see exact error
    console.log('\n4. Testing simple insert...')
    
    // First get an indicator to use
    const { data: indicators } = await supabase
      .from('m_kpi_indicators')
      .select('id')
      .limit(1)

    if (!indicators || indicators.length === 0) {
      console.log('⚠️ No indicators found, creating test indicator...')
      
      // Create test category and indicator
      const { data: category } = await supabase
        .from('m_kpi_categories')
        .insert({
          code: 'DIAG_CAT',
          name: 'Diagnostic Category',
          description: 'For diagnostic purposes',
          is_active: true
        })
        .select()
        .single()

      if (category) {
        const { data: indicator } = await supabase
          .from('m_kpi_indicators')
          .insert({
            category_id: category.id,
            code: 'DIAG_IND',
            name: 'Diagnostic Indicator',
            description: 'For diagnostic purposes',
            weight_percentage: 100,
            is_active: true
          })
          .select()
          .single()

        if (indicator) {
          indicators.push(indicator)
        }
      }
    }

    if (indicators && indicators.length > 0) {
      const testData = {
        indicator_id: indicators[0].id,
        code: 'DIAG_SUB_001',
        name: 'Diagnostic Sub Indicator',
        weight_percentage: 25.5,
        target_value: 100,
        measurement_unit: '%',
        scoring_criteria: [
          { score: 20, label: 'Sangat Kurang' },
          { score: 40, label: 'Kurang' },
          { score: 60, label: 'Cukup' },
          { score: 80, label: 'Baik' },
          { score: 100, label: 'Sangat Baik' }
        ],
        is_active: true
      }

      console.log('📝 Attempting insert with data:', JSON.stringify(testData, null, 2))

      const { data: insertResult, error: insertError } = await supabase
        .from('m_kpi_sub_indicators')
        .insert(testData)
        .select()

      if (insertError) {
        console.error('❌ Insert failed:', insertError)
        console.error('   Code:', insertError.code)
        console.error('   Message:', insertError.message)
        console.error('   Details:', insertError.details)
        console.error('   Hint:', insertError.hint)
      } else {
        console.log('✅ Insert successful:', insertResult)
        
        // Clean up
        await supabase
          .from('m_kpi_sub_indicators')
          .delete()
          .eq('id', insertResult[0].id)
      }

      // Clean up test data
      await supabase
        .from('m_kpi_indicators')
        .delete()
        .eq('code', 'DIAG_IND')

      await supabase
        .from('m_kpi_categories')
        .delete()
        .eq('code', 'DIAG_CAT')
    }

    // 5. Check RLS policies
    console.log('\n5. Checking RLS policies...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'm_kpi_sub_indicators')

    if (policiesError) {
      console.error('❌ Cannot get RLS policies:', policiesError)
    } else {
      console.log('🛡️ RLS policies:')
      policies?.forEach(policy => {
        console.log(`   ${policy.policyname}: ${policy.cmd} (${policy.permissive})`)
      })
    }

    // 6. Check current user context
    console.log('\n6. Checking current user context...')
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Cannot get user:', userError)
    } else {
      console.log('👤 Current user:', user.user?.email || 'No user')
      console.log('   Role:', user.user?.user_metadata?.role || 'No role')
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error)
  }
}

// Run the diagnostic
diagnoseSubIndicatorError()