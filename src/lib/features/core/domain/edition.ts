import { z } from 'zod'

export const editionStatusSchema = z.enum(['draft', 'published', 'archived'])
export type EditionStatus = z.infer<typeof editionStatusSchema>

export const editionSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  year: z.number().int().min(2000).max(2100),
  startDate: z.date(),
  endDate: z.date(),
  venue: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  status: editionStatusSchema,
  termsOfSale: z.string().optional(),
  codeOfConduct: z.string().optional(),
  privacyPolicy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Edition = z.infer<typeof editionSchema>

export type CreateEditionInput = {
  eventId: string
  name: string
  slug: string
  year: number
  startDate: Date
  endDate: Date
  venue?: string
  city?: string
  country?: string
  status?: EditionStatus
}

export type UpdateEditionInput = Partial<Omit<CreateEditionInput, 'eventId'>>

export const validateEditionDates = (startDate: Date, endDate: Date): boolean => {
  return startDate < endDate
}
