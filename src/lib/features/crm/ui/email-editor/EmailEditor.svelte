<script lang="ts">
import { Button } from '$lib/components/ui/button'
import type { BlockType, EmailBlock, EmailDocument } from '$lib/features/crm/domain/email-editor'
import {
  cloneBlock,
  createDefaultBlock,
  createEmptyDocument,
  deleteBlockById,
  findBlockById,
  updateBlockById
} from '$lib/features/crm/domain/email-editor'
import { exportToHtml, generatePlainText } from '$lib/features/crm/services/email-export-service'
import { Code, Eye, Pencil, Save } from 'lucide-svelte'
import BlockPalette from './BlockPalette.svelte'
import BlockProperties from './BlockProperties.svelte'
import EditorCanvas from './EditorCanvas.svelte'
import PreviewPanel from './PreviewPanel.svelte'

interface Props {
  initialDocument?: EmailDocument
  onSave?: (document: EmailDocument, html: string, text: string) => void
}

const { initialDocument, onSave }: Props = $props()

let document = $state<EmailDocument>(initialDocument ?? createEmptyDocument())
let selectedBlockId = $state<string | null>(null)
let viewMode = $state<'edit' | 'preview' | 'code'>('edit')

const selectedBlock = $derived(() => {
  if (!selectedBlockId) return null
  const result = findBlockById(document.blocks, selectedBlockId)
  return result?.block ?? null
})

const exportedHtml = $derived(exportToHtml(document))

function handleAddBlock(type: BlockType) {
  const newBlock = createDefaultBlock(type)
  document = {
    ...document,
    blocks: [...document.blocks, newBlock]
  }
  selectedBlockId = newBlock.id
}

function handleDocumentChange(newDocument: EmailDocument) {
  document = newDocument
}

function handleSelectBlock(id: string | null) {
  selectedBlockId = id
}

function handleUpdateBlock(updates: Partial<EmailBlock>) {
  if (!selectedBlockId) return

  document = {
    ...document,
    blocks: updateBlockById(document.blocks, selectedBlockId, updates)
  }
}

function handleDeleteBlock() {
  if (!selectedBlockId) return

  document = {
    ...document,
    blocks: deleteBlockById(document.blocks, selectedBlockId)
  }
  selectedBlockId = null
}

function handleDuplicateBlock() {
  if (!selectedBlockId) return

  const result = findBlockById(document.blocks, selectedBlockId)
  if (!result) return

  const cloned = cloneBlock(result.block)
  const index = document.blocks.findIndex((b) => b.id === selectedBlockId)

  if (index !== -1) {
    const newBlocks = [...document.blocks]
    newBlocks.splice(index + 1, 0, cloned)
    document = {
      ...document,
      blocks: newBlocks
    }
    selectedBlockId = cloned.id
  }
}

function handleSave() {
  const html = exportToHtml(document)
  const text = generatePlainText(html)
  onSave?.(document, html, text)
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const activeEl = globalThis.document?.activeElement
    if (selectedBlockId && activeEl?.tagName !== 'INPUT' && activeEl?.tagName !== 'TEXTAREA') {
      handleDeleteBlock()
    }
  }

  if (e.key === 'Escape') {
    selectedBlockId = null
  }

  if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
    e.preventDefault()
    if (selectedBlockId) {
      handleDuplicateBlock()
    }
  }

  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="email-editor">
  <!-- Toolbar -->
  <div class="toolbar">
    <div class="toolbar-left">
      <span class="toolbar-title">Email Editor</span>
    </div>
    <div class="toolbar-center">
      <div class="view-toggle">
        <Button
          variant={viewMode === 'edit' ? 'default' : 'ghost'}
          size="sm"
          onclick={() => (viewMode = 'edit')}
          class="gap-1"
        >
          <Pencil class="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant={viewMode === 'preview' ? 'default' : 'ghost'}
          size="sm"
          onclick={() => (viewMode = 'preview')}
          class="gap-1"
        >
          <Eye class="h-4 w-4" />
          Preview
        </Button>
        <Button
          variant={viewMode === 'code' ? 'default' : 'ghost'}
          size="sm"
          onclick={() => (viewMode = 'code')}
          class="gap-1"
        >
          <Code class="h-4 w-4" />
          Code
        </Button>
      </div>
    </div>
    <div class="toolbar-right">
      <Button variant="default" size="sm" onclick={handleSave} class="gap-1">
        <Save class="h-4 w-4" />
        Save
      </Button>
    </div>
  </div>

  <!-- Main content -->
  <div class="editor-content">
    {#if viewMode === 'edit'}
      <!-- Left sidebar: Block Palette -->
      <div class="sidebar-left">
        <BlockPalette onAddBlock={handleAddBlock} />
      </div>

      <!-- Center: Canvas -->
      <div class="canvas-area">
        <EditorCanvas
          {document}
          {selectedBlockId}
          onDocumentChange={handleDocumentChange}
          onSelectBlock={handleSelectBlock}
        />
      </div>

      <!-- Right sidebar: Properties -->
      <div class="sidebar-right">
        <BlockProperties
          block={selectedBlock()}
          onUpdate={handleUpdateBlock}
          onDelete={handleDeleteBlock}
          onDuplicate={handleDuplicateBlock}
        />
      </div>
    {:else if viewMode === 'preview'}
      <div class="preview-area">
        <PreviewPanel {document} />
      </div>
    {:else if viewMode === 'code'}
      <div class="code-area">
        <pre class="code-preview"><code>{exportedHtml}</code></pre>
      </div>
    {/if}
  </div>
</div>

<style>
.email-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: hsl(var(--background));
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid hsl(var(--border));
  background-color: hsl(var(--background));
}

.toolbar-left,
.toolbar-right {
  flex: 1;
}

.toolbar-right {
  display: flex;
  justify-content: flex-end;
}

.toolbar-center {
  display: flex;
  justify-content: center;
}

.toolbar-title {
  font-weight: 600;
  font-size: 0.875rem;
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background-color: hsl(var(--muted));
  border-radius: 0.5rem;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-left,
.sidebar-right {
  width: 280px;
  flex-shrink: 0;
  padding: 1rem;
  overflow-y: auto;
  border-right: 1px solid hsl(var(--border));
}

.sidebar-right {
  border-right: none;
  border-left: 1px solid hsl(var(--border));
}

.canvas-area {
  flex: 1;
  overflow: hidden;
}

.preview-area {
  flex: 1;
  padding: 1rem;
  overflow: hidden;
}

.code-area {
  flex: 1;
  padding: 1rem;
  overflow: auto;
}

.code-preview {
  background-color: hsl(var(--muted));
  padding: 1rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
