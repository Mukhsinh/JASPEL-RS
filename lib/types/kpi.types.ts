// KPI Types - Consistent type definitions for KPI system

export interface KPICategory {
  id: string
  unit_id: string
  category: 'P1' | 'P2' | 'P3'
  category_name: string
  weight_percentage: number
  description: string | null
  is_active: boolean
}

export interface KPIIndicator {
  id: string
  category_id: string
  code: string
  name: string
  target_value: number
  weight_percentage: number
  measurement_unit: string | null
  description: string | null
  is_active: boolean
}

export interface KPISubIndicator {
  id: string
  indicator_id: string
  code: string
  name: string
  target_value: number
  weight_percentage: number
  score_1: number
  score_2: number
  score_3: number
  score_4: number
  score_5: number
  score_1_label: string
  score_2_label: string
  score_3_label: string
  score_4_label: string
  score_5_label: string
  measurement_unit: string | null
  description: string | null
  is_active: boolean
}

// Extended types with relations
export interface KPIIndicatorWithSubIndicators extends KPIIndicator {
  sub_indicators?: KPISubIndicator[]
}

export interface KPICategoryWithIndicators extends KPICategory {
  indicators?: KPIIndicatorWithSubIndicators[]
}

// Form data types for dialogs
export interface SubIndicatorFormData {
  name: string
  description: string
  weight_percentage: string
  target_value: string
  measurement_unit: string
  score_1: string
  score_2: string
  score_3: string
  score_4: string
  score_5: string
  score_1_label: string
  score_2_label: string
  score_3_label: string
  score_4_label: string
  score_5_label: string
}