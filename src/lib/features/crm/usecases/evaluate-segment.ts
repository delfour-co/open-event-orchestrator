import type PocketBase from 'pocketbase'
import type { Segment, SegmentRule } from '../domain'

export const createEvaluateSegmentUseCase = (pb: PocketBase) => {
  return async (segment: Segment): Promise<string[]> => {
    const { criteria } = segment
    if (criteria.rules.length === 0) return []

    const filters = criteria.rules.map((rule) => ruleToFilter(rule)).filter(Boolean)

    if (filters.length === 0) return []

    const combinedFilter = [
      `organizationId = "${segment.organizationId}"`,
      criteria.match === 'all' ? filters.join(' && ') : `(${filters.join(' || ')})`
    ].join(' && ')

    try {
      const contacts = await pb.collection('contacts').getFullList({
        filter: combinedFilter,
        fields: 'id'
      })
      return contacts.map((c) => c.id as string)
    } catch (err) {
      console.error('Failed to evaluate segment:', err)
      return []
    }
  }
}

function ruleToFilter(rule: SegmentRule): string | null {
  const { field, operator, value } = rule

  // Map segment rule fields to PocketBase collection fields
  const pbField = fieldToPbField(field)
  if (!pbField) return null

  switch (operator) {
    case 'equals':
      return `${pbField} = "${value}"`
    case 'not_equals':
      return `${pbField} != "${value}"`
    case 'contains':
      return `${pbField} ~ "${value}"`
    case 'not_contains':
      return `${pbField} !~ "${value}"`
    case 'is_empty':
      return `${pbField} = ""`
    case 'is_not_empty':
      return `${pbField} != ""`
    case 'in':
      if (Array.isArray(value)) {
        return `(${value.map((v) => `${pbField} = "${v}"`).join(' || ')})`
      }
      return null
    case 'not_in':
      if (Array.isArray(value)) {
        return `(${value.map((v) => `${pbField} != "${v}"`).join(' && ')})`
      }
      return null
    default:
      return null
  }
}

function fieldToPbField(field: string): string | null {
  const mapping: Record<string, string> = {
    source: 'source',
    tags: 'tags',
    company: 'company',
    city: 'city',
    country: 'country'
  }
  return mapping[field] || null
}
