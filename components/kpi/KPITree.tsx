'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Edit, Trash2, Plus, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KPICategory {
  id: string
  unit_id: string
  category: 'P1' | 'P2' | 'P3'
  category_name: string
  weight_percentage: number
  description: string | null
  is_active: boolean
}

interface KPIIndicator {
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

interface KPISubIndicator {
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

interface KPITreeProps {
  categories: KPICategory[]
  indicators: KPIIndicator[]
  subIndicators: KPISubIndicator[]
  onEditCategory: (category: KPICategory) => void
  onDeleteCategory: (categoryId: string) => void
  onAddIndicator: (categoryId: string) => void
  onEditIndicator: (indicator: KPIIndicator) => void
  onDeleteIndicator: (indicatorId: string) => void
  onAddSubIndicator: (indicatorId: string) => void
  onEditSubIndicator: (subIndicator: KPISubIndicator) => void
  onDeleteSubIndicator: (subIndicatorId: string) => void
}

export default function KPITree({
  categories,
  indicators,
  subIndicators,
  onEditCategory,
  onDeleteCategory,
  onAddIndicator,
  onEditIndicator,
  onDeleteIndicator,
  onAddSubIndicator,
  onEditSubIndicator,
  onDeleteSubIndicator
}: KPITreeProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(categories.map(c => c.id))
  )
  const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(new Set())

  function toggleCategory(categoryId: string) {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  function toggleIndicator(indicatorId: string) {
    const newExpanded = new Set(expandedIndicators)
    if (newExpanded.has(indicatorId)) {
      newExpanded.delete(indicatorId)
    } else {
      newExpanded.add(indicatorId)
    }
    setExpandedIndicators(newExpanded)
  }

  function getCategoryIndicators(categoryId: string) {
    return indicators.filter(i => i.category_id === categoryId)
  }

  function getIndicatorSubIndicators(indicatorId: string) {
    return subIndicators.filter(s => s.indicator_id === indicatorId)
  }

  function calculateIndicatorWeightSum(categoryId: string) {
    const categoryIndicators = getCategoryIndicators(categoryId)
    return categoryIndicators.reduce((sum, ind) => sum + Number(ind.weight_percentage), 0)
  }

  function calculateSubIndicatorWeightSum(indicatorId: string) {
    const subs = getIndicatorSubIndicators(indicatorId)
    return subs.reduce((sum, s) => sum + Number(s.weight_percentage), 0)
  }

  function calculateCategoryWeightSum() {
    return categories.reduce((sum, cat) => sum + Number(cat.weight_percentage), 0)
  }

  const categoryWeightSum = calculateCategoryWeightSum()
  const isValidCategorySum = Math.abs(categoryWeightSum - 100) <= 0.01

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Belum ada kategori KPI untuk unit ini.</p>
        <p className="text-sm mt-2">Klik &quot;Tambah Kategori&quot; untuk membuat kategori P1, P2, atau P3.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Category Weight Sum Validation */}
      <div className={`p-3 rounded-lg ${isValidCategorySum ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <p className={`text-sm font-medium ${isValidCategorySum ? 'text-green-800' : 'text-red-800'}`}>
          Total Bobot Kategori: {categoryWeightSum.toFixed(2)}%
          {isValidCategorySum ? ' ✓' : ' (Harus sama dengan 100%)'}
        </p>
      </div>

      {/* Categories */}
      {categories.map(category => {
        const isExpanded = expandedCategories.has(category.id)
        const categoryIndicators = getCategoryIndicators(category.id)
        const indicatorWeightSum = calculateIndicatorWeightSum(category.id)
        const isValidIndicatorSum = Math.abs(indicatorWeightSum - 100) <= 0.01

        return (
          <div key={category.id} className="border rounded-lg overflow-hidden">
            {/* Category Header */}
            <div className="p-4 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{category.category}</span>
                    <span className="text-gray-700">{category.category_name}</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {Number(category.weight_percentage).toFixed(2)}%
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                  )}
                  {categoryIndicators.length > 0 && (
                    <p className={`text-xs mt-1 ${isValidIndicatorSum ? 'text-green-600' : 'text-red-600'}`}>
                      Bobot indikator: {indicatorWeightSum.toFixed(2)}%
                      {isValidIndicatorSum ? ' ✓' : ' (Harus sama dengan 100%)'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddIndicator(category.id)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Indikator
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditCategory(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDeleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>

            {/* Indicators */}
            {isExpanded && (
              <div className="p-4 space-y-2">
                {categoryIndicators.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Belum ada indikator. Klik &quot;Tambah Indikator&quot; untuk membuat indikator baru.
                  </p>
                ) : (
                  categoryIndicators.map(indicator => {
                    const isIndicatorExpanded = expandedIndicators.has(indicator.id)
                    const indicatorSubs = getIndicatorSubIndicators(indicator.id)
                    const subWeightSum = calculateSubIndicatorWeightSum(indicator.id)
                    const isValidSubSum = indicatorSubs.length === 0 || Math.abs(subWeightSum - 100) <= 0.01

                    return (
                      <div key={indicator.id} className="border rounded-lg overflow-hidden">
                        {/* Indicator Row */}
                        <div className="flex items-center justify-between p-3 bg-white hover:bg-gray-50">
                          <div className="flex items-center gap-3 flex-1">
                            {/* Expand/collapse button for sub indicators */}
                            <button
                              onClick={() => toggleIndicator(indicator.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              {isIndicatorExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm text-gray-600">{indicator.code}</span>
                                <span className="font-medium">{indicator.name}</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                                  {Number(indicator.weight_percentage).toFixed(2)}%
                                </span>
                                {indicatorSubs.length > 0 && (
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                                    <Layers className="h-3 w-3 inline mr-1" />
                                    {indicatorSubs.length} sub
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-4 mt-1 text-sm text-gray-600">
                                <span>Target: {Number(indicator.target_value).toFixed(2)}</span>
                                {indicator.measurement_unit && (
                                  <span>Satuan: {indicator.measurement_unit}</span>
                                )}
                              </div>
                              {indicator.description && (
                                <p className="text-xs text-gray-500 mt-1">{indicator.description}</p>
                              )}
                              {indicatorSubs.length > 0 && (
                                <p className={`text-xs mt-1 ${isValidSubSum ? 'text-green-600' : 'text-amber-600'}`}>
                                  Bobot sub indikator: {subWeightSum.toFixed(2)}%
                                  {isValidSubSum ? ' ✓' : ' (Harus sama dengan 100%)'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAddSubIndicator(indicator.id)}
                              title="Tambah Sub Indikator"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              <span className="text-xs">Sub</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditIndicator(indicator)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteIndicator(indicator.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>

                        {/* Sub Indicators */}
                        {isIndicatorExpanded && (
                          <div className="bg-slate-50 border-t">
                            {indicatorSubs.length === 0 ? (
                              <p className="text-sm text-gray-400 text-center py-3 px-4">
                                Belum ada sub indikator.
                                <button
                                  onClick={() => onAddSubIndicator(indicator.id)}
                                  className="text-blue-600 hover:underline ml-1"
                                >
                                  Tambah sekarang
                                </button>
                              </p>
                            ) : (
                              <div className="p-3 space-y-2">
                                {indicatorSubs.map(sub => (
                                  <div
                                    key={sub.id}
                                    className="bg-white rounded-lg border p-3 hover:shadow-sm transition-shadow"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-mono text-xs text-gray-500">{sub.code}</span>
                                          <span className="text-sm font-medium">{sub.name}</span>
                                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                                            {Number(sub.weight_percentage).toFixed(2)}%
                                          </span>
                                        </div>
                                        {/* Score badges */}
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                          {[
                                            { val: sub.score_1, label: sub.score_1_label, color: 'bg-red-100 text-red-700 border-red-200' },
                                            { val: sub.score_2, label: sub.score_2_label, color: 'bg-orange-100 text-orange-700 border-orange-200' },
                                            { val: sub.score_3, label: sub.score_3_label, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                                            { val: sub.score_4, label: sub.score_4_label, color: 'bg-blue-100 text-blue-700 border-blue-200' },
                                            { val: sub.score_5, label: sub.score_5_label, color: 'bg-green-100 text-green-700 border-green-200' },
                                          ].map((s, idx) => (
                                            <span
                                              key={idx}
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${s.color}`}
                                              title={s.label}
                                            >
                                              <span className="font-bold">{Number(s.val)}</span>
                                              <span className="opacity-70">({s.label})</span>
                                            </span>
                                          ))}
                                        </div>
                                        {sub.description && (
                                          <p className="text-xs text-gray-500 mt-1.5">{sub.description}</p>
                                        )}
                                      </div>
                                      <div className="flex gap-1 ml-2 shrink-0">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => onEditSubIndicator(sub)}
                                          className="h-7 w-7 p-0"
                                        >
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            onDeleteSubIndicator(sub.id)
                                          }}
                                          className="h-7 w-7 p-0 hover:bg-red-50"
                                          title="Hapus Sub Indikator"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
