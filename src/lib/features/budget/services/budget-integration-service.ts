import {
  createBudgetRepository,
  createCategoryRepository,
  createInvoiceRepository,
  createTransactionRepository
} from '$lib/features/budget/infra'
import type PocketBase from 'pocketbase'
import { createFinancialAuditService } from './financial-audit-service'

const CATEGORY_NAMES: Record<string, string> = {
  sponsoring: 'Sponsoring',
  billing: 'Ticketing'
}

async function findOrCreateBudget(pb: PocketBase, editionId: string): Promise<string> {
  const budgetRepo = createBudgetRepository(pb)
  const existing = await budgetRepo.findByEdition(editionId)
  if (existing) return existing.id

  const created = await budgetRepo.create({
    editionId,
    totalBudget: 0,
    currency: 'EUR',
    status: 'draft'
  })
  return created.id
}

interface RecordIncomeParams {
  pb: PocketBase
  editionId: string
  description: string
  amount: number
  invoiceNumber: string
  pdfBytes: Uint8Array
  vendor?: string
  source: 'sponsoring' | 'billing'
}

interface RecordCreditNoteParams {
  pb: PocketBase
  editionId: string
  description: string
  amount: number
  creditNoteNumber: string
  pdfBytes: Uint8Array
  vendor?: string
  source: 'sponsoring' | 'billing'
}

async function findOrCreateCategory(
  pb: PocketBase,
  budgetId: string,
  source: 'sponsoring' | 'billing'
): Promise<string> {
  const categoryRepo = createCategoryRepository(pb)
  const categories = await categoryRepo.findByBudget(budgetId)
  const categoryName = CATEGORY_NAMES[source]
  const existing = categories.find((c) => c.name === categoryName)
  if (existing) return existing.id

  const created = await categoryRepo.create({
    budgetId,
    name: categoryName,
    plannedAmount: 0
  })
  return created.id
}

export async function recordIncome(params: RecordIncomeParams): Promise<void> {
  const { pb, editionId, description, amount, invoiceNumber, pdfBytes, vendor, source } = params

  const budgetId = await findOrCreateBudget(pb, editionId)

  const categoryId = await findOrCreateCategory(pb, budgetId, source)
  const transactionRepo = createTransactionRepository(pb)
  const transaction = await transactionRepo.create({
    categoryId,
    type: 'income',
    amount,
    description,
    vendor,
    invoiceNumber,
    date: new Date(),
    status: 'paid'
  })

  const invoiceRepo = createInvoiceRepository(pb)
  const formData = new FormData()
  formData.append('transactionId', transaction.id)
  formData.append('invoiceNumber', invoiceNumber)
  formData.append('issueDate', new Date().toISOString())
  formData.append('amount', String(amount))
  const file = new File([pdfBytes as BlobPart], `${invoiceNumber}.pdf`, { type: 'application/pdf' })
  formData.append('file', file)
  const invoice = await invoiceRepo.create(formData)

  const audit = createFinancialAuditService(pb, { editionId })
  audit.logTransactionCreate(transaction.id, {
    type: 'income',
    amount,
    description,
    vendor,
    invoiceNumber,
    source
  })
  audit.logInvoiceCreate(invoice.id, invoiceNumber, {
    transactionId: transaction.id,
    amount,
    source
  })
}

export async function recordCreditNote(params: RecordCreditNoteParams): Promise<void> {
  const { pb, editionId, description, amount, creditNoteNumber, pdfBytes, vendor, source } = params

  const budgetId = await findOrCreateBudget(pb, editionId)

  const categoryId = await findOrCreateCategory(pb, budgetId, source)
  const transactionRepo = createTransactionRepository(pb)
  const transaction = await transactionRepo.create({
    categoryId,
    type: 'expense',
    amount,
    description,
    vendor,
    invoiceNumber: creditNoteNumber,
    date: new Date(),
    status: 'paid'
  })

  const invoiceRepo = createInvoiceRepository(pb)
  const formData = new FormData()
  formData.append('transactionId', transaction.id)
  formData.append('invoiceNumber', creditNoteNumber)
  formData.append('issueDate', new Date().toISOString())
  formData.append('amount', String(amount))
  const file = new File([pdfBytes as BlobPart], `${creditNoteNumber}.pdf`, {
    type: 'application/pdf'
  })
  formData.append('file', file)
  const invoice = await invoiceRepo.create(formData)

  const audit = createFinancialAuditService(pb, { editionId })
  audit.logTransactionCreate(transaction.id, {
    type: 'expense',
    amount,
    description,
    vendor,
    invoiceNumber: creditNoteNumber,
    source
  })
  audit.logInvoiceCreate(invoice.id, creditNoteNumber, {
    transactionId: transaction.id,
    amount,
    source
  })
}
