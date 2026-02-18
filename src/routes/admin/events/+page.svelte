<script lang="ts">
import { enhance } from '$app/forms'
import { page } from '$app/stores'
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import {
  Building2,
  Calendar,
  CalendarDays,
  ExternalLink,
  Eye,
  EyeOff,
  MapPin,
  Plus,
  Settings,
  Smartphone,
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
  <title>{m.admin_events_title()}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{m.admin_events_heading()}</h2>
      <p class="text-muted-foreground">
        {m.admin_events_description()}
        {#if selectedOrg}
          {m.admin_events_filtered_by({ name: selectedOrg.name })}
          <button class="text-primary underline" onclick={() => (selectedOrgId = '')}>
            {m.admin_events_show_all()}
          </button>
        {/if}
      </p>
    </div>
    <div class="flex gap-2">
      {#if archivedCount() > 0}
        <Button variant="outline" onclick={() => (showArchived = !showArchived)}>
          {#if showArchived}
            <EyeOff class="mr-2 h-4 w-4" />
            {m.admin_events_hide_archived({ count: archivedCount() })}
          {:else}
            <Eye class="mr-2 h-4 w-4" />
            {m.admin_events_show_archived({ count: archivedCount() })}
          {/if}
        </Button>
      {/if}
      <Button onclick={() => (showNewEvent = !showNewEvent)}>
        <Plus class="mr-2 h-4 w-4" />
        {m.admin_events_new()}
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
              {m.admin_events_create_title()}
            </Card.Title>
            <Card.Description>
              {m.admin_events_create_description()}
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
              {m.admin_events_create_org_first()}
            </p>
            <a href="/admin/organizations">
              <Button variant="outline">{m.admin_events_go_to_orgs()}</Button>
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
              <Label for="event-org">{m.admin_events_organization()}</Label>
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
                <Label for="event-name">{m.admin_events_name()}</Label>
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
                <Label for="event-slug">{m.admin_events_slug()}</Label>
                <Input id="event-slug" name="slug" placeholder="devfest" required />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="event-description">{m.admin_events_description_label()}</Label>
              <Textarea
                id="event-description"
                name="description"
                placeholder={m.admin_events_description_placeholder()}
              />
            </div>
            <div class="flex gap-2">
              <Button type="submit">{m.admin_events_create_button()}</Button>
              <Button type="button" variant="ghost" onclick={() => (showNewEvent = false)}>
                {m.action_cancel()}
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
                {m.admin_events_new_edition_for({ name: event.name })}
              </Card.Title>
              <Card.Description>
                {m.admin_events_new_edition_description()}
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
                <Label for="edition-name">{m.admin_events_edition_name()}</Label>
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
                <Label for="edition-slug">{m.admin_events_edition_slug()}</Label>
                <Input id="edition-slug" name="slug" placeholder="{event.slug}-paris-2025" required />
              </div>
              <div class="space-y-2">
                <Label for="edition-year">{m.admin_events_edition_year()}</Label>
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
                <Label for="edition-start">{m.admin_events_edition_start()}</Label>
                <Input id="edition-start" name="startDate" type="date" required />
              </div>
              <div class="space-y-2">
                <Label for="edition-end">{m.admin_events_edition_end()}</Label>
                <Input id="edition-end" name="endDate" type="date" required />
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-3">
              <div class="space-y-2">
                <Label for="edition-venue">{m.admin_events_edition_venue()}</Label>
                <Input id="edition-venue" name="venue" placeholder="Convention Center" />
              </div>
              <div class="space-y-2">
                <Label for="edition-city">{m.admin_events_edition_city()}</Label>
                <Input id="edition-city" name="city" placeholder="Paris" />
              </div>
              <div class="space-y-2">
                <Label for="edition-country">{m.admin_events_edition_country()}</Label>
                <Input id="edition-country" name="country" placeholder="France" />
              </div>
            </div>
            <div class="flex gap-2">
              <Button type="submit">{m.admin_events_create_edition()}</Button>
              <Button type="button" variant="ghost" onclick={() => (showNewEdition = null)}>
                {m.action_cancel()}
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
        <Label class="text-sm text-muted-foreground">{m.admin_events_filter_organization()}</Label>
        <select
          class="rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={selectedOrgId}
          onchange={(e) => (selectedOrgId = (e.target as HTMLSelectElement).value)}
        >
          <option value="">{m.admin_events_all_organizations()}</option>
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
        <h3 class="text-lg font-semibold">{m.admin_events_empty_title()}</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          {#if data.organizations.length === 0}
            {m.admin_events_empty_create_org()}
          {:else if data.events.length === 0}
            {m.admin_events_empty_create_event()}
          {:else if !showArchived && archivedCount() > 0}
            {m.admin_events_empty_all_archived()}
            <button class="text-primary underline" onclick={() => (showArchived = true)}>
              {m.admin_events_empty_show_archived()}
            </button>
          {:else}
            {m.admin_events_empty_create_edition()}
          {/if}
        </p>
        {#if data.organizations.length === 0}
          <a href="/admin/organizations">
            <Button>
              <Building2 class="mr-2 h-4 w-4" />
              {m.admin_organizations_create_button()}
            </Button>
          </a>
        {:else if data.events.length === 0}
          <Button onclick={() => (showNewEvent = true)}>
            <Plus class="mr-2 h-4 w-4" />
            {m.admin_events_create_button()}
          </Button>
        {:else}
          <div class="flex gap-2">
            <Button variant="outline" onclick={() => (showNewEvent = true)}>
              <Plus class="mr-2 h-4 w-4" />
              {m.admin_events_new()}
            </Button>
            <Button onclick={() => (showNewEdition = data.events[0].id)}>
              <Plus class="mr-2 h-4 w-4" />
              {m.admin_events_create_edition()}
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
                  <StatusBadge status={edition.status} size="sm" />
                </a>
                <a href="/admin/app/{edition.slug}" title={m.admin_events_attendee_app()}>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Smartphone class="h-4 w-4" />
                  </Button>
                </a>
                <a href="/admin/editions/{edition.slug}/settings" title={m.admin_events_edition_settings()}>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <Settings class="h-4 w-4" />
                  </Button>
                </a>
                <a href="/admin/editions/{edition.slug}/team" title={m.admin_events_team_members()}>
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
            {#if edition.status === 'published'}
              <div class="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                <Smartphone class="h-4 w-4 text-muted-foreground" />
                <code class="flex-1 text-xs">/app/{edition.slug}</code>
                <a
                  href="/app/{edition.slug}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:text-primary/80"
                  title="Open attendee app"
                >
                  <ExternalLink class="h-4 w-4" />
                </a>
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      {/each}

      <!-- Add Edition Card -->
      {#if data.events.length > 0}
        <Card.Root class="border-dashed">
          <Card.Content class="flex h-full min-h-[200px] flex-col items-center justify-center py-6">
            <Plus class="mb-2 h-8 w-8 text-muted-foreground" />
            <p class="mb-4 text-sm text-muted-foreground">{m.admin_events_add_edition()}</p>
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
              <option value="" disabled>{m.admin_events_select_event()}</option>
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
