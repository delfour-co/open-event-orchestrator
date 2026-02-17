<script lang="ts">
import type { ImageBlock } from '$lib/features/crm/domain/email-editor'
import * as m from '$lib/paraglide/messages'
import { ImageIcon } from 'lucide-svelte'

interface Props {
  block: ImageBlock
  selected?: boolean
  onSelect?: () => void
}

const { block, selected = false, onSelect }: Props = $props()

const wrapperStyle = $derived(
  `padding: ${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px; ` +
    `background-color: ${block.backgroundColor}; ` +
    `text-align: ${block.align};`
)

const imageWidth = $derived(() => {
  switch (block.width) {
    case 'full':
      return '100%'
    case '75%':
      return '75%'
    case '50%':
      return '50%'
    case 'auto':
      return 'auto'
    default:
      return '100%'
  }
})
</script>

<div
  class="block-wrapper"
  class:selected
  role="button"
  tabindex="0"
  onclick={onSelect}
  onkeydown={(e) => e.key === 'Enter' && onSelect?.()}
>
  <div class="image-block" style={wrapperStyle}>
    {#if block.src}
      <img
        src={block.src}
        alt={block.alt}
        style="width: {imageWidth()}; max-width: 100%; height: auto;"
      />
    {:else}
      <div class="placeholder">
        <ImageIcon class="h-8 w-8 text-muted-foreground" />
        <span>{m.crm_email_editor_click_add_image()}</span>
      </div>
    {/if}
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

.image-block img {
  display: inline-block;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  background-color: hsl(var(--muted));
  border: 2px dashed hsl(var(--border));
  border-radius: 0.5rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
}
</style>
