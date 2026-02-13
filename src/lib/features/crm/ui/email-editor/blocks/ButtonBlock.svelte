<script lang="ts">
import type { ButtonBlock } from '$lib/features/crm/domain/email-editor'

interface Props {
  block: ButtonBlock
  selected?: boolean
  onSelect?: () => void
}

const { block, selected = false, onSelect }: Props = $props()

const wrapperStyle = $derived(
  `padding: ${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px; ` +
    `text-align: ${block.align};`
)

const buttonStyle = $derived(() => {
  let style = `display: inline-block; padding: 12px 24px; border-radius: ${block.borderRadius}px; font-weight: bold; font-size: 14px; text-decoration: none; text-align: center;`

  if (block.fullWidth) {
    style += ' width: 100%; box-sizing: border-box;'
  }

  switch (block.style) {
    case 'filled':
      style += ` background-color: ${block.backgroundColor}; color: ${block.textColor}; border: none;`
      break
    case 'outline':
      style += ` background-color: transparent; color: ${block.backgroundColor}; border: 2px solid ${block.backgroundColor};`
      break
    case 'ghost':
      style += ` background-color: transparent; color: ${block.backgroundColor}; border: none;`
      break
  }

  return style
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
  <div class="button-block" style={wrapperStyle}>
    <span class="email-button" style={buttonStyle()}>
      {block.text}
    </span>
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

.email-button {
  cursor: pointer;
}
</style>
