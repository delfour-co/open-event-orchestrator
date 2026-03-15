<script lang="ts">
import { enhance } from '$app/forms'
import { formatDate as sharedFormatDate } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Webhook,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isRetrying = $state<string | null>(null)
let expandedDelivery = $state<string | null>(null)

const formatDate = (date: Date) =>
  sharedFormatDate(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const getStatusColor = (delivery: (typeof data.deliveries.items)[0]) => {
  if (delivery.deliveredAt) return 'text-green-600 bg-green-100 dark:bg-green-900/30'
  if (delivery.error) return 'text-red-600 bg-red-100 dark:bg-red-900/30'
  return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30'
}

const getStatusText = (delivery: (typeof data.deliveries.items)[0]) => {
  if (delivery.deliveredAt) return m.webhook_detail_delivered()
  if (delivery.nextRetryAt) return m.webhook_detail_retry_scheduled()
  if (delivery.error) return m.webhook_detail_failed()
  return m.webhook_detail_pending()
}

const getScopeBadge = () => {
  if (data.webhook.edition)
    return m.webhook_detail_scope_edition({ name: data.webhook.edition.name })
  if (data.webhook.event) return m.webhook_detail_scope_event({ name: data.webhook.event.name })
  if (data.webhook.organization)
    return m.webhook_detail_scope_org({ name: data.webhook.organization.name })
  return m.webhook_detail_scope_global()
}

const getSuccessRate = () => {
  if (data.stats.total === 0) return 0
  return Math.round((data.stats.success / data.stats.total) * 100)
}

const toggleExpanded = (id: string) => {
  expandedDelivery = expandedDelivery === id ? null : id
}

const isExpanded = (id: string) => expandedDelivery === id
</script>

<svelte:head>
  <title>{data.webhook.name} - Webhooks - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/api/webhooks">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-bold tracking-tight">{data.webhook.name}</h2>
          {#if data.webhook.isActive}
            <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              {m.webhook_detail_active()}
            </span>
          {:else}
            <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              {m.webhook_detail_paused()}
            </span>
          {/if}
        </div>
        <p class="text-muted-foreground flex items-center gap-2">
          <ExternalLink class="h-4 w-4" />
          <code class="text-sm">{data.webhook.url}</code>
        </p>
      </div>
    </div>
    <form method="POST" action="?/toggleActive" use:enhance>
      <input type="hidden" name="id" value={data.webhook.id} />
      <input type="hidden" name="isActive" value={data.webhook.isActive.toString()} />
      <Button variant="outline" type="submit">
        {#if data.webhook.isActive}
          <Pause class="mr-2 h-4 w-4" />
          {m.webhook_detail_pause()}
        {:else}
          <Play class="mr-2 h-4 w-4" />
          {m.webhook_detail_enable()}
        {/if}
      </Button>
    </form>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-4">
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-2xl font-bold">{data.stats.total}</div>
        <p class="text-xs text-muted-foreground">{m.webhook_detail_total_deliveries()}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-2xl font-bold text-green-600">{data.stats.success}</div>
        <p class="text-xs text-muted-foreground">{m.webhook_detail_successful()}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-2xl font-bold text-red-600">{data.stats.failed}</div>
        <p class="text-xs text-muted-foreground">{m.webhook_detail_failed()}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="pt-6">
        <div class="text-2xl font-bold">{getSuccessRate()}%</div>
        <p class="text-xs text-muted-foreground">{m.webhook_detail_success_rate()}</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Webhook Details -->
  <div class="grid gap-4 md:grid-cols-2">
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Webhook class="h-5 w-5" />
          {m.webhook_detail_configuration()}
        </Card.Title>
      </Card.Header>
      <Card.Content class="space-y-3 text-sm">
        <div class="flex justify-between">
          <span class="text-muted-foreground">{m.webhook_detail_scope()}</span>
          <span class="font-medium">{getScopeBadge()}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">{m.webhook_detail_retry_attempts()}</span>
          <span class="font-medium">{data.webhook.retryCount}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">{m.webhook_detail_created()}</span>
          <span class="font-medium">{formatDate(data.webhook.createdAt)}</span>
        </div>
        {#if data.webhook.createdBy}
          <div class="flex justify-between">
            <span class="text-muted-foreground">{m.webhook_detail_created_by()}</span>
            <span class="font-medium">{data.webhook.createdBy.name}</span>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>{m.webhook_detail_subscribed_events()}</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="flex flex-wrap gap-2">
          {#each data.webhook.events as event}
            <span class="rounded-md bg-muted px-2 py-1 text-xs">
              {event.label}
              <code class="ml-1 text-muted-foreground">({event.code})</code>
            </span>
          {/each}
        </div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Delivery History -->
  <Card.Root>
    <Card.Header>
      <Card.Title>{m.webhook_detail_delivery_history()}</Card.Title>
      <Card.Description>
        {m.webhook_detail_delivery_description({ count: data.deliveries.totalItems.toString() })}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if form?.error}
        <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle class="h-4 w-4" />
          {form.error}
        </div>
      {/if}

      {#if form?.success && form?.message}
        <div class="mb-4 rounded-md border border-green-500 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200 flex items-center gap-2">
          <Check class="h-4 w-4" />
          {form.message}
        </div>
      {/if}

      {#if data.deliveries.items.length === 0}
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <Clock class="mb-3 h-10 w-10 text-muted-foreground" />
          <p class="text-sm text-muted-foreground">{m.webhook_detail_no_deliveries()}</p>
          <p class="text-xs text-muted-foreground mt-1">
            {m.webhook_detail_no_deliveries_hint()}
          </p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each data.deliveries.items as delivery}
            <div class="rounded-md border">
              <button
                type="button"
                class="flex w-full items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                onclick={() => toggleExpanded(delivery.id)}
              >
                <div class="flex items-center gap-3">
                  <div class="rounded-full p-1 {getStatusColor(delivery)}">
                    {#if delivery.deliveredAt}
                      <Check class="h-3 w-3" />
                    {:else if delivery.error}
                      <X class="h-3 w-3" />
                    {:else}
                      <Clock class="h-3 w-3" />
                    {/if}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{delivery.eventLabel}</span>
                      <code class="text-xs text-muted-foreground">({delivery.event})</code>
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {formatRelativeTime(delivery.createdAt)}
                      {#if delivery.statusCode}
                        <span class="mx-1">-</span>
                        <span class={delivery.statusCode >= 200 && delivery.statusCode < 300 ? 'text-green-600' : 'text-red-600'}>
                          HTTP {delivery.statusCode}
                        </span>
                      {/if}
                      {#if delivery.attempt > 1}
                        <span class="mx-1">-</span>
                        <span>{m.webhook_detail_attempt({ attempt: delivery.attempt.toString() })}</span>
                      {/if}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(delivery)}">
                    {getStatusText(delivery)}
                  </span>
                  <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform {isExpanded(delivery.id) ? 'rotate-180' : ''}" />
                </div>
              </button>

              {#if isExpanded(delivery.id)}
                <div class="border-t bg-muted/30 p-3 space-y-3">
                  <div class="grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <span class="text-muted-foreground">{m.webhook_detail_created()}:</span>
                      <span class="ml-2">{formatDate(delivery.createdAt)}</span>
                    </div>
                    {#if delivery.deliveredAt}
                      <div>
                        <span class="text-muted-foreground">{m.webhook_detail_delivered()}:</span>
                        <span class="ml-2">{formatDate(delivery.deliveredAt)}</span>
                      </div>
                    {/if}
                    {#if delivery.nextRetryAt}
                      <div>
                        <span class="text-muted-foreground">{m.webhook_detail_next_retry()}</span>
                        <span class="ml-2">{formatDate(delivery.nextRetryAt)}</span>
                      </div>
                    {/if}
                  </div>

                  {#if delivery.error}
                    <div class="rounded-md border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/20">
                      <p class="text-xs font-medium text-red-800 dark:text-red-200">{m.webhook_detail_error()}</p>
                      <p class="text-xs text-red-700 dark:text-red-300">{delivery.error}</p>
                    </div>
                  {/if}

                  {#if delivery.responseBody}
                    <div>
                      <p class="text-xs font-medium text-muted-foreground mb-1">{m.webhook_detail_response_body()}</p>
                      <pre class="rounded-md bg-muted p-2 text-xs overflow-x-auto max-h-32">{delivery.responseBody}</pre>
                    </div>
                  {/if}

                  {#if !delivery.deliveredAt}
                    <form method="POST" action="?/retryDelivery" use:enhance={() => {
                      isRetrying = delivery.id
                      return async ({ update }) => {
                        isRetrying = null
                        await update()
                      }
                    }}>
                      <input type="hidden" name="deliveryId" value={delivery.id} />
                      <input type="hidden" name="webhookId" value={data.webhook.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        disabled={isRetrying === delivery.id}
                      >
                        {#if isRetrying === delivery.id}
                          <Loader2 class="mr-2 h-3 w-3 animate-spin" />
                        {:else}
                          <RefreshCw class="mr-2 h-3 w-3" />
                        {/if}
                        {m.webhook_detail_retry_now()}
                      </Button>
                    </form>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <!-- Pagination -->
        {#if data.deliveries.totalPages > 1}
          <div class="mt-4 flex items-center justify-between">
            <p class="text-sm text-muted-foreground">
              {m.webhook_detail_page_of({ page: data.deliveries.page.toString(), total: data.deliveries.totalPages.toString() })}
            </p>
            <div class="flex gap-2">
              {#if data.deliveries.page > 1}
                <a href="?page={data.deliveries.page - 1}">
                  <Button variant="outline" size="sm">
                    <ChevronLeft class="mr-1 h-4 w-4" />
                    {m.action_previous()}
                  </Button>
                </a>
              {/if}
              {#if data.deliveries.page < data.deliveries.totalPages}
                <a href="?page={data.deliveries.page + 1}">
                  <Button variant="outline" size="sm">
                    {m.action_next()}
                    <ChevronRight class="ml-1 h-4 w-4" />
                  </Button>
                </a>
              {/if}
            </div>
          </div>
        {/if}
      {/if}
    </Card.Content>
  </Card.Root>
</div>
