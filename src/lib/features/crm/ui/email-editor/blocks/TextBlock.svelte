<script lang="ts">
import type { TextBlock } from '$lib/features/crm/domain/email-editor'

interface Props {
  block: TextBlock
  selected?: boolean
  onSelect?: () => void
}

const { block, selected = false, onSelect }: Props = $props()

const style = $derived(
  `padding: ${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px; ` +
    `background-color: ${block.backgroundColor}; ` +
    `font-size: ${block.fontSize}px; ` +
    `font-weight: ${block.fontWeight}; ` +
    `color: ${block.color}; ` +
    `line-height: ${block.lineHeight}; ` +
    `text-align: ${block.textAlign};`
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
  <div class="text-block" style={style}>
    {@html block.content}
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

.text-block {
  min-height: 20px;
}

.text-block :global(p) {
  margin: 0 0 0.5em 0;
}

.text-block :global(p:last-child) {
  margin-bottom: 0;
}

.text-block :global(a) {
  color: hsl(var(--primary));
}
</style>
