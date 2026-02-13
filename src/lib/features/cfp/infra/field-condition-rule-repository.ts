/**
 * Field Condition Rule Repository
 *
 * Handles persistence of conditional field rules in PocketBase
 */

import type PocketBase from 'pocketbase'
import type {
  CreateFieldConditionRule,
  FieldCondition,
  FieldConditionRule,
  UpdateFieldConditionRule
} from '../domain/conditional-field'

export interface FieldConditionRuleRepository {
  findByEdition(editionId: string): Promise<FieldConditionRule[]>
  findById(id: string): Promise<FieldConditionRule | null>
  findByTargetField(editionId: string, targetFieldId: string): Promise<FieldConditionRule[]>
  create(rule: CreateFieldConditionRule): Promise<FieldConditionRule>
  update(id: string, rule: UpdateFieldConditionRule): Promise<FieldConditionRule>
  delete(id: string): Promise<void>
  reorder(editionId: string, ruleIds: string[]): Promise<void>
}

function mapToFieldConditionRule(record: Record<string, unknown>): FieldConditionRule {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    targetFieldId: record.targetFieldId as string,
    name: record.name as string,
    description: (record.description as string) || undefined,
    conditions: record.conditions as FieldCondition[],
    conditionLogic: (record.conditionLogic as 'AND' | 'OR') || 'AND',
    isActive: record.isActive !== false,
    order: (record.order as number) || 0,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createFieldConditionRuleRepository(pb: PocketBase): FieldConditionRuleRepository {
  return {
    async findByEdition(editionId: string): Promise<FieldConditionRule[]> {
      const records = await pb.collection('field_condition_rules').getFullList({
        filter: `editionId="${editionId}"`,
        sort: 'order'
      })
      return records.map(mapToFieldConditionRule)
    },

    async findById(id: string): Promise<FieldConditionRule | null> {
      try {
        const record = await pb.collection('field_condition_rules').getOne(id)
        return mapToFieldConditionRule(record)
      } catch {
        return null
      }
    },

    async findByTargetField(
      editionId: string,
      targetFieldId: string
    ): Promise<FieldConditionRule[]> {
      const records = await pb.collection('field_condition_rules').getFullList({
        filter: `editionId="${editionId}" && targetFieldId="${targetFieldId}"`,
        sort: 'order'
      })
      return records.map(mapToFieldConditionRule)
    },

    async create(rule: CreateFieldConditionRule): Promise<FieldConditionRule> {
      const record = await pb.collection('field_condition_rules').create({
        editionId: rule.editionId,
        targetFieldId: rule.targetFieldId,
        name: rule.name,
        description: rule.description || null,
        conditions: rule.conditions,
        conditionLogic: rule.conditionLogic || 'AND',
        isActive: rule.isActive ?? true,
        order: rule.order || 0
      })
      return mapToFieldConditionRule(record)
    },

    async update(id: string, rule: UpdateFieldConditionRule): Promise<FieldConditionRule> {
      const data: Record<string, unknown> = {}

      if (rule.targetFieldId !== undefined) {
        data.targetFieldId = rule.targetFieldId
      }
      if (rule.name !== undefined) {
        data.name = rule.name
      }
      if (rule.description !== undefined) {
        data.description = rule.description || null
      }
      if (rule.conditions !== undefined) {
        data.conditions = rule.conditions
      }
      if (rule.conditionLogic !== undefined) {
        data.conditionLogic = rule.conditionLogic
      }
      if (rule.isActive !== undefined) {
        data.isActive = rule.isActive
      }
      if (rule.order !== undefined) {
        data.order = rule.order
      }

      const record = await pb.collection('field_condition_rules').update(id, data)
      return mapToFieldConditionRule(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('field_condition_rules').delete(id)
    },

    async reorder(_editionId: string, ruleIds: string[]): Promise<void> {
      const updates = ruleIds.map((id, index) =>
        pb.collection('field_condition_rules').update(id, { order: index })
      )
      await Promise.all(updates)
    }
  }
}
