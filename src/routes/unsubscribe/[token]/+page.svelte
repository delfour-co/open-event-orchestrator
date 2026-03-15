<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { MailX } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()
</script>

<svelte:head>
	<title>{m.unsubscribe_title()}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="text-center">
			<div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
				<MailX class="h-6 w-6 text-muted-foreground" />
			</div>
			<Card.Title class="text-xl">{m.unsubscribe_heading()}</Card.Title>
		</Card.Header>
		<Card.Content class="text-center">
			{#if form?.success || data.alreadyUnsubscribed}
				<div class="space-y-4">
					<p class="text-muted-foreground">
						{m.unsubscribe_success()}
					</p>
					<p class="text-sm text-muted-foreground">
						{m.unsubscribe_success_detail({ email: data.contactEmail })}
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					<p class="text-muted-foreground">
						{#if data.contactFirstName}
							{m.unsubscribe_prompt_hi({ name: data.contactFirstName, email: data.contactEmail })}
						{:else}
							{m.unsubscribe_prompt({ email: data.contactEmail })}
						{/if}
					</p>
					<form method="POST" use:enhance>
						<Button type="submit" variant="destructive" class="w-full">
							{m.unsubscribe_btn()}
						</Button>
					</form>
					<p class="text-xs text-muted-foreground">
						{m.unsubscribe_resubscribe_hint()}
					</p>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
