<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Switch } from '$lib/components/ui/switch'
import { cn } from '$lib/utils'
import { AlertCircle, AlertTriangle, Info, Plus, Trash2, X } from 'lucide-svelte'
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
let newThreshold = $state<Partial<CreateAlertThreshold>>({
  editionId,
  name: '',
  metricSource: 'billing_sales',
  operator: 'lt',
  thresholdValue: 0,
  level: 'warning',
  enabled: true,
  notifyByEmail: false,
  notifyInApp: true,
  emailRecipients: []
})

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
  newThreshold = {
    editionId,
    name: '',
    metricSource: 'billing_sales',
    operator: 'lt',
    thresholdValue: 0,
    level: 'warning',
    enabled: true,
    notifyByEmail: false,
    notifyInApp: true,
    emailRecipients: []
  }
  newEmailInput = ''
  isAddingNew = false
}

function handleAddThreshold() {
  if (!newThreshold.name || !newThreshold.metricSource) return
  onAdd?.({
    editionId,
    name: newThreshold.name,
    description: newThreshold.description,
    metricSource: newThreshold.metricSource as MetricSource,
    operator: (newThreshold.operator || 'lt') as ComparisonOperator,
    thresholdValue: newThreshold.thresholdValue || 0,
    level: (newThreshold.level || 'warning') as AlertLevel,
    enabled: newThreshold.enabled ?? true,
    notifyByEmail: newThreshold.notifyByEmail ?? false,
    notifyInApp: newThreshold.notifyInApp ?? true,
    emailRecipients: newThreshold.emailRecipients || []
  })
  resetNewForm()
}

function addEmailRecipient() {
  const email = newEmailInput.trim()
  if (!email || !email.includes('@')) return
  if (newThreshold.emailRecipients?.includes(email)) return
  newThreshold.emailRecipients = [...(newThreshold.emailRecipients || []), email]
  newEmailInput = ''
}

function removeEmailRecipient(email: string) {
  newThreshold.emailRecipients = (newThreshold.emailRecipients || []).filter((e) => e !== email)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    addEmailRecipient()
  }
}

function handleMetricChange(e: Event) {
  const target = e.target as HTMLSelectElement
  newThreshold.metricSource = target.value as MetricSource
}

function handleOperatorChange(e: Event) {
  const target = e.target as HTMLSelectElement
  newThreshold.operator = target.value as ComparisonOperator
}

function handleLevelChange(e: Event) {
  const target = e.target as HTMLSelectElement
  newThreshold.level = target.value as AlertLevel
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
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="name">Name</Label>
            <Input id="name" placeholder="e.g., Low ticket sales" bind:value={newThreshold.name} />
          </div>

          <div class="space-y-2">
            <Label for="metric">Metric</Label>
            <Select id="metric" value={newThreshold.metricSource} onchange={handleMetricChange}>
              {#each metricSources as source}
                <option value={source}>{getMetricSourceLabel(source)}</option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <Label for="operator">Condition</Label>
            <Select id="operator" value={newThreshold.operator} onchange={handleOperatorChange}>
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
              value={newThreshold.thresholdValue?.toString() ?? '0'}
              oninput={(e) => (newThreshold.thresholdValue = Number(e.currentTarget.value))}
            />
          </div>

          <div class="space-y-2">
            <Label for="level">Alert Level</Label>
            <Select id="level" value={newThreshold.level} onchange={handleLevelChange}>
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
            bind:value={newThreshold.description}
          />
        </div>

        <!-- Notification settings -->
        <div class="space-y-4 rounded-lg border p-4">
          <h4 class="text-sm font-medium">Notification Settings</h4>

          <div class="flex items-center justify-between">
            <Label for="notifyInApp" class="cursor-pointer">In-app notifications</Label>
            <Switch
              id="notifyInApp"
              checked={newThreshold.notifyInApp ?? true}
              onCheckedChange={(checked) => (newThreshold.notifyInApp = checked)}
            />
          </div>

          <div class="flex items-center justify-between">
            <Label for="notifyByEmail" class="cursor-pointer">Email notifications</Label>
            <Switch
              id="notifyByEmail"
              checked={newThreshold.notifyByEmail ?? false}
              onCheckedChange={(checked) => (newThreshold.notifyByEmail = checked)}
            />
          </div>

          {#if newThreshold.notifyByEmail}
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
              {#if newThreshold.emailRecipients && newThreshold.emailRecipients.length > 0}
                <div class="flex flex-wrap gap-2">
                  {#each newThreshold.emailRecipients as email}
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
          <Button onclick={handleAddThreshold} disabled={!newThreshold.name}>
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
                  <svelte:component this={LevelIcon} class="h-4 w-4" />
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
