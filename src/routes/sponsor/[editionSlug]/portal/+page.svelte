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
import * as m from '$lib/paraglide/messages'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
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
	<title>{m.sponsor_portal_title({ eventName: data.event.name })}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold tracking-tight">{m.sponsor_portal_heading()}</h1>
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
								<p class="font-semibold">{m.sponsor_portal_confirmed()}</p>
								<p class="text-sm text-muted-foreground">
									{m.sponsor_portal_confirmed_thanks({ eventName: data.event.name })}
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
						<Card.Title>{m.sponsor_portal_logo_title()}</Card.Title>
						<Card.Description>
							{m.sponsor_portal_logo_description()}
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
										{m.action_remove()}
									</Button>
								</form>
							</div>
						{:else}
							<div class="flex items-center justify-center h-32 border-2 border-dashed rounded-lg bg-muted/50">
								<p class="text-sm text-muted-foreground">{m.sponsor_portal_no_logo()}</p>
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
								{m.sponsor_portal_upload_logo()}
							</Button>
						</form>

						{#if form?.error && form?.action === 'uploadLogo'}
							<p class="text-sm text-destructive">{form.error}</p>
						{/if}
						{#if form?.success && form?.action === 'uploadLogo'}
							<p class="text-sm text-green-600">{m.sponsor_portal_logo_updated()}</p>
						{/if}
					</Card.Content>
				</Card.Root>

				<!-- Company Profile Form -->
				<Card.Root>
					<Card.Header>
						<Card.Title>{m.sponsor_portal_profile_title()}</Card.Title>
						<Card.Description>
							{m.sponsor_portal_profile_description()}
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
								{m.sponsor_portal_profile_updated()}
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
								<Label for="name">{m.sponsor_portal_company_name()}</Label>
								<Input
									id="name"
									name="name"
									value={data.editionSponsor.sponsor?.name || ''}
								/>
							</div>

							<div class="space-y-2">
								<Label for="website">{m.sponsor_portal_website()}</Label>
								<Input
									id="website"
									name="website"
									type="url"
									placeholder="https://example.com"
									value={data.editionSponsor.sponsor?.website || ''}
								/>
							</div>

							<div class="space-y-2">
								<Label for="description">{m.sponsor_portal_description()}</Label>
								<Textarea
									id="description"
									name="description"
									placeholder={m.sponsor_portal_description_placeholder()}
									rows={3}
									value={data.editionSponsor.sponsor?.description || ''}
								/>
								<p class="text-xs text-muted-foreground">
									{m.sponsor_portal_description_hint()}
								</p>
							</div>

							<div class="border-t pt-4 mt-4">
								<h4 class="font-medium mb-3">{m.sponsor_portal_billing_info()}</h4>
								<div class="space-y-4">
									<div class="space-y-2">
										<Label for="legalName">{m.sponsor_portal_legal_name()}</Label>
										<Input
											id="legalName"
											name="legalName"
											placeholder="Acme Corporation SAS"
											value={data.editionSponsor.sponsor?.legalName || ''}
										/>
									</div>

									<div class="grid gap-4 md:grid-cols-2">
										<div class="space-y-2">
											<Label for="vatNumber">{m.sponsor_portal_vat_number()}</Label>
											<Input
												id="vatNumber"
												name="vatNumber"
												placeholder="FR12345678901"
												value={data.editionSponsor.sponsor?.vatNumber || ''}
											/>
										</div>
										<div class="space-y-2">
											<Label for="siret">{m.sponsor_portal_siret()}</Label>
											<Input
												id="siret"
												name="siret"
												placeholder="123 456 789 00012"
												value={data.editionSponsor.sponsor?.siret || ''}
											/>
										</div>
									</div>

									<div class="space-y-2">
										<Label for="billingAddress">{m.sponsor_portal_address()}</Label>
										<Input
											id="billingAddress"
											name="billingAddress"
											placeholder="123 Main Street"
											value={data.editionSponsor.sponsor?.billingAddress || ''}
										/>
									</div>

									<div class="grid gap-4 md:grid-cols-3">
										<div class="space-y-2">
											<Label for="billingPostalCode">{m.sponsor_portal_postal_code()}</Label>
											<Input
												id="billingPostalCode"
												name="billingPostalCode"
												placeholder="75001"
												value={data.editionSponsor.sponsor?.billingPostalCode || ''}
											/>
										</div>
										<div class="space-y-2">
											<Label for="billingCity">{m.sponsor_portal_city()}</Label>
											<Input
												id="billingCity"
												name="billingCity"
												placeholder="Paris"
												value={data.editionSponsor.sponsor?.billingCity || ''}
											/>
										</div>
										<div class="space-y-2">
											<Label for="billingCountry">{m.sponsor_portal_country()}</Label>
											<Input
												id="billingCountry"
												name="billingCountry"
												placeholder="France"
												value={data.editionSponsor.sponsor?.billingCountry || ''}
											/>
										</div>
									</div>
								</div>
							</div>

							<div class="border-t pt-4 mt-4">
								<h4 class="font-medium mb-3">{m.sponsor_portal_contact_info()}</h4>
								<div class="space-y-4">
									<div class="space-y-2">
										<Label for="contactName">{m.sponsor_portal_contact_name()}</Label>
										<Input
											id="contactName"
											name="contactName"
											value={data.editionSponsor.sponsor?.contactName || ''}
										/>
									</div>

									<div class="grid gap-4 md:grid-cols-2">
										<div class="space-y-2">
											<Label for="contactEmail">{m.sponsor_portal_contact_email()}</Label>
											<Input
												id="contactEmail"
												name="contactEmail"
												type="email"
												value={data.editionSponsor.sponsor?.contactEmail || ''}
											/>
										</div>
										<div class="space-y-2">
											<Label for="contactPhone">{m.sponsor_portal_contact_phone()}</Label>
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
								{m.sponsor_portal_save()}
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
							<Card.Title>{m.sponsor_portal_package_title()}</Card.Title>
							<Card.Description>
								{m.sponsor_portal_package_subtitle({ name: data.editionSponsor.package.name })}
							</Card.Description>
						</Card.Header>
						<Card.Content class="space-y-4">
							{#if data.editionSponsor.amount}
								<div>
									<p class="text-sm text-muted-foreground">{m.sponsor_portal_amount()}</p>
									<p class="text-2xl font-bold">
										{formatPackagePrice(
											data.editionSponsor.amount,
											data.editionSponsor.package.currency
										)}
									</p>
									{#if data.editionSponsor.paidAt}
										<p class="text-sm text-green-600">
											<Check class="h-4 w-4 inline mr-1" />
											{m.sponsor_portal_paid()}
										</p>
									{/if}
								</div>
							{/if}

							{#if data.editionSponsor.status === 'confirmed' && data.editionSponsor.amount && data.editionSponsor.amount > 0}
								<a
									href="/sponsor/{data.edition.slug}/portal/invoice?token={data.token}"
									class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
								>
									<Download class="h-4 w-4" />
									{m.sponsor_portal_download_invoice()}
								</a>
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
									<Card.Title>{m.sponsor_portal_benefits_title()}</Card.Title>
									<a
										href="/sponsor/{data.edition.slug}/portal/benefits?token={data.token}"
										class="text-sm text-primary hover:underline inline-flex items-center gap-1"
									>
										<Gift class="h-4 w-4" />
										{m.sponsor_portal_track_delivery()}
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
								{m.sponsor_portal_documents_title()}
							</Card.Title>
						</div>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground mb-4">
							{m.sponsor_portal_documents_description()}
						</p>
						<a
							href="/sponsor/{data.edition.slug}/portal/assets?token={data.token}"
							class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
						>
							{m.sponsor_portal_manage_documents()}
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
								{m.sponsor_portal_messages_title()}
							</Card.Title>
						</div>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground mb-4">
							{m.sponsor_portal_messages_description()}
						</p>
						<a
							href="/sponsor/{data.edition.slug}/portal/messages?token={data.token}"
							class="inline-flex items-center gap-2 text-sm text-primary hover:underline"
						>
							{m.sponsor_portal_open_messages()}
							<ArrowRight class="h-4 w-4" />
						</a>
					</Card.Content>
				</Card.Root>

				<!-- Help & Support -->
				<Card.Root>
					<Card.Header>
						<Card.Title>{m.sponsor_portal_help_title()}</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground mb-4">
							{m.sponsor_portal_help_description()}
						</p>
						<a
							href="/sponsor/{data.edition.slug}/portal/messages?token={data.token}"
							class="text-sm text-primary hover:underline"
						>
							{m.sponsor_portal_contact_team()}
						</a>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
