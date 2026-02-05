<script lang="ts">
import { enhance } from '$app/forms'
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { ExternalLink, RefreshCw, Search, Trash2, UserPlus, Users } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let searchValue = $state(data.search)
let isSyncing = $state(false)

function handleSearch(e: Event) {
  e.preventDefault()
  const params = new URLSearchParams()
  if (searchValue) params.set('search', searchValue)
  if (data.source) params.set('source', data.source)
  const query = params.toString()
  goto(`/admin/crm${query ? `?${query}` : ''}`)
}

function handleSourceFilter(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  const params = new URLSearchParams()
  if (data.search) params.set('search', data.search)
  if (value) params.set('source', value)
  const query = params.toString()
  goto(`/admin/crm${query ? `?${query}` : ''}`)
}

function goToPage(page: number) {
  const params = new URLSearchParams()
  if (data.search) params.set('search', data.search)
  if (data.source) params.set('source', data.source)
  if (page > 1) params.set('page', String(page))
  const query = params.toString()
  goto(`/admin/crm${query ? `?${query}` : ''}`)
}

const getSourceColor = (source: string) => {
  switch (source) {
    case 'speaker':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'attendee':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'manual':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'import':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}
</script>

<svelte:head>
	<title>CRM - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Contacts</h2>
			<p class="text-muted-foreground">
				Manage your event contacts, speakers, and attendees.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<form method="POST" action="?/syncContacts" use:enhance={() => {
				isSyncing = true
				return async ({ update }) => {
					isSyncing = false
					await update()
				}
			}}>
				<Button type="submit" variant="outline" class="gap-2" disabled={isSyncing}>
					<RefreshCw class="h-4 w-4 {isSyncing ? 'animate-spin' : ''}" />
					Sync Contacts
				</Button>
			</form>
			<a href="/admin/crm/import">
				<Button variant="outline" class="gap-2">
					<UserPlus class="h-4 w-4" />
					Import
				</Button>
			</a>
		</div>
	</div>

	<!-- Success / Error messages -->
	{#if form?.success && form?.action === 'syncContacts'}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			Sync complete: {form.syncResult?.created ?? 0} created, {form.syncResult?.updated ?? 0} updated, {form.syncResult?.linked ?? 0} linked.
			{#if form.syncResult?.errors && form.syncResult.errors.length > 0}
				<br />{form.syncResult.errors.length} error(s) occurred.
			{/if}
		</div>
	{/if}

	{#if form?.success && form?.action === 'deleteContact'}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			Contact deleted successfully.
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			{form.error}
		</div>
	{/if}

	<!-- Stats Cards -->
	<div class="grid gap-4 md:grid-cols-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Contacts</Card.Title>
				<Users class="h-4 w-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.total}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Speakers</Card.Title>
				<Users class="h-4 w-4 text-purple-500" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.speakers}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Attendees</Card.Title>
				<Users class="h-4 w-4 text-blue-500" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.attendees}</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Manual</Card.Title>
				<Users class="h-4 w-4 text-green-500" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.manual}</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Search and Filter -->
	<div class="flex items-center gap-4">
		<form onsubmit={handleSearch} class="relative flex-1">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				placeholder="Search by name, email, or company..."
				bind:value={searchValue}
				class="pl-9"
			/>
		</form>
		<select
			class="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			value={data.source}
			onchange={handleSourceFilter}
		>
			<option value="">All Sources</option>
			<option value="speaker">Speaker</option>
			<option value="attendee">Attendee</option>
			<option value="manual">Manual</option>
			<option value="import">Import</option>
		</select>
		<div class="flex gap-2">
			<a href="/admin/crm/segments">
				<Button variant="outline" size="sm">Segments</Button>
			</a>
		</div>
	</div>

	<!-- Contact Table -->
	{#if data.contacts.length === 0}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Users class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No contacts found</h3>
				<p class="text-sm text-muted-foreground">
					{#if data.search || data.source}
						Try adjusting your search or filter.
					{:else}
						Sync from your events or import contacts to get started.
					{/if}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="rounded-md border">
			<table class="w-full">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="p-3 text-left text-sm font-medium">Name</th>
						<th class="p-3 text-left text-sm font-medium">Email</th>
						<th class="p-3 text-left text-sm font-medium">Company</th>
						<th class="p-3 text-left text-sm font-medium">Source</th>
						<th class="p-3 text-left text-sm font-medium">Tags</th>
						<th class="p-3 text-right text-sm font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.contacts as contact}
						<tr class="border-b transition-colors hover:bg-muted/50">
							<td class="p-3">
								<a href="/admin/crm/{contact.id}" class="font-medium hover:underline">
									{contact.firstName} {contact.lastName}
								</a>
							</td>
							<td class="p-3 text-sm text-muted-foreground">
								{contact.email}
							</td>
							<td class="p-3 text-sm">
								{contact.company || '-'}
							</td>
							<td class="p-3">
								<span class="rounded-full px-2 py-0.5 text-xs font-medium {getSourceColor(contact.source)}">
									{contact.source}
								</span>
							</td>
							<td class="p-3">
								<div class="flex flex-wrap gap-1">
									{#each contact.tags.slice(0, 3) as tag}
										<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
											{tag}
										</span>
									{/each}
									{#if contact.tags.length > 3}
										<span class="text-xs text-muted-foreground">+{contact.tags.length - 3}</span>
									{/if}
								</div>
							</td>
							<td class="p-3 text-right">
								<div class="flex items-center justify-end gap-1">
									<a href="/admin/crm/{contact.id}">
										<Button variant="ghost" size="sm" title="View contact">
											<ExternalLink class="h-3 w-3" />
										</Button>
									</a>
									<form method="POST" action="?/deleteContact" use:enhance class="inline">
										<input type="hidden" name="contactId" value={contact.id} />
										<Button
											type="submit"
											variant="ghost"
											size="sm"
											class="text-destructive hover:text-destructive"
											title="Delete contact"
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

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div class="flex items-center justify-between">
				<p class="text-sm text-muted-foreground">
					Showing {(data.currentPage - 1) * 20 + 1} to {Math.min(data.currentPage * 20, data.totalItems)} of {data.totalItems} contacts
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={data.currentPage <= 1}
						onclick={() => goToPage(data.currentPage - 1)}
					>
						Previous
					</Button>
					{#each Array.from({ length: data.totalPages }, (_, i) => i + 1) as pageNum}
						{#if pageNum === data.currentPage}
							<Button size="sm" variant="default">{pageNum}</Button>
						{:else if Math.abs(pageNum - data.currentPage) <= 2 || pageNum === 1 || pageNum === data.totalPages}
							<Button
								size="sm"
								variant="outline"
								onclick={() => goToPage(pageNum)}
							>
								{pageNum}
							</Button>
						{:else if Math.abs(pageNum - data.currentPage) === 3}
							<span class="px-1 text-muted-foreground">...</span>
						{/if}
					{/each}
					<Button
						variant="outline"
						size="sm"
						disabled={data.currentPage >= data.totalPages}
						onclick={() => goToPage(data.currentPage + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	{/if}
</div>
