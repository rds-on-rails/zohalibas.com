'use client'

import React from 'react'
import Link from 'next/link'
import { useStaff } from '@/contexts/StaffContext'
import { reportsApi } from '@/lib/api'
import { validateDateRange } from '@/lib/validation'

type ReportData = {
  summary: {
    totalSales: number
    totalExpenses: number
    netProfit: number
    cashSales: number
    onlineSales: number
    transactionCount: number
  }
  salesByDay: Array<{ date: string; cash: number; online: number; total: number }>
  expensesByCategory: Array<{ category: string; amount: number; count: number }>
  topItems: Array<{ itemName: string; quantity: number; revenue: number }>
}

export default function ReportsPage() {
  const { hasPermission } = useStaff()
  const [reportData, setReportData] = React.useState<ReportData | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Form state
  const [startDate, setStartDate] = React.useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30) // Default to last 30 days
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = React.useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [reportType, setReportType] = React.useState<'all' | 'sales' | 'expenses'>('all')

  // Check permissions
  if (!hasPermission('view_reports')) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to view reports.</p>
          <Link href="/" className="btn-primary inline-block">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const generateReport = async () => {
    const validation = validateDateRange(startDate, endDate)
    if (!validation.isValid) {
      setError(Object.values(validation.errors).join('. '))
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await reportsApi.getDetailedReport({
        startDate,
        endDate,
        type: reportType,
      })
      setReportData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: 'csv' | 'json') => {
    if (!reportData) return
    
    try {
      const blob = await reportsApi.exportData({
        startDate,
        endDate,
        format,
        type: reportType,
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${startDate}-to-${endDate}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      setError(err.message || 'Failed to export report')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Generate detailed business reports</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Report Configuration */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="input-field"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="input-field"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="form-label">Report Type</label>
              <select
                className="input-field"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'all' | 'sales' | 'expenses')}
              >
                <option value="all">All Data</option>
                <option value="sales">Sales Only</option>
                <option value="expenses">Expenses Only</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={generateReport}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-blue-600 mb-2">Total Sales</h3>
                <p className="text-2xl font-bold text-blue-900">
                  ${reportData.summary.totalSales.toFixed(2)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {reportData.summary.transactionCount} transactions
                </p>
              </div>
              
              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-red-600 mb-2">Total Expenses</h3>
                <p className="text-2xl font-bold text-red-900">
                  ${reportData.summary.totalExpenses.toFixed(2)}
                </p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-green-600 mb-2">Net Profit</h3>
                <p className="text-2xl font-bold text-green-900">
                  ${reportData.summary.netProfit.toFixed(2)}
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-sm font-medium text-purple-600 mb-2">Cash vs Online</h3>
                <p className="text-lg font-semibold text-purple-900">
                  ${reportData.summary.cashSales.toFixed(2)} / ${reportData.summary.onlineSales.toFixed(2)}
                </p>
                <p className="text-sm text-purple-600 mt-1">Cash / Online</p>
              </div>
            </div>

            {/* Export Actions */}
            {hasPermission('export_data') && (
              <div className="flex space-x-4">
                <button
                  onClick={() => exportReport('csv')}
                  className="btn-secondary"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportReport('json')}
                  className="btn-secondary"
                >
                  Export as JSON
                </button>
              </div>
            )}

            {/* Sales by Day Chart */}
            {reportData.salesByDay.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-900">Cash</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-900">Online</th>
                        <th className="text-right py-2 px-4 font-medium text-gray-900">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.salesByDay.map((day) => (
                        <tr key={day.date} className="border-b border-gray-100">
                          <td className="py-2 px-4 text-gray-900">{day.date}</td>
                          <td className="py-2 px-4 text-right text-gray-900">${day.cash.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right text-gray-900">${day.online.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right font-medium text-gray-900">${day.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expenses by Category */}
            {reportData.expensesByCategory.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
                <div className="space-y-3">
                  {reportData.expensesByCategory.map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <span className="font-medium text-gray-900">{category.category}</span>
                        <span className="text-sm text-gray-600 ml-2">({category.count} items)</span>
                      </div>
                      <span className="font-semibold text-gray-900">${category.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Items */}
            {reportData.topItems.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
                <div className="space-y-3">
                  {reportData.topItems.map((item, index) => (
                    <div key={item.itemName} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center space-x-3">
                        <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <span className="font-medium text-gray-900">{item.itemName}</span>
                          <span className="text-sm text-gray-600 ml-2">({item.quantity} sold)</span>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">${item.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}