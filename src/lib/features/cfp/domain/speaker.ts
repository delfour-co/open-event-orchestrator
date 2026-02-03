import { z } from 'zod'

export const speakerSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  bio: z.string().max(2000).optional(),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  photoUrl: z.string().url().optional(),
  twitter: z.string().max(50).optional(),
  linkedin: z.string().url().optional(),
  github: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Speaker = z.infer<typeof speakerSchema>

export const createSpeakerSchema = speakerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSpeaker = z.infer<typeof createSpeakerSchema>

export const updateSpeakerSchema = createSpeakerSchema.partial().omit({ email: true })

export type UpdateSpeaker = z.infer<typeof updateSpeakerSchema>

export const getSpeakerFullName = (speaker: Pick<Speaker, 'firstName' | 'lastName'>): string => {
  return `${speaker.firstName} ${speaker.lastName}`.trim()
}
