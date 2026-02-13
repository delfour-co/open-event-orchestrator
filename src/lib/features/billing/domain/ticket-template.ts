import { z } from 'zod'

export const ticketTemplateSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#3B82F6'),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#FFFFFF'),
  textColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#1F2937'),
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#10B981'),
  logoUrl: z.string().url().optional(),
  logoFile: z.string().optional(),
  showVenue: z.boolean().default(true),
  showDate: z.boolean().default(true),
  showQrCode: z.boolean().default(true),
  customFooterText: z.string().max(200).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type TicketTemplate = z.infer<typeof ticketTemplateSchema>

export const createTicketTemplateSchema = ticketTemplateSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateTicketTemplate = z.infer<typeof createTicketTemplateSchema>

export const updateTicketTemplateSchema = createTicketTemplateSchema.partial().omit({
  editionId: true
})

export type UpdateTicketTemplate = z.infer<typeof updateTicketTemplateSchema>

export const DEFAULT_TICKET_TEMPLATE: Omit<
  TicketTemplate,
  'id' | 'editionId' | 'createdAt' | 'updatedAt'
> = {
  primaryColor: '#3B82F6',
  backgroundColor: '#FFFFFF',
  textColor: '#1F2937',
  accentColor: '#10B981',
  showVenue: true,
  showDate: true,
  showQrCode: true
}

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return { r: 0, g: 0, b: 0 }
  }
  return {
    r: Number.parseInt(result[1], 16),
    g: Number.parseInt(result[2], 16),
    b: Number.parseInt(result[3], 16)
  }
}

export const isValidHexColor = (color: string): boolean => {
  return /^#[0-9A-Fa-f]{6}$/.test(color)
}

export const getContrastColor = (hexColor: string): string => {
  const rgb = hexToRgb(hexColor)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF'
}
