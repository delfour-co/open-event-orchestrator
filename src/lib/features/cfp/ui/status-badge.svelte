<script lang="ts">
import { type TalkStatus, getStatusColor, getStatusLabel } from '$lib/features/cfp/domain'
import { cn } from '$lib/utils'

interface Props {
  status: TalkStatus
  class?: string
}

const { status, class: className }: Props = $props()

const colorClasses: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
}

const color = $derived(getStatusColor(status))
const label = $derived(getStatusLabel(status))
</script>

<span
  class={cn(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    colorClasses[color],
    className
  )}
>
  {label}
</span>
