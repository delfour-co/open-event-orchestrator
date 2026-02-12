/**
 * Evaluation Plan Repository
 *
 * Handles persistence of evaluation plans in PocketBase
 */

import type PocketBase from 'pocketbase'
import type {
  CreateEvaluationPlan,
  EvaluationPlan,
  UpdateEvaluationPlan
} from '../domain/evaluation-plan'

export interface EvaluationPlanRepository {
  findById(id: string): Promise<EvaluationPlan | null>
  findByEdition(editionId: string): Promise<EvaluationPlan[]>
  findByReviewer(editionId: string, userId: string): Promise<EvaluationPlan[]>
  findByCategory(editionId: string, categoryId: string): Promise<EvaluationPlan[]>
  create(input: CreateEvaluationPlan): Promise<EvaluationPlan>
  update(input: UpdateEvaluationPlan): Promise<EvaluationPlan>
  delete(id: string): Promise<void>
  addReviewer(planId: string, userId: string): Promise<EvaluationPlan>
  removeReviewer(planId: string, userId: string): Promise<EvaluationPlan>
  addCategory(planId: string, categoryId: string): Promise<EvaluationPlan>
  removeCategory(planId: string, categoryId: string): Promise<EvaluationPlan>
}

function mapToEvaluationPlan(record: Record<string, unknown>): EvaluationPlan {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    name: record.name as string,
    description: (record.description as string) || undefined,
    categoryIds: (record.categoryIds as string[]) || [],
    reviewerIds: (record.reviewerIds as string[]) || [],
    isActive: record.isActive !== false,
    createdBy: record.createdBy as string,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

export function createEvaluationPlanRepository(pb: PocketBase): EvaluationPlanRepository {
  return {
    async findById(id: string): Promise<EvaluationPlan | null> {
      try {
        const record = await pb.collection('evaluation_plans').getOne(id)
        return mapToEvaluationPlan(record)
      } catch {
        return null
      }
    },

    async findByEdition(editionId: string): Promise<EvaluationPlan[]> {
      const records = await pb.collection('evaluation_plans').getFullList({
        filter: `editionId="${editionId}"`,
        sort: 'name'
      })
      return records.map(mapToEvaluationPlan)
    },

    async findByReviewer(editionId: string, userId: string): Promise<EvaluationPlan[]> {
      const records = await pb.collection('evaluation_plans').getFullList({
        filter: `editionId="${editionId}" && reviewerIds ~ "${userId}" && isActive=true`,
        sort: 'name'
      })
      return records.map(mapToEvaluationPlan)
    },

    async findByCategory(editionId: string, categoryId: string): Promise<EvaluationPlan[]> {
      const records = await pb.collection('evaluation_plans').getFullList({
        filter: `editionId="${editionId}" && categoryIds ~ "${categoryId}" && isActive=true`,
        sort: 'name'
      })
      return records.map(mapToEvaluationPlan)
    },

    async create(input: CreateEvaluationPlan): Promise<EvaluationPlan> {
      const record = await pb.collection('evaluation_plans').create({
        editionId: input.editionId,
        name: input.name,
        description: input.description || null,
        categoryIds: input.categoryIds || [],
        reviewerIds: input.reviewerIds || [],
        isActive: input.isActive ?? true,
        createdBy: input.createdBy
      })
      return mapToEvaluationPlan(record)
    },

    async update(input: UpdateEvaluationPlan): Promise<EvaluationPlan> {
      const data: Record<string, unknown> = {}

      if (input.name !== undefined) {
        data.name = input.name
      }
      if (input.description !== undefined) {
        data.description = input.description || null
      }
      if (input.categoryIds !== undefined) {
        data.categoryIds = input.categoryIds
      }
      if (input.reviewerIds !== undefined) {
        data.reviewerIds = input.reviewerIds
      }
      if (input.isActive !== undefined) {
        data.isActive = input.isActive
      }

      const record = await pb.collection('evaluation_plans').update(input.id, data)
      return mapToEvaluationPlan(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('evaluation_plans').delete(id)
    },

    async addReviewer(planId: string, userId: string): Promise<EvaluationPlan> {
      const plan = await this.findById(planId)
      if (!plan) {
        throw new Error('Evaluation plan not found')
      }

      if (plan.reviewerIds.includes(userId)) {
        return plan // Already a member
      }

      return this.update({
        id: planId,
        reviewerIds: [...plan.reviewerIds, userId]
      })
    },

    async removeReviewer(planId: string, userId: string): Promise<EvaluationPlan> {
      const plan = await this.findById(planId)
      if (!plan) {
        throw new Error('Evaluation plan not found')
      }

      return this.update({
        id: planId,
        reviewerIds: plan.reviewerIds.filter((id) => id !== userId)
      })
    },

    async addCategory(planId: string, categoryId: string): Promise<EvaluationPlan> {
      const plan = await this.findById(planId)
      if (!plan) {
        throw new Error('Evaluation plan not found')
      }

      if (plan.categoryIds.includes(categoryId)) {
        return plan // Already assigned
      }

      return this.update({
        id: planId,
        categoryIds: [...plan.categoryIds, categoryId]
      })
    },

    async removeCategory(planId: string, categoryId: string): Promise<EvaluationPlan> {
      const plan = await this.findById(planId)
      if (!plan) {
        throw new Error('Evaluation plan not found')
      }

      return this.update({
        id: planId,
        categoryIds: plan.categoryIds.filter((id) => id !== categoryId)
      })
    }
  }
}
