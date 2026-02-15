<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Code, Edit, Eye, FileText, Plus, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showForm = $state(false)
let editingTemplate = $state<(typeof data.templates)[0] | null>(null)
let isSubmitting = $state(false)
let previewTab = $state<'html' | 'text'>('html')
let htmlContent = $state('')
let textContent = $state('')

const basePath = `/admin/emails/${data.eventSlug}`

const AVAILABLE_VARIABLES = [
  { key: '{{firstName}}', description: 'Contact first name' },
  { key: '{{lastName}}', description: 'Contact last name' },
  { key: '{{email}}', description: 'Contact email' },
  { key: '{{company}}', description: 'Contact company' },
  { key: '{{eventName}}', description: 'Event name' },
  { key: '{{editionName}}', description: 'Edition name' },
  { key: '{{unsubscribeUrl}}', description: 'Unsubscribe link' }
]

const previewHtml = $derived(() => {
  if (!htmlContent)
    return '<p style="color: #888; text-align: center; padding: 2rem;">Enter HTML content to see preview</p>'
  // Replace variables with sample values for preview
  return htmlContent
    .replace(/\{\{firstName\}\}/g, 'John')
    .replace(/\{\{lastName\}\}/g, 'Doe')
    .replace(/\{\{email\}\}/g, 'john.doe@example.com')
    .replace(/\{\{company\}\}/g, 'Acme Corp')
    .replace(/\{\{eventName\}\}/g, 'DevFest Paris')
    .replace(/\{\{editionName\}\}/g, 'DevFest Paris 2025')
    .replace(/\{\{unsubscribeUrl\}\}/g, '#')
})

function startEdit(template: (typeof data.templates)[0]) {
  editingTemplate = template
  htmlContent = template.bodyHtml
  textContent = template.bodyText
  showForm = true
}

function startCreate() {
  editingTemplate = null
  htmlContent = ''
  textContent = ''
  showForm = true
}

function cancelForm() {
  showForm = false
  editingTemplate = null
  htmlContent = ''
  textContent = ''
}

// Close form on success
$effect(() => {
  if (form?.success && (form?.action === 'createTemplate' || form?.action === 'updateTemplate')) {
    cancelForm()
  }
})
</script>

<svelte:head>
	<title>Email Templates - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href={basePath}>
				<Button variant="ghost" size="sm">Back to Campaigns</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">Email Templates</h2>
				<p class="text-muted-foreground">
					Manage reusable email templates for your campaigns.
				</p>
			</div>
		</div>
		<Button onclick={startCreate} class="gap-2">
			<Plus class="h-4 w-4" />
			Create Template
		</Button>
	</div>

	<!-- Success / Error messages -->
	{#if form?.success}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			{#if form.action === 'createTemplate'}Template created successfully.
			{:else if form.action === 'updateTemplate'}Template updated.
			{:else if form.action === 'deleteTemplate'}Template deleted.
			{:else}Action completed.{/if}
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			{form.error}
		</div>
	{/if}

	<!-- Template Form -->
	{#if showForm}
		<Card.Root>
			<Card.Header>
				<Card.Title>{editingTemplate ? 'Edit Template' : 'New Template'}</Card.Title>
				<Card.Description>
					{editingTemplate ? 'Update the template details.' : 'Create a reusable email template.'}
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					method="POST"
					action={editingTemplate ? '?/updateTemplate' : '?/createTemplate'}
					use:enhance={() => {
						isSubmitting = true
						return async ({ update }) => {
							isSubmitting = false
							await update()
						}
					}}
					class="space-y-6"
				>
					{#if editingTemplate}
						<input type="hidden" name="id" value={editingTemplate.id} />
					{/if}

					<div class="grid gap-4 md:grid-cols-2">
						<div class="space-y-2">
							<Label for="tpl-name">Name *</Label>
							<Input
								id="tpl-name"
								name="name"
								placeholder="e.g., Speaker Invitation"
								required
								value={editingTemplate?.name || ''}
							/>
						</div>
						<div class="space-y-2">
							<Label for="tpl-subject">Subject *</Label>
							<Input
								id="tpl-subject"
								name="subject"
								placeholder={"e.g., You're invited to {{eventName}}!"}
								required
								value={editingTemplate?.subject || ''}
							/>
						</div>
					</div>

					<div class="grid gap-6 lg:grid-cols-2">
						<!-- Code Editor -->
						<div class="space-y-4">
							<div class="flex items-center gap-2">
								<Code class="h-4 w-4" />
								<span class="font-medium">Code</span>
							</div>

							<div class="space-y-4">
								<div class="space-y-2">
									<Label for="tpl-html">HTML Body</Label>
									<textarea
										id="tpl-html"
										name="bodyHtml"
										bind:value={htmlContent}
										class="flex min-h-[250px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										placeholder={'<h1>Hello {{firstName}},</h1>\n<p>We\'d like to invite you to {{eventName}}.</p>'}
									></textarea>
								</div>

								<div class="space-y-2">
									<Label for="tpl-text">Plain Text Body</Label>
									<textarea
										id="tpl-text"
										name="bodyText"
										bind:value={textContent}
										class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										placeholder={"Hello {{firstName}},\n\nWe'd like to invite you to {{eventName}}."}
									></textarea>
								</div>

								<!-- Variable Reference -->
								<Card.Root>
									<Card.Header class="py-3">
										<Card.Title class="flex items-center gap-2 text-sm">
											Available Variables
										</Card.Title>
									</Card.Header>
									<Card.Content class="py-2">
										<div class="flex flex-wrap gap-2">
											{#each AVAILABLE_VARIABLES as variable}
												<code class="rounded bg-muted px-1.5 py-0.5 text-xs" title={variable.description}>{variable.key}</code>
											{/each}
										</div>
									</Card.Content>
								</Card.Root>
							</div>
						</div>

						<!-- Preview -->
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Eye class="h-4 w-4" />
									<span class="font-medium">Preview</span>
								</div>
								<div class="flex gap-1 rounded-lg bg-muted p-1">
									<Button
										variant={previewTab === 'html' ? 'default' : 'ghost'}
										size="sm"
										onclick={() => (previewTab = 'html')}
									>
										HTML
									</Button>
									<Button
										variant={previewTab === 'text' ? 'default' : 'ghost'}
										size="sm"
										onclick={() => (previewTab = 'text')}
									>
										Plain Text
									</Button>
								</div>
							</div>

							{#if previewTab === 'html'}
								<div class="min-h-[400px] rounded-md border bg-white p-4 text-black">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html previewHtml()}
								</div>
							{:else}
								<div class="min-h-[400px] whitespace-pre-wrap rounded-md border bg-muted p-4 font-mono text-sm">
									{textContent || 'Enter plain text content to see preview'}
								</div>
							{/if}
						</div>
					</div>

					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={cancelForm}>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Template List -->
	{#if data.templates.length === 0 && !showForm}
		<Card.Root>
			<Card.Content class="flex flex-col items-center justify-center py-12">
				<FileText class="mb-4 h-12 w-12 text-muted-foreground" />
				<h3 class="text-lg font-semibold">No templates yet</h3>
				<p class="text-sm text-muted-foreground">
					Create a reusable email template for your campaigns.
				</p>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.templates as template}
				<Card.Root class="transition-shadow hover:shadow-md">
					<Card.Header>
						<div class="flex items-start justify-between">
							<div>
								<Card.Title class="flex items-center gap-2">
									<FileText class="h-4 w-4" />
									{template.name}
								</Card.Title>
								<Card.Description class="mt-1">{template.subject}</Card.Description>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<div class="space-y-3">
							{#if template.variables.length > 0}
								<div>
									<p class="mb-1 text-xs font-medium text-muted-foreground">Variables:</p>
									<div class="flex flex-wrap gap-1">
										{#each template.variables as variable}
											<code class="rounded bg-muted px-1.5 py-0.5 text-xs">{variable}</code>
										{/each}
									</div>
								</div>
							{/if}
							<div class="flex items-center justify-end gap-2 pt-2">
								<Button
									variant="outline"
									size="sm"
									class="gap-1"
									onclick={() => startEdit(template)}
								>
									<Edit class="h-3 w-3" />
									Edit
								</Button>
								<form method="POST" action="?/deleteTemplate" use:enhance class="inline">
									<input type="hidden" name="id" value={template.id} />
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
