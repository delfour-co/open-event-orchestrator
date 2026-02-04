<script lang="ts">
import { cn } from '$lib/utils'
import type { Dialog as DialogPrimitive } from 'bits-ui'

let {
  ref = $bindable(null),
  class: className,
  ...restProps
}: DialogPrimitive.DescriptionProps & { class?: string } = $props()
</script>

<DialogPrimitive.Description
  bind:ref
  class={cn('text-sm text-muted-foreground', className)}
  {...restProps}
/>
