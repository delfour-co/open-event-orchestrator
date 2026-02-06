import { z } from 'zod'

export const socialLinkSchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().min(1).max(50),
  url: z.string().url()
})

export type SocialLink = z.infer<typeof socialLinkSchema>

export const teamMemberSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  team: z.string().max(100).optional(),
  role: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  photo: z.string().optional(),
  photoUrl: z.string().url().optional().or(z.literal('')),
  socials: z.array(socialLinkSchema).default([]),
  displayOrder: z.number().int().min(0).default(0),
  created: z.date(),
  updated: z.date()
})

export type TeamMember = z.infer<typeof teamMemberSchema>

export const createTeamMemberSchema = teamMemberSchema.omit({
  id: true,
  created: true,
  updated: true
})

export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>

export const updateTeamMemberSchema = createTeamMemberSchema.partial().omit({
  editionId: true
})

export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Default social network icons mapping
 */
export const SOCIAL_ICONS: Record<string, string> = {
  twitter: 'twitter',
  x: 'twitter',
  linkedin: 'linkedin',
  github: 'github',
  youtube: 'youtube',
  instagram: 'instagram',
  facebook: 'facebook',
  mastodon: 'mastodon',
  bluesky: 'cloud',
  website: 'globe',
  blog: 'rss'
}

/**
 * Get icon for a social network name
 */
export function getSocialIcon(name: string): string {
  const normalizedName = name.toLowerCase().trim()
  return SOCIAL_ICONS[normalizedName] || 'link'
}

/**
 * Common team names for suggestions
 */
export const DEFAULT_TEAMS = [
  'Core Team',
  'Organizers',
  'Volunteers',
  'Staff',
  'Communication',
  'Technical',
  'Sponsors',
  'Speakers'
]
