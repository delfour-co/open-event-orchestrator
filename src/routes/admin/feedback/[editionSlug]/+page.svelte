<script lang="ts">
import { enhance } from '$app/forms'
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  MessageSquare,
  Star,
  ThumbsUp
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let expandedSession = $state<string | null>(null)
let activeTab = $state<'sessions' | 'event'>('sessions')

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

const sessionsWithFeedback = $derived(data.sessionSummaries.filter((s) => s.totalFeedback > 0))

const overallAverage = $derived(() => {
  const rated = data.sessionSummaries.filter((s) => s.averageRating !== null)
  if (rated.length === 0) return null
  const sum = rated.reduce((acc, s) => acc + (s.averageRating || 0), 0)
  return (sum / rated.length).toFixed(1)
})

const openIssues = $derived(data.eventFeedback.filter((f) => f.status === 'open').length)

function renderStars(rating: number | null, max = 5): string {
  if (rating === null) return '-'
  const full = Math.round(rating)
  return Array.from({ length: max }, (_, i) => (i < full ? '\u2605' : '\u2606')).join('')
}

const STATUS_OPTIONS = ['open', 'acknowledged', 'resolved', 'closed'] as const

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

	<!-- Overall Stats -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
						<Star class="h-4 w-4 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{data.totalSessionFeedback}</p>
						<p class="text-xs text-muted-foreground">{m.feedback_total_session_feedback()}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
						<BarChart3 class="h-4 w-4 text-green-600 dark:text-green-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{sessionsWithFeedback.length}</p>
						<p class="text-xs text-muted-foreground">{m.feedback_sessions_with_feedback()}</p>
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
						<p class="text-2xl font-bold">{overallAverage() ?? '-'}</p>
						<p class="text-xs text-muted-foreground">{m.feedback_overall_average()}</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root>
			<Card.Content class="pt-6">
				<div class="flex items-center gap-3">
					<div class="rounded-full bg-red-100 p-2 dark:bg-red-900/30">
						<MessageSquare class="h-4 w-4 text-red-600 dark:text-red-400" />
					</div>
					<div>
						<p class="text-2xl font-bold">{data.totalEventFeedback}</p>
						<p class="text-xs text-muted-foreground">
							{m.feedback_total_event_feedback()}
							{#if openIssues > 0}
								<span class="text-red-600 dark:text-red-400">
									({openIssues} {m.feedback_status_open().toLowerCase()})
								</span>
							{/if}
						</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Tab Switcher -->
	<div class="flex gap-1 rounded-lg border bg-muted p-1">
		<button
			class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab === 'sessions' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'sessions')}
		>
			{m.feedback_tab_sessions()}
		</button>
		<button
			class="flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab === 'event' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (activeTab = 'event')}
		>
			{m.feedback_tab_event()}
		</button>
	</div>

	<!-- Session Feedback Tab -->
	{#if activeTab === 'sessions'}
		<div class="space-y-4">
			{#if sessionsWithFeedback.length === 0}
				<Card.Root>
					<Card.Content class="flex flex-col items-center justify-center py-12">
						<Star class="mb-4 h-12 w-12 text-muted-foreground" />
						<h3 class="text-lg font-semibold">{m.feedback_no_session_feedback()}</h3>
						<p class="text-sm text-muted-foreground">
							{m.feedback_no_session_feedback_hint()}
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				{#each sessionsWithFeedback as session}
					<Card.Root>
						<button
							class="w-full text-left"
							onclick={() =>
								(expandedSession =
									expandedSession === session.sessionId ? null : session.sessionId)}
						>
							<Card.Header>
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<Card.Title class="text-base">{session.title}</Card.Title>
										{#if session.speakerName}
											<Card.Description>{session.speakerName}</Card.Description>
										{/if}
									</div>
									<div class="flex items-center gap-4">
										<div class="text-right">
											<p class="text-lg font-bold text-amber-600 dark:text-amber-400">
												{session.averageRating !== null
													? session.averageRating.toFixed(1)
													: '-'}
											</p>
											<p class="text-xs text-muted-foreground">
												{m.feedback_total_responses({ count: session.totalFeedback })}
											</p>
										</div>
										<div class="text-muted-foreground">
											{#if expandedSession === session.sessionId}
												<ChevronUp class="h-5 w-5" />
											{:else}
												<ChevronDown class="h-5 w-5" />
											{/if}
										</div>
									</div>
								</div>
								<!-- Rating stars preview -->
								<div class="mt-2 text-amber-500">
									{renderStars(session.averageRating)}
								</div>
							</Card.Header>
						</button>

						{#if expandedSession === session.sessionId}
							<Card.Content class="space-y-4 border-t pt-4">
								<!-- Rating Distribution -->
								<div>
									<h4 class="mb-2 text-sm font-medium">{m.feedback_session_ratings()}</h4>
									<div class="space-y-1">
										{#each [5, 4, 3, 2, 1] as star}
											{@const count = session.ratingDistribution[star] || 0}
											{@const pct =
												session.totalFeedback > 0
													? (count / session.totalFeedback) * 100
													: 0}
											<div class="flex items-center gap-2 text-sm">
												<span class="w-8 text-right text-muted-foreground">{star}</span>
												<Star class="h-3 w-3 text-amber-500" />
												<div class="h-2 flex-1 overflow-hidden rounded-full bg-muted">
													<div
														class="h-full rounded-full bg-amber-500"
														style="width: {pct}%"
													></div>
												</div>
												<span class="w-8 text-right text-xs text-muted-foreground"
													>{count}</span
												>
											</div>
										{/each}
									</div>
								</div>

								<!-- Comments -->
								{#if session.hasComments}
									<div>
										<h4 class="mb-2 text-sm font-medium">
											<MessageCircle class="mr-1 inline h-4 w-4" />
											{m.feedback_comments({ count: session.comments.length })}
										</h4>
										<div class="space-y-2">
											{#each session.comments as feedback}
												<div class="rounded-md bg-muted/50 p-3">
													{#if feedback.rating !== null}
														<span class="text-xs text-amber-500"
															>{renderStars(feedback.rating)}</span
														>
													{/if}
													<p class="text-sm">{feedback.comment}</p>
													<p class="mt-1 text-xs text-muted-foreground">
														{formatDate(feedback.createdAt)}
													</p>
												</div>
											{/each}
										</div>
									</div>
								{/if}
							</Card.Content>
						{/if}
					</Card.Root>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- Event Feedback Tab -->
	{#if activeTab === 'event'}
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
	{/if}
</div>
