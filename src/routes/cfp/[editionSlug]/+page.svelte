<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { AlertCircle, Calendar, CalendarClock, Clock, MapPin } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

let { data }: Props = $props()

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

const formatShortDate = (date: Date | null) => {
  if (!date) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const getDaysRemaining = (closeDate: Date | null) => {
  if (!closeDate) return null
  const now = new Date()
  const diff = closeDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const daysRemaining = $derived(getDaysRemaining(data.cfpCloseDate))
</script>

<div class="mx-auto max-w-3xl space-y-8">
  <!-- Hero -->
  <div class="text-center">
    <h1 class="text-4xl font-bold tracking-tight">{data.edition.name}</h1>
    <p class="mt-2 text-xl text-muted-foreground">Call for Papers</p>
  </div>

  <!-- CFP Status Banner -->
  {#if data.cfpStatus === 'not_open_yet'}
    <div class="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
      <div class="flex items-start gap-3">
        <CalendarClock class="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
        <div>
          <p class="font-medium text-blue-800 dark:text-blue-200">CFP Opens Soon</p>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            The Call for Papers will open on {formatShortDate(data.cfpOpenDate)}.
          </p>
        </div>
      </div>
    </div>
  {:else if data.cfpStatus === 'closed'}
    <div class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
      <div class="flex items-start gap-3">
        <AlertCircle class="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
        <div>
          <p class="font-medium text-red-800 dark:text-red-200">CFP Closed</p>
          <p class="text-sm text-red-700 dark:text-red-300">
            The Call for Papers closed on {formatShortDate(data.cfpCloseDate)}. Thank you to all who submitted!
          </p>
        </div>
      </div>
    </div>
  {:else if daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0}
    <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
      <div class="flex items-start gap-3">
        <AlertCircle class="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <div>
          <p class="font-medium text-yellow-800 dark:text-yellow-200">CFP Closing Soon!</p>
          <p class="text-sm text-yellow-700 dark:text-yellow-300">
            Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left to submit your proposal. Deadline: {formatShortDate(data.cfpCloseDate)}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Intro Text -->
  {#if data.introText}
    <Card>
      <CardContent class="pt-6">
        <p class="whitespace-pre-wrap">{data.introText}</p>
      </CardContent>
    </Card>
  {/if}

  <!-- CFP Timeline -->
  {#if data.cfpOpenDate || data.cfpCloseDate}
    <Card>
      <CardHeader>
        <CardTitle>CFP Timeline</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        {#if data.cfpOpenDate}
          <div class="flex items-center gap-3">
            <CalendarClock class="h-5 w-5 text-muted-foreground" />
            <span>
              <strong>Opens:</strong>
              {formatShortDate(data.cfpOpenDate)}
            </span>
          </div>
        {/if}
        {#if data.cfpCloseDate}
          <div class="flex items-center gap-3">
            <CalendarClock class="h-5 w-5 text-muted-foreground" />
            <span>
              <strong>Closes:</strong>
              {formatShortDate(data.cfpCloseDate)}
            </span>
          </div>
        {/if}
      </CardContent>
    </Card>
  {/if}

  <!-- Event Info -->
  <Card>
    <CardHeader>
      <CardTitle>Event Details</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center gap-3">
        <Calendar class="h-5 w-5 text-muted-foreground" />
        <span>
          {formatDate(data.edition.startDate)}
          {#if data.edition.endDate.getTime() !== data.edition.startDate.getTime()}
            - {formatDate(data.edition.endDate)}
          {/if}
        </span>
      </div>

      {#if data.edition.venue || data.edition.city}
        <div class="flex items-center gap-3">
          <MapPin class="h-5 w-5 text-muted-foreground" />
          <span>
            {[data.edition.venue, data.edition.city, data.edition.country]
              .filter(Boolean)
              .join(', ')}
          </span>
        </div>
      {/if}
    </CardContent>
  </Card>

  <!-- Categories -->
  {#if data.categories.length > 0}
    <Card>
      <CardHeader>
        <CardTitle>Categories</CardTitle>
        <CardDescription>We're looking for talks in the following topics</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-2">
          {#each data.categories as category}
            <span
              class="rounded-full px-3 py-1 text-sm font-medium"
              style={category.color
                ? `background-color: ${category.color}20; color: ${category.color}`
                : ''}
            >
              {category.name}
            </span>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- Formats -->
  {#if data.formats.length > 0}
    <Card>
      <CardHeader>
        <CardTitle>Talk Formats</CardTitle>
        <CardDescription>Available session types</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-2">
          {#each data.formats as format}
            <div class="flex items-start gap-3 rounded-lg border p-4">
              <Clock class="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p class="font-medium">{format.name}</p>
                <p class="text-sm text-muted-foreground">{format.duration} minutes</p>
                {#if format.description}
                  <p class="mt-1 text-sm">{format.description}</p>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </CardContent>
    </Card>
  {/if}

  <!-- CTA -->
  <div class="text-center">
    {#if data.cfpStatus === 'open'}
      <a href="/cfp/{data.edition.slug}/submit">
        <Button size="lg" class="gap-2">Submit a Talk</Button>
      </a>
    {:else if data.cfpStatus === 'not_open_yet'}
      <Button size="lg" disabled class="gap-2">CFP Not Yet Open</Button>
    {:else}
      <Button size="lg" disabled class="gap-2">CFP Closed</Button>
    {/if}
  </div>
</div>
