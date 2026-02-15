<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
import type {
  ConflictStats,
  PlanningStats
} from '$lib/features/planning/services/planning-stats-service'
import { cn } from '$lib/utils'

type Props = {
  stats: PlanningStats
  class?: string
}

const { stats, class: className }: Props = $props()

const sessionProgress = $derived(
  stats.sessions.total > 0 ? Math.round((stats.sessions.scheduled / stats.sessions.total) * 100) : 0
)

const occupancyColor = (rate: number): string => {
  if (rate >= 80) return 'text-green-600'
  if (rate >= 50) return 'text-yellow-600'
  return 'text-red-600'
}

const conflictBadgeVariant = (
  conflicts: ConflictStats
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (conflicts.blocking > 0) return 'destructive'
  if (conflicts.warnings > 0) return 'secondary'
  return 'default'
}
</script>

<Card class={cn('w-full', className)}>
  <CardHeader>
    <CardTitle class="flex items-center justify-between">
      <span>Planning</span>
      {#if stats.conflicts.canPublish}
        <Badge variant="default">Ready to publish</Badge>
      {:else}
        <Badge variant="destructive">Has conflicts</Badge>
      {/if}
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    <!-- Sessions Summary -->
    <div>
      <h4 class="text-sm font-medium text-muted-foreground mb-2">Sessions</h4>
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <div class="flex justify-between text-sm mb-1">
            <span>Scheduled</span>
            <span class="font-medium">{stats.sessions.scheduled}/{stats.sessions.total}</span>
          </div>
          <div class="h-2 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-primary transition-all"
              style="width: {sessionProgress}%"
            ></div>
          </div>
        </div>
        <div class="text-2xl font-bold">{sessionProgress}%</div>
      </div>
      {#if stats.sessions.unscheduled > 0}
        <p class="text-sm text-muted-foreground mt-2">
          {stats.sessions.unscheduled} session{stats.sessions.unscheduled > 1 ? 's' : ''} to schedule
        </p>
      {/if}
    </div>

    <!-- Session Types -->
    {#if Object.keys(stats.sessions.byType).length > 0}
      <div>
        <h4 class="text-sm font-medium text-muted-foreground mb-2">By Type</h4>
        <div class="flex flex-wrap gap-2">
          {#each Object.entries(stats.sessions.byType) as [type, count]}
            <Badge variant="outline" class="capitalize">
              {type}: {count}
            </Badge>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Room Occupancy -->
    <div>
      <h4 class="text-sm font-medium text-muted-foreground mb-2">Room Occupancy</h4>
      <div class="space-y-2">
        {#each stats.rooms as room (room.roomId)}
          <div class="flex items-center justify-between text-sm">
            <span>{room.roomName}</span>
            <div class="flex items-center gap-2">
              <span class="text-muted-foreground">
                {room.occupiedSlots}/{room.totalSlots} slots
              </span>
              <span class={cn('font-medium', occupancyColor(room.occupancyRate))}>
                {room.occupancyRate}%
              </span>
            </div>
          </div>
        {/each}
      </div>
      <div class="mt-2 pt-2 border-t flex justify-between text-sm">
        <span class="text-muted-foreground">Average occupancy</span>
        <span class={cn('font-medium', occupancyColor(stats.averageOccupancyRate))}>
          {stats.averageOccupancyRate}%
        </span>
      </div>
    </div>

    <!-- Empty Slots Alert -->
    {#if stats.totalEmptySlots > 0}
      <div class="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {stats.totalEmptySlots} empty slot{stats.totalEmptySlots > 1 ? 's' : ''}
            </p>
            <p class="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Some time slots have no sessions assigned
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Conflicts -->
    <div>
      <h4 class="text-sm font-medium text-muted-foreground mb-2">Conflicts</h4>
      {#if stats.conflicts.total === 0}
        <div class="flex items-center gap-2 text-green-600">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-sm">No conflicts detected</span>
        </div>
      {:else}
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm">Total conflicts</span>
            <Badge variant={conflictBadgeVariant(stats.conflicts)}>
              {stats.conflicts.total}
            </Badge>
          </div>
          {#if stats.conflicts.blocking > 0}
            <div class="flex items-center justify-between text-sm">
              <span class="text-red-600">Blocking</span>
              <span class="font-medium text-red-600">{stats.conflicts.blocking}</span>
            </div>
          {/if}
          {#if stats.conflicts.warnings > 0}
            <div class="flex items-center justify-between text-sm">
              <span class="text-yellow-600">Warnings</span>
              <span class="font-medium text-yellow-600">{stats.conflicts.warnings}</span>
            </div>
          {/if}
          <div class="text-xs text-muted-foreground space-y-1 mt-2">
            {#if stats.conflicts.bySpeaker > 0}
              <p>Speaker conflicts: {stats.conflicts.bySpeaker}</p>
            {/if}
            {#if stats.conflicts.byRoom > 0}
              <p>Room conflicts: {stats.conflicts.byRoom}</p>
            {/if}
            {#if stats.conflicts.byTrack > 0}
              <p>Track conflicts: {stats.conflicts.byTrack}</p>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </CardContent>
</Card>
