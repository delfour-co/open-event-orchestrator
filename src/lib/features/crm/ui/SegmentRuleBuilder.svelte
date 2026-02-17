<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Input } from '$lib/components/ui/input'
import { Select } from '$lib/components/ui/select'
import type {
  SegmentRule,
  SegmentRuleField,
  SegmentRuleOperator
} from '$lib/features/crm/domain/segment'
import * as m from '$lib/paraglide/messages'
import { X } from 'lucide-svelte'

interface Props {
  rule: SegmentRule
  onUpdate: (rule: SegmentRule) => void
  onRemove: () => void
  showRemove?: boolean
}

const { rule, onUpdate, onRemove, showRemove = true }: Props = $props()

// Reactive field labels
const RULE_FIELD_LABELS = $derived({
  source: m.crm_segments_field_source(),
  tags: m.crm_segments_field_tags(),
  company: m.crm_segments_field_company(),
  city: m.crm_segments_field_city(),
  country: m.crm_segments_field_country(),
  edition_role: m.crm_segments_field_edition_role(),
  edition_id: m.crm_segments_field_edition_id(),
  consent_marketing: m.crm_segments_field_consent_marketing(),
  has_checked_in: m.crm_segments_field_has_checked_in(),
  email_opened: m.crm_segments_field_email_opened(),
  email_clicked: m.crm_segments_field_email_clicked(),
  email_opened_any: m.crm_segments_field_email_opened_any(),
  email_clicked_any: m.crm_segments_field_email_clicked_any(),
  has_purchased: m.crm_segments_field_has_purchased(),
  purchase_total_gte: m.crm_segments_field_purchase_total_gte(),
  purchased_ticket_type: m.crm_segments_field_purchased_ticket_type(),
  cfp_submitted: m.crm_segments_field_cfp_submitted(),
  cfp_accepted: m.crm_segments_field_cfp_accepted(),
  cfp_rejected: m.crm_segments_field_cfp_rejected()
} as Record<SegmentRuleField, string>)

// Reactive operator labels
const RULE_OPERATOR_LABELS = $derived({
  equals: m.crm_segments_operator_equals(),
  not_equals: m.crm_segments_operator_not_equals(),
  contains: m.crm_segments_operator_contains(),
  not_contains: m.crm_segments_operator_not_contains(),
  is_empty: m.crm_segments_operator_is_empty(),
  is_not_empty: m.crm_segments_operator_is_not_empty(),
  in: m.crm_segments_operator_in(),
  not_in: m.crm_segments_operator_not_in()
} as Record<SegmentRuleOperator, string>)

// Field categories for grouping in select
const FIELD_CATEGORIES = $derived({
  [m.crm_segments_category_contact_profile()]: [
    'source',
    'tags',
    'company',
    'city',
    'country'
  ] as SegmentRuleField[],
  [m.crm_segments_category_edition()]: [
    'edition_role',
    'edition_id',
    'consent_marketing',
    'has_checked_in'
  ] as SegmentRuleField[],
  [m.crm_segments_category_email_behavior()]: [
    'email_opened',
    'email_clicked',
    'email_opened_any',
    'email_clicked_any'
  ] as SegmentRuleField[],
  [m.crm_segments_category_purchase_history()]: [
    'has_purchased',
    'purchase_total_gte',
    'purchased_ticket_type'
  ] as SegmentRuleField[],
  [m.crm_segments_category_cfp_engagement()]: [
    'cfp_submitted',
    'cfp_accepted',
    'cfp_rejected'
  ] as SegmentRuleField[]
})

// Operators that don't require a value
const NO_VALUE_OPERATORS: SegmentRuleOperator[] = ['is_empty', 'is_not_empty']

// Fields that are boolean type
const BOOLEAN_FIELDS: SegmentRuleField[] = [
  'consent_marketing',
  'has_checked_in',
  'email_opened_any',
  'email_clicked_any',
  'has_purchased',
  'cfp_submitted',
  'cfp_accepted',
  'cfp_rejected'
]

// Fields that expect array values
const ARRAY_FIELDS: SegmentRuleField[] = ['tags']

// Fields that are numeric
const NUMERIC_FIELDS: SegmentRuleField[] = ['purchase_total_gte']

// Get valid operators for a field
function getValidOperators(field: SegmentRuleField): SegmentRuleOperator[] {
  if (BOOLEAN_FIELDS.includes(field)) {
    return ['equals', 'not_equals']
  }
  if (NUMERIC_FIELDS.includes(field)) {
    return ['equals', 'not_equals', 'is_empty', 'is_not_empty']
  }
  if (ARRAY_FIELDS.includes(field)) {
    return ['contains', 'not_contains', 'is_empty', 'is_not_empty']
  }
  return [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'is_empty',
    'is_not_empty',
    'in',
    'not_in'
  ]
}

// Check if value input should be shown
const showValueInput = $derived(!NO_VALUE_OPERATORS.includes(rule.operator))

// Check if field is boolean type
const isBooleanField = $derived(BOOLEAN_FIELDS.includes(rule.field))

// Get valid operators for current field
const validOperators = $derived(getValidOperators(rule.field))

function handleFieldChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const newField = target.value as SegmentRuleField
  const newValidOperators = getValidOperators(newField)
  const newOperator = newValidOperators.includes(rule.operator)
    ? rule.operator
    : newValidOperators[0]

  onUpdate({
    field: newField,
    operator: newOperator,
    value: BOOLEAN_FIELDS.includes(newField) ? true : undefined
  })
}

function handleOperatorChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const value = target.value as SegmentRuleOperator
  onUpdate({
    ...rule,
    operator: value,
    value: NO_VALUE_OPERATORS.includes(value) ? undefined : rule.value
  })
}

function handleValueChange(value: string | boolean) {
  onUpdate({
    ...rule,
    value
  })
}

function handleBooleanChange(e: Event) {
  const target = e.target as HTMLSelectElement
  handleValueChange(target.value === 'true')
}

function handleInputChange(e: Event) {
  const target = e.target as HTMLInputElement
  handleValueChange(target.value)
}
</script>

<div class="flex items-center gap-2">
  <!-- Field Select -->
  <Select value={rule.field} onchange={handleFieldChange} class="w-[200px]">
    {#each Object.entries(FIELD_CATEGORIES) as [category, fields]}
      <optgroup label={category}>
        {#each fields as field}
          <option value={field}>{RULE_FIELD_LABELS[field]}</option>
        {/each}
      </optgroup>
    {/each}
  </Select>

  <!-- Operator Select -->
  <Select value={rule.operator} onchange={handleOperatorChange} class="w-[180px]">
    {#each validOperators as op}
      <option value={op}>{RULE_OPERATOR_LABELS[op]}</option>
    {/each}
  </Select>

  <!-- Value Input -->
  {#if showValueInput}
    {#if isBooleanField}
      <Select value={String(rule.value ?? true)} onchange={handleBooleanChange} class="w-[100px]">
        <option value="true">{m.crm_segments_yes()}</option>
        <option value="false">{m.crm_segments_no()}</option>
      </Select>
    {:else}
      <Input
        type={NUMERIC_FIELDS.includes(rule.field) ? 'number' : 'text'}
        placeholder={m.crm_segments_value_placeholder()}
        value={String(rule.value ?? '')}
        oninput={handleInputChange}
        class="w-[200px]"
      />
    {/if}
  {/if}

  <!-- Remove Button -->
  {#if showRemove}
    <Button variant="ghost" size="icon" onclick={onRemove} class="text-muted-foreground hover:text-destructive">
      <X class="h-4 w-4" />
    </Button>
  {/if}
</div>
