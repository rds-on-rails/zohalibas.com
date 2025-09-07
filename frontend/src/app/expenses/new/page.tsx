'use client'

import React from 'react'
import PhotoCapture from '@/components/ui/PhotoCapture'
import { Button } from '@/components/ui/Button'

export default function NewExpensePage() {
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [category, setCategory] = React.useState('General')
  const [amount, setAmount] = React.useState<number>(0)
  const [description, setDescription] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = { category, amount, description }
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const msg = await res.text()
      alert(`Failed to save: ${msg}`)
      return
    }
    alert('Expense saved successfully')
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold mb-4">Add Expense</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Category</label>
          <select className="border rounded-md px-3 py-2" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option>General</option>
            <option>Supplies</option>
            <option>Rent</option>
            <option>Utilities</option>
            <option>Other</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Amount</label>
          <input type="number" min={0} step="0.01" className="border rounded-md px-3 py-2" value={amount} onChange={(e) => setAmount(Number(e.target.value || 0))} required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Description</label>
          <textarea className="border rounded-md px-3 py-2" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <PhotoCapture label="Attach Receipt (optional)" value={photo} onFileSelected={setPhoto} />

        <div className="flex items-center justify-end">
          <Button type="submit">Save Expense</Button>
        </div>
      </form>
    </main>
  )
}


