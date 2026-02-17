<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { eventTypes, getEventTypeLabel } from '$lib/features/budget/domain'
import { ArrowLeft, FileText, Globe, Loader2, Plus, Trash2, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showCreateDialog = $state(false)
let isSubmitting = $state(false)

let templateName = $state('')
let templateDescription = $state('')
let templateEventType = $state<string>('conference')
let templateIsGlobal = $state(false)
let templateItems = $state<
  Array<{ name: string; category: string; estimatedAmount: number; priority: string }>
>([])

function addTemplateItem() {
  templateItems = [
    ...templateItems,
    { name: '', category: '', estimatedAmount: 0, priority: 'medium' }
  ]
}

function removeTemplateItem(index: number) {
  templateItems = templateItems.filter((_, i) => i !== index)
}

function resetForm() {
  templateName = ''
  templateDescription = ''
  templateEventType = 'conference'
  templateIsGlobal = false
  templateItems = []
}

function cancelDialog() {
  showCreateDialog = false
  resetForm()
}

$effect(() => {
  if (form?.success) {
    cancelDialog()
  }
})
</script>

<svelte:head>
  <title>Budget Templates - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/budget">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Budget Templates</h2>
        <p class="text-muted-foreground">Manage reusable budget templates</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      {#if data.templates.length === 0}
        <form method="POST" action="?/seedDefaults" use:enhance>
          <Button type="submit" variant="outline">
            <FileText class="mr-2 h-4 w-4" />
            Seed Defaults
          </Button>
        </form>
      {/if}
      <Button onclick={() => showCreateDialog = true}>
        <Plus class="mr-2 h-4 w-4" />
        Create Template
      </Button>
    </div>
  </div>

  {#if form?.message}
    <div class="rounded-md border border-green-500 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
      {form.message}
    </div>
  {/if}

  {#if form?.error}
    <div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
      {form.error}
    </div>
  {/if}

  <!-- Templates Grid -->
  {#if data.templates.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <FileText class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No templates yet</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          Create templates to quickly set up budget checklists for new editions.
        </p>
        <div class="flex gap-2">
          <form method="POST" action="?/seedDefaults" use:enhance>
            <Button type="submit" variant="outline">
              Seed Default Templates
            </Button>
          </form>
          <Button onclick={() => showCreateDialog = true}>
            <Plus class="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.templates as template}
        <Card.Root>
          <Card.Header>
            <div class="flex items-start justify-between">
              <div>
                <Card.Title class="flex items-center gap-2">
                  {template.name}
                  {#if template.isGlobal}
                    <Globe class="h-4 w-4 text-muted-foreground" />
                  {/if}
                </Card.Title>
                <Card.Description>{template.eventTypeLabel}</Card.Description>
              </div>
              <form method="POST" action="?/deleteTemplate" use:enhance>
                <input type="hidden" name="id" value={template.id} />
                <Button type="submit" variant="ghost" size="icon" class="h-8 w-8 text-destructive">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card.Header>
          <Card.Content>
            {#if template.description}
              <p class="mb-3 text-sm text-muted-foreground">{template.description}</p>
            {/if}
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{template.itemCount} items</span>
              <span class="text-muted-foreground">Used {template.usageCount} times</span>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}

  <!-- Default Templates Reference -->
  {#if data.defaultTemplates.length > 0 && data.templates.length > 0}
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">Default Template Reference</h3>
      <p class="text-sm text-muted-foreground">
        These are the built-in templates. Use "Seed Defaults" to create them in your database.
      </p>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {#each data.defaultTemplates as template}
          <Card.Root class="opacity-60">
            <Card.Header class="pb-2">
              <Card.Title class="text-base">{template.name}</Card.Title>
              <Card.Description class="text-xs">{template.eventTypeLabel}</Card.Description>
            </Card.Header>
            <Card.Content>
              <p class="text-xs text-muted-foreground">{template.itemCount} items</p>
            </Card.Content>
          </Card.Root>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Create Template Dialog -->
{#if showCreateDialog}
  <Dialog.Content class="max-w-2xl max-h-[80vh] overflow-y-auto" onClose={cancelDialog}>
      <Dialog.Header>
        <Dialog.Title>Create Budget Template</Dialog.Title>
        <Dialog.Description>
          Create a reusable template for budget checklists.
        </Dialog.Description>
      </Dialog.Header>

      <form
        method="POST"
        action="?/createTemplate"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
          }
        }}
        class="space-y-4"
      >
        <input type="hidden" name="items" value={JSON.stringify(templateItems)} />

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="template-name">Name *</Label>
            <Input
              id="template-name"
              name="name"
              placeholder="e.g., Large Conference"
              required
              bind:value={templateName}
            />
          </div>
          <div class="space-y-2">
            <Label for="template-type">Event Type *</Label>
            <select
              id="template-type"
              name="eventType"
              required
              bind:value={templateEventType}
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {#each eventTypes as eventType}
                <option value={eventType}>{getEventTypeLabel(eventType)}</option>
              {/each}
            </select>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="template-description">Description</Label>
          <Textarea
            id="template-description"
            name="description"
            placeholder="Optional description..."
            bind:value={templateDescription}
          />
        </div>

        <div class="flex items-center gap-2">
          <input
            id="is-global"
            name="isGlobal"
            type="checkbox"
            bind:checked={templateIsGlobal}
            value="true"
            class="h-4 w-4 rounded border-gray-300"
          />
          <Label for="is-global" class="text-sm">Available globally (not tied to organization)</Label>
        </div>

        <!-- Template Items -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label>Template Items</Label>
            <Button type="button" variant="outline" size="sm" onclick={addTemplateItem}>
              <Plus class="mr-1 h-3 w-3" />
              Add Item
            </Button>
          </div>

          {#each templateItems as item, index}
            <div class="flex items-center gap-2 rounded-lg border p-2">
              <Input
                placeholder="Item name"
                bind:value={item.name}
                class="flex-1"
              />
              <Input
                placeholder="Category"
                bind:value={item.category}
                class="w-24"
              />
              <Input
                type="number"
                min="0"
                placeholder="Amount"
                value={item.estimatedAmount.toString()}
                oninput={(e) => { item.estimatedAmount = parseInt((e.target as HTMLInputElement).value, 10) || 0 }}
                class="w-28"
              />
              <select
                bind:value={item.priority}
                class="h-10 w-24 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <Button type="button" variant="ghost" size="icon" onclick={() => removeTemplateItem(index)}>
                <X class="h-4 w-4" />
              </Button>
            </div>
          {/each}

          {#if templateItems.length === 0}
            <p class="text-sm text-muted-foreground">No items added yet. Click "Add Item" to start.</p>
          {/if}
        </div>

        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={cancelDialog}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            Create Template
          </Button>
        </Dialog.Footer>
      </form>
  </Dialog.Content>
{/if}
