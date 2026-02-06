import type { BudgetQuote } from '../domain/quote'
import { canConvertQuote } from '../domain/quote'
import type { BudgetTransaction } from '../domain/transaction'
import type { QuoteRepository } from '../infra/quote-repository'
import type { TransactionRepository } from '../infra/transaction-repository'

export interface ConvertQuoteInput {
  quoteId: string
  categoryId: string
}

export interface ConvertQuoteResult {
  transaction: BudgetTransaction
  quote: BudgetQuote
}

export const createConvertQuoteToTransactionUseCase = (
  quoteRepo: QuoteRepository,
  transactionRepo: TransactionRepository
) => {
  return async (input: ConvertQuoteInput): Promise<ConvertQuoteResult> => {
    const quote = await quoteRepo.findById(input.quoteId)
    if (!quote) {
      throw new Error('Quote not found')
    }

    if (!canConvertQuote(quote.status)) {
      throw new Error(
        `Cannot convert quote with status "${quote.status}". Only accepted quotes can be converted.`
      )
    }

    const transaction = await transactionRepo.create({
      categoryId: input.categoryId,
      type: 'expense',
      amount: quote.totalAmount,
      description: `${quote.vendor} - ${quote.description || quote.quoteNumber}`,
      vendor: quote.vendor,
      invoiceNumber: quote.quoteNumber,
      date: new Date(),
      status: 'pending'
    })

    const updatedQuote = await quoteRepo.updateStatus(quote.id, 'accepted', {
      transactionId: transaction.id
    })

    return { transaction, quote: updatedQuote }
  }
}
