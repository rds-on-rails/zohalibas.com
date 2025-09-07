'use client'

import React from 'react'
import Link from 'next/link'
import { auth, googleProvider } from '@/lib/firebase'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'

export default function LoginPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const onGoogle = async () => {
    setError(null)
    setLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
      window.location.href = '/'
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in with Google')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md rounded-xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-center mb-6">Sign In</h1>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email Address</label>
            <input type="email" className="border rounded-md px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Password</label>
            <input type="password" className="border rounded-md px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button disabled={loading} className="rounded-md bg-indigo-600 text-white py-2 hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>

        <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-gray-500">
          <span className="h-px bg-gray-200" />
          <span className="text-xs">OR</span>
          <span className="h-px bg-gray-200" />
        </div>

        <button onClick={onGoogle} disabled={loading} className="w-full rounded-md border py-2 hover:bg-gray-50">Sign in with Google</button>

        <p className="mt-4 text-center text-sm text-gray-600">Need an account? <Link className="text-indigo-600 hover:underline" href="/auth/signup">Sign Up</Link></p>
      </div>
    </main>
  )
}


