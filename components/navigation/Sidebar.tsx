'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth, useMenuItems } from '@/lib/hooks/useAuth'
import { authService } from '@/lib/services/auth.service'
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

const iconMap: Record<string, any> = {
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
  Bell,
  ClipboardCheck,
}

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unitName, setUnitName] = useState('')
  const [companyInfo, setCompanyInfo] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const menuItems = useMenuItems()

  // Load company info including logo
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('t_settings')
          .select('value')
          .eq('key', 'company_info')
          .maybeSingle()
        
        if (!error && data) {
          setCompanyInfo(data.value || null)
        }
      } catch (error) {
        console.error('Failed to load company info:', error)
      }
    }
    loadCompanyInfo()
  }, [])

  useEffect(() => {
    const loadUnitName = async () => {
      if (!user?.unit_id) return
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('m_units')
          .select('name')
          .eq('id', user.unit_id)
          .single()
        if (data) setUnitName(data.name)
      } catch (error) {
        console.error('Failed to load unit name:', error)
      }
    }
    loadUnitName()
  }, [user?.unit_id])

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications?unreadOnly=true', {
          headers: { 'Cache-Control': 'max-age=120' }
        })
        if (response.ok) {
          const data = await response.json()
          setUnreadCount(data.count || 0)
        }
      } catch (error) {
        // Silently fail
      }
    }
    loadUnreadCount()
    const interval = setInterval(loadUnreadCount, 120000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      setShowLogoutDialog(false)

      // Call logout service (which handles all cleanup)
      await authService.logout()

      // The authService.logout() already handles redirect,
      // but we add this as a fallback
      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)

      // Force redirect even on error
      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    }
  }, [])

  const isActive = useCallback((path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }, [pathname])

  const handleNavigation = useCallback((path: string) => {
    setIsMobileOpen(false)
  }, [])

  const getRoleBadge = () => {
    if (!user) return null
    const roleLabels = {
      superadmin: 'Superadmin',
      unit_manager: 'Manager Unit',
      employee: 'Pegawai'
    }
    const roleColors = {
      superadmin: 'bg-purple-100 text-purple-700',
      unit_manager: 'bg-blue-100 text-blue-700',
      employee: 'bg-green-100 text-green-700'
    }
    return (
      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', roleColors[user.role])}>
        {roleLabels[user.role]}
      </span>
    )
  }

  return (
    <React.Fragment>
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        style={{ zIndex: 1100 }}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 transition-all duration-300 shadow-lg',
          'hidden lg:block',
          isCollapsed ? 'w-20' : 'w-72'
        )}
        style={{ zIndex: 1000 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={cn(
            'p-5 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700',
            'flex items-center justify-between'
          )}>
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden">
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
            {isCollapsed && (
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md mx-auto overflow-hidden">
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
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'p-1.5 hover:bg-blue-500 rounded-lg transition-colors text-white',
                isCollapsed && 'hidden'
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* User Info */}
          {!isCollapsed && user && (
            <div className="p-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">
                    {user.full_name || user.email}
                  </div>
                  {unitName && (
                    <div className="text-xs text-slate-500 truncate">{unitName}</div>
                  )}
                  <div className="mt-1">{getRoleBadge()}</div>
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
                      'hover:bg-white hover:shadow-sm',
                      active && 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg',
                      !active && 'text-slate-700 hover:text-blue-600',
                      isCollapsed && 'justify-center px-2'
                    )}
                    aria-label={item.label}
                  >
                    <div className="relative flex-shrink-0">
                      <Icon className={cn(
                        'h-5 w-5 transition-transform duration-200',
                        active && 'scale-110'
                      )} />
                      {isNotifications && unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-semibold shadow-sm">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                    )}
                    {!isCollapsed && isNotifications && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold shadow-sm">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-lg z-50">
                      {item.label}
                      {isNotifications && unreadCount > 0 && ` (${unreadCount})`}
                      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <button
              onClick={() => setShowLogoutDialog(true)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200',
                'hover:bg-red-50 text-red-600 hover:shadow-sm',
                isCollapsed && 'justify-center px-2'
              )}
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium">Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0" style={{ zIndex: 1050 }}>
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-screen w-80 bg-gradient-to-b from-slate-50 to-white border-r border-slate-200 shadow-2xl" style={{ zIndex: 1051 }}>
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-blue-600 font-bold text-lg">J</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">JASPEL</h1>
                    <p className="text-xs text-blue-100">Sistem Insentif KPI</p>
                  </div>
                </div>
              </div>

              {/* Mobile User Info */}
              {user && (
                <div className="p-4 border-b border-slate-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                      {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-900 truncate">
                        {user.full_name || user.email}
                      </div>
                      {unitName && (
                        <div className="text-xs text-slate-500 truncate">{unitName}</div>
                      )}
                      <div className="mt-1">{getRoleBadge()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Navigation */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {menuItems.map((item) => {
                  const Icon = iconMap[item.icon || 'LayoutDashboard']
                  const active = isActive(item.path)
                  const isNotifications = item.id === 'notifications'

                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200',
                        'hover:bg-white hover:shadow-sm',
                        active && 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md',
                        !active && 'text-slate-700 hover:text-blue-600'
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Icon className={cn(
                          'h-5 w-5 transition-transform duration-200',
                          active && 'scale-110'
                        )} />
                        {isNotifications && unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-semibold shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      {isNotifications && unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Mobile Logout */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <button
                  onClick={() => {
                    setIsMobileOpen(false)
                    setShowLogoutDialog(true)
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 hover:bg-red-50 text-red-600 hover:shadow-sm"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Keluar</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      {showLogoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 1200 }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-center mb-2 text-slate-900">Konfirmasi Keluar</h2>
            <p className="text-slate-600 text-center mb-6">Apakah Anda yakin ingin keluar dari sistem?</p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(false)}
                className="flex-1 border-slate-300 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md"
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  )
}
