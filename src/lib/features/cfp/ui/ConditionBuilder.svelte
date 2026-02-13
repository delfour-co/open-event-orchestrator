<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Input } from '$lib/components/ui/input'
import { Select } from '$lib/components/ui/select'
import {
  CFP_FORM_FIELDS,
  CONDITION_OPERATOR_LABELS,
  type CfpFormFieldId,
  type ConditionOperator,
  type FieldCondition,
  NO_VALUE_OPERATORS
} from '$lib/features/cfp/domain/conditional-field'
import { X } from 'lucide-svelte'

interface Props {
  condition: FieldCondition
  onUpdate: (condition: FieldCondition) => void
  onRemove: () => void
  showRemove?: boolean
  availableFields?: { id: string; label: string }[]
}

const { condition, onUpdate, onRemove, showRemove = true, availableFields }: Props = $props()

// Default fields from CFP_FORM_FIELDS
const defaultFields = Object.entries(CFP_FORM_FIELDS).map(([id, field]) => ({
  id,
  label: field.label
}))

const fields = $derived(availableFields || defaultFields)

// Fields that are select/dropdown type
const SELECT_FIELDS: CfpFormFieldId[] = ['language', 'level', 'categoryId', 'formatId']

// Fields that are checkbox/boolean type
const BOOLEAN_FIELDS: CfpFormFieldId[] = ['mentorRequest']

// Get valid operators for a field
function getValidOperators(fieldId: string): ConditionOperator[] {
  if (BOOLEAN_FIELDS.includes(fieldId as CfpFormFieldId)) {
    return ['equals', 'not_equals']
  }
  if (SELECT_FIELDS.includes(fieldId as CfpFormFieldId)) {
    return ['equals', 'not_equals', 'in', 'not_in', 'is_empty', 'is_not_empty']
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
const showValueInput = $derived(!NO_VALUE_OPERATORS.includes(condition.operator))

// Check if field is boolean type
const isBooleanField = $derived(BOOLEAN_FIELDS.includes(condition.fieldId as CfpFormFieldId))

// Get valid operators for current field
const validOperators = $derived(getValidOperators(condition.fieldId))

function handleFieldChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const newFieldId = target.value
  const newValidOperators = getValidOperators(newFieldId)
  const newOperator = newValidOperators.includes(condition.operator)
    ? condition.operator
    : newValidOperators[0]

  onUpdate({
    fieldId: newFieldId,
    operator: newOperator,
    value: BOOLEAN_FIELDS.includes(newFieldId as CfpFormFieldId) ? true : undefined
  })
}

function handleOperatorChange(e: Event) {
  const target = e.target as HTMLSelectElement
  const value = target.value as ConditionOperator
  onUpdate({
    ...condition,
    operator: value,
    value: NO_VALUE_OPERATORS.includes(value) ? undefined : condition.value
  })
}

function handleValueChange(value: string | boolean) {
  onUpdate({
    ...condition,
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
  <Select value={condition.fieldId} onchange={handleFieldChange} class="w-[180px]">
    {#each fields as field}
      <option value={field.id}>{field.label}</option>
    {/each}
  </Select>

  <!-- Operator Select -->
  <Select value={condition.operator} onchange={handleOperatorChange} class="w-[160px]">
    {#each validOperators as op}
      <option value={op}>{CONDITION_OPERATOR_LABELS[op]}</option>
    {/each}
  </Select>

  <!-- Value Input -->
  {#if showValueInput}
    {#if isBooleanField}
      <Select value={String(condition.value ?? true)} onchange={handleBooleanChange} class="w-[100px]">
        <option value="true">Yes</option>
        <option value="false">No</option>
      </Select>
    {:else}
      <Input
        type="text"
        placeholder="Value..."
        value={String(condition.value ?? '')}
        oninput={handleInputChange}
        class="w-[180px]"
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
