<script lang="ts">
import { enhance } from '$app/forms'
import { Badge } from '$lib/components/ui/badge'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import {
  formatPackagePrice,
  getInquiryStatusBadgeVariant,
  getInquiryStatusLabel
} from '$lib/features/sponsoring/domain'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  Loader2,
  Mail,
  MessageSquare,
  Package,
  Phone,
  Trash2,
  User,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state<Record<string, boolean>>({})

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const formatShortDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const canTakeAction = $derived(
  data.inquiry.status === 'pending' || data.inquiry.status === 'contacted'
)
</script>

<svelte:head>
	<title>{data.inquiry.companyName} - Inquiry - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/sponsoring/{data.edition.slug}/inquiries">
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<div class="flex items-center gap-3">
					<h2 class="text-3xl font-bold tracking-tight">{data.inquiry.companyName}</h2>
					<Badge variant={getInquiryStatusBadgeVariant(data.inquiry.status)}>
						{getInquiryStatusLabel(data.inquiry.status)}
					</Badge>
				</div>
				<p class="text-muted-foreground">
					Sponsor inquiry for {data.edition.name}
				</p>
			</div>
		</div>

		{#if canTakeAction}
			<div class="flex items-center gap-2">
				{#if data.inquiry.status === 'pending'}
					<form
						method="POST"
						action="?/markContacted"
						use:enhance={() => {
							isSubmitting.contacted = true
							return async ({ update }) => {
								isSubmitting.contacted = false
								await update()
							}
						}}
					>
						<input type="hidden" name="id" value={data.inquiry.id} />
						<Button variant="outline" type="submit" disabled={isSubmitting.contacted}>
							{#if isSubmitting.contacted}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<Mail class="mr-2 h-4 w-4" />
							{/if}
							Mark Contacted
						</Button>
					</form>
				{/if}

				<form
					method="POST"
					action="?/convert"
					use:enhance={() => {
						isSubmitting.convert = true
						return async ({ update }) => {
							isSubmitting.convert = false
							await update()
						}
					}}
				>
					<input type="hidden" name="id" value={data.inquiry.id} />
					<Button type="submit" disabled={isSubmitting.convert}>
						{#if isSubmitting.convert}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}
							<ArrowRight class="mr-2 h-4 w-4" />
						{/if}
						Convert to Sponsor
					</Button>
				</form>

				<form
					method="POST"
					action="?/reject"
					use:enhance={() => {
						isSubmitting.reject = true
						return async ({ update }) => {
							isSubmitting.reject = false
							await update()
						}
					}}
				>
					<input type="hidden" name="id" value={data.inquiry.id} />
					<Button variant="destructive" type="submit" disabled={isSubmitting.reject}>
						{#if isSubmitting.reject}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{:else}
							<X class="mr-2 h-4 w-4" />
						{/if}
						Reject
					</Button>
				</form>
			</div>
		{/if}
	</div>

	<!-- Sub-navigation -->
	<nav class="flex gap-1 rounded-lg border bg-muted/40 p-1">
		<a
			href="/admin/sponsoring/{data.edition.slug}"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Dashboard
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/packages"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Packages
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/sponsors"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Sponsors
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/inquiries"
			class="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
		>
			Inquiries
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/deliverables"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Deliverables
		</a>
		<a
			href="/admin/sponsoring/{data.edition.slug}/assets"
			class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
		>
			Assets
		</a>
	</nav>

	<div class="grid gap-6 md:grid-cols-3">
		<!-- Main Content -->
		<div class="md:col-span-2 space-y-6">
			<!-- Company & Contact Information -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Building2 class="h-5 w-5" />
						Company Information
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<div class="text-sm font-medium text-muted-foreground">Company Name</div>
							<div class="text-lg font-medium">{data.inquiry.companyName}</div>
						</div>
					</div>

					<div class="border-t"></div>

					<div class="space-y-3">
						<div class="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<User class="h-4 w-4" />
							Contact Person
						</div>
						<div class="grid gap-4 md:grid-cols-2">
							<div>
								<div class="text-sm text-muted-foreground">Name</div>
								<div class="font-medium">{data.inquiry.contactName}</div>
							</div>
							<div>
								<div class="text-sm text-muted-foreground">Email</div>
								<a
									href="mailto:{data.inquiry.contactEmail}"
									class="font-medium text-primary hover:underline flex items-center gap-1"
								>
									<Mail class="h-4 w-4" />
									{data.inquiry.contactEmail}
								</a>
							</div>
							{#if data.inquiry.contactPhone}
								<div>
									<div class="text-sm text-muted-foreground">Phone</div>
									<div class="font-medium flex items-center gap-1">
										<Phone class="h-4 w-4" />
										{data.inquiry.contactPhone}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Message -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<MessageSquare class="h-5 w-5" />
						Message
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="whitespace-pre-wrap text-sm">{data.inquiry.message}</div>
				</Card.Content>
			</Card.Root>

			<!-- History (placeholder for future) -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="flex items-center gap-2">
						<Calendar class="h-5 w-5" />
						History
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<div class="space-y-3">
						<div class="flex items-start gap-3">
							<div class="h-2 w-2 rounded-full bg-primary mt-2"></div>
							<div>
								<div class="text-sm font-medium">Inquiry submitted</div>
								<div class="text-xs text-muted-foreground">
									{formatDate(data.inquiry.createdAt)}
								</div>
							</div>
						</div>
						{#if data.inquiry.status !== 'pending'}
							<div class="flex items-start gap-3">
								<div class="h-2 w-2 rounded-full bg-muted-foreground mt-2"></div>
								<div>
									<div class="text-sm font-medium">
										Status changed to {getInquiryStatusLabel(data.inquiry.status)}
									</div>
									<div class="text-xs text-muted-foreground">
										{formatDate(data.inquiry.updatedAt)}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Sidebar -->
		<div class="space-y-6">
			<!-- Interested Package -->
			{#if data.interestedPackage}
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Package class="h-5 w-5" />
							Interested Package
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<div class="space-y-2">
							<div class="text-lg font-semibold">{data.interestedPackage.name}</div>
							<div class="text-2xl font-bold text-primary">
								{formatPackagePrice(data.interestedPackage.price, data.interestedPackage.currency)}
							</div>
							{#if data.interestedPackage.description}
								<p class="text-sm text-muted-foreground">
									{data.interestedPackage.description}
								</p>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>
			{:else}
				<Card.Root>
					<Card.Header>
						<Card.Title class="flex items-center gap-2">
							<Package class="h-5 w-5" />
							Interested Package
						</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-sm text-muted-foreground">
							No specific package selected
						</p>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Metadata -->
			<Card.Root>
				<Card.Header>
					<Card.Title>Details</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div>
						<div class="text-sm text-muted-foreground">Status</div>
						<Badge variant={getInquiryStatusBadgeVariant(data.inquiry.status)} class="mt-1">
							{getInquiryStatusLabel(data.inquiry.status)}
						</Badge>
					</div>
					<div>
						<div class="text-sm text-muted-foreground">Submitted</div>
						<div class="text-sm font-medium">{formatShortDate(data.inquiry.createdAt)}</div>
					</div>
					<div>
						<div class="text-sm text-muted-foreground">Last Updated</div>
						<div class="text-sm font-medium">{formatShortDate(data.inquiry.updatedAt)}</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Danger Zone -->
			<Card.Root class="border-destructive/50">
				<Card.Header>
					<Card.Title class="text-destructive">Danger Zone</Card.Title>
				</Card.Header>
				<Card.Content>
					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							if (!confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) {
								return () => {}
							}
							isSubmitting.delete = true
							return async ({ update }) => {
								isSubmitting.delete = false
								await update()
							}
						}}
					>
						<input type="hidden" name="id" value={data.inquiry.id} />
						<Button variant="destructive" type="submit" class="w-full" disabled={isSubmitting.delete}>
							{#if isSubmitting.delete}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{:else}
								<Trash2 class="mr-2 h-4 w-4" />
							{/if}
							Delete Inquiry
						</Button>
					</form>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</div>

{#if form?.error}
	<div
		class="fixed bottom-4 right-4 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive shadow-lg"
	>
		{form.error}
	</div>
{/if}
