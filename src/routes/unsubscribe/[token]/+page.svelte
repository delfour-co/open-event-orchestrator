<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { MailX } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()
</script>

<svelte:head>
	<title>Unsubscribe - Open Event Orchestrator</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<MailX class="h-6 w-6 text-muted-foreground" />
			</div>
			<Card.Title class="text-xl">Email Unsubscribe</Card.Title>
		</Card.Header>
		<Card.Content class="text-center">
			{#if form?.success || data.alreadyUnsubscribed}
				<div class="space-y-4">
					<p class="text-muted-foreground">
						You have been successfully unsubscribed.
					</p>
					<p class="text-sm text-muted-foreground">
						<strong>{data.contactEmail}</strong> will no longer receive marketing emails.
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					<p class="text-muted-foreground">
						{#if data.contactFirstName}
							Hi {data.contactFirstName}, would
						{:else}
							Would
						{/if}
						you like to unsubscribe <strong>{data.contactEmail}</strong> from marketing emails?
					</p>
					<form method="POST" use:enhance>
						<Button type="submit" variant="destructive" class="w-full">
							Unsubscribe
						</Button>
					</form>
					<p class="text-xs text-muted-foreground">
						You can re-subscribe at any time by contacting the event organizer.
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
