<script lang="ts">
import * as m from '$lib/paraglide/messages'
import type { Snippet } from 'svelte'
import type { LayoutData } from './$types'

interface Props {
  data: LayoutData
  children: Snippet
}

let { data, children }: Props = $props()

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
</script>

<svelte:head>
	<title>{m.billing_tickets_page_title()} - {data.edition.name} | {m.common_app_name()}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	<!-- Header -->
	<header class="border-b bg-background">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-4">
				<a href="/" class="text-xl font-bold">{m.common_app_short_name()}</a>
				<span class="text-muted-foreground">/</span>
				<span class="font-medium">{data.edition.name}</span>
			</div>
			<nav class="flex items-center gap-4">
				<span class="text-sm text-muted-foreground">
					{formatDate(data.edition.startDate)}
					{#if data.edition.venue}
						- {data.edition.venue}
					{/if}
				</span>
			</nav>
		</div>
	</header>

	<!-- Content -->
	<main class="container mx-auto px-4 py-8">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t bg-background px-4 py-6">
		<div class="container mx-auto text-center text-sm text-muted-foreground">
			<p>{m.cfp_powered_by()}</p>
		</div>
	</footer>
</div>
