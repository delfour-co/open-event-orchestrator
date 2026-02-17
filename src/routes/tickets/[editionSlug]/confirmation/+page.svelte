<script lang="ts">
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { CheckCircle, Clock, Ticket } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const formatPrice = (priceInCents: number, currency: string) => {
  if (priceInCents === 0) return m.billing_free()
  const amount = priceInCents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}

const isPaid = data.order.status === 'paid'
const isPending = data.order.status === 'pending'
</script>

<div class="mx-auto max-w-2xl space-y-8">
	<!-- Status Header -->
	<div class="text-center">
		{#if isPaid}
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
			>
				<CheckCircle class="h-8 w-8 text-green-600" />
			</div>
			<h1 class="mt-4 text-3xl font-bold tracking-tight">{m.billing_confirmation_order_confirmed()}</h1>
			<p class="mt-2 text-muted-foreground">
				{m.billing_confirmation_tickets_sent()} <strong>{data.order.email}</strong>
			</p>
		{:else if isPending}
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100"
			>
				<Clock class="h-8 w-8 text-yellow-600" />
			</div>
			<h1 class="mt-4 text-3xl font-bold tracking-tight">{m.billing_confirmation_payment_processing()}</h1>
			<p class="mt-2 text-muted-foreground">
				{m.billing_confirmation_processing_desc()}
			</p>
		{:else}
			<div
				class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
			>
				<Ticket class="h-8 w-8 text-gray-600" />
			</div>
			<h1 class="mt-4 text-3xl font-bold tracking-tight">{m.billing_confirmation_order_number({ number: data.order.orderNumber })}</h1>
			<p class="mt-2 text-muted-foreground">
				{m.status_pending()}: {data.order.status}
			</p>
		{/if}
	</div>

	<!-- Order Details -->
	<Card.Root>
		<Card.Header>
			<Card.Title>{m.billing_confirmation_order_details()}</Card.Title>
			<Card.Description>{m.billing_confirmation_order_number({ number: data.order.orderNumber })}</Card.Description>
		</Card.Header>
		<Card.Content class="space-y-4">
			<div class="grid gap-2 text-sm">
				<div class="flex justify-between">
					<span class="text-muted-foreground">{m.billing_confirmation_name()}</span>
					<span class="font-medium"
						>{data.order.firstName} {data.order.lastName}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">{m.billing_confirmation_email()}</span>
					<span class="font-medium">{data.order.email}</span>
				</div>
			</div>

			<div class="border-t pt-4">
				{#each data.orderItems as item}
					<div class="flex items-center justify-between py-2">
						<div>
							<span class="font-medium">{item.ticketTypeName}</span>
							<span class="text-muted-foreground"> x{item.quantity}</span>
						</div>
						<span class="font-medium">
							{formatPrice(item.totalPrice, data.order.currency)}
						</span>
					</div>
				{/each}
			</div>

			<div class="border-t pt-4">
				<div class="flex items-center justify-between text-lg font-bold">
					<span>{m.billing_confirmation_total()}</span>
					<span>
						{formatPrice(data.order.totalAmount, data.order.currency)}
					</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Tickets -->
	{#if data.tickets.length > 0}
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">{m.billing_confirmation_your_tickets()}</h2>
			<p class="text-sm text-muted-foreground">
				{m.billing_confirmation_qr_help()}
			</p>

			{#each data.tickets as ticket}
				<Card.Root>
					<Card.Content class="p-6">
						<div class="flex items-start justify-between">
							<div>
								<div class="text-lg font-semibold">
									{ticket.attendeeFirstName}
									{ticket.attendeeLastName}
								</div>
								<div class="mt-1 text-sm text-muted-foreground">
									{m.billing_confirmation_ticket_number({ number: ticket.ticketNumber })}
								</div>
								<div class="mt-1 text-sm text-muted-foreground">
									{ticket.attendeeEmail}
								</div>
								<div class="mt-2">
									{#if ticket.status === 'valid'}
										<span
											class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
										>
											{m.billing_confirmation_status_valid()}
										</span>
									{:else if ticket.status === 'used'}
										<span
											class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
										>
											{m.billing_confirmation_status_used()}
										</span>
									{:else}
										<span
											class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
										>
											{ticket.status}
										</span>
									{/if}
								</div>
							</div>
							{#if ticket.qrCode}
								<div class="text-center">
									<img
										src={ticket.qrCode}
										alt={m.billing_confirmation_qr_alt({ number: ticket.ticketNumber })}
										class="h-32 w-32 rounded-lg"
									/>
								</div>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex justify-center gap-4 pb-8">
		<a href="/tickets/{data.edition.slug}">
			<button
				class="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
			>
				<Ticket class="h-4 w-4" />
				{m.billing_confirmation_buy_more()}
			</button>
		</a>
	</div>
</div>
