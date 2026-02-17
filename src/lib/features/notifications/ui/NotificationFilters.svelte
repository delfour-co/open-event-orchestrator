<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { cn } from '$lib/utils'
import { NOTIFICATION_TYPES, type NotificationType, getNotificationTypeLabel } from '../domain'

type Props = {
  selectedType: NotificationType | 'all'
  selectedStatus: 'all' | 'unread' | 'read'
  onTypeChange: (type: NotificationType | 'all') => void
  onStatusChange: (status: 'all' | 'unread' | 'read') => void
  class?: string
}

const {
  selectedType,
  selectedStatus,
  onTypeChange,
  onStatusChange,
  class: className
}: Props = $props()

const typeOptions = [
  { value: 'all' as const, label: 'All Types' },
  ...NOTIFICATION_TYPES.map((type) => ({
    value: type,
    label: getNotificationTypeLabel(type)
  }))
]

const statusOptions = [
  { value: 'all' as const, label: 'All' },
  { value: 'unread' as const, label: 'Unread' },
  { value: 'read' as const, label: 'Read' }
]
</script>

<div class={cn('flex flex-wrap items-center gap-4', className)}>
  <!-- Status Filter -->
  <div class="flex items-center gap-1 rounded-lg border p-1">
    {#each statusOptions as option}
      <Button
        variant={selectedStatus === option.value ? 'default' : 'ghost'}
        size="sm"
        class="h-7 px-3 text-xs"
        onclick={() => onStatusChange(option.value)}
      >
        {option.label}
      </Button>
    {/each}
  </div>

  <!-- Type Filter -->
  <div class="flex items-center gap-2">
    <span class="text-sm text-muted-foreground">Type:</span>
    <select
      class="h-8 rounded-md border bg-background px-2 text-sm"
      value={selectedType}
      onchange={(e) => onTypeChange(e.currentTarget.value as NotificationType | 'all')}
    >
      {#each typeOptions as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </div>
</div>
