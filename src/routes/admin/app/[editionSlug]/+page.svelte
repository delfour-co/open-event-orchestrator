<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Switch } from '$lib/components/ui/switch'
import { Textarea } from '$lib/components/ui/textarea'
import { getAvailableRatingModes } from '$lib/features/feedback/domain/rating-mode'
import * as m from '$lib/paraglide/messages'
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
  RotateCcw,
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

// Sync appearance settings state when data changes (after form submission)
$effect(() => {
  title = data.appSettings?.title ?? data.edition.name
  subtitle = data.appSettings?.subtitle ?? ''
  primaryColor = data.appSettings?.primaryColor ?? data.defaultAppSettings.primaryColor
  accentColor = data.appSettings?.accentColor ?? data.defaultAppSettings.accentColor
  logoPreview = data.appSettings?.logoUrl
  headerPreview = data.appSettings?.headerImageUrl
})

// Sync feature toggles state when data changes (after form submission or reset)
$effect(() => {
  showSpeakersTab = data.appSettings?.showSpeakersTab ?? true
  showTicketsTab = data.appSettings?.showTicketsTab ?? true
  showFeedbackTab = data.appSettings?.showFeedbackTab ?? true
  showFavoritesTab = data.appSettings?.showFavoritesTab ?? true
})

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
let isResetting = $state(false)
let showResetDialog = $state(false)

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
	<title>{m.admin_app_config_title({ name: data.edition.name })}</title>
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
			<h2 class="text-3xl font-bold tracking-tight">{m.admin_app_config_heading()}</h2>
			<p class="text-muted-foreground">{data.edition.name}</p>
		</div>
		<div class="flex gap-2">
			<Button variant="outline" onclick={() => (showResetDialog = true)}>
				<RotateCcw class="mr-2 h-4 w-4" />
				{m.admin_app_reset_defaults()}
			</Button>
			<a href={appUrl} target="_blank" rel="noopener noreferrer">
				<Button variant="outline">
					<ExternalLink class="mr-2 h-4 w-4" />
					{m.admin_app_open_app()}
				</Button>
			</a>
		</div>
	</div>

	<!-- Reset Confirmation Dialog -->
	{#if showResetDialog}
		<Dialog.Content class="max-w-md" onClose={() => (showResetDialog = false)}>
			<Dialog.Header>
				<Dialog.Title>{m.admin_app_reset_dialog_title()}</Dialog.Title>
				<Dialog.Description>
					{m.admin_app_reset_dialog_description()}
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Button variant="outline" onclick={() => (showResetDialog = false)}>{m.action_cancel()}</Button>
				<form
					method="POST"
					action="?/resetSettings"
					use:enhance={() => {
						isResetting = true
						showResetDialog = false
						return async ({ update }) => {
							isResetting = false
							await update()
						}
					}}
				>
					<Button type="submit" variant="destructive" disabled={isResetting}>
						{#if isResetting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{m.admin_app_resetting()}
						{:else}
							<RotateCcw class="mr-2 h-4 w-4" />
							{m.admin_app_reset()}
						{/if}
					</Button>
				</form>
			</Dialog.Footer>
		</Dialog.Content>
	{/if}

	<!-- Success/Error Messages -->
	{#if form?.success}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			<CheckCircle2 class="mr-2 inline h-4 w-4" />
			{#if form.action === 'reset'}
				{m.admin_app_settings_reset_success()}
			{:else}
				{m.admin_app_settings_saved_success()}
			{/if}
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
						{m.admin_app_refresh_preview()}
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
					{m.admin_app_tab_appearance()}
				</Button>
				<Button
					variant={activeTab === 'features' ? 'default' : 'ghost'}
					onclick={() => (activeTab = 'features')}
					class="flex items-center gap-2"
				>
					<Settings2 class="h-4 w-4" />
					{m.admin_app_tab_features()}
				</Button>
				<Button
					variant={activeTab === 'feedback' ? 'default' : 'ghost'}
					onclick={() => (activeTab = 'feedback')}
					class="flex items-center gap-2"
				>
					<Star class="h-4 w-4" />
					{m.admin_app_tab_feedback()}
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
								{m.admin_app_branding_title()}
							</Card.Title>
							<Card.Description>{m.admin_app_branding_description()}</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="title">{m.admin_app_title_label()}</Label>
									<Input
										id="title"
										name="title"
										placeholder={data.edition.name}
										bind:value={title}
									/>
									<p class="text-xs text-muted-foreground">{m.admin_app_title_hint()}</p>
								</div>
								<div class="space-y-2">
									<Label for="subtitle">{m.admin_app_subtitle_label()}</Label>
									<Input
										id="subtitle"
										name="subtitle"
										placeholder={m.admin_app_subtitle_placeholder()}
										bind:value={subtitle}
									/>
								</div>
							</div>

							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="primaryColor">{m.admin_app_primary_color_label()}</Label>
									<div class="flex gap-2">
										<input
											id="primaryColor"
											name="primaryColor"
											type="color"
											bind:value={primaryColor}
											class="h-10 w-16 cursor-pointer rounded border p-1"
										/>
										<Input
											bind:value={primaryColor}
											placeholder="#3b82f6"
											class="flex-1 font-mono"
										/>
									</div>
									<p class="text-xs text-muted-foreground">{m.admin_app_primary_color_hint()}</p>
								</div>
								<div class="space-y-2">
									<Label for="accentColor">{m.admin_app_accent_color_label()}</Label>
									<div class="flex gap-2">
										<input
											id="accentColor"
											name="accentColor"
											type="color"
											bind:value={accentColor}
											class="h-10 w-16 cursor-pointer rounded border p-1"
										/>
										<Input
											bind:value={accentColor}
											placeholder="#8b5cf6"
											class="flex-1 font-mono"
										/>
									</div>
									<p class="text-xs text-muted-foreground">{m.admin_app_accent_color_hint()}</p>
								</div>
							</div>

							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="logoFile">{m.admin_app_logo_label()}</Label>
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
												{m.admin_app_upload_logo()}
											</Button>
										</label>
									</div>
									<p class="text-xs text-muted-foreground">{m.admin_app_logo_hint()}</p>
								</div>
								<div class="space-y-2">
									<Label for="headerImage">{m.admin_app_header_label()}</Label>
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
												{m.admin_app_upload_header()}
											</Button>
										</label>
									</div>
									<p class="text-xs text-muted-foreground">{m.admin_app_header_hint()}</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>

					<div class="flex justify-end">
						<Button type="submit" disabled={isSavingAppearance}>
							{#if isSavingAppearance}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								{m.admin_app_saving()}
							{:else}
								<Check class="mr-2 h-4 w-4" />
								{m.admin_app_save_appearance()}
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
								{m.admin_app_tabs_title()}
							</Card.Title>
							<Card.Description>{m.admin_app_tabs_description()}</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							<div class="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
								<div class="flex items-center gap-3">
									<Calendar class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">{m.admin_app_tab_schedule()}</div>
										<p class="text-sm text-muted-foreground">{m.admin_app_tab_schedule_description()}</p>
									</div>
								</div>
								<input type="hidden" name="showScheduleTab" value="true" />
								<Switch checked={true} disabled />
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<Mic class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">{m.admin_app_tab_speakers()}</div>
										<p class="text-sm text-muted-foreground">{m.admin_app_tab_speakers_description()}</p>
									</div>
								</div>
								<input type="hidden" name="showSpeakersTab" value={showSpeakersTab ? 'true' : 'false'} />
								<Switch checked={showSpeakersTab} onCheckedChange={(v) => (showSpeakersTab = v)} />
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<Ticket class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">{m.admin_app_tab_my_ticket()}</div>
										<p class="text-sm text-muted-foreground">{m.admin_app_tab_my_ticket_description()}</p>
									</div>
								</div>
								<input type="hidden" name="showTicketsTab" value={showTicketsTab ? 'true' : 'false'} />
								<Switch checked={showTicketsTab} onCheckedChange={(v) => (showTicketsTab = v)} />
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<MessageSquare class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">{m.admin_app_tab_feedback_label()}</div>
										<p class="text-sm text-muted-foreground">{m.admin_app_tab_feedback_description()}</p>
									</div>
								</div>
								<input type="hidden" name="showFeedbackTab" value={showFeedbackTab ? 'true' : 'false'} />
								<Switch checked={showFeedbackTab} onCheckedChange={(v) => (showFeedbackTab = v)} />
							</div>

							<div class="flex items-center justify-between rounded-lg border p-4">
								<div class="flex items-center gap-3">
									<Heart class="h-5 w-5 text-muted-foreground" />
									<div>
										<div class="font-medium">{m.admin_app_tab_favorites()}</div>
										<p class="text-sm text-muted-foreground">{m.admin_app_tab_favorites_description()}</p>
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
								{m.admin_app_saving()}
							{:else}
								<Check class="mr-2 h-4 w-4" />
								{m.admin_app_save_features()}
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
								{m.admin_app_session_ratings_title()}
							</Card.Title>
							<Card.Description>{m.admin_app_session_ratings_description()}</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-6">
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div>
									<div class="font-medium">{m.admin_app_enable_session_ratings()}</div>
									<p class="text-sm text-muted-foreground">
										{m.admin_app_enable_session_ratings_hint()}
									</p>
								</div>
								<input type="hidden" name="sessionRatingEnabled" value={sessionRatingEnabled ? 'true' : 'false'} />
								<Switch checked={sessionRatingEnabled} onCheckedChange={(v) => (sessionRatingEnabled = v)} />
							</div>

							{#if sessionRatingEnabled}
								<div class="space-y-3">
									<Label>{m.admin_app_rating_mode_label()}</Label>
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
										<div class="font-medium">{m.admin_app_require_comments()}</div>
										<p class="text-sm text-muted-foreground">{m.admin_app_require_comments_hint()}</p>
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
								{m.admin_app_event_feedback_title()}
							</Card.Title>
							<Card.Description>{m.admin_app_event_feedback_description()}</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-6">
							<div class="flex items-center justify-between rounded-lg border p-4">
								<div>
									<div class="font-medium">{m.admin_app_enable_event_feedback()}</div>
									<p class="text-sm text-muted-foreground">
										{m.admin_app_enable_event_feedback_hint()}
									</p>
								</div>
								<input type="hidden" name="eventFeedbackEnabled" value={eventFeedbackEnabled ? 'true' : 'false'} />
								<Switch checked={eventFeedbackEnabled} onCheckedChange={(v) => (eventFeedbackEnabled = v)} />
							</div>

							{#if eventFeedbackEnabled}
								<div class="space-y-2">
									<Label for="feedbackIntroText">{m.admin_app_intro_text_label()}</Label>
									<Textarea
										id="feedbackIntroText"
										name="feedbackIntroText"
										placeholder={m.admin_app_intro_text_placeholder()}
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
								{m.admin_app_saving()}
							{:else}
								<Check class="mr-2 h-4 w-4" />
								{m.admin_app_save_feedback()}
							{/if}
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
