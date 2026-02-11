import { generateTrackingId } from '../domain'

export interface TrackingConfig {
  baseUrl: string
  campaignId: string
  contactId: string
  enableOpenTracking?: boolean
  enableClickTracking?: boolean
}

export interface TrackedEmail {
  html: string
  text: string
  trackingId: string
}

/**
 * Service for adding tracking to emails
 */
export function createEmailTrackingService() {
  return {
    /**
     * Add tracking pixel and rewrite links in email HTML
     */
    addTracking(html: string, text: string, config: TrackingConfig): TrackedEmail {
      const trackingId = generateTrackingId(config.campaignId, config.contactId)
      let trackedHtml = html
      let trackedText = text

      // Add open tracking pixel
      if (config.enableOpenTracking !== false) {
        const pixelUrl = `${config.baseUrl}/api/tracking/open/${trackingId}`
        const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />`

        // Insert before closing body tag, or at the end if no body tag
        if (trackedHtml.includes('</body>')) {
          trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}</body>`)
        } else {
          trackedHtml += trackingPixel
        }
      }

      // Rewrite links for click tracking
      if (config.enableClickTracking !== false) {
        trackedHtml = this.rewriteLinksInHtml(trackedHtml, trackingId, config.baseUrl)
        trackedText = this.rewriteLinksInText(trackedText, trackingId, config.baseUrl)
      }

      return {
        html: trackedHtml,
        text: trackedText,
        trackingId
      }
    },

    /**
     * Rewrite links in HTML content
     */
    rewriteLinksInHtml(html: string, trackingId: string, baseUrl: string): string {
      // Match href attributes in anchor tags
      const linkRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*)>/gi

      let linkIndex = 0
      return html.replace(linkRegex, (match, before, url, after) => {
        // Skip mailto, tel, and anchor links
        if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('#')) {
          return match
        }

        // Skip unsubscribe links (they should not be tracked)
        if (url.includes('unsubscribe')) {
          return match
        }

        const linkId = `link-${linkIndex++}`
        const trackingUrl = this.createTrackingUrl(baseUrl, trackingId, url, linkId)

        return `<a ${before}href="${trackingUrl}"${after}>`
      })
    },

    /**
     * Rewrite links in plain text content
     */
    rewriteLinksInText(text: string, trackingId: string, baseUrl: string): string {
      // Match URLs in plain text
      const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi

      let linkIndex = 0
      return text.replace(urlRegex, (url) => {
        // Skip unsubscribe links
        if (url.includes('unsubscribe')) {
          return url
        }

        const linkId = `text-link-${linkIndex++}`
        return this.createTrackingUrl(baseUrl, trackingId, url, linkId)
      })
    },

    /**
     * Create a tracking URL that redirects to the original URL
     */
    createTrackingUrl(
      baseUrl: string,
      trackingId: string,
      originalUrl: string,
      linkId: string
    ): string {
      const encodedUrl = encodeURIComponent(originalUrl)
      return `${baseUrl}/api/tracking/click/${trackingId}?url=${encodedUrl}&linkId=${linkId}`
    },

    /**
     * Generate a tracking pixel URL
     */
    getTrackingPixelUrl(baseUrl: string, campaignId: string, contactId: string): string {
      const trackingId = generateTrackingId(campaignId, contactId)
      return `${baseUrl}/api/tracking/open/${trackingId}`
    }
  }
}

export type EmailTrackingService = ReturnType<typeof createEmailTrackingService>
