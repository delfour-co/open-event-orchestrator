<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { Clock, Pencil, Plus, Trash2, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showCreateForm = $state(false)
let editingId = $state<string | null>(null)
let deleteConfirmId = $state<string | null>(null)

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}min`
}

$effect(() => {
  if (form?.success) {
    showCreateForm = false
    editingId = null
  }
})
</script>

<svelte:head>
  <title>Formats - CFP Settings - Open Event Orchestrator</title>
</svelte:head>

<Card.Root>
  <Card.Header class="flex flex-row items-center justify-between">
    <div>
      <Card.Title>Formats</Card.Title>
      <Card.Description>Manage talk formats and durations for {data.edition.name}</Card.Description>
    </div>
    <Button size="sm" onclick={() => (showCreateForm = !showCreateForm)}>
      {#if showCreateForm}
        <X class="mr-2 h-4 w-4" />
        Cancel
      {:else}
        <Plus class="mr-2 h-4 w-4" />
        Add Format
      {/if}
    </Button>
  </Card.Header>
  <Card.Content>
    {#if form?.error}
      <div class="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
        <p class="text-sm text-destructive">{form.error}</p>
      </div>
    {/if}

    {#if form?.success}
      <div class="mb-6 rounded-lg border border-green-500 bg-green-500/10 p-4">
        <p class="text-sm text-green-700 dark:text-green-400">{form.message}</p>
      </div>
    {/if}

    <!-- Create Form -->
    {#if showCreateForm}
      <form
        method="POST"
        action="?/create"
        use:enhance
        class="mb-6 space-y-4 rounded-lg border bg-muted/50 p-4"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="new-name">Name</Label>
            <Input id="new-name" name="name" required minlength={2} placeholder="e.g., Lightning Talk" />
          </div>
          <div class="space-y-2">
            <Label for="new-duration">Duration (minutes)</Label>
            <Input
              id="new-duration"
              name="durationMinutes"
              type="number"
              min={5}
              max={480}
              required
              placeholder="e.g., 45"
            />
          </div>
        </div>
        <div class="space-y-2">
          <Label for="new-description">Description (optional)</Label>
          <Textarea
            id="new-description"
            name="description"
            rows={2}
            placeholder="Brief description of this format..."
          />
        </div>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" onclick={() => (showCreateForm = false)}>
            Cancel
          </Button>
          <Button type="submit">Create Format</Button>
        </div>
      </form>
    {/if}

    <!-- Formats List -->
    {#if data.formats.length === 0}
      <div class="py-12 text-center">
        <p class="text-muted-foreground">No formats yet. Create one to get started.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each data.formats as format}
          <div class="rounded-lg border p-4">
            {#if editingId === format.id}
              <!-- Edit Form -->
              <form method="POST" action="?/update" use:enhance class="space-y-4">
                <input type="hidden" name="id" value={format.id} />
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="edit-name-{format.id}">Name</Label>
                    <Input
                      id="edit-name-{format.id}"
                      name="name"
                      value={format.name}
                      required
                      minlength={2}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="edit-duration-{format.id}">Duration (minutes)</Label>
                    <Input
                      id="edit-duration-{format.id}"
                      name="durationMinutes"
                      type="number"
                      min={5}
                      max={480}
                      value={String(format.duration)}
                      required
                    />
                  </div>
                </div>
                <div class="space-y-2">
                  <Label for="edit-description-{format.id}">Description</Label>
                  <Textarea
                    id="edit-description-{format.id}"
                    name="description"
                    rows={2}
                    value={format.description || ''}
                  />
                </div>
                <div class="flex justify-end gap-2">
                  <Button type="button" variant="outline" onclick={() => (editingId = null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            {:else if deleteConfirmId === format.id}
              <!-- Delete Confirmation -->
              <div class="flex items-center justify-between">
                <p class="text-sm">Are you sure you want to delete "{format.name}"?</p>
                <div class="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => (deleteConfirmId = null)}
                  >
                    Cancel
                  </Button>
                  <form method="POST" action="?/delete" use:enhance>
                    <input type="hidden" name="id" value={format.id} />
                    <Button type="submit" variant="destructive" size="sm">Delete</Button>
                  </form>
                </div>
              </div>
            {:else}
              <!-- Display -->
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <div class="flex items-center gap-3">
                    <span class="font-medium">{format.name}</span>
                    <span class="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock class="h-4 w-4" />
                      {formatDuration(format.duration)}
                    </span>
                  </div>
                  {#if format.description}
                    <p class="text-sm text-muted-foreground">{format.description}</p>
                  {/if}
                </div>
                <div class="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => (editingId = format.id)}
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-destructive"
                    onclick={() => (deleteConfirmId = format.id)}
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </Card.Content>
</Card.Root>
