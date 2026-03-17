'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  CheckCircle, 
  Award, 
  Target, 
  Activity 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { memo } from 'react'

const iconMap = {
  Users,
  Building2,
  TrendingUp,
  CheckCircle,
  Award,
  Target,
  Activity
}

type IconName = keyof typeof iconMap

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  iconName: IconName
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export const StatCard = memo(function StatCard({ 
  title, 
  value, 
  description, 
  iconName, 
  trend, 
  className 
}: StatCardProps) {
  const Icon = iconMap[iconName]
  
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-5 w-5 text-blue-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn(
            'text-xs mt-2 flex items-center',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            <span className="text-gray-500 ml-1">dari bulan lalu</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
})
