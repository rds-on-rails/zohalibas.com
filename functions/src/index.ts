import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import express from 'express'
import cors from 'cors'
import { ImageAnnotatorClient } from '@google-cloud/vision'

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp()
}
const db = admin.firestore()
const vision = new ImageAnnotatorClient()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

// Health
app.get('/health', (_req, res) => res.json({ ok: true }))

// Upload + OCR
app.post('/upload', async (req, res) => {
  try {
    const { imageBase64 } = req.body || {}
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' })
    const [result] = await vision.textDetection({ image: { content: imageBase64 } })
    const text = result.fullTextAnnotation?.text || ''
    // naive parsing example (real rules can be improved)
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const totals = { cash: 0, online: 0, expense: 0 }
    lines.forEach(l => {
      const m = l.match(/(cash|online|expense)\s*[:=]\s*(\d+(?:\.\d+)?)/i)
      if (m) {
        const kind = m[1].toLowerCase()
        const val = parseFloat(m[2])
        if (kind === 'cash') totals.cash += val
        if (kind === 'online') totals.online += val
        if (kind === 'expense') totals.expense += val
      }
    })
    return res.json({ text, totals })
  } catch (err: any) {
    console.error('OCR error', err)
    return res.status(500).json({ error: err?.message || 'OCR failed' })
  }
})

// Save entry (sales/expenses)
app.post('/save-entry', async (req, res) => {
  try {
    const { type, payload } = req.body || {}
    if (!type || !payload) return res.status(400).json({ error: 'type and payload required' })
    const col = type === 'expense' ? 'expenses' : 'sales'
    const ref = await db.collection(col).add({
      ...payload,
      date: payload?.date || new Date().toISOString().split('T')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    const snap = await ref.get()
    return res.status(201).json({ id: ref.id, ...snap.data() })
  } catch (err: any) {
    console.error('save-entry error', err)
    return res.status(500).json({ error: err?.message || 'Failed to save entry' })
  }
})

// Simple summaries
app.get('/get-summary', async (req, res) => {
  try {
    const range = String(req.query.range || 'daily')
    const today = new Date()
    const start = new Date(today)
    if (range === 'weekly') start.setDate(today.getDate() - 7)
    if (range === 'monthly') start.setMonth(today.getMonth() - 1)
    const startStr = start.toISOString().split('T')[0]

    const salesSnap = await db.collection('sales').where('date', '>=', startStr).get()
    const expensesSnap = await db.collection('expenses').where('date', '>=', startStr).get()
    let cash = 0, online = 0, expense = 0
    salesSnap.forEach(d => {
      const s: any = d.data()
      if (s.paymentMode === 'cash') cash += s.total || 0
      else online += s.total || 0
    })
    expensesSnap.forEach(d => { expense += (d.data() as any).amount || 0 })
    return res.json({ range, cash, online, expense, gross: cash + online, net: cash + online - expense })
  } catch (err: any) {
    console.error('summary error', err)
    return res.status(500).json({ error: err?.message || 'Failed to get summary' })
  }
})

// Legacy direct endpoints retained
app.post('/sales', async (req, res) => {
  try {
    const { itemName, quantity, price, paymentMode, workerName, photoUrl } = req.body || {}
    if (!itemName || !quantity || !price || !paymentMode || !workerName) return res.status(400).json({ error: 'Missing required fields.' })
    const total = Number(quantity) * Number(price)
    const ref = await db.collection('sales').add({
      itemName: String(itemName),
      quantity: Number(quantity),
      price: Number(price),
      total: Number.isFinite(total) ? total : 0,
      paymentMode: paymentMode === 'online' ? 'online' : 'cash',
      workerName: String(workerName),
      photoUrl: photoUrl ? String(photoUrl) : undefined,
      date: new Date().toISOString().split('T')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    const snap = await ref.get()
    return res.status(201).json({ id: ref.id, ...snap.data() })
  } catch (err: any) {
    console.error('Create sale error', err)
    return res.status(500).json({ error: err?.message || 'Failed to save sale' })
  }
})

app.post('/expenses', async (req, res) => {
  try {
    const { category, amount, description, photoUrl } = req.body || {}
    if (!category || amount === undefined) return res.status(400).json({ error: 'Missing required fields.' })
    const ref = await db.collection('expenses').add({
      category: String(category),
      amount: Number(amount),
      description: description ? String(description) : '',
      photoUrl: photoUrl ? String(photoUrl) : undefined,
      date: new Date().toISOString().split('T')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    const snap = await ref.get()
    return res.status(201).json({ id: ref.id, ...snap.data() })
  } catch (err: any) {
    console.error('Create expense error', err)
    return res.status(500).json({ error: err?.message || 'Failed to save expense' })
  }
})

export const api = functions.https.onRequest(app)
