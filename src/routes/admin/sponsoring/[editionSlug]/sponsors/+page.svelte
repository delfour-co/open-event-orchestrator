<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowLeft, Building2, ExternalLink, Mail, Phone } from 'lucide-svelte'
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
</script>

<svelte:head>
	<title>All Sponsors - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/sponsoring/{data.edition.slug}">
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
				<p class="text-muted-foreground">
					{formatDate(data.edition.startDate)} - {formatDate(data.edition.endDate)}
				</p>
			</div>
		</div>
	</div>

	<!-- Sub-navigation -->
	<nav class="flex gap-1 rounded-lg border bg-muted/40 p-1">
		<a
			href="/admin/sponsoring/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Dashboard
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/packages"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Packages
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/sponsors"
			class="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
		>
			Sponsors
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/inquiries"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Inquiries
		</a>
	</nav>

	<!-- Sponsors Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-xl font-semibold">All Sponsors</h3>
		</div>

		{#if data.sponsors.length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Building2 class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">No sponsors in your organization</h3>
					<p class="text-sm text-muted-foreground">
						Create sponsors from the dashboard to manage your sponsor database.
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.sponsors as sponsor}
				<Card.Root>
					<Card.Header>
						<div class="flex items-start gap-4">
							{#if sponsor.logoUrl}
								<img
									src={sponsor.logoUrl}
									alt={sponsor.name}
									class="h-12 w-12 rounded object-contain border"
								/>
							{:else}
								<div class="flex h-12 w-12 items-center justify-center rounded bg-muted text-lg font-medium">
									{sponsor.name.slice(0, 2).toUpperCase()}
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<Card.Title class="truncate">{sponsor.name}</Card.Title>
								{#if sponsor.website}
									<a
										href={sponsor.website}
										target="_blank"
										rel="noopener noreferrer"
										class="text-sm text-primary hover:underline inline-flex items-center gap-1"
									>
										Website
										<ExternalLink class="h-3 w-3" />
									</a>
								{/if}
							</div>
						</div>
					</Card.Header>
					<Card.Content class="space-y-2 text-sm">
						{#if sponsor.contactName}
							<p class="font-medium">{sponsor.contactName}</p>
						{/if}
						{#if sponsor.contactEmail}
							<a
								href="mailto:{sponsor.contactEmail}"
								class="flex items-center gap-2 text-muted-foreground hover:text-foreground"
							>
								<Mail class="h-4 w-4" />
								{sponsor.contactEmail}
							</a>
						{/if}
						{#if sponsor.contactPhone}
							<p class="flex items-center gap-2 text-muted-foreground">
								<Phone class="h-4 w-4" />
								{sponsor.contactPhone}
							</p>
						{/if}
						{#if sponsor.description}
							<p class="text-muted-foreground line-clamp-2">{sponsor.description}</p>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
			</div>
		{/if}
	</div>
</div>
