<script lang="ts">
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { getStatusColor, getStatusLabel } from '$lib/features/cfp/domain'
import { CheckCircle, FileText, Plus } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

let { data }: Props = $props()

let email = $state('')

const handleEmailSubmit = (e: Event) => {
  e.preventDefault()
  if (email) {
    goto(`/cfp/${data.edition.slug}/submissions?email=${encodeURIComponent(email)}`)
  }
}

const statusColors: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  orange: 'bg-orange-100 text-orange-800',
  slate: 'bg-slate-100 text-slate-800'
}
</script>

<div class="mx-auto max-w-3xl">
  <div class="mb-8 text-center">
    <h1 class="text-3xl font-bold">My Submissions</h1>
    <p class="mt-2 text-muted-foreground">{data.edition.name}</p>
  </div>

  {#if data.success}
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-green-500 bg-green-50 p-4">
      <CheckCircle class="h-5 w-5 text-green-600" />
      <p class="text-sm text-green-800">Your talk has been submitted successfully!</p>
    </div>
  {/if}

  {#if data.needsEmail}
    <!-- Email lookup form -->
    <Card>
      <CardHeader>
        <CardTitle>Find Your Submissions</CardTitle>
        <CardDescription>Enter your email address to view your submissions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onsubmit={handleEmailSubmit} class="space-y-4">
          <div class="space-y-2">
            <Label for="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              bind:value={email}
              placeholder="john@example.com"
              required
            />
          </div>
          <Button type="submit">View Submissions</Button>
        </form>
      </CardContent>
    </Card>
  {:else if data.speaker}
    <!-- Speaker info and talks -->
    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {data.speaker.firstName}
            {data.speaker.lastName}
          </CardTitle>
          <CardDescription>{data.speaker.email}</CardDescription>
        </CardHeader>
      </Card>

      {#if data.talks.length === 0}
        <Card>
          <CardContent class="py-12 text-center">
            <FileText class="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 class="mt-4 text-lg font-medium">No submissions yet</h3>
            <p class="mt-2 text-sm text-muted-foreground">
              You haven't submitted any talks for this edition.
            </p>
            <a href="/cfp/{data.edition.slug}/submit" class="mt-4 inline-block">
              <Button class="gap-2">
                <Plus class="h-4 w-4" />
                Submit a Talk
              </Button>
            </a>
          </CardContent>
        </Card>
      {:else}
        <div class="space-y-4">
          {#each data.talks as talk}
            <Card>
              <CardHeader>
                <div class="flex items-start justify-between">
                  <div>
                    <CardTitle class="text-lg">{talk.title}</CardTitle>
                    <CardDescription class="mt-1">
                      Submitted on {new Intl.DateTimeFormat('en-US', {
                        dateStyle: 'medium'
                      }).format(talk.submittedAt ?? talk.createdAt)}
                    </CardDescription>
                  </div>
                  <span
                    class={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[getStatusColor(talk.status)]}`}
                  >
                    {getStatusLabel(talk.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p class="text-sm text-muted-foreground">{talk.abstract}</p>
              </CardContent>
            </Card>
          {/each}
        </div>

        <div class="text-center">
          <a href="/cfp/{data.edition.slug}/submit">
            <Button variant="outline" class="gap-2">
              <Plus class="h-4 w-4" />
              Submit Another Talk
            </Button>
          </a>
        </div>
      {/if}
    </div>
  {:else}
    <!-- No speaker found -->
    <Card>
      <CardContent class="py-12 text-center">
        <FileText class="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 class="mt-4 text-lg font-medium">No submissions found</h3>
        <p class="mt-2 text-sm text-muted-foreground">
          We couldn't find any submissions for this email address.
        </p>
        <a href="/cfp/{data.edition.slug}/submit" class="mt-4 inline-block">
          <Button class="gap-2">
            <Plus class="h-4 w-4" />
            Submit a Talk
          </Button>
        </a>
      </CardContent>
    </Card>
  {/if}
</div>
