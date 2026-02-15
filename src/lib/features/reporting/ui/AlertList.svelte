<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { cn } from '$lib/utils'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-svelte'
import type { Alert } from '../domain/alert'
import {
  canAcknowledgeAlert,
  canDismissAlert,
  canResolveAlert,
  getAlertStatusLabel
} from '../domain/alert'
import { getMetricSourceLabel } from '../domain/alert-threshold'

type Props = {
  alerts: Alert[]
  onAcknowledge?: (alert: Alert) => void
  onResolve?: (alert: Alert) => void
  onDismiss?: (alert: Alert) => void
  class?: string
}

const { alerts, onAcknowledge, onResolve, onDismiss, class: className }: Props = $props()

const levelConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-l-blue-500',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-l-yellow-500',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  critical: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-l-red-500',
    textColor: 'text-red-700 dark:text-red-300'
  }
}

const statusIcons = {
  active: AlertCircle,
  acknowledged: AlertTriangle,
  resolved: CheckCircle2,
  dismissed: XCircle
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<div class={cn('space-y-3', className)}>
  {#if alerts.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-8 text-center">
        <CheckCircle2 class="mb-2 h-10 w-10 text-green-500" />
        <p class="text-sm text-muted-foreground">No active alerts</p>
      </Card.Content>
    </Card.Root>
  {:else}
    {#each alerts as alert (alert.id)}
      {@const config = levelConfig[alert.level]}
      {@const StatusIcon = statusIcons[alert.status]}
      <Card.Root class={cn('border-l-4 transition-all', config.borderColor, config.bgColor)}>
        <Card.Content class="p-4">
          <div class="flex items-start gap-3">
            <div class={cn('mt-0.5', config.textColor)}>
              <svelte:component this={config.icon} class="h-5 w-5" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h4 class={cn('font-semibold', config.textColor)}>
                    {alert.title}
                  </h4>
                  <p class="mt-1 text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                </div>
                <div class="flex shrink-0 items-center gap-1.5">
                  <svelte:component this={StatusIcon} class="h-4 w-4 text-muted-foreground" />
                  <span class="text-xs text-muted-foreground">
                    {getAlertStatusLabel(alert.status)}
                  </span>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span class="rounded bg-muted px-1.5 py-0.5">
                  {getMetricSourceLabel(alert.metricSource)}
                </span>
                <span>|</span>
                <span>Current: {alert.currentValue}</span>
                <span>|</span>
                <span>Threshold: {alert.thresholdValue}</span>
                <span>|</span>
                <span>{formatDate(alert.createdAt)}</span>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                {#if canAcknowledgeAlert(alert.status) && onAcknowledge}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => onAcknowledge(alert)}
                  >
                    Acknowledge
                  </Button>
                {/if}
                {#if canResolveAlert(alert.status) && onResolve}
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => onResolve(alert)}
                  >
                    <CheckCircle2 class="mr-1 h-3 w-3" />
                    Resolve
                  </Button>
                {/if}
                {#if canDismissAlert(alert.status) && onDismiss}
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => onDismiss(alert)}
                  >
                    <XCircle class="mr-1 h-3 w-3" />
                    Dismiss
                  </Button>
                {/if}
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    {/each}
  {/if}
</div>
