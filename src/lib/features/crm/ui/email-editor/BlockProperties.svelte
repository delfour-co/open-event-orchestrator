<script lang="ts">
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Select } from '$lib/components/ui/select'
import { Textarea } from '$lib/components/ui/textarea'
import type {
  ButtonBlock,
  ColumnsBlock,
  DividerBlock,
  EmailBlock,
  ImageBlock,
  TextBlock
} from '$lib/features/crm/domain/email-editor'
import { COLUMN_LAYOUT_LABELS, getColumnCount } from '$lib/features/crm/domain/email-editor'
import type { ColumnLayout } from '$lib/features/crm/domain/email-editor'
import * as m from '$lib/paraglide/messages'
import { Copy, Trash2 } from 'lucide-svelte'

interface Props {
  block: EmailBlock | null
  onUpdate: (updates: Partial<EmailBlock>) => void
  onDelete: () => void
  onDuplicate: () => void
}

const { block, onUpdate, onDelete, onDuplicate }: Props = $props()

function updatePadding(side: 'top' | 'right' | 'bottom' | 'left', value: number) {
  if (!block) return
  onUpdate({
    padding: {
      ...block.padding,
      [side]: value
    }
  })
}

function handleLayoutChange(layout: ColumnLayout) {
  if (block?.type !== 'columns') return

  const newColumnCount = getColumnCount(layout)
  const currentColumnCount = block.columns.length

  let newColumns = [...block.columns]

  if (newColumnCount > currentColumnCount) {
    for (let i = currentColumnCount; i < newColumnCount; i++) {
      newColumns.push({ blocks: [] })
    }
  } else if (newColumnCount < currentColumnCount) {
    newColumns = newColumns.slice(0, newColumnCount)
  }

  onUpdate({ layout, columns: newColumns } as Partial<ColumnsBlock>)
}
</script>

<Card.Root>
  <Card.Header class="pb-3">
    <Card.Title class="text-sm font-medium">
      {#if block}
        {block.type.charAt(0).toUpperCase() + block.type.slice(1)} {m.crm_email_editor_properties()}
      {:else}
        {m.crm_email_editor_properties()}
      {/if}
    </Card.Title>
  </Card.Header>
  <Card.Content>
    {#if !block}
      <p class="text-sm text-muted-foreground">{m.crm_email_editor_select_block()}</p>
    {:else}
      <div class="space-y-4">
        <!-- Common properties -->
        <div class="space-y-2">
          <Label class="text-xs font-medium">{m.crm_email_editor_bg_color()}</Label>
          <div class="flex gap-2">
            <Input
              type="color"
              value={block.backgroundColor === 'transparent' ? '#ffffff' : block.backgroundColor}
              onchange={(e) => onUpdate({ backgroundColor: (e.target as HTMLInputElement).value })}
              class="h-8 w-12 p-1"
            />
            <Input
              type="text"
              value={block.backgroundColor}
              onchange={(e) => onUpdate({ backgroundColor: (e.target as HTMLInputElement).value })}
              placeholder="transparent"
              class="h-8 flex-1 text-xs"
            />
          </div>
        </div>

        <!-- Padding -->
        <div class="space-y-2">
          <Label class="text-xs font-medium">{m.crm_email_editor_padding()}</Label>
          <div class="grid grid-cols-4 gap-2">
            <div>
              <Label class="text-[10px] text-muted-foreground">{m.crm_email_editor_padding_top()}</Label>
              <Input
                type="number"
                value={String(block.padding.top)}
                onchange={(e) => updatePadding('top', Number((e.target as HTMLInputElement).value))}
                min="0"
                max="100"
                class="h-8 text-xs"
              />
            </div>
            <div>
              <Label class="text-[10px] text-muted-foreground">{m.crm_email_editor_padding_right()}</Label>
              <Input
                type="number"
                value={String(block.padding.right)}
                onchange={(e) =>
                  updatePadding('right', Number((e.target as HTMLInputElement).value))}
                min="0"
                max="100"
                class="h-8 text-xs"
              />
            </div>
            <div>
              <Label class="text-[10px] text-muted-foreground">{m.crm_email_editor_padding_bottom()}</Label>
              <Input
                type="number"
                value={String(block.padding.bottom)}
                onchange={(e) =>
                  updatePadding('bottom', Number((e.target as HTMLInputElement).value))}
                min="0"
                max="100"
                class="h-8 text-xs"
              />
            </div>
            <div>
              <Label class="text-[10px] text-muted-foreground">{m.crm_email_editor_padding_left()}</Label>
              <Input
                type="number"
                value={String(block.padding.left)}
                onchange={(e) => updatePadding('left', Number((e.target as HTMLInputElement).value))}
                min="0"
                max="100"
                class="h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <!-- Text block specific -->
        {#if block.type === 'text'}
          {@const textBlock = block as TextBlock}
          <div class="space-y-2">
            <Label class="text-xs font-medium">{m.crm_email_editor_content()}</Label>
            <Textarea
              value={textBlock.content}
              onchange={(e) => onUpdate({ content: (e.target as HTMLTextAreaElement).value })}
              rows={4}
              class="text-xs"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_font_size()}</Label>
              <Input
                type="number"
                value={String(textBlock.fontSize)}
                onchange={(e) =>
                  onUpdate({ fontSize: Number((e.target as HTMLInputElement).value) })}
                min="10"
                max="48"
                class="h-8 text-xs"
              />
            </div>
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_font_weight()}</Label>
              <Select
                value={textBlock.fontWeight}
                onchange={(e) =>
                  onUpdate({ fontWeight: (e.target as HTMLSelectElement).value as 'normal' | 'bold' })}
                class="h-8 text-xs"
              >
                <option value="normal">{m.crm_email_editor_font_weight_normal()}</option>
                <option value="bold">{m.crm_email_editor_font_weight_bold()}</option>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_text_color()}</Label>
              <div class="flex gap-1">
                <Input
                  type="color"
                  value={textBlock.color}
                  onchange={(e) => onUpdate({ color: (e.target as HTMLInputElement).value })}
                  class="h-8 w-10 p-1"
                />
                <Input
                  type="text"
                  value={textBlock.color}
                  onchange={(e) => onUpdate({ color: (e.target as HTMLInputElement).value })}
                  class="h-8 flex-1 text-xs"
                />
              </div>
            </div>
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_alignment()}</Label>
              <Select
                value={textBlock.textAlign}
                onchange={(e) =>
                  onUpdate({ textAlign: (e.target as HTMLSelectElement).value as 'left' | 'center' | 'right' })}
                class="h-8 text-xs"
              >
                <option value="left">{m.crm_email_editor_align_left()}</option>
                <option value="center">{m.crm_email_editor_align_center()}</option>
                <option value="right">{m.crm_email_editor_align_right()}</option>
              </Select>
            </div>
          </div>
        {/if}

        <!-- Image block specific -->
        {#if block.type === 'image'}
          {@const imageBlock = block as ImageBlock}
          <div class="space-y-2">
            <Label class="text-xs font-medium">{m.crm_email_editor_image_url()}</Label>
            <Input
              type="url"
              value={imageBlock.src}
              onchange={(e) => onUpdate({ src: (e.target as HTMLInputElement).value })}
              placeholder="https://..."
              class="h-8 text-xs"
            />
          </div>

          <div class="space-y-2">
            <Label class="text-xs font-medium">{m.crm_email_editor_alt_text()}</Label>
            <Input
              type="text"
              value={imageBlock.alt}
              onchange={(e) => onUpdate({ alt: (e.target as HTMLInputElement).value })}
              placeholder={m.crm_email_editor_alt_placeholder()}
              class="h-8 text-xs"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_width()}</Label>
              <Select
                value={imageBlock.width}
                onchange={(e) =>
                  onUpdate({ width: (e.target as HTMLSelectElement).value as 'auto' | 'full' | '50%' | '75%' })}
                class="h-8 text-xs"
              >
                <option value="full">{m.crm_email_editor_width_full()}</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
                <option value="auto">{m.crm_email_editor_width_auto()}</option>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_alignment()}</Label>
              <Select
                value={imageBlock.align}
                onchange={(e) =>
                  onUpdate({ align: (e.target as HTMLSelectElement).value as 'left' | 'center' | 'right' })}
                class="h-8 text-xs"
              >
                <option value="left">{m.crm_email_editor_align_left()}</option>
                <option value="center">{m.crm_email_editor_align_center()}</option>
                <option value="right">{m.crm_email_editor_align_right()}</option>
              </Select>
            </div>
          </div>

          <div class="space-y-2">
            <Label class="text-xs font-medium">{m.crm_email_editor_link_url()}</Label>
            <Input
              type="url"
              value={imageBlock.linkUrl}
              onchange={(e) => onUpdate({ linkUrl: (e.target as HTMLInputElement).value })}
              placeholder="https://..."
              class="h-8 text-xs"
            />
          </div>
        {/if}

        <!-- Button block specific -->
        {#if block.type === 'button'}
          {@const buttonBlock = block as ButtonBlock}
          <div class="space-y-2">
            <Label class="text-xs font-medium">{m.crm_email_editor_button_text()}</Label>
            <Input
              type="text"
              value={buttonBlock.text}
              onchange={(e) => onUpdate({ text: (e.target as HTMLInputElement).value })}
              class="h-8 text-xs"
            />
          </div>

          <div class="space-y-2">
            <Label class="text-xs font-medium">{m.crm_email_editor_button_link()}</Label>
            <Input
              type="url"
              value={buttonBlock.url}
              onchange={(e) => onUpdate({ url: (e.target as HTMLInputElement).value })}
              placeholder="https://..."
              class="h-8 text-xs"
            />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_button_style()}</Label>
              <Select
                value={buttonBlock.style}
                onchange={(e) =>
                  onUpdate({ style: (e.target as HTMLSelectElement).value as 'filled' | 'outline' | 'ghost' })}
                class="h-8 text-xs"
              >
                <option value="filled">{m.crm_email_editor_button_style_filled()}</option>
                <option value="outline">{m.crm_email_editor_button_style_outline()}</option>
                <option value="ghost">{m.crm_email_editor_button_style_ghost()}</option>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_alignment()}</Label>
              <Select
                value={buttonBlock.align}
                onchange={(e) =>
                  onUpdate({ align: (e.target as HTMLSelectElement).value as 'left' | 'center' | 'right' })}
                class="h-8 text-xs"
              >
                <option value="left">{m.crm_email_editor_align_left()}</option>
                <option value="center">{m.crm_email_editor_align_center()}</option>
                <option value="right">{m.crm_email_editor_align_right()}</option>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_button_color()}</Label>
              <div class="flex gap-1">
                <Input
                  type="color"
                  value={buttonBlock.backgroundColor}
                  onchange={(e) =>
                    onUpdate({ backgroundColor: (e.target as HTMLInputElement).value })}
                  class="h-8 w-10 p-1"
                />
              </div>
            </div>
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_text_color()}</Label>
              <div class="flex gap-1">
                <Input
                  type="color"
                  value={buttonBlock.textColor}
                  onchange={(e) => onUpdate({ textColor: (e.target as HTMLInputElement).value })}
                  class="h-8 w-10 p-1"
                />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_border_radius()}</Label>
              <Input
                type="number"
                value={String(buttonBlock.borderRadius)}
                onchange={(e) =>
                  onUpdate({ borderRadius: Number((e.target as HTMLInputElement).value) })}
                min="0"
                max="50"
                class="h-8 text-xs"
              />
            </div>
            <div class="flex items-end">
              <label class="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={buttonBlock.fullWidth}
                  onchange={(e) =>
                    onUpdate({ fullWidth: (e.target as HTMLInputElement).checked })}
                />
                {m.crm_email_editor_full_width()}
              </label>
            </div>
          </div>
        {/if}

        <!-- Divider block specific -->
        {#if block.type === 'divider'}
          {@const dividerBlock = block as DividerBlock}
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_divider_style()}</Label>
              <Select
                value={dividerBlock.style}
                onchange={(e) =>
                  onUpdate({ style: (e.target as HTMLSelectElement).value as 'solid' | 'dashed' | 'dotted' })}
                class="h-8 text-xs"
              >
                <option value="solid">{m.crm_email_editor_divider_solid()}</option>
                <option value="dashed">{m.crm_email_editor_divider_dashed()}</option>
                <option value="dotted">{m.crm_email_editor_divider_dotted()}</option>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_width()}</Label>
              <Select
                value={dividerBlock.width}
                onchange={(e) =>
                  onUpdate({ width: (e.target as HTMLSelectElement).value as 'full' | '75%' | '50%' | '25%' })}
                class="h-8 text-xs"
              >
                <option value="full">{m.crm_email_editor_width_full()}</option>
                <option value="75%">75%</option>
                <option value="50%">50%</option>
                <option value="25%">25%</option>
              </Select>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_color()}</Label>
              <div class="flex gap-1">
                <Input
                  type="color"
                  value={dividerBlock.color}
                  onchange={(e) => onUpdate({ color: (e.target as HTMLInputElement).value })}
                  class="h-8 w-10 p-1"
                />
              </div>
            </div>
            <div class="space-y-1">
              <Label class="text-xs font-medium">{m.crm_email_editor_thickness()}</Label>
              <Input
                type="number"
                value={String(dividerBlock.thickness)}
                onchange={(e) =>
                  onUpdate({ thickness: Number((e.target as HTMLInputElement).value) })}
                min="1"
                max="10"
                class="h-8 text-xs"
              />
            </div>
          </div>
        {/if}

        <!-- Columns block specific -->
        {#if block.type === 'columns'}
          {@const columnsBlock = block as ColumnsBlock}
          <div class="space-y-2">
            <Label class="text-xs font-medium">{m.crm_email_editor_layout()}</Label>
            <Select
              value={columnsBlock.layout}
              onchange={(e) => handleLayoutChange((e.target as HTMLSelectElement).value as ColumnLayout)}
              class="h-8 text-xs"
            >
              {#each Object.entries(COLUMN_LAYOUT_LABELS) as [value, label]}
                <option {value}>{label}</option>
              {/each}
            </Select>
          </div>

          <div class="space-y-1">
            <Label class="text-xs font-medium">{m.crm_email_editor_column_gap()}</Label>
            <Input
              type="number"
              value={String(columnsBlock.gap)}
              onchange={(e) => onUpdate({ gap: Number((e.target as HTMLInputElement).value) })}
              min="0"
              max="40"
              class="h-8 text-xs"
            />
          </div>
        {/if}

        <!-- Actions -->
        <div class="flex gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onclick={onDuplicate} class="flex-1 gap-1">
            <Copy class="h-3 w-3" />
            {m.crm_email_editor_duplicate()}
          </Button>
          <Button variant="destructive" size="sm" onclick={onDelete} class="flex-1 gap-1">
            <Trash2 class="h-3 w-3" />
            {m.crm_email_editor_delete()}
          </Button>
        </div>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
