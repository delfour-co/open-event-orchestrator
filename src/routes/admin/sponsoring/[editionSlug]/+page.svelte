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
  PIPELINE_STATUSES,
  type SponsorStatus,
  formatPackagePrice,
  getStatusBadgeVariant,
  getStatusLabel
} from '$lib/features/sponsoring/domain'
import * as m from '$lib/paraglide/messages'
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Handshake,
  Link,
  Loader2,
  Plus,
  Trash2,
  Users
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showSponsorForm = $state(false)
let showAddToEditionForm = $state(false)
let showEditionSponsorDetail = $state(false)
let editingSponsor = $state<(typeof data.sponsors)[0] | null>(null)
let selectedEditionSponsor = $state<(typeof data.editionSponsors)[0] | null>(null)
let isSubmitting = $state(false)
let copiedLink = $state<string | null>(null)
let copiedContact = $state(false)
let copiedPackages = $state(false)
let generatedPortalUrl = $state<string | null>(null)

function copyContactUrl() {
  navigator.clipboard.writeText(`${window.location.origin}/sponsor/${data.edition.slug}/contact`)
  copiedContact = true
  setTimeout(() => {
    copiedContact = false
  }, 2000)
}

function copyPackagesUrl() {
  navigator.clipboard.writeText(`${window.location.origin}/sponsor/${data.edition.slug}/packages`)
  copiedPackages = true
  setTimeout(() => {
    copiedPackages = false
  }, 2000)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const currency = $derived(data.packages[0]?.currency || 'EUR')

function openEditionSponsorDetail(es: (typeof data.editionSponsors)[0]) {
  selectedEditionSponsor = es
  showEditionSponsorDetail = true
  generatedPortalUrl = null
}

function cancelSponsorForm() {
  showSponsorForm = false
  editingSponsor = null
}

function cancelAddToEditionForm() {
  showAddToEditionForm = false
}

function cancelEditionSponsorDetail() {
  showEditionSponsorDetail = false
  selectedEditionSponsor = null
  generatedPortalUrl = null
}

async function copyPortalLink(url: string) {
  await navigator.clipboard.writeText(url)
  copiedLink = url
  setTimeout(() => {
    copiedLink = null
  }, 2000)
}

// Group edition sponsors by status for pipeline view
const sponsorsByStatus = $derived(
  PIPELINE_STATUSES.reduce(
    (acc, status) => {
      acc[status] = data.editionSponsors.filter((es) => es.status === status)
      return acc
    },
    {} as Record<SponsorStatus, typeof data.editionSponsors>
  )
)

// Sponsors not yet added to this edition
const availableSponsors = $derived(
  data.sponsors.filter((s) => !data.editionSponsors.some((es) => es.sponsorId === s.id))
)

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (
      form.action === 'createSponsor' ||
      form.action === 'updateSponsor' ||
      form.action === 'deleteSponsor'
    ) {
      cancelSponsorForm()
    }
    if (form.action === 'addSponsorToEdition') {
      cancelAddToEditionForm()
    }
    if (
      form.action === 'updateEditionSponsor' ||
      form.action === 'updateStatus' ||
      form.action === 'removeFromEdition'
    ) {
      cancelEditionSponsorDetail()
    }
    if (form.action === 'generatePortalLink' && form.portalUrl) {
      generatedPortalUrl = form.portalUrl
    }
  }
})
</script>

<svelte:head>
	<title>{m.sponsoring_edition_page_title({ name: data.edition.name })}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/sponsoring">
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<!-- Contact Form URL -->
			<div class="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1">
				<span class="text-xs text-muted-foreground">Contact:</span>
				<code class="text-xs">/sponsor/{data.edition.slug}/contact</code>
				<Button variant="ghost" size="icon" class="h-6 w-6" onclick={copyContactUrl}>
					{#if copiedContact}
						<Check class="h-3 w-3 text-green-500" />
					{:else}
						<Copy class="h-3 w-3" />
					{/if}
				</Button>
				<a href="/sponsor/{data.edition.slug}/contact" target="_blank" rel="noopener noreferrer">
					<Button variant="ghost" size="icon" class="h-6 w-6">
						<ExternalLink class="h-3 w-3" />
					</Button>
				</a>
			</div>
			<!-- Packages URL -->
			<div class="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1">
				<span class="text-xs text-muted-foreground">Packages:</span>
				<code class="text-xs">/sponsor/{data.edition.slug}/packages</code>
				<Button variant="ghost" size="icon" class="h-6 w-6" onclick={copyPackagesUrl}>
					{#if copiedPackages}
						<Check class="h-3 w-3 text-green-500" />
					{:else}
						<Copy class="h-3 w-3" />
					{/if}
				</Button>
				<a href="/sponsor/{data.edition.slug}/packages" target="_blank" rel="noopener noreferrer">
					<Button variant="ghost" size="icon" class="h-6 w-6">
						<ExternalLink class="h-3 w-3" />
					</Button>
				</a>
			</div>
			<!-- Actions -->
			<Button variant="outline" onclick={() => { editingSponsor = null; showSponsorForm = true }}>
				<Building2 class="mr-2 h-4 w-4" />
				New Sponsor
			</Button>
			{#if availableSponsors.length > 0}
				<Button onclick={() => (showAddToEditionForm = true)}>
					<Plus class="mr-2 h-4 w-4" />
					Add to Edition
				</Button>
			{/if}
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/sponsoring/{data.edition.slug}" items={getSponsoringNavItems(data.edition.slug)} />

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Sponsors</Card.Title>
				<Users class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.total}</div>
				<p class="text-xs text-muted-foreground">in pipeline</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Confirmed</Card.Title>
				<Check class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-green-600 dark:text-green-400">{data.stats.confirmed}</div>
				<p class="text-xs text-muted-foreground">sponsors confirmed</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Revenue</Card.Title>
				<DollarSign class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatPackagePrice(data.stats.totalAmount, currency)}</div>
				<p class="text-xs text-muted-foreground">confirmed amount</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Paid</Card.Title>
				<DollarSign class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold text-green-600 dark:text-green-400">
					{formatPackagePrice(data.stats.paidAmount, currency)}
				</div>
				<p class="text-xs text-muted-foreground">received</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Pipeline View -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-xl font-semibold">Sponsor Pipeline</h3>
		</div>

		{#if data.editionSponsors.length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Handshake class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">No sponsors yet</h3>
					<p class="text-sm text-muted-foreground">
						Add sponsors to this edition to start building your pipeline.
					</p>
					{#if availableSponsors.length > 0}
						<Button class="mt-4" onclick={() => (showAddToEditionForm = true)}>
							<Plus class="mr-2 h-4 w-4" />
							Add Sponsor
						</Button>
					{:else}
						<Button class="mt-4" onclick={() => { editingSponsor = null; showSponsorForm = true }}>
							<Building2 class="mr-2 h-4 w-4" />
							Create New Sponsor
						</Button>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-4">
				{#each PIPELINE_STATUSES as status}
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<h4 class="text-sm font-medium text-muted-foreground">{getStatusLabel(status)}</h4>
							<span class="text-xs text-muted-foreground">{sponsorsByStatus[status].length}</span>
						</div>
						<div class="min-h-[200px] rounded-lg border bg-muted/20 p-2 space-y-2">
							{#each sponsorsByStatus[status] as es}
								<button
									type="button"
									class="w-full rounded-md border bg-background p-3 text-left shadow-sm transition-shadow hover:shadow-md"
									onclick={() => openEditionSponsorDetail(es)}
								>
									<div class="flex items-start gap-2">
										{#if es.sponsor?.logoUrl}
											<img
												src={es.sponsor.logoUrl}
												alt={es.sponsor?.name}
												class="h-8 w-8 rounded object-contain"
											/>
										{:else}
											<div class="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium">
												{es.sponsor?.name?.slice(0, 2).toUpperCase()}
											</div>
										{/if}
										<div class="flex-1 min-w-0">
											<div class="font-medium text-sm truncate">{es.sponsor?.name}</div>
											{#if es.package}
												<div class="text-xs text-muted-foreground">{es.package.name}</div>
											{/if}
											{#if es.amount}
												<div class="text-xs font-medium text-green-600 dark:text-green-400">
													{formatPackagePrice(es.amount, es.package?.currency || currency)}
												</div>
											{/if}
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<!-- Declined/Cancelled Section -->
			{#if data.editionSponsors.some((es) => es.status === 'declined' || es.status === 'cancelled')}
				<details class="mt-4">
					<summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
						Show declined/cancelled ({data.editionSponsors.filter((es) => es.status === 'declined' || es.status === 'cancelled').length})
					</summary>
					<div class="mt-2 grid gap-2 md:grid-cols-4">
						{#each data.editionSponsors.filter((es) => es.status === 'declined' || es.status === 'cancelled') as es}
							<button
								type="button"
								class="rounded-md border bg-muted/50 p-3 text-left opacity-60 hover:opacity-100"
								onclick={() => openEditionSponsorDetail(es)}
							>
								<div class="font-medium text-sm">{es.sponsor?.name}</div>
								<Badge variant="outline" class="mt-1">{getStatusLabel(es.status)}</Badge>
							</button>
						{/each}
					</div>
				</details>
			{/if}
		{/if}
	</div>
</div>

<!-- Sponsor Form Dialog -->
{#if showSponsorForm}
	<Dialog.Content class="max-w-lg" onClose={cancelSponsorForm}>
		<Dialog.Header>
			<Dialog.Title>{editingSponsor ? 'Edit Sponsor' : 'New Sponsor'}</Dialog.Title>
			<Dialog.Description>
				{editingSponsor ? 'Update sponsor details.' : 'Create a new sponsor in your organization.'}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && (form?.action === 'createSponsor' || form?.action === 'updateSponsor')}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action={editingSponsor ? '?/updateSponsor' : '?/createSponsor'}
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-4"
		>
			{#if editingSponsor}
				<input type="hidden" name="id" value={editingSponsor.id} />
			{:else}
				<input type="hidden" name="organizationId" value={data.organizationId} />
			{/if}

			<div class="space-y-2">
				<Label for="sponsor-name">Company Name *</Label>
				<Input
					id="sponsor-name"
					name="name"
					placeholder="Acme Corporation"
					required
					value={editingSponsor?.name || ''}
				/>
			</div>

			<div class="space-y-2">
				<Label for="sponsor-website">Website</Label>
				<Input
					id="sponsor-website"
					name="website"
					type="url"
					placeholder="https://example.com"
					value={editingSponsor?.website || ''}
				/>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="sponsor-contact-name">Contact Name</Label>
					<Input
						id="sponsor-contact-name"
						name="contactName"
						placeholder="John Doe"
						value={editingSponsor?.contactName || ''}
					/>
				</div>
				<div class="space-y-2">
					<Label for="sponsor-contact-email">Contact Email</Label>
					<Input
						id="sponsor-contact-email"
						name="contactEmail"
						type="email"
						placeholder="john@example.com"
						value={editingSponsor?.contactEmail || ''}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="sponsor-contact-phone">Contact Phone</Label>
				<Input
					id="sponsor-contact-phone"
					name="contactPhone"
					type="tel"
					placeholder="+1 234 567 890"
					value={editingSponsor?.contactPhone || ''}
				/>
			</div>

			<div class="space-y-2">
				<Label for="sponsor-description">Description</Label>
				<Textarea
					id="sponsor-description"
					name="description"
					placeholder="Brief description of the company..."
					value={editingSponsor?.description || ''}
				/>
			</div>

			<div class="space-y-2">
				<Label for="sponsor-notes">Internal Notes</Label>
				<Textarea
					id="sponsor-notes"
					name="notes"
					placeholder="Internal notes about this sponsor..."
					value={editingSponsor?.notes || ''}
				/>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={cancelSponsorForm}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{editingSponsor ? 'Update' : 'Create'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

<!-- Add to Edition Dialog -->
{#if showAddToEditionForm}
	<Dialog.Content class="max-w-lg" onClose={cancelAddToEditionForm}>
		<Dialog.Header>
			<Dialog.Title>Add Sponsor to Edition</Dialog.Title>
			<Dialog.Description>
				Select a sponsor and optionally assign a package.
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && form?.action === 'addSponsorToEdition'}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action="?/addSponsorToEdition"
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

			<div class="space-y-2">
				<Label for="add-sponsor">Sponsor *</Label>
				<select
					id="add-sponsor"
					name="sponsorId"
					required
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="">Select a sponsor...</option>
					{#each availableSponsors as sponsor}
						<option value={sponsor.id}>{sponsor.name}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-2">
				<Label for="add-package">Package</Label>
				<select
					id="add-package"
					name="packageId"
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="">No package assigned</option>
					{#each data.packages.filter((p) => p.isActive) as pkg}
						<option value={pkg.id}>{pkg.name} - {formatPackagePrice(pkg.price, pkg.currency)}</option>
					{/each}
				</select>
			</div>

			<div class="space-y-2">
				<Label for="add-status">Initial Status</Label>
				<select
					id="add-status"
					name="status"
					class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="prospect">Prospect</option>
					<option value="contacted">Contacted</option>
					<option value="negotiating">Negotiating</option>
				</select>
			</div>

			<div class="space-y-2">
				<Label for="add-notes">Notes</Label>
				<Textarea
					id="add-notes"
					name="notes"
					placeholder="Notes about this sponsorship..."
				/>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={cancelAddToEditionForm}>Cancel</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Add Sponsor
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

<!-- Edition Sponsor Detail Dialog -->
{#if showEditionSponsorDetail && selectedEditionSponsor}
	<Dialog.Content class="max-w-2xl" onClose={cancelEditionSponsorDetail}>
		<Dialog.Header>
			<div class="flex items-start gap-4">
				{#if selectedEditionSponsor.sponsor?.logoUrl}
					<img
						src={selectedEditionSponsor.sponsor.logoUrl}
						alt={selectedEditionSponsor.sponsor?.name}
						class="h-16 w-16 rounded object-contain border"
					/>
				{:else}
					<div class="flex h-16 w-16 items-center justify-center rounded bg-muted text-lg font-medium">
						{selectedEditionSponsor.sponsor?.name?.slice(0, 2).toUpperCase()}
					</div>
				{/if}
				<div>
					<Dialog.Title>{selectedEditionSponsor.sponsor?.name}</Dialog.Title>
					<div class="flex items-center gap-2 mt-1">
						<Badge variant={getStatusBadgeVariant(selectedEditionSponsor.status)}>
							{getStatusLabel(selectedEditionSponsor.status)}
						</Badge>
						{#if selectedEditionSponsor.package}
							<Badge variant="outline">{selectedEditionSponsor.package.name}</Badge>
						{/if}
					</div>
				</div>
			</div>
		</Dialog.Header>

		{#if form?.error && (form?.action === 'updateEditionSponsor' || form?.action === 'updateStatus')}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Left column: Info -->
			<div class="space-y-4">
				<div>
					<h4 class="text-sm font-medium text-muted-foreground">Contact</h4>
					{#if selectedEditionSponsor.sponsor?.contactName}
						<p class="text-sm">{selectedEditionSponsor.sponsor.contactName}</p>
					{/if}
					{#if selectedEditionSponsor.sponsor?.contactEmail}
						<a href="mailto:{selectedEditionSponsor.sponsor.contactEmail}" class="text-sm text-primary hover:underline">
							{selectedEditionSponsor.sponsor.contactEmail}
						</a>
					{/if}
					{#if selectedEditionSponsor.sponsor?.contactPhone}
						<p class="text-sm">{selectedEditionSponsor.sponsor.contactPhone}</p>
					{/if}
					{#if !selectedEditionSponsor.sponsor?.contactName && !selectedEditionSponsor.sponsor?.contactEmail}
						<p class="text-sm text-muted-foreground">No contact info</p>
					{/if}
				</div>

				{#if selectedEditionSponsor.sponsor?.website}
					<div>
						<h4 class="text-sm font-medium text-muted-foreground">Website</h4>
						<a
							href={selectedEditionSponsor.sponsor.website}
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm text-primary hover:underline inline-flex items-center gap-1"
						>
							{selectedEditionSponsor.sponsor.website}
							<ExternalLink class="h-3 w-3" />
						</a>
					</div>
				{/if}

				{#if selectedEditionSponsor.amount}
					<div>
						<h4 class="text-sm font-medium text-muted-foreground">Amount</h4>
						<p class="text-lg font-semibold text-green-600 dark:text-green-400">
							{formatPackagePrice(selectedEditionSponsor.amount, selectedEditionSponsor.package?.currency || currency)}
						</p>
						{#if selectedEditionSponsor.paidAt}
							<p class="text-xs text-muted-foreground">Paid on {formatDate(selectedEditionSponsor.paidAt)}</p>
						{/if}
					</div>
				{/if}

				{#if selectedEditionSponsor.notes}
					<div>
						<h4 class="text-sm font-medium text-muted-foreground">Notes</h4>
						<p class="text-sm whitespace-pre-wrap">{selectedEditionSponsor.notes}</p>
					</div>
				{/if}
			</div>

			<!-- Right column: Actions -->
			<div class="space-y-4">
				<form
					method="POST"
					action="?/updateEditionSponsor"
					use:enhance={() => {
						isSubmitting = true
						return async ({ update }) => {
							isSubmitting = false
							await update()
						}
					}}
					class="space-y-4"
				>
					<input type="hidden" name="id" value={selectedEditionSponsor.id} />

					<div class="space-y-2">
						<Label for="detail-package">Package</Label>
						<select
							id="detail-package"
							name="packageId"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="">No package</option>
							{#each data.packages.filter((p) => p.isActive) as pkg}
								<option value={pkg.id} selected={selectedEditionSponsor.packageId === pkg.id}>
									{pkg.name} - {formatPackagePrice(pkg.price, pkg.currency)}
								</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<Label for="detail-status">Status</Label>
						<select
							id="detail-status"
							name="status"
							class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="prospect" selected={selectedEditionSponsor.status === 'prospect'}>Prospect</option>
							<option value="contacted" selected={selectedEditionSponsor.status === 'contacted'}>Contacted</option>
							<option value="negotiating" selected={selectedEditionSponsor.status === 'negotiating'}>Negotiating</option>
							<option value="confirmed" selected={selectedEditionSponsor.status === 'confirmed'}>Confirmed</option>
							<option value="declined" selected={selectedEditionSponsor.status === 'declined'}>Declined</option>
							<option value="cancelled" selected={selectedEditionSponsor.status === 'cancelled'}>Cancelled</option>
						</select>
					</div>

					<div class="space-y-2">
						<Label for="detail-amount">Amount</Label>
						<Input
							id="detail-amount"
							name="amount"
							type="number"
							step="0.01"
							min="0"
							placeholder="0.00"
							value={selectedEditionSponsor.amount?.toString() || ''}
						/>
					</div>

					<div class="space-y-2">
						<Label for="detail-paid">Paid Date</Label>
						<Input
							id="detail-paid"
							name="paidAt"
							type="date"
							value={selectedEditionSponsor.paidAt?.toISOString().split('T')[0] || ''}
						/>
					</div>

					<div class="space-y-2">
						<Label for="detail-notes">Notes</Label>
						<Textarea
							id="detail-notes"
							name="notes"
							placeholder="Notes..."
							value={selectedEditionSponsor.notes || ''}
						/>
					</div>

					<Button type="submit" class="w-full" disabled={isSubmitting}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Save Changes
					</Button>
				</form>

				<!-- Portal Link -->
				<div class="border-t pt-4">
					<h4 class="text-sm font-medium mb-2">Sponsor Portal</h4>
					{#if generatedPortalUrl}
						<div class="flex items-center gap-2">
							<Input
								value={generatedPortalUrl}
								readonly
								class="text-xs"
							/>
							<Button
								variant="outline"
								size="icon"
								onclick={() => copyPortalLink(generatedPortalUrl!)}
							>
								{#if copiedLink === generatedPortalUrl}
									<Check class="h-4 w-4 text-green-600" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</Button>
						</div>
					{:else}
						<form method="POST" action="?/generatePortalLink" use:enhance>
							<input type="hidden" name="editionSponsorId" value={selectedEditionSponsor.id} />
							<Button variant="outline" class="w-full" type="submit">
								<Link class="mr-2 h-4 w-4" />
								Generate Portal Link
							</Button>
						</form>
					{/if}
				</div>

				<!-- Remove from Edition -->
				<div class="border-t pt-4">
					<form method="POST" action="?/removeFromEdition" use:enhance>
						<input type="hidden" name="id" value={selectedEditionSponsor.id} />
						<Button variant="destructive" class="w-full" type="submit">
							<Trash2 class="mr-2 h-4 w-4" />
							Remove from Edition
						</Button>
					</form>
				</div>
			</div>
		</div>
	</Dialog.Content>
{/if}

{#if form?.error && (form?.action === 'deleteSponsor' || form?.action === 'removeFromEdition')}
	<div
		class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg"
	>
		{form.error}
	</div>
{/if}
