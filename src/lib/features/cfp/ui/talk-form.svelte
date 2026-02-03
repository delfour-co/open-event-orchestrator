<script lang="ts">
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Textarea } from '$lib/components/ui/textarea'
import type { Category, Format, Language, TalkLevel } from '../domain'

interface TalkFormData {
  title?: string
  abstract?: string
  description?: string
  language?: string
  level?: string
  categoryId?: string
  formatId?: string
  notes?: string
}

interface Props {
  talk: TalkFormData
  categories: Category[]
  formats: Format[]
  errors?: Record<string, string>
}

let { talk = $bindable({}), categories, formats, errors = {} }: Props = $props()

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

    <div class="space-y-2">
      <Label for="level">Level</Label>
      <Select id="level" name="level" bind:value={talk.level}>
        <option value="">Select a level</option>
        {#each levels as lvl}
          <option value={lvl.value}>{lvl.label}</option>
        {/each}
      </Select>
    </div>
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
</div>
