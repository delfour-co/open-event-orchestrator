<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowRight, Calendar, Users } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
	<title>CRM - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-3xl font-bold tracking-tight">CRM</h2>
		<p class="text-muted-foreground">
			Select an event to manage its contacts, segments, and imports.
		</p>
	</div>

	{#if data.events.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Users class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No events available</h3>
				<p class="text-sm text-muted-foreground">
					Create an event to start managing contacts.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.events as event}
				<Card.Root class="transition-shadow hover:shadow-md">
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Calendar class="h-5 w-5" />
							{event.name}
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<a href="/admin/crm/{event.slug}">
							<Button class="w-full" variant="outline">
								Manage Contacts
								<ArrowRight class="ml-2 h-4 w-4" />
							</Button>
						</a>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
