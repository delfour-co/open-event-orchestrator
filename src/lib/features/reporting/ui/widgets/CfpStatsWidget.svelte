<script lang="ts">
import * as Card from '$lib/components/ui/card'
import type { AcceptanceRateStats, ReviewStats, SubmissionStats } from '$lib/features/cfp/services'
import { cn } from '$lib/utils'
import { CheckCircle, Clock, FileText, Users } from 'lucide-svelte'
import { MetricCard, TrendIndicator } from '../index'

type Props = {
  submissionStats: SubmissionStats | null
  reviewStats: ReviewStats | null
  acceptanceStats: AcceptanceRateStats | null
  loading?: boolean
  error?: string
  class?: string
}

const {
  submissionStats,
  reviewStats,
  acceptanceStats,
  loading = false,
  error,
  class: className
}: Props = $props()

const statusColors: Record<string, string> = {
  draft: 'bg-gray-200 dark:bg-gray-700',
  submitted: 'bg-blue-500',
  under_review: 'bg-purple-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  confirmed: 'bg-emerald-500',
  declined: 'bg-orange-500',
  withdrawn: 'bg-slate-500'
}

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  under_review: 'En review',
  accepted: 'Accepte',
  rejected: 'Refuse',
  confirmed: 'Confirme',
  declined: 'Decline',
  withdrawn: 'Retire'
}

const getStatusPercentage = (count: number, total: number): number => {
  return total > 0 ? Math.round((count / total) * 100) : 0
}
</script>

<div class={cn('grid gap-4', className)}>
  {#if error}
    <Card.Root class="col-span-full">
      <Card.Content class="pt-6">
        <p class="text-center text-destructive">{error}</p>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Metrics Row -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        {loading}
        data={{
          label: 'Total soumissions',
          value: submissionStats?.total ?? 0,
          format: 'number'
        }}
      >
        {#snippet icon()}
          <FileText class="h-4 w-4" />
        {/snippet}
      </MetricCard>

      <MetricCard
        {loading}
        data={{
          label: 'Soumis (hors brouillons)',
          value: submissionStats?.submittedCount ?? 0,
          format: 'number'
        }}
      >
        {#snippet icon()}
          <CheckCircle class="h-4 w-4" />
        {/snippet}
      </MetricCard>

      <MetricCard
        {loading}
        data={{
          label: 'Talks en attente de review',
          value: reviewStats?.pendingReviewTalks ?? 0,
          format: 'number'
        }}
      >
        {#snippet icon()}
          <Clock class="h-4 w-4" />
        {/snippet}
      </MetricCard>

      <MetricCard
        {loading}
        data={{
          label: 'Taux acceptation',
          value: acceptanceStats?.globalRate ?? 0,
          format: 'percentage'
        }}
      >
        {#snippet icon()}
          <Users class="h-4 w-4" />
        {/snippet}
      </MetricCard>
    </div>

    <!-- Status Distribution -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm font-medium">Repartition par statut</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if loading}
          <div class="h-24 animate-pulse rounded bg-muted"></div>
        {:else if submissionStats}
          <div class="space-y-3">
            {#each Object.entries(submissionStats.byStatus).filter(([_, count]) => count > 0) as [status, count]}
              <div class="flex items-center gap-3">
                <div class="w-24 text-sm text-muted-foreground">
                  {statusLabels[status] || status}
                </div>
                <div class="flex-1">
                  <div class="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      class={cn('h-full rounded-full transition-all', statusColors[status])}
                      style="width: {getStatusPercentage(count, submissionStats.total)}%"
                    ></div>
                  </div>
                </div>
                <div class="w-16 text-right text-sm font-medium">
                  {count}
                  <span class="text-muted-foreground">
                    ({getStatusPercentage(count, submissionStats.total)}%)
                  </span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Review Stats -->
    <div class="grid gap-4 md:grid-cols-2">
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-sm font-medium">Statistiques de review</Card.Title>
        </Card.Header>
        <Card.Content>
          {#if loading}
            <div class="space-y-2">
              <div class="h-6 animate-pulse rounded bg-muted"></div>
              <div class="h-6 animate-pulse rounded bg-muted"></div>
              <div class="h-6 animate-pulse rounded bg-muted"></div>
            </div>
          {:else if reviewStats}
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Total reviews</dt>
                <dd class="font-medium">{reviewStats.totalReviews}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Talks avec review</dt>
                <dd class="font-medium">{reviewStats.reviewedTalks}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Moyenne reviews/talk</dt>
                <dd class="font-medium">{reviewStats.averageReviewsPerTalk}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Note moyenne</dt>
                <dd class="font-medium">
                  {reviewStats.averageRating !== null ? `${reviewStats.averageRating}/5` : '-'}
                </dd>
              </div>
            </dl>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Top Categories by Acceptance -->
      <Card.Root>
        <Card.Header>
          <Card.Title class="text-sm font-medium">Taux acceptation par categorie</Card.Title>
        </Card.Header>
        <Card.Content>
          {#if loading}
            <div class="space-y-2">
              <div class="h-6 animate-pulse rounded bg-muted"></div>
              <div class="h-6 animate-pulse rounded bg-muted"></div>
            </div>
          {:else if acceptanceStats && acceptanceStats.byCategory.length > 0}
            <ul class="space-y-2">
              {#each acceptanceStats.byCategory.slice(0, 5) as category}
                <li class="flex items-center justify-between">
                  <span class="text-sm">{category.categoryName}</span>
                  <span class="text-sm font-medium">
                    {category.rate}%
                    <span class="text-muted-foreground">
                      ({category.accepted}/{category.submitted})
                    </span>
                  </span>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="text-center text-sm text-muted-foreground">
              Aucune decision prise pour le moment
            </p>
          {/if}
        </Card.Content>
      </Card.Root>
    </div>
  {/if}
</div>
