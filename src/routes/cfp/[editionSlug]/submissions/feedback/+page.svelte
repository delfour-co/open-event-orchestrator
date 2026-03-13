<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Lock,
  MessageCircle,
  MessageSquare,
  Star
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let expandedSession = $state<string | null>(null)

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
</script>

<svelte:head>
	<title>{m.speaker_feedback_title()}</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/cfp/{data.edition.slug}/submissions">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div>
			<h1 class="text-2xl font-bold">{m.speaker_feedback_heading()}</h1>
			<p class="text-muted-foreground">{data.edition.name}</p>
		</div>
	</div>

	{#if !data.authenticated}
		<!-- Not authenticated -->
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Lock class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">{m.speaker_feedback_auth_required()}</h3>
				<p class="mt-2 text-sm text-muted-foreground">{m.speaker_feedback_auth_hint()}</p>
				<a href="/cfp/{data.edition.slug}/submissions" class="mt-4">
					<Button variant="outline">{m.speaker_feedback_go_to_submissions()}</Button>
				</a>
			</Card.Content>
		</Card.Root>
	{:else if data.sessions.length === 0}
		<!-- No sessions with feedback -->
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<MessageSquare class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">{m.speaker_feedback_no_sessions()}</h3>
				<p class="mt-2 text-center text-sm text-muted-foreground">
					{m.speaker_feedback_no_sessions_hint()}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<!-- Summary -->
		<div class="grid gap-4 sm:grid-cols-2">
			<Card.Root>
				<Card.Content class="pt-6">
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
							<Star class="h-4 w-4 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p class="text-2xl font-bold">{data.totalFeedback}</p>
							<p class="text-xs text-muted-foreground">{m.speaker_feedback_total_responses()}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
			<Card.Root>
				<Card.Content class="pt-6">
					<div class="flex items-center gap-3">
						<div class="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
							<MessageCircle class="h-4 w-4 text-green-600 dark:text-green-400" />
						</div>
						<div>
							<p class="text-2xl font-bold">{data.sessions.length}</p>
							<p class="text-xs text-muted-foreground">{m.speaker_feedback_sessions_count()}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Sessions list -->
		<div class="space-y-4">
			{#each data.sessions as session}
				<Card.Root>
					<button
						class="w-full text-left"
						onclick={() =>
							(expandedSession =
								expandedSession === session.id ? null : session.id)}
					>
						<Card.Header>
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<Card.Title class="text-base">{session.title}</Card.Title>
								</div>
								<div class="flex items-center gap-4">
									{#if session.summary}
										<div class="text-right">
											<p class="text-lg font-bold text-amber-600 dark:text-amber-400">
												{session.summary.averageRating !== null
													? session.summary.averageRating.toFixed(1)
													: '-'}
											</p>
											<p class="text-xs text-muted-foreground">
												{m.feedback_total_responses({ count: session.summary.totalFeedback })}
											</p>
										</div>
									{:else}
										<p class="text-sm text-muted-foreground">{m.speaker_feedback_no_ratings()}</p>
									{/if}
									<div class="text-muted-foreground">
										{#if expandedSession === session.id}
											<ChevronUp class="h-5 w-5" />
										{:else}
											<ChevronDown class="h-5 w-5" />
										{/if}
									</div>
								</div>
							</div>
							{#if session.summary?.averageRating !== null && session.summary?.averageRating !== undefined}
								<div class="mt-2 text-amber-500">
									{renderStars(session.summary.averageRating)}
								</div>
							{/if}
						</Card.Header>
					</button>

					{#if expandedSession === session.id && session.summary}
						<Card.Content class="space-y-4 border-t pt-4">
							<!-- Rating Distribution -->
							<div>
								<h4 class="mb-2 text-sm font-medium">{m.feedback_session_ratings()}</h4>
								<div class="space-y-1">
									{#each [5, 4, 3, 2, 1] as star}
										{@const count = session.summary.ratingDistribution[star] || 0}
										{@const pct =
											session.summary.totalFeedback > 0
												? (count / session.summary.totalFeedback) * 100
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
											<span class="w-8 text-right text-xs text-muted-foreground">{count}</span>
										</div>
									{/each}
								</div>
							</div>

							<!-- Comments -->
							{#if session.comments.length > 0}
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
		</div>
	{/if}
</div>
