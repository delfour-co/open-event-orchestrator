import { describe, expect, it } from 'vitest'
import { createEmailTrackingService } from './email-tracking-service'

describe('EmailTrackingService', () => {
  const service = createEmailTrackingService()
  const baseConfig = {
    baseUrl: 'https://app.example.com',
    campaignId: 'camp-123',
    contactId: 'contact-456'
  }

  describe('addTracking', () => {
    it('should add tracking pixel to HTML', () => {
      const html = '<html><body><p>Hello</p></body></html>'
      const result = service.addTracking(html, 'Hello', baseConfig)

      expect(result.html).toContain('/api/tracking/open/')
      expect(result.html).toContain('width="1" height="1"')
      expect(result.html).toContain('</body>')
    })

    it('should add tracking pixel at the end if no body tag', () => {
      const html = '<p>Hello</p>'
      const result = service.addTracking(html, 'Hello', baseConfig)

      expect(result.html).toContain('/api/tracking/open/')
      expect(result.html).toMatch(/<img.*\/>$/)
    })

    it('should not add tracking pixel if disabled', () => {
      const html = '<html><body><p>Hello</p></body></html>'
      const result = service.addTracking(html, 'Hello', {
        ...baseConfig,
        enableOpenTracking: false
      })

      expect(result.html).not.toContain('/api/tracking/open/')
    })

    it('should rewrite links in HTML', () => {
      const html = '<a href="https://example.com">Click here</a>'
      const result = service.addTracking(html, '', baseConfig)

      expect(result.html).toContain('/api/tracking/click/')
      expect(result.html).toContain('url=https%3A%2F%2Fexample.com')
      expect(result.html).toContain('linkId=link-0')
    })

    it('should not rewrite mailto links', () => {
      const html = '<a href="mailto:test@example.com">Email us</a>'
      const result = service.addTracking(html, '', baseConfig)

      expect(result.html).toContain('href="mailto:test@example.com"')
      expect(result.html).not.toContain('/api/tracking/click/')
    })

    it('should not rewrite unsubscribe links', () => {
      const html = '<a href="https://example.com/unsubscribe/123">Unsubscribe</a>'
      const result = service.addTracking(html, '', baseConfig)

      expect(result.html).toContain('href="https://example.com/unsubscribe/123"')
    })

    it('should rewrite links in plain text', () => {
      const text = 'Visit https://example.com for more info'
      const result = service.addTracking('', text, baseConfig)

      expect(result.text).toContain('/api/tracking/click/')
      expect(result.text).toContain('url=https%3A%2F%2Fexample.com')
    })

    it('should not rewrite links if click tracking disabled', () => {
      const html = '<a href="https://example.com">Click</a>'
      const result = service.addTracking(html, '', {
        ...baseConfig,
        enableClickTracking: false
      })

      expect(result.html).toContain('href="https://example.com"')
      expect(result.html).not.toContain('/api/tracking/click/')
    })

    it('should return a tracking ID', () => {
      const result = service.addTracking('<p>Hi</p>', 'Hi', baseConfig)

      expect(result.trackingId).toBeDefined()
      expect(result.trackingId.length).toBeGreaterThan(0)
    })
  })

  describe('rewriteLinksInHtml', () => {
    it('should rewrite multiple links with unique IDs', () => {
      const html = `
        <a href="https://a.com">Link A</a>
        <a href="https://b.com">Link B</a>
      `
      const result = service.rewriteLinksInHtml(html, 'track-id', 'https://app.example.com')

      expect(result).toContain('linkId=link-0')
      expect(result).toContain('linkId=link-1')
    })

    it('should preserve other anchor attributes', () => {
      const html = '<a class="btn" href="https://example.com" target="_blank">Click</a>'
      const result = service.rewriteLinksInHtml(html, 'track-id', 'https://app.example.com')

      expect(result).toContain('class="btn"')
      expect(result).toContain('target="_blank"')
    })

    it('should skip tel: links', () => {
      const html = '<a href="tel:+1234567890">Call us</a>'
      const result = service.rewriteLinksInHtml(html, 'track-id', 'https://app.example.com')

      expect(result).toContain('href="tel:+1234567890"')
    })

    it('should skip anchor links', () => {
      const html = '<a href="#section">Jump to section</a>'
      const result = service.rewriteLinksInHtml(html, 'track-id', 'https://app.example.com')

      expect(result).toContain('href="#section"')
    })
  })

  describe('rewriteLinksInText', () => {
    it('should rewrite URLs in plain text', () => {
      const text = 'Check out https://example.com and http://test.org'
      const result = service.rewriteLinksInText(text, 'track-id', 'https://app.example.com')

      expect(result).toContain('/api/tracking/click/track-id')
      expect(result).toContain('linkId=text-link-0')
      expect(result).toContain('linkId=text-link-1')
    })

    it('should not rewrite unsubscribe URLs', () => {
      const text = 'Unsubscribe: https://example.com/unsubscribe/123'
      const result = service.rewriteLinksInText(text, 'track-id', 'https://app.example.com')

      expect(result).toContain('https://example.com/unsubscribe/123')
      expect(result).not.toContain('linkId=')
    })
  })

  describe('createTrackingUrl', () => {
    it('should create a tracking URL with encoded parameters', () => {
      const url = service.createTrackingUrl(
        'https://app.example.com',
        'track-123',
        'https://example.com/path?query=value',
        'link-0'
      )

      expect(url).toBe(
        'https://app.example.com/api/tracking/click/track-123?url=https%3A%2F%2Fexample.com%2Fpath%3Fquery%3Dvalue&linkId=link-0'
      )
    })
  })

  describe('getTrackingPixelUrl', () => {
    it('should generate a tracking pixel URL', () => {
      const url = service.getTrackingPixelUrl('https://app.example.com', 'camp-1', 'contact-1')

      expect(url).toContain('https://app.example.com/api/tracking/open/')
      expect(url.length).toBeGreaterThan('https://app.example.com/api/tracking/open/'.length)
    })
  })
})
