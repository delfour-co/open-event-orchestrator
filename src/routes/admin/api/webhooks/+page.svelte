<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { getWebhookEventLabel } from '$lib/features/api/domain/webhook'
import type { WebhookEventType } from '$lib/features/api/domain/webhook'
import { ArrowLeft, ExternalLink, Loader2, Pause, Play, Plus, Trash2, Webhook } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let confirmingDelete = $state<string | null>(null)
let isSubmitting = $state(false)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const getScopeBadge = (webhook: (typeof data.webhooks)[0]) => {
  if (webhook.edition) return `Edition: ${webhook.edition.name}`
  if (webhook.event) return `Event: ${webhook.event.name}`
  if (webhook.organization) return `Org: ${webhook.organization.name}`
  return 'Global'
}

const getHealthColor = (stats: { total: number; success: number; failed: number }) => {
  if (stats.total === 0) return 'bg-gray-100 text-gray-800'
  const successRate = (stats.success / stats.total) * 100
  if (successRate >= 90) return 'bg-green-100 text-green-800'
  if (successRate >= 50) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

$effect(() => {
  if (form?.success) {
    confirmingDelete = null
  }
})
</script>

<svelte:head>
  <title>Webhooks - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/api">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Webhooks</h2>
        <p class="text-muted-foreground">
          Configure event notifications to external services
        </p>
      </div>
    </div>
    <a href="/admin/api/webhooks/new">
      <Button>
        <Plus class="mr-2 h-4 w-4" />
        New Webhook
      </Button>
    </a>
  </div>

  {#if data.webhooks.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Webhook class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No webhooks configured</h3>
        <p class="text-sm text-muted-foreground mb-4">
          Set up webhooks to receive notifications when events occur.
        </p>
        <a href="/admin/api/webhooks/new">
          <Button>
            <Plus class="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
        </a>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-4">
      {#each data.webhooks as webhook}
        <Card.Root class={!webhook.isActive ? 'opacity-60' : ''}>
          <Card.Content class="p-4">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2">
                  <Webhook class="h-5 w-5 text-muted-foreground" />
                  <span class="font-semibold text-lg">{webhook.name}</span>
                  {#if webhook.isActive}
                    <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                  {:else}
                    <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      Paused
                    </span>
                  {/if}
                  <span class="rounded-full px-2 py-0.5 text-xs font-medium {getHealthColor(webhook.stats)}">
                    {webhook.stats.success}/{webhook.stats.total} delivered
                  </span>
                </div>

                <div class="grid gap-2 text-sm text-muted-foreground md:grid-cols-2 lg:grid-cols-3">
                  <div class="flex items-center gap-2">
                    <ExternalLink class="h-4 w-4" />
                    <code class="truncate max-w-[200px]">{webhook.url}</code>
                  </div>
                  <div>
                    <span class="font-medium">Scope:</span>
                    <span class="ml-1">{getScopeBadge(webhook)}</span>
                  </div>
                  <div>
                    <span class="font-medium">Retries:</span>
                    <span class="ml-1">{webhook.retryCount}</span>
                  </div>
                </div>

                <div class="mt-2 flex flex-wrap gap-1">
                  {#each webhook.events.slice(0, 4) as event}
                    <span class="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {getWebhookEventLabel(event as WebhookEventType)}
                    </span>
                  {/each}
                  {#if webhook.events.length > 4}
                    <span class="rounded bg-muted px-1.5 py-0.5 text-xs">
                      +{webhook.events.length - 4} more
                    </span>
                  {/if}
                </div>

                <div class="mt-2 text-xs text-muted-foreground">
                  Created {formatDate(webhook.createdAt)}
                  {#if webhook.createdBy}
                    by {webhook.createdBy.name}
                  {/if}
                </div>
              </div>

              <div class="flex gap-2">
                <form method="POST" action="?/toggleActive" use:enhance>
                  <input type="hidden" name="id" value={webhook.id} />
                  <input type="hidden" name="isActive" value={webhook.isActive.toString()} />
                  <Button variant="outline" size="sm" type="submit">
                    {#if webhook.isActive}
                      <Pause class="mr-1 h-4 w-4" />
                      Pause
                    {:else}
                      <Play class="mr-1 h-4 w-4" />
                      Enable
                    {/if}
                  </Button>
                </form>
                <a href="/admin/api/webhooks/{webhook.id}">
                  <Button variant="outline" size="sm">
                    View Deliveries
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  class="text-destructive hover:text-destructive"
                  onclick={() => confirmingDelete = webhook.id}
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

<!-- Delete Confirmation Dialog -->
{#if confirmingDelete}
  <Dialog.Content onClose={() => confirmingDelete = null}>
    <Dialog.Header>
      <Dialog.Title>Delete Webhook</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete this webhook? All delivery history will also be deleted. This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <form
      method="POST"
      action="?/deleteWebhook"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update()
        }
      }}
    >
      <input type="hidden" name="id" value={confirmingDelete} />
      <Dialog.Footer>
        <Button type="button" variant="outline" onclick={() => confirmingDelete = null}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {/if}
          Delete Webhook
        </Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
{/if}

{#if form?.error}
  <div
    class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg"
  >
    {form.error}
  </div>
{/if}
