<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { SpeakerForm, TalkForm } from '$lib/features/cfp/ui'
import { Loader2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface SpeakerFormData {
  firstName?: string
  lastName?: string
  email?: string
  bio?: string
  company?: string
  jobTitle?: string
  city?: string
  country?: string
  twitter?: string
  github?: string
  linkedin?: string
}

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
  data: PageData
  form: ActionData
}

let { data, form }: Props = $props()

let speaker: SpeakerFormData = $state({
  firstName: '',
  lastName: '',
  email: '',
  bio: '',
  company: '',
  jobTitle: '',
  city: '',
  country: '',
  twitter: '',
  github: '',
  linkedin: ''
})
let talk: TalkFormData = $state({
  title: '',
  abstract: '',
  description: '',
  language: '',
  level: '',
  categoryId: '',
  formatId: '',
  notes: ''
})
let isSubmitting = $state(false)

$effect(() => {
  if (form?.speaker) {
    speaker = { ...form.speaker }
  }
  if (form?.talk) {
    talk = { ...form.talk }
  }
})
</script>

<div class="mx-auto max-w-3xl">
  <div class="mb-8 text-center">
    <h1 class="text-3xl font-bold">Submit a Talk</h1>
    <p class="mt-2 text-muted-foreground">{data.edition.name}</p>
  </div>

  {#if form?.error}
    <div class="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
      <p class="text-sm text-destructive">{form.error}</p>
    </div>
  {/if}

  <form
    method="POST"
    action="?/submit"
    use:enhance={() => {
      isSubmitting = true
      return async ({ update }) => {
        isSubmitting = false
        await update()
      }
    }}
  >
    <div class="space-y-8">
      <!-- Speaker Section -->
      <Card>
        <CardHeader>
          <CardTitle>About You</CardTitle>
          <CardDescription>
            Tell us about yourself so attendees can learn more about you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpeakerForm bind:speaker errors={form?.speakerErrors} />
        </CardContent>
      </Card>

      <!-- Talk Section -->
      <Card>
        <CardHeader>
          <CardTitle>Your Talk</CardTitle>
          <CardDescription>Describe the talk you'd like to present</CardDescription>
        </CardHeader>
        <CardContent>
          <TalkForm
            bind:talk
            categories={data.categories}
            formats={data.formats}
            errors={form?.talkErrors}
          />
        </CardContent>
      </Card>

      <!-- Submit -->
      <div class="flex justify-end gap-4">
        <a href="/cfp/{data.edition.slug}">
          <Button variant="outline" type="button">Cancel</Button>
        </a>
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          {:else}
            Submit Talk
          {/if}
        </Button>
      </div>
    </div>
  </form>
</div>
