<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, LayoutGrid } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
	<title>{m.planning_settings_page_title({ name: data.edition.name })}</title>
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
			<h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
		</div>
	</div>

	<!-- Tab Navigation -->
	<nav class="flex gap-1 rounded-lg border bg-muted/40 p-1">
		<a
			href="/admin/planning/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			{m.planning_tab_schedule()}
		</a>
		<a
			href="/admin/planning/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			{m.planning_tab_sessions()} ({data.stats.totalSessions})
		</a>
		<a
			href="/admin/planning/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			{m.planning_tab_rooms()} ({data.stats.totalRooms})
		</a>
		<a
			href="/admin/planning/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			{m.planning_tab_tracks()} ({data.stats.totalTracks})
		</a>
		<a
			href="/admin/planning/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			{m.planning_tab_slots()} ({data.stats.totalSlots})
		</a>
		<a
			href="/admin/planning/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			{m.planning_tab_staff()}
		</a>
		<span
			class="rounded-md px-3 py-1.5 text-sm font-medium bg-background shadow-sm"
		>
			{m.planning_tab_settings()}
		</span>
	</nav>

	<!-- Overview -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<LayoutGrid class="h-5 w-5" />
				{m.planning_settings_overview()}
			</Card.Title>
			<Card.Description>{m.planning_settings_overview_desc()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 md:grid-cols-4">
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">{m.planning_settings_rooms()}</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalRooms}</div>
				</div>
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">{m.planning_settings_tracks()}</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalTracks}</div>
				</div>
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">{m.planning_settings_slots()}</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalSlots}</div>
				</div>
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">{m.planning_settings_sessions()}</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalSessions}</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Quick Links -->
	<Card.Root>
		<Card.Header>
			<Card.Title>{m.planning_settings_quick_links()}</Card.Title>
			<Card.Description>{m.planning_settings_quick_links_desc()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex gap-2">
				<a href="/admin/planning/{data.edition.slug}">
					<Button variant="outline">{m.planning_settings_dashboard()}</Button>
				</a>
				<a href="/admin/editions/{data.edition.slug}/settings">
					<Button variant="outline">{m.planning_settings_edition()}</Button>
				</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
