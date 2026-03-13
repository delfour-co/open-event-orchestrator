<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav, StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { getFeedbackNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import { AlertCircle, AlertTriangle, ArrowLeft, MessageSquare, Star, ThumbsUp } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const formatDate = (dateStr: string) => {
  const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateStr))
}

function renderStars(rating: number | null, max = 5): string {
  if (rating === null) return '-'
  const full = Math.round(rating)
  return Array.from({ length: max }, (_, i) => (i < full ? '\u2605' : '\u2606')).join('')
}

const STATUS_OPTIONS = ['open', 'acknowledged', 'resolved', 'closed'] as const

const openIssues = $derived(data.eventFeedback.filter((f) => f.status === 'open').length)
const problemCount = $derived(data.eventFeedback.filter((f) => f.feedbackType === 'problem').length)

const averageRating = $derived(() => {
  const rated = data.eventFeedback.filter((f) => f.numericValue !== null)
  if (rated.length === 0) return null
  const sum = rated.reduce((acc, f) => acc + (f.numericValue || 0), 0)
  return (sum / rated.length).toFixed(1)
})

function getStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return m.feedback_status_open()
    case 'acknowledged':
      return m.feedback_status_acknowledged()
    case 'resolved':
      return m.feedback_status_resolved()
    case 'closed':
      return m.feedback_status_closed()
    default:
      return status
  }
}

function getTypeLabel(type: string): string {
  return type === 'problem' ? m.feedback_type_problem() : m.feedback_type_general()
}
</script>

<svelte:head>
	<title>{m.feedback_dashboard_title({ name: data.edition.name })}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/admin/feedback">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div>
			<h2 class="text-3xl font-bold tracking-tight">{m.feedback_admin_title()}</h2>
			<p class="text-muted-foreground">{data.edition.name}</p>
		</div>
	</div>

	<!-- Navigation -->
	<AdminSubNav
		basePath="/admin/feedback/{data.edition.slug}"
		items={getFeedbackNavItems(data.edition.slug)}
	/>

	<!-- Warning if feedback not enabled -->
	{#if !data.feedbackEnabled}
		<Card.Root class="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
			<Card.Content class="flex items-center gap-3 py-4">
				<AlertTriangle class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
				<div>
					<p class="text-sm font-medium">{m.feedback_settings_not_enabled()}</p>
					<p class="text-xs text-muted-foreground">{m.feedback_settings_hint()}</p>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Stats -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
						<MessageSquare class="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{data.totalEventFeedback}</p>
						<p class="text-xs text-muted-foreground">{m.feedback_total_event_feedback()}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
						<ThumbsUp class="h-4 w-4 text-amber-600 dark:text-amber-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{averageRating() ?? '-'}</p>
						<p class="text-xs text-muted-foreground">{m.feedback_average_rating()}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/30">
						<Star class="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{openIssues}</p>
						<p class="text-xs text-muted-foreground">{m.feedback_open_issues()}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
						<AlertCircle class="h-4 w-4 text-red-600 dark:text-red-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{problemCount}</p>
						<p class="text-xs text-muted-foreground">{m.feedback_type_problem()}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Event Feedback -->
	<div class="space-y-4">
		{#if data.eventFeedback.length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<MessageSquare class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">{m.feedback_no_event_feedback()}</h3>
					<p class="text-sm text-muted-foreground">
						{m.feedback_no_event_feedback_hint()}
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			{#each data.eventFeedback as feedback}
				<Card.Root
					class={feedback.feedbackType === 'problem'
						? 'border-red-200 dark:border-red-900/50'
						: ''}
				>
					<Card.Header>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {feedback.feedbackType ===
										'problem'
											? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
											: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}"
									>
										{getTypeLabel(feedback.feedbackType)}
									</span>
									<StatusBadge status={feedback.status} size="sm" />
								</div>
								{#if feedback.numericValue}
									<div class="mt-1 text-amber-500">{renderStars(feedback.numericValue)}</div>
								{/if}
							</div>
							<p class="text-xs text-muted-foreground">{formatDate(feedback.createdAt)}</p>
						</div>
					</Card.Header>
					<Card.Content>
						<p class="whitespace-pre-wrap text-sm">{feedback.message}</p>

						<!-- Status update form -->
						<form method="POST" action="?/updateStatus" use:enhance class="mt-4">
							<input type="hidden" name="feedbackId" value={feedback.id} />
							<div class="flex flex-wrap items-center gap-2">
								<span class="text-xs text-muted-foreground"
									>{m.feedback_update_status()}:</span
								>
								{#each STATUS_OPTIONS as status}
									{#if status !== feedback.status}
										<button
											type="submit"
											name="status"
											value={status}
											class="rounded-md border px-2 py-1 text-xs transition-colors hover:bg-muted"
										>
											{getStatusLabel(status)}
										</button>
									{/if}
								{/each}
							</div>
						</form>
					</Card.Content>
				</Card.Root>
			{/each}
		{/if}
	</div>
</div>
