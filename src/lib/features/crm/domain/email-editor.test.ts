import { describe, expect, it } from 'vitest'
import {
  type ColumnsBlock,
  type EmailBlock,
  cloneBlock,
  createDefaultBlock,
  createEmptyDocument,
  deleteBlockById,
  findBlockById,
  generateBlockId,
  getColumnCount,
  getColumnWidths,
  moveBlock,
  updateBlockById
} from './email-editor'

describe('email-editor domain', () => {
  describe('generateBlockId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateBlockId()
      const id2 = generateBlockId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^block_\d+_[a-z0-9]+$/)
    })
  })

  describe('createDefaultBlock', () => {
    it('should create a text block with default values', () => {
      const block = createDefaultBlock('text')

      expect(block.type).toBe('text')
      expect(block.id).toBeDefined()
      expect(block.padding).toEqual({ top: 10, right: 10, bottom: 10, left: 10 })
      if (block.type === 'text') {
        expect(block.content).toBe('<p>Enter your text here...</p>')
        expect(block.fontSize).toBe(16)
        expect(block.textAlign).toBe('left')
      }
    })

    it('should create an image block with default values', () => {
      const block = createDefaultBlock('image')

      expect(block.type).toBe('image')
      if (block.type === 'image') {
        expect(block.src).toBe('')
        expect(block.width).toBe('full')
        expect(block.align).toBe('center')
      }
    })

    it('should create a button block with default values', () => {
      const block = createDefaultBlock('button')

      expect(block.type).toBe('button')
      if (block.type === 'button') {
        expect(block.text).toBe('Click here')
        expect(block.url).toBe('#')
        expect(block.style).toBe('filled')
      }
    })

    it('should create a divider block with default values', () => {
      const block = createDefaultBlock('divider')

      expect(block.type).toBe('divider')
      if (block.type === 'divider') {
        expect(block.style).toBe('solid')
        expect(block.thickness).toBe(1)
      }
    })

    it('should create a columns block with 2 empty columns', () => {
      const block = createDefaultBlock('columns')

      expect(block.type).toBe('columns')
      if (block.type === 'columns') {
        expect(block.layout).toBe('50-50')
        expect(block.columns).toHaveLength(2)
        expect(block.columns[0].blocks).toHaveLength(0)
        expect(block.columns[1].blocks).toHaveLength(0)
      }
    })
  })

  describe('createEmptyDocument', () => {
    it('should create an empty document with default global styles', () => {
      const doc = createEmptyDocument()

      expect(doc.version).toBe(1)
      expect(doc.blocks).toHaveLength(0)
      expect(doc.globalStyles.backgroundColor).toBe('#f3f4f6')
      expect(doc.globalStyles.contentWidth).toBe(600)
      expect(doc.globalStyles.fontFamily).toBe('Arial, sans-serif')
    })
  })

  describe('cloneBlock', () => {
    it('should create a deep copy with a new ID', () => {
      const original = createDefaultBlock('text')
      const cloned = cloneBlock(original)

      expect(cloned.id).not.toBe(original.id)
      expect(cloned.type).toBe(original.type)
      if (original.type === 'text' && cloned.type === 'text') {
        expect(cloned.content).toBe(original.content)
      }
    })

    it('should clone nested blocks in columns with new IDs', () => {
      const columnsBlock = createDefaultBlock('columns') as ColumnsBlock
      const nestedText = createDefaultBlock('text')
      columnsBlock.columns[0].blocks.push(nestedText)

      const cloned = cloneBlock(columnsBlock) as ColumnsBlock

      expect(cloned.columns[0].blocks[0].id).not.toBe(nestedText.id)
    })
  })

  describe('moveBlock', () => {
    it('should move a block from one position to another', () => {
      const blocks: EmailBlock[] = [
        createDefaultBlock('text'),
        createDefaultBlock('image'),
        createDefaultBlock('button')
      ]
      const originalIds = blocks.map((b) => b.id)

      // Move first block (text) to index 2
      // After splice(0,1): [image, button]
      // After splice(2,0,text): [image, button, text]
      const moved = moveBlock(blocks, 0, 2)

      expect(moved[0].id).toBe(originalIds[1]) // image
      expect(moved[1].id).toBe(originalIds[2]) // button
      expect(moved[2].id).toBe(originalIds[0]) // text
    })

    it('should not mutate the original array', () => {
      const blocks: EmailBlock[] = [createDefaultBlock('text'), createDefaultBlock('image')]
      const originalLength = blocks.length

      moveBlock(blocks, 0, 1)

      expect(blocks.length).toBe(originalLength)
    })
  })

  describe('findBlockById', () => {
    it('should find a block at the root level', () => {
      const block = createDefaultBlock('text')
      const blocks = [block]

      const result = findBlockById(blocks, block.id)

      expect(result).not.toBeNull()
      expect(result?.block.id).toBe(block.id)
      expect(result?.path).toEqual(['0'])
    })

    it('should find a nested block in columns', () => {
      const columnsBlock = createDefaultBlock('columns') as ColumnsBlock
      const nestedText = createDefaultBlock('text')
      columnsBlock.columns[1].blocks.push(nestedText)

      const result = findBlockById([columnsBlock], nestedText.id)

      expect(result).not.toBeNull()
      expect(result?.block.id).toBe(nestedText.id)
      expect(result?.path).toEqual(['0', 'columns', '1', '0'])
    })

    it('should return null for non-existent block', () => {
      const blocks = [createDefaultBlock('text')]

      const result = findBlockById(blocks, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('deleteBlockById', () => {
    it('should delete a block at root level', () => {
      const block1 = createDefaultBlock('text')
      const block2 = createDefaultBlock('image')
      const blocks = [block1, block2]

      const result = deleteBlockById(blocks, block1.id)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(block2.id)
    })

    it('should delete a nested block in columns', () => {
      const columnsBlock = createDefaultBlock('columns') as ColumnsBlock
      const nestedText = createDefaultBlock('text')
      columnsBlock.columns[0].blocks.push(nestedText)

      const result = deleteBlockById([columnsBlock], nestedText.id)

      expect((result[0] as ColumnsBlock).columns[0].blocks).toHaveLength(0)
    })
  })

  describe('updateBlockById', () => {
    it('should update a block at root level', () => {
      const block = createDefaultBlock('text')
      const blocks = [block]

      const result = updateBlockById(blocks, block.id, { backgroundColor: '#ff0000' })

      expect(result[0].backgroundColor).toBe('#ff0000')
    })

    it('should update a nested block in columns', () => {
      const columnsBlock = createDefaultBlock('columns') as ColumnsBlock
      const nestedText = createDefaultBlock('text')
      columnsBlock.columns[0].blocks.push(nestedText)

      const result = updateBlockById([columnsBlock], nestedText.id, { backgroundColor: '#00ff00' })

      expect((result[0] as ColumnsBlock).columns[0].blocks[0].backgroundColor).toBe('#00ff00')
    })
  })

  describe('getColumnCount', () => {
    it('should return 2 for 2-column layouts', () => {
      expect(getColumnCount('50-50')).toBe(2)
      expect(getColumnCount('25-75')).toBe(2)
      expect(getColumnCount('75-25')).toBe(2)
    })

    it('should return 3 for 3-column layout', () => {
      expect(getColumnCount('33-33-33')).toBe(3)
    })
  })

  describe('getColumnWidths', () => {
    it('should return correct widths for 50-50 layout', () => {
      expect(getColumnWidths('50-50')).toEqual([50, 50])
    })

    it('should return correct widths for 33-33-33 layout', () => {
      expect(getColumnWidths('33-33-33')).toEqual([33.33, 33.33, 33.33])
    })

    it('should return correct widths for asymmetric layouts', () => {
      expect(getColumnWidths('25-75')).toEqual([25, 75])
      expect(getColumnWidths('75-25')).toEqual([75, 25])
      expect(getColumnWidths('33-67')).toEqual([33, 67])
      expect(getColumnWidths('67-33')).toEqual([67, 33])
    })
  })
})
