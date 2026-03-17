'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Pegawai, CreatePegawaiData, UpdatePegawaiData } from '@/lib/types/database.types'

/**
 * Server action to get pegawai with unit data
 */
export async function getPegawaiWithUnits(
  page: number = 1,
  pageSize: number = 50,
  searchTerm: string = ''
): Promise<{ data: Pegawai[]; count: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verify user is superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: [], count: 0, error: 'Tidak terautentikasi' }
    }
    
    // Check if user is superadmin from auth.users metadata
    const role = user.user_metadata?.role
    
    if (!role || role !== 'superadmin') {
      return { data: [], count: 0, error: 'Tidak memiliki akses' }
    }
    
    let query = supabase
      .from('m_employees')
      .select('*, m_units(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Apply search filter
    if (searchTerm) {
      query = query.or(`full_name.ilike.%${searchTerm}%,employee_code.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%`)
    }
    
    // Apply pagination
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Query error:', error)
      return { data: [], count: 0, error: error.message }
    }
    
    // Transform data to match Pegawai type
    const transformedData: Pegawai[] = (data || []).map((item: any) => ({
      ...item,
      m_units: Array.isArray(item.m_units) && item.m_units.length > 0 
        ? item.m_units[0] 
        : undefined
    }))
    
    return { data: transformedData, count: count || 0 }
  } catch (err: any) {
    console.error('getPegawaiWithUnits error:', err)
    return { data: [], count: 0, error: err.message || 'Terjadi kesalahan' }
  }
}

/**
 * Server action to create new pegawai
 */
export async function createPegawai(data: CreatePegawaiData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verify user is superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'superadmin') {
      return { success: false, error: 'Tidak memiliki akses' }
    }
    
    const { error } = await supabase
      .from('m_employees')
      .insert([data])
    
    if (error) {
      console.error('Insert error:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/pegawai')
    return { success: true }
  } catch (err: any) {
    console.error('createPegawai error:', err)
    return { success: false, error: err.message || 'Terjadi kesalahan' }
  }
}

/**
 * Server action to update pegawai
 */
export async function updatePegawai(id: string, data: UpdatePegawaiData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verify user is superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'superadmin') {
      return { success: false, error: 'Tidak memiliki akses' }
    }
    
    const { error } = await supabase
      .from('m_employees')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    
    if (error) {
      console.error('Update error:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/pegawai')
    return { success: true }
  } catch (err: any) {
    console.error('updatePegawai error:', err)
    return { success: false, error: err.message || 'Terjadi kesalahan' }
  }
}

/**
 * Server action to delete pegawai
 */
export async function deletePegawai(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verify user is superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== 'superadmin') {
      return { success: false, error: 'Tidak memiliki akses' }
    }
    
    const { error } = await supabase
      .from('m_employees')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Delete error:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/pegawai')
    return { success: true }
  } catch (err: any) {
    console.error('deletePegawai error:', err)
    return { success: false, error: err.message || 'Terjadi kesalahan' }
  }
}

/**
 * Server action to get all units for dropdown
 */
export async function getUnitsForDropdown(): Promise<{ data: Array<{ id: string; name: string }>; error?: string }> {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: [], error: 'Tidak terautentikasi' }
    }
    
    const { data, error } = await supabase
      .from('m_units')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    if (error) {
      console.error('Units query error:', error)
      return { data: [], error: error.message }
    }
    
    return { data: data || [] }
  } catch (err: any) {
    console.error('getUnitsForDropdown error:', err)
    return { data: [], error: err.message || 'Terjadi kesalahan' }
  }
}
