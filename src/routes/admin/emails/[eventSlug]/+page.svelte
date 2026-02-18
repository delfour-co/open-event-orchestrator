<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav, StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { getEmailsNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import { ArrowLeft, Ban, Calendar, Edit, Mail, MailCheck, Plus, Send, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showForm = $state(false)
let editingCampaign = $state<(typeof data.campaigns)[0] | null>(null)
let isSubmitting = $state(false)

function startEdit(campaign: (typeof data.campaigns)[0]) {
  editingCampaign = campaign
  showForm = true
}

function cancelForm() {
  showForm = false
  editingCampaign = null
}

const formatDate = (date: Date) => {
  const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
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
	<title>{m.emails_page_title()}</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/emails">
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">{data.eventName}</h2>
			</div>
		</div>
		<Button onclick={() => { editingCampaign = null; showForm = !showForm }} class="gap-2">
			<Plus class="h-4 w-4" />
			{m.emails_new_campaign()}
		</Button>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/emails/{data.eventSlug}" items={getEmailsNavItems(data.eventSlug)} />

	<!-- Success / Error messages -->
	{#if form?.success}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			{#if form.action === 'createCampaign'}{m.emails_campaign_created()}
			{:else if form.action === 'updateCampaign'}{m.emails_campaign_updated()}
			{:else if form.action === 'deleteCampaign'}{m.emails_campaign_deleted()}
			{:else if form.action === 'testSendCampaign'}{m.emails_campaign_test_sent()}
			{:else if form.action === 'cancelCampaign'}{m.emails_campaign_cancelled()}
			{:else if form.action === 'scheduleCampaign'}{m.emails_campaign_scheduled()}
			{:else if form.action === 'sendCampaign'}
				{m.emails_campaign_sent_result({ delivered: form.sendResult?.totalSent ?? 0, failed: form.sendResult?.totalFailed ?? 0, total: form.sendResult?.totalRecipients ?? 0 })}
			{:else}{m.emails_action_completed()}{/if}
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
				<Card.Title>{editingCampaign ? m.emails_form_edit_campaign() : m.emails_form_new_campaign()}</Card.Title>
				<Card.Description>
					{editingCampaign ? m.emails_form_edit_campaign_desc() : m.emails_form_new_campaign_desc()}
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
							<Label for="camp-name">{m.emails_label_campaign_name()} *</Label>
							<Input id="camp-name" name="name" placeholder={m.emails_placeholder_campaign_name()} required value={editingCampaign?.name || ''} />
						</div>
						<div class="space-y-2">
							<Label for="camp-subject">{m.emails_label_subject()} *</Label>
							<Input id="camp-subject" name="subject" placeholder={m.emails_placeholder_subject()} required value={editingCampaign?.subject || ''} />
						</div>
					</div>

					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="camp-segment">{m.emails_label_segment()}</Label>
							<select
								id="camp-segment"
								name="segmentId"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">{m.emails_option_all_contacts()}</option>
								{#each data.segments as segment}
									<option value={segment.id} selected={editingCampaign?.segmentId === segment.id}>{m.emails_option_contacts_count({ name: segment.name, count: segment.contactCount })}</option>
								{/each}
							</select>
						</div>
						<div class="space-y-2">
							<Label for="camp-template">{m.emails_label_template()}</Label>
							<select
								id="camp-template"
								name="templateId"
								class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">{m.emails_option_no_template()}</option>
								{#each data.templates as template}
									<option value={template.id} selected={editingCampaign?.templateId === template.id}>{template.name}</option>
								{/each}
							</select>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="camp-html">{m.emails_label_html_body()}</Label>
						<textarea
							id="camp-html"
							name="bodyHtml"
							class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder={m.emails_placeholder_html_body()}
						>{editingCampaign?.bodyHtml || ''}</textarea>
					</div>

					<div class="space-y-2">
						<Label for="camp-text">{m.emails_label_plain_text_body()}</Label>
						<textarea
							id="camp-text"
							name="bodyText"
							class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							placeholder={m.emails_placeholder_plain_text_body()}
						>{editingCampaign?.bodyText || ''}</textarea>
					</div>

					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={cancelForm}>
							{m.action_cancel()}
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? m.emails_btn_saving() : editingCampaign ? m.emails_btn_update_campaign() : m.emails_btn_create_campaign()}
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
				<h3 class="text-lg font-semibold">{m.emails_empty_campaigns_title()}</h3>
				<p class="text-sm text-muted-foreground">
					{m.emails_empty_campaigns_desc()}
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="rounded-md border">
			<table class="w-full">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="p-3 text-left text-sm font-medium">{m.emails_table_name()}</th>
						<th class="p-3 text-left text-sm font-medium">{m.emails_table_subject()}</th>
						<th class="p-3 text-left text-sm font-medium">{m.emails_table_status()}</th>
						<th class="p-3 text-center text-sm font-medium">{m.emails_table_stats()}</th>
						<th class="p-3 text-right text-sm font-medium">{m.emails_table_created()}</th>
						<th class="p-3 text-right text-sm font-medium">{m.emails_table_actions()}</th>
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
									<span class="text-green-600">{m.emails_stats_sent({ count: campaign.totalSent })}</span>
									{#if campaign.totalFailed > 0}
										<span class="text-red-600"> / {m.emails_stats_failed({ count: campaign.totalFailed })}</span>
									{/if}
								{:else}
									<span class="text-muted-foreground">{m.emails_stats_none()}</span>
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
											title={m.emails_title_edit()}
											onclick={() => startEdit(campaign)}
										>
											<Edit class="h-3 w-3" />
											{m.action_edit()}
										</Button>
									{/if}
									{#if campaign.status === 'draft'}
										<form method="POST" action="?/testSendCampaign" use:enhance class="inline flex items-center gap-1">
											<input type="hidden" name="campaignId" value={campaign.id} />
											<input
												type="email"
												name="testEmail"
												required
												placeholder={m.emails_placeholder_test_email()}
												class="h-8 w-36 rounded-md border border-input bg-background px-2 text-xs"
											/>
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												class="gap-1 text-blue-600 hover:text-blue-600"
												title={m.emails_title_test()}
											>
												<MailCheck class="h-3 w-3" />
												{m.emails_btn_test()}
											</Button>
										</form>
										<form method="POST" action="?/sendCampaign" use:enhance class="inline">
											<input type="hidden" name="campaignId" value={campaign.id} />
											<Button
												type="submit"
												variant="ghost"
												size="sm"
												class="gap-1 text-green-600 hover:text-green-600"
												title={m.emails_title_send()}
											>
												<Send class="h-3 w-3" />
												{m.emails_btn_send()}
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
												title={m.emails_title_schedule()}
											>
												<Calendar class="h-3 w-3" />
												{m.emails_btn_schedule()}
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
												title={m.emails_title_cancel()}
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
												title={m.emails_title_delete()}
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
