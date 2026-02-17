import type { BudgetChecklistItem, CreateChecklistItem } from '../domain'
import type { BudgetTemplateRepository } from '../infra/budget-template-repository'
import type { ChecklistItemRepository } from '../infra/checklist-item-repository'

export interface ApplyBudgetTemplateInput {
  templateId: string
  editionId: string
  createdBy: string
  multiplier?: number // For variable items (e.g., number of attendees)
  categoryMapping?: Record<string, string> // Map template categories to actual category IDs
}

export interface ApplyBudgetTemplateResult {
  templateName: string
  itemsCreated: number
  totalEstimatedAmount: number
  items: BudgetChecklistItem[]
}

export const createApplyBudgetTemplateUseCase = (
  templateRepo: BudgetTemplateRepository,
  checklistRepo: ChecklistItemRepository
) => {
  return async (input: ApplyBudgetTemplateInput): Promise<ApplyBudgetTemplateResult> => {
    // 1. Get the template
    const template = await templateRepo.findById(input.templateId)
    if (!template) {
      throw new Error(`Template not found: ${input.templateId}`)
    }

    if (template.items.length === 0) {
      throw new Error('Template has no items')
    }

    // 2. Get next order number
    const startOrder = await checklistRepo.getNextOrder(input.editionId)

    // 3. Create checklist items from template
    const itemsToCreate: CreateChecklistItem[] = template.items.map((item, index) => {
      let estimatedAmount = item.estimatedAmount

      // Apply multiplier for variable items
      if (item.isVariable && input.multiplier && input.multiplier > 0) {
        estimatedAmount = item.estimatedAmount * input.multiplier
      }

      // Map category if mapping provided
      const categoryId =
        item.category && input.categoryMapping ? input.categoryMapping[item.category] : undefined

      return {
        editionId: input.editionId,
        categoryId,
        name: item.name,
        description: item.isVariable
          ? `Variable cost: ${item.estimatedAmount} per ${item.variableUnit || 'unit'}`
          : undefined,
        estimatedAmount,
        status: 'pending' as const,
        priority: item.priority,
        order: startOrder + index,
        createdBy: input.createdBy
      }
    })

    const createdItems = await checklistRepo.createMany(itemsToCreate)

    // 4. Increment template usage count
    await templateRepo.incrementUsageCount(input.templateId)

    // 5. Calculate total
    const totalEstimatedAmount = createdItems.reduce((sum, item) => sum + item.estimatedAmount, 0)

    return {
      templateName: template.name,
      itemsCreated: createdItems.length,
      totalEstimatedAmount,
      items: createdItems
    }
  }
}

export type ApplyBudgetTemplateUseCase = ReturnType<typeof createApplyBudgetTemplateUseCase>
