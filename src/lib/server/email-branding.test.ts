import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_POCKETBASE_URL: 'http://test:8090' }
}))

import {
  DEFAULT_BRANDING,
  type EmailBranding,
  emailButton,
  emailFooter,
  emailHeader,
  escapeHtml,
  getEventBranding,
  getOrgBranding,
  textFooter,
  wrapEmail
} from './email-branding'

describe('email-branding', () => {
  describe('escapeHtml', () => {
    it('should escape ampersands', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar')
    })

    it('should escape less-than signs', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
    })

    it('should escape greater-than signs', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b')
    })

    it('should escape double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;')
    })

    it('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#039;s')
    })

    it('should escape all special characters together', () => {
      expect(escapeHtml('<a href="x" & \'y\'>')).toBe(
        '&lt;a href=&quot;x&quot; &amp; &#039;y&#039;&gt;'
      )
    })

    it('should return empty string unchanged', () => {
      expect(escapeHtml('')).toBe('')
    })

    it('should return plain text unchanged', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World')
    })
  })

  describe('DEFAULT_BRANDING', () => {
    it('should have correct default orgName', () => {
      expect(DEFAULT_BRANDING.orgName).toBe('Open Event Orchestrator')
    })

    it('should have correct default primaryColor', () => {
      expect(DEFAULT_BRANDING.primaryColor).toBe('#2563eb')
    })

    it('should have correct default secondaryColor', () => {
      expect(DEFAULT_BRANDING.secondaryColor).toBe('#1d4ed8')
    })

    it('should not have logoUrl', () => {
      expect(DEFAULT_BRANDING.logoUrl).toBeUndefined()
    })

    it('should not have website', () => {
      expect(DEFAULT_BRANDING.website).toBeUndefined()
    })
  })

  describe('emailHeader', () => {
    const branding: EmailBranding = {
      orgName: 'Test Org',
      primaryColor: '#ff0000',
      secondaryColor: '#cc0000'
    }

    it('should contain the title', () => {
      const result = emailHeader(branding, 'Welcome')
      expect(result).toContain('Welcome')
    })

    it('should use primaryColor as background', () => {
      const result = emailHeader(branding, 'Title')
      expect(result).toContain('#ff0000')
    })

    it('should not include logo when logoUrl is not provided', () => {
      const result = emailHeader(branding, 'Title')
      expect(result).not.toContain('<img')
    })

    it('should include logo when logoUrl is provided', () => {
      const brandingWithLogo: EmailBranding = {
        ...branding,
        logoUrl: 'http://example.com/logo.png'
      }
      const result = emailHeader(brandingWithLogo, 'Title')
      expect(result).toContain('<img')
      expect(result).toContain('http://example.com/logo.png')
    })

    it('should escape HTML in title', () => {
      const result = emailHeader(branding, '<script>alert("xss")</script>')
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('should escape HTML in orgName for alt text', () => {
      const brandingXss: EmailBranding = {
        ...branding,
        orgName: 'Org<img>',
        logoUrl: 'http://example.com/logo.png'
      }
      const result = emailHeader(brandingXss, 'Title')
      expect(result).toContain('Org&lt;img&gt;')
    })
  })

  describe('emailFooter', () => {
    it('should contain the orgName', () => {
      const branding: EmailBranding = {
        orgName: 'My Org',
        primaryColor: '#000',
        secondaryColor: '#111'
      }
      const result = emailFooter(branding)
      expect(result).toContain('My Org')
    })

    it('should include website link when provided', () => {
      const branding: EmailBranding = {
        orgName: 'My Org',
        primaryColor: '#000',
        secondaryColor: '#111',
        website: 'https://example.com'
      }
      const result = emailFooter(branding)
      expect(result).toContain('https://example.com')
      expect(result).toContain('<a ')
    })

    it('should not include website link when not provided', () => {
      const branding: EmailBranding = {
        orgName: 'My Org',
        primaryColor: '#000',
        secondaryColor: '#111'
      }
      const result = emailFooter(branding)
      expect(result).not.toContain('<a ')
    })
  })

  describe('emailButton', () => {
    const branding: EmailBranding = {
      orgName: 'Test',
      primaryColor: '#0000ff',
      secondaryColor: '#0000cc'
    }

    it('should contain the button text', () => {
      const result = emailButton(branding, 'Click Me', 'https://example.com')
      expect(result).toContain('Click Me')
    })

    it('should contain the href', () => {
      const result = emailButton(branding, 'Click', 'https://example.com/action')
      expect(result).toContain('https://example.com/action')
    })

    it('should use primaryColor as background', () => {
      const result = emailButton(branding, 'Click', 'https://example.com')
      expect(result).toContain('#0000ff')
    })

    it('should escape HTML in button text', () => {
      const result = emailButton(branding, '<b>Bold</b>', 'https://example.com')
      expect(result).toContain('&lt;b&gt;Bold&lt;/b&gt;')
      expect(result).not.toContain('<b>Bold</b>')
    })
  })

  describe('wrapEmail', () => {
    const branding: EmailBranding = {
      orgName: 'Wrap Org',
      primaryColor: '#123456',
      secondaryColor: '#654321'
    }

    it('should contain the header with title', () => {
      const result = wrapEmail(branding, 'Email Title', '<p>Body</p>')
      expect(result).toContain('Email Title')
    })

    it('should contain the body HTML', () => {
      const result = wrapEmail(branding, 'Title', '<p>Hello World</p>')
      expect(result).toContain('<p>Hello World</p>')
    })

    it('should contain the footer with orgName', () => {
      const result = wrapEmail(branding, 'Title', '<p>Body</p>')
      expect(result).toContain('Wrap Org')
    })

    it('should be a complete HTML document', () => {
      const result = wrapEmail(branding, 'Title', '<p>Body</p>')
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html>')
      expect(result).toContain('</html>')
    })

    it('should contain meta charset', () => {
      const result = wrapEmail(branding, 'Title', '<p>Body</p>')
      expect(result).toContain('charset="utf-8"')
    })
  })

  describe('textFooter', () => {
    it('should contain orgName', () => {
      const branding: EmailBranding = {
        orgName: 'Text Org',
        primaryColor: '#000',
        secondaryColor: '#111'
      }
      const result = textFooter(branding)
      expect(result).toContain('Text Org')
    })

    it('should start with separator', () => {
      const branding: EmailBranding = {
        orgName: 'Org',
        primaryColor: '#000',
        secondaryColor: '#111'
      }
      const result = textFooter(branding)
      expect(result).toMatch(/^---/)
    })

    it('should include website when provided', () => {
      const branding: EmailBranding = {
        orgName: 'Org',
        primaryColor: '#000',
        secondaryColor: '#111',
        website: 'https://example.com'
      }
      const result = textFooter(branding)
      expect(result).toContain('https://example.com')
    })

    it('should not include website when not provided', () => {
      const branding: EmailBranding = {
        orgName: 'Org',
        primaryColor: '#000',
        secondaryColor: '#111'
      }
      const result = textFooter(branding)
      expect(result).toBe('---\nOrg')
    })
  })

  describe('getOrgBranding', () => {
    let mockPb: PocketBase

    beforeEach(() => {
      mockPb = {
        collection: vi.fn()
      } as unknown as PocketBase
    })

    it('should return branding from organization record', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue({
          id: 'org1',
          name: 'My Org',
          logo: 'logo.png',
          primaryColor: '#aabbcc',
          secondaryColor: '#ddeeff',
          website: 'https://myorg.com'
        })
      } as never)

      const result = await getOrgBranding(mockPb, 'org1')

      expect(result.orgName).toBe('My Org')
      expect(result.primaryColor).toBe('#aabbcc')
      expect(result.secondaryColor).toBe('#ddeeff')
      expect(result.website).toBe('https://myorg.com')
      expect(result.logoUrl).toBe('http://test:8090/api/files/organizations/org1/logo.png')
    })

    it('should return branding without logo when org has no logo', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue({
          id: 'org2',
          name: 'No Logo Org',
          logo: '',
          primaryColor: '#112233',
          secondaryColor: '#445566',
          website: ''
        })
      } as never)

      const result = await getOrgBranding(mockPb, 'org2')

      expect(result.logoUrl).toBeUndefined()
      expect(result.website).toBeUndefined()
    })

    it('should fall back to DEFAULT_BRANDING on error', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      } as never)

      const result = await getOrgBranding(mockPb, 'nonexistent')

      expect(result).toEqual(DEFAULT_BRANDING)
    })

    it('should use default values when org fields are empty', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue({
          id: 'org3',
          name: '',
          logo: '',
          primaryColor: '',
          secondaryColor: '',
          website: ''
        })
      } as never)

      const result = await getOrgBranding(mockPb, 'org3')

      expect(result.orgName).toBe(DEFAULT_BRANDING.orgName)
      expect(result.primaryColor).toBe(DEFAULT_BRANDING.primaryColor)
      expect(result.secondaryColor).toBe(DEFAULT_BRANDING.secondaryColor)
    })
  })

  describe('getEventBranding', () => {
    let mockPb: PocketBase

    beforeEach(() => {
      mockPb = {
        collection: vi.fn()
      } as unknown as PocketBase
    })

    it('should return event branding with overrides', async () => {
      const getOneMock = vi.fn()
      // First call: editions.getOne
      getOneMock.mockResolvedValueOnce({
        id: 'ed1',
        expand: {
          eventId: {
            id: 'evt1',
            organizationId: 'org1'
          }
        }
      })
      // Second call: organizations.getOne (for getOrgBranding)
      getOneMock.mockResolvedValueOnce({
        id: 'org1',
        name: 'Org Name',
        logo: '',
        primaryColor: '#orgcolor',
        secondaryColor: '#orgsec',
        website: 'https://org.com'
      })
      // Third call: events.getOne
      getOneMock.mockResolvedValueOnce({
        id: 'evt1',
        name: 'Event Name',
        logo: 'event-logo.png',
        primaryColor: '#evtcolor',
        secondaryColor: '',
        website: 'https://event.com'
      })

      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: getOneMock
      } as never)

      const result = await getEventBranding(mockPb, 'ed1')

      expect(result.orgName).toBe('Event Name')
      expect(result.primaryColor).toBe('#evtcolor')
      expect(result.secondaryColor).toBe('#orgsec') // Falls back to org
      expect(result.website).toBe('https://event.com')
      expect(result.logoUrl).toContain('event-logo.png')
    })

    it('should return DEFAULT_BRANDING when edition has no expand', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue({
          id: 'ed1',
          expand: {}
        })
      } as never)

      const result = await getEventBranding(mockPb, 'ed1')

      expect(result).toEqual(DEFAULT_BRANDING)
    })

    it('should return DEFAULT_BRANDING on error', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      } as never)

      const result = await getEventBranding(mockPb, 'nonexistent')

      expect(result).toEqual(DEFAULT_BRANDING)
    })
  })
})
