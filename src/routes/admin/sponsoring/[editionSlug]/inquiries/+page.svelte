<script lang="ts">
import { enhance } from '$app/forms'
import { goto } from '$app/navigation'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Table from '$lib/components/ui/table'
import {
  getInquiryStatusBadgeVariant,
  getInquiryStatusLabel
} from '$lib/features/sponsoring/domain'
import { ArrowLeft, ArrowRight, Check, Eye, Inbox, Loader2, Mail, Phone, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state<Record<string, boolean>>({})

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatShortDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

function setFilter(status: string | null) {
  const url = new URL(window.location.href)
  if (status) {
    url.searchParams.set('status', status)
  } else {
    url.searchParams.delete('status')
  }
  goto(url.toString(), { replaceState: true })
}
</script>

<svelte:head>
	<title>Inquiries - {data.edition.name} - Open Event Orchestrator</title>
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
					Sponsor inquiries management
				</p>
			</div>
		</div>
	</div>

	<!-- Sub-navigation -->
	<nav class="flex gap-1 rounded-lg border bg-muted/40 p-1">
		<a
			href="/admin/sponsoring/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Dashboard
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/packages"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Packages
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/sponsors"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Sponsors
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/inquiries"
			class="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
		>
			Inquiries
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/deliverables"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Deliverables
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/assets"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Assets
		</a>
	</nav>

	<!-- Status Filters -->
	<div class="flex flex-wrap gap-2">
		<Button
			variant={data.currentFilter === null ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter(null)}
		>
			All
			<Badge variant="secondary" class="ml-2">{data.statusCounts.all}</Badge>
		</Button>
		<Button
			variant={data.currentFilter === 'pending' ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter('pending')}
		>
			Pending
			<Badge variant="secondary" class="ml-2">{data.statusCounts.pending}</Badge>
		</Button>
		<Button
			variant={data.currentFilter === 'contacted' ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter('contacted')}
		>
			Contacted
			<Badge variant="secondary" class="ml-2">{data.statusCounts.contacted}</Badge>
		</Button>
		<Button
			variant={data.currentFilter === 'converted' ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter('converted')}
		>
			Converted
			<Badge variant="secondary" class="ml-2">{data.statusCounts.converted}</Badge>
		</Button>
		<Button
			variant={data.currentFilter === 'rejected' ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter('rejected')}
		>
			Rejected
			<Badge variant="secondary" class="ml-2">{data.statusCounts.rejected}</Badge>
		</Button>
	</div>

	<!-- Inquiries Table -->
	{#if data.inquiries.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Inbox class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No inquiries yet</h3>
				<p class="text-sm text-muted-foreground">
					{#if data.currentFilter}
						No inquiries with status "{data.currentFilter}".
					{:else}
						Sponsor inquiries will appear here when submitted through the public form.
					{/if}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Company</Table.Head>
						<Table.Head>Contact</Table.Head>
						<Table.Head class="hidden md:table-cell">Package</Table.Head>
						<Table.Head class="hidden lg:table-cell">Date</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.inquiries as inquiry}
						<Table.Row>
							<Table.Cell>
								<div class="font-medium">{inquiry.companyName}</div>
							</Table.Cell>
							<Table.Cell>
								<div class="space-y-1">
									<div class="text-sm">{inquiry.contactName}</div>
									<div class="flex items-center gap-1 text-xs text-muted-foreground">
										<Mail class="h-3 w-3" />
										<a href="mailto:{inquiry.contactEmail}" class="hover:underline">
											{inquiry.contactEmail}
										</a>
									</div>
									{#if inquiry.contactPhone}
										<div class="flex items-center gap-1 text-xs text-muted-foreground">
											<Phone class="h-3 w-3" />
											{inquiry.contactPhone}
										</div>
									{/if}
								</div>
							</Table.Cell>
							<Table.Cell class="hidden md:table-cell">
								{#if inquiry.interestedPackageName}
									<Badge variant="outline">{inquiry.interestedPackageName}</Badge>
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="hidden lg:table-cell">
								<span class="text-sm text-muted-foreground" title={formatDate(inquiry.createdAt)}>
									{formatShortDate(inquiry.createdAt)}
								</span>
							</Table.Cell>
							<Table.Cell>
								<Badge variant={getInquiryStatusBadgeVariant(inquiry.status)}>
									{getInquiryStatusLabel(inquiry.status)}
								</Badge>
							</Table.Cell>
							<Table.Cell class="text-right">
								<div class="flex items-center justify-end gap-1">
									<a href="/admin/sponsoring/{data.edition.slug}/inquiries/{inquiry.id}">
										<Button variant="ghost" size="icon" title="View details">
											<Eye class="h-4 w-4" />
										</Button>
									</a>

									{#if inquiry.status === 'pending'}
										<form
											method="POST"
											action="?/markContacted"
											use:enhance={() => {
												isSubmitting[inquiry.id] = true
												return async ({ update }) => {
													isSubmitting[inquiry.id] = false
													await update()
												}
											}}
										>
											<input type="hidden" name="id" value={inquiry.id} />
											<Button
												variant="ghost"
												size="icon"
												type="submit"
												title="Mark as contacted"
												disabled={isSubmitting[inquiry.id]}
											>
												{#if isSubmitting[inquiry.id]}
													<Loader2 class="h-4 w-4 animate-spin" />
												{:else}
													<Mail class="h-4 w-4" />
												{/if}
											</Button>
										</form>
									{/if}

									{#if inquiry.status === 'pending' || inquiry.status === 'contacted'}
										<form
											method="POST"
											action="?/convert"
											use:enhance={() => {
												isSubmitting[`convert-${inquiry.id}`] = true
												return async ({ update }) => {
													isSubmitting[`convert-${inquiry.id}`] = false
													await update()
												}
											}}
										>
											<input type="hidden" name="id" value={inquiry.id} />
											<Button
												variant="ghost"
												size="icon"
												type="submit"
												title="Convert to sponsor"
												disabled={isSubmitting[`convert-${inquiry.id}`]}
											>
												{#if isSubmitting[`convert-${inquiry.id}`]}
													<Loader2 class="h-4 w-4 animate-spin" />
												{:else}
													<ArrowRight class="h-4 w-4 text-green-600" />
												{/if}
											</Button>
										</form>

										<form
											method="POST"
											action="?/reject"
											use:enhance={() => {
												isSubmitting[`reject-${inquiry.id}`] = true
												return async ({ update }) => {
													isSubmitting[`reject-${inquiry.id}`] = false
													await update()
												}
											}}
										>
											<input type="hidden" name="id" value={inquiry.id} />
											<Button
												variant="ghost"
												size="icon"
												type="submit"
												title="Reject inquiry"
												disabled={isSubmitting[`reject-${inquiry.id}`]}
											>
												{#if isSubmitting[`reject-${inquiry.id}`]}
													<Loader2 class="h-4 w-4 animate-spin" />
												{:else}
													<X class="h-4 w-4 text-destructive" />
												{/if}
											</Button>
										</form>
									{/if}

									{#if inquiry.status === 'converted'}
										<Check class="h-4 w-4 text-green-600" />
									{/if}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Root>
	{/if}
</div>

{#if form?.error}
	<div
		class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg"
	>
		{form.error}
	</div>
{/if}
