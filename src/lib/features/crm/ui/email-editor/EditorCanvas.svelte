<script lang="ts">
import type {
  BlockType,
  EmailDocument,
  SimpleBlockType
} from '$lib/features/crm/domain/email-editor'
import {
  createDefaultBlock,
  createSimpleBlock,
  isSimpleBlockType,
  moveBlock
} from '$lib/features/crm/domain/email-editor'
import BlockRenderer from './BlockRenderer.svelte'

interface Props {
  document: EmailDocument
  selectedBlockId: string | null
  onDocumentChange: (document: EmailDocument) => void
  onSelectBlock: (id: string | null) => void
}

const { document, selectedBlockId, onDocumentChange, onSelectBlock }: Props = $props()

let dragOverIndex = $state<number | null>(null)
let isDraggingBlock = $state(false)
let draggedBlockIndex = $state<number | null>(null)

function handleDrop(e: DragEvent, insertIndex: number) {
  e.preventDefault()
  dragOverIndex = null

  const blockType = e.dataTransfer?.getData('text/plain') as BlockType | undefined

  if (blockType && !isDraggingBlock) {
    const newBlock = createDefaultBlock(blockType)
    const newBlocks = [...document.blocks]
    newBlocks.splice(insertIndex, 0, newBlock)

    onDocumentChange({
      ...document,
      blocks: newBlocks
    })

    onSelectBlock(newBlock.id)
  } else if (isDraggingBlock && draggedBlockIndex !== null) {
    const newBlocks = moveBlock(
      document.blocks,
      draggedBlockIndex,
      insertIndex > draggedBlockIndex ? insertIndex - 1 : insertIndex
    )

    onDocumentChange({
      ...document,
      blocks: newBlocks
    })
  }

  isDraggingBlock = false
  draggedBlockIndex = null
}

function handleDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = isDraggingBlock ? 'move' : 'copy'
  dragOverIndex = index
}

function handleDragLeave() {
  dragOverIndex = null
}

function handleBlockDragStart(index: number) {
  isDraggingBlock = true
  draggedBlockIndex = index
}

function handleBlockDragEnd() {
  isDraggingBlock = false
  draggedBlockIndex = null
  dragOverIndex = null
}

function handleDropInColumn(blockId: string, columnIndex: number, blockType: string) {
  const blockIndex = document.blocks.findIndex((b) => b.id === blockId)
  if (blockIndex === -1) return

  const block = document.blocks[blockIndex]
  if (block.type !== 'columns') return

  // Only allow simple blocks (not columns) inside columns
  const parsedType = blockType as BlockType
  if (!isSimpleBlockType(parsedType)) return

  const newBlock = createSimpleBlock(parsedType as SimpleBlockType)
  const newColumns = block.columns.map((col, idx) => {
    if (idx === columnIndex) {
      return { blocks: [...col.blocks, newBlock] }
    }
    return col
  })

  const newBlocks = [...document.blocks]
  newBlocks[blockIndex] = { ...block, columns: newColumns }

  onDocumentChange({
    ...document,
    blocks: newBlocks
  })

  onSelectBlock(newBlock.id)
}

const canvasStyle = $derived(
  `background-color: ${document.globalStyles.backgroundColor}; max-width: ${document.globalStyles.contentWidth}px;`
)
</script>

<div class="canvas-wrapper">
  <div class="canvas" style={canvasStyle}>
    <!-- Drop zone at the top -->
    <div
      class="drop-zone"
      class:active={dragOverIndex === 0}
      ondrop={(e) => handleDrop(e, 0)}
      ondragover={(e) => handleDragOver(e, 0)}
      ondragleave={handleDragLeave}
      role="region"
      aria-label="Drop zone"
    >
      <span class="drop-hint">Drop block here</span>
    </div>

    {#each document.blocks as block, index (block.id)}
      <div
        class="block-container"
        draggable="true"
        ondragstart={() => handleBlockDragStart(index)}
        ondragend={handleBlockDragEnd}
        role="listitem"
      >
        <BlockRenderer
          {block}
          selected={selectedBlockId === block.id}
          selectedBlockId={selectedBlockId}
          onSelect={() => onSelectBlock(block.id)}
          onSelectBlock={onSelectBlock}
          onDropInColumn={(colIndex, blockType) => handleDropInColumn(block.id, colIndex, blockType)}
        />
      </div>

      <!-- Drop zone after each block -->
      <div
        class="drop-zone"
        class:active={dragOverIndex === index + 1}
        ondrop={(e) => handleDrop(e, index + 1)}
        ondragover={(e) => handleDragOver(e, index + 1)}
        ondragleave={handleDragLeave}
        role="region"
        aria-label="Drop zone"
      >
        <span class="drop-hint">Drop block here</span>
      </div>
    {/each}

    {#if document.blocks.length === 0}
      <div class="empty-canvas">
        <p>Drag and drop blocks here to start building your email</p>
      </div>
    {/if}
  </div>
</div>

<style>
.canvas-wrapper {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  background-color: hsl(var(--muted));
  min-height: 100%;
  overflow-y: auto;
}

.canvas {
  width: 100%;
  background-color: #ffffff;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  border-radius: 0.5rem;
}

.block-container {
  cursor: grab;
}

.block-container:active {
  cursor: grabbing;
}

.drop-zone {
  height: 4px;
  margin: 0 1rem;
  transition: all 0.15s ease;
  position: relative;
}

.drop-zone.active {
  height: 48px;
  background-color: hsl(var(--primary) / 0.1);
  border: 2px dashed hsl(var(--primary));
  border-radius: 0.25rem;
  margin: 0.5rem 1rem;
}

.drop-hint {
  display: none;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: hsl(var(--primary));
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.drop-zone.active .drop-hint {
  display: block;
}

.empty-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 2rem;
  text-align: center;
  color: hsl(var(--muted-foreground));
}
</style>
