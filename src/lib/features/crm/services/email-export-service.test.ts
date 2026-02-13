import { describe, expect, it } from 'vitest'
import {
  type ColumnsBlock,
  type EmailDocument,
  type TextBlock,
  createDefaultBlock,
  createEmptyDocument
} from '../domain/email-editor'
import { exportToHtml, generatePlainText } from './email-export-service'

describe('email-export-service', () => {
  describe('exportToHtml', () => {
    it('should export an empty document with base structure', () => {
      const document = createEmptyDocument()
      const html = exportToHtml(document)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html lang="en">')
      expect(html).toContain('background-color: #f3f4f6')
      expect(html).toContain('max-width: 600px')
    })

    it('should export a text block correctly', () => {
      const document = createEmptyDocument()
      const textBlock = createDefaultBlock('text') as TextBlock
      textBlock.content = '<p>Hello World</p>'
      textBlock.fontSize = 18
      textBlock.color = '#000000'
      document.blocks = [textBlock]

      const html = exportToHtml(document)

      expect(html).toContain('<p>Hello World</p>')
      expect(html).toContain('font-size: 18px')
      expect(html).toContain('color: #000000')
    })

    it('should export a button block with VML fallback for Outlook', () => {
      const document = createEmptyDocument()
      const buttonBlock = createDefaultBlock('button')
      document.blocks = [buttonBlock]

      const html = exportToHtml(document)

      expect(html).toContain('v:roundrect')
      expect(html).toContain('Click here')
    })

    it('should export a divider block correctly', () => {
      const document = createEmptyDocument()
      const dividerBlock = createDefaultBlock('divider')
      document.blocks = [dividerBlock]

      const html = exportToHtml(document)

      expect(html).toContain('border-top:')
      expect(html).toContain('solid')
    })

    it('should export columns block with responsive styles', () => {
      const document = createEmptyDocument()
      const columnsBlock = createDefaultBlock('columns') as ColumnsBlock
      const textBlock = createDefaultBlock('text') as TextBlock
      textBlock.content = '<p>Column content</p>'
      columnsBlock.columns[0].blocks.push(textBlock)
      document.blocks = [columnsBlock]

      const html = exportToHtml(document)

      expect(html).toContain('mobile-stack')
      expect(html).toContain('Column content')
    })

    it('should include responsive CSS media queries', () => {
      const document = createEmptyDocument()
      const html = exportToHtml(document)

      expect(html).toContain('@media only screen and (max-width: 620px)')
      expect(html).toContain('.email-container')
    })

    it('should use custom global styles', () => {
      const document: EmailDocument = {
        version: 1,
        blocks: [],
        globalStyles: {
          backgroundColor: '#ffffff',
          contentWidth: 700,
          fontFamily: 'Helvetica, sans-serif',
          linkColor: '#0000ff'
        }
      }

      const html = exportToHtml(document)

      expect(html).toContain('background-color: #ffffff')
      expect(html).toContain('max-width: 700px')
      expect(html).toContain('Helvetica, sans-serif')
    })
  })

  describe('generatePlainText', () => {
    it('should strip HTML tags from content', () => {
      const html = '<p>Hello <strong>World</strong></p>'
      const text = generatePlainText(html)

      expect(text).not.toContain('<p>')
      expect(text).not.toContain('<strong>')
      expect(text).toContain('Hello')
      expect(text).toContain('World')
    })

    it('should convert HTML entities', () => {
      const html = '&amp; &lt; &gt; &quot;'
      const text = generatePlainText(html)

      expect(text).toContain('&')
      expect(text).toContain('<')
      expect(text).toContain('>')
      expect(text).toContain('"')
    })

    it('should remove style tags and their content', () => {
      const html = '<style>body { color: red; }</style><p>Content</p>'
      const text = generatePlainText(html)

      expect(text).not.toContain('color: red')
      expect(text).toContain('Content')
    })

    it('should remove script tags and their content', () => {
      const html = '<script>alert("test")</script><p>Content</p>'
      const text = generatePlainText(html)

      expect(text).not.toContain('alert')
      expect(text).toContain('Content')
    })

    it('should normalize whitespace', () => {
      const html = '<p>Hello    World</p>\n\n<p>More   text</p>'
      const text = generatePlainText(html)

      expect(text).toBe('Hello World More text')
    })
  })
})
