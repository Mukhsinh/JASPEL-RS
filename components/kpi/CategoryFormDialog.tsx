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

interface KPICategory {
  id: string
  unit_id: string
  category: 'P1' | 'P2' | 'P3'
  category_name: string
  weight_percentage: number
  description: string | null
  is_active: boolean
}

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: KPICategory | null
  unitId: string | null
  existingCategories: KPICategory[]
  onSuccess: () => void
}

export default function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  unitId,
  existingCategories,
  onSuccess
}: CategoryFormDialogProps) {
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    category: 'P1' as 'P1' | 'P2' | 'P3',
    category_name: '',
    weight_percentage: '',
    description: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category) {
      setFormData({
        category: category.category,
        category_name: category.category_name,
        weight_percentage: category.weight_percentage.toString(),
        description: category.description || ''
      })
    } else {
      setFormData({
        category: 'P1',
        category_name: '',
        weight_percentage: '',
        description: ''
      })
    }
    setErrors({})
  }, [category, open])

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.category_name.trim()) {
      newErrors.category_name = 'Nama kategori wajib diisi'
    }

    if (!formData.weight_percentage) {
      newErrors.weight_percentage = 'Persentase bobot wajib diisi'
    } else {
      const weight = parseFloat(formData.weight_percentage)
      if (isNaN(weight) || weight <= 0 || weight > 100) {
        newErrors.weight_percentage = 'Bobot harus antara 0.01 dan 100'
      } else {
        // Check if total weight would exceed 100%
        const otherCategories = existingCategories.filter(c => c.id !== category?.id)
        const otherWeightsSum = otherCategories.reduce((sum, c) => sum + Number(c.weight_percentage), 0)
        const totalWeight = otherWeightsSum + weight

        if (totalWeight > 100.01) { // Allow small floating point tolerance
          newErrors.weight_percentage = `Total bobot akan menjadi ${totalWeight.toFixed(2)}% (maksimal 100%)`
        }
      }
    }

    // Check if category type already exists (only for new categories)
    if (!category) {
      const categoryExists = existingCategories.some(c => c.category === formData.category)
      if (categoryExists) {
        newErrors.category = `Kategori ${formData.category} sudah ada untuk unit ini`
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function getTotalWeightInfo(): { total: number; isValid: boolean; message: string } {
    const weight = parseFloat(formData.weight_percentage) || 0
    const otherCategories = existingCategories.filter(c => c.id !== category?.id)
    const otherWeightsSum = otherCategories.reduce((sum, c) => sum + Number(c.weight_percentage), 0)
    const totalWeight = otherWeightsSum + weight
    const isValid = Math.abs(totalWeight - 100) < 0.01

    return {
      total: totalWeight,
      isValid,
      message: isValid 
        ? `Total bobot: ${totalWeight.toFixed(2)}% ✓` 
        : `Total bobot: ${totalWeight.toFixed(2)}% (harus 100%)`
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) return
    if (!unitId && !category) return

    setIsSubmitting(true)

    try {
      const data = {
        unit_id: category?.unit_id || unitId,
        category: formData.category,
        category_name: formData.category_name.trim(),
        weight_percentage: parseFloat(formData.weight_percentage),
        description: formData.description.trim() || null,
        is_active: true
      }

      if (category) {
        // Update existing category
        const { error } = await supabase
          .from('m_kpi_categories')
          .update(data)
          .eq('id', category.id)

        if (error) throw error
      } else {
        // Create new category
        const { error } = await supabase
          .from('m_kpi_categories')
          .insert(data)

        if (error) throw error
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving category:', error)
      alert(error.message || 'Gagal menyimpan kategori')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{category ? 'Ubah Kategori' : 'Tambah Kategori'}</DialogTitle>
            <DialogDescription>
              {category ? 'Perbarui informasi kategori' : 'Buat kategori KPI baru (P1, P2, atau P3)'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Category Type */}
            <div className="space-y-2">
              <Label htmlFor="category">Tipe Kategori *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as 'P1' | 'P2' | 'P3' })}
                disabled={!!category}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
              </select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Category Name */}
            <div className="space-y-2">
              <Label htmlFor="category_name">Nama Kategori *</Label>
              <Input
                id="category_name"
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                placeholder="contoh: Pelayanan Medis"
              />
              {errors.category_name && (
                <p className="text-sm text-red-600">{errors.category_name}</p>
              )}
            </div>

            {/* Weight Percentage */}
            <div className="space-y-2">
              <Label htmlFor="weight_percentage">Persentase Bobot (%) *</Label>
              <Input
                id="weight_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.weight_percentage}
                onChange={(e) => setFormData({ ...formData, weight_percentage: e.target.value })}
                placeholder="contoh: 33.33"
              />
              {errors.weight_percentage && (
                <p className="text-sm text-red-600">{errors.weight_percentage}</p>
              )}
              {formData.weight_percentage && !errors.weight_percentage && (() => {
                const weightInfo = getTotalWeightInfo()
                return (
                  <p className={`text-sm font-medium ${weightInfo.isValid ? 'text-green-600' : 'text-amber-600'}`}>
                    {weightInfo.message}
                  </p>
                )
              })()}
              <p className="text-xs text-gray-500">
                Total semua bobot kategori (P1 + P2 + P3) harus sama dengan 100%
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                placeholder="Deskripsi opsional"
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
              {isSubmitting ? 'Menyimpan...' : category ? 'Perbarui' : 'Buat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
