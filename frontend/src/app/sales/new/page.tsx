'use client'

import React from 'react'
import PhotoCapture from '@/components/ui/PhotoCapture'
import { Button } from '@/components/ui/Button'


export default function NewSalePage() {
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [itemName, setItemName] = React.useState('')
  const [qty, setQty] = React.useState<number>(1)
  const [price, setPrice] = React.useState<number>(0)
  const [paymentMode, setPaymentMode] = React.useState<'cash' | 'online'>('cash')
  const [workerName, setWorkerName] = React.useState('')

  const total = qty * price

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      itemName,
      quantity: qty,
      price,
      paymentMode,
      workerName,
      // photo upload to be added later; send placeholder
    }
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const msg = await res.text()
      alert(`Failed to save: ${msg}`)
      return
    }
    alert('Sale saved successfully')
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold mb-4">Add Sale</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Item Name</label>
          <input className="border rounded-md px-3 py-2" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Quantity</label>
          <input type="number" min={1} className="border rounded-md px-3 py-2" value={qty} onChange={(e) => setQty(Number(e.target.value || 0))} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Unit Price</label>
          <input type="number" min={0} step="0.01" className="border rounded-md px-3 py-2" value={price} onChange={(e) => setPrice(Number(e.target.value || 0))} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Payment Mode</label>
          <select className="border rounded-md px-3 py-2" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'cash' | 'online')}>
            <option value="cash">Cash</option>
            <option value="online">Online</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Worker Name</label>
          <input className="border rounded-md px-3 py-2" value={workerName} onChange={(e) => setWorkerName(e.target.value)} required />
        </div>

        <PhotoCapture label="Attach Photo (optional)" value={photo} onFileSelected={setPhoto} />

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">Total: <span className="font-semibold">{isFinite(total) ? total.toFixed(2) : '0.00'}</span></div>
          <Button type="submit">Save Sale</Button>
        </div>
      </form>
    </main>
  )
}


