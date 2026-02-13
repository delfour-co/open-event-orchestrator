/**
 * Email Editor Domain Entity
 *
 * Defines block types, structure, and utilities for the visual email editor.
 */

import { z } from 'zod'

// Block types
export const blockTypeSchema = z.enum(['text', 'image', 'button', 'divider', 'columns'])
export type BlockType = z.infer<typeof blockTypeSchema>

// Text alignment
export const textAlignSchema = z.enum(['left', 'center', 'right'])
export type TextAlign = z.infer<typeof textAlignSchema>

// Button style
export const buttonStyleSchema = z.enum(['filled', 'outline', 'ghost'])
export type ButtonStyle = z.infer<typeof buttonStyleSchema>

// Column layout
export const columnLayoutSchema = z.enum(['50-50', '33-33-33', '25-75', '75-25', '33-67', '67-33'])
export type ColumnLayout = z.infer<typeof columnLayoutSchema>

// Base block schema
const baseBlockSchema = z.object({
  id: z.string(),
  type: blockTypeSchema,
  padding: z
    .object({
      top: z.number().min(0).max(100).default(10),
      right: z.number().min(0).max(100).default(10),
      bottom: z.number().min(0).max(100).default(10),
      left: z.number().min(0).max(100).default(10)
    })
    .default({ top: 10, right: 10, bottom: 10, left: 10 }),
  backgroundColor: z.string().default('transparent')
})

// Text block
export const textBlockSchema = baseBlockSchema.extend({
  type: z.literal('text'),
  content: z.string().default('<p>Enter your text here...</p>'),
  fontSize: z.number().min(10).max(48).default(16),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  color: z.string().default('#333333'),
  lineHeight: z.number().min(1).max(3).default(1.5),
  textAlign: textAlignSchema.default('left')
})
export type TextBlock = z.infer<typeof textBlockSchema>

// Image block
export const imageBlockSchema = baseBlockSchema.extend({
  type: z.literal('image'),
  src: z.string().default(''),
  alt: z.string().default(''),
  width: z.enum(['auto', 'full', '50%', '75%']).default('full'),
  align: textAlignSchema.default('center'),
  linkUrl: z.string().default('')
})
export type ImageBlock = z.infer<typeof imageBlockSchema>

// Button block
export const buttonBlockSchema = baseBlockSchema.extend({
  type: z.literal('button'),
  text: z.string().default('Click here'),
  url: z.string().default('#'),
  style: buttonStyleSchema.default('filled'),
  backgroundColor: z.string().default('#3b82f6'),
  textColor: z.string().default('#ffffff'),
  borderRadius: z.number().min(0).max(50).default(4),
  align: textAlignSchema.default('center'),
  fullWidth: z.boolean().default(false)
})
export type ButtonBlock = z.infer<typeof buttonBlockSchema>

// Divider block
export const dividerBlockSchema = baseBlockSchema.extend({
  type: z.literal('divider'),
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  color: z.string().default('#e5e7eb'),
  thickness: z.number().min(1).max(10).default(1),
  width: z.enum(['full', '75%', '50%', '25%']).default('full')
})
export type DividerBlock = z.infer<typeof dividerBlockSchema>

// Column content (nested blocks)
export const columnContentSchema = z.object({
  blocks: z.array(z.lazy(() => emailBlockSchema)).default([])
})
export type ColumnContent = z.infer<typeof columnContentSchema>

// Columns block
export const columnsBlockSchema = baseBlockSchema.extend({
  type: z.literal('columns'),
  layout: columnLayoutSchema.default('50-50'),
  gap: z.number().min(0).max(40).default(20),
  columns: z.array(columnContentSchema).default([{ blocks: [] }, { blocks: [] }])
})
export type ColumnsBlock = z.infer<typeof columnsBlockSchema>

// Union of all block types
export const emailBlockSchema = z.discriminatedUnion('type', [
  textBlockSchema,
  imageBlockSchema,
  buttonBlockSchema,
  dividerBlockSchema,
  columnsBlockSchema
])
export type EmailBlock = z.infer<typeof emailBlockSchema>

// Email document structure
export const emailDocumentSchema = z.object({
  version: z.literal(1),
  blocks: z.array(emailBlockSchema).default([]),
  globalStyles: z
    .object({
      backgroundColor: z.string().default('#f3f4f6'),
      contentWidth: z.number().min(400).max(800).default(600),
      fontFamily: z.string().default('Arial, sans-serif'),
      linkColor: z.string().default('#3b82f6')
    })
    .default({
      backgroundColor: '#f3f4f6',
      contentWidth: 600,
      fontFamily: 'Arial, sans-serif',
      linkColor: '#3b82f6'
    })
})
export type EmailDocument = z.infer<typeof emailDocumentSchema>

// Block labels for UI
export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  text: 'Text',
  image: 'Image',
  button: 'Button',
  divider: 'Divider',
  columns: 'Columns'
}

// Block icons
export const BLOCK_TYPE_ICONS: Record<BlockType, string> = {
  text: 'type',
  image: 'image',
  button: 'square',
  divider: 'minus',
  columns: 'columns'
}

// Column layout labels
export const COLUMN_LAYOUT_LABELS: Record<ColumnLayout, string> = {
  '50-50': '2 columns (50/50)',
  '33-33-33': '3 columns (33/33/33)',
  '25-75': '2 columns (25/75)',
  '75-25': '2 columns (75/25)',
  '33-67': '2 columns (33/67)',
  '67-33': '2 columns (67/33)'
}

// Get column count from layout
export function getColumnCount(layout: ColumnLayout): number {
  if (layout === '33-33-33') return 3
  return 2
}

// Get column widths as percentages
export function getColumnWidths(layout: ColumnLayout): number[] {
  switch (layout) {
    case '50-50':
      return [50, 50]
    case '33-33-33':
      return [33.33, 33.33, 33.33]
    case '25-75':
      return [25, 75]
    case '75-25':
      return [75, 25]
    case '33-67':
      return [33, 67]
    case '67-33':
      return [67, 33]
    default:
      return [50, 50]
  }
}

/**
 * Generate unique block ID
 */
export function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Create default block by type
 */
export function createDefaultBlock(type: BlockType): EmailBlock {
  const id = generateBlockId()
  const basePadding = { top: 10, right: 10, bottom: 10, left: 10 }

  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        padding: basePadding,
        backgroundColor: 'transparent',
        content: '<p>Enter your text here...</p>',
        fontSize: 16,
        fontWeight: 'normal',
        color: '#333333',
        lineHeight: 1.5,
        textAlign: 'left'
      }
    case 'image':
      return {
        id,
        type: 'image',
        padding: basePadding,
        backgroundColor: 'transparent',
        src: '',
        alt: '',
        width: 'full',
        align: 'center',
        linkUrl: ''
      }
    case 'button':
      return {
        id,
        type: 'button',
        padding: basePadding,
        backgroundColor: 'transparent',
        text: 'Click here',
        url: '#',
        style: 'filled',
        textColor: '#ffffff',
        borderRadius: 4,
        align: 'center',
        fullWidth: false
      }
    case 'divider':
      return {
        id,
        type: 'divider',
        padding: { top: 20, right: 10, bottom: 20, left: 10 },
        backgroundColor: 'transparent',
        style: 'solid',
        color: '#e5e7eb',
        thickness: 1,
        width: 'full'
      }
    case 'columns':
      return {
        id,
        type: 'columns',
        padding: basePadding,
        backgroundColor: 'transparent',
        layout: '50-50',
        gap: 20,
        columns: [{ blocks: [] }, { blocks: [] }]
      }
    default:
      throw new Error(`Unknown block type: ${type}`)
  }
}

/**
 * Create empty email document
 */
export function createEmptyDocument(): EmailDocument {
  return {
    version: 1,
    blocks: [],
    globalStyles: {
      backgroundColor: '#f3f4f6',
      contentWidth: 600,
      fontFamily: 'Arial, sans-serif',
      linkColor: '#3b82f6'
    }
  }
}

/**
 * Clone a block with new ID
 */
export function cloneBlock(block: EmailBlock): EmailBlock {
  const cloned = JSON.parse(JSON.stringify(block)) as EmailBlock
  cloned.id = generateBlockId()

  if (cloned.type === 'columns') {
    cloned.columns = cloned.columns.map((col) => ({
      blocks: col.blocks.map((b) => cloneBlock(b))
    }))
  }

  return cloned
}

/**
 * Move block in array
 */
export function moveBlock(blocks: EmailBlock[], fromIndex: number, toIndex: number): EmailBlock[] {
  const newBlocks = [...blocks]
  const [removed] = newBlocks.splice(fromIndex, 1)
  newBlocks.splice(toIndex, 0, removed)
  return newBlocks
}

/**
 * Find block by ID in document (including nested blocks)
 */
export function findBlockById(
  blocks: EmailBlock[],
  id: string
): { block: EmailBlock; path: string[] } | null {
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.id === id) {
      return { block, path: [String(i)] }
    }

    if (block.type === 'columns') {
      for (let colIndex = 0; colIndex < block.columns.length; colIndex++) {
        const result = findBlockById(block.columns[colIndex].blocks, id)
        if (result) {
          return {
            block: result.block,
            path: [String(i), 'columns', String(colIndex), ...result.path]
          }
        }
      }
    }
  }

  return null
}

/**
 * Delete block by ID from document
 */
export function deleteBlockById(blocks: EmailBlock[], id: string): EmailBlock[] {
  const newBlocks: EmailBlock[] = []

  for (const block of blocks) {
    if (block.id === id) {
      continue
    }

    if (block.type === 'columns') {
      const newColumns = block.columns.map((col) => ({
        blocks: deleteBlockById(col.blocks, id)
      }))
      newBlocks.push({ ...block, columns: newColumns })
    } else {
      newBlocks.push(block)
    }
  }

  return newBlocks
}

/**
 * Update block by ID in document
 */
export function updateBlockById(
  blocks: EmailBlock[],
  id: string,
  updates: Partial<EmailBlock>
): EmailBlock[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return { ...block, ...updates } as EmailBlock
    }

    if (block.type === 'columns') {
      return {
        ...block,
        columns: block.columns.map((col) => ({
          blocks: updateBlockById(col.blocks, id, updates)
        }))
      }
    }

    return block
  })
}
