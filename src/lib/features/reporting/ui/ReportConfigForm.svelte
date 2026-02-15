<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Clock, Mail, Plus, Trash2 } from 'lucide-svelte'
import type {
  CreateReportConfig,
  DayOfWeek,
  ReportFrequency,
  ReportRecipient,
  ReportSection
} from '../domain/report-config'

interface Props {
  initialData?: Partial<CreateReportConfig>
  onSubmit: (data: CreateReportConfig) => void
  onCancel: () => void
  isLoading?: boolean
}

const { initialData, onSubmit, onCancel, isLoading = false }: Props = $props()

let name = $state(initialData?.name ?? '')
let enabled = $state(initialData?.enabled ?? true)
let frequency = $state<ReportFrequency>(initialData?.frequency ?? 'weekly')
let dayOfWeek = $state<DayOfWeek | undefined>(initialData?.dayOfWeek ?? 'monday')
let dayOfMonth = $state<number | undefined>(initialData?.dayOfMonth ?? 1)
let timeOfDay = $state(initialData?.timeOfDay ?? '09:00')
let timezone = $state(initialData?.timezone ?? 'Europe/Paris')
let recipients = $state<ReportRecipient[]>(initialData?.recipients ?? [{ email: '' }])
let sections = $state<ReportSection[]>(initialData?.sections ?? ['cfp', 'billing'])

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
]

const dayOfWeekOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
]

const sectionOptions: { value: ReportSection; label: string }[] = [
  { value: 'cfp', label: 'CFP (Call for Papers)' },
  { value: 'billing', label: 'Billing (Tickets)' },
  { value: 'planning', label: 'Planning (Sessions)' },
  { value: 'crm', label: 'CRM (Contacts)' },
  { value: 'budget', label: 'Budget' },
  { value: 'sponsoring', label: 'Sponsoring' }
]

const timezoneOptions = [
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'UTC', label: 'UTC' }
]

function addRecipient() {
  recipients = [...recipients, { email: '' }]
}

function removeRecipient(index: number) {
  recipients = recipients.filter((_, i) => i !== index)
}

function updateRecipientEmail(index: number, email: string) {
  recipients = recipients.map((r, i) => (i === index ? { ...r, email } : r))
}

function updateRecipientName(index: number, recipientName: string) {
  recipients = recipients.map((r, i) => (i === index ? { ...r, name: recipientName } : r))
}

function toggleSection(section: ReportSection) {
  if (sections.includes(section)) {
    sections = sections.filter((s) => s !== section)
  } else {
    sections = [...sections, section]
  }
}

function handleSubmit() {
  const data: CreateReportConfig = {
    editionId: initialData?.editionId ?? '',
    name,
    enabled,
    frequency,
    dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
    dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
    timeOfDay,
    timezone,
    recipients: recipients.filter((r) => r.email.trim() !== ''),
    sections
  }
  onSubmit(data)
}

function handleFrequencyChange(e: Event) {
  const target = e.target as HTMLSelectElement
  frequency = target.value as ReportFrequency
}

function handleDayOfWeekChange(e: Event) {
  const target = e.target as HTMLSelectElement
  dayOfWeek = target.value as DayOfWeek
}

function handleTimezoneChange(e: Event) {
  const target = e.target as HTMLSelectElement
  timezone = target.value
}

const isValid = $derived(
  name.trim() !== '' &&
    recipients.some((r) => r.email.trim() !== '') &&
    sections.length > 0 &&
    (frequency !== 'weekly' || dayOfWeek !== undefined) &&
    (frequency !== 'monthly' || (dayOfMonth !== undefined && dayOfMonth >= 1 && dayOfMonth <= 31))
)
</script>

<form
  onsubmit={(e) => {
    e.preventDefault()
    handleSubmit()
  }}
  class="space-y-6"
>
  <!-- Name -->
  <div class="space-y-2">
    <Label for="name">Report Name</Label>
    <Input id="name" bind:value={name} placeholder="e.g., Weekly Summary Report" required />
  </div>

  <!-- Enabled -->
  <div class="flex items-center gap-2">
    <Checkbox id="enabled" bind:checked={enabled} />
    <Label for="enabled" class="cursor-pointer">Enable automatic sending</Label>
  </div>

  <!-- Schedule -->
  <div class="space-y-4 rounded-lg border p-4">
    <h3 class="flex items-center gap-2 font-medium">
      <Clock class="h-4 w-4" />
      Schedule
    </h3>

    <div class="grid gap-4 sm:grid-cols-2">
      <!-- Frequency -->
      <div class="space-y-2">
        <Label for="frequency">Frequency</Label>
        <Select id="frequency" value={frequency} onchange={handleFrequencyChange}>
          {#each frequencyOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </Select>
      </div>

      <!-- Day of Week (for weekly) -->
      {#if frequency === 'weekly'}
        <div class="space-y-2">
          <Label for="dayOfWeek">Day of Week</Label>
          <Select id="dayOfWeek" value={dayOfWeek} onchange={handleDayOfWeekChange}>
            {#each dayOfWeekOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </Select>
        </div>
      {/if}

      <!-- Day of Month (for monthly) -->
      {#if frequency === 'monthly'}
        <div class="space-y-2">
          <Label for="dayOfMonth">Day of Month</Label>
          <Input id="dayOfMonth" type="number" bind:value={dayOfMonth} min={1} max={31} placeholder="1-31" />
        </div>
      {/if}

      <!-- Time -->
      <div class="space-y-2">
        <Label for="timeOfDay">Time</Label>
        <Input id="timeOfDay" type="time" bind:value={timeOfDay} />
      </div>

      <!-- Timezone -->
      <div class="space-y-2">
        <Label for="timezone">Timezone</Label>
        <Select id="timezone" value={timezone} onchange={handleTimezoneChange}>
          {#each timezoneOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </Select>
      </div>
    </div>
  </div>

  <!-- Recipients -->
  <div class="space-y-4 rounded-lg border p-4">
    <h3 class="flex items-center gap-2 font-medium">
      <Mail class="h-4 w-4" />
      Recipients
    </h3>

    <div class="space-y-3">
      {#each recipients as recipient, index}
        <div class="flex gap-2">
          <div class="flex-1">
            <Input
              type="email"
              value={recipient.email}
              oninput={(e) => updateRecipientEmail(index, e.currentTarget.value)}
              placeholder="email@example.com"
              required
            />
          </div>
          <div class="flex-1">
            <Input
              value={recipient.name ?? ''}
              oninput={(e) => updateRecipientName(index, e.currentTarget.value)}
              placeholder="Name (optional)"
            />
          </div>
          {#if recipients.length > 1}
            <Button type="button" variant="ghost" size="icon" onclick={() => removeRecipient(index)}>
              <Trash2 class="h-4 w-4" />
            </Button>
          {/if}
        </div>
      {/each}

      <Button type="button" variant="outline" size="sm" onclick={addRecipient}>
        <Plus class="mr-2 h-4 w-4" />
        Add Recipient
      </Button>
    </div>
  </div>

  <!-- Sections -->
  <div class="space-y-4 rounded-lg border p-4">
    <h3 class="font-medium">Report Sections</h3>
    <p class="text-sm text-muted-foreground">Select which sections to include in the report</p>

    <div class="grid gap-3 sm:grid-cols-2">
      {#each sectionOptions as option}
        <div class="flex items-center gap-2">
          <Checkbox
            id={`section-${option.value}`}
            checked={sections.includes(option.value)}
            onCheckedChange={() => toggleSection(option.value)}
          />
          <Label for={`section-${option.value}`} class="cursor-pointer">{option.label}</Label>
        </div>
      {/each}
    </div>
  </div>

  <!-- Actions -->
  <div class="flex justify-end gap-3">
    <Button type="button" variant="outline" onclick={onCancel} disabled={isLoading}>Cancel</Button>
    <Button type="submit" disabled={!isValid || isLoading}>
      {isLoading ? 'Saving...' : 'Save Report Configuration'}
    </Button>
  </div>
</form>
