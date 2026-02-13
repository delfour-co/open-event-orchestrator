<script lang="ts">
import * as Card from '$lib/components/ui/card'
import type { BlockType } from '$lib/features/crm/domain/email-editor'
import { BLOCK_TYPE_LABELS } from '$lib/features/crm/domain/email-editor'
import { Columns, Image, Minus, MousePointer2, Type } from 'lucide-svelte'

interface Props {
  onAddBlock?: (type: BlockType) => void
}

const { onAddBlock }: Props = $props()

const blockTypes: { type: BlockType; icon: typeof Type; description: string }[] = [
  { type: 'text', icon: Type, description: 'Add formatted text' },
  { type: 'image', icon: Image, description: 'Add an image' },
  { type: 'button', icon: MousePointer2, description: 'Add a call-to-action button' },
  { type: 'divider', icon: Minus, description: 'Add a horizontal divider' },
  { type: 'columns', icon: Columns, description: 'Add a multi-column layout' }
]

function handleDragStart(e: DragEvent, type: BlockType) {
  e.dataTransfer?.setData('text/plain', type)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
</script>

<Card.Root>
  <Card.Header class="pb-3">
    <Card.Title class="text-sm font-medium">Blocks</Card.Title>
    <Card.Description class="text-xs">Drag and drop to add blocks</Card.Description>
  </Card.Header>
  <Card.Content class="grid grid-cols-2 gap-2">
    {#each blockTypes as { type, icon: Icon, description }}
      <button
        type="button"
        class="block-item"
        draggable="true"
        ondragstart={(e) => handleDragStart(e, type)}
        onclick={() => onAddBlock?.(type)}
        title={description}
      >
        <Icon class="h-5 w-5" />
        <span class="text-xs">{BLOCK_TYPE_LABELS[type]}</span>
      </button>
    {/each}
  </Card.Content>
</Card.Root>

<style>
.block-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  background-color: hsl(var(--background));
  cursor: grab;
  transition: all 0.15s ease;
}

.block-item:hover {
  background-color: hsl(var(--accent));
  border-color: hsl(var(--primary) / 0.3);
}

.block-item:active {
  cursor: grabbing;
}
</style>
