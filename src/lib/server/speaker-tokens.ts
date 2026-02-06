import { randomBytes } from 'node:crypto'
import type PocketBase from 'pocketbase'

const TOKEN_EXPIRY_DAYS = 30

export interface SpeakerToken {
  id: string
  speakerId: string
  editionId: string
  token: string
  expiresAt: Date
}

export async function generateSpeakerToken(
  pb: PocketBase,
  speakerId: string,
  editionId: string
): Promise<string> {
  // Check if a valid token already exists
  try {
    const existing = await pb
      .collection('speaker_tokens')
      .getFirstListItem(
        `speakerId="${speakerId}" && editionId="${editionId}" && expiresAt > "${new Date().toISOString()}"`
      )
    if (existing) {
      return existing.token as string
    }
  } catch {
    // No existing token, create a new one
  }

  // Generate a secure random token
  const token = randomBytes(32).toString('hex')

  // Set expiry date
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS)

  // Store the token
  await pb.collection('speaker_tokens').create({
    speakerId,
    editionId,
    token,
    expiresAt: expiresAt.toISOString()
  })

  return token
}

export async function validateSpeakerToken(
  pb: PocketBase,
  token: string,
  editionId: string
): Promise<{ valid: boolean; speakerId?: string }> {
  try {
    const record = await pb
      .collection('speaker_tokens')
      .getFirstListItem(
        `token="${token}" && editionId="${editionId}" && expiresAt > "${new Date().toISOString()}"`
      )
    return { valid: true, speakerId: record.speakerId as string }
  } catch {
    return { valid: false }
  }
}

export async function refreshSpeakerToken(
  pb: PocketBase,
  speakerId: string,
  editionId: string
): Promise<string> {
  // Delete any existing tokens for this speaker/edition
  try {
    const existing = await pb.collection('speaker_tokens').getFullList({
      filter: `speakerId="${speakerId}" && editionId="${editionId}"`
    })
    for (const record of existing) {
      await pb.collection('speaker_tokens').delete(record.id)
    }
  } catch {
    // No existing tokens to delete
  }

  // Generate a new token
  return generateSpeakerToken(pb, speakerId, editionId)
}

export function buildSubmissionsUrl(baseUrl: string, editionSlug: string, token: string): string {
  return `${baseUrl}/cfp/${editionSlug}/submissions?token=${token}`
}

export function buildReimbursementsUrl(
  baseUrl: string,
  editionSlug: string,
  token: string
): string {
  return `${baseUrl}/speaker/${editionSlug}/reimbursements?token=${token}`
}
