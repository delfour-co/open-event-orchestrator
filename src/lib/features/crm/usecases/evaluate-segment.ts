import {
  escapeFilterValue,
  filterAnd,
  filterContains,
  filterEquals,
  filterIn,
  filterOr,
  safeFilter
} from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { Segment, SegmentRule } from '../domain'

// Fields that can be filtered directly on the contacts collection
const DIRECT_FIELDS = new Set(['source', 'tags', 'company', 'city', 'country'])

export const createEvaluateSegmentUseCase = (pb: PocketBase) => {
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: segment evaluation combines direct and related rules with set operations
  return async (segment: Segment): Promise<string[]> => {
    const { criteria } = segment
    if (criteria.rules.length === 0) return []

    // Split rules into direct (contacts table) and related (join-based)
    const directRules = criteria.rules.filter((r) => DIRECT_FIELDS.has(r.field))
    const relatedRules = criteria.rules.filter((r) => !DIRECT_FIELDS.has(r.field))

    // Get contact IDs matching direct rules
    let directContactIds: Set<string> | null = null
    if (directRules.length > 0) {
      const filters = directRules.map((rule) => ruleToFilter(rule)).filter(Boolean) as string[]
      if (filters.length > 0) {
        const rulesFilter = criteria.match === 'all' ? filterAnd(...filters) : filterOr(...filters)
        const combinedFilter = filterAnd(safeFilter`eventId = ${segment.eventId}`, rulesFilter)

        try {
          const contacts = await pb.collection('contacts').getFullList({
            filter: combinedFilter,
            fields: 'id'
          })
          directContactIds = new Set(contacts.map((c) => c.id as string))
        } catch (err) {
          console.error('Failed to evaluate direct rules:', err)
          return []
        }
      }
    }

    // Get contact IDs matching related rules
    const relatedSets: Set<string>[] = []
    for (const rule of relatedRules) {
      const ids = await evaluateRelatedRule(pb, segment.eventId, rule)
      if (ids !== null) {
        relatedSets.push(ids)
      }
    }

    // Combine results based on match mode
    if (directContactIds === null && relatedSets.length === 0) {
      return []
    }

    if (criteria.match === 'all') {
      // Intersection of all sets
      const allSets = [...(directContactIds ? [directContactIds] : []), ...relatedSets]
      if (allSets.length === 0) return []

      let result = allSets[0]
      for (let i = 1; i < allSets.length; i++) {
        result = new Set([...result].filter((id) => allSets[i].has(id)))
      }
      return [...result]
    }

    // Union of all sets (match = 'any')
    const unionSet = new Set<string>()
    if (directContactIds) {
      for (const id of directContactIds) unionSet.add(id)
    }
    for (const s of relatedSets) {
      for (const id of s) unionSet.add(id)
    }
    return [...unionSet]
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: each case handles a different related-table query pattern
async function evaluateRelatedRule(
  pb: PocketBase,
  eventId: string,
  rule: SegmentRule
): Promise<Set<string> | null> {
  switch (rule.field) {
    case 'edition_role': {
      // Find contacts that have a specific role in any edition
      const filter = buildRelatedFilter('roles', rule)
      if (!filter) return null

      try {
        const links = await pb.collection('contact_edition_links').getFullList({
          filter,
          fields: 'contactId'
        })
        return new Set(links.map((l) => l.contactId as string))
      } catch (err) {
        console.error('Failed to evaluate edition_role rule:', err)
        return new Set()
      }
    }

    case 'edition_id': {
      // Find contacts linked to a specific edition
      const filter = buildRelatedFilter('editionId', rule)
      if (!filter) return null

      try {
        const links = await pb.collection('contact_edition_links').getFullList({
          filter,
          fields: 'contactId'
        })
        return new Set(links.map((l) => l.contactId as string))
      } catch (err) {
        console.error('Failed to evaluate edition_id rule:', err)
        return new Set()
      }
    }

    case 'consent_marketing': {
      // Find contacts with marketing_email consent granted or not
      try {
        const wantGranted =
          rule.value === 'true' || rule.value === true || rule.operator === 'equals'
        const consents = await pb.collection('consents').getFullList({
          filter: safeFilter`type = ${'marketing_email'} && status = ${'granted'}`,
          fields: 'contactId'
        })
        const grantedIds = new Set(consents.map((c) => c.contactId as string))

        if (wantGranted) {
          return grantedIds
        }

        // Want contacts WITHOUT marketing consent — get all event contacts then subtract
        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id'
        })
        return new Set(allContacts.map((c) => c.id as string).filter((id) => !grantedIds.has(id)))
      } catch (err) {
        console.error('Failed to evaluate consent_marketing rule:', err)
        return new Set()
      }
    }

    case 'has_checked_in': {
      // Find contacts that have checked-in tickets
      try {
        const wantCheckedIn =
          rule.value === 'true' || rule.value === true || rule.operator === 'equals'

        const tickets = await pb.collection('tickets').getFullList({
          filter: safeFilter`checkedIn = ${true}`,
          fields: 'email'
        })
        const checkedInEmails = new Set(tickets.map((t) => (t.email as string).toLowerCase()))

        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id,email'
        })

        if (wantCheckedIn) {
          return new Set(
            allContacts
              .filter((c) => checkedInEmails.has((c.email as string).toLowerCase()))
              .map((c) => c.id as string)
          )
        }

        return new Set(
          allContacts
            .filter((c) => !checkedInEmails.has((c.email as string).toLowerCase()))
            .map((c) => c.id as string)
        )
      } catch (err) {
        console.error('Failed to evaluate has_checked_in rule:', err)
        return new Set()
      }
    }

    default:
      return null
  }
}

function buildRelatedFilter(pbField: string, rule: SegmentRule): string | null {
  const { operator, value } = rule
  const strValue = String(value)

  switch (operator) {
    case 'equals':
      return filterEquals(pbField, strValue)
    case 'not_equals':
      return `${pbField} != "${escapeFilterValue(strValue)}"`
    case 'contains':
      return filterContains(pbField, strValue)
    case 'not_contains':
      return `${pbField} !~ "${escapeFilterValue(strValue)}"`
    case 'is_empty':
      return `${pbField} = ""`
    case 'is_not_empty':
      return `${pbField} != ""`
    case 'in':
      if (Array.isArray(value)) {
        return filterIn(pbField, value.map(String))
      }
      return null
    case 'not_in':
      if (Array.isArray(value)) {
        const conditions = value.map((v) => `${pbField} != "${escapeFilterValue(String(v))}"`)
        return filterAnd(...conditions)
      }
      return null
    default:
      return null
  }
}

function ruleToFilter(rule: SegmentRule): string | null {
  const { field, operator, value } = rule

  const mapping: Record<string, string> = {
    source: 'source',
    tags: 'tags',
    company: 'company',
    city: 'city',
    country: 'country'
  }

  const pbField = mapping[field]
  if (!pbField) return null

  const strValue = String(value)

  switch (operator) {
    case 'equals':
      return filterEquals(pbField, strValue)
    case 'not_equals':
      return `${pbField} != "${escapeFilterValue(strValue)}"`
    case 'contains':
      return filterContains(pbField, strValue)
    case 'not_contains':
      return `${pbField} !~ "${escapeFilterValue(strValue)}"`
    case 'is_empty':
      return `${pbField} = ""`
    case 'is_not_empty':
      return `${pbField} != ""`
    case 'in':
      if (Array.isArray(value)) {
        return filterIn(pbField, value.map(String))
      }
      return null
    case 'not_in':
      if (Array.isArray(value)) {
        const conditions = value.map((v) => `${pbField} != "${escapeFilterValue(String(v))}"`)
        return filterAnd(...conditions)
      }
      return null
    default:
      return null
  }
}
