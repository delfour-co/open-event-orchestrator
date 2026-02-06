import type { ReimbursementRequest } from '../domain/reimbursement'
import { canAdminReview } from '../domain/reimbursement'
import type { BudgetTransaction } from '../domain/transaction'
import type { ReimbursementItemRepository } from '../infra/reimbursement-item-repository'
import type { ReimbursementRepository } from '../infra/reimbursement-repository'
import type { TransactionRepository } from '../infra/transaction-repository'

export interface ApproveReimbursementInput {
  requestId: string
  categoryId: string
  reviewedBy: string
  adminNotes?: string
}

export interface ApproveReimbursementResult {
  request: ReimbursementRequest
  transaction: BudgetTransaction
}

export const createApproveReimbursementUseCase = (
  reimbursementRepo: ReimbursementRepository,
  itemRepo: ReimbursementItemRepository,
  transactionRepo: TransactionRepository
) => {
  return async (input: ApproveReimbursementInput): Promise<ApproveReimbursementResult> => {
    const request = await reimbursementRepo.findById(input.requestId)
    if (!request) {
      throw new Error('Reimbursement request not found')
    }

    if (!canAdminReview(request.status)) {
      throw new Error(
        `Cannot approve reimbursement with status "${request.status}". Only submitted or under_review requests can be approved.`
      )
    }

    const items = await itemRepo.findByRequest(request.id)
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

    const speakerId = request.speakerId
    const transaction = await transactionRepo.create({
      categoryId: input.categoryId,
      type: 'expense',
      amount: totalAmount,
      description: `Speaker reimbursement - ${request.requestNumber}`,
      vendor: `Speaker ${speakerId}`,
      date: new Date(),
      status: 'pending'
    })

    const updatedRequest = await reimbursementRepo.updateStatus(request.id, 'approved', {
      adminNotes: input.adminNotes,
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date(),
      transactionId: transaction.id,
      totalAmount
    })

    return { request: updatedRequest, transaction }
  }
}
