import type { BudgetTransaction, CreateTransaction } from '../domain'
import { canConvertToTransaction } from '../domain'
import type { ChecklistItemRepository } from '../infra/checklist-item-repository'
import type { TransactionRepository } from '../infra/transaction-repository'

export interface ConvertChecklistToTransactionInput {
  checklistItemId: string
  categoryId: string
  date?: Date
}

export interface ConvertChecklistToTransactionResult {
  transaction: BudgetTransaction
  updatedChecklistItemId: string
}

export const createConvertChecklistToTransactionUseCase = (
  checklistRepo: ChecklistItemRepository,
  transactionRepo: TransactionRepository
) => {
  return async (
    input: ConvertChecklistToTransactionInput
  ): Promise<ConvertChecklistToTransactionResult> => {
    // 1. Get the checklist item
    const item = await checklistRepo.findById(input.checklistItemId)
    if (!item) {
      throw new Error(`Checklist item not found: ${input.checklistItemId}`)
    }

    // 2. Validate status
    if (!canConvertToTransaction(item.status, item.transactionId)) {
      throw new Error(
        `Cannot convert checklist item to transaction. Current status: ${item.status}, ` +
          `has transaction: ${!!item.transactionId}`
      )
    }

    // 3. Create the transaction
    const transactionData: CreateTransaction = {
      categoryId: input.categoryId,
      type: 'expense',
      amount: item.estimatedAmount,
      description: item.name,
      vendor: item.assignee,
      date: input.date || new Date(),
      status: 'pending'
    }

    const transaction = await transactionRepo.create(transactionData)

    // 4. Update checklist item with transaction link and status
    await checklistRepo.update(item.id, {
      status: 'paid',
      transactionId: transaction.id
    })

    return {
      transaction,
      updatedChecklistItemId: item.id
    }
  }
}

export type ConvertChecklistToTransactionUseCase = ReturnType<
  typeof createConvertChecklistToTransactionUseCase
>
