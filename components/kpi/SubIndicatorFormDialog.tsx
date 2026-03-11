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
import type { KPIIndicator, KPISubIndicator } from '@/lib/types/kpi.types'

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
        score_1: '20',
        score_2: '40', 
        score_3: '60',
        score_4: '80',
        score_5: '100',
        score_1_label: 'Sangat Kurang',
        score_2_label: 'Kurang',
        score_3_label: 'Cukup',
        score_4_label: 'Baik',
        score_5_label: 'Sangat Baik'
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
                score_1: subIndicator.score_1.toString(),
                score_2: subIndicator.score_2.toString(),
                score_3: subIndicator.score_3.toString(),
                score_4: subIndicator.score_4.toString(),
                score_5: subIndicator.score_5.toString(),
                score_1_label: subIndicator.score_1_label,
                score_2_label: subIndicator.score_2_label,
                score_3_label: subIndicator.score_3_label,
                score_4_label: subIndicator.score_4_label,
                score_5_label: subIndicator.score_5_label
            })
        } else {
            setFormData({
                name: '',
                description: '',
                weight_percentage: '',
                target_value: '',
                measurement_unit: '',
                score_1: '20',
                score_2: '40', 
                score_3: '60',
                score_4: '80',
                score_5: '100',
                score_1_label: 'Sangat Kurang',
                score_2_label: 'Kurang',
                score_3_label: 'Cukup',
                score_4_label: 'Baik',
                score_5_label: 'Sangat Baik'
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

    function validateForm(): boolean {
        const newErrors: Record<string, string> = {}

        if (!formData.name.trim()) {
            newErrors.name = 'Nama sub indikator wajib diisi'
        }

        if (!formData.weight_percentage) {
            newErrors.weight_percentage = 'Bobot wajib diisi'
        } else {
            const weight = parseFloat(formData.weight_percentage)
            if (isNaN(weight) || weight <= 0 || weight > 100) {
                newErrors.weight_percentage = 'Bobot harus antara 0.01 dan 100'
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
                score_1: parseFloat(formData.score_1),
                score_2: parseFloat(formData.score_2),
                score_3: parseFloat(formData.score_3),
                score_4: parseFloat(formData.score_4),
                score_5: parseFloat(formData.score_5),
                score_1_label: formData.score_1_label,
                score_2_label: formData.score_2_label,
                score_3_label: formData.score_3_label,
                score_4_label: formData.score_4_label,
                score_5_label: formData.score_5_label,
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
                const maxCode = Math.max(
                    ...existingSubIndicators.map(s => {
                        const match = s.code.match(/(\d+)$/)
                        return match ? parseInt(match[1]) : 0
                    }),
                    0
                )
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                                    min="0"
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