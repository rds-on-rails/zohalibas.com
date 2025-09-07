export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value)
}


