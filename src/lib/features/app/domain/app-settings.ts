import { z } from 'zod'

export const FLOOR_AMENITY_TYPES = [
  'toilets',
  'elevator',
  'stairs',
  'cafeteria',
  'water_fountain',
  'first_aid',
  'cloakroom',
  'charging_station',
  'info_desk',
  'exit'
] as const

export type FloorAmenityType = (typeof FLOOR_AMENITY_TYPES)[number]

export interface FloorAmenity {
  floor: string
  amenities: FloorAmenityType[]
}

export const appSettingsSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  title: z.string().max(100).optional(),
  subtitle: z.string().max(200).optional(),
  logoFile: z.string().optional(),
  headerImage: z.string().optional(),
  primaryColor: z.string().max(7).optional(),
  accentColor: z.string().max(7).optional(),
  showScheduleTab: z.boolean().default(true),
  showSpeakersTab: z.boolean().default(true),
  showTicketsTab: z.boolean().default(true),
  showFeedbackTab: z.boolean().default(true),
  showFavoritesTab: z.boolean().default(true),
  showNetworkingTab: z.boolean().default(false),
  floorAmenities: z
    .array(
      z.object({
        floor: z.string(),
        amenities: z.array(z.string())
      })
    )
    .default([])
})

export type AppSettings = z.infer<typeof appSettingsSchema>

export type CreateAppSettings = Omit<AppSettings, 'id'>
export type UpdateAppSettings = Partial<Omit<AppSettings, 'id' | 'editionId'>> & { id: string }

export const DEFAULT_APP_SETTINGS: Omit<AppSettings, 'id' | 'editionId'> = {
  title: undefined,
  subtitle: undefined,
  logoFile: undefined,
  headerImage: undefined,
  primaryColor: '#3b82f6',
  accentColor: '#8b5cf6',
  showScheduleTab: true,
  showSpeakersTab: true,
  showTicketsTab: true,
  showFeedbackTab: true,
  showFavoritesTab: true,
  showNetworkingTab: false,
  floorAmenities: []
}
