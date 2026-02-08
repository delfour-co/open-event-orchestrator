/**
 * Base class for embeddable widgets
 */

export abstract class BaseWidget extends HTMLElement {
  protected shadow: ShadowRoot
  protected apiUrl: string | null = null
  protected apiKey: string | null = null
  protected editionId: string | null = null

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
  }

  static get observedAttributes(): string[] {
    return ['api-url', 'api-key', 'edition-id']
  }

  connectedCallback(): void {
    this.apiUrl = this.getAttribute('api-url')
    this.apiKey = this.getAttribute('api-key')
    this.editionId = this.getAttribute('edition-id')

    if (!this.apiUrl || !this.apiKey || !this.editionId) {
      this.renderError('Missing required attributes: api-url, api-key, edition-id')
      return
    }

    this.render()
    this.loadData()
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
    if (oldValue === newValue) return

    switch (name) {
      case 'api-url':
        this.apiUrl = newValue
        break
      case 'api-key':
        this.apiKey = newValue
        break
      case 'edition-id':
        this.editionId = newValue
        break
    }

    if (this.isConnected && this.apiUrl && this.apiKey && this.editionId) {
      this.loadData()
    }
  }

  protected abstract render(): void
  protected abstract loadData(): Promise<void>

  protected renderError(message: string): void {
    this.shadow.innerHTML = `
			<style>
				.error {
					padding: 16px;
					background-color: #fef2f2;
					border: 1px solid #fecaca;
					border-radius: 8px;
					color: #dc2626;
					font-family: system-ui, -apple-system, sans-serif;
				}
			</style>
			<div class="error">${this.escapeHtml(message)}</div>
		`
  }

  protected renderLoading(): void {
    this.shadow.innerHTML = `
			<style>
				.loading {
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 32px;
					font-family: system-ui, -apple-system, sans-serif;
					color: #6b7280;
				}
				.spinner {
					width: 24px;
					height: 24px;
					border: 3px solid #e5e7eb;
					border-top-color: #3b82f6;
					border-radius: 50%;
					animation: spin 1s linear infinite;
					margin-right: 12px;
				}
				@keyframes spin {
					to { transform: rotate(360deg); }
				}
			</style>
			<div class="loading">
				<div class="spinner"></div>
				Loading...
			</div>
		`
  }

  protected escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  protected formatTime(time: string | null): string {
    if (!time) return ''
    // Assume time is in HH:mm format
    return time.substring(0, 5)
  }

  protected formatDate(dateStr: string | null): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  protected formatPrice(cents: number, currency: string): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency
    }).format(cents / 100)
  }
}
