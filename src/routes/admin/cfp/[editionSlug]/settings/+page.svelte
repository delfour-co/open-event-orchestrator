<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { Loader2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

const statuses = ['draft', 'published', 'archived'] as const

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}
</script>

<svelte:head>
  <title>CFP Settings - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Status Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>CFP Status</Card.Title>
      <Card.Description>
        Control whether this CFP is visible to speakers and accepting submissions
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground">Current status:</span>
        <span
          class="rounded-full px-3 py-1 text-sm font-medium {getStatusColor(data.edition.status)}"
        >
          {data.edition.status}
        </span>
      </div>
      <div class="mt-4 flex items-center gap-2">
        <span class="mr-2 text-sm text-muted-foreground">Change to:</span>
        {#each statuses as status}
          <form
            method="POST"
            action="?/updateStatus"
            use:enhance={() => {
              return async ({ update }) => {
                await update()
                await invalidateAll()
              }
            }}
            class="inline"
          >
            <input type="hidden" name="status" value={status} />
            <Button
              type="submit"
              variant={data.edition.status === status ? 'default' : 'outline'}
              size="sm"
              disabled={data.edition.status === status}
            >
              {status}
            </Button>
          </form>
        {/each}
      </div>
      <p class="mt-3 text-xs text-muted-foreground">
        <strong>Draft:</strong> CFP not visible, no submissions allowed.
        <strong>Published:</strong> CFP open for submissions.
        <strong>Archived:</strong> CFP closed, submissions preserved.
      </p>
    </Card.Content>
  </Card.Root>

  <!-- General Settings Card -->
  <Card.Root>
  <Card.Header>
    <Card.Title>General Settings</Card.Title>
    <Card.Description>Configure the basic CFP settings for {data.edition.name}</Card.Description>
  </Card.Header>
  <Card.Content>
    {#if form?.error}
      <div class="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
        <p class="text-sm text-destructive">{form.error}</p>
      </div>
    {/if}

    {#if form?.success}
      <div class="mb-6 rounded-lg border border-green-500 bg-green-500/10 p-4">
        <p class="text-sm text-green-700 dark:text-green-400">{form.message}</p>
      </div>
    {/if}

    <form
      method="POST"
      action="?/updateSettings"
      use:enhance={() => {
        isSubmitting = true
        return async ({ update }) => {
          isSubmitting = false
          await update()
        }
      }}
      class="space-y-6"
    >
      <!-- Dates -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="cfpOpenDate">CFP Open Date</Label>
          <Input
            id="cfpOpenDate"
            name="cfpOpenDate"
            type="date"
            value={formatDateForInput(data.settings.cfpOpenDate)}
          />
          <p class="text-xs text-muted-foreground">When speakers can start submitting talks</p>
        </div>

        <div class="space-y-2">
          <Label for="cfpCloseDate">CFP Close Date</Label>
          <Input
            id="cfpCloseDate"
            name="cfpCloseDate"
            type="date"
            value={formatDateForInput(data.settings.cfpCloseDate)}
          />
          <p class="text-xs text-muted-foreground">Deadline for talk submissions</p>
        </div>
      </div>

      <!-- Introduction Text -->
      <div class="space-y-2">
        <Label for="introText">Introduction Text</Label>
        <Textarea
          id="introText"
          name="introText"
          rows={4}
          value={data.settings.introText}
          placeholder="Welcome message for speakers..."
        />
        <p class="text-xs text-muted-foreground">
          This text will be displayed on the CFP submission page
        </p>
      </div>

      <!-- Submission Limits -->
      <div class="space-y-2">
        <Label for="maxSubmissions">Max Submissions per Speaker</Label>
        <Input
          id="maxSubmissions"
          name="maxSubmissionsPerSpeaker"
          type="number"
          min="1"
          max="10"
          value={String(data.settings.maxSubmissionsPerSpeaker)}
          class="w-24"
        />
      </div>

      <!-- Form Options -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium">Form Options</h4>

        <div class="space-y-3">
          <label class="flex items-center gap-3">
            <Checkbox checked={data.settings.requireAbstract} name="requireAbstract" />
            <span class="text-sm">Require abstract</span>
          </label>

          <label class="flex items-center gap-3">
            <Checkbox checked={data.settings.requireDescription} name="requireDescription" />
            <span class="text-sm">Require detailed description</span>
          </label>

          <label class="flex items-center gap-3">
            <Checkbox checked={data.settings.allowCoSpeakers} name="allowCoSpeakers" />
            <span class="text-sm">Allow co-speakers</span>
          </label>

          <label class="flex items-center gap-3">
            <Checkbox checked={data.settings.anonymousReview} name="anonymousReview" />
            <span class="text-sm">Anonymous review (hide speaker names from reviewers)</span>
          </label>
        </div>
      </div>

      <div class="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Saving...
          {:else}
            Save Settings
          {/if}
        </Button>
      </div>
    </form>
  </Card.Content>
</Card.Root>
</div>
