<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Github, Key, Shield } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let oauth2Enabled = $state(data.oauth2Enabled)
let showGoogleSecret = $state(false)
let showGithubSecret = $state(false)
let showSuperuserModal = $state(false)
let pbAdminEmail = $state('')
let pbAdminPassword = $state('')
let formElement: HTMLFormElement

const isActive = $derived(data.oauth2Enabled && (data.google.enabled || data.github.enabled))

function handleSave(e: Event) {
  e.preventDefault()
  showSuperuserModal = true
}

function confirmSave() {
  showSuperuserModal = false
  formElement.requestSubmit()
}

function cancelModal() {
  showSuperuserModal = false
  pbAdminEmail = ''
  pbAdminPassword = ''
}
</script>

<svelte:head>
	<title>{m.admin_settings_oauth_title()}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Status -->
	<Card.Root>
		<Card.Content class="flex items-center justify-between py-4">
			<div class="flex items-center gap-3">
				<div class="h-3 w-3 rounded-full {isActive ? 'bg-green-500' : 'bg-gray-300'}"></div>
				<span class="text-sm font-medium">
					{isActive ? m.admin_settings_status_active() : m.admin_settings_status_inactive()}
				</span>
			</div>
		</Card.Content>
	</Card.Root>

	{#if form?.success}
		<div
			class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			<CheckCircle2 class="mr-2 inline h-4 w-4" />
			{m.admin_settings_oauth_saved()}
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

	<form bind:this={formElement} method="POST" action="?/saveOAuth" use:enhance class="space-y-6">
		<!-- Hidden fields for PB superuser credentials -->
		<input type="hidden" name="pbAdminEmail" value={pbAdminEmail} />
		<input type="hidden" name="pbAdminPassword" value={pbAdminPassword} />

		<!-- Global OAuth2 toggle -->
		<div class="flex items-center justify-between rounded-lg border p-4">
			<div>
				<div class="font-medium">{m.admin_settings_oauth_enabled()}</div>
				<p class="text-sm text-muted-foreground">
					{m.admin_settings_oauth_enabled_description()}
				</p>
			</div>
			<label class="relative inline-flex cursor-pointer items-center">
				<input type="checkbox" bind:checked={oauth2Enabled} class="peer sr-only" />
				<input type="hidden" name="oauth2Enabled" value={oauth2Enabled ? 'true' : 'false'} />
				<div
					class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-400 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-600 dark:after:border-gray-500"
				></div>
			</label>
		</div>

		<!-- Google OAuth2 -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Shield class="h-5 w-5" />
						{m.admin_settings_oauth_google_title()}
					</div>
					{#if data.google.enabled && data.google.hasSecret}
						<Badge variant="default">
							<CheckCircle2 class="mr-1 h-3 w-3" />
							{m.admin_settings_oauth_configured()}
						</Badge>
					{:else}
						<Badge variant="secondary">
							<AlertCircle class="mr-1 h-3 w-3" />
							{m.admin_settings_oauth_not_configured()}
						</Badge>
					{/if}
				</Card.Title>
				<Card.Description>
					{m.admin_settings_oauth_google_help()}
					<br />
					<a
						href="https://console.cloud.google.com/apis/credentials"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline hover:no-underline"
					>
						Google Cloud Console
					</a>
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Google Client ID -->
				<div class="space-y-2">
					<Label for="googleClientId">{m.admin_settings_oauth_google_client_id()}</Label>
					<div class="relative">
						<Key
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="googleClientId"
							name="googleClientId"
							type="text"
							value={data.google.clientId}
							placeholder="123456789.apps.googleusercontent.com"
							class="pl-10 font-mono text-sm"
							autocomplete="off"
						/>
					</div>
				</div>

				<!-- Google Client Secret -->
				<div class="space-y-2">
					<Label for="googleClientSecret">{m.admin_settings_oauth_google_client_secret()}</Label>
					<div class="relative">
						<Key
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="googleClientSecret"
							name="googleClientSecret"
							type={showGoogleSecret ? 'text' : 'password'}
							placeholder={data.google.hasSecret
								? m.admin_settings_oauth_secret_placeholder()
								: 'GOCSPX-...'}
							class="pl-10 pr-10 font-mono text-sm"
							autocomplete="off"
						/>
						<button
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							onclick={() => (showGoogleSecret = !showGoogleSecret)}
						>
							{#if showGoogleSecret}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
					{#if data.google.hasSecret}
						<p class="text-xs text-muted-foreground">
							{m.admin_settings_oauth_secret_placeholder()}
						</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- GitHub OAuth2 -->
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Github class="h-5 w-5" />
						{m.admin_settings_oauth_github_title()}
					</div>
					{#if data.github.enabled && data.github.hasSecret}
						<Badge variant="default">
							<CheckCircle2 class="mr-1 h-3 w-3" />
							{m.admin_settings_oauth_configured()}
						</Badge>
					{:else}
						<Badge variant="secondary">
							<AlertCircle class="mr-1 h-3 w-3" />
							{m.admin_settings_oauth_not_configured()}
						</Badge>
					{/if}
				</Card.Title>
				<Card.Description>
					{m.admin_settings_oauth_github_help()}
					<br />
					<a
						href="https://github.com/settings/developers"
						target="_blank"
						rel="noopener noreferrer"
						class="text-primary underline hover:no-underline"
					>
						GitHub Developer Settings
					</a>
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- GitHub Client ID -->
				<div class="space-y-2">
					<Label for="githubClientId">{m.admin_settings_oauth_github_client_id()}</Label>
					<div class="relative">
						<Key
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="githubClientId"
							name="githubClientId"
							type="text"
							value={data.github.clientId}
							placeholder="Iv1.abc123def456"
							class="pl-10 font-mono text-sm"
							autocomplete="off"
						/>
					</div>
				</div>

				<!-- GitHub Client Secret -->
				<div class="space-y-2">
					<Label for="githubClientSecret">{m.admin_settings_oauth_github_client_secret()}</Label>
					<div class="relative">
						<Key
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="githubClientSecret"
							name="githubClientSecret"
							type={showGithubSecret ? 'text' : 'password'}
							placeholder={data.github.hasSecret
								? m.admin_settings_oauth_secret_placeholder()
								: 'secret_...'}
							class="pl-10 pr-10 font-mono text-sm"
							autocomplete="off"
						/>
						<button
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							onclick={() => (showGithubSecret = !showGithubSecret)}
						>
							{#if showGithubSecret}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
					{#if data.github.hasSecret}
						<p class="text-xs text-muted-foreground">
							{m.admin_settings_oauth_secret_placeholder()}
						</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex justify-end">
			<Button type="button" onclick={handleSave}>
				<Check class="mr-2 h-4 w-4" />
				{m.admin_settings_oauth_save()}
			</Button>
		</div>
	</form>

	<!-- Superuser credentials modal -->
	{#if showSuperuserModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<Card.Root class="w-full max-w-md">
				<Card.Header>
					<Card.Title>{m.admin_settings_oauth_pb_auth_title()}</Card.Title>
					<Card.Description>{m.admin_settings_oauth_pb_auth_description()}</Card.Description>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="space-y-2">
						<Label>{m.admin_settings_oauth_pb_auth_email()}</Label>
						<Input bind:value={pbAdminEmail} type="email" placeholder="admin@pocketbase.local" />
					</div>
					<div class="space-y-2">
						<Label>{m.admin_settings_oauth_pb_auth_password()}</Label>
						<Input bind:value={pbAdminPassword} type="password" />
					</div>
				</Card.Content>
				<Card.Footer class="flex justify-end gap-2">
					<Button variant="ghost" onclick={cancelModal}>{m.admin_settings_oauth_pb_auth_cancel()}</Button>
					<Button onclick={confirmSave} disabled={!pbAdminEmail || !pbAdminPassword}>{m.admin_settings_oauth_pb_auth_confirm()}</Button>
				</Card.Footer>
			</Card.Root>
		</div>
	{/if}
</div>
