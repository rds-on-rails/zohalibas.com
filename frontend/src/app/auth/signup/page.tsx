'use client'

import React from 'react'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

export default function SignupPage() {
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(cred.user, { displayName: name })
      }
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-center mb-6">Sign Up</h1>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Full Name</label>
            <input className="border rounded-md px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email Address</label>
            <input type="email" className="border rounded-md px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Password</label>
            <input type="password" className="border rounded-md px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="rounded-md bg-indigo-600 text-white py-2 hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">Already have an account? <Link className="text-indigo-600 hover:underline" href="/auth/login">Sign In</Link></p>
      </div>
    </main>
  )
}


