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
import { ArrowLeft, ExternalLink, FileText, FileUp, Loader2, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showUploadDialog = $state(false)
let isSubmitting = $state(false)

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const isOverdue = (dueDate: Date | undefined) => {
  if (!dueDate) return false
  return new Date() > dueDate
}

function closeUploadDialog() {
  showUploadDialog = false
}

$effect(() => {
  if (form?.success && form?.action === 'uploadInvoice') {
    closeUploadDialog()
  }
})
</script>

<svelte:head>
	<title>Invoices - {data.edition.name} - Open Event Orchestrator</title>
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
				<h2 class="text-3xl font-bold tracking-tight">Invoices</h2>
				<p class="text-muted-foreground">{data.edition.name}</p>
			</div>
		</div>
		<Button
			onclick={() => {
				showUploadDialog = true
			}}
		>
			<FileUp class="mr-2 h-4 w-4" />
			Upload Invoice
		</Button>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/budget/{data.edition.slug}" items={getBudgetNavItems(data.edition.slug)} />

	<!-- Error display -->
	{#if form?.error && (form?.action === 'deleteInvoice')}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			{form.error}
		</div>
	{/if}

	<!-- Stats Card -->
	<div class="grid gap-4 md:grid-cols-1">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Invoices</Card.Title>
				<FileText class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.invoices.length}</div>
				<p class="text-xs text-muted-foreground">
					invoices attached to transactions
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Invoices Table -->
	{#if data.invoices.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<FileText class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No invoices yet</h3>
				<p class="text-sm text-muted-foreground">
					Upload an invoice to attach it to a transaction.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b text-left text-sm text-muted-foreground">
							<th class="px-4 py-3 font-medium">Invoice #</th>
							<th class="px-4 py-3 font-medium">Transaction</th>
							<th class="px-4 py-3 font-medium">Vendor</th>
							<th class="px-4 py-3 font-medium text-right">Amount</th>
							<th class="px-4 py-3 font-medium">Issue Date</th>
							<th class="px-4 py-3 font-medium">Due Date</th>
							<th class="px-4 py-3 font-medium">File</th>
							<th class="px-4 py-3 font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.invoices as invoice}
							{@const overdue = isOverdue(invoice.dueDate)}
							<tr class="border-b">
								<td class="px-4 py-3 text-sm font-medium">
									{invoice.invoiceNumber}
								</td>
								<td class="px-4 py-3 text-sm">
									{invoice.transactionDescription}
								</td>
								<td class="px-4 py-3 text-sm">
									{invoice.transactionVendor || '-'}
								</td>
								<td class="px-4 py-3 text-sm text-right font-medium">
									{formatAmount(invoice.amount)}
								</td>
								<td class="px-4 py-3 text-sm">
									{formatDate(invoice.issueDate)}
								</td>
								<td class="px-4 py-3 text-sm">
									{#if invoice.dueDate}
										<span class={overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}>
											{formatDate(invoice.dueDate)}
											{#if overdue}
												<span class="ml-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
													Overdue
												</span>
											{/if}
										</span>
									{:else}
										<span class="text-muted-foreground">-</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm">
									{#if invoice.file && invoice.fileUrl}
										<a
											href={invoice.fileUrl}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center gap-1 text-primary hover:underline"
										>
											<ExternalLink class="h-3 w-3" />
											{invoice.file}
										</a>
									{:else}
										<span class="text-muted-foreground">No file</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<div class="flex gap-1">
										{#if invoice.file && invoice.fileUrl}
											<a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer">
												<Button variant="ghost" size="icon" class="h-8 w-8">
													<ExternalLink class="h-3 w-3" />
												</Button>
											</a>
										{/if}
										<form method="POST" action="?/deleteInvoice" use:enhance>
											<input type="hidden" name="id" value={invoice.id} />
											<Button
												type="submit"
												variant="ghost"
												size="icon"
												class="h-8 w-8 text-destructive hover:text-destructive"
											>
												<Trash2 class="h-3 w-3" />
											</Button>
										</form>
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

<!-- Upload Invoice Dialog -->
{#if showUploadDialog}
	<Dialog.Content class="max-w-lg" onClose={closeUploadDialog}>
			<Dialog.Header>
				<Dialog.Title>Upload Invoice</Dialog.Title>
				<Dialog.Description>
					Attach an invoice to a budget transaction.
				</Dialog.Description>
			</Dialog.Header>

			{#if form?.error && form?.action === 'uploadInvoice'}
				<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				action="?/uploadInvoice"
				enctype="multipart/form-data"
				use:enhance={() => {
					isSubmitting = true
					return async ({ update }) => {
						isSubmitting = false
						await update()
					}
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="inv-transaction">Transaction *</Label>
					<select
						id="inv-transaction"
						name="transactionId"
						required
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<option value="">Select a transaction</option>
						{#each data.transactions as tx}
							<option value={tx.id}>
								{tx.description} - {tx.vendor ? tx.vendor + ' - ' : ''}{formatAmount(tx.amount)}
							</option>
						{/each}
					</select>
				</div>

				<div class="space-y-2">
					<Label for="inv-number">Invoice Number *</Label>
					<Input
						id="inv-number"
						name="invoiceNumber"
						placeholder="INV-2025-001"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label for="inv-file">File</Label>
					<Input
						id="inv-file"
						name="file"
						type="file"
						accept=".pdf,.jpg,.jpeg,.png"
					/>
					<p class="text-xs text-muted-foreground">
						Accepted formats: PDF, JPG, PNG
					</p>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="inv-issue-date">Issue Date *</Label>
						<Input
							id="inv-issue-date"
							name="issueDate"
							type="date"
							required
							value={new Date().toISOString().split('T')[0]}
						/>
					</div>
					<div class="space-y-2">
						<Label for="inv-due-date">Due Date</Label>
						<Input
							id="inv-due-date"
							name="dueDate"
							type="date"
						/>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="inv-amount">Amount *</Label>
					<Input
						id="inv-amount"
						name="amount"
						type="number"
						step="0.01"
						min="0"
						placeholder="0.00"
						required
					/>
				</div>

				<div class="space-y-2">
					<Label for="inv-notes">Notes</Label>
					<Textarea
						id="inv-notes"
						name="notes"
						placeholder="Invoice notes..."
					/>
				</div>

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={closeUploadDialog}>Cancel</Button>
					<Button type="submit" disabled={isSubmitting}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Upload
					</Button>
				</Dialog.Footer>
			</form>
		</Dialog.Content>
{/if}
