<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { AlertCircle, Archive, Check, CheckCircle2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let backupsEnabled = $state(data.backupsEnabled)
let backupsUseS3 = $state(data.backupsUseS3)
let showSuperuserModal = $state(false)
let pbAdminEmail = $state('')
let pbAdminPassword = $state('')
let formElement: HTMLFormElement

const isActive = $derived(data.backupsEnabled)

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
	<title>{m.admin_settings_backups_title()}</title>
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
			{m.admin_settings_backups_saved()}
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
					<Archive class="h-5 w-5" />
					{m.admin_settings_backups_title()}
				</Card.Title>
				<Card.Description>
					{m.admin_settings_backups_description()}
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-4">
				<!-- Enable toggle -->
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div>
						<div class="font-medium">{m.admin_settings_backups_enabled()}</div>
						<p class="text-sm text-muted-foreground">
							{m.admin_settings_backups_enabled_description()}
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" bind:checked={backupsEnabled} class="peer sr-only" />
						<input type="hidden" name="backupsEnabled" value={backupsEnabled ? 'true' : 'false'} />
						<div
							class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-400 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-600 dark:after:border-gray-500"
						></div>
					</label>
				</div>

				<!-- Cron schedule -->
				<div class="space-y-2">
					<Label for="backupsCron">{m.admin_settings_backups_cron()}</Label>
					<Input
						id="backupsCron"
						name="backupsCron"
						type="text"
						value={data.backupsCron}
						placeholder="0 0 * * *"
						class="font-mono text-sm"
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_backups_cron_hint()}
					</p>
				</div>

				<!-- Max backups -->
				<div class="space-y-2">
					<Label for="backupsMaxKeep">{m.admin_settings_backups_max_keep()}</Label>
					<Input
						id="backupsMaxKeep"
						name="backupsMaxKeep"
						type="number"
						value={String(data.backupsMaxKeep)}
						min="1"
						placeholder="7"
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_backups_max_keep_hint()}
					</p>
				</div>

				<!-- Use S3 -->
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div>
						<div class="font-medium">{m.admin_settings_backups_use_s3()}</div>
						<p class="text-sm text-muted-foreground">
							{m.admin_settings_backups_use_s3_hint()}
						</p>
					</div>
					<label class="relative inline-flex cursor-pointer items-center">
						<input type="checkbox" bind:checked={backupsUseS3} class="peer sr-only" />
						<input type="hidden" name="backupsUseS3" value={backupsUseS3 ? 'true' : 'false'} />
						<div
							class="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-400 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-gray-600 dark:after:border-gray-500"
						></div>
					</label>
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex justify-end">
			<Button type="button" onclick={handleSave}>
				<Check class="mr-2 h-4 w-4" />
				{m.admin_settings_backups_save()}
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
