<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Input } from '$lib/components/ui/input'
import { Select } from '$lib/components/ui/select'
import {
  RULE_FIELD_LABELS,
  RULE_OPERATOR_LABELS,
  type SegmentRule,
  type SegmentRuleField,
  type SegmentRuleOperator
} from '$lib/features/crm/domain/segment'
import { X } from 'lucide-svelte'

interface Props {
  rule: SegmentRule
  onUpdate: (rule: SegmentRule) => void
  onRemove: () => void
  showRemove?: boolean
}

const { rule, onUpdate, onRemove, showRemove = true }: Props = $props()

// Field categories for grouping in select
const FIELD_CATEGORIES = {
  'Contact Profile': ['source', 'tags', 'company', 'city', 'country'] as SegmentRuleField[],
  Edition: [
    'edition_role',
    'edition_id',
    'consent_marketing',
    'has_checked_in'
  ] as SegmentRuleField[],
  'Email Behavior': [
    'email_opened',
    'email_clicked',
    'email_opened_any',
    'email_clicked_any'
  ] as SegmentRuleField[],
  'Purchase History': [
    'has_purchased',
    'purchase_total_gte',
    'purchased_ticket_type'
  ] as SegmentRuleField[],
  'CFP Engagement': ['cfp_submitted', 'cfp_accepted', 'cfp_rejected'] as SegmentRuleField[]
}

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
        <option value="true">Yes</option>
        <option value="false">No</option>
      </Select>
    {:else}
      <Input
        type={NUMERIC_FIELDS.includes(rule.field) ? 'number' : 'text'}
        placeholder="Value..."
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
