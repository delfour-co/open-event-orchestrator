<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  formatMessageDate,
  hasAttachments,
  isFromOrganizer,
  isUnread,
  sortByCreatedAsc
} from '$lib/features/sponsoring/domain'
import {
  ArrowLeft,
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

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files) {
    const newFiles = Array.from(target.files)
    const totalFiles = selectedFiles.length + newFiles.length
    if (totalFiles > 10) {
      alert('Maximum 10 attachments allowed')
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
	<title>Messages - Sponsor Portal - {data.event.name}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header -->
		<div class="mb-6">
			<a
				href="/sponsor/{data.edition.slug}/portal"
				class="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
			>
				<ArrowLeft class="h-4 w-4" />
				Back to Portal
			</a>
			<div class="flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold tracking-tight flex items-center gap-3">
						<MessageSquare class="h-8 w-8" />
						Messages
					</h1>
					<p class="text-muted-foreground mt-1">
						Communicate with the {data.event.name} team
					</p>
				</div>
				{#if data.unreadCount > 0}
					<Badge variant="default" class="text-sm">
						{data.unreadCount} unread
					</Badge>
				{/if}
			</div>
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
								<p>No messages yet</p>
								<p class="text-sm">Send your first message to the event team</p>
							</div>
						</div>
					{:else}
						{#each sortedMessages as message (message.id)}
							{@const fromOrganizer = isFromOrganizer(message)}
							<div class="flex {fromOrganizer ? 'justify-start' : 'justify-end'}">
								<div
									class="max-w-[80%] rounded-lg p-3 {fromOrganizer
										? 'bg-muted'
										: 'bg-primary text-primary-foreground'}"
								>
									<div class="flex items-center gap-2 mb-1">
										<span class="font-medium text-sm">{message.senderName}</span>
										{#if isUnread(message) && fromOrganizer}
											<Badge variant="secondary" class="text-xs">New</Badge>
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
													class="flex items-center gap-2 text-xs {fromOrganizer
														? 'text-primary hover:underline'
														: 'text-primary-foreground/90 hover:text-primary-foreground'}"
												>
													<FileIcon class="h-3 w-3" />
													{filename}
												</a>
											{/each}
										</div>
									{/if}

									<p class="text-xs mt-2 {fromOrganizer ? 'text-muted-foreground' : 'text-primary-foreground/70'}">
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
				<input type="hidden" name="token" value={data.token} />
				<Button variant="outline" type="submit" size="sm">
					Mark all as read
				</Button>
			</form>
		{/if}

		<!-- Compose Message -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Send a Message</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if form?.error}
					<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive mb-4">
						{form.error}
					</div>
				{/if}
				{#if form?.success}
					<div class="rounded-md border border-green-500 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400 mb-4">
						Message sent successfully!
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
					<input type="hidden" name="token" value={data.token} />

					<div class="space-y-2">
						<Label for="subject">Subject (optional)</Label>
						<Input
							id="subject"
							name="subject"
							placeholder="Message subject..."
							bind:value={subject}
							maxlength={500}
						/>
					</div>

					<div class="space-y-2">
						<Label for="content">Message</Label>
						<Textarea
							id="content"
							name="content"
							placeholder="Type your message..."
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
							<Label>Attachments ({selectedFiles.length}/10)</Label>
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
							Attach Files
						</Button>

						<Button type="submit" disabled={isSubmitting || !content.trim()}>
							{#if isSubmitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<Send class="mr-2 h-4 w-4" />
							{/if}
							Send Message
						</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
