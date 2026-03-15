<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { AlertCircle, Check, CheckCircle2, Clock } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

const isActive = $derived(data.auditLogRetentionDays > 0 && data.apiLogRetentionDays > 0)
</script>

<svelte:head>
	<title>{m.admin_settings_log_retention_title()}</title>
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
			{m.admin_settings_log_retention_saved()}
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

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Clock class="h-5 w-5" />
				{m.admin_settings_log_retention_title()}
			</Card.Title>
			<Card.Description>
				{m.admin_settings_log_retention_description()}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/save" use:enhance class="space-y-4">
				<!-- Audit log retention -->
				<div class="space-y-2">
					<Label for="auditLogRetentionDays">{m.admin_settings_log_retention_audit()}</Label>
					<Input
						id="auditLogRetentionDays"
						name="auditLogRetentionDays"
						type="number"
						value={data.auditLogRetentionDays}
						min="1"
						placeholder="90"
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_log_retention_audit_hint()}
					</p>
				</div>

				<!-- API log retention -->
				<div class="space-y-2">
					<Label for="apiLogRetentionDays">{m.admin_settings_log_retention_api()}</Label>
					<Input
						id="apiLogRetentionDays"
						name="apiLogRetentionDays"
						type="number"
						value={data.apiLogRetentionDays}
						min="1"
						placeholder="30"
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_log_retention_api_hint()}
					</p>
				</div>

				<div class="flex justify-end">
					<Button type="submit">
						<Check class="mr-2 h-4 w-4" />
						{m.admin_settings_log_retention_save()}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
