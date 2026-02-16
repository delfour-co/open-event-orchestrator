import { z } from 'zod'
import type { EditionSponsorExpanded } from './edition-sponsor'

export const messageSenderTypeSchema = z.enum(['organizer', 'sponsor'])

export type MessageSenderType = z.infer<typeof messageSenderTypeSchema>

export const sponsorMessageSchema = z.object({
  id: z.string(),
  editionSponsorId: z.string(),
  senderType: messageSenderTypeSchema,
  senderUserId: z.string().optional(),
  senderName: z.string().min(1).max(200),
  subject: z.string().max(500).optional(),
  content: z.string().min(1).max(10000),
  attachments: z.array(z.string()).default([]),
  readAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SponsorMessage = z.infer<typeof sponsorMessageSchema>

export const createSponsorMessageSchema = sponsorMessageSchema.omit({
  id: true,
  readAt: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSponsorMessage = z.infer<typeof createSponsorMessageSchema>

export const updateSponsorMessageSchema = z.object({
  readAt: z.date().optional()
})

export type UpdateSponsorMessage = z.infer<typeof updateSponsorMessageSchema>

export interface SponsorMessageWithAttachmentUrls extends SponsorMessage {
  attachmentUrls: string[]
}

export interface ConversationThread {
  editionSponsor: EditionSponsorExpanded
  messages: SponsorMessageWithAttachmentUrls[]
  unreadCount: number
  lastMessageAt: Date | null
}

export interface UnreadCounts {
  byEditionSponsor: Record<string, number>
  total: number
}

export const getSenderTypeLabel = (type: MessageSenderType): string => {
  const labels: Record<MessageSenderType, string> = {
    organizer: 'Organizer',
    sponsor: 'Sponsor'
  }
  return labels[type]
}

export const isFromOrganizer = (message: SponsorMessage): boolean => {
  return message.senderType === 'organizer'
}

export const isFromSponsor = (message: SponsorMessage): boolean => {
  return message.senderType === 'sponsor'
}

export const isRead = (message: SponsorMessage): boolean => {
  return message.readAt !== undefined
}

export const isUnread = (message: SponsorMessage): boolean => {
  return message.readAt === undefined
}

export const countUnread = (
  messages: SponsorMessage[],
  forSenderType: MessageSenderType
): number => {
  return messages.filter((m) => m.senderType !== forSenderType && isUnread(m)).length
}

export const getUnreadForOrganizer = (messages: SponsorMessage[]): SponsorMessage[] => {
  return messages.filter((m) => isFromSponsor(m) && isUnread(m))
}

export const getUnreadForSponsor = (messages: SponsorMessage[]): SponsorMessage[] => {
  return messages.filter((m) => isFromOrganizer(m) && isUnread(m))
}

export const sortByCreatedDesc = <T extends SponsorMessage>(messages: T[]): T[] => {
  return [...messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export const sortByCreatedAsc = <T extends SponsorMessage>(messages: T[]): T[] => {
  return [...messages].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

export const getLastMessage = <T extends SponsorMessage>(messages: T[]): T | null => {
  if (messages.length === 0) return null
  return sortByCreatedDesc(messages)[0]
}

export const formatMessageDate = (date: Date): string => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
  if (days === 1) {
    return 'Yesterday'
  }
  if (days < 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' })
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const truncateContent = (content: string, maxLength = 100): string => {
  if (content.length <= maxLength) return content
  return `${content.slice(0, maxLength)}...`
}

export const hasAttachments = (message: SponsorMessage): boolean => {
  return message.attachments.length > 0
}

export const getAttachmentCount = (message: SponsorMessage): number => {
  return message.attachments.length
}
