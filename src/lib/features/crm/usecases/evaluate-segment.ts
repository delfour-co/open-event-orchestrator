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

    // Email behavior rules
    case 'email_opened': {
      // Find contacts who opened a specific campaign
      const campaignId = String(rule.value)
      try {
        const events = await pb.collection('email_events').getFullList({
          filter: safeFilter`campaignId = ${campaignId} && type = ${'opened'}`,
          fields: 'contactId'
        })
        return new Set(events.map((e) => e.contactId as string))
      } catch (err) {
        console.error('Failed to evaluate email_opened rule:', err)
        return new Set()
      }
    }

    case 'email_clicked': {
      // Find contacts who clicked in a specific campaign
      const campaignId = String(rule.value)
      try {
        const events = await pb.collection('email_events').getFullList({
          filter: safeFilter`campaignId = ${campaignId} && type = ${'clicked'}`,
          fields: 'contactId'
        })
        return new Set(events.map((e) => e.contactId as string))
      } catch (err) {
        console.error('Failed to evaluate email_clicked rule:', err)
        return new Set()
      }
    }

    case 'email_opened_any': {
      // Find contacts who opened any email
      try {
        const wantOpened =
          rule.value === 'true' || rule.value === true || rule.operator === 'equals'
        const events = await pb.collection('email_events').getFullList({
          filter: safeFilter`type = ${'opened'}`,
          fields: 'contactId'
        })
        const openedIds = new Set(events.map((e) => e.contactId as string))

        if (wantOpened) {
          return openedIds
        }

        // Want contacts who never opened any email
        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id'
        })
        return new Set(allContacts.map((c) => c.id as string).filter((id) => !openedIds.has(id)))
      } catch (err) {
        console.error('Failed to evaluate email_opened_any rule:', err)
        return new Set()
      }
    }

    case 'email_clicked_any': {
      // Find contacts who clicked any link in any email
      try {
        const wantClicked =
          rule.value === 'true' || rule.value === true || rule.operator === 'equals'
        const events = await pb.collection('email_events').getFullList({
          filter: safeFilter`type = ${'clicked'}`,
          fields: 'contactId'
        })
        const clickedIds = new Set(events.map((e) => e.contactId as string))

        if (wantClicked) {
          return clickedIds
        }

        // Want contacts who never clicked any link
        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id'
        })
        return new Set(allContacts.map((c) => c.id as string).filter((id) => !clickedIds.has(id)))
      } catch (err) {
        console.error('Failed to evaluate email_clicked_any rule:', err)
        return new Set()
      }
    }

    // Purchase history rules
    case 'has_purchased': {
      // Find contacts who have purchased tickets
      try {
        const wantPurchased =
          rule.value === 'true' || rule.value === true || rule.operator === 'equals'
        const orders = await pb.collection('orders').getFullList({
          filter: safeFilter`status = ${'paid'}`,
          fields: 'email'
        })
        const purchasedEmails = new Set(orders.map((o) => (o.email as string).toLowerCase()))

        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id,email'
        })

        if (wantPurchased) {
          return new Set(
            allContacts
              .filter((c) => purchasedEmails.has((c.email as string).toLowerCase()))
              .map((c) => c.id as string)
          )
        }

        return new Set(
          allContacts
            .filter((c) => !purchasedEmails.has((c.email as string).toLowerCase()))
            .map((c) => c.id as string)
        )
      } catch (err) {
        console.error('Failed to evaluate has_purchased rule:', err)
        return new Set()
      }
    }

    case 'purchase_total_gte': {
      // Find contacts whose total purchases are >= value
      const minAmount = Number(rule.value) || 0
      try {
        const orders = await pb.collection('orders').getFullList({
          filter: safeFilter`status = ${'paid'}`,
          fields: 'email,totalAmount'
        })

        // Aggregate totals by email
        const totalsByEmail = new Map<string, number>()
        for (const order of orders) {
          const email = (order.email as string).toLowerCase()
          const amount = (order.totalAmount as number) || 0
          totalsByEmail.set(email, (totalsByEmail.get(email) || 0) + amount)
        }

        const qualifyingEmails = new Set(
          [...totalsByEmail.entries()]
            .filter(([, total]) => total >= minAmount)
            .map(([email]) => email)
        )

        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id,email'
        })

        return new Set(
          allContacts
            .filter((c) => qualifyingEmails.has((c.email as string).toLowerCase()))
            .map((c) => c.id as string)
        )
      } catch (err) {
        console.error('Failed to evaluate purchase_total_gte rule:', err)
        return new Set()
      }
    }

    case 'purchased_ticket_type': {
      // Find contacts who purchased a specific ticket type
      const ticketTypeId = String(rule.value)
      try {
        const orderItems = await pb.collection('order_items').getFullList({
          filter: safeFilter`ticketTypeId = ${ticketTypeId}`,
          expand: 'orderId',
          fields: 'expand.orderId.email,expand.orderId.status'
        })

        const purchasedEmails = new Set(
          orderItems
            .filter((item) => {
              const order = (item.expand as Record<string, unknown>)?.orderId as
                | Record<string, unknown>
                | undefined
              return order?.status === 'paid'
            })
            .map((item) => {
              const order = (item.expand as Record<string, unknown>)?.orderId as Record<
                string,
                unknown
              >
              return (order.email as string).toLowerCase()
            })
        )

        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id,email'
        })

        return new Set(
          allContacts
            .filter((c) => purchasedEmails.has((c.email as string).toLowerCase()))
            .map((c) => c.id as string)
        )
      } catch (err) {
        console.error('Failed to evaluate purchased_ticket_type rule:', err)
        return new Set()
      }
    }

    // CFP engagement rules
    case 'cfp_submitted': {
      // Find contacts who have submitted talks
      try {
        const wantSubmitted =
          rule.value === 'true' || rule.value === true || rule.operator === 'equals'

        const speakers = await pb.collection('speakers').getFullList({
          fields: 'email'
        })
        const speakerEmails = new Set(speakers.map((s) => (s.email as string).toLowerCase()))

        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id,email'
        })

        if (wantSubmitted) {
          return new Set(
            allContacts
              .filter((c) => speakerEmails.has((c.email as string).toLowerCase()))
              .map((c) => c.id as string)
          )
        }

        return new Set(
          allContacts
            .filter((c) => !speakerEmails.has((c.email as string).toLowerCase()))
            .map((c) => c.id as string)
        )
      } catch (err) {
        console.error('Failed to evaluate cfp_submitted rule:', err)
        return new Set()
      }
    }

    case 'cfp_accepted': {
      // Find contacts whose talks were accepted
      try {
        const wantAccepted =
          rule.value === 'true' || rule.value === true || rule.operator === 'equals'

        const talks = await pb.collection('talks').getFullList({
          filter: safeFilter`status = ${'accepted'}`,
          expand: 'speakerId',
          fields: 'expand.speakerId.email'
        })

        const acceptedEmails = new Set(
          talks
            .map((t) => {
              const speaker = (t.expand as Record<string, unknown>)?.speakerId as
                | Record<string, unknown>
                | undefined
              return speaker?.email as string | undefined
            })
            .filter(Boolean)
            .map((email) => (email as string).toLowerCase())
        )

        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id,email'
        })

        if (wantAccepted) {
          return new Set(
            allContacts
              .filter((c) => acceptedEmails.has((c.email as string).toLowerCase()))
              .map((c) => c.id as string)
          )
        }

        return new Set(
          allContacts
            .filter((c) => !acceptedEmails.has((c.email as string).toLowerCase()))
            .map((c) => c.id as string)
        )
      } catch (err) {
        console.error('Failed to evaluate cfp_accepted rule:', err)
        return new Set()
      }
    }

    case 'cfp_rejected': {
      // Find contacts whose talks were rejected
      try {
        const wantRejected =
          rule.value === 'true' || rule.value === true || rule.operator === 'equals'

        const talks = await pb.collection('talks').getFullList({
          filter: safeFilter`status = ${'rejected'}`,
          expand: 'speakerId',
          fields: 'expand.speakerId.email'
        })

        const rejectedEmails = new Set(
          talks
            .map((t) => {
              const speaker = (t.expand as Record<string, unknown>)?.speakerId as
                | Record<string, unknown>
                | undefined
              return speaker?.email as string | undefined
            })
            .filter(Boolean)
            .map((email) => (email as string).toLowerCase())
        )

        const allContacts = await pb.collection('contacts').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id,email'
        })

        if (wantRejected) {
          return new Set(
            allContacts
              .filter((c) => rejectedEmails.has((c.email as string).toLowerCase()))
              .map((c) => c.id as string)
          )
        }

        return new Set(
          allContacts
            .filter((c) => !rejectedEmails.has((c.email as string).toLowerCase()))
            .map((c) => c.id as string)
        )
      } catch (err) {
        console.error('Failed to evaluate cfp_rejected rule:', err)
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
