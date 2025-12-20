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

// Middleware for authentication
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    
    const decodedToken = await admin.auth().verifyIdToken(token)
    req.user = decodedToken
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid authentication token' })
  }
}

// Middleware for role-based access control
const requireRole = (roles: string[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const userEmail = req.user?.email
      if (!userEmail) {
        return res.status(401).json({ error: 'User email not found' })
      }

      const staffDoc = await db.collection('staff').where('email', '==', userEmail).limit(1).get()
      if (staffDoc.empty) {
        return res.status(403).json({ error: 'User not found in staff records' })
      }

      const staffData = staffDoc.docs[0].data()
      if (!roles.includes(staffData.role) || !staffData.active) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      req.staffMember = { id: staffDoc.docs[0].id, ...staffData }
      next()
    } catch (error) {
      return res.status(500).json({ error: 'Permission check failed' })
    }
  }
}

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken
      staffMember?: any
    }
  }
}

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

// Enhanced Sales endpoints
app.get('/sales', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, paymentMode } = req.query
    let query = db.collection('sales').orderBy('createdAt', 'desc')
    
    if (startDate) query = query.where('date', '>=', startDate)
    if (endDate) query = query.where('date', '<=', endDate)
    if (paymentMode) query = query.where('paymentMode', '==', paymentMode)
    
    const snapshot = await query.get()
    const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    return res.json({ sales })
  } catch (err: any) {
    console.error('Get sales error', err)
    return res.status(500).json({ error: err?.message || 'Failed to get sales' })
  }
})

app.put('/sales/:id', authenticateUser, requireRole(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    
    await db.collection('sales').doc(id).update(updateData)
    const doc = await db.collection('sales').doc(id).get()
    
    return res.json({ id, ...doc.data() })
  } catch (err: any) {
    console.error('Update sale error', err)
    return res.status(500).json({ error: err?.message || 'Failed to update sale' })
  }
})

app.delete('/sales/:id', authenticateUser, requireRole(['owner']), async (req, res) => {
  try {
    const { id } = req.params
    await db.collection('sales').doc(id).delete()
    return res.json({ success: true })
  } catch (err: any) {
    console.error('Delete sale error', err)
    return res.status(500).json({ error: err?.message || 'Failed to delete sale' })
  }
})

// Enhanced Expenses endpoints
app.get('/expenses', authenticateUser, async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query
    let query = db.collection('expenses').orderBy('createdAt', 'desc')
    
    if (startDate) query = query.where('date', '>=', startDate)
    if (endDate) query = query.where('date', '<=', endDate)
    if (category) query = query.where('category', '==', category)
    
    const snapshot = await query.get()
    const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    return res.json({ expenses })
  } catch (err: any) {
    console.error('Get expenses error', err)
    return res.status(500).json({ error: err?.message || 'Failed to get expenses' })
  }
})

app.put('/expenses/:id', authenticateUser, requireRole(['owner', 'manager']), async (req, res) => {
  try {
    const { id } = req.params
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    
    await db.collection('expenses').doc(id).update(updateData)
    const doc = await db.collection('expenses').doc(id).get()
    
    return res.json({ id, ...doc.data() })
  } catch (err: any) {
    console.error('Update expense error', err)
    return res.status(500).json({ error: err?.message || 'Failed to update expense' })
  }
})

app.delete('/expenses/:id', authenticateUser, requireRole(['owner']), async (req, res) => {
  try {
    const { id } = req.params
    await db.collection('expenses').doc(id).delete()
    return res.json({ success: true })
  } catch (err: any) {
    console.error('Delete expense error', err)
    return res.status(500).json({ error: err?.message || 'Failed to delete expense' })
  }
})

// Staff Management endpoints
app.get('/staff', authenticateUser, requireRole(['owner', 'manager']), async (req, res) => {
  try {
    const snapshot = await db.collection('staff').orderBy('createdAt', 'desc').get()
    const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return res.json({ staff })
  } catch (err: any) {
    console.error('Get staff error', err)
    return res.status(500).json({ error: err?.message || 'Failed to get staff' })
  }
})

app.post('/staff', authenticateUser, requireRole(['owner']), async (req, res) => {
  try {
    const { email, displayName, role } = req.body
    
    // Validate required fields
    if (!email || !displayName || !role) {
      return res.status(400).json({ error: 'Email, displayName, and role are required' })
    }
    
    // Check if staff member already exists
    const existingStaff = await db.collection('staff').where('email', '==', email).get()
    if (!existingStaff.empty) {
      return res.status(400).json({ error: 'Staff member with this email already exists' })
    }
    
    const staffData = {
      email,
      displayName,
      role,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    
    const ref = await db.collection('staff').add(staffData)
    const doc = await ref.get()
    
    return res.status(201).json({ id: ref.id, ...doc.data() })
  } catch (err: any) {
    console.error('Create staff error', err)
    return res.status(500).json({ error: err?.message || 'Failed to create staff member' })
  }
})

app.put('/staff/:id', authenticateUser, requireRole(['owner']), async (req, res) => {
  try {
    const { id } = req.params
    const updateData = {
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    
    await db.collection('staff').doc(id).update(updateData)
    const doc = await db.collection('staff').doc(id).get()
    
    return res.json({ id, ...doc.data() })
  } catch (err: any) {
    console.error('Update staff error', err)
    return res.status(500).json({ error: err?.message || 'Failed to update staff member' })
  }
})

app.delete('/staff/:id', authenticateUser, requireRole(['owner']), async (req, res) => {
  try {
    const { id } = req.params
    await db.collection('staff').doc(id).delete()
    return res.json({ success: true })
  } catch (err: any) {
    console.error('Delete staff error', err)
    return res.status(500).json({ error: err?.message || 'Failed to delete staff member' })
  }
})

// Enhanced Reporting endpoints
app.get('/reports/detailed', authenticateUser, requireRole(['owner', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, type = 'all' } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }
    
    const reportData: any = {
      summary: {
        totalSales: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashSales: 0,
        onlineSales: 0,
        transactionCount: 0,
      },
      salesByDay: [],
      expensesByCategory: [],
      topItems: [],
    }
    
    // Get sales data
    if (type === 'all' || type === 'sales') {
      const salesQuery = db.collection('sales')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'desc')
      
      const salesSnapshot = await salesQuery.get()
      const salesData = salesSnapshot.docs.map(doc => doc.data())
      
      // Calculate sales summary
      reportData.summary.transactionCount = salesData.length
      salesData.forEach((sale: any) => {
        const total = sale.total || 0
        reportData.summary.totalSales += total
        
        if (sale.paymentMode === 'cash') {
          reportData.summary.cashSales += total
        } else {
          reportData.summary.onlineSales += total
        }
      })
      
      // Group sales by day
      const salesByDay: Record<string, { cash: number; online: number; total: number }> = {}
      salesData.forEach((sale: any) => {
        const date = sale.date
        if (!salesByDay[date]) {
          salesByDay[date] = { cash: 0, online: 0, total: 0 }
        }
        
        const total = sale.total || 0
        salesByDay[date].total += total
        
        if (sale.paymentMode === 'cash') {
          salesByDay[date].cash += total
        } else {
          salesByDay[date].online += total
        }
      })
      
      reportData.salesByDay = Object.entries(salesByDay)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))
      
      // Calculate top items
      const itemStats: Record<string, { quantity: number; revenue: number }> = {}
      salesData.forEach((sale: any) => {
        const itemName = sale.itemName
        if (!itemStats[itemName]) {
          itemStats[itemName] = { quantity: 0, revenue: 0 }
        }
        itemStats[itemName].quantity += sale.quantity || 0
        itemStats[itemName].revenue += sale.total || 0
      })
      
      reportData.topItems = Object.entries(itemStats)
        .map(([itemName, stats]) => ({ itemName, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
    }
    
    // Get expenses data
    if (type === 'all' || type === 'expenses') {
      const expensesQuery = db.collection('expenses')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
      
      const expensesSnapshot = await expensesQuery.get()
      const expensesData = expensesSnapshot.docs.map(doc => doc.data())
      
      // Calculate expenses summary
      expensesData.forEach((expense: any) => {
        reportData.summary.totalExpenses += expense.amount || 0
      })
      
      // Group expenses by category
      const expensesByCategory: Record<string, { amount: number; count: number }> = {}
      expensesData.forEach((expense: any) => {
        const category = expense.category
        if (!expensesByCategory[category]) {
          expensesByCategory[category] = { amount: 0, count: 0 }
        }
        expensesByCategory[category].amount += expense.amount || 0
        expensesByCategory[category].count += 1
      })
      
      reportData.expensesByCategory = Object.entries(expensesByCategory)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount)
    }
    
    // Calculate net profit
    reportData.summary.netProfit = reportData.summary.totalSales - reportData.summary.totalExpenses
    
    return res.json(reportData)
  } catch (err: any) {
    console.error('Detailed report error', err)
    return res.status(500).json({ error: err?.message || 'Failed to generate detailed report' })
  }
})

app.get('/reports/export', authenticateUser, requireRole(['owner', 'manager']), async (req, res) => {
  try {
    const { startDate, endDate, format, type } = req.query
    
    if (!startDate || !endDate || !format || !type) {
      return res.status(400).json({ error: 'startDate, endDate, format, and type are required' })
    }
    
    let data: any[] = []
    
    if (type === 'sales' || type === 'all') {
      const salesSnapshot = await db.collection('sales')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'desc')
        .get()
      
      const salesData = salesSnapshot.docs.map(doc => ({
        type: 'sale',
        id: doc.id,
        ...doc.data(),
      }))
      data = [...data, ...salesData]
    }
    
    if (type === 'expenses' || type === 'all') {
      const expensesSnapshot = await db.collection('expenses')
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .orderBy('date', 'desc')
        .get()
      
      const expensesData = expensesSnapshot.docs.map(doc => ({
        type: 'expense',
        id: doc.id,
        ...doc.data(),
      }))
      data = [...data, ...expensesData]
    }
    
    if (format === 'csv') {
      // Convert to CSV
      const headers = ['Type', 'Date', 'Description', 'Amount', 'Payment Mode', 'Worker']
      const csvRows = [headers.join(',')]
      
      data.forEach(item => {
        const row = [
          item.type,
          item.date,
          item.type === 'sale' ? item.itemName : item.description || item.category,
          item.type === 'sale' ? item.total : item.amount,
          item.paymentMode || 'N/A',
          item.workerName || 'N/A',
        ]
        csvRows.push(row.map(field => `"${field}"`).join(','))
      })
      
      const csvContent = csvRows.join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="report-${startDate}-to-${endDate}.csv"`)
      return res.send(csvContent)
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="report-${startDate}-to-${endDate}.json"`)
      return res.json(data)
    }
  } catch (err: any) {
    console.error('Export report error', err)
    return res.status(500).json({ error: err?.message || 'Failed to export report' })
  }
})

export const api = functions.https.onRequest(app)
