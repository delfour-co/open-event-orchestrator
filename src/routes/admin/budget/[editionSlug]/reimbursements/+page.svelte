<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav, formatDate as sharedFormatDate } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getBudgetNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Loader2,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let copiedUrl = $state(false)
let expandedRows = $state(new Set<string>())
let approveDialogOpen = $state(false)
let rejectDialogOpen = $state(false)
let selectedRequest = $state<(typeof data.requests)[0] | null>(null)
let isSubmitting = $state(false)

const publicReimbursementUrl = $derived(
  `${typeof window !== 'undefined' ? window.location.origin : ''}/speaker/${data.edition.slug}/reimbursements`
)

async function copyUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(publicReimbursementUrl)
    copiedUrl = true
    setTimeout(() => {
      copiedUrl = false
    }, 2000)
  } catch {
    const input = document.createElement('input')
    input.value = publicReimbursementUrl
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copiedUrl = true
    setTimeout(() => {
      copiedUrl = false
    }, 2000)
  }
}

const formatAmount = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  return sharedFormatDate(dateStr)
}

const currency = $derived(data.budget.currency)

const totalRequests = $derived(data.requests.length)
const pendingReview = $derived(
  data.requests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length
)
const approvedCount = $derived(
  data.requests.filter((r) => r.status === 'approved' || r.status === 'paid').length
)
const totalAmount = $derived(data.requests.reduce((sum, r) => sum + r.totalAmount, 0))

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'submitted':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'under_review':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'approved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'paid':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'draft':
      return m.budget_reimbursements_status_draft()
    case 'submitted':
      return m.budget_reimbursements_status_submitted()
    case 'under_review':
      return m.budget_reimbursements_status_under_review()
    case 'approved':
      return m.budget_reimbursements_status_approved()
    case 'rejected':
      return m.budget_reimbursements_status_rejected()
    case 'paid':
      return m.budget_reimbursements_status_paid()
    default:
      return status
  }
}

const getExpenseTypeLabel = (type: string): string => {
  switch (type) {
    case 'transport':
      return m.budget_reimbursements_type_transport()
    case 'accommodation':
      return m.budget_reimbursements_type_accommodation()
    case 'meals':
      return m.budget_reimbursements_type_meals()
    case 'other':
      return m.budget_reimbursements_type_other()
    default:
      return type
  }
}

function toggleRow(id: string): void {
  const next = new Set(expandedRows)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  expandedRows = next
}

function openApproveDialog(req: (typeof data.requests)[0]): void {
  selectedRequest = req
  approveDialogOpen = true
}

function openRejectDialog(req: (typeof data.requests)[0]): void {
  selectedRequest = req
  rejectDialogOpen = true
}

function closeApproveDialog(): void {
  approveDialogOpen = false
  selectedRequest = null
}

function closeRejectDialog(): void {
  rejectDialogOpen = false
  selectedRequest = null
}

$effect(() => {
  if (form?.success) {
    if (form.action === 'approve') closeApproveDialog()
    if (form.action === 'reject') closeRejectDialog()
  }
})
</script>

<svelte:head>
	<title>{m.budget_reimbursements_title({ name: data.edition.name })}</title>
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
				<h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<!-- Public URL -->
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
					<span class="text-sm text-muted-foreground">{m.budget_reimbursements_public_url()}</span>
					<code class="text-sm">/speaker/{data.edition.slug}/reimbursements</code>
				</div>
				<Button variant="outline" size="sm" onclick={copyUrl} class="gap-2">
					{#if copiedUrl}
						<Check class="h-4 w-4 text-green-500" />
						{m.budget_reimbursements_copied()}
					{:else}
						<Copy class="h-4 w-4" />
						{m.budget_reimbursements_copy()}
					{/if}
				</Button>
				<a href="/speaker/{data.edition.slug}/reimbursements" target="_blank" rel="noopener noreferrer">
					<Button variant="outline" size="sm" class="gap-2">
						<ExternalLink class="h-4 w-4" />
						{m.budget_reimbursements_open()}
					</Button>
				</a>
			</div>
			<form
				method="POST"
				action="?/exportCsv"
				use:enhance={() => {
					return async ({ result }) => {
						if (result.type === 'success' && result.data?.csv) {
							const blob = new Blob([result.data.csv as string], { type: 'text/csv' })
							const url = URL.createObjectURL(blob)
							const a = document.createElement('a')
							a.href = url
							a.download = `reimbursements-${data.edition.slug}.csv`
							a.click()
							URL.revokeObjectURL(url)
						}
					}
				}}
			>
				<Button type="submit" variant="outline">
					<Download class="mr-2 h-4 w-4" />
					{m.budget_reimbursements_export_csv()}
				</Button>
			</form>
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/budget/{data.edition.slug}" items={getBudgetNavItems(data.edition.slug)} />

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{m.budget_reimbursements_total_requests()}</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{totalRequests}</div>
				<p class="text-xs text-muted-foreground">{m.budget_reimbursements_requests()}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{m.budget_reimbursements_pending_review()}</Card.Title>
				<Eye class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
					{pendingReview}
				</div>
				<p class="text-xs text-muted-foreground">{m.budget_reimbursements_awaiting_action()}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{m.budget_reimbursements_approved()}</Card.Title>
				<Check class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-green-600 dark:text-green-400">
					{approvedCount}
				</div>
				<p class="text-xs text-muted-foreground">{m.budget_reimbursements_approved_or_paid()}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">{m.budget_reimbursements_total_amount()}</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">
					{formatAmount(totalAmount, currency)}
				</div>
				<p class="text-xs text-muted-foreground">{m.budget_reimbursements_across_all()}</p>
			</Card.Content>
		</Card.Root>
	</div>

	{#if form?.error && form.action !== 'exportCsv'}
		<div
			class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}

	<!-- Requests Table -->
	{#if data.requests.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Eye class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">{m.budget_reimbursements_no_requests()}</h3>
				<p class="text-sm text-muted-foreground">
					{m.budget_reimbursements_no_requests_hint()}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead>
						<tr class="border-b text-left text-sm text-muted-foreground">
							<th class="px-4 py-3 font-medium w-8"></th>
							<th class="px-4 py-3 font-medium">{m.budget_reimbursements_request_number()}</th>
							<th class="px-4 py-3 font-medium">{m.budget_reimbursements_speaker()}</th>
							<th class="px-4 py-3 font-medium text-right">{m.budget_reimbursements_total()}</th>
							<th class="px-4 py-3 font-medium">{m.budget_reimbursements_status()}</th>
							<th class="px-4 py-3 font-medium">{m.budget_reimbursements_submitted()}</th>
							<th class="px-4 py-3 font-medium">{m.budget_reimbursements_actions()}</th>
						</tr>
					</thead>
					<tbody>
						{#each data.requests as req}
							<!-- Main row -->
							<tr
								class="border-b cursor-pointer hover:bg-muted/50 transition-colors"
								onclick={() => toggleRow(req.id)}
							>
								<td class="px-4 py-3">
									{#if expandedRows.has(req.id)}
										<ChevronDown class="h-4 w-4 text-muted-foreground" />
									{:else}
										<ChevronRight class="h-4 w-4 text-muted-foreground" />
									{/if}
								</td>
								<td class="px-4 py-3 text-sm font-mono font-medium">
									{req.requestNumber}
								</td>
								<td class="px-4 py-3">
									<div class="text-sm font-medium">{req.speakerName}</div>
									<div class="text-xs text-muted-foreground">{req.speakerEmail}</div>
								</td>
								<td class="px-4 py-3 text-right text-sm font-medium">
									{formatAmount(req.totalAmount, req.currency || currency)}
								</td>
								<td class="px-4 py-3">
									<span
										class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusBadgeClass(req.status)}"
									>
										{getStatusLabel(req.status)}
									</span>
								</td>
								<td class="px-4 py-3 text-sm">
									{formatDate(req.submittedAt || req.createdAt)}
								</td>
								<td class="px-4 py-3">
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div class="flex gap-1" onclick={(e) => e.stopPropagation()}>
										{#if req.status === 'submitted'}
											<form method="POST" action="?/markUnderReview" use:enhance>
												<input type="hidden" name="id" value={req.id} />
												<Button type="submit" variant="outline" size="sm">
													<Eye class="mr-1 h-3 w-3" />
													{m.budget_reimbursements_review()}
												</Button>
											</form>
											<Button
												variant="outline"
												size="sm"
												class="text-green-600 hover:text-green-700"
												onclick={() => openApproveDialog(req)}
											>
												<Check class="mr-1 h-3 w-3" />
												{m.budget_reimbursements_approve()}
											</Button>
											<Button
												variant="outline"
												size="sm"
												class="text-red-600 hover:text-red-700"
												onclick={() => openRejectDialog(req)}
											>
												<X class="mr-1 h-3 w-3" />
												{m.budget_reimbursements_reject()}
											</Button>
										{:else if req.status === 'under_review'}
											<Button
												variant="outline"
												size="sm"
												class="text-green-600 hover:text-green-700"
												onclick={() => openApproveDialog(req)}
											>
												<Check class="mr-1 h-3 w-3" />
												{m.budget_reimbursements_approve()}
											</Button>
											<Button
												variant="outline"
												size="sm"
												class="text-red-600 hover:text-red-700"
												onclick={() => openRejectDialog(req)}
											>
												<X class="mr-1 h-3 w-3" />
												{m.budget_reimbursements_reject()}
											</Button>
										{:else if req.status === 'approved'}
											<form method="POST" action="?/markPaid" use:enhance>
												<input type="hidden" name="id" value={req.id} />
												<Button type="submit" variant="outline" size="sm">
													<Check class="mr-1 h-3 w-3" />
													{m.budget_reimbursements_mark_paid()}
												</Button>
											</form>
										{/if}
									</div>
								</td>
							</tr>

							<!-- Expanded detail row -->
							{#if expandedRows.has(req.id)}
								<tr class="border-b bg-muted/30">
									<td colspan="7" class="px-8 py-4">
										<div class="space-y-4">
											<!-- Request details -->
											<div class="grid gap-4 md:grid-cols-3">
												{#if req.notes}
													<div>
														<span class="text-xs font-medium text-muted-foreground">{m.budget_reimbursements_speaker_notes()}</span>
														<p class="mt-1 text-sm">{req.notes}</p>
													</div>
												{/if}
												{#if req.adminNotes}
													<div>
														<span class="text-xs font-medium text-muted-foreground">{m.budget_reimbursements_admin_notes()}</span>
														<p class="mt-1 text-sm">{req.adminNotes}</p>
													</div>
												{/if}
												{#if req.reviewedAt}
													<div>
														<span class="text-xs font-medium text-muted-foreground">{m.budget_reimbursements_reviewed()}</span>
														<p class="mt-1 text-sm">{formatDate(req.reviewedAt)}</p>
													</div>
												{/if}
											</div>

											<!-- Expense items -->
											{#if req.items.length > 0}
												<div>
													<h4 class="mb-2 text-sm font-semibold">
														{m.budget_reimbursements_expense_items()} ({req.items.length})
													</h4>
													<div class="overflow-x-auto rounded-md border">
														<table class="w-full">
															<thead>
																<tr class="border-b bg-muted/50 text-left text-xs text-muted-foreground">
																	<th class="px-3 py-2 font-medium">{m.budget_reimbursements_expense_type()}</th>
																	<th class="px-3 py-2 font-medium">{m.budget_reimbursements_expense_description()}</th>
																	<th class="px-3 py-2 font-medium text-right">{m.budget_reimbursements_expense_amount()}</th>
																	<th class="px-3 py-2 font-medium">{m.budget_reimbursements_expense_date()}</th>
																	<th class="px-3 py-2 font-medium">{m.budget_reimbursements_receipt()}</th>
																	<th class="px-3 py-2 font-medium">{m.budget_reimbursements_expense_notes()}</th>
																</tr>
															</thead>
															<tbody>
																{#each req.items as item}
																	<tr class="border-b last:border-b-0">
																		<td class="px-3 py-2 text-sm">
																			<span class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
																				{getExpenseTypeLabel(item.expenseType)}
																			</span>
																		</td>
																		<td class="px-3 py-2 text-sm">{item.description}</td>
																		<td class="px-3 py-2 text-right text-sm font-medium">
																			{formatAmount(item.amount, req.currency || currency)}
																		</td>
																		<td class="px-3 py-2 text-sm">{formatDate(item.date)}</td>
																		<td class="px-3 py-2 text-sm">
																			{#if item.receiptUrl}
																				<a
																					href={item.receiptUrl}
																					target="_blank"
																					rel="noopener noreferrer"
																					class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
																				>
																					{m.budget_reimbursements_view()}
																				</a>
																			{:else}
																				<span class="text-muted-foreground">-</span>
																			{/if}
																		</td>
																		<td class="px-3 py-2 text-sm text-muted-foreground">
																			{item.notes || '-'}
																		</td>
																	</tr>
																{/each}
															</tbody>
														</table>
													</div>
												</div>
											{:else}
												<p class="text-sm text-muted-foreground">
													{m.budget_reimbursements_no_items()}
												</p>
											{/if}
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
		</Card.Root>
	{/if}
</div>

<!-- Approve Dialog -->
{#if approveDialogOpen && selectedRequest}
	<Dialog.Content class="max-w-lg" onClose={closeApproveDialog}>
		<Dialog.Header>
			<Dialog.Title>{m.budget_reimbursements_approve_title()}</Dialog.Title>
			<Dialog.Description>
				{m.budget_reimbursements_approve_description({ number: selectedRequest.requestNumber, speaker: selectedRequest.speakerName, amount: formatAmount(selectedRequest.totalAmount, selectedRequest.currency || currency) })}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && form?.action === 'approve'}
			<div
				class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
			>
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action="?/approve"
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={selectedRequest.id} />

			<!-- Request summary -->
			<div class="rounded-md border p-3 space-y-1">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">{m.budget_reimbursements_request()}</span>
					<span class="font-mono font-medium">{selectedRequest.requestNumber}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">{m.budget_reimbursements_speaker()}</span>
					<span>{selectedRequest.speakerName}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">{m.budget_reimbursements_items()}</span>
					<span>{selectedRequest.itemCount}</span>
				</div>
				<div class="flex justify-between text-sm font-medium">
					<span class="text-muted-foreground">{m.budget_reimbursements_total()}</span>
					<span>{formatAmount(selectedRequest.totalAmount, selectedRequest.currency || currency)}</span>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="approve-category">{m.budget_quotes_budget_category()} *</Label>
				<select
					id="approve-category"
					name="categoryId"
					required
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="" disabled selected>{m.budget_quotes_select_category()}</option>
					{#each data.categories as cat}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
				<p class="text-xs text-muted-foreground">
					{m.budget_reimbursements_category_hint()}
				</p>
			</div>

			<div class="space-y-2">
				<Label for="approve-notes">{m.budget_reimbursements_admin_notes()}</Label>
				<Textarea
					id="approve-notes"
					name="adminNotes"
					placeholder={m.budget_reimbursements_notes_placeholder()}
					rows={3}
				/>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={closeApproveDialog}>
					{m.action_cancel()}
				</Button>
				<Button type="submit" disabled={isSubmitting} class="bg-green-600 hover:bg-green-700">
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{m.budget_reimbursements_approve_button()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

<!-- Reject Dialog -->
{#if rejectDialogOpen && selectedRequest}
	<Dialog.Content class="max-w-lg" onClose={closeRejectDialog}>
		<Dialog.Header>
			<Dialog.Title>{m.budget_reimbursements_reject_title()}</Dialog.Title>
			<Dialog.Description>
				{m.budget_reimbursements_reject_description({ number: selectedRequest.requestNumber, speaker: selectedRequest.speakerName })}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && form?.action === 'reject'}
			<div
				class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
			>
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action="?/reject"
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-4"
		>
			<input type="hidden" name="id" value={selectedRequest.id} />

			<!-- Request summary -->
			<div class="rounded-md border p-3 space-y-1">
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">{m.budget_reimbursements_request()}</span>
					<span class="font-mono font-medium">{selectedRequest.requestNumber}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-muted-foreground">{m.budget_reimbursements_speaker()}</span>
					<span>{selectedRequest.speakerName}</span>
				</div>
				<div class="flex justify-between text-sm font-medium">
					<span class="text-muted-foreground">{m.budget_reimbursements_total()}</span>
					<span>{formatAmount(selectedRequest.totalAmount, selectedRequest.currency || currency)}</span>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="reject-notes">{m.budget_reimbursements_reject_reason()} *</Label>
				<Textarea
					id="reject-notes"
					name="adminNotes"
					placeholder={m.budget_reimbursements_reject_reason_placeholder()}
					rows={4}
					required
				/>
				<p class="text-xs text-muted-foreground">
					{m.budget_reimbursements_reject_reason_hint()}
				</p>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={closeRejectDialog}>
					{m.action_cancel()}
				</Button>
				<Button type="submit" disabled={isSubmitting} variant="destructive">
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{m.budget_reimbursements_reject_button()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}
