<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import * as m from '$lib/paraglide/messages'
import { Clock, Sparkles, Users } from 'lucide-svelte'
import type {
  CreateReportConfig,
  DayOfWeek,
  RecipientRole,
  ReportFrequency,
  ReportSection
} from '../domain/report-config'

// Preset report templates - translations are applied dynamically
const getReportPresets = () => [
  {
    key: 'weekly',
    name: m.reporting_reports_preset_weekly(),
    label: m.reporting_reports_preset_weekly(),
    frequency: 'weekly' as ReportFrequency,
    dayOfWeek: 'monday' as DayOfWeek,
    timeOfDay: '09:00',
    recipientRoles: ['admin', 'organizer'] as RecipientRole[],
    sections: ['cfp', 'billing', 'planning'] as ReportSection[]
  },
  {
    key: 'daily_sales',
    name: m.reporting_reports_preset_daily_sales(),
    label: m.reporting_reports_preset_daily_sales(),
    frequency: 'daily' as ReportFrequency,
    timeOfDay: '08:00',
    recipientRoles: ['admin'] as RecipientRole[],
    sections: ['billing'] as ReportSection[]
  },
  {
    key: 'monthly',
    name: m.reporting_reports_preset_monthly(),
    label: m.reporting_reports_preset_monthly(),
    frequency: 'monthly' as ReportFrequency,
    dayOfMonth: 1,
    timeOfDay: '10:00',
    recipientRoles: ['owner', 'admin'] as RecipientRole[],
    sections: ['cfp', 'billing', 'planning', 'budget', 'sponsoring'] as ReportSection[]
  },
  {
    key: 'cfp_weekly',
    name: m.reporting_reports_preset_cfp_weekly(),
    label: m.reporting_reports_preset_cfp_weekly(),
    frequency: 'weekly' as ReportFrequency,
    dayOfWeek: 'friday' as DayOfWeek,
    timeOfDay: '17:00',
    recipientRoles: ['admin', 'organizer'] as RecipientRole[],
    sections: ['cfp'] as ReportSection[]
  }
]

// Derived presets to get translations reactively
const reportPresets = $derived(getReportPresets())

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

// Options with translations - computed as derived values
const getFrequencyOptions = () => [
  { value: 'daily', label: m.reporting_reports_form_frequency_daily() },
  { value: 'weekly', label: m.reporting_reports_form_frequency_weekly() },
  { value: 'monthly', label: m.reporting_reports_form_frequency_monthly() }
]

const getDayOfWeekOptions = () => [
  { value: 'monday', label: m.reporting_reports_form_day_mon() },
  { value: 'tuesday', label: m.reporting_reports_form_day_tue() },
  { value: 'wednesday', label: m.reporting_reports_form_day_wed() },
  { value: 'thursday', label: m.reporting_reports_form_day_thu() },
  { value: 'friday', label: m.reporting_reports_form_day_fri() },
  { value: 'saturday', label: m.reporting_reports_form_day_sat() },
  { value: 'sunday', label: m.reporting_reports_form_day_sun() }
]

const getRoleOptions = (): { value: RecipientRole; label: string }[] => [
  { value: 'owner', label: m.reporting_reports_form_role_owner() },
  { value: 'admin', label: m.reporting_reports_form_role_admin() },
  { value: 'organizer', label: m.reporting_reports_form_role_organizer() }
]

const getSectionOptions = (): { value: ReportSection; label: string }[] => [
  { value: 'cfp', label: m.reporting_reports_form_section_cfp() },
  { value: 'billing', label: m.reporting_reports_form_section_billing() },
  { value: 'planning', label: m.reporting_reports_form_section_planning() },
  { value: 'crm', label: m.reporting_reports_form_section_crm() },
  { value: 'budget', label: m.reporting_reports_form_section_budget() },
  { value: 'sponsoring', label: m.reporting_reports_form_section_sponsoring() }
]

// Derived options for reactive translations
const frequencyOptions = $derived(getFrequencyOptions())
const dayOfWeekOptions = $derived(getDayOfWeekOptions())
const roleOptions = $derived(getRoleOptions())
const sectionOptions = $derived(getSectionOptions())

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

function applyPreset(preset: ReturnType<typeof getReportPresets>[number]) {
  name = preset.name
  frequency = preset.frequency
  if ('dayOfWeek' in preset) dayOfWeek = preset.dayOfWeek
  if ('dayOfMonth' in preset) dayOfMonth = preset.dayOfMonth
  timeOfDay = preset.timeOfDay
  recipientRoles = [...preset.recipientRoles]
  sections = [...preset.sections]
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
  <!-- Presets -->
  <div class="space-y-2">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <Sparkles class="h-4 w-4" />
      <span>{m.reporting_reports_form_presets()}</span>
    </div>
    <div class="flex flex-wrap gap-2">
      {#each reportPresets as preset}
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="h-7 text-xs"
          onclick={() => applyPreset(preset)}
        >
          {preset.label}
        </Button>
      {/each}
    </div>
  </div>

  <!-- Name & Enabled -->
  <div class="flex items-end gap-3">
    <div class="flex-1 space-y-1">
      <Label for="name">{m.reporting_reports_form_name()}</Label>
      <Input id="name" bind:value={name} placeholder={m.reporting_reports_form_name_placeholder()} required />
    </div>
    <div class="flex items-center gap-2 pb-2">
      <Checkbox id="enabled" bind:checked={enabled} />
      <Label for="enabled" class="cursor-pointer text-sm">{m.reporting_reports_form_enabled()}</Label>
    </div>
  </div>

  <!-- Schedule -->
  <div class="space-y-3 rounded-lg border p-3">
    <h3 class="flex items-center gap-2 text-sm font-medium">
      <Clock class="h-4 w-4" />
      {m.reporting_reports_form_schedule()}
    </h3>

    <div class="grid gap-3 sm:grid-cols-4">
      <div class="space-y-1">
        <Label for="frequency" class="text-xs">{m.reporting_reports_form_frequency()}</Label>
        <Select id="frequency" value={frequency} onchange={handleFrequencyChange}>
          {#each frequencyOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </Select>
      </div>

      {#if frequency === 'weekly'}
        <div class="space-y-1">
          <Label for="dayOfWeek" class="text-xs">{m.reporting_reports_form_day()}</Label>
          <Select id="dayOfWeek" value={dayOfWeek} onchange={handleDayOfWeekChange}>
            {#each dayOfWeekOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </Select>
        </div>
      {/if}

      {#if frequency === 'monthly'}
        <div class="space-y-1">
          <Label for="dayOfMonth" class="text-xs">{m.reporting_reports_form_day()}</Label>
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
        <Label for="timeOfDay" class="text-xs">{m.reporting_reports_form_time()}</Label>
        <Input id="timeOfDay" type="time" bind:value={timeOfDay} />
      </div>

      <div class="space-y-1">
        <Label for="timezone" class="text-xs">{m.reporting_reports_form_timezone()}</Label>
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
      {m.reporting_reports_form_recipients()}
    </h3>
    <p class="text-xs text-muted-foreground">
      {m.reporting_reports_form_recipients_hint()}
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
    <h3 class="text-sm font-medium">{m.reporting_reports_form_sections()}</h3>
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
      {m.action_cancel()}
    </Button>
    <Button type="submit" size="sm" disabled={!isValid || isLoading}>
      {isLoading ? m.reporting_reports_form_saving() : m.action_save()}
    </Button>
  </div>
</form>
