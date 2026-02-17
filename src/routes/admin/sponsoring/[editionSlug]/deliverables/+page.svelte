<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getSponsoringNavItems } from '$lib/config'
import {
  getDeliverableStatusBadgeVariant,
  getDeliverableStatusLabel
} from '$lib/features/sponsoring/domain'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Gift,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Wand2
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let showGenerateAll = $state(false)
let showCreateDeliverable = $state(false)
let selectedSponsorId = $state<string | null>(null)
let selectedDeliverable = $state<(typeof data.deliverables)[0] | null>(null)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

function cancelGenerateAll() {
  showGenerateAll = false
}

function cancelCreateDeliverable() {
  showCreateDeliverable = false
  selectedSponsorId = null
}

function cancelEditDeliverable() {
  selectedDeliverable = null
}

function openCreateDeliverable(editionSponsorId: string) {
  selectedSponsorId = editionSponsorId
  showCreateDeliverable = true
}

$effect(() => {
  if (form?.success) {
    if (form.action === 'generateForAll') {
      cancelGenerateAll()
    }
    if (form.action === 'createDeliverable') {
      cancelCreateDeliverable()
    }
    if (
      form.action === 'updateDeliverable' ||
      form.action === 'updateStatus' ||
      form.action === 'deleteDeliverable'
    ) {
      cancelEditDeliverable()
    }
  }
})
</script>

<svelte:head>
	<title>Deliverables - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/sponsoring/{data.edition.slug}">
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
			{#if data.confirmedSponsors.length > 0}
				<Button onclick={() => (showGenerateAll = true)}>
					<Wand2 class="mr-2 h-4 w-4" />
					Generate All Deliverables
				</Button>
			{/if}
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/sponsoring/{data.edition.slug}" items={getSponsoringNavItems(data.edition.slug)} />

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-5">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total</Card.Title>
				<Gift class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.total}</div>
				<p class="text-xs text-muted-foreground">deliverables</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Pending</Card.Title>
				<Clock class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-muted-foreground">{data.stats.pending}</div>
				<p class="text-xs text-muted-foreground">to start</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">In Progress</Card.Title>
				<RefreshCw class="h-4 w-4 text-blue-600" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-blue-600">{data.stats.inProgress}</div>
				<p class="text-xs text-muted-foreground">being worked on</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Delivered</Card.Title>
				<CheckCircle2 class="h-4 w-4 text-green-600" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-green-600">{data.stats.delivered}</div>
				<p class="text-xs text-muted-foreground">{data.stats.completionPercent}% complete</p>
			</Card.Content>
		</Card.Root>

		{#if data.stats.overdue > 0}
			<Card.Root class="border-destructive">
				<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
					<Card.Title class="text-sm font-medium">Overdue</Card.Title>
					<AlertTriangle class="h-4 w-4 text-destructive" />
				</Card.Header>
				<Card.Content>
					<div class="text-2xl font-bold text-destructive">{data.stats.overdue}</div>
					<p class="text-xs text-muted-foreground">past due date</p>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>

	<!-- Overall Progress -->
	{#if data.stats.total > 0}
		<Card.Root>
			<Card.Content class="py-4">
				<div class="flex items-center justify-between mb-2">
					<span class="text-sm font-medium">Overall Progress</span>
					<span class="text-sm text-muted-foreground">{data.stats.completionPercent}%</span>
				</div>
				<div class="h-2 w-full bg-muted rounded-full overflow-hidden">
					<div
						class="h-full bg-green-600 transition-all"
						style="width: {data.stats.completionPercent}%"
					></div>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Deliverables by Sponsor -->
	<div class="space-y-4">
		<h3 class="text-xl font-semibold">Deliverables by Sponsor</h3>

		{#if data.confirmedSponsors.length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Gift class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">No confirmed sponsors</h3>
					<p class="text-sm text-muted-foreground text-center max-w-md">
						Deliverables can only be created for confirmed sponsors. Confirm sponsors in the pipeline first.
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="space-y-4">
				{#each data.deliverablesBySponsor as group}
					<Card.Root>
						<Card.Header>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-3">
									{#if group.editionSponsor.sponsor?.logoUrl}
										<img
											src={group.editionSponsor.sponsor.logoUrl}
											alt={group.editionSponsor.sponsor?.name}
											class="h-10 w-10 rounded object-contain border"
										/>
									{:else}
										<div class="flex h-10 w-10 items-center justify-center rounded bg-muted text-sm font-medium">
											{group.editionSponsor.sponsor?.name?.slice(0, 2).toUpperCase()}
										</div>
									{/if}
									<div>
										<Card.Title>{group.editionSponsor.sponsor?.name}</Card.Title>
										{#if group.editionSponsor.package}
											<p class="text-sm text-muted-foreground">{group.editionSponsor.package.name}</p>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2">
									<!-- Generate for this sponsor -->
									<form method="POST" action="?/generateForSponsor" use:enhance>
										<input type="hidden" name="editionSponsorId" value={group.editionSponsorId} />
										<Button variant="outline" size="sm" type="submit">
											<Wand2 class="mr-2 h-4 w-4" />
											Generate
										</Button>
									</form>
									<Button
										variant="outline"
										size="sm"
										onclick={() => openCreateDeliverable(group.editionSponsorId)}
									>
										<Plus class="mr-2 h-4 w-4" />
										Add Custom
									</Button>
								</div>
							</div>
						</Card.Header>
						<Card.Content>
							{#if group.deliverables.length === 0}
								<p class="text-sm text-muted-foreground py-4 text-center">
									No deliverables yet. Click "Generate" to create from package benefits.
								</p>
							{:else}
								<div class="space-y-2">
									{#each group.deliverables as deliverable}
										<button
											type="button"
											class="w-full rounded-md border p-3 text-left hover:bg-muted/50 transition-colors {deliverable.isOverdue ? 'border-destructive' : ''}"
											onclick={() => (selectedDeliverable = deliverable)}
										>
											<div class="flex items-start justify-between gap-4">
												<div class="flex-1 min-w-0">
													<div class="flex items-center gap-2">
														{#if deliverable.status === 'delivered'}
															<CheckCircle2 class="h-4 w-4 text-green-600 shrink-0" />
														{:else if deliverable.isOverdue}
															<AlertTriangle class="h-4 w-4 text-destructive shrink-0" />
														{:else if deliverable.status === 'in_progress'}
															<RefreshCw class="h-4 w-4 text-blue-600 shrink-0" />
														{:else}
															<Clock class="h-4 w-4 text-muted-foreground shrink-0" />
														{/if}
														<span class="font-medium text-sm">{deliverable.benefitName}</span>
													</div>
													{#if deliverable.dueDate}
														<p class="text-xs text-muted-foreground ml-6">
															Due: {formatDate(deliverable.dueDate)}
														</p>
													{/if}
												</div>
												<Badge
													variant={deliverable.isOverdue ? 'destructive' : getDeliverableStatusBadgeVariant(deliverable.status)}
												>
													{deliverable.isOverdue ? 'Overdue' : getDeliverableStatusLabel(deliverable.status)}
												</Badge>
											</div>
										</button>
									{/each}
								</div>
							{/if}
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Generate All Dialog -->
{#if showGenerateAll}
	<Dialog.Content class="max-w-md" onClose={cancelGenerateAll}>
		<Dialog.Header>
			<Dialog.Title>Generate All Deliverables</Dialog.Title>
			<Dialog.Description>
				Create deliverables for all confirmed sponsors based on their package benefits.
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.success && form?.action === 'generateForAll'}
			<div class="rounded-md border border-green-500 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400">
				Created {form.deliverablesCreated} deliverables for {form.sponsorsProcessed} sponsors.
			</div>
		{/if}

		{#if form?.error && form?.action === 'generateForAll'}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action="?/generateForAll"
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
				<Label for="gen-all-due">Default Due Date (optional)</Label>
				<Input id="gen-all-due" name="dueDate" type="date" />
				<p class="text-xs text-muted-foreground">
					Set a default due date for all generated deliverables.
				</p>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={cancelGenerateAll}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Generate
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

<!-- Create Deliverable Dialog -->
{#if showCreateDeliverable && selectedSponsorId}
	<Dialog.Content class="max-w-md" onClose={cancelCreateDeliverable}>
		<Dialog.Header>
			<Dialog.Title>Add Custom Deliverable</Dialog.Title>
			<Dialog.Description>
				Create a custom deliverable for this sponsor.
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && form?.action === 'createDeliverable'}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action="?/createDeliverable"
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-4"
		>
			<input type="hidden" name="editionSponsorId" value={selectedSponsorId} />

			<div class="space-y-2">
				<Label for="create-name">Benefit Name *</Label>
				<Input id="create-name" name="benefitName" required placeholder="e.g., Logo on website" />
			</div>

			<div class="space-y-2">
				<Label for="create-desc">Description</Label>
				<Textarea id="create-desc" name="description" placeholder="Details about this deliverable..." />
			</div>

			<div class="space-y-2">
				<Label for="create-due">Due Date</Label>
				<Input id="create-due" name="dueDate" type="date" />
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={cancelCreateDeliverable}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Create
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

<!-- Edit Deliverable Dialog -->
{#if selectedDeliverable}
	<Dialog.Content class="max-w-lg" onClose={cancelEditDeliverable}>
		<Dialog.Header>
			<Dialog.Title>{selectedDeliverable.benefitName}</Dialog.Title>
			<div class="flex items-center gap-2 mt-1">
				<Badge variant={getDeliverableStatusBadgeVariant(selectedDeliverable.status)}>
					{getDeliverableStatusLabel(selectedDeliverable.status)}
				</Badge>
				{#if selectedDeliverable.isOverdue}
					<Badge variant="destructive">Overdue</Badge>
				{/if}
			</div>
		</Dialog.Header>

		{#if form?.error && (form?.action === 'updateDeliverable' || form?.action === 'updateStatus')}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Left: Info & Edit -->
			<form
				method="POST"
				action="?/updateDeliverable"
				use:enhance={() => {
					isSubmitting = true
					return async ({ update }) => {
						isSubmitting = false
						await update()
					}
				}}
				class="space-y-4"
			>
				<input type="hidden" name="deliverableId" value={selectedDeliverable.id} />

				<div class="space-y-2">
					<Label for="edit-desc">Description</Label>
					<Textarea
						id="edit-desc"
						name="description"
						placeholder="Details..."
						value={selectedDeliverable.description || ''}
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-due">Due Date</Label>
					<Input
						id="edit-due"
						name="dueDate"
						type="date"
						value={selectedDeliverable.dueDate?.toISOString().split('T')[0] || ''}
					/>
				</div>

				<div class="space-y-2">
					<Label for="edit-notes">Notes</Label>
					<Textarea
						id="edit-notes"
						name="notes"
						placeholder="Internal notes..."
						value={selectedDeliverable.notes || ''}
					/>
				</div>

				<Button type="submit" class="w-full" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Save Details
				</Button>
			</form>

			<!-- Right: Status & Actions -->
			<div class="space-y-4">
				<div>
					<h4 class="text-sm font-medium mb-2">Change Status</h4>
					<div class="space-y-2">
						<form method="POST" action="?/updateStatus" use:enhance>
							<input type="hidden" name="deliverableId" value={selectedDeliverable.id} />
							<input type="hidden" name="status" value="pending" />
							<Button
								type="submit"
								variant={selectedDeliverable.status === 'pending' ? 'default' : 'outline'}
								class="w-full justify-start"
								disabled={selectedDeliverable.status === 'pending'}
							>
								<Clock class="mr-2 h-4 w-4" />
								Pending
							</Button>
						</form>
						<form method="POST" action="?/updateStatus" use:enhance>
							<input type="hidden" name="deliverableId" value={selectedDeliverable.id} />
							<input type="hidden" name="status" value="in_progress" />
							<Button
								type="submit"
								variant={selectedDeliverable.status === 'in_progress' ? 'default' : 'outline'}
								class="w-full justify-start"
								disabled={selectedDeliverable.status === 'in_progress'}
							>
								<RefreshCw class="mr-2 h-4 w-4" />
								In Progress
							</Button>
						</form>
						<form method="POST" action="?/updateStatus" use:enhance>
							<input type="hidden" name="deliverableId" value={selectedDeliverable.id} />
							<input type="hidden" name="status" value="delivered" />
							<Button
								type="submit"
								variant={selectedDeliverable.status === 'delivered' ? 'default' : 'outline'}
								class="w-full justify-start"
								disabled={selectedDeliverable.status === 'delivered'}
							>
								<CheckCircle2 class="mr-2 h-4 w-4" />
								Delivered
							</Button>
						</form>
					</div>
					<p class="text-xs text-muted-foreground mt-2">
						Marking as "Delivered" will send an email notification to the sponsor.
					</p>
				</div>

				{#if selectedDeliverable.deliveredAt}
					<div class="pt-4 border-t">
						<p class="text-sm">
							<span class="text-muted-foreground">Delivered on:</span>
							<span class="font-medium ml-1">{formatDate(selectedDeliverable.deliveredAt)}</span>
						</p>
					</div>
				{/if}

				<div class="pt-4 border-t">
					<form method="POST" action="?/deleteDeliverable" use:enhance>
						<input type="hidden" name="deliverableId" value={selectedDeliverable.id} />
						<Button type="submit" variant="destructive" class="w-full">
							<Trash2 class="mr-2 h-4 w-4" />
							Delete Deliverable
						</Button>
					</form>
				</div>
			</div>
		</div>
	</Dialog.Content>
{/if}

{#if form?.success && form?.action === 'generateForSponsor'}
	<div
		class="fixed bottom-4 right-4 rounded-md border border-green-500 bg-green-50 dark:bg-green-950 p-4 text-sm text-green-700 dark:text-green-400 shadow-lg"
	>
		Created {form.created} deliverables ({form.skipped} already existed).
	</div>
{/if}
