'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Save, AlertCircle, Target, TrendingUp, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AssessmentStatus } from '@/lib/types/assessment.types'
import type { ScoringCriterion } from '@/lib/types/kpi.types'

interface KPISubIndicator {
  id: string
  indicator_id: string
  code: string
  name: string
  target_value: number
  weight_percentage: number
  scoring_criteria: ScoringCriterion[]
  measurement_unit?: string
  description?: string
}

interface KPIIndicator {
  id: string
  code: string
  name: string
  target_value: number
  weight_percentage: number
  measurement_unit?: string
  description?: string
  sub_indicators: KPISubIndicator[]
}

interface KPICategory {
  category: string
  category_name: string
  weight_percentage: number
  indicators: KPIIndicator[]
}

interface SubAssessmentData {
  sub_indicator_id: string
  realization_value: number
  score: number
}

interface AssessmentData {
  indicator_id: string
  realization_value: number
  achievement_percentage: number
  score: number
  notes: string
  sub_assessments: SubAssessmentData[]
}

interface AssessmentFormDialogProps {
  open: boolean
  onClose: () => void
  employee: AssessmentStatus
  period: string
  onSaved: () => void
}

export default function AssessmentFormDialog({
  open,
  onClose,
  employee,
  period,
  onSaved
}: AssessmentFormDialogProps) {
  const [categories, setCategories] = useState<KPICategory[]>([])
  const [assessments, setAssessments] = useState<Record<string, AssessmentData>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copyingPrevious, setCopyingPrevious] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load KPI indicators and existing assessments
  useEffect(() => {
    if (open && employee) {
      loadKPIIndicators()
      loadExistingAssessments()
    }
  }, [open, employee])

  const loadKPIIndicators = async () => {
    try {
      const response = await fetch(`/api/assessment/indicators?employee_id=${employee.employee_id}&period=${period}`)
      if (response.ok) {
        const data = await response.json()
        setCategories(data.indicators || [])
      } else {
        setError('Failed to load KPI indicators')
      }
    } catch (error) {
      setError('Error loading KPI indicators')
      console.error('Error loading KPI indicators:', error)
    }
  }

  const loadExistingAssessments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/assessment?employee_id=${employee.employee_id}&period=${period}`)
      if (response.ok) {
        const data = await response.json()
        const assessmentMap: Record<string, AssessmentData> = {}

        data.assessments?.forEach((assessment: any) => {
          assessmentMap[assessment.indicator_id] = {
            indicator_id: assessment.indicator_id,
            realization_value: assessment.realization_value,
            achievement_percentage: assessment.achievement_percentage || 0,
            score: assessment.score || 0,
            notes: assessment.notes || '',
            sub_assessments: assessment.sub_assessments || []
          }
        })

        setAssessments(assessmentMap)
      }
    } catch (error) {
      console.error('Error loading existing assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAchievement = (realizationValue: number, targetValue: number): number => {
    if (targetValue <= 0) return 0
    return Math.round((realizationValue / targetValue) * 100 * 100) / 100
  }

  const calculateScore = (achievementPercentage: number): number => {
    return achievementPercentage >= 100 ? 100 : achievementPercentage
  }

  const handleRealizationChange = (indicatorId: string, value: string, targetValue: number) => {
    const realizationValue = parseFloat(value) || 0
    const achievementPercentage = calculateAchievement(realizationValue, targetValue)
    const score = calculateScore(achievementPercentage)

    setAssessments(prev => ({
      ...prev,
      [indicatorId]: {
        indicator_id: indicatorId,
        realization_value: realizationValue,
        achievement_percentage: achievementPercentage,
        score: score,
        notes: prev[indicatorId]?.notes || ''
      }
    }))
  }

  const handleSubAssessmentChange = (indicatorId: string, subIndicatorId: string, realizationValue: number, score: number) => {
    setAssessments(prev => {
      const current = prev[indicatorId] || {
        indicator_id: indicatorId,
        realization_value: 0,
        achievement_percentage: 0,
        score: 0,
        notes: '',
        sub_assessments: []
      }

      const subAssessments = [...(current.sub_assessments || [])]
      const index = subAssessments.findIndex(s => s.sub_indicator_id === subIndicatorId)

      if (index >= 0) {
        subAssessments[index] = { sub_indicator_id: subIndicatorId, realization_value: realizationValue, score }
      } else {
        subAssessments.push({ sub_indicator_id: subIndicatorId, realization_value: realizationValue, score })
      }

      // Find the indicator to get sub-indicator weights
      const indicator = categories.flatMap(c => c.indicators).find(i => i.id === indicatorId)
      let totalAchievement = 0

      if (indicator && indicator.sub_indicators.length > 0) {
        // Calculate weighted average of sub-indicator scores
        totalAchievement = subAssessments.reduce((sum, sub) => {
          const subConfig = indicator.sub_indicators.find(s => s.id === sub.sub_indicator_id)
          const weight = subConfig ? subConfig.weight_percentage : 0
          return sum + (sub.score * weight) / 100
        }, 0)
      } else {
        totalAchievement = current.achievement_percentage
      }

      return {
        ...prev,
        [indicatorId]: {
          ...current,
          sub_assessments: subAssessments,
          achievement_percentage: totalAchievement,
          score: calculateScore(totalAchievement)
        }
      }
    })
  }

  const handleNotesChange = (indicatorId: string, notes: string) => {
    setAssessments(prev => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        indicator_id: indicatorId,
        notes
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      // Prepare assessments for all indicators
      const assessmentPromises = categories.flatMap(category =>
        category.indicators.map(async (indicator) => {
          const assessment = assessments[indicator.id] || {
            indicator_id: indicator.id,
            realization_value: 0,
            achievement_percentage: 0,
            score: 0,
            notes: '',
            sub_assessments: []
          }

          const response = await fetch('/api/assessment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employee_id: employee.employee_id,
              indicator_id: indicator.id,
              period: period,
              realization_value: assessment.realization_value,
              target_value: indicator.target_value,
              weight_percentage: indicator.weight_percentage,
              achievement_percentage: assessment.achievement_percentage,
              notes: assessment.notes,
              sub_assessments: assessment.sub_assessments
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to save assessment')
          }

          return response.json()
        })
      )

      await Promise.all(assessmentPromises)
      onSaved()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save assessments')
      console.error('Error saving assessments:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCopyPrevious = async () => {
    setCopyingPrevious(true)
    setError(null)
    try {
      const response = await fetch(`/api/assessment/previous?employee_id=${employee.employee_id}&current_period=${period}`)
      if (response.ok) {
        const data = await response.json()
        if (data.assessments && data.assessments.length > 0) {
          const assessmentMap: Record<string, AssessmentData> = {}

          data.assessments.forEach((assessment: any) => {
            assessmentMap[assessment.indicator_id] = {
              indicator_id: assessment.indicator_id,
              realization_value: assessment.realization_value,
              achievement_percentage: assessment.achievement_percentage || 0,
              score: assessment.score || 0,
              notes: assessment.notes || '',
              sub_assessments: assessment.sub_assessments || []
            }
          })

          setAssessments((prev) => ({ ...prev, ...assessmentMap }))
        } else {
          setError('Tidak ada data penilaian sebelumnya untuk disalin.')
        }
      } else {
        setError('Gagal menyalin penilaian sebelumnya.')
      }
    } catch (error) {
      console.error('Error copying previous assessments:', error)
      setError('Terjadi kesalahan saat menyalin data.')
    } finally {
      setCopyingPrevious(false)
    }
  }

  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getAchievementBadge = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-100 text-green-800'
    if (percentage >= 80) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Penilaian KPI - {employee.full_name}
          </DialogTitle>
          <DialogDescription>
            Periode: {period} • Unit: {employee.unit_name}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(2)].map((_, j) => (
                        <Skeleton key={j} className="h-20 w-full" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada indikator KPI yang dikonfigurasi untuk unit ini.</p>
            </div>
          ) : (
            categories.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.category} - {category.category_name}</span>
                    <Badge variant="outline">
                      Bobot: {category.weight_percentage}%
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {category.indicators.length} indikator dalam kategori ini
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {category.indicators.map((indicator) => {
                      const assessment = assessments[indicator.id]
                      const realizationValue = assessment?.realization_value || 0
                      const achievementPct = assessment?.achievement_percentage || 0
                      const score = achievementPct // Show achievement as base score
                      const hasSubIndicators = indicator.sub_indicators && indicator.sub_indicators.length > 0

                      return (
                        <div key={indicator.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{indicator.name}</h4>
                              <p className="text-sm text-gray-600">Kode: {indicator.code}</p>
                              {indicator.description && (
                                <p className="text-sm text-gray-500 mt-1">{indicator.description}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="ml-4">
                              Bobot: {indicator.weight_percentage}%
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Target</Label>
                              <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                                {indicator.target_value.toFixed(2)}
                                {indicator.measurement_unit && ` ${indicator.measurement_unit}`}
                              </div>
                            </div>

                            {!hasSubIndicators ? (
                              <div>
                                <Label htmlFor={`realization-${indicator.id}`} className="text-sm font-medium">
                                  Realisasi
                                </Label>
                                <Input
                                  id={`realization-${indicator.id}`}
                                  type="number"
                                  step="0.01"
                                  value={realizationValue || ''}
                                  onChange={(e) => handleRealizationChange(indicator.id, e.target.value, indicator.target_value)}
                                  placeholder="0.00"
                                  className="mt-1"
                                />
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-2 rounded border">
                                <Label className="text-xs text-gray-500">Summary Realisasi</Label>
                                <div className="text-sm font-semibold">Multiple Sub-items</div>
                              </div>
                            )}

                            <div>
                              <Label className="text-sm font-medium">Pencapaian</Label>
                              <div className="mt-1 p-2 rounded border flex items-center gap-2">
                                <TrendingUp className={cn("h-4 w-4", getAchievementColor(achievementPct))} />
                                <span className={cn("font-semibold", getAchievementColor(achievementPct))}>
                                  {achievementPct.toFixed(2)}%
                                </span>
                              </div>
                            </div>

                            <div>
                              <Label className="text-sm font-medium">Skor Dasar</Label>
                              <div className="mt-1">
                                <Badge className={getAchievementBadge(score)}>
                                  {score.toFixed(2)}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Render Sub-Indicators if any */}
                          {hasSubIndicators && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <Label className="text-sm font-bold text-blue-800">Evaluasi Sub-Indikator</Label>
                              <div className="grid gap-3">
                                {indicator.sub_indicators.map((sub) => {
                                  const subAssessment = assessment?.sub_assessments?.find(sa => sa.sub_indicator_id === sub.id)
                                  const subRealization = subAssessment?.realization_value || 0
                                  const subScore = subAssessment?.score || 0
                                  const hasCriteria = sub.scoring_criteria && sub.scoring_criteria.length > 0

                                  return (
                                    <div key={sub.id} className="bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="text-sm font-medium text-gray-800">{sub.name}</p>
                                          <p className="text-xs text-gray-500">
                                            Bobot: {sub.weight_percentage}%
                                            {sub.target_value > 0 && ` • Target: ${sub.target_value}`}
                                          </p>
                                        </div>
                                        <Badge variant="outline" className="bg-white text-xs">
                                          Skor: {subScore.toFixed(2)}
                                        </Badge>
                                      </div>

                                      {hasCriteria ? (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                          {sub.scoring_criteria.map((criterion, cIdx) => (
                                            <Button
                                              key={cIdx}
                                              type="button"
                                              variant={subScore === criterion.score ? 'default' : 'outline'}
                                              size="sm"
                                              className="h-8 text-xs px-2"
                                              onClick={() => handleSubAssessmentChange(indicator.id, sub.id, criterion.score, criterion.score)}
                                            >
                                              {criterion.label} ({criterion.score})
                                            </Button>
                                          ))}
                                        </div>
                                      ) : (
                                        <Input
                                          type="number"
                                          size={1}
                                          className="h-8 text-sm mt-1 bg-white"
                                          placeholder="Ketik nilai..."
                                          value={subRealization || ''}
                                          onChange={(e) => {
                                            const val = parseFloat(e.target.value) || 0
                                            const sTarget = sub.target_value || 1
                                            const sScore = (val / sTarget) * 100
                                            handleSubAssessmentChange(indicator.id, sub.id, val, sScore)
                                          }}
                                        />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          <div>
                            <Label htmlFor={`notes-${indicator.id}`} className="text-sm font-medium">
                              Catatan (Opsional)
                            </Label>
                            <Textarea
                              id={`notes-${indicator.id}`}
                              value={assessment?.notes || ''}
                              onChange={(e) => handleNotesChange(indicator.id, e.target.value)}
                              placeholder="Tambahkan catatan penilaian..."
                              className="mt-1"
                              rows={2}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t w-full">
          <Button
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={handleCopyPrevious}
            disabled={saving || copyingPrevious || loading}
          >
            <Copy className="h-4 w-4 mr-2" />
            {copyingPrevious ? 'Menyalin...' : 'Salin Penilaian'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}