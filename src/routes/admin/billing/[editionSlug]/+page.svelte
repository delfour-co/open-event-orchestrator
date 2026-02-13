<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  ArrowLeft,
  Check,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Settings,
  Ticket,
  Trash2,
  Users
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showTicketTypeForm = $state(false)
let copiedPublic = $state(false)
let copiedScanner = $state(false)

function copyPublicUrl() {
  navigator.clipboard.writeText(data.publicUrl)
  copiedPublic = true
  setTimeout(() => {
    copiedPublic = false
  }, 2000)
}

function copyScannerUrl() {
  navigator.clipboard.writeText(data.scannerUrl)
  copiedScanner = true
  setTimeout(() => {
    copiedScanner = false
  }, 2000)
}
let editingTicketType = $state<(typeof data.ticketTypes)[0] | null>(null)
let isSubmitting = $state(false)

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
    year: 'numeric'
  }).format(date)
}

const formatDateInput = (date: Date | undefined) => {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

function startEditTicketType(tt: (typeof data.ticketTypes)[0]) {
  editingTicketType = tt
  showTicketTypeForm = true
}

function cancelForm() {
  showTicketTypeForm = false
  editingTicketType = null
}

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (
      form.action === 'createTicketType' ||
      form.action === 'updateTicketType' ||
      form.action === 'deleteTicketType'
    ) {
      cancelForm()
    }
  }
})
</script>

<svelte:head>
	<title>Billetterie - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/billing">
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
				<p class="text-muted-foreground">
					{formatDate(data.edition.startDate)} - {formatDate(data.edition.endDate)}
				</p>
			</div>
		</div>
		<div class="flex flex-col items-end gap-2">
			<!-- Public URL -->
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
					<span class="text-sm text-muted-foreground">Tickets:</span>
					<code class="text-sm">/tickets/{data.edition.slug}</code>
				</div>
				<Button variant="outline" size="sm" onclick={copyPublicUrl} class="gap-2">
					{#if copiedPublic}
						<Check class="h-4 w-4 text-green-500" />
					{:else}
						<Copy class="h-4 w-4" />
					{/if}
				</Button>
				<a href="/tickets/{data.edition.slug}" target="_blank" rel="noopener noreferrer">
					<Button variant="outline" size="sm" class="gap-2">
						<ExternalLink class="h-4 w-4" />
					</Button>
				</a>
			</div>
			<!-- Scanner URL -->
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
					<span class="text-sm text-muted-foreground">Scanner:</span>
					<code class="text-sm">/scan/{data.edition.id}</code>
				</div>
				<Button variant="outline" size="sm" onclick={copyScannerUrl} class="gap-2">
					{#if copiedScanner}
						<Check class="h-4 w-4 text-green-500" />
					{:else}
						<Copy class="h-4 w-4" />
					{/if}
				</Button>
				<a href="/scan/{data.edition.id}" target="_blank" rel="noopener noreferrer">
					<Button variant="outline" size="sm" class="gap-2">
						<ExternalLink class="h-4 w-4" />
					</Button>
				</a>
			</div>
			<!-- Actions -->
			<div class="flex gap-2">
				<a href="/admin/billing/{data.edition.slug}/checkin">
					<Button variant="outline" class="gap-2">
						<QrCode class="h-4 w-4" />
						Check-in
					</Button>
				</a>
				<a href="/admin/billing/{data.edition.slug}/participants">
					<Button variant="outline" class="gap-2">
						<Users class="h-4 w-4" />
						Participants
					</Button>
				</a>
				<a href="/admin/billing/{data.edition.slug}/settings" title="Billing Settings">
					<Button variant="ghost" size="icon">
						<Settings class="h-4 w-4" />
					</Button>
				</a>
			</div>
		</div>
	</div>

	<!-- Stats Cards -->
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
				<p class="text-xs text-muted-foreground">
					{data.stats.paidOrders} paid orders
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Tickets Sold</Card.Title>
				<Ticket class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.ticketsSold}</div>
				<p class="text-xs text-muted-foreground">
					across {data.stats.totalOrders} orders
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Check-in</Card.Title>
				<Check class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.ticketsCheckedIn}</div>
				<p class="text-xs text-muted-foreground">
					{data.stats.ticketsSold > 0
						? Math.round((data.stats.ticketsCheckedIn / data.stats.ticketsSold) * 100)
						: 0}% checked in
				</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Orders</Card.Title>
				<CreditCard class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.totalOrders}</div>
				<p class="text-xs text-muted-foreground">
					{data.stats.paidOrders} paid, {data.stats.totalOrders - data.stats.paidOrders} other
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Ticket Types Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-xl font-semibold">Ticket Types</h3>
			<Button
				onclick={() => {
					editingTicketType = null
					showTicketTypeForm = true
				}}
			>
				<Plus class="mr-2 h-4 w-4" />
				Add Ticket Type
			</Button>
		</div>

		{#if data.ticketTypes.length === 0 && !showTicketTypeForm}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Ticket class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">No ticket types yet</h3>
					<p class="text-sm text-muted-foreground">
						Create your first ticket type to start selling tickets.
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.ticketTypes as tt}
					<Card.Root class={!tt.isActive ? 'opacity-60' : ''}>
						<Card.Header>
							<div class="flex items-start justify-between">
								<div>
									<Card.Title class="flex items-center gap-2">
										{tt.name}
										{#if !tt.isActive}
											<span
												class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
											>
												Inactive
											</span>
										{/if}
									</Card.Title>
									{#if tt.description}
										<Card.Description class="mt-1">{tt.description}</Card.Description>
									{/if}
								</div>
								<div class="flex gap-1">
									<Button
										variant="ghost"
										size="icon"
										onclick={() => startEditTicketType(tt)}
									>
										<Pencil class="h-4 w-4" />
									</Button>
									{#if tt.quantitySold === 0}
										<form method="POST" action="?/deleteTicketType" use:enhance>
											<input type="hidden" name="id" value={tt.id} />
											<Button
												type="submit"
												variant="ghost"
												size="icon"
												class="text-destructive hover:text-destructive"
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</form>
									{/if}
								</div>
							</div>
						</Card.Header>
						<Card.Content>
							<div class="space-y-2">
								<div class="text-2xl font-bold">
									{tt.price === 0 ? 'Free' : formatPrice(tt.price, tt.currency)}
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-foreground">Sold</span>
									<span class="font-medium"
										>{tt.quantitySold} / {tt.quantity}</span
									>
								</div>
								<div class="h-2 w-full rounded-full bg-muted">
									<div
										class="h-2 rounded-full bg-primary transition-all"
										style="width: {Math.min(
											(tt.quantitySold / tt.quantity) * 100,
											100
										)}%"
									></div>
								</div>
								{#if tt.salesStartDate || tt.salesEndDate}
									<div class="text-xs text-muted-foreground">
										{#if tt.salesStartDate}
											From {formatDate(tt.salesStartDate)}
										{/if}
										{#if tt.salesEndDate}
											until {formatDate(tt.salesEndDate)}
										{/if}
									</div>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Ticket Type Form Dialog -->
{#if showTicketTypeForm}
	<Dialog.Content class="max-w-lg" onClose={cancelForm}>
			<Dialog.Header>
				<Dialog.Title
					>{editingTicketType ? 'Edit Ticket Type' : 'Create Ticket Type'}</Dialog.Title
				>
				<Dialog.Description>
					{editingTicketType
						? 'Update the ticket type details.'
						: 'Define a new ticket type for this edition.'}
				</Dialog.Description>
			</Dialog.Header>

			{#if form?.error && (form?.action === 'createTicketType' || form?.action === 'updateTicketType')}
				<div
					class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
				>
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				action={editingTicketType ? '?/updateTicketType' : '?/createTicketType'}
				use:enhance={() => {
					isSubmitting = true
					return async ({ update }) => {
						isSubmitting = false
						await update()
					}
				}}
				class="space-y-4"
			>
				<input type="hidden" name="editionId" value={data.edition.id} />
				{#if editingTicketType}
					<input type="hidden" name="id" value={editingTicketType.id} />
				{/if}

				<div class="space-y-2">
					<Label for="tt-name">Name *</Label>
					<Input
						id="tt-name"
						name="name"
						placeholder="Early Bird"
						required
						value={editingTicketType?.name || ''}
					/>
				</div>

				<div class="space-y-2">
					<Label for="tt-description">Description</Label>
					<Textarea
						id="tt-description"
						name="description"
						placeholder="Describe what's included..."
						value={editingTicketType?.description || ''}
					/>
				</div>

				<div class="grid gap-4 md:grid-cols-3">
					<div class="space-y-2">
						<Label for="tt-price">Price (EUR)</Label>
						<Input
							id="tt-price"
							name="price"
							type="number"
							step="0.01"
							min="0"
							placeholder="49.00"
							value={editingTicketType
								? (editingTicketType.price / 100).toFixed(2)
								: ''}
						/>
						<p class="text-xs text-muted-foreground">0 for free tickets</p>
					</div>
					<div class="space-y-2">
						<Label for="tt-currency">Currency</Label>
						<select
							id="tt-currency"
							name="currency"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option
								value="EUR"
								selected={!editingTicketType ||
									editingTicketType.currency === 'EUR'}>EUR</option
							>
							<option
								value="USD"
								selected={editingTicketType?.currency === 'USD'}>USD</option
							>
							<option
								value="GBP"
								selected={editingTicketType?.currency === 'GBP'}>GBP</option
							>
						</select>
					</div>
					<div class="space-y-2">
						<Label for="tt-quantity">Quantity *</Label>
						<Input
							id="tt-quantity"
							name="quantity"
							type="number"
							min="1"
							placeholder="100"
							required
							value={editingTicketType?.quantity?.toString() || ''}
						/>
					</div>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="tt-start">Sales Start</Label>
						<Input
							id="tt-start"
							name="salesStartDate"
							type="date"
							value={formatDateInput(editingTicketType?.salesStartDate)}
						/>
					</div>
					<div class="space-y-2">
						<Label for="tt-end">Sales End</Label>
						<Input
							id="tt-end"
							name="salesEndDate"
							type="date"
							value={formatDateInput(editingTicketType?.salesEndDate)}
						/>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<input
						type="checkbox"
						id="tt-active"
						name="isActive"
						checked={editingTicketType?.isActive ?? true}
						class="h-4 w-4 rounded border-gray-300"
					/>
					<Label for="tt-active">Active (visible for sale)</Label>
				</div>

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={cancelForm}>Cancel</Button>
					<Button type="submit" disabled={isSubmitting}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						{editingTicketType ? 'Update' : 'Create'}
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
{/if}

{#if form?.error && form?.action === 'deleteTicketType'}
	<div
		class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg"
	>
		{form.error}
	</div>
{/if}
