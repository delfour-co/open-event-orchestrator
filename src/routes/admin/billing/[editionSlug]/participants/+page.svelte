<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import {
  ArrowLeft,
  Ban,
  Check,
  CreditCard,
  DollarSign,
  Mail,
  Search,
  Ticket,
  Undo2,
  Users,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let activeTab = $state<'orders' | 'tickets' | 'participants'>('orders')
let searchQuery = $state('')

const formatPrice = (priceInCents: number, currency: string) => {
  const amount = priceInCents / 100
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
    case 'valid':
      return 'bg-green-100 text-green-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'used':
      return 'bg-blue-100 text-blue-800'
    case 'cancelled':
    case 'refunded':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const filteredOrders = $derived(() => {
  if (!searchQuery) return data.orders
  const q = searchQuery.toLowerCase()
  return data.orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.firstName.toLowerCase().includes(q) ||
      o.lastName.toLowerCase().includes(q)
  )
})

const filteredTickets = $derived(() => {
  if (!searchQuery) return data.tickets
  const q = searchQuery.toLowerCase()
  return data.tickets.filter(
    (t) =>
      t.ticketNumber.toLowerCase().includes(q) ||
      t.attendeeEmail.toLowerCase().includes(q) ||
      t.attendeeFirstName.toLowerCase().includes(q) ||
      t.attendeeLastName.toLowerCase().includes(q)
  )
})

// Unique participants from tickets
const participants = $derived(() => {
  const map = new Map<
    string,
    {
      email: string
      firstName: string
      lastName: string
      ticketCount: number
      checkedIn: boolean
    }
  >()
  for (const ticket of data.tickets) {
    if (ticket.status === 'cancelled') continue
    const key = ticket.attendeeEmail
    const existing = map.get(key)
    if (existing) {
      existing.ticketCount++
      if (ticket.status === 'used') existing.checkedIn = true
    } else {
      map.set(key, {
        email: ticket.attendeeEmail,
        firstName: ticket.attendeeFirstName,
        lastName: ticket.attendeeLastName,
        ticketCount: 1,
        checkedIn: ticket.status === 'used'
      })
    }
  }
  const result = Array.from(map.values())
  if (!searchQuery) return result
  const q = searchQuery.toLowerCase()
  return result.filter(
    (p) =>
      p.email.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q)
  )
})

const getTicketTypeName = (ticketTypeId: string) => {
  return data.ticketTypes.find((tt) => tt.id === ticketTypeId)?.name || 'Unknown'
}
</script>

<svelte:head>
	<title>Participants - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center gap-4">
		<a href="/admin/billing/{data.edition.slug}">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Participants</h2>
			<p class="text-muted-foreground">{data.edition.name}</p>
		</div>
	</div>

	{#if form?.success}
		<div
			class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			{#if form.action === 'cancelOrder'}Order cancelled successfully.
			{:else if form.action === 'refundOrder'}Order refunded successfully.
			{:else if form.action === 'resendEmail'}Confirmation email sent.
			{:else if form.action === 'markAsPaid'}Order marked as paid. Tickets generated.
			{:else if form.action === 'cancelTicket'}Ticket cancelled.
			{:else}Action completed.{/if}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}

	<!-- Stats -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Revenue</Card.Title>
				<DollarSign class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">
					{formatPrice(data.stats.totalRevenue, 'EUR')}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Orders</Card.Title>
				<CreditCard class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.paidOrders}</div>
				<p class="text-xs text-muted-foreground">
					of {data.stats.totalOrders} total
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Tickets</Card.Title>
				<Ticket class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.totalTickets}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Check-in Rate</Card.Title>
				<Check class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.checkInRate}%</div>
				<p class="text-xs text-muted-foreground">
					{data.stats.checkedIn} of {data.stats.totalTickets}
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Search and Tabs -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex gap-2">
			<Button
				variant={activeTab === 'orders' ? 'default' : 'ghost'}
				onclick={() => (activeTab = 'orders')}
				class="gap-2"
			>
				<CreditCard class="h-4 w-4" />
				Orders ({data.orders.length})
			</Button>
			<Button
				variant={activeTab === 'tickets' ? 'default' : 'ghost'}
				onclick={() => (activeTab = 'tickets')}
				class="gap-2"
			>
				<Ticket class="h-4 w-4" />
				Tickets ({data.tickets.length})
			</Button>
			<Button
				variant={activeTab === 'participants' ? 'default' : 'ghost'}
				onclick={() => (activeTab = 'participants')}
				class="gap-2"
			>
				<Users class="h-4 w-4" />
				Participants ({participants().length})
			</Button>
		</div>
		<div class="relative w-64">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder="Search..."
				bind:value={searchQuery}
				class="pl-9"
			/>
		</div>
	</div>

	<!-- Orders Tab -->
	{#if activeTab === 'orders'}
		{#if filteredOrders().length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<CreditCard class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">No orders found</h3>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="rounded-md border">
				<table class="w-full">
					<thead>
						<tr class="border-b bg-muted/50">
							<th class="p-3 text-left text-sm font-medium">Order</th>
							<th class="p-3 text-left text-sm font-medium">Customer</th>
							<th class="p-3 text-left text-sm font-medium">Status</th>
							<th class="p-3 text-right text-sm font-medium">Amount</th>
							<th class="p-3 text-right text-sm font-medium">Date</th>
							<th class="p-3 text-right text-sm font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredOrders() as order}
							<tr class="border-b">
								<td class="p-3">
									<div class="font-mono text-sm">{order.orderNumber}</div>
								</td>
								<td class="p-3">
									<div class="font-medium">
										{order.firstName}
										{order.lastName}
									</div>
									<div class="text-sm text-muted-foreground">
										{order.email}
									</div>
								</td>
								<td class="p-3">
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(order.status)}"
									>
										{order.status}
									</span>
								</td>
								<td class="p-3 text-right font-medium">
									{formatPrice(order.totalAmount, order.currency)}
								</td>
								<td class="p-3 text-right text-sm text-muted-foreground">
									{formatDate(order.createdAt)}
								</td>
								<td class="p-3 text-right">
									<div class="flex items-center justify-end gap-1">
										{#if order.status === 'paid'}
											<form
												method="POST"
												action="?/resendEmail"
												use:enhance
												class="inline"
											>
												<input type="hidden" name="orderId" value={order.id} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													title="Resend confirmation email"
												>
													<Mail class="h-3 w-3" />
												</Button>
											</form>
											<form
												method="POST"
												action="?/refundOrder"
												use:enhance
												class="inline"
											>
												<input type="hidden" name="orderId" value={order.id} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													class="text-orange-600 hover:text-orange-600"
													title="Refund order"
												>
													<Undo2 class="h-3 w-3" />
												</Button>
											</form>
										{/if}
										{#if order.status === 'pending'}
											<form
												method="POST"
												action="?/markAsPaid"
												use:enhance
												class="inline"
											>
												<input type="hidden" name="orderId" value={order.id} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													class="text-green-600 hover:text-green-600"
													title="Mark as paid"
												>
													<Check class="h-3 w-3" />
												</Button>
											</form>
											<form
												method="POST"
												action="?/cancelOrder"
												use:enhance
												class="inline"
											>
												<input type="hidden" name="orderId" value={order.id} />
												<Button
													type="submit"
													variant="ghost"
													size="sm"
													class="text-destructive hover:text-destructive"
													title="Cancel order"
												>
													<Ban class="h-3 w-3" />
												</Button>
											</form>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	<!-- Tickets Tab -->
	{#if activeTab === 'tickets'}
		{#if filteredTickets().length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Ticket class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">No tickets found</h3>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="rounded-md border">
				<table class="w-full">
					<thead>
						<tr class="border-b bg-muted/50">
							<th class="p-3 text-left text-sm font-medium">Ticket</th>
							<th class="p-3 text-left text-sm font-medium">Attendee</th>
							<th class="p-3 text-left text-sm font-medium">Type</th>
							<th class="p-3 text-left text-sm font-medium">Status</th>
							<th class="p-3 text-right text-sm font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredTickets() as ticket}
							<tr class="border-b">
								<td class="p-3">
									<div class="font-mono text-sm">{ticket.ticketNumber}</div>
								</td>
								<td class="p-3">
									<div class="font-medium">
										{ticket.attendeeFirstName}
										{ticket.attendeeLastName}
									</div>
									<div class="text-sm text-muted-foreground">
										{ticket.attendeeEmail}
									</div>
								</td>
								<td class="p-3 text-sm">
									{getTicketTypeName(ticket.ticketTypeId)}
								</td>
								<td class="p-3">
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(ticket.status)}"
									>
										{ticket.status}
									</span>
									{#if ticket.checkedInAt}
										<div class="mt-1 text-xs text-muted-foreground">
											{formatDate(ticket.checkedInAt)}
										</div>
									{/if}
								</td>
								<td class="p-3 text-right">
									{#if ticket.status === 'valid'}
										<form
											method="POST"
											action="?/cancelTicket"
											use:enhance
											class="inline"
										>
											<input
												type="hidden"
												name="ticketId"
												value={ticket.id}
											/>
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												class="text-destructive hover:text-destructive"
											>
												<X class="mr-1 h-3 w-3" />
												Cancel
											</Button>
										</form>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}

	<!-- Participants Tab -->
	{#if activeTab === 'participants'}
		{#if participants().length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Users class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">No participants found</h3>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="rounded-md border">
				<table class="w-full">
					<thead>
						<tr class="border-b bg-muted/50">
							<th class="p-3 text-left text-sm font-medium">Name</th>
							<th class="p-3 text-left text-sm font-medium">Email</th>
							<th class="p-3 text-center text-sm font-medium">Tickets</th>
							<th class="p-3 text-center text-sm font-medium">Checked In</th>
						</tr>
					</thead>
					<tbody>
						{#each participants() as participant}
							<tr class="border-b">
								<td class="p-3 font-medium">
									{participant.firstName}
									{participant.lastName}
								</td>
								<td class="p-3 text-sm text-muted-foreground">
									{participant.email}
								</td>
								<td class="p-3 text-center">{participant.ticketCount}</td>
								<td class="p-3 text-center">
									{#if participant.checkedIn}
										<span
											class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
										>
											<Check class="h-3 w-3" />
											Yes
										</span>
									{:else}
										<span class="text-sm text-muted-foreground">No</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>
