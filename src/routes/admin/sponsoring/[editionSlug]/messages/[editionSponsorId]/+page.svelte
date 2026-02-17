<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { getSponsoringNavItems } from '$lib/config'
import {
  formatMessageDate,
  getStatusBadgeVariant,
  getStatusLabel,
  hasAttachments,
  isFromSponsor,
  isUnread,
  sortByCreatedAsc
} from '$lib/features/sponsoring/domain'
import * as m from '$lib/paraglide/messages'
import {
  ArrowLeft,
  Building2,
  FileText,
  Image,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let subject = $state('')
let content = $state('')
let selectedFiles = $state<File[]>([])
let fileInput: HTMLInputElement
let messagesContainer: HTMLDivElement

const sortedMessages = $derived(sortByCreatedAsc(data.messages))
const sponsor = $derived(data.editionSponsor.sponsor)
const pkg = $derived(data.editionSponsor.package)

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    const newFiles = Array.from(target.files)
    const totalFiles = selectedFiles.length + newFiles.length
    if (totalFiles > 10) {
      alert(m.sponsoring_messages_detail_max_attachments())
      return
    }
    selectedFiles = [...selectedFiles, ...newFiles]
  }
  target.value = ''
}

function removeFile(index: number) {
  selectedFiles = selectedFiles.filter((_, i) => i !== index)
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
    return Image
  }
  return FileText
}

function scrollToBottom() {
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }
}

$effect(() => {
  if (sortedMessages.length > 0) {
    scrollToBottom()
  }
})
</script>

<svelte:head>
	<title>{m.sponsoring_messages_detail_page_title({ sponsor: sponsor?.name || 'Sponsor', name: data.edition.name })}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/sponsoring/{data.edition.slug}/messages">
				<button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
					<ArrowLeft class="h-5 w-5" />
				</button>
			</a>
			<div>
				<div class="flex items-center gap-3">
					<h2 class="text-3xl font-bold tracking-tight">{sponsor?.name || 'Sponsor'}</h2>
					<Badge variant={getStatusBadgeVariant(data.editionSponsor.status)}>
						{getStatusLabel(data.editionSponsor.status)}
					</Badge>
				</div>
				<p class="text-muted-foreground">
					{m.sponsoring_messages_detail_for({ name: data.edition.name })}
				</p>
			</div>
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/sponsoring/{data.edition.slug}" items={getSponsoringNavItems(data.edition.slug)} />

	<div class="max-w-4xl mx-auto space-y-6">
		<!-- Sponsor Info -->
		<Card.Root class="mb-6">
			<Card.Content class="py-4">
				<div class="flex items-center gap-4">
					<div class="h-16 w-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
						{#if sponsor?.logoUrl}
							<img
								src={sponsor.logoUrl}
								alt={sponsor.name}
								class="h-full w-full object-contain"
							/>
						{:else}
							<Building2 class="h-8 w-8 text-muted-foreground" />
						{/if}
					</div>
					<div class="flex-1">
						<h1 class="text-xl font-bold">{sponsor?.name || 'Unknown Sponsor'}</h1>
						<div class="flex items-center gap-2 mt-1">
							<Badge variant={getStatusBadgeVariant(data.editionSponsor.status)}>
								{getStatusLabel(data.editionSponsor.status)}
							</Badge>
							{#if pkg}
								<span class="text-sm text-muted-foreground">{pkg.name}</span>
							{/if}
							{#if data.unreadCount > 0}
								<Badge variant="default">{m.sponsoring_messages_detail_unread({ count: data.unreadCount.toString() })}</Badge>
							{/if}
						</div>
						{#if sponsor?.contactEmail}
							<p class="text-sm text-muted-foreground mt-1">
								{sponsor.contactName ? `${sponsor.contactName} - ` : ''}{sponsor.contactEmail}
							</p>
						{/if}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Messages Thread -->
	<Card.Root class="mb-6">
		<Card.Content class="p-0">
			<div
				bind:this={messagesContainer}
				class="h-[400px] overflow-y-auto p-4 space-y-4"
			>
				{#if sortedMessages.length === 0}
					<div class="h-full flex items-center justify-center text-muted-foreground">
						<div class="text-center">
							<MessageSquare class="h-12 w-12 mx-auto mb-2 opacity-50" />
							<p>{m.sponsoring_messages_detail_no_messages()}</p>
							<p class="text-sm">{m.sponsoring_messages_detail_start_conversation()}</p>
						</div>
					</div>
				{:else}
					{#each sortedMessages as message (message.id)}
						{@const fromSponsor = isFromSponsor(message)}
						<div class="flex {fromSponsor ? 'justify-start' : 'justify-end'}">
							<div
								class="max-w-[80%] rounded-lg p-3 {fromSponsor
									? 'bg-muted'
									: 'bg-primary text-primary-foreground'}"
							>
								<div class="flex items-center gap-2 mb-1">
									<span class="font-medium text-sm">{message.senderName}</span>
									{#if isUnread(message) && fromSponsor}
										<Badge variant="secondary" class="text-xs">{m.sponsoring_messages_detail_new()}</Badge>
									{/if}
								</div>
								{#if message.subject}
									<p class="font-semibold mb-1">{message.subject}</p>
								{/if}
								<p class="whitespace-pre-wrap text-sm">{message.content}</p>

								{#if hasAttachments(message)}
									<div class="mt-2 space-y-1">
										{#each message.attachmentUrls as url, i}
											{@const filename = message.attachments[i]}
											{@const FileIcon = getFileIcon(filename)}
											<a
												href={url}
												target="_blank"
												rel="noopener noreferrer"
												class="flex items-center gap-2 text-xs {fromSponsor
													? 'text-primary hover:underline'
													: 'text-primary-foreground/90 hover:text-primary-foreground'}"
											>
												<FileIcon class="h-3 w-3" />
												{filename}
											</a>
										{/each}
									</div>
								{/if}

								<p class="text-xs mt-2 {fromSponsor ? 'text-muted-foreground' : 'text-primary-foreground/70'}">
									{formatMessageDate(message.createdAt)}
								</p>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Mark as Read -->
	{#if data.unreadCount > 0}
		<form
			method="POST"
			action="?/markAsRead"
			use:enhance
			class="mb-4"
		>
			<Button variant="outline" type="submit" size="sm">
				{m.sponsoring_messages_detail_mark_read()}
			</Button>
		</form>
	{/if}

	<!-- Compose Message -->
	<Card.Root>
		<Card.Header>
			<Card.Title>{m.sponsoring_messages_detail_send_title()}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if form?.error}
				<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive mb-4">
					{form.error}
				</div>
			{/if}
			{#if form?.success}
				<div class="rounded-md border border-green-500 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400 mb-4">
					{m.sponsoring_messages_detail_sent_success()}
				</div>
			{/if}

			<form
				method="POST"
				action="?/sendMessage"
				enctype="multipart/form-data"
				use:enhance={() => {
					isSubmitting = true
					return async ({ update, result }) => {
						isSubmitting = false
						if (result.type === 'success') {
							subject = ''
							content = ''
							selectedFiles = []
						}
						await update({ reset: false })
					}
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="subject">{m.sponsoring_messages_detail_subject()}</Label>
					<Input
						id="subject"
						name="subject"
						placeholder={m.sponsoring_messages_detail_subject_placeholder()}
						bind:value={subject}
						maxlength={500}
					/>
				</div>

				<div class="space-y-2">
					<Label for="content">{m.sponsoring_messages_detail_message()}</Label>
					<Textarea
						id="content"
						name="content"
						placeholder={m.sponsoring_messages_detail_message_placeholder()}
						rows={4}
						bind:value={content}
						maxlength={10000}
						required
					/>
					<p class="text-xs text-muted-foreground text-right">
						{content.length}/10000
					</p>
				</div>

				<!-- Selected Files -->
				{#if selectedFiles.length > 0}
					<div class="space-y-2">
						<Label>{m.sponsoring_messages_detail_attachments()} ({selectedFiles.length}/10)</Label>
						<div class="flex flex-wrap gap-2">
							{#each selectedFiles as file, i}
								{@const FileIcon = getFileIcon(file.name)}
								<div class="flex items-center gap-2 bg-muted rounded-md px-2 py-1 text-sm">
									<FileIcon class="h-4 w-4" />
									<span class="max-w-[150px] truncate">{file.name}</span>
									<button
										type="button"
										onclick={() => removeFile(i)}
										class="text-muted-foreground hover:text-destructive"
									>
										<X class="h-4 w-4" />
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Hidden file inputs -->
				<input
					type="file"
					name="attachments"
					accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
					multiple
					class="hidden"
					bind:this={fileInput}
					onchange={handleFileSelect}
				/>

				{#each selectedFiles as _file}
					<input type="hidden" name="attachments" value="" />
				{/each}

				<div class="flex items-center justify-between">
					<Button
						type="button"
						variant="outline"
						onclick={() => fileInput.click()}
						disabled={selectedFiles.length >= 10}
					>
						<Paperclip class="mr-2 h-4 w-4" />
						{m.sponsoring_messages_detail_attach_files()}
					</Button>

					<Button type="submit" disabled={isSubmitting || !content.trim()}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}
							<Send class="mr-2 h-4 w-4" />
						{/if}
						{m.sponsoring_messages_detail_send()}
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
</div>
