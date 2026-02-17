<script lang="ts">
import type { ColumnsBlock } from '$lib/features/crm/domain/email-editor'
import { getColumnWidths } from '$lib/features/crm/domain/email-editor'
import * as m from '$lib/paraglide/messages'
import BlockRenderer from '../BlockRenderer.svelte'

interface Props {
  block: ColumnsBlock
  selected?: boolean
  selectedBlockId?: string | null
  onSelect?: () => void
  onSelectBlock?: (id: string) => void
  onDropInColumn?: (columnIndex: number, blockType: string, insertIndex?: number) => void
}

const {
  block,
  selected = false,
  selectedBlockId = null,
  onSelect,
  onSelectBlock,
  onDropInColumn
}: Props = $props()

const wrapperStyle = $derived(
  `padding: ${block.padding.top}px ${block.padding.right}px ${block.padding.bottom}px ${block.padding.left}px; ` +
    `background-color: ${block.backgroundColor};`
)

const columnWidths = $derived(getColumnWidths(block.layout))

function handleColumnDrop(columnIndex: number, e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  const blockType = e.dataTransfer?.getData('text/plain')
  if (blockType && onDropInColumn) {
    onDropInColumn(columnIndex, blockType)
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}
</script>

<div
  class="block-wrapper"
  class:selected
  role="button"
  tabindex="0"
  onclick={onSelect}
  onkeydown={(e) => e.key === 'Enter' && onSelect?.()}
>
  <div class="columns-block" style={wrapperStyle}>
    <div class="columns-container" style="gap: {block.gap}px;">
      {#each block.columns as column, colIndex}
        <div
          class="column"
          style="width: {columnWidths[colIndex]}%;"
          ondrop={(e) => handleColumnDrop(colIndex, e)}
          ondragover={handleDragOver}
          role="region"
          aria-label={m.crm_email_editor_column_label({ index: colIndex + 1 })}
        >
          {#if column.blocks.length === 0}
            <div class="empty-column">
              <span>{m.crm_email_editor_drop_blocks_here()}</span>
            </div>
          {:else}
            {#each column.blocks as nestedBlock (nestedBlock.id)}
              <BlockRenderer
                block={nestedBlock}
                selected={selectedBlockId === nestedBlock.id}
                onSelect={() => onSelectBlock?.(nestedBlock.id)}
              />
            {/each}
          {/if}
        </div>
      {/each}
    </div>
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

.columns-container {
  display: flex;
  width: 100%;
}

.column {
  min-height: 60px;
  background-color: hsl(var(--muted) / 0.3);
  border: 1px dashed hsl(var(--border));
  border-radius: 4px;
}

.empty-column {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 60px;
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
}
</style>
