export type ValidationResult = {
  isValid: boolean
  errors: Record<string, string>
}

export type SaleData = {
  itemName: string
  quantity: number
  price: number
  paymentMode: 'cash' | 'online'
  workerName: string
}

export type ExpenseData = {
  category: string
  amount: number
  description?: string
}

export type StaffData = {
  email: string
  displayName: string
  role: 'owner' | 'manager' | 'worker'
}

// Validation rules
const validationRules = {
  required: (value: any, fieldName: string) => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`
    }
    return null
  },

  email: (value: string, fieldName: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return `${fieldName} must be a valid email address`
    }
    return null
  },

  minLength: (value: string, min: number, fieldName: string) => {
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters long`
    }
    return null
  },

  maxLength: (value: string, max: number, fieldName: string) => {
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters long`
    }
    return null
  },

  positiveNumber: (value: number, fieldName: string) => {
    if (value <= 0) {
      return `${fieldName} must be a positive number`
    }
    return null
  },

  integer: (value: number, fieldName: string) => {
    if (!Number.isInteger(value)) {
      return `${fieldName} must be a whole number`
    }
    return null
  },

  oneOf: (value: string, options: string[], fieldName: string) => {
    if (!options.includes(value)) {
      return `${fieldName} must be one of: ${options.join(', ')}`
    }
    return null
  },
}

// Sale validation
export function validateSale(data: Partial<SaleData>): ValidationResult {
  const errors: Record<string, string> = {}

  // Item name validation
  const itemNameError = validationRules.required(data.itemName, 'Item name') ||
    (data.itemName && validationRules.minLength(data.itemName, 2, 'Item name')) ||
    (data.itemName && validationRules.maxLength(data.itemName, 100, 'Item name'))
  if (itemNameError) errors.itemName = itemNameError

  // Quantity validation
  const quantityError = validationRules.required(data.quantity, 'Quantity') ||
    (data.quantity !== undefined && validationRules.positiveNumber(data.quantity, 'Quantity')) ||
    (data.quantity !== undefined && validationRules.integer(data.quantity, 'Quantity'))
  if (quantityError) errors.quantity = quantityError

  // Price validation
  const priceError = validationRules.required(data.price, 'Price') ||
    (data.price !== undefined && validationRules.positiveNumber(data.price, 'Price'))
  if (priceError) errors.price = priceError

  // Payment mode validation
  const paymentModeError = validationRules.required(data.paymentMode, 'Payment mode') ||
    (data.paymentMode && validationRules.oneOf(data.paymentMode, ['cash', 'online'], 'Payment mode'))
  if (paymentModeError) errors.paymentMode = paymentModeError

  // Worker name validation
  const workerNameError = validationRules.required(data.workerName, 'Worker name') ||
    (data.workerName && validationRules.minLength(data.workerName, 2, 'Worker name')) ||
    (data.workerName && validationRules.maxLength(data.workerName, 50, 'Worker name'))
  if (workerNameError) errors.workerName = workerNameError

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Expense validation
export function validateExpense(data: Partial<ExpenseData>): ValidationResult {
  const errors: Record<string, string> = {}

  // Category validation
  const categoryError = validationRules.required(data.category, 'Category') ||
    (data.category && validationRules.oneOf(data.category, 
      ['General', 'Supplies', 'Rent', 'Utilities', 'Marketing', 'Other'], 'Category'))
  if (categoryError) errors.category = categoryError

  // Amount validation
  const amountError = validationRules.required(data.amount, 'Amount') ||
    (data.amount !== undefined && validationRules.positiveNumber(data.amount, 'Amount'))
  if (amountError) errors.amount = amountError

  // Description validation (optional but if provided, check length)
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be no more than 500 characters long'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Staff validation
export function validateStaff(data: Partial<StaffData>): ValidationResult {
  const errors: Record<string, string> = {}

  // Email validation
  const emailError = validationRules.required(data.email, 'Email') ||
    (data.email && validationRules.email(data.email, 'Email'))
  if (emailError) errors.email = emailError

  // Display name validation
  const displayNameError = validationRules.required(data.displayName, 'Display name') ||
    (data.displayName && validationRules.minLength(data.displayName, 2, 'Display name')) ||
    (data.displayName && validationRules.maxLength(data.displayName, 50, 'Display name'))
  if (displayNameError) errors.displayName = displayNameError

  // Role validation
  const roleError = validationRules.required(data.role, 'Role') ||
    (data.role && validationRules.oneOf(data.role, ['owner', 'manager', 'worker'], 'Role'))
  if (roleError) errors.role = roleError

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Date range validation
export function validateDateRange(startDate: string, endDate: string): ValidationResult {
  const errors: Record<string, string> = {}

  if (!startDate) errors.startDate = 'Start date is required'
  if (!endDate) errors.endDate = 'End date is required'

  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start > end) {
      errors.dateRange = 'Start date must be before end date'
    }
    
    // Check if date range is too large (more than 1 year)
    const oneYear = 365 * 24 * 60 * 60 * 1000
    if (end.getTime() - start.getTime() > oneYear) {
      errors.dateRange = 'Date range cannot exceed 1 year'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// Utility function to format validation errors for display
export function formatValidationErrors(errors: Record<string, string>): string {
  return Object.values(errors).join('. ')
}

// Utility function to sanitize input data
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

// Utility function to validate file uploads
export function validateFile(file: File, maxSizeMB: number = 5): ValidationResult {
  const errors: Record<string, string> = {}

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    errors.fileSize = `File size must be less than ${maxSizeMB}MB`
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    errors.fileType = 'File must be a JPEG, PNG, or WebP image'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}