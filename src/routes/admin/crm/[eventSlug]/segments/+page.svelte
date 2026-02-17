<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { getCrmNavItems } from '$lib/config'
import type { SegmentCriteria } from '$lib/features/crm/domain/segment'
import { SegmentCriteriaBuilder } from '$lib/features/crm/ui'
import { ArrowLeft, Edit, Filter, Plus, RefreshCw, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showForm = $state(false)
let editingSegment = $state<(typeof data.segments)[0] | null>(null)
let isSubmitting = $state(false)
let previewCount = $state<number | null>(null)
let isLoadingPreview = $state(false)

// Initialize criteria state
let criteria = $state<SegmentCriteria>({ match: 'all', rules: [] })

const basePath = `/admin/crm/${data.eventSlug}`

function startEdit(segment: (typeof data.segments)[0]) {
  editingSegment = segment
  criteria = {
    match: (segment.criteria.match as 'all' | 'any') || 'all',
    rules: (segment.criteria.rules || []) as SegmentCriteria['rules']
  }
  previewCount = segment.contactCount
  showForm = true
}

function cancelForm() {
  showForm = false
  editingSegment = null
  criteria = { match: 'all', rules: [] }
  previewCount = null
}

function startCreate() {
  editingSegment = null
  criteria = { match: 'all', rules: [] }
  previewCount = null
  showForm = true
}

function handleCriteriaChange(newCriteria: SegmentCriteria) {
  criteria = newCriteria
  // Reset preview when criteria changes
  previewCount = null
}

async function refreshPreview() {
  if (criteria.rules.length === 0) {
    previewCount = 0
    return
  }

  isLoadingPreview = true
  try {
    const response = await fetch(`/admin/crm/${data.eventSlug}/segments?/previewCount`, {
      method: 'POST',
      body: new URLSearchParams({
        criteria: JSON.stringify(criteria)
      })
    })
    const result = await response.json()
    if (result.type === 'success' && result.data) {
      previewCount = result.data.count
    }
  } catch {
    // Ignore preview errors
  } finally {
    isLoadingPreview = false
  }
}

// Close form on success
$effect(() => {
  if (form?.success && (form?.action === 'createSegment' || form?.action === 'updateSegment')) {
    cancelForm()
  }
})
</script>

<svelte:head>
	<title>Segments - CRM - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href={basePath}>
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">Segments</h2>
				<p class="text-muted-foreground">
					Create dynamic or static segments to organize your contacts.
				</p>
			</div>
		</div>
		<Button onclick={startCreate} class="gap-2">
			<Plus class="h-4 w-4" />
			Create Segment
		</Button>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/crm/{data.eventSlug}" items={getCrmNavItems(data.eventSlug)} />

	<!-- Success / Error messages -->
	{#if form?.success}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			{#if form.action === 'createSegment'}Segment created successfully.
			{:else if form.action === 'updateSegment'}Segment updated.
			{:else if form.action === 'deleteSegment'}Segment deleted.
			{:else if form.action === 'refreshCount'}Contact count refreshed.
			{:else}Action completed.{/if}
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			{form.error}
		</div>
	{/if}

	<!-- Segment Form (Create / Edit) -->
	{#if showForm}
		<Card.Root>
			<Card.Header>
				<Card.Title>{editingSegment ? 'Edit Segment' : 'New Segment'}</Card.Title>
				<Card.Description>
					{editingSegment ? 'Update the segment details and criteria.' : 'Define a segment to group contacts by criteria.'}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					method="POST"
					action={editingSegment ? '?/updateSegment' : '?/createSegment'}
					use:enhance={() => {
						isSubmitting = true
						return async ({ update }) => {
							isSubmitting = false
							await update()
						}
					}}
					class="space-y-4"
				>
					{#if editingSegment}
						<input type="hidden" name="id" value={editingSegment.id} />
					{/if}

					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="seg-name">Name *</Label>
							<Input id="seg-name" name="name" placeholder="e.g., Active Speakers" required value={editingSegment?.name || ''} />
						</div>
						<div class="space-y-2">
							<Label for="seg-description">Description</Label>
							<Input id="seg-description" name="description" placeholder="Describe this segment..." value={editingSegment?.description || ''} />
						</div>
					</div>

					<div class="space-y-2">
						<Label>Criteria</Label>
						<SegmentCriteriaBuilder
							{criteria}
							onCriteriaChange={handleCriteriaChange}
							{previewCount}
							{isLoadingPreview}
							onRefreshPreview={refreshPreview}
						/>
					</div>

					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="seg-static"
							name="isStatic"
							class="h-4 w-4 rounded border-gray-300"
							checked={editingSegment?.isStatic || false}
						/>
						<Label for="seg-static">Static segment (contacts are manually managed)</Label>
					</div>

					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={cancelForm}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : editingSegment ? 'Update Segment' : 'Create Segment'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Segment List -->
	{#if data.segments.length === 0 && !showForm}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Filter class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No segments yet</h3>
				<p class="text-sm text-muted-foreground">
					Create a segment to group and filter your contacts.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.segments as segment}
				<Card.Root class="transition-shadow hover:shadow-md">
					<Card.Header>
						<div class="flex items-start justify-between">
							<div>
								<Card.Title class="flex items-center gap-2">
									<Filter class="h-4 w-4" />
									{segment.name}
								</Card.Title>
								{#if segment.description}
									<Card.Description class="mt-1">{segment.description}</Card.Description>
								{/if}
							</div>
							<span class="rounded-full px-2 py-0.5 text-xs font-medium {segment.isStatic ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}">
								{segment.isStatic ? 'Static' : 'Dynamic'}
							</span>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Contacts</span>
								<span class="text-2xl font-bold">{segment.contactCount}</span>
							</div>
							<div class="flex items-center justify-between">
								<span class="text-sm text-muted-foreground">Rules</span>
								<span class="text-sm font-medium">{segment.ruleCount}</span>
							</div>
							<div class="flex items-center justify-end gap-2 pt-2">
								<form method="POST" action="?/refreshCount" use:enhance class="inline">
									<input type="hidden" name="segmentId" value={segment.id} />
									<Button type="submit" variant="outline" size="sm" class="gap-1">
										<RefreshCw class="h-3 w-3" />
										Refresh
									</Button>
								</form>
								<Button
									variant="outline"
									size="sm"
									class="gap-1"
									onclick={() => startEdit(segment)}
								>
									<Edit class="h-3 w-3" />
									Edit
								</Button>
								<form method="POST" action="?/deleteSegment" use:enhance class="inline">
									<input type="hidden" name="segmentId" value={segment.id} />
									<Button
										type="submit"
										variant="ghost"
										size="sm"
										class="text-destructive hover:text-destructive"
									>
										<Trash2 class="h-3 w-3" />
									</Button>
								</form>
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		</div>
	{/if}
</div>
