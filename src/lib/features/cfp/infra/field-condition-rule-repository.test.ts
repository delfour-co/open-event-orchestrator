import type { FieldCondition } from '$lib/features/cfp/domain/conditional-field'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFieldConditionRuleRepository } from './field-condition-rule-repository'

// Mock PocketBase
const createMockPocketBase = () => {
  const mockCollection = {
    getFullList: vi.fn(),
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }

  return {
    collection: vi.fn(() => mockCollection),
    mockCollection
  }
}

describe('FieldConditionRuleRepository', () => {
  let mockPb: ReturnType<typeof createMockPocketBase>

  beforeEach(() => {
    mockPb = createMockPocketBase()
    vi.clearAllMocks()
  })

  describe('findByEdition', () => {
    it('should return rules for an edition sorted by order', async () => {
      const mockRules = [
        {
          id: 'rule1',
          editionId: 'edition1',
          targetFieldId: 'duration',
          name: 'Show duration for workshops',
          description: 'Only workshops need duration',
          conditions: [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }],
          conditionLogic: 'AND',
          isActive: true,
          order: 0,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        },
        {
          id: 'rule2',
          editionId: 'edition1',
          targetFieldId: 'prerequisites',
          name: 'Show prerequisites for advanced',
          conditions: [{ fieldId: 'level', operator: 'equals', value: 'advanced' }],
          conditionLogic: 'AND',
          isActive: true,
          order: 1,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        }
      ]

      mockPb.mockCollection.getFullList.mockResolvedValue(mockRules)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.findByEdition('edition1')

      expect(mockPb.collection).toHaveBeenCalledWith('field_condition_rules')
      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'editionId="edition1"',
        sort: 'order'
      })
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('rule1')
      expect(result[0].targetFieldId).toBe('duration')
      expect(result[1].id).toBe('rule2')
    })

    it('should return empty array when no rules exist', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.findByEdition('edition1')

      expect(result).toEqual([])
    })
  })

  describe('findById', () => {
    it('should return a rule by id', async () => {
      const mockRule = {
        id: 'rule1',
        editionId: 'edition1',
        targetFieldId: 'duration',
        name: 'Test Rule',
        conditions: [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }],
        conditionLogic: 'AND',
        isActive: true,
        order: 0,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }

      mockPb.mockCollection.getOne.mockResolvedValue(mockRule)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.findById('rule1')

      expect(mockPb.mockCollection.getOne).toHaveBeenCalledWith('rule1')
      expect(result?.id).toBe('rule1')
      expect(result?.name).toBe('Test Rule')
    })

    it('should return null when rule not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('findByTargetField', () => {
    it('should return rules for a specific target field', async () => {
      const mockRules = [
        {
          id: 'rule1',
          editionId: 'edition1',
          targetFieldId: 'duration',
          name: 'Rule 1',
          conditions: [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }],
          conditionLogic: 'AND',
          isActive: true,
          order: 0,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z'
        }
      ]

      mockPb.mockCollection.getFullList.mockResolvedValue(mockRules)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.findByTargetField('edition1', 'duration')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'editionId="edition1" && targetFieldId="duration"',
        sort: 'order'
      })
      expect(result).toHaveLength(1)
      expect(result[0].targetFieldId).toBe('duration')
    })
  })

  describe('create', () => {
    it('should create a new rule', async () => {
      const conditions: FieldCondition[] = [
        { fieldId: 'formatId', operator: 'equals', value: 'workshop' }
      ]

      const mockCreated = {
        id: 'newrule',
        editionId: 'edition1',
        targetFieldId: 'duration',
        name: 'New Rule',
        description: 'A description',
        conditions,
        conditionLogic: 'AND',
        isActive: true,
        order: 0,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }

      mockPb.mockCollection.create.mockResolvedValue(mockCreated)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.create({
        editionId: 'edition1',
        targetFieldId: 'duration',
        name: 'New Rule',
        description: 'A description',
        conditions,
        conditionLogic: 'AND',
        isActive: true,
        order: 0
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith({
        editionId: 'edition1',
        targetFieldId: 'duration',
        name: 'New Rule',
        description: 'A description',
        conditions,
        conditionLogic: 'AND',
        isActive: true,
        order: 0
      })
      expect(result.id).toBe('newrule')
      expect(result.name).toBe('New Rule')
    })
  })

  describe('update', () => {
    it('should update an existing rule', async () => {
      const mockUpdated = {
        id: 'rule1',
        editionId: 'edition1',
        targetFieldId: 'prerequisites',
        name: 'Updated Rule',
        conditions: [{ fieldId: 'level', operator: 'equals', value: 'advanced' }],
        conditionLogic: 'OR',
        isActive: false,
        order: 1,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-02T00:00:00Z'
      }

      mockPb.mockCollection.update.mockResolvedValue(mockUpdated)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.update('rule1', {
        name: 'Updated Rule',
        conditionLogic: 'OR',
        isActive: false
      })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('rule1', {
        name: 'Updated Rule',
        conditionLogic: 'OR',
        isActive: false
      })
      expect(result.name).toBe('Updated Rule')
      expect(result.conditionLogic).toBe('OR')
      expect(result.isActive).toBe(false)
    })

    it('should only update provided fields', async () => {
      const mockUpdated = {
        id: 'rule1',
        editionId: 'edition1',
        targetFieldId: 'duration',
        name: 'Rule 1',
        conditions: [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }],
        conditionLogic: 'AND',
        isActive: false,
        order: 0,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-02T00:00:00Z'
      }

      mockPb.mockCollection.update.mockResolvedValue(mockUpdated)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      await repo.update('rule1', { isActive: false })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('rule1', {
        isActive: false
      })
    })
  })

  describe('delete', () => {
    it('should delete a rule', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      await repo.delete('rule1')

      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('rule1')
    })
  })

  describe('reorder', () => {
    it('should update order for all rules', async () => {
      mockPb.mockCollection.update.mockResolvedValue({})

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      await repo.reorder('edition1', ['rule3', 'rule1', 'rule2'])

      expect(mockPb.mockCollection.update).toHaveBeenCalledTimes(3)
      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('rule3', { order: 0 })
      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('rule1', { order: 1 })
      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('rule2', { order: 2 })
    })
  })

  describe('mapping', () => {
    it('should correctly map record to domain type', async () => {
      const mockRecord = {
        id: 'rule1',
        editionId: 'edition1',
        targetFieldId: 'duration',
        name: 'Test Rule',
        description: 'A description',
        conditions: [
          { fieldId: 'formatId', operator: 'equals', value: 'workshop' },
          { fieldId: 'level', operator: 'in', value: ['intermediate', 'advanced'] }
        ],
        conditionLogic: 'AND',
        isActive: true,
        order: 5,
        created: '2024-01-15T10:30:00Z',
        updated: '2024-01-16T14:45:00Z'
      }

      mockPb.mockCollection.getOne.mockResolvedValue(mockRecord)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.findById('rule1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('rule1')
      expect(result?.editionId).toBe('edition1')
      expect(result?.targetFieldId).toBe('duration')
      expect(result?.name).toBe('Test Rule')
      expect(result?.description).toBe('A description')
      expect(result?.conditions).toHaveLength(2)
      expect(result?.conditions[0].fieldId).toBe('formatId')
      expect(result?.conditions[1].operator).toBe('in')
      expect(result?.conditionLogic).toBe('AND')
      expect(result?.isActive).toBe(true)
      expect(result?.order).toBe(5)
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle missing optional fields', async () => {
      const mockRecord = {
        id: 'rule1',
        editionId: 'edition1',
        targetFieldId: 'duration',
        name: 'Test Rule',
        // description is missing
        conditions: [{ fieldId: 'formatId', operator: 'equals', value: 'workshop' }],
        // conditionLogic is missing
        // isActive is missing
        // order is missing
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }

      mockPb.mockCollection.getOne.mockResolvedValue(mockRecord)

      const repo = createFieldConditionRuleRepository(
        mockPb as unknown as Parameters<typeof createFieldConditionRuleRepository>[0]
      )
      const result = await repo.findById('rule1')

      expect(result?.description).toBeUndefined()
      expect(result?.conditionLogic).toBe('AND') // default
      expect(result?.isActive).toBe(true) // default (isActive !== false)
      expect(result?.order).toBe(0) // default
    })
  })
})
