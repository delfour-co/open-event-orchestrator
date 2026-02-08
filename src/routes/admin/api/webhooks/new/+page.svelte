<script lang="ts">
import { enhance } from '$app/forms'
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import {
  getWebhookEventLabel,
  groupWebhookEventsByCategory
} from '$lib/features/api/domain/webhook'
import { AlertTriangle, ArrowLeft, Check, Copy, Loader2, Webhook } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let copied = $state(false)
let scopeType = $state<'global' | 'organization' | 'event' | 'edition'>('global')
let selectedEvents = $state<string[]>([])

const eventsByCategory = groupWebhookEventsByCategory()

const toggleEvent = (event: string) => {
  if (selectedEvents.includes(event)) {
    selectedEvents = selectedEvents.filter((e) => e !== event)
  } else {
    selectedEvents = [...selectedEvents, event]
  }
}

const selectAllEvents = () => {
  selectedEvents = [...data.webhookEvents]
}

const selectCategory = (category: string) => {
  const categoryEvents = eventsByCategory[category] || []
  const categoryEventStrings = categoryEvents as string[]
  const allSelected = categoryEvents.every((e) => selectedEvents.includes(e))
  if (allSelected) {
    selectedEvents = selectedEvents.filter((e) => !categoryEventStrings.includes(e))
  } else {
    selectedEvents = [...new Set([...selectedEvents, ...categoryEventStrings])]
  }
}

const clearEvents = () => {
  selectedEvents = []
}

const copySecret = () => {
  if (form?.webhookSecret) {
    navigator.clipboard.writeText(form.webhookSecret)
    copied = true
    setTimeout(() => {
      copied = false
    }, 2000)
  }
}

const goToWebhooks = () => {
  goto('/admin/api/webhooks')
}
</script>

<svelte:head>
  <title>Create Webhook - Open Event Orchestrator</title>
</svelte:head>

<div class="mx-auto max-w-2xl space-y-6">
  <div class="flex items-center gap-4">
    <a href="/admin/api/webhooks">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-5 w-5" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Create Webhook</h2>
      <p class="text-muted-foreground">
        Set up event notifications to an external URL
      </p>
    </div>
  </div>

  {#if form?.success && form?.webhookSecret}
    <!-- Success State - Show the secret -->
    <Card.Root class="border-green-500">
      <Card.Header>
        <Card.Title class="flex items-center gap-2 text-green-600">
          <Check class="h-5 w-5" />
          Webhook Created Successfully
        </Card.Title>
        <Card.Description>
          Copy your webhook secret now. You won't be able to see it again!
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="space-y-2">
          <Label>Webhook Signing Secret</Label>
          <div class="rounded-md border bg-muted p-4">
            <div class="flex items-center justify-between gap-4">
              <code class="flex-1 break-all text-sm">{form.webhookSecret}</code>
              <Button variant="outline" size="sm" onclick={copySecret} class="shrink-0">
                {#if copied}
                  <Check class="mr-1 h-4 w-4 text-green-500" />
                  Copied!
                {:else}
                  <Copy class="mr-1 h-4 w-4" />
                  Copy
                {/if}
              </Button>
            </div>
          </div>
        </div>

        <div class="flex items-start gap-2 rounded-md border border-yellow-500 bg-yellow-50 p-3 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          <AlertTriangle class="mt-0.5 h-5 w-5 shrink-0" />
          <div class="text-sm">
            <p class="font-medium">Use this secret to verify webhook signatures</p>
            <p>Each webhook request includes an <code>X-OEO-Signature</code> header with an HMAC-SHA256 signature. Use this secret to verify that requests are coming from Open Event Orchestrator.</p>
          </div>
        </div>

        <Button onclick={goToWebhooks} class="w-full">
          Done - Go to Webhooks
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Form State -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Webhook class="h-5 w-5" />
          New Webhook
        </Card.Title>
      </Card.Header>
      <Card.Content>
        {#if form?.error}
          <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.error}
          </div>
        {/if}

        <form
          method="POST"
          use:enhance={() => {
            isSubmitting = true
            return async ({ update }) => {
              isSubmitting = false
              await update()
            }
          }}
          class="space-y-6"
        >
          <!-- Name -->
          <div class="space-y-2">
            <Label for="name">Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="My Integration Webhook"
              required
            />
            <p class="text-xs text-muted-foreground">
              A descriptive name to identify this webhook
            </p>
          </div>

          <!-- URL -->
          <div class="space-y-2">
            <Label for="url">Endpoint URL *</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com/webhooks/oeo"
              required
            />
            <p class="text-xs text-muted-foreground">
              The URL where webhook events will be sent via POST request
            </p>
          </div>

          <!-- Scope -->
          <div class="space-y-3">
            <Label>Scope</Label>
            <div class="grid gap-2 md:grid-cols-2">
              <label class="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted {scopeType === 'global' ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="scopeType"
                  value="global"
                  checked={scopeType === 'global'}
                  onchange={() => scopeType = 'global'}
                  class="h-4 w-4"
                />
                <div>
                  <div class="font-medium">Global</div>
                  <div class="text-xs text-muted-foreground">All events</div>
                </div>
              </label>
              <label class="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted {scopeType === 'organization' ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="scopeType"
                  value="organization"
                  checked={scopeType === 'organization'}
                  onchange={() => scopeType = 'organization'}
                  class="h-4 w-4"
                />
                <div>
                  <div class="font-medium">Organization</div>
                  <div class="text-xs text-muted-foreground">Events from one organization</div>
                </div>
              </label>
              <label class="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted {scopeType === 'event' ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="scopeType"
                  value="event"
                  checked={scopeType === 'event'}
                  onchange={() => scopeType = 'event'}
                  class="h-4 w-4"
                />
                <div>
                  <div class="font-medium">Event</div>
                  <div class="text-xs text-muted-foreground">Events from one event</div>
                </div>
              </label>
              <label class="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted {scopeType === 'edition' ? 'border-primary bg-primary/5' : ''}">
                <input
                  type="radio"
                  name="scopeType"
                  value="edition"
                  checked={scopeType === 'edition'}
                  onchange={() => scopeType = 'edition'}
                  class="h-4 w-4"
                />
                <div>
                  <div class="font-medium">Edition</div>
                  <div class="text-xs text-muted-foreground">Events from one edition</div>
                </div>
              </label>
            </div>

            {#if scopeType === 'organization'}
              <div class="space-y-2">
                <Label for="organizationId">Organization *</Label>
                <select
                  id="organizationId"
                  name="organizationId"
                  required
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select organization...</option>
                  {#each data.organizations as org}
                    <option value={org.id}>{org.name}</option>
                  {/each}
                </select>
              </div>
            {:else if scopeType === 'event'}
              <div class="space-y-2">
                <Label for="eventId">Event *</Label>
                <select
                  id="eventId"
                  name="eventId"
                  required
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select event...</option>
                  {#each data.events as event}
                    <option value={event.id}>{event.name}</option>
                  {/each}
                </select>
              </div>
            {:else if scopeType === 'edition'}
              <div class="space-y-2">
                <Label for="editionId">Edition *</Label>
                <select
                  id="editionId"
                  name="editionId"
                  required
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select edition...</option>
                  {#each data.editions as edition}
                    <option value={edition.id}>{edition.name} ({edition.year})</option>
                  {/each}
                </select>
              </div>
            {/if}
          </div>

          <!-- Events -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <Label>Events to Subscribe *</Label>
              <div class="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onclick={selectAllEvents}>
                  All
                </Button>
                <Button type="button" variant="ghost" size="sm" onclick={clearEvents}>
                  Clear
                </Button>
              </div>
            </div>

            {#each Object.entries(eventsByCategory) as [category, events]}
              <div class="space-y-2">
                <button
                  type="button"
                  class="text-sm font-medium text-muted-foreground hover:text-foreground"
                  onclick={() => selectCategory(category)}
                >
                  {category}
                </button>
                <div class="grid gap-2 md:grid-cols-2">
                  {#each events as event}
                    <label class="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted {selectedEvents.includes(event) ? 'border-primary bg-primary/5' : ''}">
                      <input
                        type="checkbox"
                        name="events"
                        value={event}
                        checked={selectedEvents.includes(event)}
                        onchange={() => toggleEvent(event)}
                        class="h-4 w-4 rounded border-gray-300"
                      />
                      <div class="flex-1">
                        <div class="text-sm">{getWebhookEventLabel(event)}</div>
                        <code class="text-xs text-muted-foreground">{event}</code>
                      </div>
                    </label>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <!-- Retry Count -->
          <div class="space-y-2">
            <Label for="retryCount">Retry Attempts</Label>
            <select
              id="retryCount"
              name="retryCount"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="0">No retries</option>
              <option value="1">1 retry</option>
              <option value="3" selected>3 retries</option>
              <option value="5">5 retries</option>
            </select>
            <p class="text-xs text-muted-foreground">
              Number of retry attempts if delivery fails (exponential backoff)
            </p>
          </div>

          <!-- Submit -->
          <div class="flex gap-3">
            <a href="/admin/api/webhooks" class="flex-1">
              <Button type="button" variant="outline" class="w-full">
                Cancel
              </Button>
            </a>
            <Button
              type="submit"
              class="flex-1"
              disabled={isSubmitting || selectedEvents.length === 0}
            >
              {#if isSubmitting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {:else}
                <Webhook class="mr-2 h-4 w-4" />
              {/if}
              Create Webhook
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}
</div>
