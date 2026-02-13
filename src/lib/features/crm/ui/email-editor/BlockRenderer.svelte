<script lang="ts">
import type {
  ColumnsBlock as ColumnsBlockType,
  EmailBlock
} from '$lib/features/crm/domain/email-editor'
import ButtonBlock from './blocks/ButtonBlock.svelte'
import ColumnsBlock from './blocks/ColumnsBlock.svelte'
import DividerBlock from './blocks/DividerBlock.svelte'
import ImageBlock from './blocks/ImageBlock.svelte'
import TextBlock from './blocks/TextBlock.svelte'

interface Props {
  block: EmailBlock
  selected?: boolean
  selectedBlockId?: string | null
  onSelect?: () => void
  onSelectBlock?: (id: string) => void
  onDropInColumn?: (columnIndex: number, blockType: string) => void
}

const {
  block,
  selected = false,
  selectedBlockId = null,
  onSelect,
  onSelectBlock,
  onDropInColumn
}: Props = $props()
</script>

{#if block.type === 'text'}
  <TextBlock {block} {selected} {onSelect} />
{:else if block.type === 'image'}
  <ImageBlock {block} {selected} {onSelect} />
{:else if block.type === 'button'}
  <ButtonBlock {block} {selected} {onSelect} />
{:else if block.type === 'divider'}
  <DividerBlock {block} {selected} {onSelect} />
{:else if block.type === 'columns'}
  <ColumnsBlock
    block={block as ColumnsBlockType}
    {selected}
    {selectedBlockId}
    {onSelect}
    {onSelectBlock}
    {onDropInColumn}
  />
{/if}
