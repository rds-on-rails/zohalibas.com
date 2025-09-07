'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto max-w-md p-6 grid gap-4">
      <h1 className="text-2xl font-bold">Retail Shop</h1>
      <p className="text-gray-600">Quick actions</p>
      <div className="grid gap-3">
        <Link href="/sales/new" className="block w-full rounded-md bg-blue-600 px-4 py-3 text-white text-center">Add Sale</Link>
        <Link href="/expenses/new" className="block w-full rounded-md bg-emerald-600 px-4 py-3 text-white text-center">Add Expense</Link>
      </div>
    </main>
  )
}


