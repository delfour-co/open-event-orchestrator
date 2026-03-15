<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, HardDrive, Key } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let s3Enabled = $state(data.s3Enabled)
let s3ForcePathStyle = $state(data.s3ForcePathStyle)
let showSecretKey = $state(false)
let showSuperuserModal = $state(false)
let pbAdminEmail = $state('')
let pbAdminPassword = $state('')
let formElement: HTMLFormElement

const isActive = $derived(data.s3Enabled && !!data.s3Bucket && !!data.s3Endpoint)

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
	<title>{m.admin_settings_s3_title()}</title>
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
			{m.admin_settings_s3_saved()}
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

	<form bind:this={formElement} method="POST" action="?/save" use:enhance class="space-y-6">
		<!-- Hidden fields for PB superuser credentials -->
		<input type="hidden" name="pbAdminEmail" value={pbAdminEmail} />
		<input type="hidden" name="pbAdminPassword" value={pbAdminPassword} />

		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<HardDrive class="h-5 w-5" />
					{m.admin_settings_s3_title()}
				</Card.Title>
				<Card.Description>
					{m.admin_settings_s3_description()}
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Enable toggle -->
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div>
						<div class="font-medium">{m.admin_settings_s3_enabled()}</div>
						<p class="text-sm text-muted-foreground">
							{m.admin_settings_s3_enabled_description()}
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" bind:checked={s3Enabled} class="peer sr-only" />
						<input type="hidden" name="s3Enabled" value={s3Enabled ? 'true' : 'false'} />
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
						></div>
					</label>
				</div>

				<!-- Bucket -->
				<div class="space-y-2">
					<Label for="s3Bucket">{m.admin_settings_s3_bucket()}</Label>
					<Input
						id="s3Bucket"
						name="s3Bucket"
						type="text"
						value={data.s3Bucket}
						placeholder="my-bucket"
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_s3_bucket_hint()}
					</p>
				</div>

				<!-- Region -->
				<div class="space-y-2">
					<Label for="s3Region">{m.admin_settings_s3_region()}</Label>
					<Input
						id="s3Region"
						name="s3Region"
						type="text"
						value={data.s3Region}
						placeholder="us-east-1"
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_s3_region_hint()}
					</p>
				</div>

				<!-- Endpoint -->
				<div class="space-y-2">
					<Label for="s3Endpoint">{m.admin_settings_s3_endpoint()}</Label>
					<Input
						id="s3Endpoint"
						name="s3Endpoint"
						type="text"
						value={data.s3Endpoint}
						placeholder="https://s3.amazonaws.com"
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_s3_endpoint_hint()}
					</p>
				</div>

				<!-- Access Key -->
				<div class="space-y-2">
					<Label for="s3AccessKey">{m.admin_settings_s3_access_key()}</Label>
					<div class="relative">
						<Key
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="s3AccessKey"
							name="s3AccessKey"
							type="text"
							value={data.s3AccessKey}
							placeholder="AKIAIOSFODNN7EXAMPLE"
							class="pl-10 font-mono text-sm"
							autocomplete="off"
						/>
					</div>
				</div>

				<!-- Secret Key -->
				<div class="space-y-2">
					<Label for="s3SecretKey">{m.admin_settings_s3_secret_key()}</Label>
					<div class="relative">
						<Key
							class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							id="s3SecretKey"
							name="s3SecretKey"
							type={showSecretKey ? 'text' : 'password'}
							placeholder={data.hasSecretKey
								? m.admin_settings_s3_secret_configured()
								: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'}
							class="pl-10 pr-10 font-mono text-sm"
							autocomplete="off"
						/>
						<button
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
							onclick={() => (showSecretKey = !showSecretKey)}
						>
							{#if showSecretKey}
								<EyeOff class="h-4 w-4" />
							{:else}
								<Eye class="h-4 w-4" />
							{/if}
						</button>
					</div>
					{#if data.hasSecretKey}
						<p class="text-xs text-muted-foreground">
							{m.admin_settings_s3_secret_configured()}
						</p>
					{/if}
				</div>

				<!-- Force Path Style -->
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div>
						<div class="font-medium">{m.admin_settings_s3_force_path_style()}</div>
						<p class="text-sm text-muted-foreground">
							{m.admin_settings_s3_force_path_style_hint()}
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" bind:checked={s3ForcePathStyle} class="peer sr-only" />
						<input type="hidden" name="s3ForcePathStyle" value={s3ForcePathStyle ? 'true' : 'false'} />
						<div
							class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-700"
						></div>
					</label>
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex justify-end">
			<Button type="button" onclick={handleSave}>
				<Check class="mr-2 h-4 w-4" />
				{m.admin_settings_s3_save()}
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
