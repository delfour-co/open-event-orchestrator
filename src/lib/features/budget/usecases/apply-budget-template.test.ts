import { describe, expect, it, vi } from 'vitest'
import type { BudgetTemplateRepository } from '../infra/budget-template-repository'
import type { ChecklistItemRepository } from '../infra/checklist-item-repository'
import { createApplyBudgetTemplateUseCase } from './apply-budget-template'

const makeTemplate = (overrides: Record<string, unknown> = {}) => ({
  id: 'tmpl1',
  name: 'Conference Template',
  description: 'Standard conference',
  eventType: 'conference' as const,
  isGlobal: true,
  items: [
    {
      name: 'Venue',
      estimatedAmount: 5000,
      category: 'venue',
      isVariable: false,
      priority: 'high' as const
    },
    {
      name: 'Catering',
      estimatedAmount: 30,
      category: 'food',
      isVariable: true,
      variableUnit: 'attendee',
      priority: 'medium' as const
    }
  ],
  usageCount: 0,
  createdBy: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const makeChecklistItem = (overrides: Record<string, unknown> = {}) => ({
  id: 'chk1',
  editionId: 'edition1',
  name: 'Venue',
  estimatedAmount: 5000,
  status: 'pending' as const,
  priority: 'high' as const,
  order: 0,
  createdBy: 'user1',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('ApplyBudgetTemplateUseCase', () => {
  const createMockRepos = () => {
    const templateRepo = {
      findById: vi.fn(),
      incrementUsageCount: vi.fn()
    } as unknown as BudgetTemplateRepository
    const checklistRepo = {
      getNextOrder: vi.fn(),
      createMany: vi.fn()
    } as unknown as ChecklistItemRepository
    return { templateRepo, checklistRepo }
  }

  it('should create checklist items from template', async () => {
    const { templateRepo, checklistRepo } = createMockRepos()
    const template = makeTemplate()

    vi.mocked(templateRepo.findById).mockResolvedValue(template)
    vi.mocked(checklistRepo.getNextOrder).mockResolvedValue(0)
    vi.mocked(checklistRepo.createMany).mockResolvedValue([
      makeChecklistItem({ id: 'chk1', name: 'Venue', estimatedAmount: 5000 }),
      makeChecklistItem({ id: 'chk2', name: 'Catering', estimatedAmount: 30 })
    ])
    vi.mocked(templateRepo.incrementUsageCount).mockResolvedValue(undefined)

    const useCase = createApplyBudgetTemplateUseCase(templateRepo, checklistRepo)
    const result = await useCase({
      templateId: 'tmpl1',
      editionId: 'edition1',
      createdBy: 'user1'
    })

    expect(result.templateName).toBe('Conference Template')
    expect(result.itemsCreated).toBe(2)
    expect(templateRepo.incrementUsageCount).toHaveBeenCalledWith('tmpl1')
  })

  it('should apply multiplier to variable items', async () => {
    const { templateRepo, checklistRepo } = createMockRepos()
    const template = makeTemplate()

    vi.mocked(templateRepo.findById).mockResolvedValue(template)
    vi.mocked(checklistRepo.getNextOrder).mockResolvedValue(0)
    vi.mocked(checklistRepo.createMany).mockImplementation(async (items) => {
      return items.map((item, i) =>
        makeChecklistItem({
          id: `chk${i}`,
          name: item.name,
          estimatedAmount: item.estimatedAmount
        })
      )
    })
    vi.mocked(templateRepo.incrementUsageCount).mockResolvedValue(undefined)

    const useCase = createApplyBudgetTemplateUseCase(templateRepo, checklistRepo)
    const result = await useCase({
      templateId: 'tmpl1',
      editionId: 'edition1',
      createdBy: 'user1',
      multiplier: 100
    })

    // Catering: 30 * 100 = 3000, Venue stays 5000
    expect(result.totalEstimatedAmount).toBe(8000)
  })

  it('should throw when template not found', async () => {
    const { templateRepo, checklistRepo } = createMockRepos()
    vi.mocked(templateRepo.findById).mockResolvedValue(null)

    const useCase = createApplyBudgetTemplateUseCase(templateRepo, checklistRepo)

    await expect(
      useCase({
        templateId: 'nonexistent',
        editionId: 'edition1',
        createdBy: 'user1'
      })
    ).rejects.toThrow('Template not found')
  })

  it('should throw when template has no items', async () => {
    const { templateRepo, checklistRepo } = createMockRepos()
    const template = makeTemplate({ items: [] })
    vi.mocked(templateRepo.findById).mockResolvedValue(template)

    const useCase = createApplyBudgetTemplateUseCase(templateRepo, checklistRepo)

    await expect(
      useCase({
        templateId: 'tmpl1',
        editionId: 'edition1',
        createdBy: 'user1'
      })
    ).rejects.toThrow('Template has no items')
  })

  it('should map categories when categoryMapping is provided', async () => {
    const { templateRepo, checklistRepo } = createMockRepos()
    const template = makeTemplate()

    vi.mocked(templateRepo.findById).mockResolvedValue(template)
    vi.mocked(checklistRepo.getNextOrder).mockResolvedValue(0)
    vi.mocked(checklistRepo.createMany).mockImplementation(async (items) => {
      return items.map((item, i) =>
        makeChecklistItem({
          id: `chk${i}`,
          name: item.name,
          categoryId: item.categoryId,
          estimatedAmount: item.estimatedAmount
        })
      )
    })
    vi.mocked(templateRepo.incrementUsageCount).mockResolvedValue(undefined)

    const useCase = createApplyBudgetTemplateUseCase(templateRepo, checklistRepo)

    await useCase({
      templateId: 'tmpl1',
      editionId: 'edition1',
      createdBy: 'user1',
      categoryMapping: { venue: 'cat_venue_id', food: 'cat_food_id' }
    })

    const createManyCall = vi.mocked(checklistRepo.createMany).mock.calls[0][0]
    expect(createManyCall[0].categoryId).toBe('cat_venue_id')
    expect(createManyCall[1].categoryId).toBe('cat_food_id')
  })
})
