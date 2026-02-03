<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Calendar, Clock, MapPin } from 'lucide-svelte'
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
</script>

<div class="mx-auto max-w-3xl space-y-8">
  <!-- Hero -->
  <div class="text-center">
    <h1 class="text-4xl font-bold tracking-tight">{data.edition.name}</h1>
    <p class="mt-2 text-xl text-muted-foreground">Call for Papers</p>
  </div>

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
    <a href="/cfp/{data.edition.slug}/submit">
      <Button size="lg" class="gap-2">Submit a Talk</Button>
    </a>
  </div>
</div>
