<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getBudgetNavItems } from '$lib/config'
import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

type QuoteItem = { description: string; quantity: number; unitPrice: number }
type Quote = (typeof data.quotes)[0]

const STATUS_FILTERS = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

let activeFilter = $state<StatusFilter>('all')
let showQuoteForm = $state(false)
let showConvertDialog = $state(false)
let editingQuote = $state<Quote | null>(null)
let convertingQuote = $state<Quote | null>(null)
let isSubmitting = $state(false)

// Line items state
let lineItems = $state<QuoteItem[]>([{ description: '', quantity: 1, unitPrice: 0 }])
let formCurrency = $state<'EUR' | 'USD' | 'GBP'>(data.budget?.currency || 'EUR')

const filteredQuotes = $derived(
  activeFilter === 'all' ? data.quotes : data.quotes.filter((q) => q.status === activeFilter)
)

const calculatedTotal = $derived(
  lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
)

const formatAmount = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}

const formatDate = (date: Date | undefined): string => {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const formatDateInput = (date: Date | undefined): string => {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'sent':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'accepted':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'expired':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

const getFilterCount = (status: StatusFilter): number => {
  if (status === 'all') return data.quotes.length
  return data.quotes.filter((q) => q.status === status).length
}

function openCreateForm(): void {
  editingQuote = null
  lineItems = [{ description: '', quantity: 1, unitPrice: 0 }]
  formCurrency = data.budget?.currency || 'EUR'
  showQuoteForm = true
}

function openEditForm(quote: Quote): void {
  editingQuote = quote
  lineItems =
    quote.items.length > 0
      ? quote.items.map((item) => ({ ...item }))
      : [{ description: '', quantity: 1, unitPrice: 0 }]
  formCurrency = quote.currency
  showQuoteForm = true
}

function closeQuoteForm(): void {
  showQuoteForm = false
  editingQuote = null
}

function openConvertDialog(quote: Quote): void {
  convertingQuote = quote
  showConvertDialog = true
}

function closeConvertDialog(): void {
  showConvertDialog = false
  convertingQuote = null
}

function addLineItem(): void {
  lineItems.push({ description: '', quantity: 1, unitPrice: 0 })
}

function removeLineItem(index: number): void {
  if (lineItems.length > 1) {
    lineItems.splice(index, 1)
  }
}

// Close dialogs on successful submission
$effect(() => {
  if (form?.success) {
    if (
      form.action === 'createQuote' ||
      form.action === 'updateQuote' ||
      form.action === 'deleteQuote' ||
      form.action === 'sendQuote' ||
      form.action === 'markAccepted' ||
      form.action === 'markRejected'
    ) {
      closeQuoteForm()
    }
    if (form.action === 'convertToTransaction') {
      closeConvertDialog()
    }
  }
})
</script>

<svelte:head>
	<title>Quotes - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/budget/{data.edition.slug}">
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">Quotes</h2>
				<p class="text-muted-foreground">{data.edition.name}</p>
			</div>
		</div>
		<Button onclick={openCreateForm}>
			<Plus class="mr-2 h-4 w-4" />
			New Quote
		</Button>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/budget/{data.edition.slug}" items={getBudgetNavItems(data.edition.slug)} />

	<!-- Status Filter Tabs -->
	<div class="flex flex-wrap gap-2">
		{#each STATUS_FILTERS as status}
			{@const count = getFilterCount(status)}
			<Button
				variant={activeFilter === status ? 'default' : 'outline'}
				size="sm"
				onclick={() => (activeFilter = status)}
			>
				{status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
				<span class="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground {activeFilter === status ? 'bg-primary-foreground/20 text-primary-foreground' : ''}">
					{count}
				</span>
			</Button>
		{/each}
	</div>

	<!-- Error message for inline actions -->
	{#if form?.error && (form?.action === 'deleteQuote' || form?.action === 'sendQuote' || form?.action === 'markAccepted' || form?.action === 'markRejected')}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			{form.error}
		</div>
	{/if}

	<!-- Quotes Table -->
	{#if filteredQuotes.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<FileText class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No quotes found</h3>
				<p class="text-sm text-muted-foreground">
					{activeFilter === 'all'
						? 'Create your first quote to start tracking vendor proposals.'
						: `No quotes with status "${activeFilter}".`}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b text-left text-sm text-muted-foreground">
							<th class="px-4 py-3 font-medium">Quote #</th>
							<th class="px-4 py-3 font-medium">Vendor</th>
							<th class="px-4 py-3 font-medium text-right">Amount</th>
							<th class="px-4 py-3 font-medium">Status</th>
							<th class="px-4 py-3 font-medium">Valid Until</th>
							<th class="px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredQuotes as quote}
							<tr class="border-b">
								<td class="px-4 py-3 text-sm font-medium">
									{quote.quoteNumber}
									{#if quote.description}
										<div class="text-xs text-muted-foreground">{quote.description}</div>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm">
									{quote.vendor}
									{#if quote.vendorEmail}
										<div class="text-xs text-muted-foreground">{quote.vendorEmail}</div>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm text-right font-medium">
									{formatAmount(quote.totalAmount, quote.currency)}
								</td>
								<td class="px-4 py-3">
									<span class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusBadgeClass(quote.status)}">
										{quote.status}
									</span>
								</td>
								<td class="px-4 py-3 text-sm">
									{formatDate(quote.validUntil)}
								</td>
								<td class="px-4 py-3">
									<div class="flex gap-1">
										<!-- Draft actions: Edit, Send, Delete -->
										{#if quote.status === 'draft'}
											<Button
												variant="ghost"
												size="icon"
												class="h-8 w-8"
												title="Edit"
												onclick={() => openEditForm(quote)}
											>
												<Pencil class="h-3 w-3" />
											</Button>
											<form method="POST" action="?/sendQuote" use:enhance>
												<input type="hidden" name="id" value={quote.id} />
												<Button
													type="submit"
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													title="Send"
												>
													<Send class="h-3 w-3" />
												</Button>
											</form>
											<form method="POST" action="?/deleteQuote" use:enhance>
												<input type="hidden" name="id" value={quote.id} />
												<Button
													type="submit"
													variant="ghost"
													size="icon"
													class="h-8 w-8 text-destructive hover:text-destructive"
													title="Delete"
												>
													<Trash2 class="h-3 w-3" />
												</Button>
											</form>
										{/if}

										<!-- Sent actions: Accept, Reject -->
										{#if quote.status === 'sent'}
											<form method="POST" action="?/markAccepted" use:enhance>
												<input type="hidden" name="id" value={quote.id} />
												<Button
													type="submit"
													variant="ghost"
													size="icon"
													class="h-8 w-8 text-green-600 hover:text-green-600"
													title="Accept"
												>
													<Check class="h-3 w-3" />
												</Button>
											</form>
											<form method="POST" action="?/markRejected" use:enhance>
												<input type="hidden" name="id" value={quote.id} />
												<Button
													type="submit"
													variant="ghost"
													size="icon"
													class="h-8 w-8 text-red-600 hover:text-red-600"
													title="Reject"
												>
													<X class="h-3 w-3" />
												</Button>
											</form>
										{/if}

										<!-- Accepted actions: Convert to Transaction -->
										{#if quote.status === 'accepted' && !quote.transactionId}
											<Button
												variant="ghost"
												size="icon"
												class="h-8 w-8"
												title="Convert to Transaction"
												onclick={() => openConvertDialog(quote)}
											>
												<ArrowRightLeft class="h-3 w-3" />
											</Button>
										{/if}

										{#if quote.transactionId}
											<span class="flex items-center text-xs text-muted-foreground px-2">
												Converted
											</span>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</Card.Root>
	{/if}
</div>

<!-- Quote Form Dialog -->
{#if showQuoteForm}
	<Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto" onClose={closeQuoteForm}>
		<Dialog.Header>
			<Dialog.Title>{editingQuote ? 'Edit Quote' : 'New Quote'}</Dialog.Title>
			<Dialog.Description>
				{editingQuote ? 'Update the quote details.' : 'Create a new vendor quote.'}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && (form?.action === 'createQuote' || form?.action === 'updateQuote')}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action={editingQuote ? '?/updateQuote' : '?/createQuote'}
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-4"
		>
			{#if editingQuote}
				<input type="hidden" name="id" value={editingQuote.id} />
			{/if}
			<input type="hidden" name="items" value={JSON.stringify(lineItems)} />
			<input type="hidden" name="totalAmount" value={calculatedTotal.toString()} />

			<!-- Vendor Info -->
			<div class="space-y-2">
				<Label for="q-vendor">Vendor *</Label>
				<Input
					id="q-vendor"
					name="vendor"
					placeholder="Vendor name"
					required
					value={editingQuote?.vendor || ''}
				/>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="q-vendorEmail">Vendor Email</Label>
					<Input
						id="q-vendorEmail"
						name="vendorEmail"
						type="email"
						placeholder="vendor@example.com"
						value={editingQuote?.vendorEmail || ''}
					/>
				</div>
				<div class="space-y-2">
					<Label for="q-currency">Currency</Label>
					<select
						id="q-currency"
						name="currency"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						bind:value={formCurrency}
					>
						<option value="EUR" selected={formCurrency === 'EUR'}>EUR</option>
						<option value="USD" selected={formCurrency === 'USD'}>USD</option>
						<option value="GBP" selected={formCurrency === 'GBP'}>GBP</option>
					</select>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="q-vendorAddress">Vendor Address</Label>
				<Textarea
					id="q-vendorAddress"
					name="vendorAddress"
					placeholder="Vendor address..."
					rows={2}
					value={editingQuote?.vendorAddress || ''}
				/>
			</div>

			<div class="space-y-2">
				<Label for="q-description">Description</Label>
				<Textarea
					id="q-description"
					name="description"
					placeholder="Quote description..."
					rows={2}
					value={editingQuote?.description || ''}
				/>
			</div>

			<!-- Line Items -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<Label>Line Items *</Label>
					<Button type="button" variant="outline" size="sm" onclick={addLineItem}>
						<Plus class="mr-1 h-3 w-3" />
						Add Item
					</Button>
				</div>

				<div class="space-y-2">
					<!-- Column headers -->
					<div class="grid grid-cols-[1fr_80px_100px_90px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
						<span>Description</span>
						<span>Qty</span>
						<span>Unit Price</span>
						<span class="text-right">Total</span>
						<span></span>
					</div>

					{#each lineItems as item, index}
						{@const lineTotal = item.quantity * item.unitPrice}
						<div class="grid grid-cols-[1fr_80px_100px_90px_32px] gap-2 items-center">
							<Input
								placeholder="Item description"
								required
								bind:value={item.description}
							/>
							<input
								type="number"
								min="1"
								step="1"
								required
								bind:value={item.quantity}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
							<input
								type="number"
								min="0"
								step="0.01"
								required
								bind:value={item.unitPrice}
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							/>
							<span class="text-sm text-right font-medium">
								{formatAmount(lineTotal, formCurrency)}
							</span>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								class="h-8 w-8 text-destructive hover:text-destructive"
								disabled={lineItems.length <= 1}
								onclick={() => removeLineItem(index)}
							>
								<Trash2 class="h-3 w-3" />
							</Button>
						</div>
					{/each}
				</div>

				<!-- Total -->
				<div class="flex items-center justify-end gap-4 border-t pt-3">
					<span class="text-sm font-medium text-muted-foreground">Total:</span>
					<span class="text-lg font-bold">
						{formatAmount(calculatedTotal, formCurrency)}
					</span>
				</div>
			</div>

			<!-- Additional Fields -->
			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="q-validUntil">Valid Until</Label>
					<Input
						id="q-validUntil"
						name="validUntil"
						type="date"
						value={formatDateInput(editingQuote?.validUntil)}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="q-notes">Notes</Label>
				<Textarea
					id="q-notes"
					name="notes"
					placeholder="Additional notes..."
					rows={2}
					value={editingQuote?.notes || ''}
				/>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={closeQuoteForm}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{editingQuote ? 'Update' : 'Create'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

<!-- Convert to Transaction Dialog -->
{#if showConvertDialog}
	<Dialog.Content class="max-w-md" onClose={closeConvertDialog}>
		<Dialog.Header>
			<Dialog.Title>Convert to Transaction</Dialog.Title>
			<Dialog.Description>
				Create a budget transaction from quote
				{convertingQuote?.quoteNumber || ''}.
				This will create a pending expense of
				{convertingQuote ? formatAmount(convertingQuote.totalAmount, convertingQuote.currency) : ''}.
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && form?.action === 'convertToTransaction'}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action="?/convertToTransaction"
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={convertingQuote?.id || ''} />

			<div class="space-y-2">
				<Label for="conv-category">Budget Category *</Label>
				<select
					id="conv-category"
					name="categoryId"
					required
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="" disabled selected>Select a category</option>
					{#each data.categories as cat}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={closeConvertDialog}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Convert
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}
