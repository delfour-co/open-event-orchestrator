<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { talkStatusSchema } from '$lib/features/cfp/domain'
import { StatusBadge } from '$lib/features/cfp/ui'
import { ArrowLeft, Check, ExternalLink, Mail, MapPin, Trash2, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showDeleteConfirm = $state(false)

const allStatuses = talkStatusSchema.options

function formatDate(date: Date | undefined): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function getLevelLabel(level: string | undefined): string {
  if (!level) return '-'
  const labels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced'
  }
  return labels[level] || level
}

function getLanguageLabel(lang: string): string {
  const labels: Record<string, string> = {
    fr: 'French',
    en: 'English'
  }
  return labels[lang] || lang
}
</script>

<svelte:head>
  <title>{data.talk.title} - CFP - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-start justify-between">
    <div class="flex items-start gap-4">
      <a href="/admin/cfp/{data.edition.slug}/submissions">
        <Button variant="ghost" size="icon" class="mt-1">
          <ArrowLeft class="h-4 w-4" />
        </Button>
      </a>
      <div>
        <div class="mb-2 flex items-center gap-3">
          <h2 class="text-3xl font-bold tracking-tight">{data.talk.title}</h2>
          <StatusBadge status={data.talk.status} />
        </div>
        <p class="text-muted-foreground">{data.edition.name}</p>
      </div>
    </div>

    <Button variant="destructive" size="sm" onclick={() => (showDeleteConfirm = true)}>
      <Trash2 class="mr-2 h-4 w-4" />
      Delete
    </Button>
  </div>

  {#if form?.error}
    <div class="rounded-lg border border-destructive bg-destructive/10 p-4">
      <p class="text-sm text-destructive">{form.error}</p>
    </div>
  {/if}

  {#if form?.success}
    <div class="rounded-lg border border-green-500 bg-green-500/10 p-4">
      <p class="text-sm text-green-700 dark:text-green-400">{form.message}</p>
    </div>
  {/if}

  <!-- Delete Confirmation -->
  {#if showDeleteConfirm}
    <Card.Root class="border-destructive">
      <Card.Content class="flex items-center justify-between py-4">
        <div>
          <p class="font-medium">Are you sure you want to delete this talk?</p>
          <p class="text-sm text-muted-foreground">This action cannot be undone.</p>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onclick={() => (showDeleteConfirm = false)}>Cancel</Button>
          <form method="POST" action="?/delete" use:enhance>
            <Button type="submit" variant="destructive">Delete</Button>
          </form>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Main Content -->
    <div class="space-y-6 lg:col-span-2">
      <!-- Talk Details -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Talk Details</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-6">
          <div>
            <h4 class="mb-2 text-sm font-medium text-muted-foreground">Abstract</h4>
            <p class="whitespace-pre-wrap">{data.talk.abstract}</p>
          </div>

          {#if data.talk.description}
            <div>
              <h4 class="mb-2 text-sm font-medium text-muted-foreground">Description</h4>
              <p class="whitespace-pre-wrap">{data.talk.description}</p>
            </div>
          {/if}

          {#if data.talk.notes}
            <div>
              <h4 class="mb-2 text-sm font-medium text-muted-foreground">Notes for Organizers</h4>
              <p class="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
                {data.talk.notes}
              </p>
            </div>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Speaker(s) -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Speaker{data.speakers.length > 1 ? 's' : ''}</Card.Title>
        </Card.Header>
        <Card.Content>
          <div class="space-y-6">
            {#each data.speakers as speaker}
              <div class="flex gap-4">
                <div
                  class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-semibold"
                >
                  {speaker.firstName[0]}{speaker.lastName[0]}
                </div>
                <div class="flex-1 space-y-2">
                  <div>
                    <h4 class="font-semibold">{speaker.firstName} {speaker.lastName}</h4>
                    {#if speaker.jobTitle || speaker.company}
                      <p class="text-sm text-muted-foreground">
                        {#if speaker.jobTitle}{speaker.jobTitle}{/if}
                        {#if speaker.jobTitle && speaker.company} at {/if}
                        {#if speaker.company}{speaker.company}{/if}
                      </p>
                    {/if}
                  </div>

                  <div class="flex flex-wrap gap-4 text-sm">
                    <a
                      href="mailto:{speaker.email}"
                      class="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Mail class="h-4 w-4" />
                      {speaker.email}
                    </a>

                    {#if speaker.city || speaker.country}
                      <span class="flex items-center gap-1 text-muted-foreground">
                        <MapPin class="h-4 w-4" />
                        {[speaker.city, speaker.country].filter(Boolean).join(', ')}
                      </span>
                    {/if}
                  </div>

                  {#if speaker.twitter || speaker.github || speaker.linkedin}
                    <div class="flex gap-3">
                      {#if speaker.twitter}
                        <a
                          href="https://twitter.com/{speaker.twitter}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-sm text-muted-foreground hover:text-foreground"
                        >
                          @{speaker.twitter}
                        </a>
                      {/if}
                      {#if speaker.github}
                        <a
                          href="https://github.com/{speaker.github}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink class="h-3 w-3" />
                          GitHub
                        </a>
                      {/if}
                      {#if speaker.linkedin}
                        <a
                          href="https://linkedin.com/in/{speaker.linkedin}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink class="h-3 w-3" />
                          LinkedIn
                        </a>
                      {/if}
                    </div>
                  {/if}

                  {#if speaker.bio}
                    <p class="text-sm text-muted-foreground">{speaker.bio}</p>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Sidebar -->
    <div class="space-y-6">
      <!-- Status Actions -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Status</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">Current:</span>
            <StatusBadge status={data.talk.status} />
          </div>

          <form method="POST" action="?/updateStatus" use:enhance class="space-y-2">
            <p class="text-sm font-medium">Quick Actions</p>
            <div class="flex flex-wrap gap-2">
              {#if data.talk.status === 'submitted'}
                <Button type="submit" name="status" value="under_review" variant="outline" size="sm">
                  Start Review
                </Button>
              {/if}
              {#if ['submitted', 'under_review'].includes(data.talk.status)}
                <Button
                  type="submit"
                  name="status"
                  value="accepted"
                  variant="outline"
                  size="sm"
                  class="text-green-600"
                >
                  <Check class="mr-1 h-3 w-3" />
                  Accept
                </Button>
                <Button
                  type="submit"
                  name="status"
                  value="rejected"
                  variant="outline"
                  size="sm"
                  class="text-red-600"
                >
                  <X class="mr-1 h-3 w-3" />
                  Reject
                </Button>
              {/if}
            </div>

            <div class="pt-2">
              <p class="mb-2 text-sm font-medium">Change Status</p>
              <div class="flex flex-wrap gap-1">
                {#each allStatuses as status}
                  <Button
                    type="submit"
                    name="status"
                    value={status}
                    variant={data.talk.status === status ? 'secondary' : 'ghost'}
                    size="sm"
                    class="text-xs"
                    disabled={data.talk.status === status}
                  >
                    {status}
                  </Button>
                {/each}
              </div>
            </div>
          </form>
        </Card.Content>
      </Card.Root>

      <!-- Metadata -->
      <Card.Root>
        <Card.Header>
          <Card.Title>Information</Card.Title>
        </Card.Header>
        <Card.Content>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Category</dt>
              <dd class="font-medium">{data.talk.category?.name || '-'}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Format</dt>
              <dd class="font-medium">{data.talk.format?.name || '-'}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Language</dt>
              <dd class="font-medium">{getLanguageLabel(data.talk.language)}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted-foreground">Level</dt>
              <dd class="font-medium">{getLevelLabel(data.talk.level)}</dd>
            </div>
            <div class="border-t pt-3">
              <dt class="mb-1 text-muted-foreground">Submitted</dt>
              <dd class="font-medium">{formatDate(data.talk.submittedAt)}</dd>
            </div>
            <div>
              <dt class="mb-1 text-muted-foreground">Created</dt>
              <dd class="font-medium">{formatDate(data.talk.createdAt)}</dd>
            </div>
          </dl>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
