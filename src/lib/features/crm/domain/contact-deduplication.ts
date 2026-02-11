/**
 * Contact Deduplication Domain Entity
 *
 * Handles duplicate detection, scoring, and merge operations for contacts.
 */

import { z } from 'zod'

export const duplicateMatchTypeSchema = z.enum(['exact_email', 'similar_name', 'similar_combined'])
export type DuplicateMatchType = z.infer<typeof duplicateMatchTypeSchema>

export const duplicateStatusSchema = z.enum(['pending', 'merged', 'dismissed'])
export type DuplicateStatus = z.infer<typeof duplicateStatusSchema>

export const mergeFieldSourceSchema = z.enum(['contact1', 'contact2', 'combined'])
export type MergeFieldSource = z.infer<typeof mergeFieldSourceSchema>

export const duplicatePairSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  contactId1: z.string(),
  contactId2: z.string(),
  matchType: duplicateMatchTypeSchema,
  confidenceScore: z.number().min(0).max(100),
  status: duplicateStatusSchema.default('pending'),
  mergedContactId: z.string().optional(),
  dismissedBy: z.string().optional(),
  dismissedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type DuplicatePair = z.infer<typeof duplicatePairSchema>

export interface MergeDecision {
  fieldName: string
  source: MergeFieldSource
  customValue?: string
}

export interface MergeResult {
  success: boolean
  mergedContactId?: string
  deletedContactId?: string
  error?: string
}

export interface ContactComparison {
  contactId1: string
  contactId2: string
  fields: ContactFieldComparison[]
}

export interface ContactFieldComparison {
  fieldName: string
  value1: string | null
  value2: string | null
  similarity: number
  suggestedSource: MergeFieldSource
}

// Match type labels for UI
export const MATCH_TYPE_LABELS: Record<DuplicateMatchType, string> = {
  exact_email: 'Exact Email Match',
  similar_name: 'Similar Name',
  similar_combined: 'Combined Similarity'
}

// Status labels for UI
export const DUPLICATE_STATUS_LABELS: Record<DuplicateStatus, string> = {
  pending: 'Pending Review',
  merged: 'Merged',
  dismissed: 'Dismissed'
}

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  certain: 100,
  high: 85,
  medium: 70,
  low: 50
} as const

/**
 * Normalize a string for comparison
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // Remove diacritics
    .trim()
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  if (m === 0) return n
  if (n === 0) return m

  const matrix: number[][] = []

  for (let i = 0; i <= m; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= n; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[m][n]
}

/**
 * Calculate similarity score between two strings (0-100)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeString(str1)
  const normalized2 = normalizeString(str2)

  if (normalized1 === normalized2) return 100
  if (normalized1.length === 0 || normalized2.length === 0) return 0

  const distance = levenshteinDistance(normalized1, normalized2)
  const maxLength = Math.max(normalized1.length, normalized2.length)

  return Math.round((1 - distance / maxLength) * 100)
}

/**
 * Calculate name similarity between two contacts
 */
export function calculateNameSimilarity(
  firstName1: string,
  lastName1: string,
  firstName2: string,
  lastName2: string
): number {
  const firstNameSim = calculateStringSimilarity(firstName1, firstName2)
  const lastNameSim = calculateStringSimilarity(lastName1, lastName2)

  // Last name is weighted more heavily
  return Math.round(firstNameSim * 0.4 + lastNameSim * 0.6)
}

/**
 * Calculate overall duplicate confidence score
 */
export function calculateDuplicateConfidence(
  email1: string,
  email2: string,
  firstName1: string,
  lastName1: string,
  firstName2: string,
  lastName2: string
): { score: number; matchType: DuplicateMatchType } {
  // Exact email match is 100% confidence
  if (normalizeString(email1) === normalizeString(email2)) {
    return { score: 100, matchType: 'exact_email' }
  }

  const nameSimilarity = calculateNameSimilarity(firstName1, lastName1, firstName2, lastName2)

  if (nameSimilarity >= CONFIDENCE_THRESHOLDS.high) {
    return { score: nameSimilarity, matchType: 'similar_name' }
  }

  // Check for combined similarity (partial email + partial name)
  const emailLocal1 = email1.split('@')[0] || ''
  const emailLocal2 = email2.split('@')[0] || ''
  const emailSimilarity = calculateStringSimilarity(emailLocal1, emailLocal2)

  if (
    nameSimilarity >= CONFIDENCE_THRESHOLDS.medium &&
    emailSimilarity >= CONFIDENCE_THRESHOLDS.low
  ) {
    const combinedScore = Math.round((nameSimilarity + emailSimilarity) / 2)
    return { score: combinedScore, matchType: 'similar_combined' }
  }

  return { score: nameSimilarity, matchType: 'similar_name' }
}

/**
 * Determine if two contacts are potential duplicates
 */
export function isPotentialDuplicate(
  email1: string,
  email2: string,
  firstName1: string,
  lastName1: string,
  firstName2: string,
  lastName2: string,
  threshold = CONFIDENCE_THRESHOLDS.medium
): boolean {
  const { score } = calculateDuplicateConfidence(
    email1,
    email2,
    firstName1,
    lastName1,
    firstName2,
    lastName2
  )
  return score >= threshold
}

/**
 * Get confidence level label based on score
 */
export function getConfidenceLevel(score: number): 'certain' | 'high' | 'medium' | 'low' {
  if (score >= CONFIDENCE_THRESHOLDS.certain) return 'certain'
  if (score >= CONFIDENCE_THRESHOLDS.high) return 'high'
  if (score >= CONFIDENCE_THRESHOLDS.medium) return 'medium'
  return 'low'
}

/**
 * Suggest which field value to keep during merge
 */
export function suggestFieldSource(value1: unknown, value2: unknown): MergeFieldSource {
  const hasValue1 = value1 !== null && value1 !== undefined && value1 !== ''
  const hasValue2 = value2 !== null && value2 !== undefined && value2 !== ''

  if (hasValue1 && !hasValue2) return 'contact1'
  if (!hasValue1 && hasValue2) return 'contact2'
  if (!hasValue1 && !hasValue2) return 'contact1'

  // Both have values - prefer longer/more complete
  const str1 = String(value1)
  const str2 = String(value2)

  if (str1.length > str2.length) return 'contact1'
  if (str2.length > str1.length) return 'contact2'

  return 'contact1' // Default to first contact if equal
}

/**
 * Merge two arrays (tags, segments, etc.) removing duplicates
 */
export function mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
  return [...new Set([...arr1, ...arr2])]
}

/**
 * Build comparison data for two contacts
 */
export function buildContactComparison(
  contact1: Record<string, unknown>,
  contact2: Record<string, unknown>,
  fieldNames: string[]
): ContactComparison {
  const fields: ContactFieldComparison[] = fieldNames.map((fieldName) => {
    const value1 = contact1[fieldName]
    const value2 = contact2[fieldName]
    const str1 = value1 != null ? String(value1) : null
    const str2 = value2 != null ? String(value2) : null

    const similarity =
      str1 !== null && str2 !== null
        ? calculateStringSimilarity(str1, str2)
        : str1 === str2
          ? 100
          : 0

    return {
      fieldName,
      value1: str1,
      value2: str2,
      similarity,
      suggestedSource: suggestFieldSource(value1, value2)
    }
  })

  return {
    contactId1: contact1.id as string,
    contactId2: contact2.id as string,
    fields
  }
}

// Fields to compare for contacts
export const CONTACT_COMPARE_FIELDS = [
  'email',
  'firstName',
  'lastName',
  'company',
  'jobTitle',
  'phone',
  'city',
  'country',
  'notes'
] as const
