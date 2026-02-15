<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Switch } from '$lib/components/ui/switch'
import { Textarea } from '$lib/components/ui/textarea'
import { getAvailableRatingModes } from '$lib/features/feedback/domain/rating-mode'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  Heart,
  ImageIcon,
  Loader2,
  MessageSquare,
  Mic,
  Palette,
  RefreshCw,
  Settings2,
  Star,
  Ticket,
  Upload
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

const ratingModes = getAvailableRatingModes()
const appUrl = `/app/${data.edition.slug}`

// Active settings tab
let activeTab = $state<'appearance' | 'features' | 'feedback'>('appearance')

// Appearance settings state (live preview)
let title = $state(data.appSettings?.title ?? data.edition.name)
let subtitle = $state(data.appSettings?.subtitle ?? '')
let primaryColor = $state(data.appSettings?.primaryColor ?? data.defaultAppSettings.primaryColor)
let accentColor = $state(data.appSettings?.accentColor ?? data.defaultAppSettings.accentColor)
let logoPreview = $state<string | undefined>(data.appSettings?.logoUrl)
let headerPreview = $state<string | undefined>(data.appSettings?.headerImageUrl)

// Feature toggles (Schedule is always enabled, not a toggle)
let showSpeakersTab = $state(data.appSettings?.showSpeakersTab ?? true)
let showTicketsTab = $state(data.appSettings?.showTicketsTab ?? true)
let showFeedbackTab = $state(data.appSettings?.showFeedbackTab ?? true)
let showFavoritesTab = $state(data.appSettings?.showFavoritesTab ?? true)

// Feedback settings state
let sessionRatingEnabled = $state(
  data.feedbackSettings?.sessionRatingEnabled ?? data.defaultFeedbackSettings.sessionRatingEnabled
)
let sessionRatingMode = $state(
  data.feedbackSettings?.sessionRatingMode ?? data.defaultFeedbackSettings.sessionRatingMode
)
let sessionCommentRequired = $state(
  data.feedbackSettings?.sessionCommentRequired ??
    data.defaultFeedbackSettings.sessionCommentRequired
)
let eventFeedbackEnabled = $state(
  data.feedbackSettings?.eventFeedbackEnabled ?? data.defaultFeedbackSettings.eventFeedbackEnabled
)
let feedbackIntroText = $state(
  data.feedbackSettings?.feedbackIntroText ?? data.defaultFeedbackSettings.feedbackIntroText ?? ''
)

// Sync feedback settings state when data changes (after form submission)
$effect(() => {
  sessionRatingEnabled =
    data.feedbackSettings?.sessionRatingEnabled ?? data.defaultFeedbackSettings.sessionRatingEnabled
  sessionRatingMode =
    data.feedbackSettings?.sessionRatingMode ?? data.defaultFeedbackSettings.sessionRatingMode
  sessionCommentRequired =
    data.feedbackSettings?.sessionCommentRequired ??
    data.defaultFeedbackSettings.sessionCommentRequired
  eventFeedbackEnabled =
    data.feedbackSettings?.eventFeedbackEnabled ?? data.defaultFeedbackSettings.eventFeedbackEnabled
  feedbackIntroText =
    data.feedbackSettings?.feedbackIntroText ?? data.defaultFeedbackSettings.feedbackIntroText ?? ''
})

// Loading states
let isSavingAppearance = $state(false)
let isSavingFeatures = $state(false)
let isSavingFeedback = $state(false)

// File preview handlers
function handleLogoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      logoPreview = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function handleHeaderChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      headerPreview = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}
</script>

<svelte:head>
	<title>Attendee App - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/admin/app">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div class="flex-1">
			<h2 class="text-3xl font-bold tracking-tight">Attendee App</h2>
			<p class="text-muted-foreground">{data.edition.name}</p>
		</div>
		<a href={appUrl} target="_blank" rel="noopener noreferrer">
			<Button variant="outline">
				<ExternalLink class="mr-2 h-4 w-4" />
				Open App
			</Button>
		</a>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			<CheckCircle2 class="mr-2 inline h-4 w-4" />
			Settings saved successfully.
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			<AlertCircle class="mr-2 inline h-4 w-4" />
			{form.error}
		</div>
	{/if}

	<!-- Main Content: Preview + Settings -->
	<div class="grid gap-6 lg:grid-cols-[420px_1fr]">
		<!-- Phone Preview (Pixel 7 dimensions: 412x915 CSS pixels, ~20:9 ratio) -->
		<div class="flex justify-center lg:sticky lg:top-6 lg:self-start">
			<div class="relative">
				<!-- Phone Frame -->
				<div class="w-[390px] rounded-[2.5rem] border-[8px] border-gray-800 bg-gray-800 shadow-xl dark:border-gray-600">
					<!-- Punch hole camera -->
					<div class="absolute left-1/2 top-4 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-gray-900 dark:bg-gray-700"></div>

					<!-- Screen with iframe -->
					<div class="h-[780px] overflow-hidden rounded-[2rem]">
						<iframe
							src={appUrl}
							title="App Preview"
							class="h-full w-full border-0"
							sandbox="allow-scripts allow-same-origin"
						></iframe>
					</div>
				</div>

				<!-- Refresh button -->
				<div class="mt-4 flex justify-center">
					<Button variant="outline" size="sm" onclick={() => {
						const iframe = document.querySelector('iframe')
						if (iframe) {
							iframe.src = iframe.src
						}
					}}>
						<RefreshCw class="mr-2 h-4 w-4" />
						Refresh Preview
					</Button>
				</div>
			</div>
		</div>

		<!-- Settings Panel -->
		<div class="space-y-6">
			<!-- Settings Tabs -->
			<div class="flex gap-2 border-b pb-2">
				<Button
					variant={activeTab === 'appearance' ? 'default' : 'ghost'}
					onclick={() => (activeTab = 'appearance')}
					class="flex items-center gap-2"
				>
					<Palette class="h-4 w-4" />
					Appearance
				</Button>
				<Button
					variant={activeTab === 'features' ? 'default' : 'ghost'}
					onclick={() => (activeTab = 'features')}
					class="flex items-center gap-2"
				>
					<Settings2 class="h-4 w-4" />
					Features
				</Button>
				<Button
					variant={activeTab === 'feedback' ? 'default' : 'ghost'}
					onclick={() => (activeTab = 'feedback')}
					class="flex items-center gap-2"
				>
					<Star class="h-4 w-4" />
					Feedback
				</Button>
			</div>

			<!-- Appearance Tab -->
			{#if activeTab === 'appearance'}
				<form
					method="POST"
					action="?/saveAppearance"
					enctype="multipart/form-data"
					use:enhance={() => {
						isSavingAppearance = true
						return async ({ update }) => {
							isSavingAppearance = false
							await update()
						}
					}}
					class="space-y-6"
				>
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<ImageIcon class="h-5 w-5" />
								Branding
							</Card.Title>
							<Card.Description>Customize how your app looks to attendees</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="title">App Title</Label>
									<Input
										id="title"
										name="title"
										placeholder={data.edition.name}
										bind:value={title}
									/>
									<p class="text-xs text-muted-foreground">Leave empty to use edition name</p>
								</div>
								<div class="space-y-2">
									<Label for="subtitle">Subtitle / Venue</Label>
									<Input
										id="subtitle"
										name="subtitle"
										placeholder="Paris Convention Center"
										bind:value={subtitle}
									/>
								</div>
							</div>

							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="primaryColor">Primary Color</Label>
									<div class="flex gap-2">
										<Input
											id="primaryColor"
											name="primaryColor"
											type="color"
											bind:value={primaryColor}
											class="h-10 w-16 cursor-pointer p-1"
										/>
										<Input
											bind:value={primaryColor}
											placeholder="#3b82f6"
											class="flex-1 font-mono"
										/>
									</div>
									<p class="text-xs text-muted-foreground">Active tabs, buttons, highlights</p>
								</div>
								<div class="space-y-2">
									<Label for="accentColor">Accent Color</Label>
									<div class="flex gap-2">
										<Input
											id="accentColor"
											name="accentColor"
											type="color"
											bind:value={accentColor}
											class="h-10 w-16 cursor-pointer p-1"
										/>
										<Input
											bind:value={accentColor}
											placeholder="#8b5cf6"
											class="flex-1 font-mono"
										/>
									</div>
									<p class="text-xs text-muted-foreground">Favorites, secondary highlights</p>
								</div>
							</div>

							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="logoFile">Logo (Optional)</Label>
									<div class="flex items-center gap-4">
										{#if logoPreview}
											<img src={logoPreview} alt="Logo preview" class="h-16 w-16 rounded-lg border object-contain p-1" />
										{:else}
											<div class="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
												<ImageIcon class="h-6 w-6 text-muted-foreground" />
											</div>
										{/if}
										<label class="cursor-pointer">
											<input
												type="file"
												name="logoFile"
												accept="image/png,image/jpeg,image/webp,image/svg+xml"
												class="hidden"
												onchange={handleLogoChange}
											/>
											<Button type="button" variant="outline" size="sm" class="pointer-events-none">
												<Upload class="mr-2 h-4 w-4" />
												Upload Logo
											</Button>
										</label>
									</div>
									<p class="text-xs text-muted-foreground">PNG, JPG, WebP or SVG. Max 2MB.</p>
								</div>
								<div class="space-y-2">
									<Label for="headerImage">Header Background (Optional)</Label>
									<div class="flex items-center gap-4">
										{#if headerPreview}
											<img src={headerPreview} alt="Header preview" class="h-16 w-24 rounded-lg border object-cover" />
										{:else}
											<div class="flex h-16 w-24 items-center justify-center rounded-lg border bg-muted">
												<ImageIcon class="h-6 w-6 text-muted-foreground" />
											</div>
										{/if}
										<label class="cursor-pointer">
											<input
												type="file"
												name="headerImage"
												accept="image/png,image/jpeg,image/webp"
												class="hidden"
												onchange={handleHeaderChange}
											/>
											<Button type="button" variant="outline" size="sm" class="pointer-events-none">
												<Upload class="mr-2 h-4 w-4" />
												Upload Image
											</Button>
										</label>
									</div>
									<p class="text-xs text-muted-foreground">PNG, JPG or WebP. Max 5MB.</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<div class="flex justify-end">
						<Button type="submit" disabled={isSavingAppearance}>
							{#if isSavingAppearance}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Saving...
							{:else}
								<Check class="mr-2 h-4 w-4" />
								Save Appearance
							{/if}
						</Button>
					</div>
				</form>
			{/if}

			<!-- Features Tab -->
			{#if activeTab === 'features'}
				<form
					method="POST"
					action="?/saveFeatures"
					use:enhance={() => {
						isSavingFeatures = true
						return async ({ update }) => {
							isSavingFeatures = false
							await update()
						}
					}}
					class="space-y-6"
				>
					<Card.Root>
						<Card.Header>
							<Card.Title class="flex items-center gap-2">
								<Settings2 class="h-5 w-5" />
								App Tabs
							</Card.Title>
							<Card.Description>Choose which tabs to show in the attendee app</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
								<div class="flex items-center gap-3">
									<Calendar class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">Schedule</div>
										<p class="text-sm text-muted-foreground">Event schedule with sessions and rooms (always enabled)</p>
									</div>
								</div>
								<input type="hidden" name="showScheduleTab" value="true" />
								<Switch checked={true} disabled />
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<Mic class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">Speakers</div>
										<p class="text-sm text-muted-foreground">List of speakers with their talks</p>
									</div>
								</div>
								<input type="hidden" name="showSpeakersTab" value={showSpeakersTab ? 'true' : 'false'} />
								<Switch checked={showSpeakersTab} onCheckedChange={(v) => (showSpeakersTab = v)} />
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<Ticket class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">My Ticket</div>
										<p class="text-sm text-muted-foreground">Ticket lookup and QR code display</p>
									</div>
								</div>
								<input type="hidden" name="showTicketsTab" value={showTicketsTab ? 'true' : 'false'} />
								<Switch checked={showTicketsTab} onCheckedChange={(v) => (showTicketsTab = v)} />
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<MessageSquare class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">Feedback</div>
										<p class="text-sm text-muted-foreground">Event feedback and problem reports</p>
									</div>
								</div>
								<input type="hidden" name="showFeedbackTab" value={showFeedbackTab ? 'true' : 'false'} />
								<Switch checked={showFeedbackTab} onCheckedChange={(v) => (showFeedbackTab = v)} />
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<Heart class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">Favorites</div>
										<p class="text-sm text-muted-foreground">Allow attendees to save favorite sessions</p>
									</div>
								</div>
								<input type="hidden" name="showFavoritesTab" value={showFavoritesTab ? 'true' : 'false'} />
								<Switch checked={showFavoritesTab} onCheckedChange={(v) => (showFavoritesTab = v)} />
							</div>
						</Card.Content>
					</Card.Root>

					<div class="flex justify-end">
						<Button type="submit" disabled={isSavingFeatures}>
							{#if isSavingFeatures}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Saving...
							{:else}
								<Check class="mr-2 h-4 w-4" />
								Save Features
							{/if}
						</Button>
					</div>
				</form>
			{/if}

			<!-- Feedback Tab -->
			{#if activeTab === 'feedback'}
				<form
					method="POST"
					action="?/saveFeedback"
					use:enhance={() => {
						isSavingFeedback = true
						return async ({ update }) => {
							isSavingFeedback = false
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
							<Card.Description>Allow attendees to rate individual sessions</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-6">
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div>
									<div class="font-medium">Enable Session Ratings</div>
									<p class="text-sm text-muted-foreground">
										Attendees can rate sessions in the app
									</p>
								</div>
								<input type="hidden" name="sessionRatingEnabled" value={sessionRatingEnabled ? 'true' : 'false'} />
								<Switch checked={sessionRatingEnabled} onCheckedChange={(v) => (sessionRatingEnabled = v)} />
							</div>

							{#if sessionRatingEnabled}
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

								<div class="flex items-center justify-between rounded-lg border p-4">
									<div>
										<div class="font-medium">Require Comments</div>
										<p class="text-sm text-muted-foreground">Make comments mandatory</p>
									</div>
									<input type="hidden" name="sessionCommentRequired" value={sessionCommentRequired ? 'true' : 'false'} />
									<Switch checked={sessionCommentRequired} onCheckedChange={(v) => (sessionCommentRequired = v)} />
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
							<Card.Description>General feedback and problem reports</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-6">
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div>
									<div class="font-medium">Enable Event Feedback</div>
									<p class="text-sm text-muted-foreground">
										Show feedback forms in the Feedback tab
									</p>
								</div>
								<input type="hidden" name="eventFeedbackEnabled" value={eventFeedbackEnabled ? 'true' : 'false'} />
								<Switch checked={eventFeedbackEnabled} onCheckedChange={(v) => (eventFeedbackEnabled = v)} />
							</div>

							{#if eventFeedbackEnabled}
								<div class="space-y-2">
									<Label for="feedbackIntroText">Introduction Text</Label>
									<Textarea
										id="feedbackIntroText"
										name="feedbackIntroText"
										placeholder="We value your feedback! Help us improve future events."
										bind:value={feedbackIntroText}
										rows={3}
									/>
								</div>
							{/if}
						</Card.Content>
					</Card.Root>

					<div class="flex justify-end">
						<Button type="submit" disabled={isSavingFeedback}>
							{#if isSavingFeedback}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Saving...
							{:else}
								<Check class="mr-2 h-4 w-4" />
								Save Feedback Settings
							{/if}
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
