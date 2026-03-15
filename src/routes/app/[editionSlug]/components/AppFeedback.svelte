<script lang="ts">
import { Card } from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { AlertCircle, ChevronRight, MessageSquare } from 'lucide-svelte'

interface Props {
  showEventFeedback: boolean
  showSessionFeedback: boolean
  feedbackIntroText?: string
  onOpenEventFeedback: (type: 'general' | 'problem') => void
}

const { showEventFeedback, showSessionFeedback, feedbackIntroText, onOpenEventFeedback }: Props =
  $props()
</script>

<div class="mx-auto max-w-2xl p-4">
	<h2 class="sr-only">{m.app_feedback_heading()}</h2>
	{#if showEventFeedback}
		<div class="space-y-4">
			<button
				type="button"
				class="w-full text-left"
				onclick={() => onOpenEventFeedback('general')}
			>
				<Card class="p-6 transition-colors hover:bg-muted/50">
					<div class="flex items-start gap-3">
						<MessageSquare class="mt-0.5 h-5 w-5 text-primary" />
						<div class="flex-1">
							<h3 class="font-semibold">{m.app_feedback_general()}</h3>
							<p class="mt-1 text-sm text-muted-foreground">
								{m.app_feedback_general_description()}
							</p>
						</div>
						<ChevronRight class="h-5 w-5 text-muted-foreground" />
					</div>
				</Card>
			</button>

			<button
				type="button"
				class="w-full text-left"
				onclick={() => onOpenEventFeedback('problem')}
			>
				<Card class="p-6 transition-colors hover:bg-muted/50">
					<div class="flex items-start gap-3">
						<AlertCircle class="mt-0.5 h-5 w-5 text-orange-600" />
						<div class="flex-1">
							<h3 class="font-semibold">{m.app_feedback_problem()}</h3>
							<p class="mt-1 text-sm text-muted-foreground">
								{m.app_feedback_problem_description()}
							</p>
						</div>
						<ChevronRight class="h-5 w-5 text-muted-foreground" />
					</div>
				</Card>
			</button>
		</div>

		{#if feedbackIntroText}
			<p class="mt-6 text-center text-sm text-muted-foreground">
				{feedbackIntroText}
			</p>
		{/if}
	{:else if showSessionFeedback}
		<div class="text-center py-8">
			<MessageSquare class="mx-auto h-12 w-12 text-muted-foreground/50" />
			<h3 class="mt-4 text-lg font-medium">{m.app_feedback_session_title()}</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.app_feedback_session_description()}
			</p>
		</div>
	{:else}
		<div class="text-center py-8">
			<MessageSquare class="mx-auto h-12 w-12 text-muted-foreground/50" />
			<h3 class="mt-4 text-lg font-medium">{m.app_feedback_unavailable_title()}</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				{m.app_feedback_unavailable_description()}
			</p>
		</div>
	{/if}
</div>
