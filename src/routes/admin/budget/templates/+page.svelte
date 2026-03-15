<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { eventTypes, getEventTypeLabel } from '$lib/features/budget/domain'
import * as m from '$lib/paraglide/messages'
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
  <title>{m.budget_templates_title()}</title>
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
        <h2 class="text-3xl font-bold tracking-tight">{m.budget_templates_title()}</h2>
        <p class="text-muted-foreground">{m.budget_templates_subtitle()}</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      {#if data.templates.length === 0}
        <form method="POST" action="?/seedDefaults" use:enhance>
          <Button type="submit" variant="outline">
            <FileText class="mr-2 h-4 w-4" />
            {m.budget_templates_seed_defaults()}
          </Button>
        </form>
      {/if}
      <Button onclick={() => showCreateDialog = true}>
        <Plus class="mr-2 h-4 w-4" />
        {m.budget_templates_create()}
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
        <h3 class="text-lg font-semibold">{m.budget_templates_no_templates()}</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          {m.budget_templates_no_templates_hint()}
        </p>
        <div class="flex gap-2">
          <form method="POST" action="?/seedDefaults" use:enhance>
            <Button type="submit" variant="outline">
              {m.budget_templates_seed_default()}
            </Button>
          </form>
          <Button onclick={() => showCreateDialog = true}>
            <Plus class="mr-2 h-4 w-4" />
            {m.budget_templates_create()}
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
              <span class="text-muted-foreground">{m.budget_templates_items({ count: template.itemCount.toString() })}</span>
              <span class="text-muted-foreground">{m.budget_templates_used({ count: template.usageCount.toString() })}</span>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}

  <!-- Default Templates Reference -->
  {#if data.defaultTemplates.length > 0 && data.templates.length > 0}
    <div class="space-y-4">
      <h3 class="text-lg font-semibold">{m.budget_templates_default_reference()}</h3>
      <p class="text-sm text-muted-foreground">
        {m.budget_templates_default_hint()}
      </p>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {#each data.defaultTemplates as template}
          <Card.Root class="opacity-60">
            <Card.Header class="pb-2">
              <Card.Title class="text-base">{template.name}</Card.Title>
              <Card.Description class="text-xs">{template.eventTypeLabel}</Card.Description>
            </Card.Header>
            <Card.Content>
              <p class="text-xs text-muted-foreground">{m.budget_templates_items({ count: template.itemCount.toString() })}</p>
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
        <Dialog.Title>{m.budget_templates_create_title()}</Dialog.Title>
        <Dialog.Description>
          {m.budget_templates_create_description()}
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
            <Label for="template-name">{m.budget_templates_name()} *</Label>
            <Input
              id="template-name"
              name="name"
              placeholder={m.budget_templates_name_placeholder()}
              required
              bind:value={templateName}
            />
          </div>
          <div class="space-y-2">
            <Label for="template-type">{m.budget_templates_event_type()} *</Label>
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
          <Label for="template-description">{m.budget_templates_description()}</Label>
          <Textarea
            id="template-description"
            name="description"
            placeholder={m.budget_templates_description_placeholder()}
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
          <Label for="is-global" class="text-sm">{m.budget_templates_global()}</Label>
        </div>

        <!-- Template Items -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <Label>{m.budget_templates_template_items()}</Label>
            <Button type="button" variant="outline" size="sm" onclick={addTemplateItem}>
              <Plus class="mr-1 h-3 w-3" />
              {m.budget_templates_add_item()}
            </Button>
          </div>

          {#each templateItems as item, index}
            <div class="flex items-center gap-2 rounded-lg border p-2">
              <Input
                placeholder={m.budget_templates_item_name()}
                bind:value={item.name}
                class="flex-1"
              />
              <Input
                placeholder={m.budget_templates_item_category()}
                bind:value={item.category}
                class="w-24"
              />
              <Input
                type="number"
                min="0"
                placeholder={m.budget_templates_item_amount()}
                value={item.estimatedAmount.toString()}
                oninput={(e) => { item.estimatedAmount = parseInt((e.target as HTMLInputElement).value, 10) || 0 }}
                class="w-28"
              />
              <select
                bind:value={item.priority}
                class="h-10 w-24 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="low">{m.budget_templates_priority_low()}</option>
                <option value="medium">{m.budget_templates_priority_medium()}</option>
                <option value="high">{m.budget_templates_priority_high()}</option>
              </select>
              <Button type="button" variant="ghost" size="icon" onclick={() => removeTemplateItem(index)}>
                <X class="h-4 w-4" />
              </Button>
            </div>
          {/each}

          {#if templateItems.length === 0}
            <p class="text-sm text-muted-foreground">{m.budget_templates_no_items()}</p>
          {/if}
        </div>

        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={cancelDialog}>{m.action_cancel()}</Button>
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {/if}
            {m.budget_templates_create()}
          </Button>
        </Dialog.Footer>
      </form>
  </Dialog.Content>
{/if}
