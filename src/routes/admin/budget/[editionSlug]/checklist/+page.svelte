<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getBudgetNavItems } from '$lib/config'
import { getChecklistStatusLabel, getPriorityLabel } from '$lib/features/budget/domain'
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showItemForm = $state(false)
let showTemplateDialog = $state(false)
let editingItem = $state<(typeof data.items)[0] | null>(null)
let isSubmitting = $state(false)
let selectedTemplateId = $state<string | null>(null)
let multiplier = $state('100')

const formatAmount = (amount: number, currency = 'EUR') => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount / 100)
}

const formatDateInput = (date: Date | undefined) => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

function startEditItem(item: (typeof data.items)[0]) {
  editingItem = item
  showItemForm = true
}

function cancelItemForm() {
  showItemForm = false
  editingItem = null
}

function cancelTemplateDialog() {
  showTemplateDialog = false
  selectedTemplateId = null
}

$effect(() => {
  if (form?.success) {
    cancelItemForm()
    cancelTemplateDialog()
  }
})

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ordered: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
}
</script>

<svelte:head>
  <title>Checklist - {data.edition.name} - Open Event Orchestrator</title>
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
        <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
        <p class="text-muted-foreground">Budget Checklist</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" onclick={() => (showTemplateDialog = true)}>
        <FileText class="mr-2 h-4 w-4" />
        Apply Template
      </Button>
      <Button onclick={() => { editingItem = null; showItemForm = true }}>
        <Plus class="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  </div>

  <!-- Sub-navigation -->
  <AdminSubNav basePath="/admin/budget/{data.edition.slug}" items={getBudgetNavItems(data.edition.slug)} />

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-6">
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold">{data.stats.total}</div>
        <p class="text-xs text-muted-foreground">Total Items</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold text-yellow-600">{data.stats.pending}</div>
        <p class="text-xs text-muted-foreground">Pending</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold text-blue-600">{data.stats.approved}</div>
        <p class="text-xs text-muted-foreground">Approved</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold text-purple-600">{data.stats.ordered}</div>
        <p class="text-xs text-muted-foreground">Ordered</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold text-green-600">{data.stats.paid}</div>
        <p class="text-xs text-muted-foreground">Paid</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold">{formatAmount(data.stats.totalEstimated, data.budget?.currency)}</div>
        <p class="text-xs text-muted-foreground">Total Estimated</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Checklist Items -->
  {#if data.items.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <ClipboardList class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No checklist items yet</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          Add items to track budget requirements for this edition.
        </p>
        <div class="flex gap-2">
          <Button variant="outline" onclick={() => (showTemplateDialog = true)}>
            <FileText class="mr-2 h-4 w-4" />
            Apply Template
          </Button>
          <Button onclick={() => { editingItem = null; showItemForm = true }}>
            <Plus class="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {:else}
    <Card.Root>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b text-left text-sm text-muted-foreground">
              <th class="w-8 px-4 py-3"></th>
              <th class="px-4 py-3 font-medium">Item</th>
              <th class="px-4 py-3 font-medium">Category</th>
              <th class="px-4 py-3 font-medium text-right">Estimated</th>
              <th class="px-4 py-3 font-medium">Priority</th>
              <th class="px-4 py-3 font-medium">Status</th>
              <th class="px-4 py-3 font-medium">Due Date</th>
              <th class="px-4 py-3 font-medium">Assignee</th>
              <th class="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each data.items as item}
              <tr class="border-b hover:bg-muted/50">
                <td class="px-4 py-3">
                  <GripVertical class="h-4 w-4 cursor-grab text-muted-foreground" />
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium">{item.name}</div>
                  {#if item.notes}
                    <div class="text-xs text-muted-foreground line-clamp-1">{item.notes}</div>
                  {/if}
                </td>
                <td class="px-4 py-3 text-sm">{item.categoryName || '-'}</td>
                <td class="px-4 py-3 text-right text-sm font-medium">
                  {formatAmount(item.estimatedAmount, data.budget?.currency)}
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium {priorityColors[item.priority]}">
                    {getPriorityLabel(item.priority)}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <span class="inline-flex rounded-full px-2 py-1 text-xs font-medium {statusColors[item.status]}">
                    {getChecklistStatusLabel(item.status)}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm">
                  {item.dueDate ? formatDateInput(item.dueDate) : '-'}
                </td>
                <td class="px-4 py-3 text-sm">{item.assignee || '-'}</td>
                <td class="px-4 py-3">
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => startEditItem(item)}>
                      <Pencil class="h-3 w-3" />
                    </Button>
                    <form method="POST" action="?/deleteItem" use:enhance>
                      <input type="hidden" name="id" value={item.id} />
                      <Button type="submit" variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 class="h-3 w-3" />
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </Card.Root>
  {/if}
</div>

<!-- Item Form Dialog -->
{#if showItemForm}
  <Dialog.Content class="max-w-lg" onClose={cancelItemForm}>
      <Dialog.Header>
        <Dialog.Title>{editingItem ? 'Edit Item' : 'Add Item'}</Dialog.Title>
        <Dialog.Description>
          {editingItem ? 'Update the checklist item details.' : 'Add a new budget checklist item.'}
        </Dialog.Description>
      </Dialog.Header>

      {#if form?.error}
        <div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {form.error}
        </div>
      {/if}

      <form
        method="POST"
        action={editingItem ? '?/updateItem' : '?/createItem'}
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
          }
        }}
        class="space-y-4"
      >
        {#if editingItem}
          <input type="hidden" name="id" value={editingItem.id} />
        {/if}

        <div class="space-y-2">
          <Label for="item-name">Name *</Label>
          <Input
            id="item-name"
            name="name"
            placeholder="e.g., Venue rental"
            required
            value={editingItem?.name || ''}
          />
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="item-category">Category</Label>
            <select
              id="item-category"
              name="categoryId"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">No category</option>
              {#each data.categories as cat}
                <option value={cat.id} selected={editingItem?.categoryId === cat.id}>
                  {cat.name}
                </option>
              {/each}
            </select>
          </div>
          <div class="space-y-2">
            <Label for="item-amount">Estimated Amount</Label>
            <Input
              id="item-amount"
              name="estimatedAmount"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={editingItem?.estimatedAmount?.toString() || '0'}
            />
            <p class="text-xs text-muted-foreground">Amount in cents</p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="item-priority">Priority</Label>
            <select
              id="item-priority"
              name="priority"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="low" selected={editingItem?.priority === 'low'}>Low</option>
              <option value="medium" selected={!editingItem || editingItem?.priority === 'medium'}>Medium</option>
              <option value="high" selected={editingItem?.priority === 'high'}>High</option>
            </select>
          </div>
          {#if editingItem}
            <div class="space-y-2">
              <Label for="item-status">Status</Label>
              <select
                id="item-status"
                name="status"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pending" selected={editingItem?.status === 'pending'}>Pending</option>
                <option value="approved" selected={editingItem?.status === 'approved'}>Approved</option>
                <option value="ordered" selected={editingItem?.status === 'ordered'}>Ordered</option>
                <option value="paid" selected={editingItem?.status === 'paid'}>Paid</option>
                <option value="cancelled" selected={editingItem?.status === 'cancelled'}>Cancelled</option>
              </select>
            </div>
          {/if}
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="item-due">Due Date</Label>
            <Input
              id="item-due"
              name="dueDate"
              type="date"
              value={formatDateInput(editingItem?.dueDate)}
            />
          </div>
          <div class="space-y-2">
            <Label for="item-assignee">Assignee</Label>
            <Input
              id="item-assignee"
              name="assignee"
              placeholder="Person responsible"
              value={editingItem?.assignee || ''}
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="item-notes">Notes</Label>
          <Textarea
            id="item-notes"
            name="notes"
            placeholder="Additional notes..."
            value={editingItem?.notes || ''}
          />
        </div>

        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={cancelItemForm}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </Dialog.Footer>
      </form>
  </Dialog.Content>
{/if}

<!-- Template Dialog -->
{#if showTemplateDialog}
  <Dialog.Content class="max-w-lg" onClose={cancelTemplateDialog}>
      <Dialog.Header>
        <Dialog.Title>Apply Budget Template</Dialog.Title>
        <Dialog.Description>
          Select a template to add pre-defined checklist items.
        </Dialog.Description>
      </Dialog.Header>

      {#if form?.message}
        <div class="rounded-md border border-green-500 bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          {form.message}
        </div>
      {/if}

      <form
        method="POST"
        action="?/applyTemplate"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
          }
        }}
        class="space-y-4"
      >
        <div class="space-y-2">
          <Label for="template-select">Template *</Label>
          <select
            id="template-select"
            name="templateId"
            required
            bind:value={selectedTemplateId}
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select a template...</option>
            {#each data.templates as template}
              <option value={template.id}>
                {template.name} ({template.itemCount} items)
              </option>
            {/each}
          </select>
        </div>

        {#if selectedTemplateId}
          {@const template = data.templates.find(t => t.id === selectedTemplateId)}
          {#if template?.description}
            <div class="rounded-md bg-muted p-3 text-sm">
              {template.description}
            </div>
          {/if}
        {/if}

        <div class="space-y-2">
          <Label for="multiplier">Multiplier (for variable items)</Label>
          <Input
            id="multiplier"
            name="multiplier"
            type="number"
            min="1"
            bind:value={multiplier}
          />
          <p class="text-xs text-muted-foreground">
            Used for items with variable costs (e.g., cost per attendee)
          </p>
        </div>

        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={cancelTemplateDialog}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || !selectedTemplateId}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            Apply Template
          </Button>
        </Dialog.Footer>
      </form>
  </Dialog.Content>
{/if}
