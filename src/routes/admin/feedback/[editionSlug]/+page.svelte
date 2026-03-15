<script lang="ts">
import { page } from '$app/stores'
import { AdminSubNav, formatDateTime } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { getFeedbackNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
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
let copied = $state(false)

const speakerFeedbackPath = $derived(`/cfp/${data.edition.slug}/submissions`)

async function copySpeakerUrl(): Promise<void> {
  await navigator.clipboard.writeText(`${$page.url.origin}${speakerFeedbackPath}`)
  copied = true
  setTimeout(() => {
    copied = false
  }, 2000)
}

const formatDate = (dateStr: string) => formatDateTime(dateStr)

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
</script>

<svelte:head>
	<title>{m.feedback_dashboard_title({ name: data.edition.name })}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
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
		<!-- Speaker Feedback URL -->
		<div class="flex flex-wrap items-center gap-2">
			<div class="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1">
				<span class="text-xs text-muted-foreground">{m.feedback_speaker_url_title()}:</span>
				<code class="text-xs">{speakerFeedbackPath}</code>
				<Button variant="ghost" size="icon" class="h-6 w-6" onclick={copySpeakerUrl}>
					{#if copied}
						<Check class="h-3 w-3 text-green-500" />
					{:else}
						<Copy class="h-3 w-3" />
					{/if}
				</Button>
				<a href={speakerFeedbackPath} target="_blank" rel="noopener noreferrer">
					<Button variant="ghost" size="icon" class="h-6 w-6">
						<ExternalLink class="h-3 w-3" />
					</Button>
				</a>
			</div>
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

	<!-- Session Feedback -->
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
</div>
