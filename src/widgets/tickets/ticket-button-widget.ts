/**
 * OEO Ticket Button Widget
 *
 * Usage:
 * <oeo-tickets
 *   api-url="https://your-oeo-instance.com/api/v1"
 *   api-key="oeo_live_xxx"
 *   edition-id="abc123"
 *   ticket-url="https://your-oeo-instance.com/tickets/my-event-2025">
 * </oeo-tickets>
 */

import { type Edition, type TicketType, WidgetApiClient } from '../shared/api-client'
import { BaseWidget } from '../shared/base-widget'

export class TicketButtonWidget extends BaseWidget {
  private ticketTypes: TicketType[] = []
  private edition: Edition | null = null
  private ticketUrl: string | null = null
  private isExpanded = false

  static get observedAttributes(): string[] {
    return [...BaseWidget.observedAttributes, 'ticket-url']
  }

  connectedCallback(): void {
    this.ticketUrl = this.getAttribute('ticket-url')
    super.connectedCallback()
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (name === 'ticket-url') {
      this.ticketUrl = newValue
    } else {
      super.attributeChangedCallback(name, oldValue, newValue)
    }
  }

  protected render(): void {
    this.renderLoading()
  }

  protected async loadData(): Promise<void> {
    if (!this.apiUrl || !this.apiKey || !this.editionId) return

    try {
      const client = new WidgetApiClient({ apiUrl: this.apiUrl, apiKey: this.apiKey })
      const [ticketResponse, editionResponse] = await Promise.all([
        client.getTicketTypes(this.editionId),
        client.getEdition(this.editionId)
      ])
      this.ticketTypes = ticketResponse.data.filter((t) => t.isActive && t.quantityAvailable > 0)
      this.edition = editionResponse.data
      this.renderTicketButton()
    } catch (error) {
      this.renderError(error instanceof Error ? error.message : 'Failed to load ticket information')
    }
  }

  private renderTicketButton(): void {
    const cheapestTicket = this.ticketTypes.reduce(
      (min, t) => (t.price < min.price ? t : min),
      this.ticketTypes[0]
    )

    const totalAvailable = this.ticketTypes.reduce((sum, t) => sum + t.quantityAvailable, 0)
    const isLowStock = totalAvailable < 50 && totalAvailable > 0
    const isSoldOut = totalAvailable === 0

    this.shadow.innerHTML = `
			<style>
				:host {
					display: inline-block;
					font-family: system-ui, -apple-system, sans-serif;
				}
				.ticket-widget {
					position: relative;
				}
				.ticket-button {
					display: flex;
					align-items: center;
					gap: 12px;
					padding: 14px 24px;
					background: linear-gradient(135deg, #3b82f6, #2563eb);
					color: white;
					border: none;
					border-radius: 12px;
					font-size: 16px;
					font-weight: 600;
					cursor: pointer;
					transition: all 0.2s;
					box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
				}
				.ticket-button:hover {
					transform: translateY(-2px);
					box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
				}
				.ticket-button:active {
					transform: translateY(0);
				}
				.ticket-button.sold-out {
					background: #6b7280;
					cursor: not-allowed;
					box-shadow: none;
				}
				.ticket-button.sold-out:hover {
					transform: none;
				}
				.ticket-icon {
					width: 24px;
					height: 24px;
				}
				.price-info {
					display: flex;
					flex-direction: column;
					align-items: flex-start;
				}
				.price {
					font-size: 18px;
				}
				.from-text {
					font-size: 12px;
					opacity: 0.8;
				}
				.badge {
					position: absolute;
					top: -8px;
					right: -8px;
					padding: 4px 8px;
					border-radius: 12px;
					font-size: 11px;
					font-weight: 600;
					animation: pulse 2s infinite;
				}
				.badge.low-stock {
					background: #fef3c7;
					color: #92400e;
				}
				.badge.sold-out {
					background: #fee2e2;
					color: #991b1b;
					animation: none;
				}
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.7; }
				}
				.dropdown {
					position: absolute;
					top: calc(100% + 8px);
					left: 0;
					right: 0;
					min-width: 280px;
					background: white;
					border: 1px solid #e5e7eb;
					border-radius: 12px;
					box-shadow: 0 10px 40px rgba(0,0,0,0.15);
					z-index: 100;
					opacity: 0;
					visibility: hidden;
					transform: translateY(-10px);
					transition: all 0.2s;
				}
				.dropdown.open {
					opacity: 1;
					visibility: visible;
					transform: translateY(0);
				}
				.dropdown-header {
					padding: 16px;
					border-bottom: 1px solid #e5e7eb;
					font-weight: 600;
					color: #111827;
				}
				.ticket-option {
					padding: 12px 16px;
					border-bottom: 1px solid #f3f4f6;
					display: flex;
					justify-content: space-between;
					align-items: center;
				}
				.ticket-option:last-of-type {
					border-bottom: none;
				}
				.ticket-name {
					font-weight: 500;
					color: #374151;
				}
				.ticket-desc {
					font-size: 12px;
					color: #6b7280;
					margin-top: 2px;
				}
				.ticket-price {
					font-weight: 600;
					color: #111827;
				}
				.ticket-avail {
					font-size: 11px;
					color: #6b7280;
				}
				.dropdown-footer {
					padding: 12px 16px;
					background: #f9fafb;
					border-radius: 0 0 12px 12px;
				}
				.buy-link {
					display: block;
					width: 100%;
					padding: 10px;
					background: #3b82f6;
					color: white;
					text-align: center;
					text-decoration: none;
					border-radius: 8px;
					font-weight: 500;
					transition: background 0.2s;
				}
				.buy-link:hover {
					background: #2563eb;
				}
			</style>
			<div class="ticket-widget">
				${isLowStock ? '<span class="badge low-stock">Low Stock</span>' : ''}
				${isSoldOut ? '<span class="badge sold-out">Sold Out</span>' : ''}
				<button class="ticket-button ${isSoldOut ? 'sold-out' : ''}" ${isSoldOut ? 'disabled' : ''}>
					<svg class="ticket-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
					</svg>
					${
            isSoldOut
              ? '<span>Sold Out</span>'
              : `
						<div class="price-info">
							<span class="from-text">From</span>
							<span class="price">${cheapestTicket ? this.formatPrice(cheapestTicket.price, cheapestTicket.currency) : 'Free'}</span>
						</div>
					`
          }
				</button>
				<div class="dropdown ${this.isExpanded ? 'open' : ''}">
					<div class="dropdown-header">
						${this.edition ? this.escapeHtml(this.edition.name) : 'Tickets'}
					</div>
					${this.ticketTypes
            .map(
              (ticket) => `
						<div class="ticket-option">
							<div>
								<div class="ticket-name">${this.escapeHtml(ticket.name)}</div>
								${ticket.description ? `<div class="ticket-desc">${this.escapeHtml(ticket.description)}</div>` : ''}
							</div>
							<div style="text-align: right">
								<div class="ticket-price">${this.formatPrice(ticket.price, ticket.currency)}</div>
								<div class="ticket-avail">${ticket.quantityAvailable} left</div>
							</div>
						</div>
					`
            )
            .join('')}
					${
            this.ticketUrl
              ? `
						<div class="dropdown-footer">
							<a href="${this.escapeHtml(this.ticketUrl)}" target="_blank" rel="noopener" class="buy-link">
								Buy Tickets
							</a>
						</div>
					`
              : ''
          }
				</div>
			</div>
		`

    // Add toggle event listener
    if (!isSoldOut) {
      const button = this.shadow.querySelector('.ticket-button')
      button?.addEventListener('click', () => {
        this.isExpanded = !this.isExpanded
        this.shadow.querySelector('.dropdown')?.classList.toggle('open', this.isExpanded)
      })

      // Close on click outside
      document.addEventListener('click', (e) => {
        if (!this.contains(e.target as Node)) {
          this.isExpanded = false
          this.shadow.querySelector('.dropdown')?.classList.remove('open')
        }
      })
    }
  }
}

// Register custom element
customElements.define('oeo-tickets', TicketButtonWidget)
