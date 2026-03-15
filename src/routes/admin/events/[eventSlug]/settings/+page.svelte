<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import { generateSlug } from '$lib/utils'
import { AlertTriangle, Loader2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let showDeleteConfirm = $state(false)
</script>

{#if form?.error}
  <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
    {form.error}
  </div>
{/if}

{#if form?.success}
  <div class="rounded-md border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
    {form.message}
  </div>
{/if}

<!-- Event Details Card -->
<Card.Root>
  <Card.Header>
    <Card.Title>{m.event_settings_title()}</Card.Title>
    <Card.Description>{m.event_settings_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="POST"
      action="?/updateEvent"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update()
          await invalidateAll()
        }
      }}
      class="space-y-4"
    >
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="event-name">{m.event_settings_name()}</Label>
          <Input
            id="event-name"
            name="name"
            value={data.event.name}
            required
            oninput={(e) => {
              const slugInput = document.getElementById('event-slug') as HTMLInputElement
              if (slugInput && !slugInput.dataset.modified) {
                slugInput.value = generateSlug((e.target as HTMLInputElement).value)
              }
            }}
          />
        </div>
        <div class="space-y-2">
          <Label for="event-slug">{m.event_settings_slug()}</Label>
          <Input
            id="event-slug"
            name="slug"
            value={data.event.slug}
            required
            pattern="[a-z0-9-]+"
            oninput={(e) => {
              (e.target as HTMLInputElement).dataset.modified = 'true'
            }}
          />
          <p class="text-xs text-muted-foreground">{m.event_settings_slug_url({ slug: data.event.slug })}</p>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="event-description">{m.event_settings_event_description()}</Label>
        <Textarea
          id="event-description"
          name="description"
          value={data.event.description}
          rows={3}
          placeholder={m.event_settings_description_placeholder()}
        />
      </div>

      <div class="space-y-2">
        <Label for="event-website">{m.event_settings_website()}</Label>
        <Input
          id="event-website"
          name="website"
          type="url"
          value={data.event.website}
          placeholder={m.event_settings_website_placeholder()}
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <div class="space-y-2">
          <Label for="default-venue">{m.event_settings_default_venue()}</Label>
          <Input
            id="default-venue"
            name="defaultVenue"
            value={data.event.defaultVenue}
            placeholder={m.event_settings_venue_placeholder()}
          />
        </div>
        <div class="space-y-2">
          <Label for="default-city">{m.event_settings_default_city()}</Label>
          <Input
            id="default-city"
            name="defaultCity"
            value={data.event.defaultCity}
            placeholder={m.event_settings_city_placeholder()}
          />
        </div>
        <div class="space-y-2">
          <Label for="default-country">{m.event_settings_default_country()}</Label>
          <Input
            id="default-country"
            name="defaultCountry"
            value={data.event.defaultCountry}
            placeholder={m.event_settings_country_placeholder()}
          />
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {m.event_settings_saving()}
          {:else}
            {m.event_settings_save()}
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>

<!-- Danger Zone -->
<Card.Root class="border-destructive">
  <Card.Header>
    <Card.Title class="flex items-center gap-2 text-destructive">
      <AlertTriangle class="h-5 w-5" />
      {m.event_settings_danger_zone()}
    </Card.Title>
    <Card.Description>{m.event_settings_danger_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="flex items-center justify-between">
      <div>
        <p class="font-medium">{m.event_settings_delete_event()}</p>
        <p class="text-sm text-muted-foreground">
          {#if data.editionsCount > 0}
            {m.event_settings_cannot_delete({ count: data.editionsCount.toString() })}
          {:else}
            {m.event_settings_delete_permanently()}
          {/if}
        </p>
      </div>
      {#if showDeleteConfirm}
        <form method="POST" action="?/deleteEvent" use:enhance class="flex gap-2">
          <Button type="submit" variant="destructive" size="sm">
            {m.event_settings_confirm_delete()}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onclick={() => (showDeleteConfirm = false)}
          >
            {m.action_cancel()}
          </Button>
        </form>
      {:else}
        <Button
          variant="destructive"
          size="sm"
          disabled={data.editionsCount > 0}
          onclick={() => (showDeleteConfirm = true)}
        >
          {m.event_settings_delete_btn()}
        </Button>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
