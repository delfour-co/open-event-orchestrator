<script lang="ts">
import * as Card from '$lib/components/ui/card'
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
	<title>Our Sponsors - {data.edition.name}</title>
	<meta name="description" content="Thank you to all sponsors supporting {data.event.name} {data.edition.year}" />
</svelte:head>

<div class="min-h-screen bg-background">
	<div class="container mx-auto px-4 py-12">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold tracking-tight mb-4">Our Sponsors</h1>
			<p class="text-xl text-muted-foreground">
				Thank you to all our sponsors for supporting {data.event.name} {data.edition.year}
			</p>
		</div>

		{#if data.totalSponsors === 0}
			<Card.Root class="max-w-md mx-auto">
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Handshake class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">Sponsors coming soon</h3>
					<p class="text-sm text-muted-foreground text-center">
						We're currently working on partnerships for this edition.
						Check back soon!
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
								{tierGroup.package.name} Sponsors
							{:else}
								Partners
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
										title={sponsor.name}
									>
										{#if sponsor.logoThumbUrl || sponsor.logoUrl}
											<img
												src={sponsor.logoThumbUrl || sponsor.logoUrl}
												alt={sponsor.name}
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
					Interested in sponsoring {data.event.name}?
				</p>
				<a
					href="mailto:sponsors@example.com"
					class="inline-block mt-4 text-primary hover:underline font-medium"
				>
					Contact us about sponsorship opportunities
				</a>
			</div>
		{/if}
	</div>
</div>
