<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Mail, Plus, Send, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showCreateForm = $state(false)
let isSubmitting = $state(false)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'sending':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'sent':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

// Close form on success
$effect(() => {
  if (form?.success && form?.action === 'createCampaign') {
    showCreateForm = false
  }
})
</script>

<svelte:head>
	<title>Email Campaigns - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Email Campaigns</h2>
			<p class="text-muted-foreground">
				Create and send email campaigns to your contacts.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a href="/admin/emails/templates">
				<Button variant="outline">Templates</Button>
			</a>
			<Button onclick={() => (showCreateForm = !showCreateForm)} class="gap-2">
				<Plus class="h-4 w-4" />
				New Campaign
			</Button>
		</div>
	</div>

	<!-- Success / Error messages -->
	{#if form?.success}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			{#if form.action === 'createCampaign'}Campaign created successfully.
			{:else if form.action === 'deleteCampaign'}Campaign deleted.
			{:else if form.action === 'sendCampaign'}
				Campaign sent. {form.sendResult?.totalSent ?? 0} delivered, {form.sendResult?.totalFailed ?? 0} failed out of {form.sendResult?.totalRecipients ?? 0} recipients.
			{:else}Action completed.{/if}
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			{form.error}
		</div>
	{/if}

	<!-- Create Campaign Form -->
	{#if showCreateForm}
		<Card.Root>
			<Card.Header>
				<Card.Title>New Campaign</Card.Title>
				<Card.Description>Create a new email campaign.</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					method="POST"
					action="?/createCampaign"
					use:enhance={() => {
						isSubmitting = true
						return async ({ update }) => {
							isSubmitting = false
							await update()
						}
					}}
					class="space-y-4"
				>
					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="camp-name">Campaign Name *</Label>
							<Input id="camp-name" name="name" placeholder="e.g., Speaker Announcement" required />
						</div>
						<div class="space-y-2">
							<Label for="camp-subject">Subject *</Label>
							<Input id="camp-subject" name="subject" placeholder="e.g., You're invited to speak!" required />
						</div>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="camp-segment">Segment (optional)</Label>
							<select
								id="camp-segment"
								name="segmentId"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">All contacts</option>
								{#each data.segments as segment}
									<option value={segment.id}>{segment.name} ({segment.contactCount} contacts)</option>
								{/each}
							</select>
						</div>
						<div class="space-y-2">
							<Label for="camp-template">Template (optional)</Label>
							<select
								id="camp-template"
								name="templateId"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">No template</option>
								{#each data.templates as template}
									<option value={template.id}>{template.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="camp-html">HTML Body</Label>
						<textarea
							id="camp-html"
							name="bodyHtml"
							class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder={'<h1>Hello {{firstName}}</h1><p>...</p>'}
						></textarea>
					</div>

					<div class="space-y-2">
						<Label for="camp-text">Plain Text Body</Label>
						<textarea
							id="camp-text"
							name="bodyText"
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder={'Hello {{firstName}}, ...'}
						></textarea>
					</div>

					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={() => (showCreateForm = false)}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create Campaign'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Campaign List -->
	{#if data.campaigns.length === 0 && !showCreateForm}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<Mail class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No campaigns yet</h3>
				<p class="text-sm text-muted-foreground">
					Create your first email campaign to reach your contacts.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="rounded-md border">
			<table class="w-full">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="p-3 text-left text-sm font-medium">Name</th>
						<th class="p-3 text-left text-sm font-medium">Subject</th>
						<th class="p-3 text-left text-sm font-medium">Status</th>
						<th class="p-3 text-center text-sm font-medium">Stats</th>
						<th class="p-3 text-right text-sm font-medium">Created</th>
						<th class="p-3 text-right text-sm font-medium">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.campaigns as campaign}
						<tr class="border-b transition-colors hover:bg-muted/50">
							<td class="p-3">
								<div class="font-medium">{campaign.name}</div>
							</td>
							<td class="p-3 text-sm text-muted-foreground">
								{campaign.subject}
							</td>
							<td class="p-3">
								<span class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(campaign.status)}">
									{campaign.status}
								</span>
							</td>
							<td class="p-3 text-center text-sm">
								{#if campaign.status === 'sent' || campaign.status === 'sending'}
									<span class="text-green-600">{campaign.totalSent} sent</span>
									{#if campaign.totalFailed > 0}
										<span class="text-red-600"> / {campaign.totalFailed} failed</span>
									{/if}
								{:else}
									<span class="text-muted-foreground">-</span>
								{/if}
							</td>
							<td class="p-3 text-right text-sm text-muted-foreground">
								{formatDate(campaign.createdAt)}
							</td>
							<td class="p-3 text-right">
								<div class="flex items-center justify-end gap-1">
									{#if campaign.status === 'draft'}
										<form method="POST" action="?/sendCampaign" use:enhance class="inline">
											<input type="hidden" name="campaignId" value={campaign.id} />
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												class="gap-1 text-green-600 hover:text-green-600"
												title="Send campaign"
											>
												<Send class="h-3 w-3" />
												Send
											</Button>
										</form>
									{/if}
									{#if campaign.status === 'draft' || campaign.status === 'cancelled'}
										<form method="POST" action="?/deleteCampaign" use:enhance class="inline">
											<input type="hidden" name="campaignId" value={campaign.id} />
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												class="text-destructive hover:text-destructive"
												title="Delete campaign"
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
	{/if}
</div>
