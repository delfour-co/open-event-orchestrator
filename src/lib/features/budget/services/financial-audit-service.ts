import type PocketBase from 'pocketbase'
import { sanitizeForAudit } from '../domain/audit-log'
import type { AuditAction, AuditEntityType, CreateAuditLog } from '../domain/audit-log'
import { createAuditLogRepository } from '../infra/audit-log-repository'

interface AuditContext {
  editionId: string
  userId?: string
}

const fireAndForget = (fn: () => Promise<void>): void => {
  Promise.resolve()
    .then(fn)
    .catch((err) => {
      console.error('Audit log error:', err)
    })
}

export const createFinancialAuditService = (pb: PocketBase, context: AuditContext) => {
  const repo = createAuditLogRepository(pb)

  const log = (
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    options: {
      entityReference?: string
      oldValue?: Record<string, unknown>
      newValue?: Record<string, unknown>
      metadata?: Record<string, unknown>
    } = {}
  ): void => {
    fireAndForget(async () => {
      const data: CreateAuditLog = {
        editionId: context.editionId,
        userId: context.userId,
        action,
        entityType,
        entityId,
        entityReference: options.entityReference,
        oldValue: options.oldValue ? sanitizeForAudit(options.oldValue) : undefined,
        newValue: options.newValue ? sanitizeForAudit(options.newValue) : undefined,
        metadata: options.metadata ? sanitizeForAudit(options.metadata) : undefined
      }
      await repo.create(data)
    })
  }

  return {
    // Transactions
    logTransactionCreate(id: string, data: Record<string, unknown>): void {
      log('create', 'transaction', id, { newValue: data })
    },

    logTransactionUpdate(
      id: string,
      oldData: Record<string, unknown>,
      newData: Record<string, unknown>
    ): void {
      log('update', 'transaction', id, { oldValue: oldData, newValue: newData })
    },

    logTransactionDelete(id: string, oldData: Record<string, unknown>): void {
      log('delete', 'transaction', id, { oldValue: oldData })
    },

    logTransactionStatusChange(
      id: string,
      oldStatus: string,
      newStatus: string,
      data: Record<string, unknown>
    ): void {
      log('status_change', 'transaction', id, {
        oldValue: { status: oldStatus },
        newValue: { status: newStatus, ...data }
      })
    },

    // Quotes
    logQuoteCreate(id: string, quoteNumber: string, data: Record<string, unknown>): void {
      log('create', 'quote', id, { entityReference: quoteNumber, newValue: data })
    },

    logQuoteUpdate(
      id: string,
      quoteNumber: string,
      oldData: Record<string, unknown>,
      newData: Record<string, unknown>
    ): void {
      log('update', 'quote', id, {
        entityReference: quoteNumber,
        oldValue: oldData,
        newValue: newData
      })
    },

    logQuoteDelete(id: string, quoteNumber: string, oldData: Record<string, unknown>): void {
      log('delete', 'quote', id, { entityReference: quoteNumber, oldValue: oldData })
    },

    logQuoteSend(id: string, quoteNumber: string, data: Record<string, unknown>): void {
      log('send', 'quote', id, { entityReference: quoteNumber, newValue: data })
    },

    logQuoteAccept(id: string, quoteNumber: string, data: Record<string, unknown>): void {
      log('accept', 'quote', id, { entityReference: quoteNumber, newValue: data })
    },

    logQuoteReject(id: string, quoteNumber: string, data: Record<string, unknown>): void {
      log('reject', 'quote', id, { entityReference: quoteNumber, newValue: data })
    },

    logQuoteConvert(
      id: string,
      quoteNumber: string,
      transactionId: string,
      data: Record<string, unknown>
    ): void {
      log('convert', 'quote', id, {
        entityReference: quoteNumber,
        newValue: data,
        metadata: { transactionId }
      })
    },

    // Invoices
    logInvoiceCreate(id: string, invoiceNumber: string, data: Record<string, unknown>): void {
      log('create', 'invoice', id, { entityReference: invoiceNumber, newValue: data })
    },

    logInvoiceDelete(id: string, invoiceNumber: string, oldData: Record<string, unknown>): void {
      log('delete', 'invoice', id, { entityReference: invoiceNumber, oldValue: oldData })
    },

    // Reimbursements
    logReimbursementCreate(id: string, requestNumber: string, data: Record<string, unknown>): void {
      log('create', 'reimbursement', id, { entityReference: requestNumber, newValue: data })
    },

    logReimbursementSubmit(id: string, requestNumber: string, data: Record<string, unknown>): void {
      log('submit', 'reimbursement', id, { entityReference: requestNumber, newValue: data })
    },

    logReimbursementApprove(
      id: string,
      requestNumber: string,
      transactionId: string,
      data: Record<string, unknown>
    ): void {
      log('approve', 'reimbursement', id, {
        entityReference: requestNumber,
        newValue: data,
        metadata: { transactionId }
      })
    },

    logReimbursementReject(id: string, requestNumber: string, data: Record<string, unknown>): void {
      log('reject', 'reimbursement', id, { entityReference: requestNumber, newValue: data })
    },

    logReimbursementMarkPaid(
      id: string,
      requestNumber: string,
      data: Record<string, unknown>
    ): void {
      log('mark_paid', 'reimbursement', id, { entityReference: requestNumber, newValue: data })
    },

    // Categories
    logCategoryCreate(id: string, name: string, data: Record<string, unknown>): void {
      log('create', 'category', id, { entityReference: name, newValue: data })
    },

    logCategoryUpdate(
      id: string,
      name: string,
      oldData: Record<string, unknown>,
      newData: Record<string, unknown>
    ): void {
      log('update', 'category', id, {
        entityReference: name,
        oldValue: oldData,
        newValue: newData
      })
    },

    logCategoryDelete(id: string, name: string, oldData: Record<string, unknown>): void {
      log('delete', 'category', id, { entityReference: name, oldValue: oldData })
    },

    // Budget
    logBudgetCreate(id: string, data: Record<string, unknown>): void {
      log('create', 'budget', id, { newValue: data })
    },

    logBudgetUpdate(
      id: string,
      oldData: Record<string, unknown>,
      newData: Record<string, unknown>
    ): void {
      log('update', 'budget', id, { oldValue: oldData, newValue: newData })
    },

    logBudgetStatusChange(id: string, oldStatus: string, newStatus: string): void {
      log('status_change', 'budget', id, {
        oldValue: { status: oldStatus },
        newValue: { status: newStatus }
      })
    }
  }
}

export type FinancialAuditService = ReturnType<typeof createFinancialAuditService>
