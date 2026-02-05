<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { ArrowLeft, Loader2, Lock } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()
let isSubmitting = $state(false)

const formatPrice = (priceInCents: number, currency: string) => {
  if (priceInCents === 0) return 'Free'
  const amount = priceInCents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}

const itemsJson = JSON.stringify(
  data.selectedItems.map((item) => ({
    ticketTypeId: item.ticketTypeId,
    quantity: item.quantity
  }))
)
</script>

<div class="mx-auto max-w-2xl space-y-8">
	<div class="flex items-center gap-4">
		<a href="/tickets/{data.edition.slug}">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<h1 class="text-3xl font-bold tracking-tight">Checkout</h1>
	</div>

	{#if form?.error}
		<div
			class="rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}

	<div class="grid gap-8 md:grid-cols-5">
		<!-- Order Form -->
		<div class="md:col-span-3">
			<Card.Root>
				<Card.Header>
					<Card.Title>Your Information</Card.Title>
					<Card.Description>
						This information will appear on your tickets.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						use:enhance={() => {
							isSubmitting = true
							return async ({ update }) => {
								isSubmitting = false
								await update()
							}
						}}
						class="space-y-4"
					>
						<input type="hidden" name="items" value={itemsJson} />

						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="firstName">First Name *</Label>
								<Input
									id="firstName"
									name="firstName"
									required
									placeholder="John"
								/>
							</div>
							<div class="space-y-2">
								<Label for="lastName">Last Name *</Label>
								<Input
									id="lastName"
									name="lastName"
									required
									placeholder="Doe"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="email">Email *</Label>
							<Input
								id="email"
								name="email"
								type="email"
								required
								placeholder="john@example.com"
							/>
							<p class="text-xs text-muted-foreground">
								Your tickets will be sent to this email address.
							</p>
						</div>

						<Button
							type="submit"
							class="w-full gap-2"
							size="lg"
							disabled={isSubmitting}
						>
							{#if isSubmitting}
								<Loader2 class="h-4 w-4 animate-spin" />
								Processing...
							{:else if data.isFree}
								Confirm Registration
							{:else}
								<Lock class="h-4 w-4" />
								Proceed to Payment
							{/if}
						</Button>
					</form>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Order Summary -->
		<div class="md:col-span-2">
			<Card.Root>
				<Card.Header>
					<Card.Title>Order Summary</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#each data.selectedItems as item}
						<div class="flex items-center justify-between">
							<div>
								<div class="font-medium">{item.ticketTypeName}</div>
								<div class="text-sm text-muted-foreground">x{item.quantity}</div>
							</div>
							<div class="font-medium">
								{formatPrice(item.price * item.quantity, item.currency)}
							</div>
						</div>
					{/each}
					<div class="border-t pt-4">
						<div class="flex items-center justify-between text-lg font-bold">
							<span>Total</span>
							<span>
								{formatPrice(
									data.totalAmount,
									data.selectedItems[0]?.currency || 'EUR'
								)}
							</span>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
