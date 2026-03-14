<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Globe, Loader2, Share2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Zurich',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland'
]
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

<!-- Social Links Card -->
<Card.Root>
  <Card.Header>
    <Card.Title class="flex items-center gap-2">
      <Share2 class="h-5 w-5" />
      {m.admin_event_social_title()}
    </Card.Title>
    <Card.Description>{m.admin_event_social_description()}</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      method="POST"
      action="?/updateSocial"
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
          <Label for="event-twitter">{m.admin_event_social_twitter()}</Label>
          <Input
            id="event-twitter"
            name="twitter"
            type="url"
            value={data.event.twitter}
            placeholder="https://twitter.com/myevent"
          />
        </div>
        <div class="space-y-2">
          <Label for="event-linkedin">{m.admin_event_social_linkedin()}</Label>
          <Input
            id="event-linkedin"
            name="linkedin"
            type="url"
            value={data.event.linkedin}
            placeholder="https://linkedin.com/company/myevent"
          />
        </div>
      </div>

      <div class="space-y-2">
        <Label for="event-hashtag">{m.admin_event_social_hashtag()}</Label>
        <Input
          id="event-hashtag"
          name="hashtag"
          value={data.event.hashtag}
          placeholder="MyConf2024"
        />
        <p class="text-xs text-muted-foreground">{m.admin_event_social_hashtag_hint()}</p>
      </div>

      <div class="space-y-2">
        <Label for="event-timezone">
          <span class="flex items-center gap-1">
            <Globe class="h-4 w-4" />
            {m.admin_event_localization_timezone()}
          </span>
        </Label>
        <select
          id="event-timezone"
          name="timezone"
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">-- Select timezone --</option>
          {#each COMMON_TIMEZONES as tz}
            <option value={tz} selected={data.event.timezone === tz}>{tz}</option>
          {/each}
        </select>
      </div>

      <div class="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Saving...
          {:else}
            Save Social Links
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
