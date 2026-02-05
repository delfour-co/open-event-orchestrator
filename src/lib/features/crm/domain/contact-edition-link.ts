import { z } from 'zod'

export const editionRoleSchema = z.enum([
  'speaker',
  'attendee',
  'sponsor',
  'volunteer',
  'organizer'
])
export type EditionRole = z.infer<typeof editionRoleSchema>

export const contactEditionLinkSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  editionId: z.string(),
  roles: z.array(editionRoleSchema).default([]),
  speakerId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ContactEditionLink = z.infer<typeof contactEditionLinkSchema>

export type CreateContactEditionLink = Omit<ContactEditionLink, 'id' | 'createdAt' | 'updatedAt'>

export const linkHasRole = (link: ContactEditionLink, role: EditionRole): boolean =>
  link.roles.includes(role)

export const linkIsSpeaker = (link: ContactEditionLink): boolean => linkHasRole(link, 'speaker')

export const linkIsAttendee = (link: ContactEditionLink): boolean => linkHasRole(link, 'attendee')
