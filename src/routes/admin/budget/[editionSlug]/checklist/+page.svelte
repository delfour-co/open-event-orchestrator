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
import * as m from '$lib/paraglide/messages'
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
  <title>{m.budget_checklist_title({ name: data.edition.name })}</title>
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
        <p class="text-muted-foreground">{m.budget_checklist_subtitle()}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" onclick={() => (showTemplateDialog = true)}>
        <FileText class="mr-2 h-4 w-4" />
        {m.budget_checklist_apply_template()}
      </Button>
      <Button onclick={() => { editingItem = null; showItemForm = true }}>
        <Plus class="mr-2 h-4 w-4" />
        {m.budget_checklist_add_item()}
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
        <p class="text-xs text-muted-foreground">{m.budget_checklist_total_items()}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold text-yellow-600">{data.stats.pending}</div>
        <p class="text-xs text-muted-foreground">{m.budget_checklist_pending()}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold text-blue-600">{data.stats.approved}</div>
        <p class="text-xs text-muted-foreground">{m.budget_checklist_approved()}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold text-purple-600">{data.stats.ordered}</div>
        <p class="text-xs text-muted-foreground">{m.budget_checklist_ordered()}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold text-green-600">{data.stats.paid}</div>
        <p class="text-xs text-muted-foreground">{m.budget_checklist_paid()}</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-2xl font-bold">{formatAmount(data.stats.totalEstimated, data.budget?.currency)}</div>
        <p class="text-xs text-muted-foreground">{m.budget_checklist_total_estimated()}</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Checklist Items -->
  {#if data.items.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <ClipboardList class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.budget_checklist_no_items()}</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          {m.budget_checklist_no_items_hint()}
        </p>
        <div class="flex gap-2">
          <Button variant="outline" onclick={() => (showTemplateDialog = true)}>
            <FileText class="mr-2 h-4 w-4" />
            {m.budget_checklist_apply_template()}
          </Button>
          <Button onclick={() => { editingItem = null; showItemForm = true }}>
            <Plus class="mr-2 h-4 w-4" />
            {m.budget_checklist_add_item()}
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
              <th class="px-4 py-3 font-medium">{m.budget_checklist_item()}</th>
              <th class="px-4 py-3 font-medium">{m.budget_checklist_category()}</th>
              <th class="px-4 py-3 font-medium text-right">{m.budget_checklist_estimated()}</th>
              <th class="px-4 py-3 font-medium">{m.budget_checklist_priority()}</th>
              <th class="px-4 py-3 font-medium">{m.budget_checklist_status()}</th>
              <th class="px-4 py-3 font-medium">{m.budget_checklist_due_date()}</th>
              <th class="px-4 py-3 font-medium">{m.budget_checklist_assignee()}</th>
              <th class="px-4 py-3 font-medium">{m.budget_checklist_actions()}</th>
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
        <Dialog.Title>{editingItem ? m.budget_checklist_edit_item() : m.budget_checklist_add_item()}</Dialog.Title>
        <Dialog.Description>
          {editingItem ? m.budget_checklist_update_item() : m.budget_checklist_add_item_hint()}
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
          <Label for="item-name">{m.budget_checklist_item_name()} *</Label>
          <Input
            id="item-name"
            name="name"
            placeholder={m.budget_checklist_item_name_placeholder()}
            required
            value={editingItem?.name || ''}
          />
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="item-category">{m.budget_checklist_item_category()}</Label>
            <select
              id="item-category"
              name="categoryId"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">{m.budget_checklist_no_category()}</option>
              {#each data.categories as cat}
                <option value={cat.id} selected={editingItem?.categoryId === cat.id}>
                  {cat.name}
                </option>
              {/each}
            </select>
          </div>
          <div class="space-y-2">
            <Label for="item-amount">{m.budget_checklist_item_amount()}</Label>
            <Input
              id="item-amount"
              name="estimatedAmount"
              type="number"
              step="1"
              min="0"
              placeholder="0"
              value={editingItem?.estimatedAmount?.toString() || '0'}
            />
            <p class="text-xs text-muted-foreground">{m.budget_checklist_amount_hint()}</p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="item-priority">{m.budget_checklist_item_priority()}</Label>
            <select
              id="item-priority"
              name="priority"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="low" selected={editingItem?.priority === 'low'}>{m.budget_checklist_priority_low()}</option>
              <option value="medium" selected={!editingItem || editingItem?.priority === 'medium'}>{m.budget_checklist_priority_medium()}</option>
              <option value="high" selected={editingItem?.priority === 'high'}>{m.budget_checklist_priority_high()}</option>
            </select>
          </div>
          {#if editingItem}
            <div class="space-y-2">
              <Label for="item-status">{m.budget_checklist_item_status()}</Label>
              <select
                id="item-status"
                name="status"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="pending" selected={editingItem?.status === 'pending'}>{m.budget_checklist_status_pending()}</option>
                <option value="approved" selected={editingItem?.status === 'approved'}>{m.budget_checklist_status_approved()}</option>
                <option value="ordered" selected={editingItem?.status === 'ordered'}>{m.budget_checklist_status_ordered()}</option>
                <option value="paid" selected={editingItem?.status === 'paid'}>{m.budget_checklist_status_paid()}</option>
                <option value="cancelled" selected={editingItem?.status === 'cancelled'}>{m.budget_checklist_status_cancelled()}</option>
              </select>
            </div>
          {/if}
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <Label for="item-due">{m.budget_checklist_item_due()}</Label>
            <Input
              id="item-due"
              name="dueDate"
              type="date"
              value={formatDateInput(editingItem?.dueDate)}
            />
          </div>
          <div class="space-y-2">
            <Label for="item-assignee">{m.budget_checklist_item_assignee()}</Label>
            <Input
              id="item-assignee"
              name="assignee"
              placeholder={m.budget_checklist_assignee_placeholder()}
              value={editingItem?.assignee || ''}
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="item-notes">{m.budget_checklist_item_notes()}</Label>
          <Textarea
            id="item-notes"
            name="notes"
            placeholder={m.budget_checklist_notes_placeholder()}
            value={editingItem?.notes || ''}
          />
        </div>

        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={cancelItemForm}>{m.action_cancel()}</Button>
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            {editingItem ? m.action_update() : m.action_create()}
          </Button>
        </Dialog.Footer>
      </form>
  </Dialog.Content>
{/if}

<!-- Template Dialog -->
{#if showTemplateDialog}
  <Dialog.Content class="max-w-lg" onClose={cancelTemplateDialog}>
      <Dialog.Header>
        <Dialog.Title>{m.budget_checklist_template_title()}</Dialog.Title>
        <Dialog.Description>
          {m.budget_checklist_template_description()}
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
            <option value="">{m.budget_checklist_select_template()}</option>
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
          <Label for="multiplier">{m.budget_checklist_multiplier()}</Label>
          <Input
            id="multiplier"
            name="multiplier"
            type="number"
            min="1"
            bind:value={multiplier}
          />
          <p class="text-xs text-muted-foreground">
            {m.budget_checklist_multiplier_hint()}
          </p>
        </div>

        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={cancelTemplateDialog}>{m.action_cancel()}</Button>
          <Button type="submit" disabled={isSubmitting || !selectedTemplateId}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            {m.budget_checklist_apply_template()}
          </Button>
        </Dialog.Footer>
      </form>
  </Dialog.Content>
{/if}
