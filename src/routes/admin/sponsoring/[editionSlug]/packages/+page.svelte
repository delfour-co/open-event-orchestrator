<script lang="ts">
import { enhance } from '$app/forms'
import { AdminSubNav } from '$lib/components/shared'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Switch } from '$lib/components/ui/switch'
import { Textarea } from '$lib/components/ui/textarea'
import { getSponsoringNavItems } from '$lib/config'
import { type Benefit, formatPackagePrice, getTierLabel } from '$lib/features/sponsoring/domain'
import * as m from '$lib/paraglide/messages'
import { ArrowLeft, Check, Loader2, Package, Pencil, Plus, Trash2, Users, X } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showPackageForm = $state(false)
let editingPackage = $state<(typeof data.packages)[0] | null>(null)
let isSubmitting = $state(false)
let editingBenefits = $state<Benefit[]>([])
let customBenefitInput = $state('')
let toggleForms: Record<string, HTMLFormElement> = {}

function startEditPackage(pkg: (typeof data.packages)[0]) {
  editingPackage = pkg
  editingBenefits = [...pkg.benefits]
  showPackageForm = true
}

function startNewPackage() {
  editingPackage = null
  editingBenefits = data.defaultBenefits.map((name) => ({ name, included: false }))
  showPackageForm = true
}

function cancelPackageForm() {
  showPackageForm = false
  editingPackage = null
  editingBenefits = []
  customBenefitInput = ''
}

function toggleBenefit(index: number) {
  editingBenefits = editingBenefits.map((b, i) =>
    i === index ? { ...b, included: !b.included } : b
  )
}

function addCustomBenefit() {
  if (customBenefitInput.trim()) {
    editingBenefits = [...editingBenefits, { name: customBenefitInput.trim(), included: true }]
    customBenefitInput = ''
  }
}

function removeBenefit(index: number) {
  editingBenefits = editingBenefits.filter((_, i) => i !== index)
}

// Close forms on successful submission
$effect(() => {
  if (form?.success) {
    if (
      form.action === 'createPackage' ||
      form.action === 'updatePackage' ||
      form.action === 'deletePackage'
    ) {
      cancelPackageForm()
    }
  }
})
</script>

<svelte:head>
	<title>{m.sponsoring_packages_page_title({ name: data.edition.name })}</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/sponsoring/{data.edition.slug}">
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
			</div>
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/sponsoring/{data.edition.slug}" items={getSponsoringNavItems(data.edition.slug)} />

	<!-- Packages Section -->
	<div class="space-y-4">
		<div class="flex items-center justify-between">
			<h3 class="text-xl font-semibold">{m.sponsoring_packages_title()}</h3>
			<Button onclick={startNewPackage}>
				<Plus class="mr-2 h-4 w-4" />
				{m.sponsoring_packages_new()}
			</Button>
		</div>

		{#if data.packages.length === 0}
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center py-12">
					<Package class="mb-4 h-12 w-12 text-muted-foreground" />
					<h3 class="text-lg font-semibold">{m.sponsoring_packages_empty()}</h3>
					<p class="text-sm text-muted-foreground">
						{m.sponsoring_packages_empty_hint()}
					</p>
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each data.packages as pkg}
				<Card.Root class="relative {!pkg.isActive ? 'opacity-60' : ''}">
					<Card.Header>
						<div class="flex items-start justify-between">
							<div>
								<Badge variant="secondary" class="mb-2">
									{getTierLabel(pkg.tier)}
								</Badge>
								<Card.Title class="text-xl">{pkg.name}</Card.Title>
								<Card.Description class="text-2xl font-bold mt-1">
									{formatPackagePrice(pkg.price, pkg.currency)}
								</Card.Description>
							</div>
							<div class="flex flex-col items-end gap-2">
								<form
									method="POST"
									action="?/toggleActive"
									use:enhance={() => {
										return async ({ update }) => {
											await update({ reset: false })
										}
									}}
									bind:this={toggleForms[pkg.id]}
								>
									<input type="hidden" name="id" value={pkg.id} />
									<input type="hidden" name="isActive" value={(!pkg.isActive).toString()} />
								</form>
								<div class="flex items-center gap-2">
									<span class="text-xs text-muted-foreground">{pkg.isActive ? m.sponsoring_packages_active() : m.sponsoring_packages_inactive()}</span>
									<Switch
										checked={pkg.isActive}
										onCheckedChange={() => toggleForms[pkg.id]?.requestSubmit()}
									/>
								</div>
								<div class="flex items-center gap-1 text-sm text-muted-foreground">
									<Users class="h-4 w-4" />
									{pkg.sponsorCount}
									{#if pkg.maxSponsors}
										/ {pkg.maxSponsors}
									{/if}
								</div>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						{#if pkg.description}
							<p class="text-sm text-muted-foreground mb-4">{pkg.description}</p>
						{/if}

						{#if pkg.benefits.length > 0}
							<div class="space-y-2">
								<h4 class="text-sm font-medium">{m.sponsoring_packages_benefits()}</h4>
								<ul class="space-y-1 text-sm">
									{#each pkg.benefits as benefit}
										<li class="flex items-center gap-2">
											{#if benefit.included}
												<Check class="h-4 w-4 text-green-600" />
											{:else}
												<X class="h-4 w-4 text-muted-foreground" />
											{/if}
											<span class={!benefit.included ? 'text-muted-foreground line-through' : ''}>
												{benefit.name}
											</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</Card.Content>
					<Card.Footer class="flex gap-2">
						<Button variant="outline" size="sm" class="flex-1" onclick={() => startEditPackage(pkg)}>
							<Pencil class="mr-2 h-3 w-3" />
							Edit
						</Button>
						{#if pkg.sponsorCount === 0}
							<form method="POST" action="?/deletePackage" use:enhance class="flex-1">
								<input type="hidden" name="id" value={pkg.id} />
								<Button variant="destructive" size="sm" class="w-full" type="submit">
									<Trash2 class="mr-2 h-3 w-3" />
									Delete
								</Button>
							</form>
						{/if}
					</Card.Footer>
				</Card.Root>
			{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Package Form Dialog -->
{#if showPackageForm}
	<Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto" onClose={cancelPackageForm}>
		<Dialog.Header>
			<Dialog.Title>{editingPackage ? m.sponsoring_packages_form_title_edit() : m.sponsoring_packages_form_title_new()}</Dialog.Title>
			<Dialog.Description>
				{editingPackage ? m.sponsoring_packages_form_desc_edit() : m.sponsoring_packages_form_desc_new()}
			</Dialog.Description>
		</Dialog.Header>

		{#if form?.error && (form?.action === 'createPackage' || form?.action === 'updatePackage')}
			<div class="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
				{form.error}
			</div>
		{/if}

		<form
			method="POST"
			action={editingPackage ? '?/updatePackage' : '?/createPackage'}
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					isSubmitting = false
					await update()
				}
			}}
			class="space-y-6"
		>
			{#if editingPackage}
				<input type="hidden" name="id" value={editingPackage.id} />
			{:else}
				<input type="hidden" name="editionId" value={data.edition.id} />
			{/if}
			<input type="hidden" name="benefits" value={JSON.stringify(editingBenefits)} />

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="pkg-name">{m.sponsoring_packages_form_name()} *</Label>
					<Input
						id="pkg-name"
						name="name"
						placeholder={m.sponsoring_packages_form_name_placeholder()}
						required
						value={editingPackage?.name || ''}
					/>
				</div>
				<div class="space-y-2">
					<Label for="pkg-tier">{m.sponsoring_packages_form_tier()} *</Label>
					<select
						id="pkg-tier"
						name="tier"
						required
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						{#each [1, 2, 3, 4, 5] as t}
							<option value={t} selected={editingPackage?.tier === t || (!editingPackage && t === 1)}>
								{getTierLabel(t)}
							</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-3">
				<div class="space-y-2">
					<Label for="pkg-price">{m.sponsoring_packages_form_price()} *</Label>
					<Input
						id="pkg-price"
						name="price"
						type="number"
						step="0.01"
						min="0"
						placeholder="5000"
						required
						value={editingPackage?.price?.toString() || ''}
					/>
				</div>
				<div class="space-y-2">
					<Label for="pkg-currency">{m.sponsoring_packages_form_currency()}</Label>
					<select
						id="pkg-currency"
						name="currency"
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
					>
						<option value="EUR" selected={editingPackage?.currency === 'EUR' || !editingPackage}>EUR</option>
						<option value="USD" selected={editingPackage?.currency === 'USD'}>USD</option>
						<option value="GBP" selected={editingPackage?.currency === 'GBP'}>GBP</option>
					</select>
				</div>
				<div class="space-y-2">
					<Label for="pkg-max">{m.sponsoring_packages_form_max_sponsors()}</Label>
					<Input
						id="pkg-max"
						name="maxSponsors"
						type="number"
						min="0"
						placeholder={m.sponsoring_packages_form_max_placeholder()}
						value={editingPackage?.maxSponsors?.toString() || ''}
					/>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="pkg-description">{m.sponsoring_packages_form_description()}</Label>
				<Textarea
					id="pkg-description"
					name="description"
					placeholder={m.sponsoring_packages_form_description_placeholder()}
					value={editingPackage?.description || ''}
				/>
			</div>

			<!-- Benefits -->
			<div class="space-y-4">
				<Label>{m.sponsoring_packages_form_benefits()}</Label>
				<div class="grid gap-2 md:grid-cols-2">
					{#each editingBenefits as benefit, i}
						<div class="flex items-center gap-2 rounded-md border p-2">
							<button
								type="button"
								class="flex-1 flex items-center gap-2 text-left text-sm"
								onclick={() => toggleBenefit(i)}
							>
								{#if benefit.included}
									<Check class="h-4 w-4 text-green-600 shrink-0" />
								{:else}
									<X class="h-4 w-4 text-muted-foreground shrink-0" />
								{/if}
								<span class={!benefit.included ? 'text-muted-foreground' : ''}>
									{benefit.name}
								</span>
							</button>
							{#if !(data.defaultBenefits as readonly string[]).includes(benefit.name)}
								<Button
									type="button"
									variant="ghost"
									size="icon"
									class="h-6 w-6 shrink-0"
									onclick={() => removeBenefit(i)}
								>
									<Trash2 class="h-3 w-3" />
								</Button>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Add Custom Benefit -->
				<div class="flex gap-2">
					<Input
						placeholder={m.sponsoring_packages_form_add_benefit()}
						bind:value={customBenefitInput}
						onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomBenefit())}
					/>
					<Button type="button" variant="outline" onclick={addCustomBenefit}>
						<Plus class="h-4 w-4" />
					</Button>
				</div>
			</div>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={cancelPackageForm}>{m.action_cancel()}</Button>
				<Button type="submit" disabled={isSubmitting}>
					{#if isSubmitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					{editingPackage ? m.action_update() : m.action_create()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
{/if}

{#if form?.error && form?.action === 'deletePackage'}
	<div
		class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg"
	>
		{form.error}
	</div>
{/if}
