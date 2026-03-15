<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import { DoorOpen, Loader2, Pencil, Plus, Trash2, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showRoomForm = $state(false)
let isSubmitting = $state(false)
let editingRoom = $state<(typeof data.rooms)[0] | null>(null)
let selectedEquipment = $state<string[]>([])

const getEquipmentOptions = () => [
  { value: 'projector', label: m.planning_equipment_projector() },
  { value: 'screen', label: m.planning_equipment_screen() },
  { value: 'microphone', label: m.planning_equipment_microphone() },
  { value: 'whiteboard', label: m.planning_equipment_whiteboard() },
  { value: 'video_recording', label: m.planning_equipment_video_recording() },
  { value: 'live_streaming', label: m.planning_equipment_live_streaming() },
  { value: 'power_outlets', label: m.planning_equipment_power_outlets() },
  { value: 'wifi', label: m.planning_equipment_wifi() },
  { value: 'air_conditioning', label: m.planning_equipment_air_conditioning() },
  { value: 'wheelchair_accessible', label: m.planning_equipment_wheelchair_accessible() }
]

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (form.action === 'createRoom' || form.action === 'updateRoom') {
      showRoomForm = false
      editingRoom = null
      selectedEquipment = []
    }
  }
})

function startEditRoom(room: (typeof data.rooms)[0]) {
  editingRoom = room
  selectedEquipment = [...room.equipment]
  showRoomForm = true
}

function cancelRoomForm() {
  showRoomForm = false
  editingRoom = null
  selectedEquipment = []
}

function toggleEquipment(value: string) {
  if (selectedEquipment.includes(value)) {
    selectedEquipment = selectedEquipment.filter((e) => e !== value)
  } else {
    selectedEquipment = [...selectedEquipment, value]
  }
}
</script>

<div class="space-y-4">
  <div class="flex justify-end">
    {#if !showRoomForm}
      <Button onclick={() => { showRoomForm = true; editingRoom = null; selectedEquipment = [] }}>
        <Plus class="mr-2 h-4 w-4" />
        {m.planning_rooms_add()}
      </Button>
    {/if}
  </div>

  <!-- Room Form -->
  {#if showRoomForm}
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <Card.Title>{editingRoom ? m.planning_rooms_edit() : m.planning_rooms_add()}</Card.Title>
          <Button variant="ghost" size="icon" onclick={cancelRoomForm} title={m.action_close()}>
            <X class="h-4 w-4" />
          </Button>
        </div>
      </Card.Header>
      <Card.Content>
        {#if form?.error && (form?.action === 'createRoom' || form?.action === 'updateRoom')}
          <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.error}
          </div>
        {/if}
        <form
          method="POST"
          action={editingRoom ? '?/updateRoom' : '?/createRoom'}
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
          {#if editingRoom}
            <input type="hidden" name="id" value={editingRoom.id} />
          {/if}

          <div class="grid gap-4 md:grid-cols-3">
            <div class="space-y-2">
              <Label for="room-name">{m.planning_rooms_name()} *</Label>
              <Input
                id="room-name"
                name="name"
                placeholder={m.planning_rooms_name_placeholder()}
                required
                value={editingRoom?.name || ''}
              />
            </div>
            <div class="space-y-2">
              <Label for="room-capacity">{m.planning_rooms_capacity()}</Label>
              <Input
                id="room-capacity"
                name="capacity"
                type="number"
                min="1"
                placeholder={m.planning_rooms_capacity_placeholder()}
                value={editingRoom?.capacity?.toString() || ''}
              />
            </div>
            <div class="space-y-2">
              <Label for="room-floor">{m.planning_rooms_floor()}</Label>
              <Input
                id="room-floor"
                name="floor"
                placeholder={m.planning_rooms_floor_placeholder()}
                value={editingRoom?.floor || ''}
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label>{m.planning_rooms_equipment()}</Label>
            <div class="grid grid-cols-2 gap-2 md:grid-cols-5">
              {#each getEquipmentOptions() as option}
                <label class="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="equipment"
                    value={option.value}
                    checked={selectedEquipment.includes(option.value)}
                    onchange={() => toggleEquipment(option.value)}
                    class="h-4 w-4 rounded border-gray-300"
                  />
                  {option.label}
                </label>
              {/each}
            </div>
          </div>

          <div class="space-y-2">
            <Label for="room-notes">{m.planning_rooms_equipment_notes()}</Label>
            <Textarea
              id="room-notes"
              name="equipmentNotes"
              placeholder={m.planning_rooms_equipment_notes_placeholder()}
              value={editingRoom?.equipmentNotes || ''}
            />
          </div>

          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" onclick={cancelRoomForm}>
              {m.action_cancel()}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {#if isSubmitting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {/if}
              {editingRoom ? m.planning_rooms_update() : m.planning_rooms_create()}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  {#if data.rooms.length === 0 && !showRoomForm}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <DoorOpen class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.planning_rooms_no_rooms()}</h3>
        <p class="text-sm text-muted-foreground">{m.planning_rooms_no_rooms_hint()}</p>
      </Card.Content>
    </Card.Root>
  {:else if data.rooms.length > 0}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.rooms as room}
        <Card.Root>
          <Card.Header>
            <div class="flex items-start justify-between">
              <div>
                <Card.Title>{room.name}</Card.Title>
                {#if room.floor}
                  <Card.Description>{m.planning_rooms_floor_label()} {room.floor}</Card.Description>
                {/if}
              </div>
              <div class="flex gap-1">
                <Button variant="ghost" size="icon" onclick={() => startEditRoom(room)} title={m.action_edit()}>
                  <Pencil class="h-4 w-4" />
                </Button>
                <form method="POST" action="?/deleteRoom" use:enhance={() => {
                  if (!confirm('Are you sure you want to delete this room?')) {
                    return ({ cancel }) => cancel()
                  }
                }}>
                  <input type="hidden" name="id" value={room.id} />
                  <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive" title={m.action_delete()}>
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </Card.Header>
          <Card.Content>
            {#if room.capacity}
              <p class="text-sm text-muted-foreground">{m.planning_rooms_capacity()}: {room.capacity}</p>
            {/if}
            {#if room.equipment.length > 0}
              <div class="mt-2 flex flex-wrap gap-1">
                {#each room.equipment as eq}
                  <span class="rounded bg-muted px-2 py-0.5 text-xs">
                    {getEquipmentOptions().find((o) => o.value === eq)?.label || eq}
                  </span>
                {/each}
              </div>
            {/if}
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

{#if form?.error && form?.action === 'deleteRoom'}
  <div class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
    {form.error}
  </div>
{/if}
