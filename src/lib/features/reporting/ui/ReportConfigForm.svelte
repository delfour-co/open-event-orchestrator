<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Clock, Users } from 'lucide-svelte'
import type {
  CreateReportConfig,
  DayOfWeek,
  RecipientRole,
  ReportFrequency,
  ReportSection
} from '../domain/report-config'
import { RECIPIENT_ROLE_LABELS } from '../domain/report-config'

interface Props {
  initialData?: Partial<CreateReportConfig>
  onSubmit: (data: CreateReportConfig) => void
  onCancel: () => void
  isLoading?: boolean
}

const { initialData, onSubmit, onCancel, isLoading = false }: Props = $props()

// Extract initial values to avoid state_referenced_locally warning
const initName = initialData?.name ?? ''
const initEnabled = initialData?.enabled ?? true
const initFrequency = initialData?.frequency ?? 'weekly'
const initDayOfWeek = initialData?.dayOfWeek ?? 'monday'
const initDayOfMonth = initialData?.dayOfMonth ?? 1
const initTimeOfDay = initialData?.timeOfDay ?? '09:00'
const initTimezone = initialData?.timezone ?? 'Europe/Paris'
const initRecipientRoles = initialData?.recipientRoles ?? ['admin', 'organizer']
const initSections = initialData?.sections ?? ['cfp', 'billing']

let name = $state(initName)
let enabled = $state(initEnabled)
let frequency = $state<ReportFrequency>(initFrequency)
let dayOfWeek = $state<DayOfWeek | undefined>(initDayOfWeek)
let dayOfMonth = $state<number | undefined>(initDayOfMonth)
let timeOfDay = $state(initTimeOfDay)
let timezone = $state(initTimezone)
let recipientRoles = $state<RecipientRole[]>(initRecipientRoles)
let sections = $state<ReportSection[]>(initSections)

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
]

const dayOfWeekOptions = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' }
]

const roleOptions: { value: RecipientRole; label: string }[] = [
  { value: 'owner', label: RECIPIENT_ROLE_LABELS.owner },
  { value: 'admin', label: RECIPIENT_ROLE_LABELS.admin },
  { value: 'organizer', label: RECIPIENT_ROLE_LABELS.organizer }
]

const sectionOptions: { value: ReportSection; label: string }[] = [
  { value: 'cfp', label: 'CFP' },
  { value: 'billing', label: 'Billing' },
  { value: 'planning', label: 'Planning' },
  { value: 'crm', label: 'CRM' },
  { value: 'budget', label: 'Budget' },
  { value: 'sponsoring', label: 'Sponsoring' }
]

const timezoneOptions = [
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/London', label: 'London' },
  { value: 'America/New_York', label: 'New York' },
  { value: 'America/Los_Angeles', label: 'Los Angeles' },
  { value: 'UTC', label: 'UTC' }
]

function toggleRole(role: RecipientRole) {
  if (recipientRoles.includes(role)) {
    recipientRoles = recipientRoles.filter((r) => r !== role)
  } else {
    recipientRoles = [...recipientRoles, role]
  }
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
    recipientRoles,
    recipients: [],
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
    recipientRoles.length > 0 &&
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
  class="space-y-4"
>
  <!-- Name & Enabled -->
  <div class="flex items-end gap-3">
    <div class="flex-1 space-y-1">
      <Label for="name">Name</Label>
      <Input id="name" bind:value={name} placeholder="Weekly Summary" required />
    </div>
    <div class="flex items-center gap-2 pb-2">
      <Checkbox id="enabled" bind:checked={enabled} />
      <Label for="enabled" class="cursor-pointer text-sm">Enabled</Label>
    </div>
  </div>

  <!-- Schedule -->
  <div class="space-y-3 rounded-lg border p-3">
    <h3 class="flex items-center gap-2 text-sm font-medium">
      <Clock class="h-4 w-4" />
      Schedule
    </h3>

    <div class="grid gap-3 sm:grid-cols-4">
      <div class="space-y-1">
        <Label for="frequency" class="text-xs">Frequency</Label>
        <Select id="frequency" value={frequency} onchange={handleFrequencyChange}>
          {#each frequencyOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </Select>
      </div>

      {#if frequency === 'weekly'}
        <div class="space-y-1">
          <Label for="dayOfWeek" class="text-xs">Day</Label>
          <Select id="dayOfWeek" value={dayOfWeek} onchange={handleDayOfWeekChange}>
            {#each dayOfWeekOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </Select>
        </div>
      {/if}

      {#if frequency === 'monthly'}
        <div class="space-y-1">
          <Label for="dayOfMonth" class="text-xs">Day</Label>
          <Input
            id="dayOfMonth"
            type="number"
            value={dayOfMonth?.toString() ?? '1'}
            oninput={(e) => (dayOfMonth = Number(e.currentTarget.value))}
            min={1}
            max={31}
          />
        </div>
      {/if}

      <div class="space-y-1">
        <Label for="timeOfDay" class="text-xs">Time</Label>
        <Input id="timeOfDay" type="time" bind:value={timeOfDay} />
      </div>

      <div class="space-y-1">
        <Label for="timezone" class="text-xs">Timezone</Label>
        <Select id="timezone" value={timezone} onchange={handleTimezoneChange}>
          {#each timezoneOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </Select>
      </div>
    </div>
  </div>

  <!-- Recipients by Role -->
  <div class="space-y-2 rounded-lg border p-3">
    <h3 class="flex items-center gap-2 text-sm font-medium">
      <Users class="h-4 w-4" />
      Recipients
    </h3>
    <p class="text-xs text-muted-foreground">
      Select which roles receive the report
    </p>
    <div class="flex flex-wrap gap-4">
      {#each roleOptions as option}
        <div class="flex items-center gap-2">
          <Checkbox
            id={`role-${option.value}`}
            checked={recipientRoles.includes(option.value)}
            onCheckedChange={() => toggleRole(option.value)}
          />
          <Label for={`role-${option.value}`} class="cursor-pointer text-sm">{option.label}</Label>
        </div>
      {/each}
    </div>
  </div>

  <!-- Sections -->
  <div class="space-y-2 rounded-lg border p-3">
    <h3 class="text-sm font-medium">Sections</h3>
    <div class="flex flex-wrap gap-4">
      {#each sectionOptions as option}
        <div class="flex items-center gap-2">
          <Checkbox
            id={`section-${option.value}`}
            checked={sections.includes(option.value)}
            onCheckedChange={() => toggleSection(option.value)}
          />
          <Label for={`section-${option.value}`} class="cursor-pointer text-sm">{option.label}</Label>
        </div>
      {/each}
    </div>
  </div>

  <!-- Actions -->
  <div class="flex justify-end gap-2 pt-2">
    <Button type="button" variant="outline" size="sm" onclick={onCancel} disabled={isLoading}>
      Cancel
    </Button>
    <Button type="submit" size="sm" disabled={!isValid || isLoading}>
      {isLoading ? 'Saving...' : 'Save'}
    </Button>
  </div>
</form>
