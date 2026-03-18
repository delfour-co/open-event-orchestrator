<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { Layers, Loader2, Pencil, Plus, Trash2, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showTrackForm = $state(false)
let isSubmitting = $state(false)
let editingTrack = $state<(typeof data.tracks)[0] | null>(null)

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (form.action === 'createTrack' || form.action === 'updateTrack') {
      showTrackForm = false
      editingTrack = null
    }
  }
})

function startEditTrack(track: (typeof data.tracks)[0]) {
  editingTrack = track
  showTrackForm = true
}

function cancelTrackForm() {
  showTrackForm = false
  editingTrack = null
}
</script>

<div class="space-y-4">
  <div class="flex justify-end">
    {#if !showTrackForm}
      <Button onclick={() => { showTrackForm = true; editingTrack = null }}>
        <Plus class="mr-2 h-4 w-4" />
        {m.planning_tracks_add()}
      </Button>
    {/if}
  </div>

  <!-- Track Form -->
  {#if showTrackForm}
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <Card.Title>{editingTrack ? m.planning_tracks_edit() : m.planning_tracks_add()}</Card.Title>
          <Button variant="ghost" size="icon" onclick={cancelTrackForm} title={m.action_close()}>
            <X class="h-4 w-4" />
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        {#if form?.error && (form?.action === 'createTrack' || form?.action === 'updateTrack')}
          <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.error}
          </div>
        {/if}
        <form
          method="POST"
          action={editingTrack ? '?/updateTrack' : '?/createTrack'}
          use:enhance={() => {
            isSubmitting = true
            return async ({ update }) => {
              isSubmitting = false
              await update()
            }
          }}
          class="space-y-4"
        >
          <input type="hidden" name="editionId" value={data.edition.id} />
          {#if editingTrack}
            <input type="hidden" name="id" value={editingTrack.id} />
          {/if}

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="track-name">{m.planning_tracks_name()} *</Label>
              <Input
                id="track-name"
                name="name"
                placeholder={m.planning_tracks_name_placeholder()}
                required
                value={editingTrack?.name || ''}
              />
            </div>
            <div class="space-y-2">
              <Label for="track-color">{m.planning_tracks_color()}</Label>
              <div class="flex gap-2">
                <Input
                  id="track-color"
                  name="color"
                  type="color"
                  value={editingTrack?.color || '#6b7280'}
                  class="h-10 w-16 p-1"
                />
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" onclick={cancelTrackForm}>
              {m.action_cancel()}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {#if isSubmitting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {/if}
              {editingTrack ? m.planning_tracks_update() : m.planning_tracks_create()}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  {#if data.tracks.length === 0 && !showTrackForm}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Layers class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.planning_tracks_no_tracks()}</h3>
        <p class="text-sm text-muted-foreground">
          {m.planning_tracks_no_tracks_hint()}
        </p>
      </Card.Content>
    </Card.Root>
  {:else if data.tracks.length > 0}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.tracks as track}
        <Card.Root>
          <Card.Header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="h-4 w-4 rounded-full" style="background-color: {track.color}"></div>
                <Card.Title>{track.name}</Card.Title>
              </div>
              <div class="flex gap-1">
                <Button variant="ghost" size="icon" onclick={() => startEditTrack(track)} title={m.action_edit()}>
                  <Pencil class="h-4 w-4" />
                </Button>
                <form method="POST" action="?/deleteTrack" use:enhance={({ cancel }) => {
                  if (!confirm('Are you sure you want to delete this track?')) {
                    cancel()
                    return
                  }
                }}>
                  <input type="hidden" name="id" value={track.id} />
                  <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive" title={m.action_delete()}>
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </Card.Header>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

{#if form?.error && form?.action === 'deleteTrack'}
  <div class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
    {form.error}
  </div>
{/if}
