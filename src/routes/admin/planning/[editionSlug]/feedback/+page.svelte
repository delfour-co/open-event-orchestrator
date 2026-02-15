<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getAvailableRatingModes } from '$lib/features/feedback/domain/rating-mode'
import {
	AlertCircle,
	ArrowLeft,
	Check,
	CheckCircle2,
	Loader2,
	MessageSquare,
	Star
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
	data: PageData
	form: ActionData
}

const { data, form }: Props = $props()

const ratingModes = getAvailableRatingModes()

let sessionRatingEnabled = $state(data.settings?.sessionRatingEnabled ?? data.defaultSettings.sessionRatingEnabled)
let sessionRatingMode = $state(data.settings?.sessionRatingMode ?? data.defaultSettings.sessionRatingMode)
let sessionCommentRequired = $state(data.settings?.sessionCommentRequired ?? data.defaultSettings.sessionCommentRequired)
let eventFeedbackEnabled = $state(data.settings?.eventFeedbackEnabled ?? data.defaultSettings.eventFeedbackEnabled)
let feedbackIntroText = $state(data.settings?.feedbackIntroText ?? data.defaultSettings.feedbackIntroText ?? '')
let isSubmitting = $state(false)
</script>

<svelte:head>
	<title>Feedback Settings - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/admin/planning/{data.edition.slug}">
			<Button variant="ghost" size="sm">
				<ArrowLeft class="mr-2 h-4 w-4" />
				Back to Planning
			</Button>
		</a>
	</div>

	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Feedback Settings</h2>
			<p class="text-muted-foreground">
				Configure how attendees can provide feedback for {data.edition.name}.
			</p>
		</div>
	</div>

	{#if form?.success}
		<div
			class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			<CheckCircle2 class="mr-2 inline h-4 w-4" />
			Feedback settings saved successfully.
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			<AlertCircle class="mr-2 inline h-4 w-4" />
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			isSubmitting = true
			return async ({ update }) => {
				isSubmitting = false
				await update()
			}
		}}
		class="space-y-6"
	>
		<!-- Session Ratings Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Star class="h-5 w-5" />
					Session Ratings
				</Card.Title>
				<Card.Description>
					Allow attendees to rate individual sessions in the PWA.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Enable/Disable toggle -->
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div>
						<div class="font-medium">Enable Session Ratings</div>
						<p class="text-sm text-muted-foreground">
							When enabled, attendees can rate sessions in the mobile app.
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" bind:checked={sessionRatingEnabled} class="peer sr-only" />
						<input type="hidden" name="sessionRatingEnabled" value={sessionRatingEnabled ? 'true' : 'false'} />
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
						></div>
					</label>
				</div>

				{#if sessionRatingEnabled}
					<!-- Rating Mode -->
					<div class="space-y-3">
						<Label>Rating Mode</Label>
						<div class="grid gap-3 md:grid-cols-2">
							{#each ratingModes as mode}
								<label
									class="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted {sessionRatingMode === mode.value ? 'border-primary bg-primary/5' : ''}"
								>
									<input
										type="radio"
										name="sessionRatingMode"
										value={mode.value}
										bind:group={sessionRatingMode}
										class="mt-1"
									/>
									<div>
										<div class="font-medium">{mode.label}</div>
										<p class="text-sm text-muted-foreground">{mode.description}</p>
									</div>
								</label>
							{/each}
						</div>
					</div>

					<!-- Require Comments -->
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div>
							<div class="font-medium">Require Comments</div>
							<p class="text-sm text-muted-foreground">
								Make comments mandatory when submitting session ratings.
							</p>
						</div>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" bind:checked={sessionCommentRequired} class="peer sr-only" />
							<input type="hidden" name="sessionCommentRequired" value={sessionCommentRequired ? 'true' : 'false'} />
							<div
								class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
							></div>
						</label>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Event Feedback Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<MessageSquare class="h-5 w-5" />
					Event Feedback
				</Card.Title>
				<Card.Description>
					Allow attendees to submit general feedback and problem reports.
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<!-- Enable/Disable toggle -->
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div>
						<div class="font-medium">Enable Event Feedback</div>
						<p class="text-sm text-muted-foreground">
							Show the Feedback tab in the attendee PWA with general feedback and problem report forms.
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" bind:checked={eventFeedbackEnabled} class="peer sr-only" />
						<input type="hidden" name="eventFeedbackEnabled" value={eventFeedbackEnabled ? 'true' : 'false'} />
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
						></div>
					</label>
				</div>

				{#if eventFeedbackEnabled}
					<!-- Intro Text -->
					<div class="space-y-2">
						<Label for="feedbackIntroText">Introduction Text</Label>
						<Textarea
							id="feedbackIntroText"
							name="feedbackIntroText"
							placeholder="We value your feedback! Help us improve future events."
							bind:value={feedbackIntroText}
							rows={3}
						/>
						<p class="text-xs text-muted-foreground">
							This text is shown at the bottom of the Feedback tab to encourage attendees to share their thoughts.
						</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Save Button -->
		<div class="flex justify-end">
			<Button type="submit" disabled={isSubmitting}>
				{#if isSubmitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Saving...
				{:else}
					<Check class="mr-2 h-4 w-4" />
					Save Settings
				{/if}
			</Button>
		</div>
	</form>
</div>
