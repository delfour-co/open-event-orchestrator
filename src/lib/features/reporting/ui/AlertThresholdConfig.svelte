<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Switch } from '$lib/components/ui/switch'
import { cn } from '$lib/utils'
import { AlertCircle, AlertTriangle, Info, Plus, Sparkles, Trash2, X } from 'lucide-svelte'
import {
  type AlertLevel,
  type AlertThreshold,
  type ComparisonOperator,
  type CreateAlertThreshold,
  type MetricSource,
  alertLevelSchema,
  comparisonOperatorSchema,
  getAlertLevelLabel,
  getComparisonOperatorLabel,
  getMetricSourceLabel,
  metricSourceSchema
} from '../domain/alert-threshold'

// Preset threshold templates
const THRESHOLD_PRESETS = [
  {
    name: 'Low Ticket Sales',
    description: 'Alert when ticket sales are below target',
    metricSource: 'billing_sales' as MetricSource,
    operator: 'lt' as ComparisonOperator,
    thresholdValue: 50,
    level: 'warning' as AlertLevel
  },
  {
    name: 'Low Revenue',
    description: 'Alert when revenue drops below threshold',
    metricSource: 'billing_revenue' as MetricSource,
    operator: 'lt' as ComparisonOperator,
    thresholdValue: 10000,
    level: 'critical' as AlertLevel
  },
  {
    name: 'Pending Reviews Backlog',
    description: 'Alert when too many talks await review',
    metricSource: 'cfp_pending_reviews' as MetricSource,
    operator: 'gt' as ComparisonOperator,
    thresholdValue: 20,
    level: 'info' as AlertLevel
  },
  {
    name: 'Low Acceptance Rate',
    description: 'Alert when CFP acceptance rate is low',
    metricSource: 'cfp_acceptance_rate' as MetricSource,
    operator: 'lt' as ComparisonOperator,
    thresholdValue: 25,
    level: 'warning' as AlertLevel
  },
  {
    name: 'Budget Overrun',
    description: 'Alert when budget utilization exceeds limit',
    metricSource: 'budget_utilization' as MetricSource,
    operator: 'gt' as ComparisonOperator,
    thresholdValue: 90,
    level: 'critical' as AlertLevel
  }
] as const

type Props = {
  thresholds: AlertThreshold[]
  editionId: string
  onAdd?: (data: CreateAlertThreshold) => void
  onDelete?: (id: string) => void
  onToggle?: (id: string, enabled: boolean) => void
  class?: string
}

const { thresholds, editionId, onAdd, onDelete, onToggle, class: className }: Props = $props()

let isAddingNew = $state(false)

// Form state for new threshold
let newName = $state('')
let newDescription = $state('')
let newMetricSource = $state('billing_sales')
let newOperator = $state('lt')
let newThresholdValue = $state('0')
let newLevel = $state('warning')
let newEnabled = $state(true)
let newNotifyByEmail = $state(false)
let newNotifyInApp = $state(true)
let newEmailRecipients = $state<string[]>([])
let newEmailInput = $state('')

const levelIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle
}

const levelColors = {
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  critical: 'text-red-600 bg-red-50 border-red-200'
}

const metricSources = metricSourceSchema.options
const operators = comparisonOperatorSchema.options
const levels = alertLevelSchema.options

function resetNewForm() {
  newName = ''
  newDescription = ''
  newMetricSource = 'billing_sales'
  newOperator = 'lt'
  newThresholdValue = '0'
  newLevel = 'warning'
  newEnabled = true
  newNotifyByEmail = false
  newNotifyInApp = true
  newEmailRecipients = []
  newEmailInput = ''
  isAddingNew = false
}

function handleAddThreshold() {
  if (!newName || !newMetricSource) return
  onAdd?.({
    editionId,
    name: newName,
    description: newDescription || undefined,
    metricSource: newMetricSource as MetricSource,
    operator: newOperator as ComparisonOperator,
    thresholdValue: Number(newThresholdValue) || 0,
    level: newLevel as AlertLevel,
    enabled: newEnabled,
    notifyByEmail: newNotifyByEmail,
    notifyInApp: newNotifyInApp,
    emailRecipients: newEmailRecipients
  })
  resetNewForm()
}

function addEmailRecipient() {
  const email = newEmailInput.trim()
  if (!email || !email.includes('@')) return
  if (newEmailRecipients.includes(email)) return
  newEmailRecipients = [...newEmailRecipients, email]
  newEmailInput = ''
}

function removeEmailRecipient(email: string) {
  newEmailRecipients = newEmailRecipients.filter((e) => e !== email)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addEmailRecipient()
  }
}

function applyPreset(preset: (typeof THRESHOLD_PRESETS)[number]) {
  newName = preset.name
  newDescription = preset.description
  newMetricSource = preset.metricSource
  newOperator = preset.operator
  newThresholdValue = preset.thresholdValue.toString()
  newLevel = preset.level
}
</script>

<div class={cn('space-y-4', className)}>
  <!-- Header with Add button -->
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-lg font-semibold">Alert Thresholds</h3>
      <p class="text-sm text-muted-foreground">Configure alerts based on metric values</p>
    </div>
    {#if !isAddingNew}
      <Button onclick={() => (isAddingNew = true)}>
        <Plus class="mr-2 h-4 w-4" />
        Add Threshold
      </Button>
    {/if}
  </div>

  <!-- Add new threshold form -->
  {#if isAddingNew}
    <Card.Root class="border-dashed">
      <Card.Header>
        <Card.Title class="text-base">New Alert Threshold</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <!-- Presets -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles class="h-4 w-4" />
            <span>Quick presets</span>
          </div>
          <div class="flex flex-wrap gap-2">
            {#each THRESHOLD_PRESETS as preset}
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="h-7 text-xs"
                onclick={() => applyPreset(preset)}
              >
                {preset.name}
              </Button>
            {/each}
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" placeholder="e.g., Low ticket sales" bind:value={newName} />
          </div>

          <div class="space-y-2">
            <Label for="metric">Metric</Label>
            <Select id="metric" bind:value={newMetricSource}>
              {#each metricSources as source}
                <option value={source}>{getMetricSourceLabel(source)}</option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <Label for="operator">Condition</Label>
            <Select id="operator" bind:value={newOperator}>
              {#each operators as op}
                <option value={op}>{getComparisonOperatorLabel(op)}</option>
              {/each}
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="value">Value</Label>
            <Input
              id="value"
              type="number"
              bind:value={newThresholdValue}
            />
          </div>

          <div class="space-y-2">
            <Label for="level">Alert Level</Label>
            <Select id="level" bind:value={newLevel}>
              {#each levels as level}
                <option value={level}>{getAlertLevelLabel(level)}</option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="description">Description (optional)</Label>
          <Input
            id="description"
            placeholder="Describe what this alert monitors..."
            bind:value={newDescription}
          />
        </div>

        <!-- Notification settings -->
        <div class="space-y-4 rounded-lg border p-4">
          <h4 class="text-sm font-medium">Notification Settings</h4>

          <div class="flex items-center justify-between">
            <Label for="notifyInApp" class="cursor-pointer">In-app notifications</Label>
            <Switch
              id="notifyInApp"
              checked={newNotifyInApp}
              onCheckedChange={(checked) => (newNotifyInApp = checked)}
            />
          </div>

          <div class="flex items-center justify-between">
            <Label for="notifyByEmail" class="cursor-pointer">Email notifications</Label>
            <Switch
              id="notifyByEmail"
              checked={newNotifyByEmail}
              onCheckedChange={(checked) => (newNotifyByEmail = checked)}
            />
          </div>

          {#if newNotifyByEmail}
            <div class="space-y-2">
              <Label for="emails">Email Recipients</Label>
              <div class="flex gap-2">
                <Input
                  id="emails"
                  type="email"
                  placeholder="user@example.com"
                  bind:value={newEmailInput}
                  onkeydown={handleKeyDown}
                />
                <Button type="button" variant="outline" onclick={addEmailRecipient}>Add</Button>
              </div>
              {#if newEmailRecipients.length > 0}
                <div class="flex flex-wrap gap-2">
                  {#each newEmailRecipients as email}
                    <span
                      class="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-sm"
                    >
                      {email}
                      <button
                        type="button"
                        onclick={() => removeEmailRecipient(email)}
                        class="rounded-full p-0.5 hover:bg-muted-foreground/20"
                      >
                        <X class="h-3 w-3" />
                      </button>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="ghost" onclick={resetNewForm}>Cancel</Button>
          <Button onclick={handleAddThreshold} disabled={!newName}>
            Create Threshold
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- List of existing thresholds -->
  {#if thresholds.length === 0 && !isAddingNew}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-8 text-center">
        <AlertTriangle class="mb-2 h-10 w-10 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">No alert thresholds configured</p>
        <p class="text-xs text-muted-foreground">
          Add thresholds to receive alerts when metrics cross certain values
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-3">
      {#each thresholds as threshold (threshold.id)}
        {@const LevelIcon = levelIcons[threshold.level]}
        <Card.Root class={cn('transition-opacity', !threshold.enabled && 'opacity-60')}>
          <Card.Content class="p-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-3">
                <div class={cn('rounded-lg border p-2', levelColors[threshold.level])}>
                  <LevelIcon class="h-4 w-4" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-medium">{threshold.name}</h4>
                    {#if !threshold.enabled}
                      <span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        Disabled
                      </span>
                    {/if}
                  </div>
                  <p class="mt-1 text-sm text-muted-foreground">
                    {getMetricSourceLabel(threshold.metricSource)}
                    {getComparisonOperatorLabel(threshold.operator).toLowerCase()}
                    {threshold.thresholdValue}
                  </p>
                  {#if threshold.description}
                    <p class="mt-1 text-xs text-muted-foreground">{threshold.description}</p>
                  {/if}
                  <div class="mt-2 flex flex-wrap gap-2 text-xs">
                    {#if threshold.notifyInApp}
                      <span class="rounded bg-muted px-1.5 py-0.5">In-app</span>
                    {/if}
                    {#if threshold.notifyByEmail}
                      <span class="rounded bg-muted px-1.5 py-0.5">
                        Email ({threshold.emailRecipients.length})
                      </span>
                    {/if}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Switch
                  checked={threshold.enabled}
                  onCheckedChange={(checked) => onToggle?.(threshold.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onclick={() => onDelete?.(threshold.id)}
                  class="text-destructive hover:text-destructive"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
