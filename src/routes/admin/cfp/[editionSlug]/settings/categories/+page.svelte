<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { Pencil, Plus, Trash2, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showCreateForm = $state(false)
let editingId = $state<string | null>(null)
let deleteConfirmId = $state<string | null>(null)

const colorOptions = [
  { value: '', label: 'Default' },
  { value: 'red', label: 'Red' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'green', label: 'Green' },
  { value: 'blue', label: 'Blue' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' }
]

function getColorClass(color: string | undefined): string {
  const classes: Record<string, string> = {
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
  }
  return classes[color || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
}

$effect(() => {
  if (form?.success) {
    showCreateForm = false
    editingId = null
  }
})
</script>

<svelte:head>
  <title>Categories - CFP Settings - Open Event Orchestrator</title>
</svelte:head>

<Card.Root>
  <Card.Header class="flex flex-row items-center justify-between">
    <div>
      <Card.Title>Categories</Card.Title>
      <Card.Description>Manage talk categories for {data.edition.name}</Card.Description>
    </div>
    <Button size="sm" onclick={() => (showCreateForm = !showCreateForm)}>
      {#if showCreateForm}
        <X class="mr-2 h-4 w-4" />
        Cancel
      {:else}
        <Plus class="mr-2 h-4 w-4" />
        Add Category
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
            <Input id="new-name" name="name" required minlength={2} placeholder="e.g., Web Development" />
          </div>
          <div class="space-y-2">
            <Label for="new-color">Color</Label>
            <select
              id="new-color"
              name="color"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {#each colorOptions as option}
                <option value={option.value}>{option.label}</option>
              {/each}
            </select>
          </div>
        </div>
        <div class="space-y-2">
          <Label for="new-description">Description (optional)</Label>
          <Textarea
            id="new-description"
            name="description"
            rows={2}
            placeholder="Brief description of this category..."
          />
        </div>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" onclick={() => (showCreateForm = false)}>
            Cancel
          </Button>
          <Button type="submit">Create Category</Button>
        </div>
      </form>
    {/if}

    <!-- Categories List -->
    {#if data.categories.length === 0}
      <div class="py-12 text-center">
        <p class="text-muted-foreground">No categories yet. Create one to get started.</p>
      </div>
    {:else}
      <div class="space-y-3">
        {#each data.categories as category}
          <div class="rounded-lg border p-4">
            {#if editingId === category.id}
              <!-- Edit Form -->
              <form method="POST" action="?/update" use:enhance class="space-y-4">
                <input type="hidden" name="id" value={category.id} />
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="space-y-2">
                    <Label for="edit-name-{category.id}">Name</Label>
                    <Input
                      id="edit-name-{category.id}"
                      name="name"
                      value={category.name}
                      required
                      minlength={2}
                    />
                  </div>
                  <div class="space-y-2">
                    <Label for="edit-color-{category.id}">Color</Label>
                    <select
                      id="edit-color-{category.id}"
                      name="color"
                      value={category.color || ''}
                      class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {#each colorOptions as option}
                        <option value={option.value}>{option.label}</option>
                      {/each}
                    </select>
                  </div>
                </div>
                <div class="space-y-2">
                  <Label for="edit-description-{category.id}">Description</Label>
                  <Textarea
                    id="edit-description-{category.id}"
                    name="description"
                    rows={2}
                    value={category.description || ''}
                  />
                </div>
                <div class="flex justify-end gap-2">
                  <Button type="button" variant="outline" onclick={() => (editingId = null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            {:else if deleteConfirmId === category.id}
              <!-- Delete Confirmation -->
              <div class="flex items-center justify-between">
                <p class="text-sm">Are you sure you want to delete "{category.name}"?</p>
                <div class="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onclick={() => (deleteConfirmId = null)}
                  >
                    Cancel
                  </Button>
                  <form method="POST" action="?/delete" use:enhance>
                    <input type="hidden" name="id" value={category.id} />
                    <Button type="submit" variant="destructive" size="sm">Delete</Button>
                  </form>
                </div>
              </div>
            {:else}
              <!-- Display -->
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class={`rounded px-2 py-1 text-sm font-medium ${getColorClass(category.color)}`}>
                      {category.name}
                    </span>
                  </div>
                  {#if category.description}
                    <p class="text-sm text-muted-foreground">{category.description}</p>
                  {/if}
                </div>
                <div class="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onclick={() => (editingId = category.id)}
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="text-destructive"
                    onclick={() => (deleteConfirmId = category.id)}
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
