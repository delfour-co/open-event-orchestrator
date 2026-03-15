<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { AlertCircle, Check, CheckCircle2, Settings } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()
</script>

<svelte:head>
	<title>{m.admin_settings_general_title()}</title>
</svelte:head>

<div class="space-y-6">
	{#if form?.success}
		<div
			class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			<CheckCircle2 class="mr-2 inline h-4 w-4" />
			{m.admin_settings_general_saved()}
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
				<Settings class="h-5 w-5" />
				{m.admin_settings_general_title()}
			</Card.Title>
			<Card.Description>
				{m.admin_settings_general_description()}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form method="POST" action="?/save" use:enhance class="space-y-4">
				<div class="space-y-2">
					<Label for="appName">{m.admin_settings_general_app_name()}</Label>
					<Input
						id="appName"
						name="appName"
						type="text"
						placeholder="Open Event Orchestrator"
						value={data.appName}
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_general_app_name_hint()}
					</p>
				</div>

				<div class="space-y-2">
					<Label for="appUrl">{m.admin_settings_general_app_url()}</Label>
					<Input
						id="appUrl"
						name="appUrl"
						type="url"
						placeholder="https://myapp.com"
						value={data.appUrl}
					/>
					<p class="text-xs text-muted-foreground">
						{m.admin_settings_general_app_url_hint()}
					</p>
				</div>

				<div class="flex justify-end">
					<Button type="submit">
						<Check class="mr-2 h-4 w-4" />
						{m.admin_settings_general_save()}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
