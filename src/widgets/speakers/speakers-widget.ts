/**
 * OEO Speakers Widget
 *
 * Usage:
 * <oeo-speakers
 *   api-url="https://your-oeo-instance.com/api/v1"
 *   api-key="oeo_live_xxx"
 *   edition-id="abc123">
 * </oeo-speakers>
 */

import { type Speaker, WidgetApiClient } from '../shared/api-client'
import { BaseWidget } from '../shared/base-widget'

export class SpeakersWidget extends BaseWidget {
  private speakers: Speaker[] = []
  private searchQuery = ''

  protected render(): void {
    this.renderLoading()
  }

  protected async loadData(): Promise<void> {
    if (!this.apiUrl || !this.apiKey || !this.editionId) return

    try {
      const client = new WidgetApiClient({ apiUrl: this.apiUrl, apiKey: this.apiKey })
      const response = await client.getSpeakers(this.editionId, 1, 100)
      this.speakers = response.data
      this.renderSpeakers()
    } catch (error) {
      this.renderError(error instanceof Error ? error.message : 'Failed to load speakers')
    }
  }

  private renderSpeakers(): void {
    const filteredSpeakers = this.searchQuery
      ? this.speakers.filter((s) => {
          const fullName = `${s.firstName} ${s.lastName}`.toLowerCase()
          const company = (s.company || '').toLowerCase()
          const query = this.searchQuery.toLowerCase()
          return fullName.includes(query) || company.includes(query)
        })
      : this.speakers

    this.shadow.innerHTML = `
			<style>
				:host {
					display: block;
					font-family: system-ui, -apple-system, sans-serif;
				}
				.speakers-container {
					max-width: 1200px;
					margin: 0 auto;
				}
				.search-box {
					margin-bottom: 24px;
				}
				.search-input {
					width: 100%;
					max-width: 400px;
					padding: 12px 16px;
					font-size: 16px;
					border: 1px solid #e5e7eb;
					border-radius: 8px;
					outline: none;
					transition: border-color 0.2s;
				}
				.search-input:focus {
					border-color: #3b82f6;
				}
				.speakers-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
					gap: 24px;
				}
				.speaker-card {
					background: white;
					border: 1px solid #e5e7eb;
					border-radius: 12px;
					overflow: hidden;
					transition: box-shadow 0.2s;
				}
				.speaker-card:hover {
					box-shadow: 0 4px 12px rgba(0,0,0,0.1);
				}
				.speaker-photo {
					width: 100%;
					aspect-ratio: 1;
					object-fit: cover;
					background: #f3f4f6;
				}
				.speaker-photo-placeholder {
					width: 100%;
					aspect-ratio: 1;
					background: linear-gradient(135deg, #3b82f6, #8b5cf6);
					display: flex;
					align-items: center;
					justify-content: center;
					font-size: 48px;
					font-weight: 600;
					color: white;
				}
				.speaker-info {
					padding: 16px;
				}
				.speaker-name {
					font-weight: 600;
					font-size: 18px;
					color: #111827;
					margin-bottom: 4px;
				}
				.speaker-title {
					font-size: 14px;
					color: #6b7280;
					margin-bottom: 8px;
				}
				.speaker-bio {
					font-size: 14px;
					color: #374151;
					line-height: 1.5;
					display: -webkit-box;
					-webkit-line-clamp: 3;
					-webkit-box-orient: vertical;
					overflow: hidden;
				}
				.speaker-socials {
					display: flex;
					gap: 12px;
					margin-top: 12px;
					padding-top: 12px;
					border-top: 1px solid #e5e7eb;
				}
				.social-link {
					color: #6b7280;
					text-decoration: none;
					font-size: 13px;
					display: flex;
					align-items: center;
					gap: 4px;
				}
				.social-link:hover {
					color: #3b82f6;
				}
				.empty-state {
					text-align: center;
					padding: 48px;
					color: #6b7280;
				}
				.speaker-count {
					font-size: 14px;
					color: #6b7280;
					margin-bottom: 16px;
				}
			</style>
			<div class="speakers-container">
				<div class="search-box">
					<input
						type="text"
						class="search-input"
						placeholder="Search speakers..."
						value="${this.escapeHtml(this.searchQuery)}"
					/>
				</div>
				<div class="speaker-count">
					${filteredSpeakers.length} speaker${filteredSpeakers.length !== 1 ? 's' : ''}
				</div>
				${
          filteredSpeakers.length === 0
            ? `
					<div class="empty-state">
						<p>No speakers found${this.searchQuery ? ' matching your search' : ''}.</p>
					</div>
				`
            : `
					<div class="speakers-grid">
						${filteredSpeakers
              .map(
                (speaker) => `
							<div class="speaker-card">
								${
                  speaker.photoUrl
                    ? `<img class="speaker-photo" src="${this.escapeHtml(speaker.photoUrl)}" alt="${this.escapeHtml(speaker.firstName)} ${this.escapeHtml(speaker.lastName)}" />`
                    : `<div class="speaker-photo-placeholder">${this.escapeHtml(speaker.firstName.charAt(0))}${this.escapeHtml(speaker.lastName.charAt(0))}</div>`
                }
								<div class="speaker-info">
									<div class="speaker-name">${this.escapeHtml(speaker.firstName)} ${this.escapeHtml(speaker.lastName)}</div>
									${
                    speaker.jobTitle || speaker.company
                      ? `
										<div class="speaker-title">
											${speaker.jobTitle ? this.escapeHtml(speaker.jobTitle) : ''}
											${speaker.jobTitle && speaker.company ? ' @ ' : ''}
											${speaker.company ? this.escapeHtml(speaker.company) : ''}
										</div>
									`
                      : ''
                  }
									${speaker.bio ? `<div class="speaker-bio">${this.escapeHtml(speaker.bio)}</div>` : ''}
									${
                    speaker.twitter || speaker.github || speaker.linkedin
                      ? `
										<div class="speaker-socials">
											${speaker.twitter ? `<a href="https://twitter.com/${this.escapeHtml(speaker.twitter)}" target="_blank" rel="noopener" class="social-link">Twitter</a>` : ''}
											${speaker.github ? `<a href="https://github.com/${this.escapeHtml(speaker.github)}" target="_blank" rel="noopener" class="social-link">GitHub</a>` : ''}
											${speaker.linkedin ? `<a href="${this.escapeHtml(speaker.linkedin)}" target="_blank" rel="noopener" class="social-link">LinkedIn</a>` : ''}
										</div>
									`
                      : ''
                  }
								</div>
							</div>
						`
              )
              .join('')}
					</div>
				`
        }
			</div>
		`

    // Add search event listener
    const searchInput = this.shadow.querySelector('.search-input') as HTMLInputElement
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = (e.target as HTMLInputElement).value
        this.renderSpeakers()
      })
    }
  }
}

// Register custom element
customElements.define('oeo-speakers', SpeakersWidget)
