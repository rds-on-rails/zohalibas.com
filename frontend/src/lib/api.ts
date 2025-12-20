import { auth } from './firebase'

const FUNCTIONS_BASE_URL = process.env.NEXT_PUBLIC_FUNCTIONS_BASE_URL || 'https://api-5q2y3672rq-uc.a.run.app'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser
  if (!user) return null
  return await user.getIdToken()
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken()
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const response = await fetch(`${FUNCTIONS_BASE_URL}${endpoint}`, config)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new ApiError(response.status, errorText || `HTTP ${response.status}`)
  }

  return response.json()
}

// Sales API
export const salesApi = {
  create: async (data: {
    itemName: string
    quantity: number
    price: number
    paymentMode: 'cash' | 'online'
    workerName: string
    photoUrl?: string
  }) => {
    return apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  list: async (filters?: { startDate?: string; endDate?: string; paymentMode?: string }) => {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.paymentMode) params.append('paymentMode', filters.paymentMode)
    
    return apiRequest(`/sales?${params.toString()}`)
  },

  update: async (id: string, data: Partial<{
    itemName: string
    quantity: number
    price: number
    paymentMode: 'cash' | 'online'
    workerName: string
  }>) => {
    return apiRequest(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/sales/${id}`, { method: 'DELETE' })
  },
}

// Expenses API
export const expensesApi = {
  create: async (data: {
    category: string
    amount: number
    description?: string
    photoUrl?: string
  }) => {
    return apiRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  list: async (filters?: { startDate?: string; endDate?: string; category?: string }) => {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.category) params.append('category', filters.category)
    
    return apiRequest(`/expenses?${params.toString()}`)
  },

  update: async (id: string, data: Partial<{
    category: string
    amount: number
    description: string
  }>) => {
    return apiRequest(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/expenses/${id}`, { method: 'DELETE' })
  },
}

// Reports API
export const reportsApi = {
  getSummary: async (range: 'daily' | 'weekly' | 'monthly' = 'daily') => {
    return apiRequest(`/get-summary?range=${range}`)
  },

  getDetailedReport: async (filters: {
    startDate: string
    endDate: string
    type?: 'sales' | 'expenses' | 'all'
  }) => {
    const params = new URLSearchParams({
      startDate: filters.startDate,
      endDate: filters.endDate,
      ...(filters.type && { type: filters.type }),
    })
    return apiRequest(`/reports/detailed?${params.toString()}`)
  },

  exportData: async (filters: {
    startDate: string
    endDate: string
    format: 'csv' | 'json'
    type: 'sales' | 'expenses' | 'all'
  }) => {
    const params = new URLSearchParams(filters)
    const response = await fetch(`${FUNCTIONS_BASE_URL}/reports/export?${params.toString()}`, {
      headers: {
        ...(await getAuthToken() && { Authorization: `Bearer ${await getAuthToken()}` }),
      },
    })
    
    if (!response.ok) {
      throw new ApiError(response.status, 'Export failed')
    }
    
    return response.blob()
  },
}

// OCR API
export const ocrApi = {
  processImage: async (imageBase64: string) => {
    return apiRequest('/upload', {
      method: 'POST',
      body: JSON.stringify({ imageBase64 }),
    })
  },
}

// Staff API
export const staffApi = {
  list: async () => {
    return apiRequest('/staff')
  },

  create: async (data: {
    email: string
    displayName: string
    role: 'owner' | 'manager' | 'worker'
  }) => {
    return apiRequest('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  update: async (id: string, data: {
    displayName?: string
    role?: 'owner' | 'manager' | 'worker'
    active?: boolean
  }) => {
    return apiRequest(`/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  delete: async (id: string) => {
    return apiRequest(`/staff/${id}`, { method: 'DELETE' })
  },
}

export { ApiError }