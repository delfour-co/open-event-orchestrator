/**
 * Evaluation Plan Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type EvaluationPlan,
  type EvaluationPlanStats,
  type PlanMember,
  calculatePlanCompletionRate,
  canReviewerAccessCategory,
  filterActivePlans,
  formatPlanSummary,
  getMemberRoleColor,
  getMemberRoleLabel,
  getPlanProgressColor,
  getPlanProgressLabel,
  getPlanProgressStatus,
  getPlansForCategory,
  getPlansForReviewer,
  getReviewerCategories,
  getUnassignedReviewers,
  getUncoveredCategories,
  hasEvaluationPlans,
  isCategoryInPlan,
  isPlanLead,
  isPlanMember,
  sortPlansByActivity,
  sortPlansByName
} from './evaluation-plan'

// Test fixtures
const createPlan = (overrides?: Partial<EvaluationPlan>): EvaluationPlan => ({
  id: 'plan-001',
  editionId: 'edition-001',
  name: 'Technical Review',
  description: 'Review for technical talks',
  categoryIds: ['cat-tech', 'cat-dev'],
  reviewerIds: ['user-001', 'user-002'],
  isActive: true,
  createdBy: 'admin-001',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createStats = (overrides?: Partial<EvaluationPlanStats>): EvaluationPlanStats => ({
  planId: 'plan-001',
  planName: 'Technical Review',
  totalTalks: 20,
  reviewedTalks: 10,
  pendingTalks: 10,
  totalReviews: 30,
  averageReviewsPerTalk: 1.5,
  reviewerCount: 5,
  categoryCount: 2,
  ...overrides
})

const createMember = (overrides?: Partial<PlanMember>): PlanMember => ({
  id: 'member-001',
  planId: 'plan-001',
  userId: 'user-001',
  role: 'reviewer',
  addedAt: new Date(),
  addedBy: 'admin-001',
  ...overrides
})

describe('Plan Membership', () => {
  describe('isPlanMember', () => {
    it('should return true for plan member', () => {
      const plan = createPlan({ reviewerIds: ['user-001', 'user-002'] })
      expect(isPlanMember(plan, 'user-001')).toBe(true)
    })

    it('should return false for non-member', () => {
      const plan = createPlan({ reviewerIds: ['user-001', 'user-002'] })
      expect(isPlanMember(plan, 'user-999')).toBe(false)
    })

    it('should return false for empty reviewer list', () => {
      const plan = createPlan({ reviewerIds: [] })
      expect(isPlanMember(plan, 'user-001')).toBe(false)
    })
  })

  describe('isPlanLead', () => {
    it('should return true for lead member', () => {
      const members = [
        createMember({ userId: 'user-001', role: 'lead' }),
        createMember({ userId: 'user-002', role: 'reviewer' })
      ]
      expect(isPlanLead(members, 'user-001')).toBe(true)
    })

    it('should return false for regular reviewer', () => {
      const members = [
        createMember({ userId: 'user-001', role: 'lead' }),
        createMember({ userId: 'user-002', role: 'reviewer' })
      ]
      expect(isPlanLead(members, 'user-002')).toBe(false)
    })

    it('should return false for non-member', () => {
      const members = [createMember({ userId: 'user-001', role: 'lead' })]
      expect(isPlanLead(members, 'user-999')).toBe(false)
    })
  })
})

describe('Category Assignment', () => {
  describe('isCategoryInPlan', () => {
    it('should return true for assigned category', () => {
      const plan = createPlan({ categoryIds: ['cat-tech', 'cat-dev'] })
      expect(isCategoryInPlan(plan, 'cat-tech')).toBe(true)
    })

    it('should return false for unassigned category', () => {
      const plan = createPlan({ categoryIds: ['cat-tech', 'cat-dev'] })
      expect(isCategoryInPlan(plan, 'cat-business')).toBe(false)
    })
  })

  describe('getPlansForCategory', () => {
    it('should return plans containing the category', () => {
      const plans = [
        createPlan({ id: 'plan-1', categoryIds: ['cat-tech'] }),
        createPlan({ id: 'plan-2', categoryIds: ['cat-business'] }),
        createPlan({ id: 'plan-3', categoryIds: ['cat-tech', 'cat-other'] })
      ]
      const result = getPlansForCategory(plans, 'cat-tech')

      expect(result).toHaveLength(2)
      expect(result.map((p) => p.id)).toContain('plan-1')
      expect(result.map((p) => p.id)).toContain('plan-3')
    })

    it('should exclude inactive plans', () => {
      const plans = [
        createPlan({ id: 'plan-1', categoryIds: ['cat-tech'], isActive: true }),
        createPlan({ id: 'plan-2', categoryIds: ['cat-tech'], isActive: false })
      ]
      const result = getPlansForCategory(plans, 'cat-tech')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('plan-1')
    })

    it('should return empty array for unknown category', () => {
      const plans = [createPlan({ categoryIds: ['cat-tech'] })]
      const result = getPlansForCategory(plans, 'cat-unknown')

      expect(result).toHaveLength(0)
    })
  })
})

describe('Reviewer Access', () => {
  describe('getPlansForReviewer', () => {
    it('should return plans containing the reviewer', () => {
      const plans = [
        createPlan({ id: 'plan-1', reviewerIds: ['user-001'] }),
        createPlan({ id: 'plan-2', reviewerIds: ['user-002'] }),
        createPlan({ id: 'plan-3', reviewerIds: ['user-001', 'user-003'] })
      ]
      const result = getPlansForReviewer(plans, 'user-001')

      expect(result).toHaveLength(2)
      expect(result.map((p) => p.id)).toContain('plan-1')
      expect(result.map((p) => p.id)).toContain('plan-3')
    })

    it('should exclude inactive plans', () => {
      const plans = [
        createPlan({ id: 'plan-1', reviewerIds: ['user-001'], isActive: true }),
        createPlan({ id: 'plan-2', reviewerIds: ['user-001'], isActive: false })
      ]
      const result = getPlansForReviewer(plans, 'user-001')

      expect(result).toHaveLength(1)
    })
  })

  describe('getReviewerCategories', () => {
    it('should return all categories from reviewer plans', () => {
      const plans = [
        createPlan({ reviewerIds: ['user-001'], categoryIds: ['cat-1', 'cat-2'] }),
        createPlan({ reviewerIds: ['user-001'], categoryIds: ['cat-2', 'cat-3'] })
      ]
      const result = getReviewerCategories(plans, 'user-001')

      expect(result).toHaveLength(3)
      expect(result).toContain('cat-1')
      expect(result).toContain('cat-2')
      expect(result).toContain('cat-3')
    })

    it('should return empty array for reviewer not in any plan', () => {
      const plans = [createPlan({ reviewerIds: ['user-001'], categoryIds: ['cat-1'] })]
      const result = getReviewerCategories(plans, 'user-999')

      expect(result).toHaveLength(0)
    })
  })

  describe('canReviewerAccessCategory', () => {
    it('should allow access when no plans exist', () => {
      expect(canReviewerAccessCategory([], 'user-001', 'cat-tech')).toBe(true)
    })

    it('should allow access when reviewer is in plan with category', () => {
      const plans = [
        createPlan({
          reviewerIds: ['user-001'],
          categoryIds: ['cat-tech']
        })
      ]
      expect(canReviewerAccessCategory(plans, 'user-001', 'cat-tech')).toBe(true)
    })

    it('should deny access when reviewer is in plan without category', () => {
      const plans = [
        createPlan({
          reviewerIds: ['user-001'],
          categoryIds: ['cat-tech']
        })
      ]
      expect(canReviewerAccessCategory(plans, 'user-001', 'cat-business')).toBe(false)
    })

    it('should allow access to uncovered category for unassigned reviewer', () => {
      const plans = [
        createPlan({
          reviewerIds: ['user-001'],
          categoryIds: ['cat-tech']
        })
      ]
      // user-999 is not in any plan, cat-business is not in any plan
      expect(canReviewerAccessCategory(plans, 'user-999', 'cat-business')).toBe(true)
    })

    it('should deny access to covered category for unassigned reviewer', () => {
      const plans = [
        createPlan({
          reviewerIds: ['user-001'],
          categoryIds: ['cat-tech']
        })
      ]
      // user-999 is not in any plan, but cat-tech is covered by a plan
      expect(canReviewerAccessCategory(plans, 'user-999', 'cat-tech')).toBe(false)
    })
  })
})

describe('Plan Statistics', () => {
  describe('calculatePlanCompletionRate', () => {
    it('should calculate correct completion rate', () => {
      const stats = createStats({ totalTalks: 20, reviewedTalks: 10 })
      expect(calculatePlanCompletionRate(stats)).toBe(50)
    })

    it('should return 0 for no talks', () => {
      const stats = createStats({ totalTalks: 0, reviewedTalks: 0 })
      expect(calculatePlanCompletionRate(stats)).toBe(0)
    })

    it('should return 100 for completed plan', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 10 })
      expect(calculatePlanCompletionRate(stats)).toBe(100)
    })

    it('should round to nearest integer', () => {
      const stats = createStats({ totalTalks: 3, reviewedTalks: 1 })
      expect(calculatePlanCompletionRate(stats)).toBe(33)
    })
  })

  describe('getPlanProgressStatus', () => {
    it('should return not_started for 0%', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 0 })
      expect(getPlanProgressStatus(stats)).toBe('not_started')
    })

    it('should return in_progress for partial completion', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 5 })
      expect(getPlanProgressStatus(stats)).toBe('in_progress')
    })

    it('should return completed for 100%', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 10 })
      expect(getPlanProgressStatus(stats)).toBe('completed')
    })
  })

  describe('getPlanProgressLabel', () => {
    it('should return Not Started for 0%', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 0 })
      expect(getPlanProgressLabel(stats)).toBe('Not Started')
    })

    it('should return percentage for partial completion', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 5 })
      expect(getPlanProgressLabel(stats)).toBe('50% Complete')
    })

    it('should return Completed for 100%', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 10 })
      expect(getPlanProgressLabel(stats)).toBe('Completed')
    })
  })

  describe('getPlanProgressColor', () => {
    it('should return slate for not started', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 0 })
      expect(getPlanProgressColor(stats)).toContain('94a3b8')
    })

    it('should return amber for in progress', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 5 })
      expect(getPlanProgressColor(stats)).toContain('f59e0b')
    })

    it('should return green for completed', () => {
      const stats = createStats({ totalTalks: 10, reviewedTalks: 10 })
      expect(getPlanProgressColor(stats)).toContain('22c55e')
    })
  })
})

describe('Display Functions', () => {
  describe('getMemberRoleLabel', () => {
    it('should return Reviewer for reviewer role', () => {
      expect(getMemberRoleLabel('reviewer')).toBe('Reviewer')
    })

    it('should return Lead Reviewer for lead role', () => {
      expect(getMemberRoleLabel('lead')).toBe('Lead Reviewer')
    })
  })

  describe('getMemberRoleColor', () => {
    it('should return blue for reviewer', () => {
      expect(getMemberRoleColor('reviewer')).toContain('3b82f6')
    })

    it('should return violet for lead', () => {
      expect(getMemberRoleColor('lead')).toContain('8b5cf6')
    })
  })

  describe('formatPlanSummary', () => {
    it('should format with categories and reviewers', () => {
      const plan = createPlan({
        categoryIds: ['cat-1', 'cat-2'],
        reviewerIds: ['user-1', 'user-2', 'user-3']
      })
      const result = formatPlanSummary(plan)

      expect(result).toContain('2 categories')
      expect(result).toContain('3 reviewers')
    })

    it('should use singular for one item', () => {
      const plan = createPlan({
        categoryIds: ['cat-1'],
        reviewerIds: ['user-1']
      })
      const result = formatPlanSummary(plan)

      expect(result).toContain('1 category')
      expect(result).toContain('1 reviewer')
    })

    it('should handle empty plan', () => {
      const plan = createPlan({
        categoryIds: [],
        reviewerIds: []
      })
      const result = formatPlanSummary(plan)

      expect(result).toBe('No categories or reviewers assigned')
    })

    it('should handle categories only', () => {
      const plan = createPlan({
        categoryIds: ['cat-1', 'cat-2'],
        reviewerIds: []
      })
      const result = formatPlanSummary(plan)

      expect(result).toBe('2 categories')
    })
  })
})

describe('Sorting Functions', () => {
  describe('sortPlansByName', () => {
    it('should sort plans alphabetically', () => {
      const plans = [
        createPlan({ id: '1', name: 'Zebra' }),
        createPlan({ id: '2', name: 'Alpha' }),
        createPlan({ id: '3', name: 'Beta' })
      ]
      const result = sortPlansByName(plans)

      expect(result[0].name).toBe('Alpha')
      expect(result[1].name).toBe('Beta')
      expect(result[2].name).toBe('Zebra')
    })
  })

  describe('sortPlansByActivity', () => {
    it('should sort active plans first', () => {
      const plans = [
        createPlan({ id: '1', name: 'Inactive A', isActive: false }),
        createPlan({ id: '2', name: 'Active B', isActive: true }),
        createPlan({ id: '3', name: 'Active A', isActive: true })
      ]
      const result = sortPlansByActivity(plans)

      expect(result[0].name).toBe('Active A')
      expect(result[1].name).toBe('Active B')
      expect(result[2].name).toBe('Inactive A')
    })
  })
})

describe('Filtering Functions', () => {
  describe('filterActivePlans', () => {
    it('should return only active plans', () => {
      const plans = [
        createPlan({ id: '1', isActive: true }),
        createPlan({ id: '2', isActive: false }),
        createPlan({ id: '3', isActive: true })
      ]
      const result = filterActivePlans(plans)

      expect(result).toHaveLength(2)
      expect(result.every((p) => p.isActive)).toBe(true)
    })
  })

  describe('hasEvaluationPlans', () => {
    it('should return true when plans exist', () => {
      const plans = [createPlan()]
      expect(hasEvaluationPlans(plans)).toBe(true)
    })

    it('should return false for empty array', () => {
      expect(hasEvaluationPlans([])).toBe(false)
    })
  })
})

describe('Coverage Analysis', () => {
  describe('getUncoveredCategories', () => {
    it('should return categories not in any plan', () => {
      const allCategories = ['cat-1', 'cat-2', 'cat-3', 'cat-4']
      const plans = [
        createPlan({ categoryIds: ['cat-1', 'cat-2'] }),
        createPlan({ categoryIds: ['cat-2'] })
      ]
      const result = getUncoveredCategories(allCategories, plans)

      expect(result).toHaveLength(2)
      expect(result).toContain('cat-3')
      expect(result).toContain('cat-4')
    })

    it('should exclude inactive plan categories', () => {
      const allCategories = ['cat-1', 'cat-2']
      const plans = [createPlan({ categoryIds: ['cat-1'], isActive: false })]
      const result = getUncoveredCategories(allCategories, plans)

      expect(result).toHaveLength(2)
    })

    it('should return empty array when all covered', () => {
      const allCategories = ['cat-1', 'cat-2']
      const plans = [createPlan({ categoryIds: ['cat-1', 'cat-2'] })]
      const result = getUncoveredCategories(allCategories, plans)

      expect(result).toHaveLength(0)
    })
  })

  describe('getUnassignedReviewers', () => {
    it('should return reviewers not in any plan', () => {
      const allReviewers = ['user-1', 'user-2', 'user-3', 'user-4']
      const plans = [
        createPlan({ reviewerIds: ['user-1', 'user-2'] }),
        createPlan({ reviewerIds: ['user-2'] })
      ]
      const result = getUnassignedReviewers(allReviewers, plans)

      expect(result).toHaveLength(2)
      expect(result).toContain('user-3')
      expect(result).toContain('user-4')
    })

    it('should exclude inactive plan reviewers', () => {
      const allReviewers = ['user-1', 'user-2']
      const plans = [createPlan({ reviewerIds: ['user-1'], isActive: false })]
      const result = getUnassignedReviewers(allReviewers, plans)

      expect(result).toHaveLength(2)
    })
  })
})
