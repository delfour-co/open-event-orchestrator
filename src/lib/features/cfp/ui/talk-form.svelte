<script lang="ts">
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Textarea } from '$lib/components/ui/textarea'
import type { Category, Format, Language, TalkLevel } from '../domain'
import { type FieldConditionRule, shouldShowField } from '../domain/conditional-field'

interface TalkFormData {
  title?: string
  abstract?: string
  description?: string
  language?: string
  level?: string
  categoryId?: string
  formatId?: string
  notes?: string
  duration?: string
  prerequisites?: string
  requiredMaterials?: string
  targetAudience?: string
  mentorRequest?: boolean
}

interface Props {
  talk: TalkFormData
  categories: Category[]
  formats: Format[]
  errors?: Record<string, string>
  fieldConditionRules?: FieldConditionRule[]
}

let {
  talk = $bindable({}),
  categories,
  formats,
  errors = {},
  fieldConditionRules = []
}: Props = $props()

// Build form data for condition evaluation
const formData = $derived({
  title: talk.title,
  abstract: talk.abstract,
  description: talk.description,
  language: talk.language,
  level: talk.level,
  categoryId: talk.categoryId,
  formatId: talk.formatId,
  notes: talk.notes,
  duration: talk.duration,
  prerequisites: talk.prerequisites,
  requiredMaterials: talk.requiredMaterials,
  targetAudience: talk.targetAudience,
  mentorRequest: talk.mentorRequest
})

// Check if a field should be visible
function isFieldVisible(fieldId: string): boolean {
  return shouldShowField(fieldId, fieldConditionRules, formData)
}

const languages: { value: Language; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' }
]

const levels: { value: TalkLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
]
</script>

<div class="space-y-6">
  <h2 class="text-xl font-semibold">Talk Details</h2>

  <div class="space-y-2">
    <Label for="title">Title *</Label>
    <Input
      id="title"
      name="title"
      bind:value={talk.title}
      placeholder="My Awesome Talk"
      required
      class={errors.title ? 'border-destructive' : ''}
    />
    <p class="text-sm text-muted-foreground">{talk.title?.length ?? 0}/200 characters</p>
    {#if errors.title}
      <p class="text-sm text-destructive">{errors.title}</p>
    {/if}
  </div>

  <div class="space-y-2">
    <Label for="abstract">Abstract *</Label>
    <Textarea
      id="abstract"
      name="abstract"
      bind:value={talk.abstract}
      placeholder="A brief summary of your talk (50-500 characters)..."
      rows={4}
      required
      class={errors.abstract ? 'border-destructive' : ''}
    />
    <p class="text-sm text-muted-foreground">
      {talk.abstract?.length ?? 0}/500 characters (min 50)
    </p>
    {#if errors.abstract}
      <p class="text-sm text-destructive">{errors.abstract}</p>
    {/if}
  </div>

  {#if isFieldVisible('description')}
    <div class="space-y-2">
      <Label for="description">Description</Label>
      <Textarea
        id="description"
        name="description"
        bind:value={talk.description}
        placeholder="A detailed description of your talk (optional)..."
        rows={8}
        class={errors.description ? 'border-destructive' : ''}
      />
      <p class="text-sm text-muted-foreground">{talk.description?.length ?? 0}/5000 characters</p>
      {#if errors.description}
        <p class="text-sm text-destructive">{errors.description}</p>
      {/if}
    </div>
  {/if}

  <div class="grid gap-4 md:grid-cols-2">
    <div class="space-y-2">
      <Label for="language">Language *</Label>
      <Select id="language" name="language" bind:value={talk.language} required>
        <option value="">Select a language</option>
        {#each languages as lang}
          <option value={lang.value}>{lang.label}</option>
        {/each}
      </Select>
      {#if errors.language}
        <p class="text-sm text-destructive">{errors.language}</p>
      {/if}
    </div>

    {#if isFieldVisible('level')}
      <div class="space-y-2">
        <Label for="level">Level</Label>
        <Select id="level" name="level" bind:value={talk.level}>
          <option value="">Select a level</option>
          {#each levels as lvl}
            <option value={lvl.value}>{lvl.label}</option>
          {/each}
        </Select>
      </div>
    {/if}
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    {#if categories.length > 0}
      <div class="space-y-2">
        <Label for="categoryId">Category</Label>
        <Select id="categoryId" name="categoryId" bind:value={talk.categoryId}>
          <option value="">Select a category</option>
          {#each categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </Select>
      </div>
    {/if}

    {#if formats.length > 0}
      <div class="space-y-2">
        <Label for="formatId">Format</Label>
        <Select id="formatId" name="formatId" bind:value={talk.formatId}>
          <option value="">Select a format</option>
          {#each formats as format}
            <option value={format.id}>{format.name} ({format.duration} min)</option>
          {/each}
        </Select>
      </div>
    {/if}
  </div>

  {#if isFieldVisible('notes')}
    <div class="space-y-2">
      <Label for="notes">Notes for organizers</Label>
      <Textarea
        id="notes"
        name="notes"
        bind:value={talk.notes}
        placeholder="Any additional information for the organizers (availability, special requirements, etc.)..."
        rows={3}
      />
      <p class="text-sm text-muted-foreground">{talk.notes?.length ?? 0}/2000 characters</p>
    </div>
  {/if}

  <!-- Conditional Fields Section -->
  {#if isFieldVisible('duration')}
    <div class="space-y-2">
      <Label for="duration">Duration (minutes)</Label>
      <Input
        id="duration"
        name="duration"
        type="number"
        min="5"
        max="480"
        bind:value={talk.duration}
        placeholder="45"
        class={errors.duration ? 'border-destructive' : ''}
      />
      <p class="text-sm text-muted-foreground">Estimated duration of your session</p>
      {#if errors.duration}
        <p class="text-sm text-destructive">{errors.duration}</p>
      {/if}
    </div>
  {/if}

  {#if isFieldVisible('prerequisites')}
    <div class="space-y-2">
      <Label for="prerequisites">Prerequisites</Label>
      <Textarea
        id="prerequisites"
        name="prerequisites"
        bind:value={talk.prerequisites}
        placeholder="What should attendees know before attending this session?"
        rows={3}
        class={errors.prerequisites ? 'border-destructive' : ''}
      />
      {#if errors.prerequisites}
        <p class="text-sm text-destructive">{errors.prerequisites}</p>
      {/if}
    </div>
  {/if}

  {#if isFieldVisible('requiredMaterials')}
    <div class="space-y-2">
      <Label for="requiredMaterials">Required Materials</Label>
      <Textarea
        id="requiredMaterials"
        name="requiredMaterials"
        bind:value={talk.requiredMaterials}
        placeholder="What materials or tools should attendees bring?"
        rows={3}
        class={errors.requiredMaterials ? 'border-destructive' : ''}
      />
      {#if errors.requiredMaterials}
        <p class="text-sm text-destructive">{errors.requiredMaterials}</p>
      {/if}
    </div>
  {/if}

  {#if isFieldVisible('targetAudience')}
    <div class="space-y-2">
      <Label for="targetAudience">Target Audience</Label>
      <Input
        id="targetAudience"
        name="targetAudience"
        bind:value={talk.targetAudience}
        placeholder="Who is this session for?"
        class={errors.targetAudience ? 'border-destructive' : ''}
      />
      {#if errors.targetAudience}
        <p class="text-sm text-destructive">{errors.targetAudience}</p>
      {/if}
    </div>
  {/if}

  {#if isFieldVisible('mentorRequest')}
    <div class="space-y-2">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          id="mentorRequest"
          name="mentorRequest"
          bind:checked={talk.mentorRequest}
          class="h-4 w-4"
        />
        <span class="text-sm font-medium">I would like a mentor to help prepare my talk</span>
      </label>
      <p class="ml-6 text-sm text-muted-foreground">
        We can pair you with an experienced speaker to help you prepare
      </p>
    </div>
  {/if}
</div>
