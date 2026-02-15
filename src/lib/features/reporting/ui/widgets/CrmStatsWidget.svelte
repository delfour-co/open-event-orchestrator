<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
import type {
  CampaignStats,
  ContactStats,
  EngagementStats
} from '$lib/features/crm/services/crm-stats-service'

interface Props {
  contactStats: ContactStats | null
  campaignStats: CampaignStats | null
  engagementStats: EngagementStats | null
  loading?: boolean
  error?: string | null
}

const {
  contactStats,
  campaignStats,
  engagementStats,
  loading = false,
  error = null
}: Props = $props()

const formatGrowthRate = (rate: number): string => {
  const prefix = rate > 0 ? '+' : ''
  return `${prefix}${rate.toFixed(1)}%`
}

const getGrowthColor = (rate: number): string => {
  if (rate > 0) return 'text-green-600'
  if (rate < 0) return 'text-red-600'
  return 'text-gray-500'
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const getEngagementLevelColor = (level: string): 'default' | 'secondary' | 'destructive' => {
  if (level === 'hot') return 'destructive'
  if (level === 'warm') return 'default'
  return 'secondary'
}
</script>

<Card class="h-full">
  <CardHeader class="pb-2">
    <CardTitle class="text-lg">CRM Overview</CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span class="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    {:else if error}
      <div class="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    {:else}
      <!-- Contact Stats Section -->
      {#if contactStats}
        <div>
          <h4 class="mb-3 text-sm font-medium text-muted-foreground">Contacts</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-lg bg-muted/50 p-3">
              <div class="text-2xl font-bold">{contactStats.totalContacts}</div>
              <div class="text-xs text-muted-foreground">Total Contacts</div>
            </div>
            <div class="rounded-lg bg-muted/50 p-3">
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold">{contactStats.newContactsThisPeriod}</span>
                <span class={`text-xs ${getGrowthColor(contactStats.growthRate)}`}>
                  {formatGrowthRate(contactStats.growthRate)}
                </span>
              </div>
              <div class="text-xs text-muted-foreground">New (30 days)</div>
            </div>
          </div>

          {#if contactStats.contactsByRole.length > 0}
            <div class="mt-3 flex flex-wrap gap-2">
              {#each contactStats.contactsByRole.slice(0, 4) as role}
                <Badge variant="outline" class="text-xs">
                  {role.role}: {role.count}
                </Badge>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Campaign Stats Section -->
      {#if campaignStats}
        <div>
          <h4 class="mb-3 text-sm font-medium text-muted-foreground">Campaign Performance</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-lg bg-muted/50 p-3">
              <div class="text-2xl font-bold">{campaignStats.averageOpenRate}%</div>
              <div class="text-xs text-muted-foreground">Avg Open Rate</div>
            </div>
            <div class="rounded-lg bg-muted/50 p-3">
              <div class="text-2xl font-bold">{campaignStats.averageClickRate}%</div>
              <div class="text-xs text-muted-foreground">Avg Click Rate</div>
            </div>
          </div>

          {#if campaignStats.recentCampaigns.length > 0}
            <div class="mt-3 space-y-2">
              <div class="text-xs font-medium text-muted-foreground">Recent Campaigns</div>
              {#each campaignStats.recentCampaigns.slice(0, 3) as campaign}
                <div class="flex items-center justify-between rounded border p-2 text-xs">
                  <div class="truncate font-medium" title={campaign.name}>{campaign.name}</div>
                  <div class="flex items-center gap-2 text-muted-foreground">
                    <span title="Open rate">{campaign.openRate}%</span>
                    <span>/</span>
                    <span title="Click rate">{campaign.clickRate}%</span>
                    <span class="text-xs">{formatDate(campaign.sentAt)}</span>
                  </div>
                </div>
              {/each}
            </div>
          {:else}
            <div class="mt-3 text-sm text-muted-foreground">No campaigns sent yet</div>
          {/if}
        </div>
      {/if}

      <!-- Engagement Stats Section -->
      {#if engagementStats}
        <div>
          <h4 class="mb-3 text-sm font-medium text-muted-foreground">Engagement Score</h4>
          <div class="mb-3 rounded-lg bg-muted/50 p-3">
            <div class="text-2xl font-bold">{engagementStats.averageEngagementScore}</div>
            <div class="text-xs text-muted-foreground">Average Score</div>
          </div>

          {#if engagementStats.engagementDistribution.length > 0}
            <div class="space-y-2">
              {#each engagementStats.engagementDistribution as dist}
                <div class="flex items-center gap-2">
                  <Badge variant={getEngagementLevelColor(dist.level)} class="w-14 justify-center capitalize">
                    {dist.level}
                  </Badge>
                  <div class="flex-1">
                    <div class="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full transition-all"
                        class:bg-red-500={dist.level === 'hot'}
                        class:bg-yellow-500={dist.level === 'warm'}
                        class:bg-blue-500={dist.level === 'cold'}
                        style="width: {dist.percentage}%"
                      ></div>
                    </div>
                  </div>
                  <span class="w-16 text-right text-xs text-muted-foreground">
                    {dist.count} ({dist.percentage}%)
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      {#if !contactStats && !campaignStats && !engagementStats}
        <div class="py-8 text-center text-sm text-muted-foreground">
          No CRM data available
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
