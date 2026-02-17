<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Switch } from '$lib/components/ui/switch'
import type { NavItem } from '$lib/config'
import type {
  CreateReportConfig,
  ReportConfig,
  UpdateReportConfig
} from '$lib/features/reporting/domain/report-config'
import { getScheduleDescription } from '$lib/features/reporting/domain/report-config'
import { ReportConfigForm } from '$lib/features/reporting/ui'
import { cn } from '$lib/utils'
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Pencil,
  Play,
  Plus,
  Trash2,
  Users
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let showCreateDialog = $state(false)
let showEditDialog = $state(false)
let showDeleteDialog = $state(false)
let showTestDialog = $state(false)
let selectedConfig = $state<ReportConfig | null>(null)
let testEmail = $state('')
let isSubmitting = $state(false)

// Form refs for programmatic submission
let createForm: HTMLFormElement
let updateForm: HTMLFormElement
let deleteForm: HTMLFormElement
let toggleForm: HTMLFormElement
let testForm: HTMLFormElement

// Hidden input refs
let createDataInput: HTMLInputElement
let updateDataInput: HTMLInputElement
let updateIdInput: HTMLInputElement
let deleteIdInput: HTMLInputElement
let toggleIdInput: HTMLInputElement
let toggleEnabledInput: HTMLInputElement
let testIdInput: HTMLInputElement
let testEmailInput: HTMLInputElement

function handleCreate() {
  selectedConfig = null
  showCreateDialog = true
}

function handleEdit(config: ReportConfig) {
  selectedConfig = config
  showEditDialog = true
}

function handleDelete(config: ReportConfig) {
  selectedConfig = config
  showDeleteDialog = true
}

function handleTest(config: ReportConfig) {
  selectedConfig = config
  testEmail = ''
  showTestDialog = true
}

function closeCreateDialog() {
  showCreateDialog = false
}

function closeEditDialog() {
  showEditDialog = false
  selectedConfig = null
}

function closeDeleteDialog() {
  showDeleteDialog = false
  selectedConfig = null
}

function closeTestDialog() {
  showTestDialog = false
  selectedConfig = null
}

async function handleToggle(config: ReportConfig) {
  if (toggleIdInput && toggleEnabledInput && toggleForm) {
    toggleIdInput.value = config.id
    toggleEnabledInput.value = String(!config.enabled)
    toggleForm.requestSubmit()
  }
}

async function submitCreate(formData: CreateReportConfig) {
  if (createDataInput && createForm) {
    isSubmitting = true
    createDataInput.value = JSON.stringify(formData)
    createForm.requestSubmit()
  }
}

async function submitUpdate(formData: UpdateReportConfig) {
  if (updateDataInput && updateIdInput && updateForm && selectedConfig) {
    isSubmitting = true
    updateIdInput.value = selectedConfig.id
    updateDataInput.value = JSON.stringify(formData)
    updateForm.requestSubmit()
  }
}

async function submitDelete() {
  if (deleteIdInput && deleteForm && selectedConfig) {
    isSubmitting = true
    deleteIdInput.value = selectedConfig.id
    deleteForm.requestSubmit()
  }
}

async function submitTest() {
  if (testIdInput && testEmailInput && testForm && selectedConfig && testEmail) {
    isSubmitting = true
    testIdInput.value = selectedConfig.id
    testEmailInput.value = testEmail
    testForm.requestSubmit()
  }
}

function formatDate(date: Date | undefined): string {
  if (!date) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function getSectionLabels(sections: string[]): string {
  const labels: Record<string, string> = {
    cfp: 'CFP',
    billing: 'Billing',
    planning: 'Planning',
    crm: 'CRM',
    budget: 'Budget',
    sponsoring: 'Sponsoring'
  }
  return sections.map((s) => labels[s] || s).join(', ')
}

function getRoleLabels(roles: string[]): string {
  const labels: Record<string, string> = {
    owner: 'Owner',
    admin: 'Admin',
    organizer: 'Organizer'
  }
  return roles.map((r) => labels[r] || r).join(', ')
}

// Navigation items with badges
const navItems = $derived<NavItem[]>([
  { href: `/admin/reporting/${data.edition?.slug}`, label: 'Dashboard' },
  {
    href: `/admin/reporting/${data.edition?.slug}/alerts`,
    label: 'Alerts',
    badge: data.navBadges.alerts
  },
  {
    href: `/admin/reporting/${data.edition?.slug}/reports`,
    label: 'Reports',
    badge: data.navBadges.reports
  }
])
</script>

<svelte:head>
  <title>Reports - {data.edition?.name ?? 'Reporting'} - Open Event Orchestrator</title>
</svelte:head>

<!-- Hidden forms for programmatic submission -->
<form
  bind:this={createForm}
  method="POST"
  action="?/create"
  use:enhance={() => {
    return async ({ result }) => {
      isSubmitting = false
      if (result.type === 'success') {
        showCreateDialog = false
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={createDataInput} type="hidden" name="data" />
</form>

<form
  bind:this={updateForm}
  method="POST"
  action="?/update"
  use:enhance={() => {
    return async ({ result }) => {
      isSubmitting = false
      if (result.type === 'success') {
        showEditDialog = false
        selectedConfig = null
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={updateIdInput} type="hidden" name="id" />
  <input bind:this={updateDataInput} type="hidden" name="data" />
</form>

<form
  bind:this={deleteForm}
  method="POST"
  action="?/delete"
  use:enhance={() => {
    return async ({ result }) => {
      isSubmitting = false
      if (result.type === 'success') {
        showDeleteDialog = false
        selectedConfig = null
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={deleteIdInput} type="hidden" name="id" />
</form>

<form
  bind:this={toggleForm}
  method="POST"
  action="?/toggle"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={toggleIdInput} type="hidden" name="id" />
  <input bind:this={toggleEnabledInput} type="hidden" name="enabled" />
</form>

<form
  bind:this={testForm}
  method="POST"
  action="?/test"
  use:enhance={() => {
    return async ({ result }) => {
      isSubmitting = false
      if (result.type === 'success') {
        showTestDialog = false
        selectedConfig = null
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={testIdInput} type="hidden" name="id" />
  <input bind:this={testEmailInput} type="hidden" name="testEmail" />
</form>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/reporting/{data.edition?.slug ?? ''}">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{data.edition?.name ?? 'Reports'}</h2>
      </div>
    </div>

    <Button onclick={handleCreate}>
      <Plus class="mr-2 h-4 w-4" />
      New Report
    </Button>
  </div>

  <!-- Sub-navigation -->
  {#if data.edition}
    <AdminSubNav basePath="/admin/reporting/{data.edition.slug}" items={navItems} />
  {/if}

  {#if !data.edition}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <FileText class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No edition available</h3>
        <p class="text-sm text-muted-foreground">
          Create an edition for this event to configure reports.
        </p>
      </Card.Content>
    </Card.Root>
  {:else if data.reportConfigs.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <FileText class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No reports configured</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          Create automated reports to receive regular updates by email.
        </p>
        <Button onclick={handleCreate}>
          <Plus class="mr-2 h-4 w-4" />
          Create your first report
        </Button>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4">
      {#each data.reportConfigs as config (config.id)}
        <Card.Root class={cn('transition-opacity', !config.enabled && 'opacity-60')}>
          <Card.Content class="pt-6">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 space-y-2">
                <div class="flex items-center gap-3">
                  <h3 class="text-lg font-semibold">{config.name}</h3>
                  {#if !config.enabled}
                    <span class="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      Disabled
                    </span>
                  {/if}
                </div>

                <div class="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div class="flex items-center gap-1.5">
                    <Clock class="h-4 w-4" />
                    <span>{getScheduleDescription(config)}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Users class="h-4 w-4" />
                    <span>{getRoleLabels(config.recipientRoles || [])}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <FileText class="h-4 w-4" />
                    <span>{getSectionLabels(config.sections)}</span>
                  </div>
                </div>

                <div class="flex items-center gap-4 text-xs text-muted-foreground">
                  {#if config.lastSentAt}
                    <span>Last sent: {formatDate(config.lastSentAt)}</span>
                  {/if}
                  {#if config.nextScheduledAt && config.enabled}
                    <span class="flex items-center gap-1">
                      <Calendar class="h-3 w-3" />
                      Next: {formatDate(config.nextScheduledAt)}
                    </span>
                  {/if}
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Switch checked={config.enabled} onCheckedChange={() => handleToggle(config)} />
                <Button variant="ghost" size="icon" onclick={() => handleTest(config)}>
                  <Play class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onclick={() => handleEdit(config)}>
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onclick={() => handleDelete(config)}>
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>

<!-- Create Dialog -->
{#if showCreateDialog}
  <Dialog.Content class="max-w-lg" onClose={closeCreateDialog}>
    <Dialog.Header>
      <Dialog.Title>New Report</Dialog.Title>
    </Dialog.Header>
    <ReportConfigForm
      initialData={{ editionId: data.edition?.id ?? '' }}
      onSubmit={submitCreate}
      onCancel={closeCreateDialog}
      isLoading={isSubmitting}
    />
  </Dialog.Content>
{/if}

<!-- Edit Dialog -->
{#if showEditDialog && selectedConfig}
  <Dialog.Content class="max-w-lg" onClose={closeEditDialog}>
    <Dialog.Header>
      <Dialog.Title>Edit Report</Dialog.Title>
    </Dialog.Header>
    <ReportConfigForm
      initialData={{
        editionId: selectedConfig.editionId,
        name: selectedConfig.name,
        enabled: selectedConfig.enabled,
        frequency: selectedConfig.frequency,
        dayOfWeek: selectedConfig.dayOfWeek,
        dayOfMonth: selectedConfig.dayOfMonth,
        timeOfDay: selectedConfig.timeOfDay,
        timezone: selectedConfig.timezone,
        recipientRoles: selectedConfig.recipientRoles,
        sections: selectedConfig.sections
      }}
      onSubmit={submitUpdate}
      onCancel={closeEditDialog}
      isLoading={isSubmitting}
    />
  </Dialog.Content>
{/if}

<!-- Delete Confirmation Dialog -->
{#if showDeleteDialog && selectedConfig}
  <Dialog.Content onClose={closeDeleteDialog}>
    <Dialog.Header>
      <Dialog.Title>Delete Report Configuration</Dialog.Title>
      <Dialog.Description>
        Are you sure you want to delete "{selectedConfig.name}"? This action cannot be undone.
      </Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={closeDeleteDialog}>Cancel</Button>
      <Button variant="destructive" onclick={submitDelete} disabled={isSubmitting}>
        {isSubmitting ? 'Deleting...' : 'Delete'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
{/if}

<!-- Test Report Dialog -->
{#if showTestDialog && selectedConfig}
  <Dialog.Content onClose={closeTestDialog}>
    <Dialog.Header>
      <Dialog.Title>Send Test Report</Dialog.Title>
      <Dialog.Description>
        Send a test report to verify the configuration is working correctly.
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="testEmail">Email Address</Label>
        <Input id="testEmail" type="email" bind:value={testEmail} placeholder="your@email.com" />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={closeTestDialog}>Cancel</Button>
      <Button onclick={submitTest} disabled={!testEmail || isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Test'}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
{/if}
