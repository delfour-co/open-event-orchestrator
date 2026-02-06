import type { ReimbursementItem, ReimbursementRequest } from '../domain/reimbursement'
import { getExpenseTypeLabel, getReimbursementStatusLabel } from '../domain/reimbursement'
import type { ReimbursementItemRepository } from '../infra/reimbursement-item-repository'
import type { ReimbursementRepository } from '../infra/reimbursement-repository'

export interface ExportRow {
  requestNumber: string
  speakerId: string
  speakerName: string
  status: string
  expenseType: string
  description: string
  amount: number
  date: string
  currency: string
}

export const createExportReimbursementsUseCase = (
  reimbursementRepo: ReimbursementRepository,
  itemRepo: ReimbursementItemRepository
) => {
  return async (editionId: string, speakerNames: Record<string, string>): Promise<string> => {
    const requests = await reimbursementRepo.findByEdition(editionId)

    const rows: ExportRow[] = []

    for (const request of requests) {
      const items = await itemRepo.findByRequest(request.id)

      if (items.length === 0) {
        rows.push(buildRow(request, null, speakerNames))
      } else {
        for (const item of items) {
          rows.push(buildRow(request, item, speakerNames))
        }
      }
    }

    return toCsv(rows)
  }
}

const buildRow = (
  request: ReimbursementRequest,
  item: ReimbursementItem | null,
  speakerNames: Record<string, string>
): ExportRow => ({
  requestNumber: request.requestNumber,
  speakerId: request.speakerId,
  speakerName: speakerNames[request.speakerId] || request.speakerId,
  status: getReimbursementStatusLabel(request.status),
  expenseType: item ? getExpenseTypeLabel(item.expenseType) : '',
  description: item?.description || '',
  amount: item?.amount || request.totalAmount,
  date: item?.date ? item.date.toISOString().split('T')[0] : '',
  currency: request.currency
})

const CSV_HEADERS = [
  'Request Number',
  'Speaker ID',
  'Speaker Name',
  'Status',
  'Expense Type',
  'Description',
  'Amount',
  'Date',
  'Currency'
]

const escapeCsvField = (value: string | number): string => {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const toCsv = (rows: ExportRow[]): string => {
  const header = CSV_HEADERS.join(',')
  const body = rows
    .map((row) =>
      [
        row.requestNumber,
        row.speakerId,
        row.speakerName,
        row.status,
        row.expenseType,
        row.description,
        row.amount,
        row.date,
        row.currency
      ]
        .map(escapeCsvField)
        .join(',')
    )
    .join('\n')
  return body ? `${header}\n${body}` : header
}
