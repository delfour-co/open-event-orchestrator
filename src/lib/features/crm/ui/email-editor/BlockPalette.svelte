<script lang="ts">
import * as Card from '$lib/components/ui/card'
import type { BlockType } from '$lib/features/crm/domain/email-editor'
import * as m from '$lib/paraglide/messages'
import { Columns, Image, Minus, MousePointer2, Type } from 'lucide-svelte'

interface Props {
  onAddBlock?: (type: BlockType) => void
}

const { onAddBlock }: Props = $props()

const blockTypes = $derived([
  {
    type: 'text' as BlockType,
    icon: Type,
    description: m.crm_email_editor_block_text_desc(),
    label: m.crm_email_editor_block_text()
  },
  {
    type: 'image' as BlockType,
    icon: Image,
    description: m.crm_email_editor_block_image_desc(),
    label: m.crm_email_editor_block_image()
  },
  {
    type: 'button' as BlockType,
    icon: MousePointer2,
    description: m.crm_email_editor_block_button_desc(),
    label: m.crm_email_editor_block_button()
  },
  {
    type: 'divider' as BlockType,
    icon: Minus,
    description: m.crm_email_editor_block_divider_desc(),
    label: m.crm_email_editor_block_divider()
  },
  {
    type: 'columns' as BlockType,
    icon: Columns,
    description: m.crm_email_editor_block_columns_desc(),
    label: m.crm_email_editor_block_columns()
  }
])

function handleDragStart(e: DragEvent, type: BlockType) {
  e.dataTransfer?.setData('text/plain', type)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy'
}
</script>

<Card.Root>
  <Card.Header class="pb-3">
    <Card.Title class="text-sm font-medium">{m.crm_email_editor_blocks()}</Card.Title>
    <Card.Description class="text-xs">{m.crm_email_editor_blocks_hint()}</Card.Description>
  </Card.Header>
  <Card.Content class="grid grid-cols-2 gap-2">
    {#each blockTypes as { type, icon: Icon, description, label }}
      <button
        type="button"
        class="block-item"
        draggable="true"
        ondragstart={(e) => handleDragStart(e, type)}
        onclick={() => onAddBlock?.(type)}
        title={description}
      >
        <Icon class="h-5 w-5" />
        <span class="text-xs">{label}</span>
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
