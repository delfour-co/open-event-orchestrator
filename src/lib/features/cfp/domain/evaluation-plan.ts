/**
 * Evaluation Plan Domain
 *
 * Handles evaluation plans (jury groups) for CFP review.
 * Allows creating different reviewer groups assigned to specific categories.
 */

import { z } from 'zod'

/**
 * Evaluation plan schema
 */
export const evaluationPlanSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  categoryIds: z.array(z.string()).default([]),
  reviewerIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type EvaluationPlan = z.infer<typeof evaluationPlanSchema>

export const createEvaluationPlanSchema = evaluationPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateEvaluationPlan = z.infer<typeof createEvaluationPlanSchema>

export const updateEvaluationPlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  categoryIds: z.array(z.string()).optional(),
  reviewerIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
})

export type UpdateEvaluationPlan = z.infer<typeof updateEvaluationPlanSchema>

/**
 * Plan member schema (reviewer assigned to a plan)
 */
export const planMemberSchema = z.object({
  id: z.string(),
  planId: z.string(),
  userId: z.string(),
  role: z.enum(['reviewer', 'lead']).default('reviewer'),
  addedAt: z.date(),
  addedBy: z.string()
})

export type PlanMember = z.infer<typeof planMemberSchema>

export const addPlanMemberSchema = z.object({
  planId: z.string(),
  userId: z.string(),
  role: z.enum(['reviewer', 'lead']).default('reviewer'),
  addedBy: z.string()
})

export type AddPlanMember = z.infer<typeof addPlanMemberSchema>

/**
 * Evaluation plan statistics
 */
export interface EvaluationPlanStats {
  planId: string
  planName: string
  totalTalks: number
  reviewedTalks: number
  pendingTalks: number
  totalReviews: number
  averageReviewsPerTalk: number
  reviewerCount: number
  categoryCount: number
}

/**
 * Reviewer workload in a plan
 */
export interface ReviewerWorkload {
  userId: string
  userName: string
  reviewCount: number
  assignedTalks: number
  completionRate: number
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a user is a member of an evaluation plan
 */
export function isPlanMember(plan: EvaluationPlan, userId: string): boolean {
  return plan.reviewerIds.includes(userId)
}

/**
 * Check if a user is a lead of an evaluation plan
 */
export function isPlanLead(members: PlanMember[], userId: string): boolean {
  return members.some((m) => m.userId === userId && m.role === 'lead')
}

/**
 * Check if a category is assigned to a plan
 */
export function isCategoryInPlan(plan: EvaluationPlan, categoryId: string): boolean {
  return plan.categoryIds.includes(categoryId)
}

/**
 * Get plans for a specific category
 */
export function getPlansForCategory(plans: EvaluationPlan[], categoryId: string): EvaluationPlan[] {
  return plans.filter((p) => p.isActive && isCategoryInPlan(p, categoryId))
}

/**
 * Get plans for a specific reviewer
 */
export function getPlansForReviewer(plans: EvaluationPlan[], userId: string): EvaluationPlan[] {
  return plans.filter((p) => p.isActive && isPlanMember(p, userId))
}

/**
 * Get categories a reviewer can review based on their plans
 */
export function getReviewerCategories(plans: EvaluationPlan[], userId: string): string[] {
  const categories = new Set<string>()

  for (const plan of plans) {
    if (plan.isActive && isPlanMember(plan, userId)) {
      for (const categoryId of plan.categoryIds) {
        categories.add(categoryId)
      }
    }
  }

  return Array.from(categories)
}

/**
 * Check if a reviewer can review a talk in a specific category
 */
export function canReviewerAccessCategory(
  plans: EvaluationPlan[],
  userId: string,
  categoryId: string
): boolean {
  // If no plans exist, allow all reviewers to access all categories (default behavior)
  if (plans.length === 0) {
    return true
  }

  // If there are plans, check if user is assigned to a plan that includes this category
  const userPlans = getPlansForReviewer(plans, userId)

  // If user is not in any plan, check if category is covered by any plan
  if (userPlans.length === 0) {
    // If category is not in any plan, allow access (uncategorized reviews)
    const categoryPlans = getPlansForCategory(plans, categoryId)
    return categoryPlans.length === 0
  }

  // User is in at least one plan, check if any of their plans covers this category
  return userPlans.some((plan) => isCategoryInPlan(plan, categoryId))
}

// ============================================================================
// Statistics Functions
// ============================================================================

/**
 * Calculate completion rate for a plan
 */
export function calculatePlanCompletionRate(stats: EvaluationPlanStats): number {
  if (stats.totalTalks === 0) {
    return 0
  }
  return Math.round((stats.reviewedTalks / stats.totalTalks) * 100)
}

/**
 * Get plan progress status
 */
export function getPlanProgressStatus(
  stats: EvaluationPlanStats
): 'not_started' | 'in_progress' | 'completed' {
  const completionRate = calculatePlanCompletionRate(stats)

  if (completionRate === 0) {
    return 'not_started'
  }
  if (completionRate === 100) {
    return 'completed'
  }
  return 'in_progress'
}

/**
 * Get plan progress label
 */
export function getPlanProgressLabel(stats: EvaluationPlanStats): string {
  const status = getPlanProgressStatus(stats)

  switch (status) {
    case 'not_started':
      return 'Not Started'
    case 'in_progress':
      return `${calculatePlanCompletionRate(stats)}% Complete`
    case 'completed':
      return 'Completed'
  }
}

/**
 * Get plan progress color
 */
export function getPlanProgressColor(stats: EvaluationPlanStats): string {
  const status = getPlanProgressStatus(stats)

  switch (status) {
    case 'not_started':
      return '#94a3b8' // slate-400
    case 'in_progress':
      return '#f59e0b' // amber-500
    case 'completed':
      return '#22c55e' // green-500
  }
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Get member role label
 */
export function getMemberRoleLabel(role: PlanMember['role']): string {
  switch (role) {
    case 'reviewer':
      return 'Reviewer'
    case 'lead':
      return 'Lead Reviewer'
  }
}

/**
 * Get member role color
 */
export function getMemberRoleColor(role: PlanMember['role']): string {
  switch (role) {
    case 'reviewer':
      return '#3b82f6' // blue-500
    case 'lead':
      return '#8b5cf6' // violet-500
  }
}

/**
 * Format plan summary
 */
export function formatPlanSummary(plan: EvaluationPlan): string {
  const categoryCount = plan.categoryIds.length
  const reviewerCount = plan.reviewerIds.length

  const parts: string[] = []

  if (categoryCount > 0) {
    parts.push(`${categoryCount} ${categoryCount === 1 ? 'category' : 'categories'}`)
  }

  if (reviewerCount > 0) {
    parts.push(`${reviewerCount} ${reviewerCount === 1 ? 'reviewer' : 'reviewers'}`)
  }

  if (parts.length === 0) {
    return 'No categories or reviewers assigned'
  }

  return parts.join(', ')
}

/**
 * Sort plans by name
 */
export function sortPlansByName(plans: EvaluationPlan[]): EvaluationPlan[] {
  return [...plans].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Sort plans by activity (active first, then by name)
 */
export function sortPlansByActivity(plans: EvaluationPlan[]): EvaluationPlan[] {
  return [...plans].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

/**
 * Filter active plans
 */
export function filterActivePlans(plans: EvaluationPlan[]): EvaluationPlan[] {
  return plans.filter((p) => p.isActive)
}

/**
 * Check if any plan exists for an edition
 */
export function hasEvaluationPlans(plans: EvaluationPlan[]): boolean {
  return plans.length > 0
}

/**
 * Get uncovered categories (categories not assigned to any plan)
 */
export function getUncoveredCategories(
  allCategoryIds: string[],
  plans: EvaluationPlan[]
): string[] {
  const coveredCategories = new Set<string>()

  for (const plan of filterActivePlans(plans)) {
    for (const categoryId of plan.categoryIds) {
      coveredCategories.add(categoryId)
    }
  }

  return allCategoryIds.filter((id) => !coveredCategories.has(id))
}

/**
 * Get unassigned reviewers (team members not in any plan)
 */
export function getUnassignedReviewers(
  allReviewerIds: string[],
  plans: EvaluationPlan[]
): string[] {
  const assignedReviewers = new Set<string>()

  for (const plan of filterActivePlans(plans)) {
    for (const reviewerId of plan.reviewerIds) {
      assignedReviewers.add(reviewerId)
    }
  }

  return allReviewerIds.filter((id) => !assignedReviewers.has(id))
}
