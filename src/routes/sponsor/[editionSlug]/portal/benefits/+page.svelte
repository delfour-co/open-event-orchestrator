<script lang="ts">
import { formatDate } from '$lib/components/shared'
import { Badge } from '$lib/components/ui/badge'
import * as Card from '$lib/components/ui/card'
import {
  getDeliverableStatusBadgeVariant,
  getDeliverableStatusLabel
} from '$lib/features/sponsoring/domain'
import * as m from '$lib/paraglide/messages'
import { AlertTriangle, ArrowLeft, Calendar, Check, CheckCircle2, Clock, Gift } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()
</script>

<svelte:head>
	<title>{m.sponsor_benefits_title({ eventName: data.event.name })}</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<!-- Header -->
		<div class="mb-8">
			<a
				href="/sponsor/{data.edition.slug}/portal?token={data.token}"
				class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
			>
				<ArrowLeft class="mr-2 h-4 w-4" />
				{m.sponsor_benefits_back()}
			</a>
			<h1 class="text-3xl font-bold tracking-tight">{m.sponsor_benefits_heading()}</h1>
			<p class="text-muted-foreground mt-1">
				{data.event.name} {data.edition.year}
			</p>
		</div>

		<!-- Progress Overview -->
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Gift class="h-5 w-5" />
					{m.sponsor_benefits_progress_title()}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					<div class="flex items-center justify-between text-sm">
						<span>{m.sponsor_benefits_delivered_of({ delivered: String(data.stats.delivered), total: String(data.stats.total) })}</span>
						<span class="font-semibold">{data.stats.completionPercent}%</span>
					</div>
					<div class="h-3 w-full bg-muted rounded-full overflow-hidden">
						<div
							class="h-full bg-primary transition-all"
							style="width: {data.stats.completionPercent}%"
						></div>
					</div>
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
						<div class="text-center">
							<p class="text-2xl font-bold text-muted-foreground">{data.stats.pending}</p>
							<p class="text-xs text-muted-foreground">{m.sponsor_benefits_pending()}</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-blue-600">{data.stats.inProgress}</p>
							<p class="text-xs text-muted-foreground">{m.sponsor_benefits_in_progress()}</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-green-600">{data.stats.delivered}</p>
							<p class="text-xs text-muted-foreground">{m.sponsor_benefits_delivered()}</p>
						</div>
						{#if data.stats.overdue > 0}
							<div class="text-center">
								<p class="text-2xl font-bold text-destructive">{data.stats.overdue}</p>
								<p class="text-xs text-muted-foreground">{m.sponsor_benefits_overdue()}</p>
							</div>
						{/if}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Deliverables List -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">{m.sponsor_benefits_all()}</h2>

			{#if data.deliverables.length === 0}
				<Card.Root>
					<Card.Content class="flex flex-col items-center justify-center py-12">
						<Gift class="mb-4 h-12 w-12 text-muted-foreground" />
						<h3 class="text-lg font-semibold">{m.sponsor_benefits_empty_title()}</h3>
						<p class="text-sm text-muted-foreground text-center max-w-md">
							{m.sponsor_benefits_empty_description()}
						</p>
					</Card.Content>
				</Card.Root>
			{:else}
				<div class="space-y-3">
					{#each data.deliverables as deliverable}
						<Card.Root
							class={deliverable.isOverdue ? 'border-destructive' : deliverable.status === 'delivered' ? 'border-green-500' : ''}
						>
							<Card.Content class="py-4">
								<div class="flex items-start justify-between gap-4">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											{#if deliverable.status === 'delivered'}
												<CheckCircle2 class="h-5 w-5 text-green-600 shrink-0" />
											{:else if deliverable.isOverdue}
												<AlertTriangle class="h-5 w-5 text-destructive shrink-0" />
											{:else if deliverable.status === 'in_progress'}
												<Clock class="h-5 w-5 text-blue-600 shrink-0" />
											{:else}
												<Clock class="h-5 w-5 text-muted-foreground shrink-0" />
											{/if}
											<h3 class="font-medium truncate">{deliverable.benefitName}</h3>
										</div>
										{#if deliverable.description}
											<p class="text-sm text-muted-foreground ml-7">{deliverable.description}</p>
										{/if}
										<div class="flex flex-wrap items-center gap-3 mt-2 ml-7 text-sm text-muted-foreground">
											{#if deliverable.dueDate}
												<span class="flex items-center gap-1">
													<Calendar class="h-3.5 w-3.5" />
													{m.sponsor_benefits_due({ date: formatDate(deliverable.dueDate) })}
												</span>
											{/if}
											{#if deliverable.deliveredAt}
												<span class="flex items-center gap-1 text-green-600">
													<Check class="h-3.5 w-3.5" />
													{m.sponsor_benefits_delivered_at({ date: formatDate(deliverable.deliveredAt) })}
												</span>
											{/if}
										</div>
									</div>
									<Badge
										variant={deliverable.isOverdue ? 'destructive' : getDeliverableStatusBadgeVariant(deliverable.status)}
									>
										{deliverable.isOverdue ? m.sponsor_benefits_overdue() : getDeliverableStatusLabel(deliverable.status)}
									</Badge>
								</div>
								{#if deliverable.notes}
									<div class="mt-3 ml-7 p-3 bg-muted rounded-md">
										<p class="text-sm">{deliverable.notes}</p>
									</div>
								{/if}
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
