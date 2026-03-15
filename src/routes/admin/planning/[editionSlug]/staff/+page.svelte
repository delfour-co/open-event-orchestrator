<script lang="ts">
import { enhance } from '$app/forms'
import { formatDate as sharedFormatDate } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import { DoorOpen, Loader2, Pencil, Plus, Trash2, Users, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showAssignmentForm = $state(false)
let isSubmitting = $state(false)
let editingAssignment = $state<(typeof data.roomAssignments)[0] | null>(null)
let assignmentRoomId = $state<string>('')
let assignmentMemberId = $state<string>('')
let assignmentDate = $state<string>('')
let assignmentStartTime = $state<string>('')
let assignmentEndTime = $state<string>('')
let assignmentNotes = $state<string>('')

const formatDate = (date: Date) =>
  sharedFormatDate(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (
      form.action === 'createRoomAssignment' ||
      form.action === 'updateRoomAssignment' ||
      form.action === 'deleteRoomAssignment'
    ) {
      cancelAssignmentForm()
    }
  }
})

function startEditAssignment(assignment: (typeof data.roomAssignments)[0]) {
  editingAssignment = assignment
  assignmentRoomId = assignment.roomId
  assignmentMemberId = assignment.memberId
  assignmentDate = assignment.date ? assignment.date.toISOString().split('T')[0] : ''
  assignmentStartTime = assignment.startTime || ''
  assignmentEndTime = assignment.endTime || ''
  assignmentNotes = assignment.notes || ''
  showAssignmentForm = true
}

function cancelAssignmentForm() {
  showAssignmentForm = false
  editingAssignment = null
  assignmentRoomId = ''
  assignmentMemberId = ''
  assignmentDate = ''
  assignmentStartTime = ''
  assignmentEndTime = ''
  assignmentNotes = ''
}

function openAssignmentFormForRoom(roomId: string) {
  cancelAssignmentForm()
  assignmentRoomId = roomId
  showAssignmentForm = true
}

function getAssignmentsForRoom(roomId: string) {
  return data.roomAssignments.filter((a) => a.roomId === roomId)
}

const roomsWithoutAssignments = $derived(() => {
  const roomsWithAssignments = new Set(data.roomAssignments.map((a) => a.roomId))
  return data.rooms.filter((r) => !roomsWithAssignments.has(r.id))
})
</script>

<div class="space-y-4">
  <div class="flex justify-end">
    {#if !showAssignmentForm}
      <Button onclick={() => (showAssignmentForm = true)}>
        <Plus class="mr-2 h-4 w-4" />
        {m.planning_staff_add()}
      </Button>
    {/if}
  </div>

  <!-- Assignment Form -->
  {#if showAssignmentForm}
    <Card.Root>
      <Card.Header>
        <div class="flex items-center justify-between">
          <Card.Title>{editingAssignment ? m.planning_staff_edit() : m.planning_staff_add_assignment()}</Card.Title>
          <Button variant="ghost" size="icon" onclick={cancelAssignmentForm} title={m.action_close()}>
            <X class="h-4 w-4" />
          </Button>
        </div>
        <Card.Description>
          {m.planning_staff_description()}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if form?.error && (form?.action === 'createRoomAssignment' || form?.action === 'updateRoomAssignment')}
          <div class="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {form.error}
          </div>
        {/if}
        <form
          method="POST"
          action={editingAssignment ? '?/updateRoomAssignment' : '?/createRoomAssignment'}
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
          {#if editingAssignment}
            <input type="hidden" name="id" value={editingAssignment.id} />
          {/if}

          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="assignment-room">{m.planning_staff_room()} *</Label>
              <select
                id="assignment-room"
                name="roomId"
                required
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                bind:value={assignmentRoomId}
              >
                <option value="">{m.planning_staff_room_placeholder()}</option>
                {#each data.rooms as room}
                  <option value={room.id}>{room.name}</option>
                {/each}
              </select>
            </div>

            <div class="space-y-2">
              <Label for="assignment-member">{m.planning_staff_member()} *</Label>
              <select
                id="assignment-member"
                name="memberId"
                required
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                bind:value={assignmentMemberId}
              >
                <option value="">{m.planning_staff_member_placeholder()}</option>
                {#each data.organizationMembers as member}
                  <option value={member.id}>{member.userName} ({member.role})</option>
                {/each}
              </select>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="space-y-2">
              <Label for="assignment-date">{m.planning_staff_date()}</Label>
              <Input
                id="assignment-date"
                name="date"
                type="date"
                bind:value={assignmentDate}
              />
              <p class="text-xs text-muted-foreground">{m.planning_staff_date_hint()}</p>
            </div>
            <div class="space-y-2">
              <Label for="assignment-start">{m.planning_staff_start_time()}</Label>
              <Input
                id="assignment-start"
                name="startTime"
                type="time"
                bind:value={assignmentStartTime}
              />
            </div>
            <div class="space-y-2">
              <Label for="assignment-end">{m.planning_staff_end_time()}</Label>
              <Input
                id="assignment-end"
                name="endTime"
                type="time"
                bind:value={assignmentEndTime}
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="assignment-notes">{m.planning_staff_notes()}</Label>
            <Textarea
              id="assignment-notes"
              name="notes"
              placeholder={m.planning_staff_notes_placeholder()}
              bind:value={assignmentNotes}
            />
          </div>

          <div class="flex justify-end gap-2">
            <Button type="button" variant="outline" onclick={cancelAssignmentForm}>
              {m.action_cancel()}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {#if isSubmitting}
                <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              {/if}
              {editingAssignment ? m.planning_staff_update() : m.planning_staff_create()}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>
  {/if}

  {#if data.organizationMembers.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Users class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.planning_staff_no_members()}</h3>
        <p class="text-sm text-muted-foreground">
          {m.planning_staff_no_members_hint()}
        </p>
      </Card.Content>
    </Card.Root>
  {:else if data.rooms.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <DoorOpen class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.planning_staff_add_rooms_first()}</h3>
        <p class="text-sm text-muted-foreground">
          {m.planning_staff_add_rooms_first_hint()}
        </p>
      </Card.Content>
    </Card.Root>
  {:else if data.roomAssignments.length === 0 && !showAssignmentForm}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Users class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.planning_staff_no_assignments()}</h3>
        <p class="text-sm text-muted-foreground">
          {m.planning_staff_no_assignments_hint()}
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Group assignments by room -->
    <div class="space-y-4">
      {#each data.rooms as room}
        {@const assignments = getAssignmentsForRoom(room.id)}
        {#if assignments.length > 0}
          <Card.Root>
            <Card.Header class="pb-3">
              <div class="flex items-center justify-between">
                <Card.Title class="text-lg">{room.name}</Card.Title>
                <Button variant="outline" size="sm" onclick={() => openAssignmentFormForRoom(room.id)}>
                  <Plus class="mr-1 h-3 w-3" />
                  {m.action_add()}
                </Button>
              </div>
              {#if room.floor}
                <Card.Description>{room.floor}</Card.Description>
              {/if}
            </Card.Header>
            <Card.Content class="pt-0">
              <div class="space-y-2">
                {#each assignments as assignment}
                  <div class="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <div class="font-medium">{assignment.memberName}</div>
                      <div class="text-sm text-muted-foreground">
                        {#if assignment.date}
                          {formatDate(assignment.date)}
                          {#if assignment.startTime && assignment.endTime}
                            • {assignment.startTime} - {assignment.endTime}
                          {/if}
                        {:else}
                          {m.planning_staff_all_days()}
                        {/if}
                      </div>
                      {#if assignment.notes}
                        <div class="mt-1 text-sm text-muted-foreground italic">
                          {assignment.notes}
                        </div>
                      {/if}
                    </div>
                    <div class="flex gap-1">
                      <Button variant="ghost" size="icon" onclick={() => startEditAssignment(assignment)} title={m.action_edit()}>
                        <Pencil class="h-4 w-4" />
                      </Button>
                      <form method="POST" action="?/deleteRoomAssignment" use:enhance={() => {
                        if (!confirm('Are you sure you want to delete this assignment?')) {
                          return ({ cancel }) => cancel()
                        }
                      }}>
                        <input type="hidden" name="id" value={assignment.id} />
                        <Button type="submit" variant="ghost" size="icon" class="text-destructive hover:text-destructive" title={m.action_delete()}>
                          <Trash2 class="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </div>
                {/each}
              </div>
            </Card.Content>
          </Card.Root>
        {/if}
      {/each}

      <!-- Rooms without assignments -->
      {#if roomsWithoutAssignments().length > 0}
        <Card.Root>
          <Card.Header>
            <Card.Title class="text-lg">{m.planning_staff_unassigned_rooms()}</Card.Title>
            <Card.Description>{m.planning_staff_unassigned_rooms_hint()}</Card.Description>
          </Card.Header>
          <Card.Content>
            <div class="flex flex-wrap gap-2">
              {#each roomsWithoutAssignments() as room}
                <Button variant="outline" size="sm" onclick={() => openAssignmentFormForRoom(room.id)}>
                  <Plus class="mr-1 h-3 w-3" />
                  {room.name}
                </Button>
              {/each}
            </div>
          </Card.Content>
        </Card.Root>
      {/if}
    </div>
  {/if}
</div>

{#if form?.error && form?.action === 'deleteRoomAssignment'}
  <div class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg">
    {form.error}
  </div>
{/if}
