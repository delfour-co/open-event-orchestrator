<script lang="ts">
import { enhance } from '$app/forms'
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Ban, Calendar, Edit, Mail, MailCheck, Plus, Send, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showForm = $state(false)
let editingCampaign = $state<(typeof data.campaigns)[0] | null>(null)
let isSubmitting = $state(false)

const basePath = `/admin/emails/${data.eventSlug}`

function startEdit(campaign: (typeof data.campaigns)[0]) {
  editingCampaign = campaign
  showForm = true
}

function cancelForm() {
  showForm = false
  editingCampaign = null
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Close form on success
$effect(() => {
  if (form?.success && (form?.action === 'createCampaign' || form?.action === 'updateCampaign')) {
    cancelForm()
  }
})
</script>

<svelte:head>
	<title>Email Campaigns - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<div class="flex items-center gap-2 text-sm text-muted-foreground mb-1">
				<a href="/admin/emails" class="hover:underline">Emails</a>
				<span>/</span>
				<span>Campaigns</span>
			</div>
			<h2 class="text-3xl font-bold tracking-tight">Email Campaigns</h2>
			<p class="text-muted-foreground">
				Create and send email campaigns to your contacts.
			</p>
		</div>
		<div class="flex items-center gap-2">
			<a href="{basePath}/templates">
				<Button variant="outline">Templates</Button>
			</a>
			<Button onclick={() => { editingCampaign = null; showForm = !showForm }} class="gap-2">
				<Plus class="h-4 w-4" />
				New Campaign
			</Button>
		</div>
	</div>

	<!-- Success / Error messages -->
	{#if form?.success}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			{#if form.action === 'createCampaign'}Campaign created successfully.
			{:else if form.action === 'updateCampaign'}Campaign updated.
			{:else if form.action === 'deleteCampaign'}Campaign deleted.
			{:else if form.action === 'testSendCampaign'}Test email sent successfully.
			{:else if form.action === 'cancelCampaign'}Campaign cancelled.
			{:else if form.action === 'scheduleCampaign'}Campaign scheduled.
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

	<!-- Campaign Form (Create / Edit) -->
	{#if showForm}
		<Card.Root>
			<Card.Header>
				<Card.Title>{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</Card.Title>
				<Card.Description>
					{editingCampaign ? 'Update the campaign details.' : 'Create a new email campaign.'}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					method="POST"
					action={editingCampaign ? '?/updateCampaign' : '?/createCampaign'}
					use:enhance={() => {
						isSubmitting = true
						return async ({ update }) => {
							isSubmitting = false
							await update()
						}
					}}
					class="space-y-4"
				>
					{#if editingCampaign}
						<input type="hidden" name="campaignId" value={editingCampaign.id} />
					{/if}

					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="camp-name">Campaign Name *</Label>
							<Input id="camp-name" name="name" placeholder="e.g., Speaker Announcement" required value={editingCampaign?.name || ''} />
						</div>
						<div class="space-y-2">
							<Label for="camp-subject">Subject *</Label>
							<Input id="camp-subject" name="subject" placeholder="e.g., You're invited to speak!" required value={editingCampaign?.subject || ''} />
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
									<option value={segment.id} selected={editingCampaign?.segmentId === segment.id}>{segment.name} ({segment.contactCount} contacts)</option>
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
									<option value={template.id} selected={editingCampaign?.templateId === template.id}>{template.name}</option>
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
						>{editingCampaign?.bodyHtml || ''}</textarea>
					</div>

					<div class="space-y-2">
						<Label for="camp-text">Plain Text Body</Label>
						<textarea
							id="camp-text"
							name="bodyText"
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder={'Hello {{firstName}}, ...'}
						>{editingCampaign?.bodyText || ''}</textarea>
					</div>

					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={cancelForm}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Campaign List -->
	{#if data.campaigns.length === 0 && !showForm}
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
								<StatusBadge status={campaign.status} size="sm" />
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
									{#if campaign.status === 'draft' || campaign.status === 'scheduled'}
										<Button
											variant="ghost"
											size="sm"
											class="gap-1"
											title="Edit campaign"
											onclick={() => startEdit(campaign)}
										>
											<Edit class="h-3 w-3" />
											Edit
										</Button>
									{/if}
									{#if campaign.status === 'draft'}
										<form method="POST" action="?/testSendCampaign" use:enhance class="inline flex items-center gap-1">
											<input type="hidden" name="campaignId" value={campaign.id} />
											<input
												type="email"
												name="testEmail"
												required
												placeholder="test@email.com"
												class="h-8 w-36 rounded-md border border-input bg-background px-2 text-xs"
											/>
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												class="gap-1 text-blue-600 hover:text-blue-600"
												title="Send test email"
											>
												<MailCheck class="h-3 w-3" />
												Test
											</Button>
										</form>
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
										<form method="POST" action="?/scheduleCampaign" use:enhance class="inline flex items-center gap-1">
											<input type="hidden" name="campaignId" value={campaign.id} />
											<input
												type="datetime-local"
												name="scheduledAt"
												required
												class="h-8 rounded-md border border-input bg-background px-2 text-xs"
											/>
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												class="gap-1 text-blue-600 hover:text-blue-600"
												title="Schedule campaign"
											>
												<Calendar class="h-3 w-3" />
												Schedule
											</Button>
										</form>
									{/if}
									{#if campaign.status === 'draft' || campaign.status === 'scheduled'}
										<form method="POST" action="?/cancelCampaign" use:enhance class="inline">
											<input type="hidden" name="campaignId" value={campaign.id} />
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												class="gap-1 text-orange-600 hover:text-orange-600"
												title="Cancel campaign"
											>
												<Ban class="h-3 w-3" />
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
