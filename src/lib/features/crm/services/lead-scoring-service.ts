/**
 * Lead Scoring Service
 *
 * Manages lead scoring rules and calculates contact scores.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type CreateLeadScoringRule,
  DEFAULT_SCORING_RULES,
  type LeadScoreHistory,
  type LeadScoreLevel,
  type LeadScoringRule,
  type ScoringAction,
  type UpdateLeadScoringRule,
  applyScoreChange,
  buildScoreHistoryEntry,
  calculateLeadLevel,
  findApplicableRule,
  shouldApplyInactivityPenalty
} from '../domain/lead-scoring'

export interface ScoreUpdateResult {
  success: boolean
  contactId: string
  previousScore: number
  newScore: number
  level: LeadScoreLevel
  pointsChange: number
  error?: string
}

export interface LeadScoringService {
  // Rule management
  createRule(input: CreateLeadScoringRule): Promise<LeadScoringRule>
  updateRule(id: string, updates: UpdateLeadScoringRule): Promise<LeadScoringRule>
  deleteRule(id: string): Promise<void>
  getRules(eventId: string): Promise<LeadScoringRule[]>
  initializeDefaultRules(eventId: string): Promise<LeadScoringRule[]>

  // Score calculation
  applyAction(
    contactId: string,
    action: ScoringAction,
    metadata?: Record<string, unknown>
  ): Promise<ScoreUpdateResult>
  recalculateScore(contactId: string): Promise<ScoreUpdateResult>
  adjustScore(contactId: string, points: number, description: string): Promise<ScoreUpdateResult>

  // Score queries
  getScore(contactId: string): Promise<{ score: number; level: LeadScoreLevel }>
  getScoreHistory(contactId: string, limit?: number): Promise<LeadScoreHistory[]>
  getTopContacts(
    eventId: string,
    limit?: number
  ): Promise<Array<{ contactId: string; score: number; level: LeadScoreLevel }>>
  getContactsByLevel(eventId: string, level: LeadScoreLevel): Promise<string[]>

  // Bulk operations
  applyInactivityPenalties(eventId: string): Promise<{ processed: number; updated: number }>
}

export function createLeadScoringService(pb: PocketBase): LeadScoringService {
  async function getContact(contactId: string) {
    return pb.collection('contacts').getOne(contactId)
  }

  async function updateContactScore(
    contactId: string,
    score: number,
    level: LeadScoreLevel
  ): Promise<void> {
    await pb.collection('contacts').update(contactId, {
      leadScore: score,
      leadScoreLevel: level,
      leadScoreUpdatedAt: new Date().toISOString()
    })
  }

  async function logScoreChange(entry: Omit<LeadScoreHistory, 'id' | 'createdAt'>): Promise<void> {
    await pb.collection('lead_score_history').create({
      contactId: entry.contactId,
      ruleId: entry.ruleId || '',
      action: entry.action,
      pointsChange: entry.pointsChange,
      previousScore: entry.previousScore,
      newScore: entry.newScore,
      description: entry.description || '',
      metadata: entry.metadata || {}
    })
  }

  async function applyInactivityPenaltyToContact(
    contact: Record<string, unknown>,
    rules: LeadScoringRule[]
  ): Promise<boolean> {
    const lastActivity = contact.lastActivityAt
      ? new Date(contact.lastActivityAt as string)
      : undefined
    const lastUpdate = contact.leadScoreUpdatedAt
      ? new Date(contact.leadScoreUpdatedAt as string)
      : undefined
    const currentScore = (contact.leadScore as number) || 0

    for (const rule of rules) {
      if (shouldApplyInactivityPenalty(lastActivity, lastUpdate, rule)) {
        const newScore = applyScoreChange(currentScore, rule.points)
        const level = calculateLeadLevel(newScore)

        await updateContactScore(contact.id as string, newScore, level)

        const historyEntry = buildScoreHistoryEntry(
          contact.id as string,
          rule,
          'inactivity',
          rule.points,
          currentScore
        )
        await logScoreChange(historyEntry)

        return true
      }
    }
    return false
  }

  return {
    async createRule(input: CreateLeadScoringRule): Promise<LeadScoringRule> {
      const record = await pb.collection('lead_scoring_rules').create({
        eventId: input.eventId,
        name: input.name,
        action: input.action,
        points: input.points,
        inactivityDays: input.inactivityDays || null,
        isActive: true
      })

      return mapRecordToRule(record)
    },

    async updateRule(id: string, updates: UpdateLeadScoringRule): Promise<LeadScoringRule> {
      const record = await pb.collection('lead_scoring_rules').update(id, updates)
      return mapRecordToRule(record)
    },

    async deleteRule(id: string): Promise<void> {
      await pb.collection('lead_scoring_rules').delete(id)
    },

    async getRules(eventId: string): Promise<LeadScoringRule[]> {
      const records = await pb.collection('lead_scoring_rules').getFullList({
        filter: safeFilter`eventId = ${eventId}`,
        sort: 'action,created'
      })

      return records.map(mapRecordToRule)
    },

    async initializeDefaultRules(eventId: string): Promise<LeadScoringRule[]> {
      const existingRules = await this.getRules(eventId)
      if (existingRules.length > 0) {
        return existingRules
      }

      const rules: LeadScoringRule[] = []
      for (const defaultRule of DEFAULT_SCORING_RULES) {
        const rule = await this.createRule({ ...defaultRule, eventId })
        rules.push(rule)
      }

      return rules
    },

    async applyAction(
      contactId: string,
      action: ScoringAction,
      metadata?: Record<string, unknown>
    ): Promise<ScoreUpdateResult> {
      try {
        const contact = await getContact(contactId)
        const eventId = contact.eventId as string
        const currentScore = (contact.leadScore as number) || 0

        const rules = await this.getRules(eventId)
        const rule = findApplicableRule(rules, action)

        if (!rule) {
          return {
            success: true,
            contactId,
            previousScore: currentScore,
            newScore: currentScore,
            level: calculateLeadLevel(currentScore),
            pointsChange: 0
          }
        }

        const newScore = applyScoreChange(currentScore, rule.points)
        const level = calculateLeadLevel(newScore)

        await updateContactScore(contactId, newScore, level)

        // Update last activity timestamp
        await pb.collection('contacts').update(contactId, {
          lastActivityAt: new Date().toISOString()
        })

        const historyEntry = buildScoreHistoryEntry(
          contactId,
          rule,
          action,
          rule.points,
          currentScore,
          undefined,
          metadata
        )
        await logScoreChange(historyEntry)

        return {
          success: true,
          contactId,
          previousScore: currentScore,
          newScore,
          level,
          pointsChange: rule.points
        }
      } catch (error) {
        return {
          success: false,
          contactId,
          previousScore: 0,
          newScore: 0,
          level: 'cold',
          pointsChange: 0,
          error: error instanceof Error ? error.message : 'Failed to apply action'
        }
      }
    },

    async recalculateScore(contactId: string): Promise<ScoreUpdateResult> {
      try {
        const contact = await getContact(contactId)
        const currentScore = (contact.leadScore as number) || 0

        // Get all score history and sum up
        const history = await pb.collection('lead_score_history').getFullList({
          filter: safeFilter`contactId = ${contactId}`,
          sort: 'created'
        })

        let calculatedScore = 0
        for (const entry of history) {
          calculatedScore += entry.pointsChange as number
        }

        const level = calculateLeadLevel(calculatedScore)
        await updateContactScore(contactId, calculatedScore, level)

        return {
          success: true,
          contactId,
          previousScore: currentScore,
          newScore: calculatedScore,
          level,
          pointsChange: calculatedScore - currentScore
        }
      } catch (error) {
        return {
          success: false,
          contactId,
          previousScore: 0,
          newScore: 0,
          level: 'cold',
          pointsChange: 0,
          error: error instanceof Error ? error.message : 'Failed to recalculate score'
        }
      }
    },

    async adjustScore(
      contactId: string,
      points: number,
      description: string
    ): Promise<ScoreUpdateResult> {
      try {
        const contact = await getContact(contactId)
        const currentScore = (contact.leadScore as number) || 0
        const newScore = applyScoreChange(currentScore, points)
        const level = calculateLeadLevel(newScore)

        await updateContactScore(contactId, newScore, level)

        const historyEntry = buildScoreHistoryEntry(
          contactId,
          undefined,
          'manual_adjustment',
          points,
          currentScore,
          description
        )
        await logScoreChange(historyEntry)

        return {
          success: true,
          contactId,
          previousScore: currentScore,
          newScore,
          level,
          pointsChange: points
        }
      } catch (error) {
        return {
          success: false,
          contactId,
          previousScore: 0,
          newScore: 0,
          level: 'cold',
          pointsChange: 0,
          error: error instanceof Error ? error.message : 'Failed to adjust score'
        }
      }
    },

    async getScore(contactId: string): Promise<{ score: number; level: LeadScoreLevel }> {
      try {
        const contact = await getContact(contactId)
        const score = (contact.leadScore as number) || 0
        return {
          score,
          level: calculateLeadLevel(score)
        }
      } catch {
        return { score: 0, level: 'cold' }
      }
    },

    async getScoreHistory(contactId: string, limit = 50): Promise<LeadScoreHistory[]> {
      const records = await pb.collection('lead_score_history').getList(1, limit, {
        filter: safeFilter`contactId = ${contactId}`,
        sort: '-created'
      })

      return records.items.map(mapRecordToHistory)
    },

    async getTopContacts(
      eventId: string,
      limit = 20
    ): Promise<Array<{ contactId: string; score: number; level: LeadScoreLevel }>> {
      const records = await pb.collection('contacts').getList(1, limit, {
        filter: safeFilter`eventId = ${eventId}`,
        sort: '-leadScore',
        fields: 'id,leadScore,leadScoreLevel'
      })

      return records.items.map((r) => ({
        contactId: r.id,
        score: (r.leadScore as number) || 0,
        level: (r.leadScoreLevel as LeadScoreLevel) || 'cold'
      }))
    },

    async getContactsByLevel(eventId: string, level: LeadScoreLevel): Promise<string[]> {
      const records = await pb.collection('contacts').getFullList({
        filter: safeFilter`eventId = ${eventId} && leadScoreLevel = ${level}`,
        fields: 'id'
      })

      return records.map((r) => r.id)
    },

    async applyInactivityPenalties(
      eventId: string
    ): Promise<{ processed: number; updated: number }> {
      const rules = await this.getRules(eventId)
      const inactivityRules = rules.filter((r) => r.action === 'inactivity' && r.isActive)

      if (inactivityRules.length === 0) {
        return { processed: 0, updated: 0 }
      }

      const contacts = await pb.collection('contacts').getFullList({
        filter: safeFilter`eventId = ${eventId} && lastActivityAt != ""`,
        fields: 'id,leadScore,lastActivityAt,leadScoreUpdatedAt'
      })

      let updated = 0

      for (const contact of contacts) {
        const wasUpdated = await applyInactivityPenaltyToContact(contact, inactivityRules)
        if (wasUpdated) {
          updated++
        }
      }

      return { processed: contacts.length, updated }
    }
  }
}

function mapRecordToRule(record: Record<string, unknown>): LeadScoringRule {
  return {
    id: record.id as string,
    eventId: record.eventId as string,
    name: record.name as string,
    action: record.action as ScoringAction,
    points: record.points as number,
    inactivityDays: record.inactivityDays as number | undefined,
    isActive: (record.isActive as boolean) ?? true,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

function mapRecordToHistory(record: Record<string, unknown>): LeadScoreHistory {
  return {
    id: record.id as string,
    contactId: record.contactId as string,
    ruleId: record.ruleId as string | undefined,
    action: record.action as ScoringAction,
    pointsChange: record.pointsChange as number,
    previousScore: record.previousScore as number,
    newScore: record.newScore as number,
    description: record.description as string | undefined,
    metadata: record.metadata as Record<string, unknown> | undefined,
    createdAt: new Date(record.created as string)
  }
}
