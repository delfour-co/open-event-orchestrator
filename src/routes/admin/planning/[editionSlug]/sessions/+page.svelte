<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import { Calendar, Check, Mic, Pencil, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

// Session type options
const getSessionTypeOptions = () => [
  { value: 'talk', label: m.planning_session_type_talk() },
  { value: 'workshop', label: m.planning_session_type_workshop() },
  { value: 'keynote', label: m.planning_session_type_keynote() },
  { value: 'panel', label: m.planning_session_type_panel() },
  { value: 'break', label: m.planning_session_type_break() },
  { value: 'lunch', label: m.planning_session_type_lunch() },
  { value: 'networking', label: m.planning_session_type_networking() },
  { value: 'registration', label: m.planning_session_type_registration() },
  { value: 'other', label: m.planning_session_type_other() }
]

const availableTalks = $derived(() => {
  const scheduledTalkIds = new Set(data.sessions.filter((s) => s.talkId).map((s) => s.talkId))
  return data.acceptedTalks.filter((t) => !scheduledTalkIds.has(t.id))
})

const formatDate = (date: Date) => {
  const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function getSessionTypeLabel(type: string): string {
  return getSessionTypeOptions().find((o) => o.value === type)?.label || type
}

function getSlotInfo(slotId: string) {
  const slot = data.slots.find((s) => s.id === slotId)
  if (!slot) return null
  const room = data.rooms.find((r) => r.id === slot.roomId)
  return {
    ...slot,
    roomName: room?.name || 'Unknown room'
  }
}
</script>

<div class="space-y-6">
  <!-- Available Talks Section -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Mic class="h-5 w-5" />
        {m.planning_sessions_available_talks()} ({availableTalks().length})
      </Card.Title>
      <Card.Description>
        {m.planning_sessions_available_talks_desc()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if availableTalks().length === 0}
        <div class="py-8 text-center text-muted-foreground">
          {#if data.acceptedTalks.length === 0}
            <p>{m.planning_sessions_no_accepted_talks()}</p>
          {:else}
            <div class="flex items-center justify-center gap-2">
              <Check class="h-5 w-5 text-green-500" />
              <p>{m.planning_sessions_all_scheduled()}</p>
            </div>
          {/if}
        </div>
      {:else}
        <div class="space-y-2">
          {#each availableTalks() as talk}
            <div class="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div class="font-medium">{talk.title}</div>
                {#if talk.speakers && talk.speakers.length > 0}
                  <div class="text-sm text-muted-foreground">
                    {talk.speakers.map((s) => `${s.firstName} ${s.lastName}`).join(', ')}
                  </div>
                {/if}
                {#if talk.duration}
                  <div class="text-xs text-muted-foreground">{talk.duration} {m.planning_sessions_minutes()}</div>
                {/if}
              </div>
              <span class="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                {talk.status}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>

  <!-- Scheduled Sessions Section -->
  <Card.Root>
    <Card.Header>
      <Card.Title class="flex items-center gap-2">
        <Calendar class="h-5 w-5" />
        {m.planning_sessions_scheduled()} ({data.sessions.length})
      </Card.Title>
      <Card.Description>
        {m.planning_sessions_scheduled_desc()}
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if data.sessions.length === 0}
        <div class="py-8 text-center text-muted-foreground">
          <p>{m.planning_sessions_no_scheduled()}</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each data.sessions as session}
            {@const slotInfo = getSlotInfo(session.slotId)}
            {@const track = session.trackId ? data.tracks.find((t) => t.id === session.trackId) : null}
            <div class="flex items-center justify-between rounded-lg border p-3">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div class="font-medium">{session.title}</div>
                  <span class="rounded bg-muted px-2 py-0.5 text-xs">
                    {getSessionTypeLabel(session.type)}
                  </span>
                </div>
                {#if slotInfo}
                  <div class="text-sm text-muted-foreground">
                    {slotInfo.roomName} - {formatDate(slotInfo.date)} - {slotInfo.startTime} {m.planning_sessions_to()} {slotInfo.endTime}
                  </div>
                {/if}
                {#if track}
                  <div class="mt-1 flex items-center gap-1">
                    <div class="h-3 w-3 rounded-full" style="background-color: {track.color}"></div>
                    <span class="text-xs text-muted-foreground">{track.name}</span>
                  </div>
                {/if}
              </div>
              <div class="flex gap-1">
                <a href="/admin/planning/{data.edition.slug}">
                  <Button variant="ghost" size="icon">
                    <Pencil class="h-4 w-4" />
                  </Button>
                </a>
                <form method="POST" action="?/deleteSession" use:enhance>
                  <input type="hidden" name="id" value={session.id} />
                  <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>

{#if form?.error}
  <div class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
    {form.error}
  </div>
{/if}
