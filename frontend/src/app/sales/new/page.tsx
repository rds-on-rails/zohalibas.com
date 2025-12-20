'use client'

import React from 'react'
import Link from 'next/link'
import PhotoCapture from '@/components/ui/PhotoCapture'
import { salesApi } from '@/lib/api'
import { validateSale, sanitizeInput, formatValidationErrors } from '@/lib/validation'

export default function NewSalePage() {
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [itemName, setItemName] = React.useState('')
  const [qty, setQty] = React.useState<number>(1)
  const [price, setPrice] = React.useState<number>(0)
  const [paymentMode, setPaymentMode] = React.useState<'cash' | 'online'>('cash')
  const [workerName, setWorkerName] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const total = qty * price

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    const validation = validateSale({
      itemName: sanitizeInput(itemName),
      quantity: qty,
      price,
      paymentMode,
      workerName: sanitizeInput(workerName),
    })
    
    if (!validation.isValid) {
      setError(formatValidationErrors(validation.errors))
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      await salesApi.create({
        itemName: sanitizeInput(itemName),
        quantity: qty,
        price,
        paymentMode,
        workerName: sanitizeInput(workerName),
        // TODO: Add photo upload functionality
      })
      
      alert('Sale saved successfully')
      
      // Reset form
      setItemName('')
      setQty(1)
      setPrice(0)
      setWorkerName('')
      setPhoto(null)
    } catch (err: any) {
      setError(err.message || 'Failed to save sale')
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
              <h1 className="text-2xl font-bold text-gray-900">Add Sale</h1>
              <p className="text-gray-600 mt-1">Record a new sale transaction</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Item Name</label>
              <input 
                className="input-field" 
                value={itemName} 
                onChange={(e) => setItemName(e.target.value)} 
                required 
              />
            </div>
            
            <div>
              <label className="form-label">Quantity</label>
              <input 
                type="number" 
                min={1} 
                className="input-field" 
                value={qty} 
                onChange={(e) => setQty(Number(e.target.value || 0))} 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Unit Price</label>
              <input 
                type="number" 
                min={0} 
                step="0.01" 
                className="input-field" 
                value={price} 
                onChange={(e) => setPrice(Number(e.target.value || 0))} 
                required 
              />
            </div>
            
            <div>
              <label className="form-label">Payment Mode</label>
              <select 
                className="input-field" 
                value={paymentMode} 
                onChange={(e) => setPaymentMode(e.target.value as 'cash' | 'online')}
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Worker Name</label>
            <input 
              className="input-field" 
              value={workerName} 
              onChange={(e) => setWorkerName(e.target.value)} 
              required 
            />
          </div>

          <div>
            <PhotoCapture label="Attach Photo (optional)" value={photo} onFileSelected={setPhoto} />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Total Display */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-700">Total Amount:</span>
              <span className="text-2xl font-bold text-gray-900">
                ${isFinite(total) ? total.toFixed(2) : '0.00'}
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
              {loading ? 'Saving...' : 'Save Sale'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}


