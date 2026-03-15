<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { AdminSubNav, StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getBudgetNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, Loader2, Wallet } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)

const statuses = ['draft', 'approved', 'closed'] as const

const formatAmount = (amount: number, currency: string) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount)
}
</script>

<svelte:head>
	<title>{m.budget_settings_title({ name: data.edition.name })}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
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

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/budget/{data.edition.slug}" items={getBudgetNavItems(data.edition.slug)} />

	{#if form?.success}
		<div
			class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
		>
			{form.message || m.budget_settings_updated()}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
		>
			{form.error}
		</div>
	{/if}

	<!-- Budget Status -->
	<Card.Root>
		<Card.Header>
			<Card.Title>{m.budget_settings_status()}</Card.Title>
			<Card.Description>
				{m.budget_settings_status_description()}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex items-center gap-4">
				<span class="text-sm text-muted-foreground">{m.budget_settings_current_status()}</span>
				<StatusBadge status={data.budget.status} />
			</div>
			<div class="mt-4 flex items-center gap-2">
				<span class="mr-2 text-sm text-muted-foreground">{m.budget_settings_change_to()}</span>
				{#each statuses as status}
					<form
						method="POST"
						action="?/updateStatus"
						use:enhance={() => {
							return async ({ update }) => {
								await update()
								await invalidateAll()
							}
						}}
						class="inline"
					>
						<input type="hidden" name="id" value={data.budget.id} />
						<input type="hidden" name="status" value={status} />
						<Button
							type="submit"
							variant={data.budget.status === status ? 'default' : 'outline'}
							size="sm"
							disabled={data.budget.status === status}
						>
							{status}
						</Button>
					</form>
				{/each}
			</div>
			<p class="mt-3 text-xs text-muted-foreground">
				{m.budget_settings_status_draft()}
				{m.budget_settings_status_approved()}
				{m.budget_settings_status_closed()}
			</p>
		</Card.Content>
	</Card.Root>

	<!-- Budget Details -->
	<Card.Root>
		<Card.Header>
			<Card.Title>{m.budget_settings_details()}</Card.Title>
			<Card.Description>{m.budget_settings_details_description()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				action="?/updateBudget"
				use:enhance={() => {
					isSubmitting = true
					return async ({ update }) => {
						isSubmitting = false
						await update()
					}
				}}
				class="space-y-6"
			>
				<input type="hidden" name="id" value={data.budget.id} />

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="bg-totalBudget">{m.budget_settings_total_budget()}</Label>
						<Input
							id="bg-totalBudget"
							name="totalBudget"
							type="number"
							step="0.01"
							min="0"
							value={data.budget.totalBudget.toString()}
						/>
						<p class="text-xs text-muted-foreground">
							{m.budget_settings_total_budget_hint()}
						</p>
					</div>

					<div class="space-y-2">
						<Label for="bg-currency">{m.budget_settings_currency()}</Label>
						<select
							id="bg-currency"
							name="currency"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="EUR" selected={data.budget.currency === 'EUR'}>EUR</option>
							<option value="USD" selected={data.budget.currency === 'USD'}>USD</option>
							<option value="GBP" selected={data.budget.currency === 'GBP'}>GBP</option>
						</select>
						<p class="text-xs text-muted-foreground">{m.budget_settings_currency_hint()}</p>
					</div>
				</div>

				<div class="space-y-2">
					<Label for="bg-notes">{m.budget_settings_notes()}</Label>
					<Textarea
						id="bg-notes"
						name="notes"
						rows={4}
						placeholder={m.budget_settings_notes_placeholder()}
						value={data.budget.notes || ''}
					/>
					<p class="text-xs text-muted-foreground">
						{m.budget_settings_notes_hint()}
					</p>
				</div>

				<div class="flex justify-end">
					<Button type="submit" disabled={isSubmitting}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Saving...
						{:else}
							Save Settings
						{/if}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Overview -->
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<Wallet class="h-5 w-5" />
				Overview
			</Card.Title>
			<Card.Description>Current budget usage summary</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 md:grid-cols-3">
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">Total Budget</div>
					<div class="mt-1 text-2xl font-bold">
						{formatAmount(data.budget.totalBudget, data.budget.currency)}
					</div>
				</div>
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">Categories</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalCategories}</div>
				</div>
				<div class="rounded-lg border p-4">
					<div class="text-sm text-muted-foreground">Transactions</div>
					<div class="mt-1 text-2xl font-bold">{data.stats.totalTransactions}</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Quick Links -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Related Settings</Card.Title>
			<Card.Description>Manage other aspects of this edition</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="flex gap-2">
				<a href="/admin/budget/{data.edition.slug}">
					<Button variant="outline">Budget Dashboard</Button>
				</a>
				<a href="/admin/editions/{data.edition.slug}/settings">
					<Button variant="outline">Edition Settings</Button>
				</a>
			</div>
		</Card.Content>
	</Card.Root>
</div>
