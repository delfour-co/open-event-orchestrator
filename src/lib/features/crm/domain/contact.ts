import { z } from 'zod'

export const contactSourceSchema = z.enum(['speaker', 'attendee', 'sponsor', 'manual', 'import'])
export type ContactSource = z.infer<typeof contactSourceSchema>

export const contactSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
  bio: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional(),
  twitter: z.string().max(50).optional(),
  linkedin: z.string().url().optional(),
  github: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  source: contactSourceSchema.default('manual'),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional(),
  unsubscribeToken: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Contact = z.infer<typeof contactSchema>

export type CreateContact = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>

export const contactFullName = (contact: Pick<Contact, 'firstName' | 'lastName'>): string =>
  `${contact.firstName} ${contact.lastName}`

export const contactInitials = (contact: Pick<Contact, 'firstName' | 'lastName'>): string =>
  `${contact.firstName.charAt(0)}${contact.lastName.charAt(0)}`.toUpperCase()

export const contactHasSocialProfiles = (
  contact: Pick<Contact, 'twitter' | 'linkedin' | 'github'>
): boolean => !!(contact.twitter || contact.linkedin || contact.github)

export const contactMatchesSearch = (
  contact: Pick<Contact, 'firstName' | 'lastName' | 'email' | 'company'>,
  query: string
): boolean => {
  const q = query.toLowerCase()
  return (
    contact.firstName.toLowerCase().includes(q) ||
    contact.lastName.toLowerCase().includes(q) ||
    contact.email.toLowerCase().includes(q) ||
    (contact.company?.toLowerCase().includes(q) ?? false)
  )
}
