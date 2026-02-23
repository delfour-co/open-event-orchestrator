export {
  createStripeService,
  type StripeService,
  type CheckoutLineItem,
  type CreateCheckoutSessionInput,
  type CheckoutSessionResult
} from './stripe-service'

export { generateQrCodeDataUrl } from './qr-code-service'

export {
  generateOrderConfirmationHtml,
  generateOrderConfirmationText,
  generateOrderRefundHtml,
  generateOrderRefundText,
  type OrderConfirmationData,
  type OrderRefundData,
  type TicketTemplateColors
} from './ticket-email-service'

export {
  createPromoCodeService,
  type PromoCodeService,
  type ApplyPromoCodeResult,
  type BulkCreateResult
} from './promo-code-service'

export {
  generateTicketPdf,
  generateMultipleTicketsPdf,
  type TicketPdfData,
  type GeneratePdfOptions
} from './pdf-ticket-service'

export {
  generateOrderInvoicePdf,
  type OrderInvoiceData
} from './pdf-invoice-service'

export type { SellerInfo } from './pdf-shared'

export {
  getNextInvoiceNumber,
  getNextCreditNoteNumber
} from './invoice-number-service'

export {
  generateCreditNotePdf,
  type CreditNoteData
} from './pdf-credit-note-service'

export type {
  PaymentProvider,
  PaymentProviderType,
  CreateCheckoutInput,
  PaymentLineItem,
  CheckoutResult,
  RefundResult,
  PaymentEvent
} from './payment-providers'
export { getPaymentProvider, getActivePaymentProviderType } from './payment-providers'

export {
  createBillingStatsService,
  type BillingStatsService,
  type SalesStats,
  type RevenueByTicketType,
  type DailySales,
  type SalesTrend,
  type LowStockAlert
} from './billing-stats-service'
