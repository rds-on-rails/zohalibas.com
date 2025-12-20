'use client'

import Link from 'next/link'
import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { reportsApi } from '@/lib/api'

export default function Home() {
  const { user } = useAuth()
  const { hasPermission, currentUser } = useStaff()
  const [summary, setSummary] = React.useState({
    cash: 0,
    online: 0,
    expense: 0,
    gross: 0,
    net: 0,
  })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadSummary = async () => {
      try {
        const data = await reportsApi.getSummary('daily')
        setSummary(data)
      } catch (error) {
        console.error('Failed to load summary:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && hasPermission('view_dashboard')) {
      loadSummary()
    } else {
      setLoading(false)
    }
  }, [user, hasPermission])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Retail Shop</h1>
              <p className="text-gray-600 mt-1">Management System</p>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {currentUser?.displayName || user?.displayName || user?.email}
              {currentUser && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                  {currentUser.role}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quick Actions</h2>
          <p className="text-gray-600">Choose an action to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hasPermission('create_sales') && (
            <Link 
              href="/sales/new" 
              className="group block p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Add Sale</h3>
                  <p className="text-gray-600 text-sm">Record a new sale transaction</p>
                </div>
              </div>
            </Link>
          )}

          {hasPermission('create_expenses') && (
            <Link 
              href="/expenses/new" 
              className="group block p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">Add Expense</h3>
                  <p className="text-gray-600 text-sm">Record a new expense</p>
                </div>
              </div>
            </Link>
          )}

          {hasPermission('view_reports') && (
            <Link 
              href="/reports" 
              className="group block p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-600 transition-colors">View Reports</h3>
                  <p className="text-gray-600 text-sm">Generate detailed analytics</p>
                </div>
              </div>
            </Link>
          )}

          {hasPermission('manage_staff') && (
            <Link 
              href="/staff" 
              className="group block p-6 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-orange-600 transition-colors">Manage Staff</h3>
                  <p className="text-gray-600 text-sm">Add and manage team members</p>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Dashboard Preview */}
        {hasPermission('view_dashboard') && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Today's Summary</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-6 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-600 mb-2">Cash Sales</h3>
                  <p className="text-2xl font-bold text-blue-900">${summary.cash.toFixed(2)}</p>
                </div>
                <div className="p-6 bg-green-50 rounded-lg">
                  <h3 className="text-sm font-medium text-green-600 mb-2">Online Sales</h3>
                  <p className="text-2xl font-bold text-green-900">${summary.online.toFixed(2)}</p>
                </div>
                <div className="p-6 bg-red-50 rounded-lg">
                  <h3 className="text-sm font-medium text-red-600 mb-2">Expenses</h3>
                  <p className="text-2xl font-bold text-red-900">${summary.expense.toFixed(2)}</p>
                </div>
                <div className="p-6 bg-purple-50 rounded-lg">
                  <h3 className="text-sm font-medium text-purple-600 mb-2">Net Profit</h3>
                  <p className="text-2xl font-bold text-purple-900">${summary.net.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}


