<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Award, Check, Crown, Medal, Star, X } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

const getTierIcon = (tier: number) => {
  switch (tier) {
    case 1:
      return Crown
    case 2:
      return Star
    case 3:
      return Award
    default:
      return Medal
  }
}

const getTierColor = (tier: number) => {
  switch (tier) {
    case 1:
      return 'text-amber-500'
    case 2:
      return 'text-yellow-500'
    case 3:
      return 'text-gray-400'
    default:
      return 'text-orange-600'
  }
}

const getTierBorderColor = (tier: number) => {
  switch (tier) {
    case 1:
      return 'border-amber-500 ring-2 ring-amber-200'
    case 2:
      return 'border-yellow-500'
    case 3:
      return 'border-gray-400'
    default:
      return 'border-orange-600'
  }
}
</script>

<svelte:head>
  <title>Sponsorship Packages - {data.eventName}</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-12">
  <!-- Header -->
  <div class="mb-12 text-center">
    <h1 class="text-4xl font-bold tracking-tight">Become a Sponsor</h1>
    <p class="mt-4 text-lg text-muted-foreground">
      Support {data.eventName} and gain visibility with our community
    </p>
    <p class="mt-2 text-muted-foreground">
      {data.edition.name}
    </p>
  </div>

  {#if data.packages.length === 0}
    <div class="rounded-lg border border-dashed p-12 text-center">
      <p class="text-lg text-muted-foreground">
        No sponsorship packages are currently available for this edition.
      </p>
      <p class="mt-2 text-sm text-muted-foreground">
        Please check back later or contact the organizers for more information.
      </p>
    </div>
  {:else}
    <!-- Packages Grid -->
    <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-{Math.min(data.packages.length, 4)}">
      {#each data.packages as pkg}
        {@const TierIcon = getTierIcon(pkg.tier)}
        <Card.Root
          class="relative flex flex-col {getTierBorderColor(pkg.tier)} {!pkg.hasAvailableSlots ? 'opacity-60' : ''}"
        >
          {#if pkg.tier === 1}
            <div class="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="default" class="bg-amber-500 text-white">
                Most Popular
              </Badge>
            </div>
          {/if}

          <Card.Header class="text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <TierIcon class="h-8 w-8 {getTierColor(pkg.tier)}" />
            </div>
            <Card.Title class="text-2xl">{pkg.name}</Card.Title>
            <div class="mt-4">
              <span class="text-4xl font-bold">{formatPrice(pkg.price, pkg.currency)}</span>
            </div>
            {#if pkg.description}
              <Card.Description class="mt-2">
                {pkg.description}
              </Card.Description>
            {/if}
          </Card.Header>

          <Card.Content class="flex-1">
            <!-- Availability -->
            <div class="mb-6 text-center text-sm">
              {#if pkg.availableSlots === null}
                <span class="text-green-600">Unlimited spots available</span>
              {:else if pkg.availableSlots > 0}
                <span class="text-amber-600">
                  {pkg.availableSlots} spot{pkg.availableSlots > 1 ? 's' : ''} remaining
                </span>
              {:else}
                <span class="text-red-600">Sold out</span>
              {/if}
            </div>

            <!-- Benefits -->
            <ul class="space-y-3">
              {#each pkg.benefits as benefit}
                <li class="flex items-start gap-3">
                  {#if benefit.included}
                    <Check class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  {:else}
                    <X class="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground/50" />
                  {/if}
                  <span class={!benefit.included ? 'text-muted-foreground/50' : ''}>
                    {benefit.name}
                  </span>
                </li>
              {/each}
            </ul>
          </Card.Content>

          <Card.Footer class="pt-6">
            {#if pkg.hasAvailableSlots}
              <a
                href="/sponsor/{data.edition.slug}/checkout?package={pkg.id}"
                class="w-full"
              >
                <Button class="w-full" size="lg" variant={pkg.tier === 1 ? 'default' : 'outline'}>
                  Subscribe
                </Button>
              </a>
            {:else}
              <Button class="w-full" size="lg" variant="outline" disabled>
                Sold Out
              </Button>
            {/if}
          </Card.Footer>
        </Card.Root>
      {/each}
    </div>

    <!-- Contact Info -->
    <div class="mt-12 text-center">
      <p class="text-muted-foreground">
        Have questions about sponsorship? Contact our team for more information.
      </p>
    </div>
  {/if}
</div>
