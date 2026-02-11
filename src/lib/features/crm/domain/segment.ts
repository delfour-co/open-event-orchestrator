import { z } from 'zod'

export const segmentRuleOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'is_empty',
  'is_not_empty',
  'in',
  'not_in'
])
export type SegmentRuleOperator = z.infer<typeof segmentRuleOperatorSchema>

export const segmentRuleFieldSchema = z.enum([
  // Contact profile fields
  'source',
  'tags',
  'company',
  'city',
  'country',
  // Edition-related fields
  'edition_role',
  'edition_id',
  'consent_marketing',
  'has_checked_in',
  // Email behavior fields
  'email_opened',
  'email_clicked',
  'email_opened_any',
  'email_clicked_any',
  // Purchase history fields
  'has_purchased',
  'purchase_total_gte',
  'purchased_ticket_type',
  // CFP engagement fields
  'cfp_submitted',
  'cfp_accepted',
  'cfp_rejected'
])
export type SegmentRuleField = z.infer<typeof segmentRuleFieldSchema>

export const segmentRuleSchema = z.object({
  field: segmentRuleFieldSchema,
  operator: segmentRuleOperatorSchema,
  value: z.union([z.string(), z.array(z.string()), z.boolean()]).optional()
})

export type SegmentRule = z.infer<typeof segmentRuleSchema>

export const segmentCriteriaSchema = z.object({
  match: z.enum(['all', 'any']).default('all'),
  rules: z.array(segmentRuleSchema).default([])
})

export type SegmentCriteria = z.infer<typeof segmentCriteriaSchema>

export const segmentSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  editionId: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  criteria: segmentCriteriaSchema,
  isStatic: z.boolean().default(false),
  contactCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Segment = z.infer<typeof segmentSchema>

export type CreateSegment = Omit<Segment, 'id' | 'contactCount' | 'createdAt' | 'updatedAt'>

export const isSegmentDynamic = (segment: Segment): boolean => !segment.isStatic

export const segmentHasRules = (segment: Segment): boolean => segment.criteria.rules.length > 0

export const RULE_FIELD_LABELS: Record<SegmentRuleField, string> = {
  // Contact profile
  source: 'Source',
  tags: 'Tags',
  company: 'Company',
  city: 'City',
  country: 'Country',
  // Edition-related
  edition_role: 'Edition Role',
  edition_id: 'Edition',
  consent_marketing: 'Marketing Consent',
  has_checked_in: 'Has Checked In',
  // Email behavior
  email_opened: 'Opened Campaign',
  email_clicked: 'Clicked in Campaign',
  email_opened_any: 'Opened Any Email',
  email_clicked_any: 'Clicked Any Link',
  // Purchase history
  has_purchased: 'Has Purchased',
  purchase_total_gte: 'Total Purchases ≥',
  purchased_ticket_type: 'Purchased Ticket Type',
  // CFP engagement
  cfp_submitted: 'Submitted Talk',
  cfp_accepted: 'Talk Accepted',
  cfp_rejected: 'Talk Rejected'
}

export const RULE_OPERATOR_LABELS: Record<SegmentRuleOperator, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
  in: 'is one of',
  not_in: 'is not one of'
}
