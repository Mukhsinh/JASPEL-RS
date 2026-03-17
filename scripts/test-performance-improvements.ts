#!/usr/bin/env tsx

/**
 * Script untuk test performance improvements
 * Mengukur waktu loading berbagai komponen dan API
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PerformanceTest {
  name: string
  test: () => Promise<any>
}

const tests: PerformanceTest[] = [
  {
    name: 'Dashboard Stats (Optimized)',
    test: async () => {
      const { data, error } = await supabase.rpc('get_dashboard_stats')
      if (error) throw error
      return data
    }
  },
  {
    name: 'Top Performers (Optimized)', 
    test: async () => {
      const { data, error } = await supabase.rpc('get_top_performers', { performer_limit: 5 })
      if (error) throw error
      return data
    }
  },
  {
    name: 'Unit Performance (Optimized)',
    test: async () => {
      const { data, error } = await supabase.rpc('get_unit_performance')
      if (error) throw error
      return data
    }
  },
  {
    name: 'Employee Count (Regular Query)',
    test: async () => {
      const { count, error } = await supabase
        .from('m_employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      if (error) throw error
      return count
    }
  },
  {
    name: 'Units Count (Regular Query)',
    test: async () => {
      const { count, error } = await supabase
        .from('m_units')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      if (error) throw error
      return count
    }
  },
  {
    name: 'Recent Assessments (Regular Query)',
    test: async () => {
      const { data, error } = await supabase
        .from('t_kpi_assessments')
        .select('score, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) throw error
      return data
    }
  },
  {
    name: 'Settings Query (Sidebar Data)',
    test: async () => {
      const { data, error } = await supabase
        .from('t_settings')
        .select('value')
        .eq('key', 'company_info')
        .maybeSingle()
      if (error) throw error
      return data
    }
  }
]

async function runPerformanceTest(test: PerformanceTest, iterations: number = 3): Promise<number[]> {
  const times: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now()
    try {
      await test.test()
      const endTime = Date.now()
      times.push(endTime - startTime)
    } catch (error) {
      console.log(`   ⚠️  Error in iteration ${i + 1}:`, (error as Error).message)
      times.push(9999) // High penalty for errors
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return times
}

function calculateStats(times: number[]) {
  const validTimes = times.filter(t => t < 9999)
  if (validTimes.length === 0) return { avg: 0, min: 0, max: 0 }
  
  const avg = validTimes.reduce((a, b) => a + b, 0) / validTimes.length
  const min = Math.min(...validTimes)
  const max = Math.max(...validTimes)
  
  return { avg: Math.round(avg), min, max }
}

async function testPerformanceImprovements() {
  console.log('🚀 Testing Performance Improvements\n')
  console.log('Running each test 3 times and calculating averages...\n')

  const results: Array<{
    name: string
    stats: { avg: number; min: number; max: number }
    success: boolean
  }> = []

  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`)
    
    const times = await runPerformanceTest(test, 3)
    const stats = calculateStats(times)
    const success = times.every(t => t < 9999)
    
    results.push({ name: test.name, stats, success })
    
    if (success) {
      console.log(`   ✅ Avg: ${stats.avg}ms | Min: ${stats.min}ms | Max: ${stats.max}ms`)
    } else {
      console.log(`   ❌ Test failed or had errors`)
    }
    console.log()
  }

  // Summary
  console.log('📊 Performance Test Summary:')
  console.log('=' .repeat(60))
  
  const optimizedTests = results.filter(r => r.name.includes('Optimized'))
  const regularTests = results.filter(r => r.name.includes('Regular'))
  
  console.log('\n🔧 Optimized Queries:')
  optimizedTests.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`   ${status} ${result.name}: ${result.stats.avg}ms avg`)
  })
  
  console.log('\n📝 Regular Queries (for comparison):')
  regularTests.forEach(result => {
    const status = result.success ? '✅' : '❌'
    console.log(`   ${status} ${result.name}: ${result.stats.avg}ms avg`)
  })

  // Performance recommendations
  console.log('\n💡 Performance Analysis:')
  
  const fastQueries = results.filter(r => r.success && r.stats.avg < 100)
  const slowQueries = results.filter(r => r.success && r.stats.avg >= 500)
  
  if (fastQueries.length > 0) {
    console.log(`   🚀 Fast queries (< 100ms): ${fastQueries.length}`)
  }
  
  if (slowQueries.length > 0) {
    console.log(`   🐌 Slow queries (≥ 500ms): ${slowQueries.length}`)
    slowQueries.forEach(q => {
      console.log(`      - ${q.name}: ${q.stats.avg}ms`)
    })
  }

  const avgOptimized = optimizedTests
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.stats.avg, 0) / optimizedTests.filter(r => r.success).length

  const avgRegular = regularTests
    .filter(r => r.success)
    .reduce((sum, r) => sum + r.stats.avg, 0) / regularTests.filter(r => r.success).length

  if (avgOptimized && avgRegular) {
    const improvement = ((avgRegular - avgOptimized) / avgRegular * 100).toFixed(1)
    console.log(`\n📈 Overall improvement: ${improvement}% faster (${avgRegular}ms → ${avgOptimized}ms)`)
  }

  console.log('\n🎯 Next Steps:')
  console.log('   1. Monitor these metrics in production')
  console.log('   2. Add more indexes if slow queries persist')
  console.log('   3. Consider caching for frequently accessed data')
  console.log('   4. Test with larger datasets to ensure scalability')
}

if (require.main === module) {
  testPerformanceImprovements()
}