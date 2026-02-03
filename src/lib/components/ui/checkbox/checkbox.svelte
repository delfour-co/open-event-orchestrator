<script lang="ts">
import { cn } from '$lib/utils'
import { Check, Minus } from 'lucide-svelte'
import type { HTMLInputAttributes } from 'svelte/elements'

interface Props extends Omit<HTMLInputAttributes, 'checked'> {
  class?: string
  checked?: boolean | 'indeterminate'
  onCheckedChange?: (checked: boolean) => void
}

let {
  class: className,
  checked = $bindable(false),
  onCheckedChange,
  ...restProps
}: Props = $props()

function handleChange(e: Event) {
  const target = e.target as HTMLInputElement
  checked = target.checked
  onCheckedChange?.(target.checked)
}
</script>

<label class={cn('relative inline-flex cursor-pointer items-center', className)}>
  <input
    type="checkbox"
    checked={checked === true}
    indeterminate={checked === 'indeterminate'}
    onchange={handleChange}
    class="peer sr-only"
    {...restProps}
  />
  <span
    class="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary ring-offset-background peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:bg-primary peer-checked:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground"
    data-state={checked === 'indeterminate' ? 'indeterminate' : checked ? 'checked' : 'unchecked'}
  >
    {#if checked === 'indeterminate'}
      <Minus class="h-3 w-3" />
    {:else if checked}
      <Check class="h-3 w-3" />
    {/if}
  </span>
</label>
