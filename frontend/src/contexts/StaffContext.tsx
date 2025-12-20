'use client'

import React from 'react'
import { useAuth } from './AuthContext'
import { staffApi } from '@/lib/api'

export type UserRole = 'owner' | 'manager' | 'worker'

export type StaffMember = {
  id: string
  email: string
  displayName: string
  role: UserRole
  active: boolean
  createdAt: string
  updatedAt: string
}

export type Permission = 
  | 'view_sales' 
  | 'create_sales' 
  | 'edit_sales' 
  | 'delete_sales'
  | 'view_expenses' 
  | 'create_expenses' 
  | 'edit_expenses' 
  | 'delete_expenses'
  | 'view_reports' 
  | 'export_data'
  | 'manage_staff'
  | 'view_dashboard'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    'view_sales', 'create_sales', 'edit_sales', 'delete_sales',
    'view_expenses', 'create_expenses', 'edit_expenses', 'delete_expenses',
    'view_reports', 'export_data', 'manage_staff', 'view_dashboard'
  ],
  manager: [
    'view_sales', 'create_sales', 'edit_sales',
    'view_expenses', 'create_expenses', 'edit_expenses',
    'view_reports', 'export_data', 'view_dashboard'
  ],
  worker: [
    'view_sales', 'create_sales',
    'view_expenses', 'create_expenses',
    'view_dashboard'
  ]
}

type StaffContextValue = {
  currentUser: StaffMember | null
  staffMembers: StaffMember[]
  loading: boolean
  error: string | null
  hasPermission: (permission: Permission) => boolean
  refreshStaff: () => Promise<void>
  createStaff: (data: { email: string; displayName: string; role: UserRole }) => Promise<void>
  updateStaff: (id: string, data: { displayName?: string; role?: UserRole; active?: boolean }) => Promise<void>
  deleteStaff: (id: string) => Promise<void>
}

const StaffContext = React.createContext<StaffContextValue>({
  currentUser: null,
  staffMembers: [],
  loading: true,
  error: null,
  hasPermission: () => false,
  refreshStaff: async () => {},
  createStaff: async () => {},
  updateStaff: async () => {},
  deleteStaff: async () => {},
})

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentUser, setCurrentUser] = React.useState<StaffMember | null>(null)
  const [staffMembers, setStaffMembers] = React.useState<StaffMember[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const refreshStaff = React.useCallback(async () => {
    if (!user) return
    
    try {
      setError(null)
      const response = await staffApi.list()
      setStaffMembers(response.staff || [])
      
      // Find current user in staff list
      const current = response.staff?.find((s: StaffMember) => s.email === user.email)
      setCurrentUser(current || null)
    } catch (err: any) {
      setError(err.message || 'Failed to load staff')
      console.error('Staff loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (user) {
      refreshStaff()
    } else {
      setCurrentUser(null)
      setStaffMembers([])
      setLoading(false)
    }
  }, [user, refreshStaff])

  const hasPermission = React.useCallback((permission: Permission): boolean => {
    if (!currentUser) return false
    return ROLE_PERMISSIONS[currentUser.role]?.includes(permission) || false
  }, [currentUser])

  const createStaff = React.useCallback(async (data: { email: string; displayName: string; role: UserRole }) => {
    try {
      setError(null)
      await staffApi.create(data)
      await refreshStaff()
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member')
      throw err
    }
  }, [refreshStaff])

  const updateStaff = React.useCallback(async (id: string, data: { displayName?: string; role?: UserRole; active?: boolean }) => {
    try {
      setError(null)
      await staffApi.update(id, data)
      await refreshStaff()
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member')
      throw err
    }
  }, [refreshStaff])

  const deleteStaff = React.useCallback(async (id: string) => {
    try {
      setError(null)
      await staffApi.delete(id)
      await refreshStaff()
    } catch (err: any) {
      setError(err.message || 'Failed to delete staff member')
      throw err
    }
  }, [refreshStaff])

  const value: StaffContextValue = {
    currentUser,
    staffMembers,
    loading,
    error,
    hasPermission,
    refreshStaff,
    createStaff,
    updateStaff,
    deleteStaff,
  }

  return <StaffContext.Provider value={value}>{children}</StaffContext.Provider>
}

export function useStaff() {
  return React.useContext(StaffContext)
}