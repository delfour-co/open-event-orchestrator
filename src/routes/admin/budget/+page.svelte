<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowRight, Calendar, Settings, Wallet } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}
</script>

<svelte:head>
	<title>Budget - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h2 class="text-3xl font-bold tracking-tight">Budget</h2>
		<p class="text-muted-foreground">
			Select an edition to manage its budget, categories, and transactions.
		</p>
	</div>

	{#if data.editions.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Wallet class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No editions available</h3>
				<p class="text-sm text-muted-foreground">
					Create an edition to start managing budgets.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.editions as edition}
				<Card.Root class="transition-shadow hover:shadow-md">
					<Card.Header>
						<div class="flex items-start justify-between">
							<Card.Title class="flex items-center gap-2">
								<Calendar class="h-5 w-5" />
								{edition.name}
							</Card.Title>
							<div class="flex items-center gap-2">
								<a href="/admin/editions/{edition.slug}/settings" title="Change edition status">
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer hover:opacity-80 {getStatusColor(edition.status)}"
									>
										{edition.status}
									</span>
								</a>
								<a href="/admin/budget/{edition.slug}/settings" title="Budget Settings">
									<Button variant="ghost" size="icon" class="h-8 w-8">
										<Settings class="h-4 w-4" />
									</Button>
								</a>
							</div>
						</div>
						<Card.Description>
							{formatDate(edition.startDate)} - {formatDate(edition.endDate)}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<a href="/admin/budget/{edition.slug}">
							<Button class="w-full" variant="outline">
								Manage Budget
								<ArrowRight class="ml-2 h-4 w-4" />
							</Button>
						</a>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
