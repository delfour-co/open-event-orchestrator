<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Textarea } from '$lib/components/ui/textarea'
import * as m from '$lib/paraglide/messages'
import { CheckCircle2, Loader2, Send } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let selectedPackageId = $state('')
</script>

<svelte:head>
	<title>{m.sponsor_contact_title({ eventName: data.eventName })}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	<!-- Header -->
	<header class="border-b bg-background">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<div class="flex items-center gap-4">
				<a href="/" class="text-xl font-bold">OEO</a>
				<span class="text-muted-foreground">/</span>
				<span class="font-medium">{data.eventName} {data.edition.year}</span>
			</div>
		</div>
	</header>

	<!-- Content -->
	<main class="container mx-auto px-4 py-8">
		<div class="mx-auto max-w-2xl space-y-8">
			<div class="text-center">
				<h1 class="text-3xl font-bold tracking-tight">{m.sponsor_contact_heading()}</h1>
				<p class="mt-2 text-muted-foreground">
					{m.sponsor_contact_description({ eventName: data.eventName })}
				</p>
			</div>

			{#if form?.success}
				<Card.Root class="border-green-500">
					<Card.Content class="py-8">
						<div class="flex flex-col items-center gap-4 text-center">
							<CheckCircle2 class="h-12 w-12 text-green-600" />
							<div>
								<h2 class="text-xl font-semibold">{m.sponsor_contact_success_title()}</h2>
								<p class="mt-2 text-muted-foreground">
									{m.sponsor_contact_success_message()}
								</p>
							</div>
							<a href="/sponsor/{data.edition.slug}/contact">
								<Button variant="outline" class="mt-4">
									{m.sponsor_contact_submit_another()}
								</Button>
							</a>
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Header>
						<Card.Title>{m.sponsor_contact_form_title()}</Card.Title>
						<Card.Description>
							{m.sponsor_contact_form_description()}
						</Card.Description>
					</Card.Header>
					<Card.Content>
						{#if form?.error}
							<div
								class="mb-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive"
							>
								{form.error}
							</div>
						{/if}

						<form
							method="POST"
							action="?/submit"
							use:enhance={() => {
								isSubmitting = true
								return async ({ update }) => {
									isSubmitting = false
									await update({ reset: true })
								}
							}}
							class="space-y-6"
						>
							<!-- Honeypot field - hidden from users, visible to bots -->
							<div class="hidden" aria-hidden="true">
								<Label for="website_url">Website URL</Label>
								<Input
									id="website_url"
									name="website_url"
									type="text"
									tabindex={-1}
									autocomplete="off"
								/>
							</div>

							<div class="space-y-4">
								<h3 class="font-medium">{m.sponsor_contact_company_info()}</h3>

								<div class="space-y-2">
									<Label for="companyName">{m.sponsor_contact_company_name()}</Label>
									<Input
										id="companyName"
										name="companyName"
										required
										placeholder="Acme Corporation"
										value={form?.values?.companyName || ''}
									/>
								</div>

								{#if data.packages.length > 0}
									<div class="space-y-2">
										<Label for="interestedPackageId">{m.sponsor_contact_interested_package()}</Label>
										<Select
											id="interestedPackageId"
											name="interestedPackageId"
											bind:value={selectedPackageId}
										>
											<option value="">{m.sponsor_contact_select_package()}</option>
											{#each data.packages as pkg}
												<option value={pkg.id}>{pkg.name}</option>
											{/each}
										</Select>
									</div>
								{/if}
							</div>

							<div class="space-y-4">
								<h3 class="font-medium">{m.sponsor_contact_info()}</h3>

								<div class="space-y-2">
									<Label for="contactName">{m.sponsor_contact_name()}</Label>
									<Input
										id="contactName"
										name="contactName"
										required
										placeholder="John Doe"
										value={form?.values?.contactName || ''}
									/>
								</div>

								<div class="grid gap-4 md:grid-cols-2">
									<div class="space-y-2">
										<Label for="contactEmail">{m.sponsor_contact_email()}</Label>
										<Input
											id="contactEmail"
											name="contactEmail"
											type="email"
											required
											placeholder="john@acme.com"
											value={form?.values?.contactEmail || ''}
										/>
									</div>
									<div class="space-y-2">
										<Label for="contactPhone">{m.sponsor_contact_phone()}</Label>
										<Input
											id="contactPhone"
											name="contactPhone"
											type="tel"
											placeholder="+1 234 567 8900"
											value={form?.values?.contactPhone || ''}
										/>
									</div>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="message">{m.sponsor_contact_message_label()}</Label>
								<Textarea
									id="message"
									name="message"
									required
									rows={5}
									placeholder={m.sponsor_contact_message_placeholder()}
									value={form?.values?.message || ''}
								/>
								<p class="text-xs text-muted-foreground">
									{m.sponsor_contact_message_hint()}
								</p>
							</div>

							<Button
								type="submit"
								class="w-full gap-2"
								size="lg"
								disabled={isSubmitting}
							>
								{#if isSubmitting}
									<Loader2 class="h-4 w-4 animate-spin" />
									{m.sponsor_contact_submitting()}
								{:else}
									<Send class="h-4 w-4" />
									{m.sponsor_contact_submit()}
								{/if}
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t bg-background px-4 py-6">
		<div class="container mx-auto text-center text-sm text-muted-foreground">
			<p>{m.common_powered_by()}</p>
		</div>
	</footer>
</div>
