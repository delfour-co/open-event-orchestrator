<script lang="ts">
import { enhance } from '$app/forms'
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  Building2,
  Calendar,
  CalendarDays,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Settings,
  Users,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showNewEvent = $state(false)
let showNewEdition = $state<string | null>(null)
let selectedOrgId = $state<string>($page.url.searchParams.get('org') || '')
let showArchived = $state(false)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

// Filter events by selected organization
const filteredEvents = $derived(
  selectedOrgId ? data.events.filter((e) => e.organizationId === selectedOrgId) : data.events
)

// Get all editions from filtered events, filtered by archived status
const allEditions = $derived(() => {
  const editions: Array<{
    eventId: string
    eventName: string
    eventSlug: string
    organizationName: string
    id: string
    name: string
    slug: string
    year: number
    status: string
    startDate: Date
    endDate: Date
    venue: string
    city: string
    country: string
  }> = []

  for (const event of filteredEvents) {
    for (const edition of event.editions) {
      if (!showArchived && edition.status === 'archived') continue
      editions.push({
        eventId: event.id,
        eventName: event.name,
        eventSlug: event.slug,
        organizationName: event.organizationName,
        ...edition
      })
    }
  }

  // Sort by start date descending (most recent first)
  return editions.sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
})

// Count archived editions
const archivedCount = $derived(() => {
  let count = 0
  for (const event of filteredEvents) {
    for (const edition of event.editions) {
      if (edition.status === 'archived') count++
    }
  }
  return count
})

const selectedOrg = $derived(data.organizations.find((o) => o.id === selectedOrgId))
</script>

<svelte:head>
  <title>Events - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Events</h2>
      <p class="text-muted-foreground">
        Manage your events and their editions.
        {#if selectedOrg}
          Filtered by <strong>{selectedOrg.name}</strong>.
          <button class="text-primary underline" onclick={() => (selectedOrgId = '')}>
            Show all
          </button>
        {/if}
      </p>
    </div>
    <div class="flex gap-2">
      {#if archivedCount() > 0}
        <Button variant="outline" onclick={() => (showArchived = !showArchived)}>
          {#if showArchived}
            <EyeOff class="mr-2 h-4 w-4" />
            Hide Archived ({archivedCount()})
          {:else}
            <Eye class="mr-2 h-4 w-4" />
            Show Archived ({archivedCount()})
          {/if}
        </Button>
      {/if}
      <Button onclick={() => (showNewEvent = !showNewEvent)}>
        <Plus class="mr-2 h-4 w-4" />
        New Event
      </Button>
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
      {form.error}
    </div>
  {/if}

  <!-- New Event Form -->
  {#if showNewEvent}
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <div>
            <Card.Title class="flex items-center gap-2">
              <CalendarDays class="h-5 w-5" />
              Create Event
            </Card.Title>
            <Card.Description>
              Events can have multiple editions (yearly occurrences).
            </Card.Description>
          </div>
          <Button variant="ghost" size="icon" onclick={() => (showNewEvent = false)}>
            <X class="h-4 w-4" />
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        {#if data.organizations.length === 0}
          <div class="flex flex-col items-center py-6">
            <Building2 class="mb-2 h-8 w-8 text-muted-foreground" />
            <p class="mb-4 text-center text-muted-foreground">
              Please create an organization first before creating an event.
            </p>
            <a href="/admin/organizations">
              <Button variant="outline">Go to Organizations</Button>
            </a>
          </div>
        {:else}
          <form
            method="POST"
            action="?/createEvent"
            use:enhance={() => {
              return async ({ update }) => {
                await update()
                showNewEvent = false
              }
            }}
            class="space-y-4"
          >
            <div class="space-y-2">
              <Label for="event-org">Organization</Label>
              <select
                id="event-org"
                name="organizationId"
                required
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {#each data.organizations as org}
                  <option value={org.id} selected={org.id === selectedOrgId}>{org.name}</option>
                {/each}
              </select>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  name="name"
                  placeholder="DevFest"
                  required
                  oninput={(e) => {
                    const slugInput = document.getElementById('event-slug') as HTMLInputElement
                    if (slugInput)
                      slugInput.value = generateSlug((e.target as HTMLInputElement).value)
                  }}
                />
              </div>
              <div class="space-y-2">
                <Label for="event-slug">Slug</Label>
                <Input id="event-slug" name="slug" placeholder="devfest" required />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="event-description">Description</Label>
              <Textarea
                id="event-description"
                name="description"
                placeholder="The biggest developer festival..."
              />
            </div>
            <div class="flex gap-2">
              <Button type="submit">Create Event</Button>
              <Button type="button" variant="ghost" onclick={() => (showNewEvent = false)}>
                Cancel
              </Button>
            </div>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- New Edition Form -->
  {#if showNewEdition}
    {@const event = data.events.find((e) => e.id === showNewEdition)}
    {#if event}
      <Card.Root>
        <Card.Header>
          <div class="flex items-center justify-between">
            <div>
              <Card.Title class="flex items-center gap-2">
                <Calendar class="h-5 w-5" />
                New Edition for {event.name}
              </Card.Title>
              <Card.Description>
                Create a new edition (yearly occurrence) for this event.
              </Card.Description>
            </div>
            <Button variant="ghost" size="icon" onclick={() => (showNewEdition = null)}>
              <X class="h-4 w-4" />
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          <form
            method="POST"
            action="?/createEdition"
            use:enhance={() => {
              return async ({ update }) => {
                await update()
                showNewEdition = null
              }
            }}
            class="space-y-4"
          >
            <input type="hidden" name="eventId" value={event.id} />
            <div class="grid gap-4 md:grid-cols-3">
              <div class="space-y-2">
                <Label for="edition-name">Name</Label>
                <Input
                  id="edition-name"
                  name="name"
                  placeholder="{event.name} Paris 2025"
                  required
                  oninput={(e) => {
                    const slugInput = document.getElementById('edition-slug') as HTMLInputElement
                    if (slugInput)
                      slugInput.value = generateSlug((e.target as HTMLInputElement).value)
                  }}
                />
              </div>
              <div class="space-y-2">
                <Label for="edition-slug">Slug</Label>
                <Input id="edition-slug" name="slug" placeholder="{event.slug}-paris-2025" required />
              </div>
              <div class="space-y-2">
                <Label for="edition-year">Year</Label>
                <Input
                  id="edition-year"
                  name="year"
                  type="number"
                  placeholder="2025"
                  value={String(new Date().getFullYear())}
                  required
                />
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="edition-start">Start Date</Label>
                <Input id="edition-start" name="startDate" type="date" required />
              </div>
              <div class="space-y-2">
                <Label for="edition-end">End Date</Label>
                <Input id="edition-end" name="endDate" type="date" required />
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-3">
              <div class="space-y-2">
                <Label for="edition-venue">Venue</Label>
                <Input id="edition-venue" name="venue" placeholder="Convention Center" />
              </div>
              <div class="space-y-2">
                <Label for="edition-city">City</Label>
                <Input id="edition-city" name="city" placeholder="Paris" />
              </div>
              <div class="space-y-2">
                <Label for="edition-country">Country</Label>
                <Input id="edition-country" name="country" placeholder="France" />
              </div>
            </div>
            <div class="flex gap-2">
              <Button type="submit">Create Edition</Button>
              <Button type="button" variant="ghost" onclick={() => (showNewEdition = null)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card.Root>
    {/if}
  {/if}

  <!-- Filters -->
  {#if data.organizations.length > 1}
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <Label class="text-sm text-muted-foreground">Organization:</Label>
        <select
          class="rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={selectedOrgId}
          onchange={(e) => (selectedOrgId = (e.target as HTMLSelectElement).value)}
        >
          <option value="">All organizations</option>
          {#each data.organizations as org}
            <option value={org.id}>{org.name}</option>
          {/each}
        </select>
      </div>
    </div>
  {/if}

  <!-- Editions Grid -->
  {#if allEditions().length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <CalendarDays class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No editions yet</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          {#if data.organizations.length === 0}
            Create an organization first, then add events.
          {:else if data.events.length === 0}
            Create your first event to get started.
          {:else if !showArchived && archivedCount() > 0}
            All editions are archived.
            <button class="text-primary underline" onclick={() => (showArchived = true)}>
              Show archived editions
            </button>
          {:else}
            Create an edition for one of your events.
          {/if}
        </p>
        {#if data.organizations.length === 0}
          <a href="/admin/organizations">
            <Button>
              <Building2 class="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </a>
        {:else if data.events.length === 0}
          <Button onclick={() => (showNewEvent = true)}>
            <Plus class="mr-2 h-4 w-4" />
            Create Event
          </Button>
        {:else}
          <div class="flex gap-2">
            <Button variant="outline" onclick={() => (showNewEvent = true)}>
              <Plus class="mr-2 h-4 w-4" />
              New Event
            </Button>
            <Button onclick={() => (showNewEdition = data.events[0].id)}>
              <Plus class="mr-2 h-4 w-4" />
              New Edition
            </Button>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each allEditions() as edition}
        <Card.Root class="transition-shadow hover:shadow-md {edition.status === 'archived' ? 'opacity-60' : ''}">
          <Card.Header class="pb-3">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <Card.Title class="flex items-center gap-2">
                  <Calendar class="h-5 w-5" />
                  {edition.name}
                </Card.Title>
                <Card.Description class="mt-1">
                  {edition.eventName} · {edition.organizationName}
                </Card.Description>
              </div>
              <div class="flex items-center gap-2">
                <a href="/admin/editions/{edition.slug}/settings" title="Change edition status">
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 {getStatusColor(edition.status)}"
                  >
                    {edition.status}
                  </span>
                </a>
                <a href="/admin/editions/{edition.slug}/settings" title="Edition Settings">
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Settings class="h-4 w-4" />
                  </Button>
                </a>
                <a href="/admin/editions/{edition.slug}/team" title="Team Members">
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Users class="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </Card.Header>
          <Card.Content class="space-y-3">
            <div class="space-y-1 text-sm text-muted-foreground">
              <div class="flex items-center gap-2">
                <CalendarDays class="h-4 w-4" />
                <span>{formatDate(edition.startDate)} - {formatDate(edition.endDate)}</span>
              </div>
              {#if edition.venue || edition.city || edition.country}
                <div class="flex items-center gap-2">
                  <MapPin class="h-4 w-4" />
                  <span>{[edition.venue, edition.city, edition.country].filter(Boolean).join(', ')}</span>
                </div>
              {/if}
            </div>
          </Card.Content>
        </Card.Root>
      {/each}

      <!-- Add Edition Card -->
      {#if data.events.length > 0}
        <Card.Root class="border-dashed">
          <Card.Content class="flex h-full min-h-[200px] flex-col items-center justify-center py-6">
            <Plus class="mb-2 h-8 w-8 text-muted-foreground" />
            <p class="mb-4 text-sm text-muted-foreground">Add a new edition</p>
            <select
              class="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value=""
              onchange={(e) => {
                const value = (e.target as HTMLSelectElement).value
                if (value) {
                  showNewEdition = value
                  ;(e.target as HTMLSelectElement).value = ''
                }
              }}
            >
              <option value="" disabled>Select event...</option>
              {#each data.events as event}
                <option value={event.id}>{event.name}</option>
              {/each}
            </select>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>
  {/if}
</div>
