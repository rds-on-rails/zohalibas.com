'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isAuthRoute = pathname?.startsWith('/auth/login') || pathname?.startsWith('/auth/signup')

  React.useEffect(() => {
    if (!loading && !user && !isAuthRoute) {
      router.replace('/auth/login')
    }
  }, [loading, user, isAuthRoute, router])

  if (!isAuthRoute && (loading || !user)) {
    return <div className="grid min-h-screen place-items-center p-6 text-gray-600">Loading...</div>
  }
  return <>{children}</>
}


