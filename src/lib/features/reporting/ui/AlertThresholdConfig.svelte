<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Switch } from '$lib/components/ui/switch'
import * as m from '$lib/paraglide/messages'
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
  metricSourceSchema
} from '../domain/alert-threshold'

// Localized label functions
const getLocalizedAlertLevelLabel = (level: AlertLevel): string => {
  const labels: Record<AlertLevel, string> = {
    info: m.reporting_alert_level_info(),
    warning: m.reporting_alert_level_warning(),
    critical: m.reporting_alert_level_critical()
  }
  return labels[level]
}

const getLocalizedMetricSourceLabel = (source: MetricSource): string => {
  const labels: Record<MetricSource, string> = {
    cfp_submissions: m.reporting_metric_source_cfp_submissions(),
    cfp_reviews: m.reporting_metric_source_cfp_reviews(),
    cfp_acceptance_rate: m.reporting_metric_source_cfp_acceptance_rate(),
    cfp_pending_reviews: m.reporting_metric_source_cfp_pending_reviews(),
    billing_sales: m.reporting_metric_source_billing_sales(),
    billing_revenue: m.reporting_metric_source_billing_revenue(),
    billing_stock: m.reporting_metric_source_billing_stock(),
    crm_contacts: m.reporting_metric_source_crm_contacts(),
    crm_engagement: m.reporting_metric_source_crm_engagement(),
    crm_campaigns: m.reporting_metric_source_crm_campaigns(),
    budget_variance: m.reporting_metric_source_budget_variance(),
    budget_cashflow: m.reporting_metric_source_budget_cashflow(),
    budget_utilization: m.reporting_metric_source_budget_utilization(),
    planning_sessions: m.reporting_metric_source_planning_sessions(),
    planning_conflicts: m.reporting_metric_source_planning_conflicts(),
    planning_occupancy: m.reporting_metric_source_planning_occupancy(),
    sponsoring_revenue: m.reporting_metric_source_sponsoring_revenue(),
    sponsoring_pipeline: m.reporting_metric_source_sponsoring_pipeline()
  }
  return labels[source]
}

const getLocalizedComparisonOperatorLabel = (operator: ComparisonOperator): string => {
  const labels: Record<ComparisonOperator, string> = {
    gt: m.reporting_operator_gt(),
    gte: m.reporting_operator_gte(),
    lt: m.reporting_operator_lt(),
    lte: m.reporting_operator_lte(),
    eq: m.reporting_operator_eq(),
    neq: m.reporting_operator_neq()
  }
  return labels[operator]
}

// Preset threshold templates - translations are applied dynamically
const getThresholdPresets = () => [
  {
    key: 'low_sales',
    name: m.reporting_thresholds_preset_low_sales(),
    description: m.reporting_thresholds_preset_low_sales_desc(),
    metricSource: 'billing_sales' as MetricSource,
    operator: 'lt' as ComparisonOperator,
    thresholdValue: 50,
    level: 'warning' as AlertLevel
  },
  {
    key: 'low_revenue',
    name: m.reporting_thresholds_preset_low_revenue(),
    description: m.reporting_thresholds_preset_low_revenue_desc(),
    metricSource: 'billing_revenue' as MetricSource,
    operator: 'lt' as ComparisonOperator,
    thresholdValue: 10000,
    level: 'critical' as AlertLevel
  },
  {
    key: 'pending_reviews',
    name: m.reporting_thresholds_preset_pending_reviews(),
    description: m.reporting_thresholds_preset_pending_reviews_desc(),
    metricSource: 'cfp_pending_reviews' as MetricSource,
    operator: 'gt' as ComparisonOperator,
    thresholdValue: 20,
    level: 'info' as AlertLevel
  },
  {
    key: 'low_acceptance',
    name: m.reporting_thresholds_preset_low_acceptance(),
    description: m.reporting_thresholds_preset_low_acceptance_desc(),
    metricSource: 'cfp_acceptance_rate' as MetricSource,
    operator: 'lt' as ComparisonOperator,
    thresholdValue: 25,
    level: 'warning' as AlertLevel
  },
  {
    key: 'budget_overrun',
    name: m.reporting_thresholds_preset_budget_overrun(),
    description: m.reporting_thresholds_preset_budget_overrun_desc(),
    metricSource: 'budget_utilization' as MetricSource,
    operator: 'gt' as ComparisonOperator,
    thresholdValue: 90,
    level: 'critical' as AlertLevel
  }
]

// Derived presets to get translations reactively
const thresholdPresets = $derived(getThresholdPresets())

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

function applyPreset(preset: ReturnType<typeof getThresholdPresets>[number]) {
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
      <h3 class="text-lg font-semibold">{m.reporting_thresholds_title()}</h3>
      <p class="text-sm text-muted-foreground">{m.reporting_thresholds_subtitle()}</p>
    </div>
    {#if !isAddingNew}
      <Button onclick={() => (isAddingNew = true)}>
        <Plus class="mr-2 h-4 w-4" />
        {m.reporting_thresholds_add()}
      </Button>
    {/if}
  </div>

  <!-- Add new threshold form -->
  {#if isAddingNew}
    <Card.Root class="border-dashed">
      <Card.Header>
        <Card.Title class="text-base">{m.reporting_thresholds_new()}</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <!-- Presets -->
        <div class="space-y-2">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles class="h-4 w-4" />
            <span>{m.reporting_thresholds_presets()}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            {#each thresholdPresets as preset}
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
            <Label for="name">{m.reporting_thresholds_name()}</Label>
            <Input id="name" placeholder={m.reporting_thresholds_name_placeholder()} bind:value={newName} />
          </div>

          <div class="space-y-2">
            <Label for="metric">{m.reporting_thresholds_metric()}</Label>
            <Select id="metric" bind:value={newMetricSource}>
              {#each metricSources as source}
                <option value={source}>{getLocalizedMetricSourceLabel(source)}</option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <Label for="operator">{m.reporting_thresholds_condition()}</Label>
            <Select id="operator" bind:value={newOperator}>
              {#each operators as op}
                <option value={op}>{getLocalizedComparisonOperatorLabel(op)}</option>
              {/each}
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="value">{m.reporting_thresholds_value()}</Label>
            <Input
              id="value"
              type="number"
              bind:value={newThresholdValue}
            />
          </div>

          <div class="space-y-2">
            <Label for="level">{m.reporting_thresholds_level()}</Label>
            <Select id="level" bind:value={newLevel}>
              {#each levels as level}
                <option value={level}>{getLocalizedAlertLevelLabel(level)}</option>
              {/each}
            </Select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="description">{m.reporting_thresholds_description()}</Label>
          <Input
            id="description"
            placeholder={m.reporting_thresholds_description_placeholder()}
            bind:value={newDescription}
          />
        </div>

        <!-- Notification settings -->
        <div class="space-y-4 rounded-lg border p-4">
          <h4 class="text-sm font-medium">{m.reporting_thresholds_notification_settings()}</h4>

          <div class="flex items-center justify-between">
            <Label for="notifyInApp" class="cursor-pointer">{m.reporting_thresholds_in_app()}</Label>
            <Switch
              id="notifyInApp"
              checked={newNotifyInApp}
              onCheckedChange={(checked) => (newNotifyInApp = checked)}
            />
          </div>

          <div class="flex items-center justify-between">
            <Label for="notifyByEmail" class="cursor-pointer">{m.reporting_thresholds_email()}</Label>
            <Switch
              id="notifyByEmail"
              checked={newNotifyByEmail}
              onCheckedChange={(checked) => (newNotifyByEmail = checked)}
            />
          </div>

          {#if newNotifyByEmail}
            <div class="space-y-2">
              <Label for="emails">{m.reporting_thresholds_email_recipients()}</Label>
              <div class="flex gap-2">
                <Input
                  id="emails"
                  type="email"
                  placeholder={m.reporting_thresholds_email_placeholder()}
                  bind:value={newEmailInput}
                  onkeydown={handleKeyDown}
                />
                <Button type="button" variant="outline" onclick={addEmailRecipient}>{m.action_add()}</Button>
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
          <Button variant="ghost" onclick={resetNewForm}>{m.action_cancel()}</Button>
          <Button onclick={handleAddThreshold} disabled={!newName}>
            {m.reporting_thresholds_create()}
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
        <p class="text-sm text-muted-foreground">{m.reporting_thresholds_empty()}</p>
        <p class="text-xs text-muted-foreground">
          {m.reporting_thresholds_empty_hint()}
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
                        {m.reporting_thresholds_disabled()}
                      </span>
                    {/if}
                  </div>
                  <p class="mt-1 text-sm text-muted-foreground">
                    {getLocalizedMetricSourceLabel(threshold.metricSource)}
                    {getLocalizedComparisonOperatorLabel(threshold.operator).toLowerCase()}
                    {threshold.thresholdValue}
                  </p>
                  {#if threshold.description}
                    <p class="mt-1 text-xs text-muted-foreground">{threshold.description}</p>
                  {/if}
                  <div class="mt-2 flex flex-wrap gap-2 text-xs">
                    {#if threshold.notifyInApp}
                      <span class="rounded bg-muted px-1.5 py-0.5">{m.reporting_thresholds_in_app_tag()}</span>
                    {/if}
                    {#if threshold.notifyByEmail}
                      <span class="rounded bg-muted px-1.5 py-0.5">
                        {m.reporting_thresholds_email_tag({ count: threshold.emailRecipients.length })}
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
