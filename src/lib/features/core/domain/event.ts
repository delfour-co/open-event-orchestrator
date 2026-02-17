import { z } from 'zod'

// Common currencies with their symbols
export const currencies = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'CHF',
  'JPY',
  'CNY',
  'INR',
  'BRL'
] as const
export const currencySchema = z.enum(currencies)
export type Currency = z.infer<typeof currencySchema>

export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$'
  }
  return symbols[currency]
}

export const getCurrencyLabel = (currency: Currency): string => {
  const labels: Record<Currency, string> = {
    USD: 'US Dollar (USD)',
    EUR: 'Euro (EUR)',
    GBP: 'British Pound (GBP)',
    CAD: 'Canadian Dollar (CAD)',
    AUD: 'Australian Dollar (AUD)',
    CHF: 'Swiss Franc (CHF)',
    JPY: 'Japanese Yen (JPY)',
    CNY: 'Chinese Yuan (CNY)',
    INR: 'Indian Rupee (INR)',
    BRL: 'Brazilian Real (BRL)'
  }
  return labels[currency]
}

export const formatAmount = (amount: number, currency: Currency): string => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

export const eventSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  currency: currencySchema.default('USD'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Event = z.infer<typeof eventSchema>

export type CreateEventInput = {
  organizationId: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  currency?: Currency
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, 'organizationId'>>
