<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Checkbox } from '$lib/components/ui/checkbox'
import * as Dialog from '$lib/components/ui/dialog'
import * as m from '$lib/paraglide/messages'
import { X } from 'lucide-svelte'

interface Track {
  id: string
  name: string
  color: string
}

interface Room {
  id: string
  name: string
}

interface Props {
  open: boolean
  tracks: Track[]
  rooms: Room[]
  sessionTypes: string[]
  selectedTrackIds: Set<string>
  selectedTypes: Set<string>
  selectedRoomIds: Set<string>
  onApply: (filters: {
    trackIds: Set<string>
    types: Set<string>
    roomIds: Set<string>
  }) => void
  onClose: () => void
}

const {
  open,
  tracks,
  rooms,
  sessionTypes,
  selectedTrackIds,
  selectedTypes,
  selectedRoomIds,
  onApply,
  onClose
}: Props = $props()

// Local draft state so user can toggle before applying
let draftTrackIds = $state<Set<string>>(new Set())
let draftTypes = $state<Set<string>>(new Set())
let draftRoomIds = $state<Set<string>>(new Set())

// Sync draft state when dialog opens
$effect(() => {
  if (open) {
    draftTrackIds = new Set(selectedTrackIds)
    draftTypes = new Set(selectedTypes)
    draftRoomIds = new Set(selectedRoomIds)
  }
})

const activeCount = $derived(draftTrackIds.size + draftTypes.size + draftRoomIds.size)

function toggleInSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  return next
}

function clearAll(): void {
  draftTrackIds = new Set()
  draftTypes = new Set()
  draftRoomIds = new Set()
}

function apply(): void {
  onApply({
    trackIds: new Set(draftTrackIds),
    types: new Set(draftTypes),
    roomIds: new Set(draftRoomIds)
  })
  onClose()
}
</script>

{#if open}
  <Dialog.Content class="max-w-md max-h-[85vh] overflow-hidden flex flex-col" onClose={onClose}>
    <Dialog.Header>
      <div class="flex items-center justify-between">
        <Dialog.Title>
          {m.app_filter_title()}
          {#if activeCount > 0}
            <span class="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          {/if}
        </Dialog.Title>
        {#if activeCount > 0}
          <Button variant="ghost" size="sm" class="h-7 text-xs text-muted-foreground" onclick={clearAll}>
            <X class="mr-1 h-3 w-3" />
            {m.app_filter_clear_all()}
          </Button>
        {/if}
      </div>
    </Dialog.Header>

    <div class="flex-1 overflow-y-auto space-y-6 py-4">
      <!-- Tracks -->
      {#if tracks.length > 0}
        <div>
          <h3 class="mb-3 text-sm font-semibold text-muted-foreground">{m.app_filter_tracks()}</h3>
          <div class="space-y-2">
            {#each tracks as track}
              <label class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                <Checkbox
                  checked={draftTrackIds.has(track.id)}
                  onCheckedChange={() => { draftTrackIds = toggleInSet(draftTrackIds, track.id) }}
                />
                <span
                  class="h-3 w-3 shrink-0 rounded-full"
                  style="background-color: {track.color}"
                ></span>
                <span class="text-sm">{track.name}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Session Types -->
      {#if sessionTypes.length > 0}
        <div>
          <h3 class="mb-3 text-sm font-semibold text-muted-foreground">{m.app_filter_types()}</h3>
          <div class="space-y-2">
            {#each sessionTypes as type}
              <label class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                <Checkbox
                  checked={draftTypes.has(type)}
                  onCheckedChange={() => { draftTypes = toggleInSet(draftTypes, type) }}
                />
                <span class="text-sm capitalize">{type}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Rooms -->
      {#if rooms.length > 0}
        <div>
          <h3 class="mb-3 text-sm font-semibold text-muted-foreground">{m.app_filter_rooms()}</h3>
          <div class="space-y-2">
            {#each rooms as room}
              <label class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50">
                <Checkbox
                  checked={draftRoomIds.has(room.id)}
                  onCheckedChange={() => { draftRoomIds = toggleInSet(draftRoomIds, room.id) }}
                />
                <span class="text-sm">{room.name}</span>
              </label>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button class="w-full" onclick={apply}>
        {m.app_filter_apply()}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
{/if}
