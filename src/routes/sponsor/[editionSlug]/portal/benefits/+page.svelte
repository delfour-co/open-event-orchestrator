<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import * as Card from '$lib/components/ui/card'
import {
  getDeliverableStatusBadgeVariant,
  getDeliverableStatusLabel
} from '$lib/features/sponsoring/domain'
import { AlertTriangle, ArrowLeft, Calendar, Check, CheckCircle2, Clock, Gift } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
</script>

<svelte:head>
	<title>My Benefits - {data.event.name}</title>
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
				Back to Portal
			</a>
			<h1 class="text-3xl font-bold tracking-tight">My Benefits</h1>
			<p class="text-muted-foreground mt-1">
				{data.event.name} {data.edition.year}
			</p>
		</div>

		<!-- Progress Overview -->
		<Card.Root class="mb-6">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					<Gift class="h-5 w-5" />
					Benefit Delivery Progress
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<div class="space-y-4">
					<div class="flex items-center justify-between text-sm">
						<span>{data.stats.delivered} of {data.stats.total} benefits delivered</span>
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
							<p class="text-xs text-muted-foreground">Pending</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-blue-600">{data.stats.inProgress}</p>
							<p class="text-xs text-muted-foreground">In Progress</p>
						</div>
						<div class="text-center">
							<p class="text-2xl font-bold text-green-600">{data.stats.delivered}</p>
							<p class="text-xs text-muted-foreground">Delivered</p>
						</div>
						{#if data.stats.overdue > 0}
							<div class="text-center">
								<p class="text-2xl font-bold text-destructive">{data.stats.overdue}</p>
								<p class="text-xs text-muted-foreground">Overdue</p>
							</div>
						{/if}
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Deliverables List -->
		<div class="space-y-4">
			<h2 class="text-xl font-semibold">All Benefits</h2>

			{#if data.deliverables.length === 0}
				<Card.Root>
					<Card.Content class="flex flex-col items-center justify-center py-12">
						<Gift class="mb-4 h-12 w-12 text-muted-foreground" />
						<h3 class="text-lg font-semibold">No benefits to track yet</h3>
						<p class="text-sm text-muted-foreground text-center max-w-md">
							Your sponsorship benefits will appear here once they are set up by the event team.
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
													Due: {formatDate(deliverable.dueDate)}
												</span>
											{/if}
											{#if deliverable.deliveredAt}
												<span class="flex items-center gap-1 text-green-600">
													<Check class="h-3.5 w-3.5" />
													Delivered: {formatDate(deliverable.deliveredAt)}
												</span>
											{/if}
										</div>
									</div>
									<Badge
										variant={deliverable.isOverdue ? 'destructive' : getDeliverableStatusBadgeVariant(deliverable.status)}
									>
										{deliverable.isOverdue ? 'Overdue' : getDeliverableStatusLabel(deliverable.status)}
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
