<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowLeft, LayoutGrid } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
	<title>Planning Settings - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/admin/planning/{data.edition.slug}">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Planning Settings</h2>
			<p class="text-muted-foreground">{data.edition.name}</p>
		</div>
	</div>

	<!-- Overview -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<LayoutGrid class="h-5 w-5" />
				Overview
			</Card.Title>
			<Card.Description>Current planning configuration summary</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 md:grid-cols-4">
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">Rooms</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalRooms}</div>
				</div>
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">Tracks</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalTracks}</div>
				</div>
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">Slots</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalSlots}</div>
				</div>
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">Sessions</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalSessions}</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Quick Links -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Quick Links</Card.Title>
			<Card.Description>Navigate to related pages</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex gap-2">
				<a href="/admin/planning/{data.edition.slug}">
					<Button variant="outline">Planning Dashboard</Button>
				</a>
				<a href="/admin/editions/{data.edition.slug}/settings">
					<Button variant="outline">Edition Settings</Button>
				</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
