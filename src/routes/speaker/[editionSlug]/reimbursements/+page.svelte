<script lang="ts">
import { enhance } from '$app/forms'
import { StatusBadge, formatDate } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  Mail,
  Paperclip,
  Plus,
  Send,
  Trash2
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let email = $state('')
let isRequestingAccess = $state(false)
let showCreateForm = $state(false)
let showAddItemForm = $state(false)
let activeRequestId = $state<string | null>(null)
let expandedRequests = $state<Set<string>>(new Set())
let isSubmitting = $state(false)

const formatAmount = (amount: number, currency: string) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(amount)
}

const getExpenseTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    transport: m.speaker_reimbursements_type_transport(),
    accommodation: m.speaker_reimbursements_type_accommodation(),
    meals: m.speaker_reimbursements_type_meals(),
    other: m.speaker_reimbursements_type_other()
  }
  return labels[type] || type
}

function toggleExpand(requestId: string) {
  const next = new Set(expandedRequests)
  if (next.has(requestId)) {
    next.delete(requestId)
  } else {
    next.add(requestId)
  }
  expandedRequests = next
}

function openAddItemForm(requestId: string) {
  activeRequestId = requestId
  showAddItemForm = true
}

function closeAddItemForm() {
  showAddItemForm = false
  activeRequestId = null
}

$effect(() => {
  if (form?.success) {
    showCreateForm = false
    closeAddItemForm()
  }
})
</script>

<svelte:head>
	<title>{m.speaker_reimbursements_title({ editionName: data.edition.name })}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	<!-- Header -->
	<header class="border-b bg-background">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-4">
				<a href="/" class="text-xl font-bold">OEO</a>
				<span class="text-muted-foreground">/</span>
				<span class="font-medium">{data.edition.name}</span>
			</div>
		</div>
	</header>

	<!-- Content -->
	<main class="container mx-auto px-4 py-8">
		<div class="mx-auto max-w-4xl space-y-6">
			<div>
				<h2 class="text-3xl font-bold tracking-tight">{m.speaker_reimbursements_heading()}</h2>
				<p class="text-muted-foreground">{data.edition.name}</p>
			</div>

			{#if form?.accessRequested}
				<div class="flex items-center gap-3 rounded-lg border border-blue-500 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-950">
					<Mail class="h-5 w-5 text-blue-600 dark:text-blue-400" />
					<p class="text-sm text-blue-800 dark:text-blue-200">{form.message}</p>
				</div>
			{/if}

			{#if data.needsToken}
				<Card.Root>
					<Card.Header>
						<Card.Title>{m.speaker_reimbursements_access_title()}</Card.Title>
						<Card.Description>
							{m.speaker_reimbursements_access_description()}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<form
							method="POST"
							action="?/requestAccess"
							use:enhance={() => {
								isRequestingAccess = true
								return async ({ update }) => {
									isRequestingAccess = false
									await update()
								}
							}}
							class="space-y-4"
						>
							<div class="space-y-2">
								<Label for="email">{m.speaker_reimbursements_email_label()}</Label>
								<Input
									id="email"
									name="email"
									type="email"
									bind:value={email}
									placeholder="speaker@example.com"
									required
								/>
							</div>
							{#if form?.accessError}
								<p class="text-sm text-destructive">{form.accessError}</p>
							{/if}
							<Button type="submit" disabled={isRequestingAccess} class="gap-2">
								{#if isRequestingAccess}
									<Loader2 class="h-4 w-4 animate-spin" />
									{m.speaker_reimbursements_sending()}
								{:else}
									<Mail class="h-4 w-4" />
									{m.speaker_reimbursements_send_link()}
								{/if}
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			{:else}
				{#if form?.error}
					<div
						class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
					>
						{form.error}
					</div>
				{/if}

				{#if form?.success}
					<div
						class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
					>
						{form.message || m.speaker_reimbursements_action_success()}
					</div>
				{/if}

				<div class="flex items-center justify-between">
					<p class="text-sm text-muted-foreground">
						{m.speaker_reimbursements_welcome({ name: `${data.speaker?.firstName} ${data.speaker?.lastName}` })}
					</p>
					<Button onclick={() => (showCreateForm = true)}>
						<Plus class="mr-2 h-4 w-4" />
						{m.speaker_reimbursements_new_request()}
					</Button>
				</div>

				{#if data.requests.length === 0}
					<Card.Root>
						<Card.Content class="py-12 text-center">
							<FileText class="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
							<h3 class="text-lg font-medium">{m.speaker_reimbursements_empty_title()}</h3>
							<p class="mt-1 text-sm text-muted-foreground">
								{m.speaker_reimbursements_empty_description()}
							</p>
						</Card.Content>
					</Card.Root>
				{:else}
					<div class="space-y-4">
						{#each data.requests as request}
							<Card.Root>
								<Card.Content class="p-4">
									<div class="flex items-center justify-between">
										<button
											type="button"
											class="flex items-center gap-2 text-left"
											onclick={() => toggleExpand(request.id)}
										>
											{#if expandedRequests.has(request.id)}
												<ChevronDown class="h-4 w-4" />
											{:else}
												<ChevronRight class="h-4 w-4" />
											{/if}
											<div>
												<span class="font-medium">{request.requestNumber}</span>
												<span class="ml-2 text-sm text-muted-foreground">
													{formatAmount(request.totalAmount, request.currency)}
												</span>
											</div>
										</button>
										<div class="flex items-center gap-2">
											<StatusBadge status={request.status} size="sm" />
											{#if request.status === 'draft'}
												<form
													method="POST"
													action="?/submitRequest&token={data.token}"
													use:enhance={() => {
														isSubmitting = true
														return async ({ update }) => {
															isSubmitting = false
															await update()
														}
													}}
												>
													<input type="hidden" name="requestId" value={request.id} />
													<Button type="submit" size="sm" disabled={isSubmitting || request.items.length === 0}>
														<Send class="mr-1 h-3 w-3" />
														{m.action_submit()}
													</Button>
												</form>
												<form
													method="POST"
													action="?/deleteRequest&token={data.token}"
													use:enhance={() => {
														return async ({ update }) => {
															await update()
														}
													}}
												>
													<input type="hidden" name="requestId" value={request.id} />
													<Button type="submit" variant="ghost" size="icon" class="h-8 w-8">
														<Trash2 class="h-4 w-4 text-destructive" />
													</Button>
												</form>
											{/if}
										</div>
									</div>

									{#if request.notes}
										<p class="mt-2 text-sm text-muted-foreground">{request.notes}</p>
									{/if}

									{#if request.adminNotes}
										<div
											class="mt-2 rounded-md border bg-muted/50 p-2 text-sm"
										>
											<span class="font-medium">{m.speaker_reimbursements_admin_note()}</span>
											{request.adminNotes}
										</div>
									{/if}

									{#if expandedRequests.has(request.id)}
										<div class="mt-4 space-y-2">
											<div class="flex items-center justify-between">
												<h4 class="text-sm font-medium">{m.speaker_reimbursements_expense_items()}</h4>
												{#if request.status === 'draft'}
													<Button size="sm" variant="outline" onclick={() => openAddItemForm(request.id)}>
														<Plus class="mr-1 h-3 w-3" />
														{m.speaker_reimbursements_add_item()}
													</Button>
												{/if}
											</div>

											{#if request.items.length === 0}
												<p class="py-4 text-center text-sm text-muted-foreground">
													{m.speaker_reimbursements_no_items()}
												</p>
											{:else}
												<div class="overflow-auto rounded-md border">
													<table class="w-full text-sm">
														<thead>
															<tr class="border-b bg-muted/50">
																<th class="px-3 py-2 text-left font-medium">{m.speaker_reimbursements_col_type()}</th>
																<th class="px-3 py-2 text-left font-medium">{m.speaker_reimbursements_col_description()}</th>
																<th class="px-3 py-2 text-right font-medium">{m.speaker_reimbursements_col_amount()}</th>
																<th class="px-3 py-2 text-left font-medium">{m.speaker_reimbursements_col_date()}</th>
																<th class="px-3 py-2 text-center font-medium">{m.speaker_reimbursements_col_receipt()}</th>
																{#if request.status === 'draft'}
																	<th class="px-3 py-2 text-right font-medium">{m.speaker_reimbursements_col_actions()}</th>
																{/if}
															</tr>
														</thead>
														<tbody>
															{#each request.items as item}
																<tr class="border-b last:border-0">
																	<td class="px-3 py-2">{getExpenseTypeLabel(item.expenseType)}</td>
																	<td class="px-3 py-2">
																		<div>{item.description}</div>
																		{#if item.notes}
																			<div class="text-xs text-muted-foreground">{item.notes}</div>
																		{/if}
																	</td>
																	<td class="px-3 py-2 text-right">
																		{formatAmount(item.amount, request.currency)}
																	</td>
																	<td class="px-3 py-2">{formatDate(item.date)}</td>
																	<td class="px-3 py-2 text-center">
																		{#if item.receiptUrl}
																			<a
																				href={item.receiptUrl}
																				target="_blank"
																				rel="noopener noreferrer"
																				class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
																			>
																				<Paperclip class="h-3 w-3" />
																				<span class="text-xs underline">{m.speaker_reimbursements_view()}</span>
																			</a>
																		{:else}
																			<span class="text-muted-foreground">-</span>
																		{/if}
																	</td>
																	{#if request.status === 'draft'}
																		<td class="px-3 py-2 text-right">
																			<form
																				method="POST"
																				action="?/removeItem&token={data.token}"
																				class="inline"
																				use:enhance
																			>
																				<input type="hidden" name="itemId" value={item.id} />
																				<input type="hidden" name="requestId" value={request.id} />
																				<Button type="submit" variant="ghost" size="icon" class="h-7 w-7">
																					<Trash2 class="h-3 w-3 text-destructive" />
																				</Button>
																			</form>
																		</td>
																	{/if}
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
											{/if}
										</div>
									{/if}
								</Card.Content>
							</Card.Root>
						{/each}
					</div>
				{/if}
			{/if}
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t bg-background px-4 py-6">
		<div class="container mx-auto text-center text-sm text-muted-foreground">
			<p>{m.common_powered_by()}</p>
		</div>
	</footer>
</div>

<!-- Create Request Dialog -->
{#if showCreateForm}
	<Dialog.Content onClose={() => (showCreateForm = false)}>
		<Dialog.Header>
			<Dialog.Title>{m.speaker_reimbursements_create_title()}</Dialog.Title>
			<Dialog.Description>
				{m.speaker_reimbursements_create_description()}
			</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/createRequest&token={data.token}"
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
				<Label for="rb-currency">{m.speaker_reimbursements_currency()}</Label>
				<select
					id="rb-currency"
					name="currency"
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="EUR" selected>EUR</option>
					<option value="USD">USD</option>
					<option value="GBP">GBP</option>
				</select>
			</div>

			<div class="space-y-2">
				<Label for="rb-notes">{m.speaker_reimbursements_notes()}</Label>
				<Textarea
					id="rb-notes"
					name="notes"
					rows={3}
					placeholder={m.speaker_reimbursements_notes_placeholder()}
				/>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (showCreateForm = false)}>{m.action_cancel()}</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{m.speaker_reimbursements_create_btn()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

<!-- Add Item Dialog -->
{#if showAddItemForm && activeRequestId}
	<Dialog.Content onClose={closeAddItemForm}>
		<Dialog.Header>
			<Dialog.Title>{m.speaker_reimbursements_add_item_title()}</Dialog.Title>
			<Dialog.Description>{m.speaker_reimbursements_add_item_description()}</Dialog.Description>
		</Dialog.Header>
		<form
			method="POST"
			action="?/addItem&token={data.token}"
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
			<input type="hidden" name="requestId" value={activeRequestId} />

			<div class="space-y-2">
				<Label for="item-type">{m.speaker_reimbursements_expense_type()}</Label>
				<select
					id="item-type"
					name="expenseType"
					required
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="transport">{m.speaker_reimbursements_type_transport()}</option>
					<option value="accommodation">{m.speaker_reimbursements_type_accommodation()}</option>
					<option value="meals">{m.speaker_reimbursements_type_meals()}</option>
					<option value="other">{m.speaker_reimbursements_type_other()}</option>
				</select>
			</div>

			<div class="space-y-2">
				<Label for="item-description">{m.speaker_reimbursements_item_description()}</Label>
				<Input id="item-description" name="description" required placeholder={m.speaker_reimbursements_item_description_placeholder()} />
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="item-amount">{m.speaker_reimbursements_item_amount()}</Label>
					<input
						id="item-amount"
						name="amount"
						type="number"
						step="0.01"
						min="0.01"
						required
						placeholder="0.00"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>
				<div class="space-y-2">
					<Label for="item-date">{m.speaker_reimbursements_item_date()}</Label>
					<input
						id="item-date"
						name="date"
						type="date"
						required
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="item-receipt">{m.speaker_reimbursements_item_receipt()}</Label>
				<input
					id="item-receipt"
					name="receipt"
					type="file"
					accept="image/*,.pdf"
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
				/>
				<p class="text-xs text-muted-foreground">
					{m.speaker_reimbursements_receipt_hint()}
				</p>
			</div>

			<div class="space-y-2">
				<Label for="item-notes">{m.speaker_reimbursements_additional_notes()}</Label>
				<Textarea
					id="item-notes"
					name="itemNotes"
					rows={2}
					placeholder={m.speaker_reimbursements_additional_notes_placeholder()}
				/>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={closeAddItemForm}>{m.action_cancel()}</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{m.speaker_reimbursements_add_item_btn()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}
