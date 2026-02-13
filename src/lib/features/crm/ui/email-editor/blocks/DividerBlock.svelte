<script lang="ts">
import type { DividerBlock } from '$lib/features/crm/domain/email-editor'

interface Props {
  block: DividerBlock
  selected?: boolean
  onSelect?: () => void
}

const { block, selected = false, onSelect }: Props = $props()

const wrapperStyle = $derived(
  `padding: ${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px; ` +
    `background-color: ${block.backgroundColor};`
)

const dividerStyle = $derived(
  `border-top: ${block.thickness}px ${block.style} ${block.color}; width: ${block.width};margin: 0 auto;`
)
</script>

<div
  class="block-wrapper"
  class:selected
  role="button"
  tabindex="0"
  onclick={onSelect}
  onkeydown={(e) => e.key === 'Enter' && onSelect?.()}
>
  <div class="divider-block" style={wrapperStyle}>
    <hr style={dividerStyle} />
  </div>
</div>

<style>
.block-wrapper {
  position: relative;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s ease;
}

.block-wrapper:hover {
  border-color: hsl(var(--primary) / 0.3);
}

.block-wrapper.selected {
  border-color: hsl(var(--primary));
}

.divider-block hr {
  border: none;
}
</style>
