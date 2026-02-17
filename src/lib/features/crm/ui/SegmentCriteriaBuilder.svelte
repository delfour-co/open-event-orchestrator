<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import type { SegmentCriteria, SegmentRule } from '$lib/features/crm/domain/segment'
import * as m from '$lib/paraglide/messages'
import { Loader2, Plus, Users } from 'lucide-svelte'
import { SegmentRuleBuilder } from './index'

interface Props {
  criteria: SegmentCriteria
  onCriteriaChange: (criteria: SegmentCriteria) => void
  previewCount?: number | null
  isLoadingPreview?: boolean
  onRefreshPreview?: () => void
}

const {
  criteria,
  onCriteriaChange,
  previewCount = null,
  isLoadingPreview = false,
  onRefreshPreview
}: Props = $props()

function addRule() {
  const newRule: SegmentRule = {
    field: 'source',
    operator: 'equals',
    value: ''
  }
  onCriteriaChange({
    ...criteria,
    rules: [...criteria.rules, newRule]
  })
}

function updateRule(index: number, rule: SegmentRule) {
  const newRules = [...criteria.rules]
  newRules[index] = rule
  onCriteriaChange({
    ...criteria,
    rules: newRules
  })
}

function removeRule(index: number) {
  onCriteriaChange({
    ...criteria,
    rules: criteria.rules.filter((_, i) => i !== index)
  })
}

function handleMatchChange(e: Event) {
  const target = e.target as HTMLSelectElement
  onCriteriaChange({
    ...criteria,
    match: target.value as 'all' | 'any'
  })
}
</script>

<div class="space-y-4">
  <!-- Match Logic Selector -->
  <div class="flex items-center gap-3">
    <Label class="text-sm font-medium">{m.crm_segments_match_logic()}</Label>
    <Select value={criteria.match} onchange={handleMatchChange} class="w-[220px]">
      <option value="all">{m.crm_segments_match_all()}</option>
      <option value="any">{m.crm_segments_match_any()}</option>
    </Select>
  </div>

  <!-- Rules List -->
  <Card.Root class="bg-muted/30">
    <Card.Content class="p-4">
      {#if criteria.rules.length === 0}
        <div class="py-6 text-center text-muted-foreground">
          <p class="text-sm">{m.crm_segments_no_rules()}</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each criteria.rules as rule, index}
            <div class="flex items-center gap-2">
              {#if index > 0}
                <span class="w-12 text-center text-xs font-medium text-muted-foreground">
                  {criteria.match === 'all' ? 'AND' : 'OR'}
                </span>
              {:else}
                <span class="w-12 text-center text-xs font-medium text-muted-foreground">
                  {m.crm_segments_where()}
                </span>
              {/if}
              <SegmentRuleBuilder
                {rule}
                onUpdate={(r) => updateRule(index, r)}
                onRemove={() => removeRule(index)}
                showRemove={criteria.rules.length > 1}
              />
            </div>
          {/each}
        </div>
      {/if}

      <div class="mt-4 flex items-center justify-between border-t border-border pt-4">
        <Button variant="outline" size="sm" onclick={addRule} class="gap-1">
          <Plus class="h-3 w-3" />
          {m.crm_segments_add_rule()}
        </Button>

        {#if previewCount !== null || isLoadingPreview}
          <div class="flex items-center gap-2 text-sm">
            <Users class="h-4 w-4 text-muted-foreground" />
            {#if isLoadingPreview}
              <Loader2 class="h-4 w-4 animate-spin" />
              <span class="text-muted-foreground">{m.crm_segments_calculating()}</span>
            {:else}
              <span class="font-medium">{previewCount}</span>
              <span class="text-muted-foreground">{m.crm_segments_contacts_match()}</span>
              {#if onRefreshPreview}
                <Button
                  variant="ghost"
                  size="sm"
                  onclick={onRefreshPreview}
                  class="h-6 px-2 text-xs"
                >
                  {m.crm_segments_refresh()}
                </Button>
              {/if}
            {/if}
          </div>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Hidden input for form submission -->
  <input type="hidden" name="criteria" value={JSON.stringify(criteria)} />
</div>
