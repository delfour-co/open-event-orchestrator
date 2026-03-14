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

const branding = data.eventBranding
const primaryColor = branding?.primaryColor
const accentStyle = primaryColor ? `--ticket-primary: ${primaryColor};` : ''
</script>

<svelte:head>
	<title>{m.billing_tickets_page_title()} - {data.edition.name} | {m.common_app_name()}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30" style={accentStyle}>
	<!-- Banner -->
	{#if branding?.bannerUrl}
		<div class="relative h-48 w-full overflow-hidden">
			<img
				src={branding.bannerUrl}
				alt=""
				aria-hidden="true"
				class="h-full w-full object-cover"
			/>
			<div class="absolute inset-0 bg-gradient-to-b from-transparent to-background/80"></div>
		</div>
	{/if}

	<!-- Header -->
	<header class="border-b" style={primaryColor ? `background: ${primaryColor};` : ''}>
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-4">
				{#if branding?.logoUrl}
					<img
						src={branding.logoUrl}
						alt="{data.edition.name} logo"
						class="h-10 w-auto max-w-[120px] object-contain"
					/>
				{:else}
					<a href="/" class="text-xl font-bold" style={primaryColor ? 'color: white;' : ''}>{m.common_app_short_name()}</a>
				{/if}
				<span style={primaryColor ? 'color: rgba(255,255,255,0.6);' : ''} class="text-muted-foreground">/</span>
				<span class="font-medium" style={primaryColor ? 'color: white;' : ''}>{data.edition.name}</span>
			</div>
			<nav class="flex items-center gap-4">
				<span class="text-sm" style={primaryColor ? 'color: rgba(255,255,255,0.8);' : ''}>
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
