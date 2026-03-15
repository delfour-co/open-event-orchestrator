<script lang="ts">
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { Handshake } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const getGridCols = (tier: number | undefined) => {
  if (!tier) return 'grid-cols-2 md:grid-cols-4' // Default/partners
  switch (tier) {
    case 1:
      return 'grid-cols-1 md:grid-cols-2' // Platinum - largest
    case 2:
      return 'grid-cols-2 md:grid-cols-3' // Gold
    case 3:
      return 'grid-cols-2 md:grid-cols-4' // Silver
    default:
      return 'grid-cols-3 md:grid-cols-5' // Bronze and below
  }
}

const getLogoSize = (tier: number | undefined) => {
  if (!tier) return 'h-16 w-auto max-w-[120px]'
  switch (tier) {
    case 1:
      return 'h-24 w-auto max-w-[200px]' // Platinum
    case 2:
      return 'h-20 w-auto max-w-[160px]' // Gold
    case 3:
      return 'h-16 w-auto max-w-[140px]' // Silver
    default:
      return 'h-12 w-auto max-w-[100px]' // Bronze
  }
}
</script>

<svelte:head>
	<title>{m.sponsors_page_title({ editionName: data.edition.name })}</title>
	<meta name="description" content={m.sponsors_page_subtitle({ eventName: data.event.name, year: String(data.edition.year) })} />
</svelte:head>

<div class="min-h-screen bg-background">
	<main class="container mx-auto px-4 py-12">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold tracking-tight mb-4">{m.sponsors_page_heading()}</h1>
			<p class="text-xl text-muted-foreground">
				{m.sponsors_page_subtitle({ eventName: data.event.name, year: String(data.edition.year) })}
			</p>
		</div>

		{#if data.totalSponsors === 0}
			<Card.Root class="max-w-md mx-auto">
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Handshake class="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
					<h2 class="text-lg font-semibold">{m.sponsors_page_coming_soon()}</h2>
					<p class="text-sm text-muted-foreground text-center">
						{m.sponsors_page_coming_soon_hint()}
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="space-y-16">
				{#each data.sponsorsByTier as tierGroup}
					<section class="text-center">
						<!-- Tier Header -->
						<h2 class="text-2xl font-semibold mb-8 inline-block">
							{#if tierGroup.package}
								{tierGroup.package.name} {m.sponsors_page_sponsors_suffix()}
							{:else}
								{m.sponsors_page_partners()}
							{/if}
						</h2>

						<!-- Sponsor Logos Grid -->
						<div class="grid gap-8 {getGridCols(tierGroup.package?.tier)} justify-items-center items-center">
							{#each tierGroup.sponsors as editionSponsor}
								{#if editionSponsor.sponsor}
									{@const sponsor = editionSponsor.sponsor}
									<a
										href={sponsor.website || '#'}
										target={sponsor.website ? '_blank' : undefined}
										rel={sponsor.website ? 'noopener noreferrer' : undefined}
										class="group flex items-center justify-center p-4 rounded-lg transition-all hover:bg-muted/50 {sponsor.website ? 'cursor-pointer' : 'cursor-default'}"
										aria-label={sponsor.website ? `${sponsor.name} - visit website` : sponsor.name}
									>
										{#if sponsor.logoThumbUrl || sponsor.logoUrl}
											<img
												src={sponsor.logoThumbUrl || sponsor.logoUrl}
												alt="{sponsor.name} logo"
												class="{getLogoSize(tierGroup.package?.tier)} object-contain grayscale hover:grayscale-0 transition-all group-hover:scale-105"
											/>
										{:else}
											<div class="flex items-center justify-center bg-muted rounded-lg p-6 {getLogoSize(tierGroup.package?.tier)}">
												<span class="text-lg font-semibold text-muted-foreground">
													{sponsor.name}
												</span>
											</div>
										{/if}
									</a>
								{/if}
							{/each}
						</div>
					</section>
				{/each}
			</div>

			<!-- Become a Sponsor CTA -->
			<div class="mt-16 text-center">
				<p class="text-muted-foreground">
					{m.sponsors_page_interested({ eventName: data.event.name })}
				</p>
				<a
					href="mailto:sponsors@example.com"
					class="inline-block mt-4 text-primary hover:underline font-medium"
				>
					{m.sponsors_page_contact()}
				</a>
			</div>
		{/if}
	</main>
</div>
