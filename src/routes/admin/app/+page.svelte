<script lang="ts">
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { ArrowRight, Calendar, ExternalLink, Eye, EyeOff, Smartphone } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let showArchived = $state(false)

// Filter editions by archived status
const filteredEditions = $derived(
  showArchived ? data.editions : data.editions.filter((e) => e.status !== 'archived')
)

// Count archived editions
const archivedCount = $derived(data.editions.filter((e) => e.status === 'archived').length)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
</script>

<svelte:head>
	<title>{m.admin_app_title()}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-bold tracking-tight">{m.admin_app_heading()}</h2>
			<p class="text-muted-foreground">
				{m.admin_app_description()}
			</p>
		</div>
		{#if archivedCount > 0}
			<Button variant="outline" onclick={() => (showArchived = !showArchived)}>
				{#if showArchived}
					<EyeOff class="mr-2 h-4 w-4" />
					{m.admin_app_hide_archived({ count: archivedCount })}
				{:else}
					<Eye class="mr-2 h-4 w-4" />
					{m.admin_app_show_archived({ count: archivedCount })}
				{/if}
			</Button>
		{/if}
	</div>

	{#if filteredEditions.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Smartphone class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">{m.admin_app_no_editions_title()}</h3>
				<p class="text-sm text-muted-foreground">
					{#if !showArchived && archivedCount > 0}
						{m.admin_app_all_archived()}
						<button class="text-primary underline" onclick={() => (showArchived = true)}>
							{m.admin_app_show_archived_link()}
						</button>
					{:else}
						{m.admin_app_create_edition_hint()}
					{/if}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each filteredEditions as edition}
				<Card.Root
					class="transition-shadow hover:shadow-md {edition.status === 'archived'
						? 'opacity-60'
						: ''}"
				>
					<Card.Header>
						<div class="flex items-start justify-between">
							<div>
								<Card.Title class="flex items-center gap-2">
									<Calendar class="h-5 w-5" />
									{edition.name}
								</Card.Title>
								{#if edition.eventName}
									<Card.Description class="mt-1">{edition.eventName}</Card.Description>
								{/if}
							</div>
							<StatusBadge status={edition.status} size="sm" />
						</div>
						<Card.Description>
							{formatDate(edition.startDate)} - {formatDate(edition.endDate)}
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#if edition.status === 'published'}
							<div class="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
								<Smartphone class="h-4 w-4 text-muted-foreground" />
								<code class="flex-1 text-xs">/app/{edition.slug}</code>
								<a
									href="/app/{edition.slug}"
									target="_blank"
									rel="noopener noreferrer"
									class="text-primary hover:text-primary/80"
									title="Open attendee app"
								>
									<ExternalLink class="h-4 w-4" />
								</a>
							</div>
						{/if}
						<a href="/admin/app/{edition.slug}">
							<Button class="w-full" variant="outline">
								{m.admin_app_configure()}
								<ArrowRight class="ml-2 h-4 w-4" />
							</Button>
						</a>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
