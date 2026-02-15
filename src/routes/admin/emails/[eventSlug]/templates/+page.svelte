<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import type { EmailDocument } from '$lib/features/crm/domain/email-editor'
import { EmailEditor } from '$lib/features/crm/ui/email-editor'
import { Code, Edit, FileText, Paintbrush, Plus, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showForm = $state(false)
let editingTemplate = $state<(typeof data.templates)[0] | null>(null)
let isSubmitting = $state(false)
let editorMode = $state<'code' | 'visual'>('code')
let visualEditorDocument = $state<EmailDocument | undefined>(undefined)
let visualEditorHtml = $state('')
let visualEditorText = $state('')

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

function startEdit(template: (typeof data.templates)[0]) {
  editingTemplate = template
  showForm = true
  // Set editor mode based on whether template has visual editor document
  if (template.documentJson) {
    editorMode = 'visual'
    visualEditorDocument = template.documentJson as EmailDocument
    visualEditorHtml = template.bodyHtml
    visualEditorText = template.bodyText
  } else {
    editorMode = 'code'
    visualEditorDocument = undefined
    visualEditorHtml = ''
    visualEditorText = ''
  }
}

function cancelForm() {
  showForm = false
  editingTemplate = null
  editorMode = 'code'
  visualEditorDocument = undefined
  visualEditorHtml = ''
  visualEditorText = ''
}

function handleVisualEditorSave(document: EmailDocument, html: string, text: string) {
  visualEditorDocument = document
  visualEditorHtml = html
  visualEditorText = text
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
		<Button onclick={() => { editingTemplate = null; showForm = !showForm }} class="gap-2">
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
				<div class="flex items-center justify-between">
					<div>
						<Card.Title>{editingTemplate ? 'Edit Template' : 'New Template'}</Card.Title>
						<Card.Description>
							{editingTemplate ? 'Update the template details.' : 'Create a reusable email template.'}
						</Card.Description>
					</div>
					<div class="flex gap-1 rounded-lg bg-muted p-1">
						<Button
							variant={editorMode === 'code' ? 'default' : 'ghost'}
							size="sm"
							onclick={() => (editorMode = 'code')}
							class="gap-1"
						>
							<Code class="h-4 w-4" />
							Code
						</Button>
						<Button
							variant={editorMode === 'visual' ? 'default' : 'ghost'}
							size="sm"
							onclick={() => (editorMode = 'visual')}
							class="gap-1"
						>
							<Paintbrush class="h-4 w-4" />
							Visual
						</Button>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				{#if editorMode === 'visual'}
					<!-- Visual Editor Mode -->
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
						class="space-y-4"
					>
						{#if editingTemplate}
							<input type="hidden" name="id" value={editingTemplate.id} />
						{/if}
						<input type="hidden" name="bodyHtml" value={visualEditorHtml} />
						<input type="hidden" name="bodyText" value={visualEditorText} />
						<input type="hidden" name="documentJson" value={visualEditorDocument ? JSON.stringify(visualEditorDocument) : ''} />

						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="tpl-name-visual">Name *</Label>
								<Input
									id="tpl-name-visual"
									name="name"
									placeholder="e.g., Speaker Invitation"
									required
									value={editingTemplate?.name || ''}
								/>
							</div>
							<div class="space-y-2">
								<Label for="tpl-subject-visual">Subject *</Label>
								<Input
									id="tpl-subject-visual"
									name="subject"
									placeholder={"e.g., You're invited to {{eventName}}!"}
									required
									value={editingTemplate?.subject || ''}
								/>
							</div>
						</div>

						<div class="rounded-lg border" style="height: 600px;">
							<EmailEditor
								initialDocument={visualEditorDocument}
								onSave={handleVisualEditorSave}
							/>
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
				{:else}
					<!-- Code Editor Mode -->
					<div class="grid gap-6 lg:grid-cols-3">
						<div class="lg:col-span-2">
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
								class="space-y-4"
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

								<div class="space-y-2">
									<Label for="tpl-html">HTML Body</Label>
									<textarea
										id="tpl-html"
										name="bodyHtml"
										class="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										placeholder={'<h1>Hello {{firstName}},</h1>\n<p>We\'d like to invite you to {{eventName}}.</p>'}
									>{editingTemplate?.bodyHtml || ''}</textarea>
								</div>

								<div class="space-y-2">
									<Label for="tpl-text">Plain Text Body</Label>
									<textarea
										id="tpl-text"
										name="bodyText"
										class="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
										placeholder={"Hello {{firstName}},\n\nWe'd like to invite you to {{eventName}}."}
									>{editingTemplate?.bodyText || ''}</textarea>
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
						</div>

						<!-- Variable Reference -->
						<div>
							<Card.Root>
								<Card.Header>
									<Card.Title class="flex items-center gap-2 text-sm">
										<Code class="h-4 w-4" />
										Available Variables
									</Card.Title>
								</Card.Header>
								<Card.Content>
									<div class="space-y-2">
										{#each AVAILABLE_VARIABLES as variable}
											<div class="flex items-start justify-between gap-2">
												<code class="rounded bg-muted px-1.5 py-0.5 text-xs">{variable.key}</code>
												<span class="text-xs text-muted-foreground">{variable.description}</span>
											</div>
										{/each}
									</div>
								</Card.Content>
							</Card.Root>
						</div>
					</div>
				{/if}
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
							{#if template.documentJson}
								<Badge variant="outline" class="shrink-0 gap-1">
									<Paintbrush class="h-3 w-3" />
									Visual
								</Badge>
							{/if}
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
