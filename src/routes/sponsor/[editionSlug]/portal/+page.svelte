<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  formatPackagePrice,
  getIncludedBenefits,
  getStatusBadgeVariant,
  getStatusLabel
} from '$lib/features/sponsoring/domain'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileImage,
  Gift,
  Loader2,
  MessageSquare,
  Trash2,
  Upload,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let logoInput: HTMLInputElement

const includedBenefits = $derived(
  data.editionSponsor.package ? getIncludedBenefits(data.editionSponsor.package.benefits) : []
)

const excludedBenefits = $derived(
  data.editionSponsor.package ? data.editionSponsor.package.benefits.filter((b) => !b.included) : []
)
</script>

<svelte:head>
	<title>Sponsor Portal - {data.event.name}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold tracking-tight">Sponsor Portal</h1>
			<p class="text-muted-foreground mt-1">
				{data.event.name} {data.edition.year}
			</p>
		</div>

		<!-- Status Banner -->
		<Card.Root class="mb-6 {data.editionSponsor.status === 'confirmed' ? 'border-green-500' : ''}">
			<Card.Content class="py-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						{#if data.editionSponsor.status === 'confirmed'}
							<CheckCircle2 class="h-6 w-6 text-green-600" />
							<div>
								<p class="font-semibold">Your sponsorship is confirmed!</p>
								<p class="text-sm text-muted-foreground">
									Thank you for supporting {data.event.name}
								</p>
							</div>
						{:else}
							<Badge variant={getStatusBadgeVariant(data.editionSponsor.status)}>
								{getStatusLabel(data.editionSponsor.status)}
							</Badge>
						{/if}
					</div>
					{#if data.editionSponsor.package}
						<Badge variant="outline" class="text-sm">
							{data.editionSponsor.package.name}
						</Badge>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Left Column: Company Profile -->
			<div class="space-y-6">
				<!-- Logo Upload -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Company Logo</Card.Title>
						<Card.Description>
							Upload your company logo for display on the event website
						</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-4">
						{#if data.editionSponsor.sponsor?.logoUrl}
							<div class="flex items-center gap-4">
								<img
									src={data.editionSponsor.sponsor.logoUrl}
									alt={data.editionSponsor.sponsor?.name}
									class="h-20 w-auto max-w-[200px] object-contain border rounded-lg p-2"
								/>
								<form method="POST" action="?/removeLogo" use:enhance>
									<input type="hidden" name="token" value={data.token} />
									<input type="hidden" name="sponsorId" value={data.editionSponsor.sponsorId} />
									<Button variant="destructive" size="sm" type="submit">
										<Trash2 class="mr-2 h-4 w-4" />
										Remove
									</Button>
								</form>
							</div>
						{:else}
							<div class="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-muted/50">
								<p class="text-sm text-muted-foreground">No logo uploaded</p>
							</div>
						{/if}

						<form
							method="POST"
							action="?/uploadLogo"
							enctype="multipart/form-data"
							use:enhance={() => {
								isSubmitting = true
								return async ({ update }) => {
									isSubmitting = false
									await update({ reset: false })
								}
							}}
						>
							<input type="hidden" name="token" value={data.token} />
							<input type="hidden" name="sponsorId" value={data.editionSponsor.sponsorId} />
							<input
								type="file"
								name="logo"
								accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
								class="hidden"
								bind:this={logoInput}
								onchange={(e) => e.currentTarget.form?.requestSubmit()}
							/>
							<Button
								type="button"
								variant="outline"
								class="w-full"
								onclick={() => logoInput.click()}
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								{:else}
									<Upload class="mr-2 h-4 w-4" />
								{/if}
								Upload New Logo
							</Button>
						</form>

						{#if form?.error && form?.action === 'uploadLogo'}
							<p class="text-sm text-destructive">{form.error}</p>
						{/if}
						{#if form?.success && form?.action === 'uploadLogo'}
							<p class="text-sm text-green-600">Logo updated successfully!</p>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Company Profile Form -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Company Profile</Card.Title>
						<Card.Description>
							Update your company information
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if form?.error && form?.action === 'updateProfile'}
							<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive mb-4">
								{form.error}
							</div>
						{/if}
						{#if form?.success && form?.action === 'updateProfile'}
							<div class="rounded-md border border-green-500 bg-green-50 dark:bg-green-950 p-3 text-sm text-green-700 dark:text-green-400 mb-4">
								Profile updated successfully!
							</div>
						{/if}

						<form
							method="POST"
							action="?/updateProfile"
							use:enhance={() => {
								isSubmitting = true
								return async ({ update }) => {
									isSubmitting = false
									await update({ reset: false })
								}
							}}
							class="space-y-4"
						>
							<input type="hidden" name="token" value={data.token} />
							<input type="hidden" name="sponsorId" value={data.editionSponsor.sponsorId} />

							<div class="space-y-2">
								<Label for="name">Company Name</Label>
								<Input
									id="name"
									name="name"
									value={data.editionSponsor.sponsor?.name || ''}
								/>
							</div>

							<div class="space-y-2">
								<Label for="website">Website</Label>
								<Input
									id="website"
									name="website"
									type="url"
									placeholder="https://example.com"
									value={data.editionSponsor.sponsor?.website || ''}
								/>
							</div>

							<div class="space-y-2">
								<Label for="description">Description</Label>
								<Textarea
									id="description"
									name="description"
									placeholder="Brief description of your company..."
									rows={3}
									value={data.editionSponsor.sponsor?.description || ''}
								/>
								<p class="text-xs text-muted-foreground">
									This may be displayed on the event website
								</p>
							</div>

							<div class="border-t pt-4 mt-4">
								<h4 class="font-medium mb-3">Contact Information</h4>
								<div class="space-y-4">
									<div class="space-y-2">
										<Label for="contactName">Contact Name</Label>
										<Input
											id="contactName"
											name="contactName"
											value={data.editionSponsor.sponsor?.contactName || ''}
										/>
									</div>

									<div class="grid gap-4 md:grid-cols-2">
										<div class="space-y-2">
											<Label for="contactEmail">Contact Email</Label>
											<Input
												id="contactEmail"
												name="contactEmail"
												type="email"
												value={data.editionSponsor.sponsor?.contactEmail || ''}
											/>
										</div>
										<div class="space-y-2">
											<Label for="contactPhone">Contact Phone</Label>
											<Input
												id="contactPhone"
												name="contactPhone"
												type="tel"
												value={data.editionSponsor.sponsor?.contactPhone || ''}
											/>
										</div>
									</div>
								</div>
							</div>

							<Button type="submit" class="w-full" disabled={isSubmitting}>
								{#if isSubmitting}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								{/if}
								Save Changes
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Right Column: Package & Benefits -->
			<div class="space-y-6">
				{#if data.editionSponsor.package}
					<Card.Root>
						<Card.Header>
							<Card.Title>Your Package</Card.Title>
							<Card.Description>
								{data.editionSponsor.package.name} Sponsorship
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							{#if data.editionSponsor.amount}
								<div>
									<p class="text-sm text-muted-foreground">Sponsorship Amount</p>
									<p class="text-2xl font-bold">
										{formatPackagePrice(
											data.editionSponsor.amount,
											data.editionSponsor.package.currency
										)}
									</p>
									{#if data.editionSponsor.paidAt}
										<p class="text-sm text-green-600">
											<Check class="h-4 w-4 inline mr-1" />
											Paid
										</p>
									{/if}
								</div>
							{/if}

							{#if data.editionSponsor.package.description}
								<p class="text-sm text-muted-foreground">
									{data.editionSponsor.package.description}
								</p>
							{/if}
						</Card.Content>
					</Card.Root>

					{#if includedBenefits.length > 0 || excludedBenefits.length > 0}
						<Card.Root>
							<Card.Header>
								<div class="flex items-center justify-between">
									<Card.Title>Your Benefits</Card.Title>
									<a
										href="/sponsor/{data.edition.slug}/portal/benefits?token={data.token}"
										class="text-sm text-primary hover:underline inline-flex items-center gap-1"
									>
										<Gift class="h-4 w-4" />
										Track Delivery
										<ArrowRight class="h-3 w-3" />
									</a>
								</div>
							</Card.Header>
							<Card.Content>
								<ul class="space-y-2">
									{#each includedBenefits as benefit}
										<li class="flex items-center gap-2 text-sm">
											<Check class="h-4 w-4 text-green-600 shrink-0" />
											<span>{benefit.name}</span>
										</li>
									{/each}
									{#each excludedBenefits as benefit}
										<li class="flex items-center gap-2 text-sm text-muted-foreground">
											<X class="h-4 w-4 shrink-0" />
											<span class="line-through">{benefit.name}</span>
										</li>
									{/each}
								</ul>
							</Card.Content>
						</Card.Root>
					{/if}
				{/if}

				<!-- Assets / Documents -->
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<Card.Title class="flex items-center gap-2">
								<FileImage class="h-5 w-5" />
								My Documents
							</Card.Title>
						</div>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground mb-4">
							Upload your logos, visuals, and documents to share with the event organizers.
						</p>
						<a
							href="/sponsor/{data.edition.slug}/portal/assets?token={data.token}"
							class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
						>
							Manage Documents
							<ArrowRight class="h-4 w-4" />
						</a>
					</Card.Content>
				</Card.Root>

				<!-- Messages -->
				<Card.Root>
					<Card.Header>
						<div class="flex items-center justify-between">
							<Card.Title class="flex items-center gap-2">
								<MessageSquare class="h-5 w-5" />
								Messages
							</Card.Title>
						</div>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground mb-4">
							Send messages to the event team and receive updates about your sponsorship.
						</p>
						<a
							href="/sponsor/{data.edition.slug}/portal/messages?token={data.token}"
							class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
						>
							Open Messages
							<ArrowRight class="h-4 w-4" />
						</a>
					</Card.Content>
				</Card.Root>

				<!-- Help & Support -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Need Help?</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground mb-4">
							If you have any questions about your sponsorship or need assistance,
							send us a message through the portal.
						</p>
						<a
							href="/sponsor/{data.edition.slug}/portal/messages?token={data.token}"
							class="text-sm text-primary hover:underline"
						>
							Contact Event Team
						</a>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
