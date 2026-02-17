<script lang="ts">
import { enhance } from '$app/forms'
import { goto } from '$app/navigation'
import { AdminSubNav } from '$lib/components/shared'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Table from '$lib/components/ui/table'
import { getSponsoringNavItems } from '$lib/config'
import {
  getInquiryStatusBadgeVariant,
  getInquiryStatusLabel
} from '$lib/features/sponsoring/domain'
import * as m from '$lib/paraglide/messages'
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
	<title>{m.sponsoring_inquiries_page_title({ name: data.edition.name })}</title>
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
			</div>
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/sponsoring/{data.edition.slug}" items={getSponsoringNavItems(data.edition.slug)} />

	<!-- Status Filters -->
	<div class="flex flex-wrap gap-2">
		<Button
			variant={data.currentFilter === null ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter(null)}
		>
			{m.sponsoring_inquiries_filter_all()}
			<Badge variant="secondary" class="ml-2">{data.statusCounts.all}</Badge>
		</Button>
		<Button
			variant={data.currentFilter === 'pending' ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter('pending')}
		>
			{m.sponsoring_inquiries_filter_pending()}
			<Badge variant="secondary" class="ml-2">{data.statusCounts.pending}</Badge>
		</Button>
		<Button
			variant={data.currentFilter === 'contacted' ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter('contacted')}
		>
			{m.sponsoring_inquiries_filter_contacted()}
			<Badge variant="secondary" class="ml-2">{data.statusCounts.contacted}</Badge>
		</Button>
		<Button
			variant={data.currentFilter === 'converted' ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter('converted')}
		>
			{m.sponsoring_inquiries_filter_converted()}
			<Badge variant="secondary" class="ml-2">{data.statusCounts.converted}</Badge>
		</Button>
		<Button
			variant={data.currentFilter === 'rejected' ? 'default' : 'outline'}
			size="sm"
			onclick={() => setFilter('rejected')}
		>
			{m.sponsoring_inquiries_filter_rejected()}
			<Badge variant="secondary" class="ml-2">{data.statusCounts.rejected}</Badge>
		</Button>
	</div>

	<!-- Inquiries Table -->
	{#if data.inquiries.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Inbox class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">{m.sponsoring_inquiries_empty()}</h3>
				<p class="text-sm text-muted-foreground">
					{#if data.currentFilter}
						{m.sponsoring_inquiries_empty_with_filter({ status: data.currentFilter })}
					{:else}
						{m.sponsoring_inquiries_empty_hint()}
					{/if}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>{m.sponsoring_inquiries_company()}</Table.Head>
						<Table.Head>{m.sponsoring_inquiries_contact()}</Table.Head>
						<Table.Head class="hidden md:table-cell">{m.sponsoring_inquiries_package()}</Table.Head>
						<Table.Head class="hidden lg:table-cell">{m.sponsoring_inquiries_date()}</Table.Head>
						<Table.Head>{m.sponsoring_inquiries_status()}</Table.Head>
						<Table.Head class="text-right">{m.sponsoring_inquiries_actions()}</Table.Head>
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
										<Button variant="ghost" size="icon" title={m.sponsoring_inquiries_view_details()}>
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
												title={m.sponsoring_inquiries_mark_contacted()}
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
												title={m.sponsoring_inquiries_convert()}
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
												title={m.sponsoring_inquiries_reject()}
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
