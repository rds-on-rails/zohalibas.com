'use client'

import React from 'react'
import Link from 'next/link'
import PhotoCapture from '@/components/ui/PhotoCapture'
import { expensesApi } from '@/lib/api'
import { validateExpense, sanitizeInput, formatValidationErrors } from '@/lib/validation'

export default function NewExpensePage() {
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [category, setCategory] = React.useState('General')
  const [amount, setAmount] = React.useState<number>(0)
  const [description, setDescription] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    const validation = validateExpense({
      category,
      amount,
      description: sanitizeInput(description),
    })
    
    if (!validation.isValid) {
      setError(formatValidationErrors(validation.errors))
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await expensesApi.create({
        category,
        amount,
        description: sanitizeInput(description),
        // TODO: Add photo upload functionality
      })
      
      alert('Expense saved successfully')
      
      // Reset form
      setCategory('General')
      setAmount(0)
      setDescription('')
      setPhoto(null)
    } catch (err: any) {
      setError(err.message || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add Expense</h1>
              <p className="text-gray-600 mt-1">Record a new expense</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Category</label>
              <select 
                className="input-field" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>General</option>
                <option>Supplies</option>
                <option>Rent</option>
                <option>Utilities</option>
                <option>Marketing</option>
                <option>Other</option>
              </select>
            </div>
            
            <div>
              <label className="form-label">Amount</label>
              <input 
                type="number" 
                min={0} 
                step="0.01" 
                className="input-field" 
                value={amount} 
                onChange={(e) => setAmount(Number(e.target.value || 0))} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea 
              className="input-field" 
              rows={3} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter expense description..."
            />
          </div>

          <div>
            <PhotoCapture label="Attach Receipt (optional)" value={photo} onFileSelected={setPhoto} />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Amount Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${isFinite(amount) ? amount.toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          <div className="flex space-x-4">
            <Link href="/" className="btn-secondary">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}


