<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { ArrowLeft, Calendar, Save, Shield, Tag, Trash2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let newTag = $state('')
let isSubmitting = $state(false)
let showDeleteConfirm = $state(false)

const CONSENT_TYPES = [
  { key: 'marketing_email', label: 'Marketing Emails' },
  { key: 'data_sharing', label: 'Data Sharing' },
  { key: 'analytics', label: 'Analytics' }
]

const getConsentStatus = (type: string): boolean => {
  const consent = data.consents.find((c) => c.type === type)
  return consent?.status === 'granted'
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

const getRoleColor = (role: string) => {
  switch (role) {
    case 'speaker':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'attendee':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'sponsor':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    case 'volunteer':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'organizer':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

const initials =
  `${data.contact.firstName.charAt(0)}${data.contact.lastName.charAt(0)}`.toUpperCase()
</script>

<svelte:head>
	<title>{data.contact.firstName} {data.contact.lastName} - CRM - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/admin/crm">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div class="flex items-center gap-4">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
				{initials}
			</div>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">
					{data.contact.firstName} {data.contact.lastName}
				</h2>
				<div class="flex items-center gap-2">
					<span class="text-muted-foreground">{data.contact.email}</span>
					<span class="rounded-full px-2 py-0.5 text-xs font-medium {getSourceColor(data.contact.source)}">
						{data.contact.source}
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Success / Error messages -->
	{#if form?.success}
		<div class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
			{#if form.action === 'updateContact'}Contact updated successfully.
			{:else if form.action === 'addTag'}Tag added.
			{:else if form.action === 'removeTag'}Tag removed.
			{:else if form.action === 'grantConsent'}Consent granted.
			{:else if form.action === 'withdrawConsent'}Consent withdrawn.
			{:else}Action completed.{/if}
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
			{form.error}
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-3">
		<!-- Left column: Edit form -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Contact Edit Form -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Save class="h-5 w-5" />
						Contact Details
					</Card.Title>
					<Card.Description>Update contact information.</Card.Description>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						action="?/updateContact"
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
								<Label for="firstName">First Name *</Label>
								<Input id="firstName" name="firstName" required value={data.contact.firstName} />
							</div>
							<div class="space-y-2">
								<Label for="lastName">Last Name *</Label>
								<Input id="lastName" name="lastName" required value={data.contact.lastName} />
							</div>
						</div>

						<div class="space-y-2">
							<Label for="email">Email *</Label>
							<Input id="email" name="email" type="email" required value={data.contact.email} />
						</div>

						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="company">Company</Label>
								<Input id="company" name="company" value={data.contact.company} />
							</div>
							<div class="space-y-2">
								<Label for="jobTitle">Job Title</Label>
								<Input id="jobTitle" name="jobTitle" value={data.contact.jobTitle} />
							</div>
						</div>

						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="phone">Phone</Label>
								<Input id="phone" name="phone" value={data.contact.phone} />
							</div>
							<div class="space-y-2">
								<Label for="address">Address</Label>
								<Input id="address" name="address" value={data.contact.address} />
							</div>
						</div>

						<div class="grid gap-4 md:grid-cols-2">
							<div class="space-y-2">
								<Label for="city">City</Label>
								<Input id="city" name="city" value={data.contact.city} />
							</div>
							<div class="space-y-2">
								<Label for="country">Country</Label>
								<Input id="country" name="country" value={data.contact.country} />
							</div>
						</div>

						<div class="grid gap-4 md:grid-cols-3">
							<div class="space-y-2">
								<Label for="twitter">Twitter</Label>
								<Input id="twitter" name="twitter" placeholder="@handle" value={data.contact.twitter} />
							</div>
							<div class="space-y-2">
								<Label for="linkedin">LinkedIn</Label>
								<Input id="linkedin" name="linkedin" placeholder="https://linkedin.com/in/..." value={data.contact.linkedin} />
							</div>
							<div class="space-y-2">
								<Label for="github">GitHub</Label>
								<Input id="github" name="github" placeholder="username" value={data.contact.github} />
							</div>
						</div>

						<div class="space-y-2">
							<Label for="bio">Bio</Label>
							<Textarea id="bio" name="bio" rows={3} value={data.contact.bio} />
						</div>

						<div class="space-y-2">
							<Label for="notes">Notes</Label>
							<Textarea id="notes" name="notes" rows={3} value={data.contact.notes} />
						</div>

						<div class="flex justify-end">
							<Button type="submit" disabled={isSubmitting} class="gap-2">
								<Save class="h-4 w-4" />
								{isSubmitting ? 'Saving...' : 'Save Changes'}
							</Button>
						</div>
					</form>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Right column: Tags, Consents, Edition History, Danger Zone -->
		<div class="space-y-6">
			<!-- Tags -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Tag class="h-5 w-5" />
						Tags
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					<div class="flex flex-wrap gap-2">
						{#each data.contact.tags as tag}
							<form method="POST" action="?/removeTag" use:enhance class="inline">
								<input type="hidden" name="tag" value={tag} />
								<button
									type="submit"
									class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 transition-colors hover:bg-red-100 hover:text-red-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-red-900 dark:hover:text-red-200"
								>
									{tag}
									<span class="ml-0.5">&times;</span>
								</button>
							</form>
						{/each}
						{#if data.contact.tags.length === 0}
							<p class="text-sm text-muted-foreground">No tags yet.</p>
						{/if}
					</div>
					<form method="POST" action="?/addTag" use:enhance class="flex gap-2">
						<Input
							name="tag"
							placeholder="Add a tag..."
							bind:value={newTag}
							class="flex-1"
						/>
						<Button type="submit" size="sm" disabled={!newTag.trim()}>Add</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<!-- GDPR Consents -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Shield class="h-5 w-5" />
						GDPR Consents
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					{#each CONSENT_TYPES as consent}
						{@const isGranted = getConsentStatus(consent.key)}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium">{consent.label}</p>
								<p class="text-xs text-muted-foreground">
									{isGranted ? 'Granted' : 'Not granted'}
								</p>
							</div>
							{#if isGranted}
								<form method="POST" action="?/withdrawConsent" use:enhance>
									<input type="hidden" name="consentType" value={consent.key} />
									<Button type="submit" variant="outline" size="sm" class="text-orange-600">
										Withdraw
									</Button>
								</form>
							{:else}
								<form method="POST" action="?/grantConsent" use:enhance>
									<input type="hidden" name="consentType" value={consent.key} />
									<Button type="submit" variant="outline" size="sm" class="text-green-600">
										Grant
									</Button>
								</form>
							{/if}
						</div>
					{/each}
				</Card.Content>
			</Card.Root>

			<!-- Edition History -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Calendar class="h-5 w-5" />
						Edition History
					</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if data.editionLinks.length === 0}
						<p class="text-sm text-muted-foreground">No edition history.</p>
					{:else}
						<div class="space-y-3">
							{#each data.editionLinks as link}
								<div class="flex items-center justify-between">
									<span class="text-sm font-medium">{link.editionName}</span>
									<div class="flex gap-1">
										{#each link.roles as role}
											<span class="rounded-full px-2 py-0.5 text-xs font-medium {getRoleColor(role)}">
												{role}
											</span>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Danger Zone -->
			<Card.Root class="border-destructive">
				<Card.Header>
					<Card.Title class="flex items-center gap-2 text-destructive">
						<Trash2 class="h-5 w-5" />
						Danger Zone
					</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if showDeleteConfirm}
						<div class="space-y-3">
							<p class="text-sm text-muted-foreground">
								This will permanently delete this contact and all associated data (consents, edition links). This action cannot be undone.
							</p>
							<div class="flex gap-2">
								<form method="POST" action="?/deleteContact" use:enhance>
									<Button type="submit" variant="destructive" size="sm">
										Confirm Delete
									</Button>
								</form>
								<Button variant="outline" size="sm" onclick={() => (showDeleteConfirm = false)}>
									Cancel
								</Button>
							</div>
						</div>
					{:else}
						<Button
							variant="destructive"
							class="w-full gap-2"
							onclick={() => (showDeleteConfirm = true)}
						>
							<Trash2 class="h-4 w-4" />
							Delete Contact
						</Button>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>
