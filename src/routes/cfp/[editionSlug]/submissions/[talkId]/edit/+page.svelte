<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { SpeakerForm, TalkForm } from '$lib/features/cfp/ui'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, Loader2 } from 'lucide-svelte'
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
  firstName: data.speaker.firstName,
  lastName: data.speaker.lastName,
  email: data.speaker.email,
  bio: data.speaker.bio || '',
  company: data.speaker.company || '',
  jobTitle: data.speaker.jobTitle || '',
  city: data.speaker.city || '',
  country: data.speaker.country || '',
  twitter: data.speaker.twitter || '',
  github: data.speaker.github || '',
  linkedin: data.speaker.linkedin || ''
})

let talk: TalkFormData = $state({
  title: data.talk.title,
  abstract: data.talk.abstract,
  description: data.talk.description || '',
  language: data.talk.language || '',
  level: data.talk.level || '',
  categoryId: data.talk.categoryId || '',
  formatId: data.talk.formatId || '',
  notes: data.talk.notes || ''
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
  <div class="mb-8">
    <a
      href="/cfp/{data.edition.slug}/submissions?token={data.token}"
      class="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft class="h-4 w-4" />
      {m.cfp_edit_back()}
    </a>
    <div class="text-center">
      <h1 class="text-3xl font-bold">{m.cfp_edit_title()}</h1>
      <p class="mt-2 text-muted-foreground">{data.edition.name}</p>
    </div>
  </div>

  {#if form?.error}
    <div class="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
      <p class="text-sm text-destructive">{form.error}</p>
    </div>
  {/if}

  <form
    method="POST"
    action="?/update"
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
          <CardTitle>{m.cfp_submit_about_you()}</CardTitle>
          <CardDescription>{m.cfp_edit_about_you_hint()}</CardDescription>
        </CardHeader>
        <CardContent>
          <SpeakerForm bind:speaker errors={form?.speakerErrors} emailReadonly />
        </CardContent>
      </Card>

      <!-- Talk Section -->
      <Card>
        <CardHeader>
          <CardTitle>{m.cfp_submit_your_talk()}</CardTitle>
          <CardDescription>{m.cfp_edit_your_talk_hint()}</CardDescription>
        </CardHeader>
        <CardContent>
          <TalkForm
            bind:talk
            categories={data.categories}
            formats={data.formats}
            fieldConditionRules={data.fieldConditionRules}
            errors={form?.talkErrors}
          />
        </CardContent>
      </Card>

      <!-- Submit -->
      <div class="flex justify-end gap-4">
        <a href="/cfp/{data.edition.slug}/submissions?token={data.token}">
          <Button variant="outline" type="button">{m.action_cancel()}</Button>
        </a>
        <Button type="submit" disabled={isSubmitting}>
          {#if isSubmitting}
            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
            {m.cfp_edit_saving()}
          {:else}
            {m.cfp_edit_save_changes()}
          {/if}
        </Button>
      </div>
    </div>
  </form>
</div>
