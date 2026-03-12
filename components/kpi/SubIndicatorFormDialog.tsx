'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2 } from 'lucide-react'
import type { KPIIndicator, KPISubIndicator, ScoringCriterion } from '@/lib/types/kpi.types'

interface SubIndicatorFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    subIndicator: KPISubIndicator | null
    indicator: KPIIndicator | null
    existingSubIndicators: KPISubIndicator[]
    onSuccess: () => void
}

export default function SubIndicatorFormDialog({
    open,
    onOpenChange,
    subIndicator,
    indicator,
    existingSubIndicators,
    onSuccess
}: SubIndicatorFormDialogProps) {
    const supabase = createClient()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        weight_percentage: '',
        target_value: '',
        measurement_unit: '',
        scoring_criteria: [
            { score: 20, label: 'Sangat Kurang' },
            { score: 40, label: 'Kurang' },
            { score: 60, label: 'Cukup' },
            { score: 80, label: 'Baik' },
            { score: 100, label: 'Sangat Baik' }
        ] as ScoringCriterion[]
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        if (subIndicator) {
            setFormData({
                name: subIndicator.name,
                description: subIndicator.description || '',
                weight_percentage: subIndicator.weight_percentage.toString(),
                target_value: subIndicator.target_value?.toString() || '',
                measurement_unit: subIndicator.measurement_unit || '',
                scoring_criteria: subIndicator.scoring_criteria || [
                    { score: 20, label: 'Sangat Kurang' },
                    { score: 40, label: 'Kurang' },
                    { score: 60, label: 'Cukup' },
                    { score: 80, label: 'Baik' },
                    { score: 100, label: 'Sangat Baik' }
                ]
            })
        } else {
            setFormData({
                name: '',
                description: '',
                weight_percentage: '',
                target_value: '',
                measurement_unit: '',
                scoring_criteria: [
                    { score: 20, label: 'Sangat Kurang' },
                    { score: 40, label: 'Kurang' },
                    { score: 60, label: 'Cukup' },
                    { score: 80, label: 'Baik' },
                    { score: 100, label: 'Sangat Baik' }
                ]
            })
        }
        setErrors({})
    }, [subIndicator, open])

    function getTotalWeightInfo(): { total: number; isValid: boolean; message: string } {
        const weight = parseFloat(formData.weight_percentage) || 0
        const others = existingSubIndicators.filter(s => s.id !== subIndicator?.id)
        const otherWeightsSum = others.reduce((sum, s) => sum + Number(s.weight_percentage), 0)
        const totalWeight = otherWeightsSum + weight
        const isValid = Math.abs(totalWeight - 100) < 0.01

        return {
            total: totalWeight,
            isValid,
            message: isValid
                ? `Total bobot: ${totalWeight.toFixed(2)}% ✓`
                : `Total bobot: ${totalWeight.toFixed(2)}% (target 100%)`
        }
    }

    function addScoringCriterion() {
        const newCriteria = [...formData.scoring_criteria]
        const lastScore = newCriteria.length > 0 ? newCriteria[newCriteria.length - 1].score : 0
        newCriteria.push({
            score: lastScore + 20,
            label: `Kriteria ${newCriteria.length + 1}`
        })
        setFormData({ ...formData, scoring_criteria: newCriteria })
    }

    function removeScoringCriterion(index: number) {
        if (formData.scoring_criteria.length <= 1) return // Keep at least one criterion
        const newCriteria = formData.scoring_criteria.filter((_, i) => i !== index)
        setFormData({ ...formData, scoring_criteria: newCriteria })
    }

    function updateScoringCriterion(index: number, field: 'score' | 'label', value: string | number) {
        const newCriteria = [...formData.scoring_criteria]
        if (field === 'score') {
            newCriteria[index].score = typeof value === 'string' ? parseFloat(value) || 0 : value
        } else {
            newCriteria[index].label = value.toString()
        }
        setFormData({ ...formData, scoring_criteria: newCriteria })
    }

    function validateForm(): boolean {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Nama sub indikator wajib diisi'
        }

        if (!formData.weight_percentage) {
            newErrors.weight_percentage = 'Bobot wajib diisi'
        } else {
            const weight = parseFloat(formData.weight_percentage)
            if (isNaN(weight) || weight <= 0) {
                newErrors.weight_percentage = 'Bobot harus lebih besar dari 0'
            } else {
                // Validate total weight doesn't exceed 100%
                const others = existingSubIndicators.filter(s => s.id !== subIndicator?.id)
                const otherWeightsSum = others.reduce((sum, s) => sum + Number(s.weight_percentage), 0)
                const totalWeight = otherWeightsSum + weight
                
                if (totalWeight > 100.01) { // Allow small floating point tolerance
                    newErrors.weight_percentage = `Total bobot akan menjadi ${totalWeight.toFixed(2)}% (maksimal 100%)`
                }
            }
        }

        if (formData.target_value && isNaN(parseFloat(formData.target_value))) {
            newErrors.target_value = 'Nilai target harus berupa angka'
        }

        // Validate scoring criteria
        if (formData.scoring_criteria.length === 0) {
            newErrors.scoring_criteria = 'Minimal harus ada satu kriteria penilaian'
        } else {
            formData.scoring_criteria.forEach((criterion, index) => {
                if (isNaN(criterion.score) || criterion.score < 0) {
                    newErrors[`score_${index}`] = `Skor kriteria ${index + 1} harus berupa angka positif`
                }
                if (!criterion.label.trim()) {
                    newErrors[`label_${index}`] = `Label kriteria ${index + 1} wajib diisi`
                }
            })

            // Check for duplicate scores
            const scores = formData.scoring_criteria.map(c => c.score)
            const duplicateScores = scores.filter((score, index) => scores.indexOf(score) !== index)
            if (duplicateScores.length > 0) {
                newErrors.scoring_criteria = 'Skor kriteria tidak boleh sama'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!validateForm()) return
        if (!indicator && !subIndicator) return

        setIsSubmitting(true)

        try {
            const data = {
                indicator_id: subIndicator?.indicator_id || indicator?.id,
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                weight_percentage: parseFloat(formData.weight_percentage),
                target_value: formData.target_value ? parseFloat(formData.target_value) : 100,
                measurement_unit: formData.measurement_unit.trim() || null,
                scoring_criteria: JSON.stringify(formData.scoring_criteria),
                is_active: true
            }

            if (subIndicator) {
                const { error } = await supabase
                    .from('m_kpi_sub_indicators')
                    .update(data)
                    .eq('id', subIndicator.id)

                if (error) throw error
            } else {
                // Generate code for new sub indicator
                const existingCodes = existingSubIndicators.map(s => {
                    const match = s.code.match(/(\d+)$/)
                    return match ? parseInt(match[1]) : 0
                })
                const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0
                const newCode = `SUB${String(maxCode + 1).padStart(3, '0')}`

                const { error } = await supabase
                    .from('m_kpi_sub_indicators')
                    .insert({ ...data, code: newCode })

                if (error) throw error
            }

            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error saving sub indicator:', error)
            alert(error.message || 'Gagal menyimpan sub indikator')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{subIndicator ? 'Ubah Sub Indikator' : 'Tambah Sub Indikator'}</DialogTitle>
                        <DialogDescription>
                            {subIndicator
                                ? 'Perbarui informasi sub indikator'
                                : `Buat sub indikator baru untuk ${indicator?.name}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="sub_name">Nama Sub Indikator *</Label>
                            <Input
                                id="sub_name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="contoh: Ketepatan Waktu Pelayanan"
                            />
                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sub_weight">Bobot (%) *</Label>
                                <Input
                                    id="sub_weight"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max="100"
                                    value={formData.weight_percentage}
                                    onChange={(e) => setFormData({ ...formData, weight_percentage: e.target.value })}
                                    placeholder="25.00"
                                />
                                {errors.weight_percentage && <p className="text-sm text-red-600">{errors.weight_percentage}</p>}
                                {formData.weight_percentage && !errors.weight_percentage && (() => {
                                    const weightInfo = getTotalWeightInfo()
                                    return (
                                        <p className={`text-xs font-medium ${weightInfo.isValid ? 'text-green-600' : 'text-amber-600'}`}>
                                            {weightInfo.message}
                                        </p>
                                    )
                                })()}
                                <p className="text-xs text-gray-500">
                                    Total semua bobot sub indikator dalam indikator ini harus sama dengan 100%. Bobot individual bisa kurang dari 100%.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sub_target">Nilai Target</Label>
                                <Input
                                    id="sub_target"
                                    type="number"
                                    step="0.01"
                                    value={formData.target_value}
                                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                                    placeholder="100.00"
                                />
                                {errors.target_value && <p className="text-sm text-red-600">{errors.target_value}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sub_unit">Satuan</Label>
                            <Input
                                id="sub_unit"
                                value={formData.measurement_unit}
                                onChange={(e) => setFormData({ ...formData, measurement_unit: e.target.value })}
                                placeholder="%, pasien, jam"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sub_description">Deskripsi</Label>
                            <Textarea
                                id="sub_description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Deskripsi opsional"
                                rows={3}
                            />
                        </div>

                        {/* Kriteria Pengukuran - Dynamic */}
                        <div className="space-y-4">
                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-semibold">Kriteria Pengukuran Nilai/Skor</Label>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Tentukan kriteria penilaian untuk setiap level skor. Anda dapat menambah atau mengurangi kriteria sesuai kebutuhan.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addScoringCriterion}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Tambah Kriteria
                                    </Button>
                                </div>
                                {errors.scoring_criteria && <p className="text-sm text-red-600 mt-2">{errors.scoring_criteria}</p>}
                            </div>

                            <div className="space-y-3">
                                {formData.scoring_criteria.map((criterion, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 border rounded-lg">
                                        <div className="col-span-2 space-y-1">
                                            <Label htmlFor={`score_${index}`} className="text-sm">
                                                Skor {index + 1}
                                            </Label>
                                            <Input
                                                id={`score_${index}`}
                                                type="number"
                                                step="0.01"
                                                value={criterion.score}
                                                onChange={(e) => updateScoringCriterion(index, 'score', e.target.value)}
                                                placeholder="0"
                                            />
                                            {errors[`score_${index}`] && (
                                                <p className="text-xs text-red-600">{errors[`score_${index}`]}</p>
                                            )}
                                        </div>
                                        <div className="col-span-8 space-y-1">
                                            <Label htmlFor={`label_${index}`} className="text-sm">
                                                Label/Kriteria
                                            </Label>
                                            <Input
                                                id={`label_${index}`}
                                                value={criterion.label}
                                                onChange={(e) => updateScoringCriterion(index, 'label', e.target.value)}
                                                placeholder="Deskripsi kriteria"
                                            />
                                            {errors[`label_${index}`] && (
                                                <p className="text-xs text-red-600">{errors[`label_${index}`]}</p>
                                            )}
                                        </div>
                                        <div className="col-span-2 flex items-end">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeScoringCriterion(index)}
                                                disabled={formData.scoring_criteria.length <= 1}
                                                className="w-full"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-blue-50 p-3 rounded-md">
                                <p className="text-sm text-blue-800">
                                    <strong>Petunjuk:</strong> Skor menunjukkan nilai yang akan diberikan untuk setiap level pencapaian. 
                                    Label/Kriteria menjelaskan kondisi atau pencapaian yang diperlukan untuk mendapat skor tersebut.
                                    Anda dapat menambah kriteria sebanyak yang diperlukan dengan mengklik tombol "Tambah Kriteria".
                                </p>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Menyimpan...' : subIndicator ? 'Perbarui' : 'Buat'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}