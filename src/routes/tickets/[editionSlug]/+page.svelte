<script lang="ts">
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { Minus, Plus, ShoppingCart, Ticket } from 'lucide-svelte'
import type { LayoutData } from './$types'

interface Props {
  data: LayoutData
}

const { data }: Props = $props()

let quantities = $state<Record<string, number>>({})

const formatPrice = (priceInCents: number, currency: string) => {
  if (priceInCents === 0) return m.billing_free()
  const amount = priceInCents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}

const isAvailable = (tt: (typeof data.ticketTypes)[0]) => {
  const now = new Date()
  if (tt.salesStartDate && now < tt.salesStartDate) return false
  if (tt.salesEndDate && now > tt.salesEndDate) return false
  return tt.quantity - tt.quantitySold > 0
}

const remaining = (tt: (typeof data.ticketTypes)[0]) => {
  return tt.quantity - tt.quantitySold
}

const totalAmount = $derived(() => {
  let total = 0
  for (const tt of data.ticketTypes) {
    const qty = quantities[tt.id] || 0
    total += tt.price * qty
  }
  return total
})

const totalQuantity = $derived(() => {
  return Object.values(quantities).reduce((sum, qty) => sum + qty, 0)
})

function increment(id: string, max: number) {
  const current = quantities[id] || 0
  if (current < Math.min(max, 10)) {
    quantities[id] = current + 1
  }
}

function decrement(id: string) {
  const current = quantities[id] || 0
  if (current > 0) {
    quantities[id] = current - 1
  }
}

function proceedToCheckout() {
  const params = new URLSearchParams()
  for (const [id, qty] of Object.entries(quantities)) {
    if (qty > 0) {
      params.set(id, qty.toString())
    }
  }
  goto(`/tickets/${data.edition.slug}/checkout?${params.toString()}`)
}
</script>

<div class="mx-auto max-w-3xl space-y-8">
	<div class="text-center">
		<h1 class="text-4xl font-bold tracking-tight">{data.edition.name}</h1>
		{#if data.edition.venue || data.edition.city}
			<p class="mt-2 text-lg text-muted-foreground">
				{[data.edition.venue, data.edition.city].filter(Boolean).join(', ')}
			</p>
		{/if}
		<p class="mt-4 text-muted-foreground">{m.billing_tickets_select_below()}</p>
	</div>

	{#if data.ticketTypes.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Ticket class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">{m.billing_tickets_no_available()}</h3>
				<p class="text-sm text-muted-foreground">
					{m.billing_tickets_not_on_sale()}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="space-y-4">
			{#each data.ticketTypes as tt}
				{@const available = isAvailable(tt)}
				{@const remainingCount = remaining(tt)}
				<Card.Root class={!available ? 'opacity-60' : ''}>
					<Card.Content class="flex items-center justify-between p-6">
						<div class="flex-1">
							<h3 class="text-lg font-semibold">{tt.name}</h3>
							{#if tt.description}
								<p class="mt-1 text-sm text-muted-foreground">{tt.description}</p>
							{/if}
							<div class="mt-2 text-2xl font-bold">
								{formatPrice(tt.price, tt.currency)}
							</div>
							{#if remainingCount <= 20 && remainingCount > 0}
								<p class="mt-1 text-sm text-orange-600">
									{m.billing_tickets_only_left({ count: remainingCount })}
								</p>
							{/if}
							{#if !available}
								<p class="mt-1 text-sm text-destructive">
									{remainingCount === 0 ? m.billing_tickets_sold_out() : m.billing_tickets_not_on_sale_status()}
								</p>
							{/if}
						</div>

						{#if available}
							<div class="flex items-center gap-3">
								<Button
									variant="outline"
									size="icon"
									onclick={() => decrement(tt.id)}
									disabled={!quantities[tt.id]}
								>
									<Minus class="h-4 w-4" />
								</Button>
								<span class="w-8 text-center text-lg font-medium">
									{quantities[tt.id] || 0}
								</span>
								<Button
									variant="outline"
									size="icon"
									onclick={() => increment(tt.id, remainingCount)}
									disabled={(quantities[tt.id] || 0) >=
										Math.min(remainingCount, 10)}
								>
									<Plus class="h-4 w-4" />
								</Button>
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			{/each}
		</div>

		<!-- Cart Summary -->
		{#if totalQuantity() > 0}
			<div class="sticky bottom-4">
				<Card.Root class="border-2 border-primary shadow-lg">
					<Card.Content class="flex items-center justify-between p-6">
						<div>
							<div class="text-lg font-semibold">
								{totalQuantity()} {totalQuantity() > 1 ? m.billing_tickets_tickets() : m.billing_tickets_ticket()}
							</div>
							<div class="text-2xl font-bold">
								{totalAmount() === 0
									? m.billing_free()
									: formatPrice(totalAmount(), data.ticketTypes[0].currency)}
							</div>
						</div>
						<Button size="lg" onclick={proceedToCheckout} class="gap-2">
							<ShoppingCart class="h-5 w-5" />
							{m.billing_tickets_continue_checkout()}
						</Button>
					</Card.Content>
				</Card.Root>
			</div>
		{/if}
	{/if}
</div>
