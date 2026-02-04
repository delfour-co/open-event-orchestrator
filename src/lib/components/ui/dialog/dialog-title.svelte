<script lang="ts">
import { cn } from '$lib/utils'
import type { Dialog as DialogPrimitive } from 'bits-ui'

let {
  ref = $bindable(null),
  class: className,
  ...restProps
}: DialogPrimitive.TitleProps & { class?: string } = $props()
</script>

<DialogPrimitive.Title
  bind:ref
  class={cn('text-lg font-semibold leading-none tracking-tight', className)}
  {...restProps}
/>
