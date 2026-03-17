#!/usr/bin/env tsx

/**
 * Performance monitoring script
 * Monitors key metrics and alerts on performance issues
 */

import { createClient } from '@supabase/supabase-js'
import { setTimeout } from 'timers/promises'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  threshold: number
  status: 'good' | 'warning' | 'critical'
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private isRunning = false

  async measureDashboardStats(): Promise<number> {
    const startTime = Date.now()
    try {
      const { error } = await supabase.rpc('get_dashboard_stats')
      if (error) throw error
      return Date.now() - startTime
    } catch (error) {
      return 9999 // Error penalty
    }
  }

  async measureTopPerformers(): Promise<number> {
    const startTime = Date.now()
    try {
      const { error } = await supabase.rpc('get_top_performers', { performer_limit: 5 })
      if (error) throw error
      return Date.now() - startTime
    } catch (error) {
      return 9999
    }
  }

  async measureUnitPerformance(): Promise<number> {
    const startTime = Date.now()
    try {
      const { error } = await supabase.rpc('get_unit_performance')
      if (error) throw error
      return Date.now() - startTime
    } catch (error) {
      return 9999
    }
  }

  async measureEmployeeCount(): Promise<number> {
    const startTime = Date.now()
    try {
      const { error } = await supabase
        .from('m_employees')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      if (error) throw error
      return Date.now() - startTime
    } catch (error) {
      return 9999
    }
  }

  async measureApiEndpoint(endpoint: string): Promise<number> {
    const startTime = Date.now()
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'HEAD'
      })
      return Date.now() - startTime
    } catch (error) {
      return 9999
    }
  }

  getStatus(value: number, threshold: number): 'good' | 'warning' | 'critical' {
    if (value >= 9999) return 'critical'
    if (value > threshold * 2) return 'critical'
    if (value > threshold) return 'warning'
    return 'good'
  }

  getStatusIcon(status: 'good' | 'warning' | 'critical'): string {
    switch (status) {
      case 'good': return '✅'
      case 'warning': return '⚠️ '
      case 'critical': return '❌'
    }
  }

  async collectMetrics(): Promise<void> {
    console.log('📊 Collecting performance metrics...')
    
    this.metrics = []

    // Database queries
    const dashboardTime = await this.measureDashboardStats()
    this.metrics.push({
      name: 'Dashboard Stats Query',
      value: dashboardTime,
      unit: 'ms',
      threshold: 100,
      status: this.getStatus(dashboardTime, 100)
    })

    const performersTime = await this.measureTopPerformers()
    this.metrics.push({
      name: 'Top Performers Query',
      value: performersTime,
      unit: 'ms', 
      threshold: 150,
      status: this.getStatus(performersTime, 150)
    })

    const unitsTime = await this.measureUnitPerformance()
    this.metrics.push({
      name: 'Unit Performance Query',
      value: unitsTime,
      unit: 'ms',
      threshold: 200,
      status: this.getStatus(unitsTime, 200)
    })

    const employeeTime = await this.measureEmployeeCount()
    this.metrics.push({
      name: 'Employee Count Query',
      value: employeeTime,
      unit: 'ms',
      threshold: 50,
      status: this.getStatus(employeeTime, 50)
    })

    // API endpoints (if server is running)
    try {
      const statsApiTime = await this.measureApiEndpoint('/api/dashboard/stats')
      this.metrics.push({
        name: 'Stats API Endpoint',
        value: statsApiTime,
        unit: 'ms',
        threshold: 300,
        status: this.getStatus(statsApiTime, 300)
      })

      const perfApiTime = await this.measureApiEndpoint('/api/dashboard/performance')
      this.metrics.push({
        name: 'Performance API Endpoint', 
        value: perfApiTime,
        unit: 'ms',
        threshold: 500,
        status: this.getStatus(perfApiTime, 500)
      })
    } catch (error) {
      console.log('   ⚠️  API endpoints not available (server not running?)')
    }
  }

  displayMetrics(): void {
    console.clear()
    console.log('🚀 JASPEL KPI - Performance Monitor')
    console.log('=' .repeat(60))
    console.log(`📅 ${new Date().toLocaleString('id-ID')}`)
    console.log()

    // Group by status
    const goodMetrics = this.metrics.filter(m => m.status === 'good')
    const warningMetrics = this.metrics.filter(m => m.status === 'warning')
    const criticalMetrics = this.metrics.filter(m => m.status === 'critical')

    // Display metrics
    this.metrics.forEach(metric => {
      const icon = this.getStatusIcon(metric.status)
      const value = metric.value >= 9999 ? 'ERROR' : `${metric.value}${metric.unit}`
      console.log(`${icon} ${metric.name}: ${value}`)
    })

    console.log()
    console.log('📈 Summary:')
    console.log(`   ✅ Good: ${goodMetrics.length}`)
    console.log(`   ⚠️  Warning: ${warningMetrics.length}`)
    console.log(`   ❌ Critical: ${criticalMetrics.length}`)

    if (criticalMetrics.length > 0) {
      console.log()
      console.log('🚨 Critical Issues:')
      criticalMetrics.forEach(metric => {
        console.log(`   • ${metric.name}: ${metric.value}${metric.unit} (threshold: ${metric.threshold}${metric.unit})`)
      })
    }

    if (warningMetrics.length > 0) {
      console.log()
      console.log('⚠️  Performance Warnings:')
      warningMetrics.forEach(metric => {
        console.log(`   • ${metric.name}: ${metric.value}${metric.unit} (threshold: ${metric.threshold}${metric.unit})`)
      })
    }

    // Performance score
    const totalMetrics = this.metrics.length
    const score = Math.round((goodMetrics.length / totalMetrics) * 100)
    
    console.log()
    console.log(`🎯 Performance Score: ${score}%`)
    
    if (score >= 90) {
      console.log('   🚀 Excellent performance!')
    } else if (score >= 70) {
      console.log('   👍 Good performance')
    } else if (score >= 50) {
      console.log('   ⚠️  Performance needs attention')
    } else {
      console.log('   🚨 Critical performance issues')
    }

    console.log()
    console.log('Press Ctrl+C to stop monitoring')
    console.log('Next update in 10 seconds...')
  }

  async start(): Promise<void> {
    this.isRunning = true
    console.log('🎯 Starting performance monitoring...')
    console.log('Monitoring will update every 10 seconds')
    console.log()

    while (this.isRunning) {
      await this.collectMetrics()
      this.displayMetrics()
      await setTimeout(10000) // Update every 10 seconds
    }
  }

  stop(): void {
    this.isRunning = false
    console.log('\n👋 Performance monitoring stopped')
  }
}

async function startPerformanceMonitoring() {
  const monitor = new PerformanceMonitor()
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    monitor.stop()
    process.exit(0)
  })

  await monitor.start()
}

if (require.main === module) {
  startPerformanceMonitoring()
}