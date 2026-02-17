<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, Loader2, Lock } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()
let isSubmitting = $state(false)

const formatPrice = (priceInCents: number, currency: string) => {
  if (priceInCents === 0) return m.billing_free()
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
		<h1 class="text-3xl font-bold tracking-tight">{m.billing_checkout_title()}</h1>
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
					<Card.Title>{m.billing_checkout_your_info()}</Card.Title>
					<Card.Description>
						{m.billing_checkout_info_desc()}
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
								<Label for="firstName">{m.billing_checkout_first_name()} *</Label>
								<Input
									id="firstName"
									name="firstName"
									required
									placeholder="John"
								/>
							</div>
							<div class="space-y-2">
								<Label for="lastName">{m.billing_checkout_last_name()} *</Label>
								<Input
									id="lastName"
									name="lastName"
									required
									placeholder="Doe"
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="email">{m.billing_checkout_email()} *</Label>
							<Input
								id="email"
								name="email"
								type="email"
								required
								placeholder="john@example.com"
							/>
							<p class="text-xs text-muted-foreground">
								{m.billing_checkout_email_help()}
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
								{m.billing_checkout_processing()}
							{:else if data.isFree}
								{m.billing_checkout_confirm_registration()}
							{:else}
								<Lock class="h-4 w-4" />
								{m.billing_checkout_proceed_payment()}
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
					<Card.Title>{m.billing_checkout_order_summary()}</Card.Title>
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
							<span>{m.billing_checkout_total()}</span>
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
