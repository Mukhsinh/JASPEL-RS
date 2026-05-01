'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  Target,
  Wallet,
  FileText,
  BarChart3,
  Settings,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Bell,
  ClipboardCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
interface User {
  id: string
  email: string
  role: 'superadmin' | 'unit_manager' | 'employee'
  full_name?: string
  unit_id?: string
}

interface MenuItem {
  id: string
  label: string
  path: string
  icon?: string
}

const iconMap: Record<string, any> = {
  LayoutDashboard: LayoutDashboard || User,
  Users: Users || User,
  UserCheck: UserCheck || User,
  Building2: Building2 || User,
  Target: Target || User,
  Wallet: Wallet || User,
  FileText: FileText || User,
  BarChart3: BarChart3 || User,
  Settings: Settings || User,
  Shield: Shield || User,
  User: User,
  Bell: Bell || User,
  ClipboardCheck: ClipboardCheck || User,
}

// Simple auth hook
function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          // Get user role from metadata
          const role = session.user.user_metadata?.role || 'employee'

          // Try to get employee data
          const { data: employeeData } = await supabase
            .from('m_employees')
            .select('full_name, unit_id')
            .eq('user_id', session.user.id)
            .maybeSingle()

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            role,
            full_name: employeeData?.full_name || session.user.user_metadata?.full_name,
            unit_id: employeeData?.unit_id,
          })
        }
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  return { user, loading }
}

// Simple menu items function
function getMenuItems(role: string): MenuItem[] {
  const allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard'
    },
    {
      id: 'users',
      label: 'Manajemen Pengguna',
      path: '/users',
      icon: 'Users'
    },
    {
      id: 'pegawai',
      label: 'Data Pegawai',
      path: '/pegawai',
      icon: 'UserCheck'
    },
    {
      id: 'units',
      label: 'Unit Kerja',
      path: '/units',
      icon: 'Building2'
    },
    {
      id: 'kpi-config',
      label: 'Konfigurasi KPI',
      path: '/kpi-config',
      icon: 'Target'
    },
    {
      id: 'pool',
      label: 'Pool Insentif',
      path: '/pool',
      icon: 'Wallet'
    },
    {
      id: 'assessment',
      label: 'Penilaian KPI',
      path: '/assessment',
      icon: 'ClipboardCheck'
    },
    {
      id: 'reports',
      label: 'Laporan',
      path: '/reports',
      icon: 'FileText'
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      path: '/settings',
      icon: 'Settings'
    },
    {
      id: 'notifications',
      label: 'Notifikasi',
      path: '/notifications',
      icon: 'Bell'
    }
  ]

  // Filter based on role
  if (role === 'superadmin') {
    return allMenuItems
  } else if (role === 'unit_manager') {
    return allMenuItems.filter(item =>
      ['dashboard', 'assessment', 'reports', 'notifications'].includes(item.id)
    )
  } else {
    return allMenuItems.filter(item =>
      ['dashboard', 'notifications'].includes(item.id)
    )
  }
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unitName, setUnitName] = useState('')
  const [companyInfo, setCompanyInfo] = useState<any>(null)

  const pathname = usePathname()
  const { user, loading } = useAuth()
  const menuItems = user ? getMenuItems(user.role) : []

  // Load sidebar data
  const loadSidebarData = useCallback(async () => {
    if (!user) return

    try {
      const supabase = createClient()

      // Get company info
      const { data: settingsData } = await supabase
        .from('t_settings')
        .select('value')
        .eq('key', 'company_info')
        .maybeSingle()

      if (settingsData) {
        setCompanyInfo(settingsData.value || null)
      }

      // Get unit name if user is not superadmin
      if (user.role !== 'superadmin' && user.unit_id) {
        const { data: unitData } = await supabase
          .from('m_units')
          .select('name')
          .eq('id', user.unit_id)
          .single()

        if (unitData) {
          setUnitName(unitData.name || '')
        }
      }

      // Get notifications count
      const { count } = await supabase
        .from('t_notification')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error loading sidebar data:', error)
      setCompanyInfo({ name: 'JASPEL KPI', logo: null })
    }
  }, [user])

  useEffect(() => {
    if (user && !loading) {
      loadSidebarData()
    }
  }, [user, loading, loadSidebarData])

  const handleLogout = useCallback(async () => {
    try {
      setShowLogoutDialog(false)
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [])

  const isActive = useCallback((path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }, [pathname])

  const handleNavigation = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 hidden lg:block z-50">
        <div className="p-4">
          <div className="h-8 bg-gray-100 rounded mb-4 animate-pulse"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  if (loading) {
    return (
      <aside className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 hidden lg:block z-50">
        <div className="p-4 animate-pulse">
          <div className="h-8 bg-gray-300 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </aside>
    )
  }

  return (
    <React.Fragment>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 p-2.5 bg-blue-600 text-white rounded-lg shadow-lg z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 shadow-lg',
          'hidden lg:block',
          isCollapsed ? 'w-20' : 'w-72'
        )}
        style={{ zIndex: 1000 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    {companyInfo?.logo ? (
                      <img
                        src={companyInfo.logo}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-blue-600 font-bold text-lg">J</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {companyInfo?.appName || 'JASPEL'}
                    </h1>
                    <p className="text-xs text-blue-100">Sistem Insentif KPI</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 hover:bg-blue-500 rounded-lg transition-colors text-white"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* User Info */}
          {!isCollapsed && user && (
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 truncate">
                    {user.full_name || user.email}
                  </div>
                  {unitName && (
                    <div className="text-xs text-gray-500 truncate">{unitName}</div>
                  )}
                  <div className="mt-1">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'unit_manager' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                    )}>
                      {user.role === 'superadmin' ? 'Superadmin' :
                        user.role === 'unit_manager' ? 'Manager Unit' : 'Pegawai'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = iconMap[item.icon || 'LayoutDashboard']
              const active = isActive(item.path)
              const isNotifications = item.id === 'notifications'

              return (
                <div key={item.id} className="relative group">
                  <Link
                    href={item.path}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200',
                      'hover:bg-gray-50',
                      active && 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md',
                      !active && 'text-gray-700 hover:text-blue-600',
                      isCollapsed && 'justify-center px-2'
                    )}
                    onClick={handleNavigation}
                    aria-label={item.label}
                  >
                    {Icon ? <Icon className="h-5 w-5 flex-shrink-0" /> : <div className="h-5 w-5 flex-shrink-0 bg-red-500 rounded-full" title={`Missing icon: ${item.icon}`} />}
                    {!isCollapsed && (
                      <>
                        <span className="font-medium truncate">{item.label}</span>
                        {isNotifications && unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </>
                    )}
                  </Link>

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => setShowLogoutDialog(true)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200',
                'text-red-600 hover:bg-red-50 hover:text-red-700',
                isCollapsed && 'justify-center px-2'
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Konfirmasi Keluar
            </h3>
            <p className="text-gray-600 mb-4">
              Apakah Anda yakin ingin keluar dari sistem?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
              >
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  )
}