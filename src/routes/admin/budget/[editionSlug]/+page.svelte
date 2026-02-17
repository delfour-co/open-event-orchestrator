<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav, StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getBudgetNavItems } from '$lib/config'
import {
  ArrowLeft,
  DollarSign,
  Loader2,
  Pencil,
  Plus,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showCategoryForm = $state(false)
let showTransactionForm = $state(false)
let editingCategory = $state<(typeof data.categories)[0] | null>(null)
let editingTransaction = $state<(typeof data.transactions)[0] | null>(null)
let isSubmitting = $state(false)

const formatAmount = (amount: number, currency: string) => {
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

const formatDateInput = (dateStr: string | undefined) => {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  return new Date(dateStr).toISOString().split('T')[0]
}

const currency = $derived(data.budget?.currency || 'EUR')
const totalBudget = $derived(data.budget?.totalBudget || 0)
const balance = $derived(totalBudget - data.stats.totalExpenses + data.stats.totalIncome)
const usagePercent = $derived(
  totalBudget > 0 ? Math.min((data.stats.totalExpenses / totalBudget) * 100, 100) : 0
)

function startEditCategory(cat: (typeof data.categories)[0]) {
  editingCategory = cat
  showCategoryForm = true
}

function startEditTransaction(tx: (typeof data.transactions)[0]) {
  editingTransaction = tx
  showTransactionForm = true
}

function cancelCategoryForm() {
  showCategoryForm = false
  editingCategory = null
}

function cancelTransactionForm() {
  showTransactionForm = false
  editingTransaction = null
}

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (
      form.action === 'createCategory' ||
      form.action === 'updateCategory' ||
      form.action === 'deleteCategory'
    )
      cancelCategoryForm()
    if (
      form.action === 'createTransaction' ||
      form.action === 'updateTransaction' ||
      form.action === 'deleteTransaction'
    )
      cancelTransactionForm()
  }
})
</script>

<svelte:head>
	<title>Budget - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/budget">
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
		<div class="flex items-center gap-2">
			{#if !data.budget}
				<form method="POST" action="?/createBudget" use:enhance>
					<input type="hidden" name="editionId" value={data.edition.id} />
					<input type="hidden" name="totalBudget" value="0" />
					<input type="hidden" name="currency" value="EUR" />
					<Button type="submit">
						<Plus class="mr-2 h-4 w-4" />
						Initialize Budget
					</Button>
				</form>
			{:else}
				<StatusBadge status={data.budget.status} size="sm" />
				<a href="/admin/budget/{data.edition.slug}/settings">
					<Button variant="ghost" size="icon">
						<Settings class="h-5 w-5" />
					</Button>
				</a>
			{/if}
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/budget/{data.edition.slug}" items={getBudgetNavItems(data.edition.slug)} />

	{#if data.budget}
		<!-- Stats Cards -->
		<div class="grid gap-4 md:grid-cols-4">
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Total Budget</Card.Title>
					<a href="/admin/budget/{data.edition.slug}/settings">
						<Settings class="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
					</a>
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold">
						{formatAmount(totalBudget, currency)}
					</div>
					<div class="mt-2 h-2 w-full rounded-full bg-muted">
						<div
							class="h-2 rounded-full transition-all {usagePercent > 90 ? 'bg-destructive' : 'bg-primary'}"
							style="width: {usagePercent}%"
						></div>
					</div>
					<p class="mt-1 text-xs text-muted-foreground">
						{usagePercent.toFixed(0)}% used
					</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Expenses</Card.Title>
					<TrendingDown class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
						{formatAmount(data.stats.totalExpenses, currency)}
					</div>
					<p class="text-xs text-muted-foreground">paid expenses</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Income</Card.Title>
					<TrendingUp class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
						{formatAmount(data.stats.totalIncome, currency)}
					</div>
					<p class="text-xs text-muted-foreground">paid income</p>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Balance</Card.Title>
					<DollarSign class="h-4 w-4 text-muted-foreground" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold {balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
						{formatAmount(balance, currency)}
					</div>
					<p class="text-xs text-muted-foreground">
						budget - expenses + income
					</p>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Categories Section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-xl font-semibold">Categories</h3>
				<Button
					onclick={() => {
						editingCategory = null
						showCategoryForm = true
					}}
				>
					<Plus class="mr-2 h-4 w-4" />
					Add Category
				</Button>
			</div>

			{#if data.categories.length === 0}
				<Card.Root>
					<Card.Content class="flex flex-col items-center justify-center py-12">
						<Wallet class="mb-4 h-12 w-12 text-muted-foreground" />
						<h3 class="text-lg font-semibold">No categories yet</h3>
						<p class="text-sm text-muted-foreground">
							Add a category to start tracking budget items.
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b text-left text-sm text-muted-foreground">
									<th class="px-4 py-3 font-medium">Category</th>
									<th class="px-4 py-3 font-medium text-right">Planned</th>
									<th class="px-4 py-3 font-medium text-right">Spent</th>
									<th class="px-4 py-3 font-medium text-right">Remaining</th>
									<th class="px-4 py-3 font-medium">Progress</th>
									<th class="px-4 py-3 font-medium text-right">Transactions</th>
									<th class="px-4 py-3 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each data.categories as cat}
									{@const spentPercent = cat.plannedAmount > 0 ? Math.min((cat.spent / cat.plannedAmount) * 100, 100) : 0}
									{@const isOverBudget = cat.plannedAmount > 0 && cat.spent > cat.plannedAmount}
									{@const remaining = cat.plannedAmount - cat.spent}
									<tr class="border-b">
										<td class="px-4 py-3">
											<div class="font-medium">{cat.name}</div>
											{#if cat.notes}
												<div class="text-xs text-muted-foreground">{cat.notes}</div>
											{/if}
										</td>
										<td class="px-4 py-3 text-right text-sm font-medium">
											{formatAmount(cat.plannedAmount, currency)}
										</td>
										<td class="px-4 py-3 text-right text-sm font-medium {isOverBudget ? 'text-red-600 dark:text-red-400' : ''}">
											{formatAmount(cat.spent, currency)}
										</td>
										<td class="px-4 py-3 text-right text-sm font-medium {remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">
											{formatAmount(remaining, currency)}
										</td>
										<td class="px-4 py-3">
											{#if cat.plannedAmount > 0}
												<div class="flex items-center gap-2">
													<div class="h-2 w-24 rounded-full bg-muted">
														<div
															class="h-2 rounded-full transition-all {isOverBudget ? 'bg-destructive' : 'bg-primary'}"
															style="width: {spentPercent}%"
														></div>
													</div>
													<span class="text-xs text-muted-foreground">{spentPercent.toFixed(0)}%</span>
												</div>
											{:else}
												<span class="text-xs text-muted-foreground">-</span>
											{/if}
										</td>
										<td class="px-4 py-3 text-right text-sm">{cat.transactionCount}</td>
										<td class="px-4 py-3">
											<div class="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => startEditCategory(cat)}
												>
													<Pencil class="h-3 w-3" />
												</Button>
												{#if cat.transactionCount === 0}
													<form method="POST" action="?/deleteCategory" use:enhance>
														<input type="hidden" name="id" value={cat.id} />
														<Button
															type="submit"
															variant="ghost"
															size="icon"
															class="h-8 w-8 text-destructive hover:text-destructive"
														>
															<Trash2 class="h-3 w-3" />
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
				</Card.Root>
			{/if}
		</div>

		<!-- Transactions Section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h3 class="text-xl font-semibold">Transactions</h3>
				<Button
					onclick={() => {
						editingTransaction = null
						showTransactionForm = true
					}}
				>
					<Plus class="mr-2 h-4 w-4" />
					Add Transaction
				</Button>
			</div>

			{#if data.transactions.length === 0}
				<Card.Root>
					<Card.Content class="flex flex-col items-center justify-center py-12">
						<DollarSign class="mb-4 h-12 w-12 text-muted-foreground" />
						<h3 class="text-lg font-semibold">No transactions yet</h3>
						<p class="text-sm text-muted-foreground">
							Add a transaction to start tracking expenses and income.
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead>
								<tr class="border-b text-left text-sm text-muted-foreground">
									<th class="px-4 py-3 font-medium">Date</th>
									<th class="px-4 py-3 font-medium">Description</th>
									<th class="px-4 py-3 font-medium">Category</th>
									<th class="px-4 py-3 font-medium">Vendor</th>
									<th class="px-4 py-3 font-medium text-right">Amount</th>
									<th class="px-4 py-3 font-medium">Type</th>
									<th class="px-4 py-3 font-medium">Status</th>
									<th class="px-4 py-3 font-medium">Actions</th>
								</tr>
							</thead>
							<tbody>
								{#each data.transactions as tx}
									<tr class="border-b">
										<td class="px-4 py-3 text-sm">
											{formatDateInput(tx.date)}
										</td>
										<td class="px-4 py-3 text-sm font-medium">
											{tx.description}
											{#if tx.invoiceNumber}
												<div class="text-xs text-muted-foreground">#{tx.invoiceNumber}</div>
											{/if}
										</td>
										<td class="px-4 py-3 text-sm">{tx.categoryName}</td>
										<td class="px-4 py-3 text-sm">{tx.vendor || '-'}</td>
										<td class="px-4 py-3 text-sm text-right font-medium {tx.type === 'income' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}">
											{tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount, currency)}
										</td>
										<td class="px-4 py-3">
											<StatusBadge status={tx.type} size="sm" />
										</td>
										<td class="px-4 py-3">
											<StatusBadge status={tx.status} size="sm" />
										</td>
										<td class="px-4 py-3">
											<div class="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													class="h-8 w-8"
													onclick={() => startEditTransaction(tx)}
												>
													<Pencil class="h-3 w-3" />
												</Button>
												<form method="POST" action="?/deleteTransaction" use:enhance>
													<input type="hidden" name="id" value={tx.id} />
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
	{:else}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Wallet class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No budget initialized</h3>
				<p class="text-sm text-muted-foreground">
					Initialize a budget to start tracking expenses and income for this edition.
				</p>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- Category Form Dialog -->
{#if showCategoryForm && data.budget}
	<Dialog.Content class="max-w-lg" onClose={cancelCategoryForm}>
		<Dialog.Header>
			<Dialog.Title>{editingCategory ? 'Edit Category' : 'Add Category'}</Dialog.Title>
			<Dialog.Description>
				{editingCategory ? 'Update the category details.' : 'Add a new budget category.'}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && (form?.action === 'createCategory' || form?.action === 'updateCategory')}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action={editingCategory ? '?/updateCategory' : '?/createCategory'}
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-4"
		>
			{#if editingCategory}
				<input type="hidden" name="id" value={editingCategory.id} />
			{:else}
				<input type="hidden" name="budgetId" value={data.budget.id} />
			{/if}

			<div class="space-y-2">
				<Label for="cat-name">Name *</Label>
				<Input
					id="cat-name"
					name="name"
					placeholder="Category name"
					required
					value={editingCategory?.name || ''}
				/>
			</div>

			<div class="space-y-2">
				<Label for="cat-planned">Planned Amount</Label>
				<Input
					id="cat-planned"
					name="plannedAmount"
					type="number"
					step="0.01"
					min="0"
					placeholder="0"
					value={editingCategory?.plannedAmount?.toString() || '0'}
				/>
			</div>

			<div class="space-y-2">
				<Label for="cat-notes">Notes</Label>
				<Textarea
					id="cat-notes"
					name="notes"
					placeholder="Category notes..."
					value={editingCategory?.notes || ''}
				/>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={cancelCategoryForm}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{editingCategory ? 'Update' : 'Create'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

<!-- Transaction Form Dialog -->
{#if showTransactionForm && data.budget}
	<Dialog.Content class="max-w-lg" onClose={cancelTransactionForm}>
		<Dialog.Header>
			<Dialog.Title>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</Dialog.Title>
			<Dialog.Description>
				{editingTransaction ? 'Update the transaction details.' : 'Record a new expense or income.'}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && (form?.action === 'createTransaction' || form?.action === 'updateTransaction')}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action={editingTransaction ? '?/updateTransaction' : '?/createTransaction'}
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-4"
		>
			{#if editingTransaction}
				<input type="hidden" name="id" value={editingTransaction.id} />
			{/if}

			<div class="space-y-2">
				<Label for="tx-category">Category *</Label>
				<select
					id="tx-category"
					name="categoryId"
					required
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					{#each data.categories as cat}
						<option
							value={cat.id}
							selected={editingTransaction?.categoryId === cat.id}
						>{cat.name}</option>
					{/each}
				</select>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="tx-type">Type *</Label>
					<select
						id="tx-type"
						name="type"
						required
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<option value="expense" selected={!editingTransaction || editingTransaction.type === 'expense'}>Expense</option>
						<option value="income" selected={editingTransaction?.type === 'income'}>Income</option>
					</select>
				</div>
				<div class="space-y-2">
					<Label for="tx-amount">Amount *</Label>
					<Input
						id="tx-amount"
						name="amount"
						type="number"
						step="0.01"
						min="0"
						placeholder="0.00"
						required
						value={editingTransaction?.amount?.toString() || ''}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="tx-description">Description *</Label>
				<Input
					id="tx-description"
					name="description"
					placeholder="What is this transaction for?"
					required
					value={editingTransaction?.description || ''}
				/>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="tx-vendor">Vendor</Label>
					<Input
						id="tx-vendor"
						name="vendor"
						placeholder="Vendor name"
						value={editingTransaction?.vendor || ''}
					/>
				</div>
				<div class="space-y-2">
					<Label for="tx-invoice">Invoice Number</Label>
					<Input
						id="tx-invoice"
						name="invoiceNumber"
						placeholder="INV-2025-001"
						value={editingTransaction?.invoiceNumber || ''}
					/>
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="tx-date">Date</Label>
					<Input
						id="tx-date"
						name="date"
						type="date"
						value={formatDateInput(editingTransaction?.date)}
					/>
				</div>
				<div class="space-y-2">
					<Label for="tx-status">Status</Label>
					<select
						id="tx-status"
						name="status"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<option value="pending" selected={!editingTransaction || editingTransaction.status === 'pending'}>Pending</option>
						<option value="paid" selected={editingTransaction?.status === 'paid'}>Paid</option>
						<option value="cancelled" selected={editingTransaction?.status === 'cancelled'}>Cancelled</option>
					</select>
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={cancelTransactionForm}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{editingTransaction ? 'Update' : 'Create'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

{#if form?.error && (form?.action === 'deleteCategory' || form?.action === 'deleteTransaction')}
	<div
		class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg"
	>
		{form.error}
	</div>
{/if}
