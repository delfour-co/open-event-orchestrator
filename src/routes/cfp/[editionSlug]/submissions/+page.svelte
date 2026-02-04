<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { type TalkStatus, getStatusColor, getStatusLabel } from '$lib/features/cfp/domain'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  FileText,
  Loader2,
  Mail,
  Plus,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  Users,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

let { data, form }: Props = $props()

let email = $state('')
let isRequestingAccess = $state(false)
let showWithdrawConfirm = $state<string | null>(null)
let showDeclineConfirm = $state<string | null>(null)
let showInviteForm = $state<string | null>(null)
let cospeakerEmail = $state('')

const canWithdraw = (status: string) => {
  return ['draft', 'submitted', 'under_review', 'accepted'].includes(status)
}

const canEdit = (status: string) => {
  return ['draft', 'submitted'].includes(status) && data.cfpStatus === 'open'
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
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-green-500 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950">
      <CheckCircle class="h-5 w-5 text-green-600 dark:text-green-400" />
      <p class="text-sm text-green-800 dark:text-green-200">Your talk has been submitted successfully! Check your email for the access link.</p>
    </div>
  {/if}

  {#if form?.withdrawSuccess}
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950">
      <AlertTriangle class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
      <p class="text-sm text-yellow-800 dark:text-yellow-200">{form.message}</p>
    </div>
  {/if}

  {#if form?.confirmSuccess}
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-green-500 bg-green-50 p-4 dark:border-green-700 dark:bg-green-950">
      <CheckCircle class="h-5 w-5 text-green-600 dark:text-green-400" />
      <p class="text-sm text-green-800 dark:text-green-200">{form.message}</p>
    </div>
  {/if}

  {#if form?.declineSuccess}
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-slate-500 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
      <X class="h-5 w-5 text-slate-600 dark:text-slate-400" />
      <p class="text-sm text-slate-800 dark:text-slate-200">{form.message}</p>
    </div>
  {/if}

  {#if form?.error}
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-red-500 bg-red-50 p-4 dark:border-red-700 dark:bg-red-950">
      <X class="h-5 w-5 text-red-600 dark:text-red-400" />
      <p class="text-sm text-red-800 dark:text-red-200">{form.error}</p>
    </div>
  {/if}

  {#if form?.inviteSuccess}
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-blue-500 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950">
      <UserPlus class="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <p class="text-sm text-blue-800 dark:text-blue-200">{form.message}</p>
    </div>
  {/if}

  {#if form?.cancelSuccess}
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-slate-500 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
      <X class="h-5 w-5 text-slate-600 dark:text-slate-400" />
      <p class="text-sm text-slate-800 dark:text-slate-200">{form.message}</p>
    </div>
  {/if}

  {#if form?.accessRequested}
    <div class="mb-6 flex items-center gap-3 rounded-lg border border-blue-500 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950">
      <Mail class="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <p class="text-sm text-blue-800 dark:text-blue-200">{form.message}</p>
    </div>
  {/if}

  {#if data.needsToken}
    <!-- Request access form -->
    <Card>
      <CardHeader>
        <CardTitle>Access Your Submissions</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you a secure link to view and manage your submissions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          method="POST"
          action="?/requestAccess"
          use:enhance={() => {
            isRequestingAccess = true
            return async ({ update }) => {
              isRequestingAccess = false
              await update()
            }
          }}
          class="space-y-4"
        >
          <div class="space-y-2">
            <Label for="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              bind:value={email}
              placeholder="speaker@example.com"
              required
            />
          </div>
          {#if form?.accessError}
            <p class="text-sm text-destructive">{form.accessError}</p>
          {/if}
          <Button type="submit" disabled={isRequestingAccess} class="gap-2">
            {#if isRequestingAccess}
              <Loader2 class="h-4 w-4 animate-spin" />
              Sending...
            {:else}
              <Mail class="h-4 w-4" />
              Send Access Link
            {/if}
          </Button>
        </form>
      </CardContent>
    </Card>

    <div class="mt-8 text-center">
      <p class="text-sm text-muted-foreground">
        Don't have any submissions yet?
      </p>
      <a href="/cfp/{data.edition.slug}/submit" class="mt-2 inline-block">
        <Button variant="outline" class="gap-2">
          <Plus class="h-4 w-4" />
          Submit a Talk
        </Button>
      </a>
    </div>
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
                    class={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[getStatusColor(talk.status as TalkStatus)]}`}
                  >
                    {getStatusLabel(talk.status as TalkStatus)}
                  </span>
                </div>
              </CardHeader>
              <CardContent class="space-y-4">
                <p class="text-sm text-muted-foreground">{talk.abstract}</p>

                <!-- Co-speakers section -->
                {#if data.allowCoSpeakers && (talk.coSpeakers.length > 0 || talk.coSpeakerInvitations.length > 0 || ['draft', 'submitted'].includes(talk.status))}
                  <div class="rounded-lg border p-4">
                    <div class="mb-3 flex items-center justify-between">
                      <h4 class="flex items-center gap-2 text-sm font-medium">
                        <Users class="h-4 w-4" />
                        Co-Speakers
                      </h4>
                      {#if ['draft', 'submitted'].includes(talk.status) && data.cfpStatus === 'open'}
                        <Button
                          variant="ghost"
                          size="sm"
                          class="gap-1 text-xs"
                          onclick={() => {
                            showInviteForm = showInviteForm === talk.id ? null : talk.id
                            cospeakerEmail = ''
                          }}
                        >
                          <UserPlus class="h-3 w-3" />
                          Invite
                        </Button>
                      {/if}
                    </div>

                    <!-- Current co-speakers -->
                    {#if talk.coSpeakers.length > 0}
                      <div class="space-y-2">
                        {#each talk.coSpeakers as cospeaker}
                          <div class="flex items-center gap-2 text-sm">
                            <div class="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {cospeaker.firstName[0]}{cospeaker.lastName[0]}
                            </div>
                            <span>{cospeaker.firstName} {cospeaker.lastName}</span>
                            <span class="text-muted-foreground">({cospeaker.email})</span>
                          </div>
                        {/each}
                      </div>
                    {/if}

                    <!-- Pending invitations -->
                    {#if talk.coSpeakerInvitations.length > 0}
                      <div class="mt-2 space-y-2">
                        {#each talk.coSpeakerInvitations as invitation}
                          <div class="flex items-center justify-between rounded border border-dashed p-2 text-sm">
                            <div class="flex items-center gap-2">
                              <Clock class="h-4 w-4 text-yellow-500" />
                              <span class="text-muted-foreground">{invitation.email}</span>
                              <span class="rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Pending
                              </span>
                            </div>
                            <form method="POST" action="?/cancelCospeakerInvitation" use:enhance>
                              <input type="hidden" name="invitationId" value={invitation.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                class="h-6 w-6 text-muted-foreground hover:text-destructive"
                                title="Cancel invitation"
                              >
                                <X class="h-3 w-3" />
                              </Button>
                            </form>
                          </div>
                        {/each}
                      </div>
                    {/if}

                    <!-- Invite form -->
                    {#if showInviteForm === talk.id}
                      <form
                        method="POST"
                        action="?/inviteCospeaker"
                        use:enhance={() => {
                          return async ({ update }) => {
                            await update()
                            if (!form?.inviteError) {
                              showInviteForm = null
                              cospeakerEmail = ''
                            }
                          }
                        }}
                        class="mt-3 space-y-2 border-t pt-3"
                      >
                        <input type="hidden" name="talkId" value={talk.id} />
                        <div class="flex gap-2">
                          <Input
                            type="email"
                            name="cospeakerEmail"
                            placeholder="Co-speaker email"
                            bind:value={cospeakerEmail}
                            class="flex-1 text-sm"
                            required
                          />
                          <Button type="submit" size="sm">Send Invite</Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onclick={() => {
                              showInviteForm = null
                              cospeakerEmail = ''
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                        {#if form?.inviteError}
                          <p class="text-sm text-destructive">{form.inviteError}</p>
                        {/if}
                      </form>
                    {/if}

                    {#if talk.coSpeakers.length === 0 && talk.coSpeakerInvitations.length === 0 && showInviteForm !== talk.id}
                      <p class="text-sm text-muted-foreground">No co-speakers yet. Invite someone to collaborate!</p>
                    {/if}
                  </div>
                {/if}

                <!-- Action buttons based on status -->
                {#if talk.status === 'accepted'}
                  <div class="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                    <p class="mb-3 text-sm font-medium text-green-800 dark:text-green-200">
                      Congratulations! Your talk has been accepted. Please confirm your participation.
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <form method="POST" action="?/confirm" use:enhance>
                        <input type="hidden" name="talkId" value={talk.id} />
                        <Button type="submit" size="sm" class="gap-2 bg-green-600 hover:bg-green-700">
                          <ThumbsUp class="h-4 w-4" />
                          Confirm Participation
                        </Button>
                      </form>
                      {#if showDeclineConfirm === talk.id}
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-muted-foreground">Are you sure?</span>
                          <form method="POST" action="?/decline" use:enhance>
                            <input type="hidden" name="talkId" value={talk.id} />
                            <Button type="submit" variant="destructive" size="sm">Yes, Decline</Button>
                          </form>
                          <Button
                            variant="outline"
                            size="sm"
                            onclick={() => (showDeclineConfirm = null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      {:else}
                        <Button
                          variant="outline"
                          size="sm"
                          class="gap-2"
                          onclick={() => (showDeclineConfirm = talk.id)}
                        >
                          <ThumbsDown class="h-4 w-4" />
                          Decline
                        </Button>
                      {/if}
                    </div>
                  </div>
                {/if}

                <!-- Edit and Withdraw buttons -->
                {#if canEdit(talk.status) || canWithdraw(talk.status)}
                  <div class="flex flex-wrap gap-2 border-t pt-4">
                    {#if canEdit(talk.status)}
                      <a href="/cfp/{data.edition.slug}/submissions/{talk.id}/edit?token={data.token}">
                        <Button variant="outline" size="sm" class="gap-2">
                          <Edit class="h-4 w-4" />
                          Edit
                        </Button>
                      </a>
                    {/if}

                    {#if canWithdraw(talk.status)}
                      {#if showWithdrawConfirm === talk.id}
                        <div class="flex items-center gap-2">
                          <span class="text-sm text-muted-foreground">Withdraw this talk?</span>
                          <form method="POST" action="?/withdraw" use:enhance>
                            <input type="hidden" name="talkId" value={talk.id} />
                            <Button type="submit" variant="destructive" size="sm">
                              Yes, Withdraw
                            </Button>
                          </form>
                          <Button
                            variant="outline"
                            size="sm"
                            onclick={() => (showWithdrawConfirm = null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      {:else}
                        <Button
                          variant="ghost"
                          size="sm"
                          class="gap-2 text-muted-foreground hover:text-destructive"
                          onclick={() => (showWithdrawConfirm = talk.id)}
                        >
                          <X class="h-4 w-4" />
                          Withdraw
                        </Button>
                      {/if}
                    {/if}
                  </div>
                {/if}
              </CardContent>
            </Card>
          {/each}
        </div>

        {#if data.cfpStatus === 'open'}
          <div class="text-center">
            <a href="/cfp/{data.edition.slug}/submit">
              <Button variant="outline" class="gap-2">
                <Plus class="h-4 w-4" />
                Submit Another Talk
              </Button>
            </a>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <!-- Invalid or expired token -->
    <Card>
      <CardContent class="py-12 text-center">
        <X class="mx-auto h-12 w-12 text-red-500" />
        <h3 class="mt-4 text-lg font-medium">Invalid or Expired Link</h3>
        <p class="mt-2 text-sm text-muted-foreground">
          This access link is invalid or has expired. Please request a new one.
        </p>
        <a href="/cfp/{data.edition.slug}/submissions" class="mt-4 inline-block">
          <Button class="gap-2">
            <Mail class="h-4 w-4" />
            Request New Access Link
          </Button>
        </a>
      </CardContent>
    </Card>
  {/if}
</div>
