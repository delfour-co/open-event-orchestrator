<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Switch } from '$lib/components/ui/switch'
import {
  CFP_FORM_FIELDS,
  type CfpFormFieldId,
  type FieldCondition,
  type FieldConditionRule
} from '$lib/features/cfp/domain/conditional-field'
import { Plus } from 'lucide-svelte'
import ConditionBuilder from './ConditionBuilder.svelte'

interface Props {
  rule: Omit<FieldConditionRule, 'id' | 'createdAt' | 'updatedAt'>
  onUpdate: (rule: Omit<FieldConditionRule, 'id' | 'createdAt' | 'updatedAt'>) => void
}

const { rule, onUpdate }: Props = $props()

// Target field options (fields that can be conditionally shown)
const targetFieldOptions = Object.entries(CFP_FORM_FIELDS)
  .filter(([, field]) => !field.required) // Only optional fields can be conditional
  .map(([id, field]) => ({
    id,
    label: field.label
  }))

// Source fields (fields that can trigger conditions)
// Include categories and formats as selectable values
const sourceFieldOptions = Object.entries(CFP_FORM_FIELDS).map(([id, field]) => ({
  id,
  label: field.label
}))

function handleTargetFieldChange(e: Event) {
  const target = e.target as HTMLSelectElement
  onUpdate({
    ...rule,
    targetFieldId: target.value
  })
}

function handleNameChange(e: Event) {
  const target = e.target as HTMLInputElement
  onUpdate({
    ...rule,
    name: target.value
  })
}

function handleLogicChange(e: Event) {
  const target = e.target as HTMLSelectElement
  onUpdate({
    ...rule,
    conditionLogic: target.value as 'AND' | 'OR'
  })
}

function handleActiveChange(checked: boolean) {
  onUpdate({
    ...rule,
    isActive: checked
  })
}

function handleConditionUpdate(index: number, condition: FieldCondition) {
  const newConditions = [...rule.conditions]
  newConditions[index] = condition
  onUpdate({
    ...rule,
    conditions: newConditions
  })
}

function handleConditionRemove(index: number) {
  const newConditions = rule.conditions.filter((_, i) => i !== index)
  onUpdate({
    ...rule,
    conditions:
      newConditions.length > 0
        ? newConditions
        : [{ fieldId: 'formatId', operator: 'equals', value: '' }]
  })
}

function handleAddCondition() {
  onUpdate({
    ...rule,
    conditions: [...rule.conditions, { fieldId: 'formatId', operator: 'equals', value: '' }]
  })
}
</script>

<div class="space-y-4">
  <!-- Rule Name and Target Field -->
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="space-y-2">
      <Label for="rule-name">Rule Name</Label>
      <Input
        id="rule-name"
        value={rule.name}
        oninput={handleNameChange}
        placeholder="e.g., Show duration for workshops"
      />
    </div>

    <div class="space-y-2">
      <Label for="target-field">Show Field</Label>
      <Select value={rule.targetFieldId} onchange={handleTargetFieldChange} class="w-full">
        {#each targetFieldOptions as field}
          <option value={field.id}>{field.label}</option>
        {/each}
      </Select>
      <p class="text-xs text-muted-foreground">The field that will be shown/hidden based on conditions</p>
    </div>
  </div>

  <!-- Conditions Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <Label>When</Label>
      <Select value={rule.conditionLogic} onchange={handleLogicChange} class="w-[100px]">
        <option value="AND">ALL</option>
        <option value="OR">ANY</option>
      </Select>
      <span class="text-sm text-muted-foreground">of the following conditions are met:</span>
    </div>
    <div class="flex items-center gap-2">
      <Label for="is-active" class="text-sm text-muted-foreground">Active</Label>
      <Switch
        id="is-active"
        checked={rule.isActive}
        onCheckedChange={handleActiveChange}
      />
    </div>
  </div>

  <!-- Conditions List -->
  <div class="space-y-2 rounded-md border bg-muted/30 p-4">
    {#each rule.conditions as condition, index}
      <ConditionBuilder
        {condition}
        onUpdate={(c) => handleConditionUpdate(index, c)}
        onRemove={() => handleConditionRemove(index)}
        showRemove={rule.conditions.length > 1}
        availableFields={sourceFieldOptions}
      />
    {/each}

    <Button
      type="button"
      variant="outline"
      size="sm"
      onclick={handleAddCondition}
      class="mt-2"
    >
      <Plus class="mr-2 h-4 w-4" />
      Add Condition
    </Button>
  </div>

  <!-- Preview -->
  <div class="rounded-md bg-muted/50 p-3 text-sm">
    <span class="font-medium">Preview:</span>
    <span class="text-muted-foreground">
      Show "{CFP_FORM_FIELDS[rule.targetFieldId as CfpFormFieldId]?.label || rule.targetFieldId}"
      when {rule.conditionLogic === 'AND' ? 'all' : 'any'} of {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} {rule.conditions.length !== 1 ? 'are' : 'is'} met
      {#if !rule.isActive}
        <span class="text-amber-600">(disabled)</span>
      {/if}
    </span>
  </div>
</div>
