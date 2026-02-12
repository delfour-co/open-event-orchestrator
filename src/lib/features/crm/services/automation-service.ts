/**
 * Email Automation Service
 *
 * Manages automation workflows, enrollments, and step execution.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type Automation,
  type AutomationEnrollment,
  type AutomationLog,
  type AutomationStatus,
  type AutomationStep,
  type AutomationStepType,
  type AutomationTriggerType,
  type ConditionConfig,
  type CreateAutomation,
  type CreateAutomationStep,
  type StepConfig,
  type StepExecutionStatus,
  type TriggerConfig,
  type UpdateAutomation,
  type UpdateAutomationStep,
  type WaitConfig,
  calculateWaitEndTime,
  canActivateAutomation,
  doesTriggerMatch,
  evaluateCondition,
  getNextStep,
  validateStepConfig
} from '../domain/automation'

export interface AutomationService {
  // Automation CRUD
  create(input: CreateAutomation): Promise<Automation>
  update(id: string, updates: UpdateAutomation): Promise<Automation>
  delete(id: string): Promise<void>
  get(id: string): Promise<Automation | null>
  getByEvent(eventId: string, status?: AutomationStatus): Promise<Automation[]>

  // Step management
  createStep(input: CreateAutomationStep): Promise<AutomationStep>
  updateStep(id: string, updates: UpdateAutomationStep): Promise<AutomationStep>
  deleteStep(id: string): Promise<void>
  getSteps(automationId: string): Promise<AutomationStep[]>
  reorderSteps(automationId: string, stepIds: string[]): Promise<void>
  setStartStep(automationId: string, stepId: string): Promise<void>

  // Lifecycle
  activate(id: string): Promise<{ success: boolean; error?: string }>
  pause(id: string): Promise<void>
  duplicate(id: string, name: string): Promise<Automation>

  // Enrollment
  enrollContact(automationId: string, contactId: string): Promise<AutomationEnrollment>
  exitEnrollment(enrollmentId: string, reason: string): Promise<void>
  getEnrollments(automationId: string): Promise<AutomationEnrollment[]>
  getContactEnrollments(contactId: string): Promise<AutomationEnrollment[]>

  // Execution
  processEnrollment(enrollmentId: string): Promise<void>
  processWaitingEnrollments(): Promise<number>

  // Triggers
  handleTrigger(
    triggerType: AutomationTriggerType,
    eventData: Record<string, unknown>,
    eventId: string,
    editionId?: string
  ): Promise<string[]>

  // Logs
  getLogs(
    automationId: string,
    options?: { contactId?: string; limit?: number }
  ): Promise<AutomationLog[]>
}

export function createAutomationService(pb: PocketBase): AutomationService {
  async function getAutomationRecord(id: string): Promise<Automation | null> {
    try {
      const record = await pb.collection('automations').getOne(id)
      return mapRecordToAutomation(record)
    } catch {
      return null
    }
  }

  async function getStepRecords(automationId: string): Promise<AutomationStep[]> {
    const records = await pb.collection('automation_steps').getFullList({
      filter: safeFilter`automationId = ${automationId}`,
      sort: 'position'
    })
    return records.map(mapRecordToStep)
  }

  async function logStepExecution(
    automationId: string,
    enrollmentId: string,
    contactId: string,
    step: AutomationStep,
    status: StepExecutionStatus,
    input?: Record<string, unknown>,
    output?: Record<string, unknown>,
    error?: string
  ): Promise<void> {
    await pb.collection('automation_logs').create({
      automationId,
      enrollmentId,
      contactId,
      stepId: step.id,
      stepType: step.type,
      status,
      input: input || null,
      output: output || null,
      error: error || null,
      executedAt: new Date().toISOString()
    })
  }

  type StepExecutionResult = {
    status: StepExecutionStatus
    output?: Record<string, unknown>
    error?: string
    waitUntil?: Date
    nextStepId?: string
  }

  async function executeSendEmailStep(config: StepConfig): Promise<StepExecutionResult> {
    return {
      status: 'completed',
      output: { templateId: (config as { templateId: string }).templateId }
    }
  }

  function executeWaitStep(config: StepConfig): StepExecutionResult {
    const waitConfig = config as WaitConfig
    const waitUntil = calculateWaitEndTime(new Date(), waitConfig.duration, waitConfig.unit)
    return { status: 'completed', waitUntil }
  }

  async function executeConditionStep(
    config: StepConfig,
    contactId: string
  ): Promise<StepExecutionResult> {
    const condConfig = config as ConditionConfig
    try {
      const contact = await pb.collection('contacts').getOne(contactId)
      const contactTags = (contact.tags as string[]) || []
      const segmentIds: string[] = []

      const result = evaluateCondition(condConfig, contact, contactTags, segmentIds)
      const nextStepId = result ? condConfig.trueBranchStepId : condConfig.falseBranchStepId

      return { status: 'completed', output: { conditionResult: result }, nextStepId }
    } catch {
      return { status: 'failed', error: 'Failed to evaluate condition' }
    }
  }

  async function executeAddTagStep(
    config: StepConfig,
    contactId: string
  ): Promise<StepExecutionResult> {
    const tagConfig = config as { tagId: string }
    try {
      const contact = await pb.collection('contacts').getOne(contactId)
      const currentTags = (contact.tags as string[]) || []
      if (!currentTags.includes(tagConfig.tagId)) {
        await pb.collection('contacts').update(contactId, {
          tags: [...currentTags, tagConfig.tagId]
        })
      }
      return { status: 'completed', output: { tagId: tagConfig.tagId } }
    } catch {
      return { status: 'failed', error: 'Failed to add tag' }
    }
  }

  async function executeRemoveTagStep(
    config: StepConfig,
    contactId: string
  ): Promise<StepExecutionResult> {
    const tagConfig = config as { tagId: string }
    try {
      const contact = await pb.collection('contacts').getOne(contactId)
      const currentTags = (contact.tags as string[]) || []
      await pb.collection('contacts').update(contactId, {
        tags: currentTags.filter((t) => t !== tagConfig.tagId)
      })
      return { status: 'completed', output: { tagId: tagConfig.tagId } }
    } catch {
      return { status: 'failed', error: 'Failed to remove tag' }
    }
  }

  async function executeUpdateFieldStep(
    config: StepConfig,
    contactId: string
  ): Promise<StepExecutionResult> {
    const fieldConfig = config as { fieldName: string; value: unknown }
    try {
      await pb.collection('contacts').update(contactId, {
        [fieldConfig.fieldName]: fieldConfig.value
      })
      return {
        status: 'completed',
        output: { field: fieldConfig.fieldName, value: fieldConfig.value }
      }
    } catch {
      return { status: 'failed', error: 'Failed to update field' }
    }
  }

  function executeWebhookStep(config: StepConfig): StepExecutionResult {
    const webhookConfig = config as { url: string }
    return { status: 'completed', output: { url: webhookConfig.url } }
  }

  async function executeStep(
    step: AutomationStep,
    enrollment: AutomationEnrollment
  ): Promise<StepExecutionResult> {
    const config = step.config as StepConfig
    const contactId = enrollment.contactId

    switch (step.type) {
      case 'send_email':
        return executeSendEmailStep(config)
      case 'wait':
        return executeWaitStep(config)
      case 'condition':
        return executeConditionStep(config, contactId)
      case 'add_tag':
        return executeAddTagStep(config, contactId)
      case 'remove_tag':
        return executeRemoveTagStep(config, contactId)
      case 'update_field':
        return executeUpdateFieldStep(config, contactId)
      case 'webhook':
        return executeWebhookStep(config)
      default:
        return { status: 'failed', error: `Unknown step type: ${step.type}` }
    }
  }

  // Helper interface for duplication context
  interface DuplicationContext {
    createStep: (input: CreateAutomationStep) => Promise<AutomationStep>
    updateStep: (id: string, updates: UpdateAutomationStep) => Promise<AutomationStep>
    setStartStep: (automationId: string, stepId: string) => Promise<void>
  }

  async function duplicateSteps(
    ctx: DuplicationContext,
    newAutomationId: string,
    steps: AutomationStep[]
  ): Promise<Map<string, string>> {
    const stepIdMap = new Map<string, string>()
    for (const step of steps) {
      const newStep = await ctx.createStep({
        automationId: newAutomationId,
        type: step.type,
        name: step.name,
        config: step.config as StepConfig,
        position: step.position
      })
      stepIdMap.set(step.id, newStep.id)
    }
    return stepIdMap
  }

  async function updateStepReferences(
    ctx: DuplicationContext,
    steps: AutomationStep[],
    stepIdMap: Map<string, string>
  ): Promise<void> {
    for (const step of steps) {
      if (!step.nextStepId) continue
      const newStepId = stepIdMap.get(step.id)
      const newNextStepId = stepIdMap.get(step.nextStepId)
      if (newStepId && newNextStepId) {
        await ctx.updateStep(newStepId, { nextStepId: newNextStepId })
      }
    }
  }

  async function setDuplicatedStartStep(
    ctx: DuplicationContext,
    newAutomationId: string,
    originalStartStepId: string | undefined,
    stepIdMap: Map<string, string>
  ): Promise<void> {
    if (!originalStartStepId) return
    const newStartStepId = stepIdMap.get(originalStartStepId)
    if (newStartStepId) {
      await ctx.setStartStep(newAutomationId, newStartStepId)
    }
  }

  async function completeEnrollment(enrollmentId: string, automation: Automation): Promise<void> {
    await pb.collection('automation_enrollments').update(enrollmentId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    })
    await pb.collection('automations').update(automation.id, {
      completedCount: automation.completedCount + 1
    })
  }

  async function runStepWithLogging(
    automation: Automation,
    enrollmentId: string,
    enrollment: AutomationEnrollment,
    currentStep: AutomationStep
  ): Promise<StepExecutionResult> {
    await logStepExecution(
      automation.id,
      enrollmentId,
      enrollment.contactId,
      currentStep,
      'executing'
    )

    const result = await executeStep(currentStep, enrollment)

    await logStepExecution(
      automation.id,
      enrollmentId,
      enrollment.contactId,
      currentStep,
      result.status,
      undefined,
      result.output,
      result.error
    )

    return result
  }

  interface ProcessEnrollmentContext {
    processEnrollment: (enrollmentId: string) => Promise<void>
  }

  async function advanceToNextStep(
    ctx: ProcessEnrollmentContext,
    enrollmentId: string,
    result: StepExecutionResult,
    currentStep: AutomationStep,
    steps: AutomationStep[],
    automation: Automation
  ): Promise<void> {
    const nextStepId = result.nextStepId || getNextStep(currentStep, steps)?.id

    if (nextStepId) {
      await pb.collection('automation_enrollments').update(enrollmentId, {
        currentStepId: nextStepId
      })
      await ctx.processEnrollment(enrollmentId)
    } else {
      await pb.collection('automation_enrollments').update(enrollmentId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        currentStepId: ''
      })
      await pb.collection('automations').update(automation.id, {
        completedCount: automation.completedCount + 1
      })
    }
  }

  return {
    async create(input: CreateAutomation): Promise<Automation> {
      const record = await pb.collection('automations').create({
        eventId: input.eventId,
        editionId: input.editionId || '',
        name: input.name,
        description: input.description || '',
        triggerType: input.triggerType,
        triggerConfig: input.triggerConfig,
        status: 'draft',
        enrollmentCount: 0,
        completedCount: 0,
        createdBy: input.createdBy || ''
      })

      return mapRecordToAutomation(record)
    },

    async update(id: string, updates: UpdateAutomation): Promise<Automation> {
      const data: Record<string, unknown> = {}
      if (updates.name !== undefined) data.name = updates.name
      if (updates.description !== undefined) data.description = updates.description
      if (updates.triggerConfig !== undefined) data.triggerConfig = updates.triggerConfig

      const record = await pb.collection('automations').update(id, data)
      return mapRecordToAutomation(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('automations').delete(id)
    },

    async get(id: string): Promise<Automation | null> {
      return getAutomationRecord(id)
    },

    async getByEvent(eventId: string, status?: AutomationStatus): Promise<Automation[]> {
      const filters = [safeFilter`eventId = ${eventId}`]
      if (status) {
        filters.push(safeFilter`status = ${status}`)
      }

      const records = await pb.collection('automations').getFullList({
        filter: filters.join(' && '),
        sort: '-created'
      })

      return records.map(mapRecordToAutomation)
    },

    async createStep(input: CreateAutomationStep): Promise<AutomationStep> {
      const validation = validateStepConfig(input.type, input.config as Record<string, unknown>)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const record = await pb.collection('automation_steps').create({
        automationId: input.automationId,
        type: input.type,
        name: input.name || '',
        config: input.config,
        position: input.position,
        nextStepId: input.nextStepId || ''
      })

      return mapRecordToStep(record)
    },

    async updateStep(id: string, updates: UpdateAutomationStep): Promise<AutomationStep> {
      const data: Record<string, unknown> = {}
      if (updates.name !== undefined) data.name = updates.name
      if (updates.config !== undefined) data.config = updates.config
      if (updates.nextStepId !== undefined) {
        data.nextStepId = updates.nextStepId ?? ''
      }

      const record = await pb.collection('automation_steps').update(id, data)
      return mapRecordToStep(record)
    },

    async deleteStep(id: string): Promise<void> {
      await pb.collection('automation_steps').delete(id)
    },

    async getSteps(automationId: string): Promise<AutomationStep[]> {
      return getStepRecords(automationId)
    },

    async reorderSteps(_automationId: string, stepIds: string[]): Promise<void> {
      await Promise.all(
        stepIds.map((id, index) =>
          pb.collection('automation_steps').update(id, { position: index })
        )
      )
    },

    async setStartStep(automationId: string, stepId: string): Promise<void> {
      await pb.collection('automations').update(automationId, { startStepId: stepId })
    },

    async activate(id: string): Promise<{ success: boolean; error?: string }> {
      const automation = await getAutomationRecord(id)
      if (!automation) {
        return { success: false, error: 'Automation not found' }
      }

      const steps = await getStepRecords(id)
      const canActivate = canActivateAutomation(automation, steps)

      if (!canActivate.can) {
        return { success: false, error: canActivate.reason }
      }

      await pb.collection('automations').update(id, { status: 'active' })
      return { success: true }
    },

    async pause(id: string): Promise<void> {
      await pb.collection('automations').update(id, { status: 'paused' })
    },

    async duplicate(id: string, name: string): Promise<Automation> {
      const automation = await getAutomationRecord(id)
      if (!automation) {
        throw new Error('Automation not found')
      }

      const steps = await getStepRecords(id)
      const newAutomation = await this.create({
        eventId: automation.eventId,
        editionId: automation.editionId,
        name,
        description: automation.description,
        triggerType: automation.triggerType,
        triggerConfig: automation.triggerConfig as TriggerConfig
      })

      const stepIdMap = await duplicateSteps(this, newAutomation.id, steps)
      await updateStepReferences(this, steps, stepIdMap)
      await setDuplicatedStartStep(this, newAutomation.id, automation.startStepId, stepIdMap)

      const duplicated = await getAutomationRecord(newAutomation.id)
      if (!duplicated) {
        throw new Error('Failed to retrieve duplicated automation')
      }
      return duplicated
    },

    async enrollContact(automationId: string, contactId: string): Promise<AutomationEnrollment> {
      const automation = await getAutomationRecord(automationId)
      if (!automation) {
        throw new Error('Automation not found')
      }

      if (automation.status !== 'active') {
        throw new Error('Automation is not active')
      }

      // Check if contact is already enrolled
      try {
        const existing = await pb
          .collection('automation_enrollments')
          .getFirstListItem(
            safeFilter`automationId = ${automationId} && contactId = ${contactId} && status = ${'active'}`
          )
        if (existing) {
          throw new Error('Contact is already enrolled in this automation')
        }
      } catch {
        // Not found, proceed
      }

      const record = await pb.collection('automation_enrollments').create({
        automationId,
        contactId,
        currentStepId: automation.startStepId || '',
        status: 'active',
        startedAt: new Date().toISOString()
      })

      // Increment enrollment count
      await pb.collection('automations').update(automationId, {
        enrollmentCount: automation.enrollmentCount + 1
      })

      return mapRecordToEnrollment(record)
    },

    async exitEnrollment(enrollmentId: string, reason: string): Promise<void> {
      await pb.collection('automation_enrollments').update(enrollmentId, {
        status: 'exited',
        exitedAt: new Date().toISOString(),
        exitReason: reason
      })
    },

    async getEnrollments(automationId: string): Promise<AutomationEnrollment[]> {
      const records = await pb.collection('automation_enrollments').getFullList({
        filter: safeFilter`automationId = ${automationId}`,
        sort: '-startedAt'
      })

      return records.map(mapRecordToEnrollment)
    },

    async getContactEnrollments(contactId: string): Promise<AutomationEnrollment[]> {
      const records = await pb.collection('automation_enrollments').getFullList({
        filter: safeFilter`contactId = ${contactId}`,
        sort: '-startedAt'
      })

      return records.map(mapRecordToEnrollment)
    },

    async processEnrollment(enrollmentId: string): Promise<void> {
      const enrollmentRecord = await pb.collection('automation_enrollments').getOne(enrollmentId)
      const enrollment = mapRecordToEnrollment(enrollmentRecord)

      if (enrollment.status !== 'active') return

      const automation = await getAutomationRecord(enrollment.automationId)
      if (!automation || automation.status !== 'active') return

      if (!enrollment.currentStepId) {
        await completeEnrollment(enrollmentId, automation)
        return
      }

      const steps = await getStepRecords(automation.id)
      const currentStep = steps.find((s) => s.id === enrollment.currentStepId)

      if (!currentStep) {
        await this.exitEnrollment(enrollmentId, 'Step not found')
        return
      }

      const result = await runStepWithLogging(automation, enrollmentId, enrollment, currentStep)

      if (result.status === 'failed') {
        await pb.collection('automation_enrollments').update(enrollmentId, { status: 'failed' })
        return
      }

      if (result.waitUntil) {
        await pb.collection('automation_enrollments').update(enrollmentId, {
          waitUntil: result.waitUntil.toISOString()
        })
        return
      }

      await advanceToNextStep(this, enrollmentId, result, currentStep, steps, automation)
    },

    async processWaitingEnrollments(): Promise<number> {
      const now = new Date().toISOString()

      const records = await pb.collection('automation_enrollments').getFullList({
        filter: safeFilter`status = ${'active'} && waitUntil != "" && waitUntil <= ${now}`
      })

      for (const record of records) {
        // Clear wait and continue processing
        await pb.collection('automation_enrollments').update(record.id, {
          waitUntil: null
        })

        const enrollment = mapRecordToEnrollment(record)
        const automation = await getAutomationRecord(enrollment.automationId)

        if (automation?.status === 'active') {
          const steps = await getStepRecords(automation.id)
          const currentStep = steps.find((s) => s.id === enrollment.currentStepId)

          if (currentStep) {
            // Move to next step after wait
            const nextStep = getNextStep(currentStep, steps)
            if (nextStep) {
              await pb.collection('automation_enrollments').update(record.id, {
                currentStepId: nextStep.id
              })
              await this.processEnrollment(record.id)
            } else {
              // No more steps
              await pb.collection('automation_enrollments').update(record.id, {
                status: 'completed',
                completedAt: new Date().toISOString(),
                currentStepId: ''
              })
              await pb.collection('automations').update(automation.id, {
                completedCount: automation.completedCount + 1
              })
            }
          }
        }
      }

      return records.length
    },

    async handleTrigger(
      triggerType: AutomationTriggerType,
      eventData: Record<string, unknown>,
      eventId: string,
      editionId?: string
    ): Promise<string[]> {
      const enrollmentIds: string[] = []

      // Find active automations matching trigger
      const filters = [
        safeFilter`eventId = ${eventId}`,
        safeFilter`status = ${'active'}`,
        safeFilter`triggerType = ${triggerType}`
      ]
      if (editionId) {
        filters.push(safeFilter`(editionId = ${editionId} || editionId = "")`)
      }

      const automations = await pb.collection('automations').getFullList({
        filter: filters.join(' && ')
      })

      const contactId = eventData.contactId as string
      if (!contactId) {
        return enrollmentIds
      }

      for (const record of automations) {
        const automation = mapRecordToAutomation(record)
        const triggerConfig = automation.triggerConfig as TriggerConfig

        if (doesTriggerMatch(triggerConfig, triggerType, eventData)) {
          try {
            const enrollment = await this.enrollContact(automation.id, contactId)
            enrollmentIds.push(enrollment.id)

            // Start processing
            await this.processEnrollment(enrollment.id)
          } catch {
            // Contact might already be enrolled
          }
        }
      }

      return enrollmentIds
    },

    async getLogs(
      automationId: string,
      options?: { contactId?: string; limit?: number }
    ): Promise<AutomationLog[]> {
      const filters = [safeFilter`automationId = ${automationId}`]
      if (options?.contactId) {
        filters.push(safeFilter`contactId = ${options.contactId}`)
      }

      const records = await pb.collection('automation_logs').getList(1, options?.limit || 100, {
        filter: filters.join(' && '),
        sort: '-executedAt'
      })

      return records.items.map(mapRecordToLog)
    }
  }
}

function mapRecordToAutomation(record: Record<string, unknown>): Automation {
  return {
    id: record.id as string,
    eventId: record.eventId as string,
    editionId: (record.editionId as string) || undefined,
    name: record.name as string,
    description: (record.description as string) || undefined,
    triggerType: record.triggerType as AutomationTriggerType,
    triggerConfig: record.triggerConfig as Record<string, unknown>,
    status: (record.status as AutomationStatus) || 'draft',
    startStepId: (record.startStepId as string) || undefined,
    enrollmentCount: (record.enrollmentCount as number) || 0,
    completedCount: (record.completedCount as number) || 0,
    createdBy: (record.createdBy as string) || undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

function mapRecordToStep(record: Record<string, unknown>): AutomationStep {
  return {
    id: record.id as string,
    automationId: record.automationId as string,
    type: record.type as AutomationStepType,
    name: (record.name as string) || undefined,
    config: record.config as Record<string, unknown>,
    position: (record.position as number) || 0,
    nextStepId: (record.nextStepId as string) || undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

function mapRecordToEnrollment(record: Record<string, unknown>): AutomationEnrollment {
  return {
    id: record.id as string,
    automationId: record.automationId as string,
    contactId: record.contactId as string,
    currentStepId: (record.currentStepId as string) || undefined,
    status: record.status as AutomationEnrollment['status'],
    startedAt: new Date(record.startedAt as string),
    completedAt: record.completedAt ? new Date(record.completedAt as string) : undefined,
    exitedAt: record.exitedAt ? new Date(record.exitedAt as string) : undefined,
    exitReason: (record.exitReason as string) || undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}

function mapRecordToLog(record: Record<string, unknown>): AutomationLog {
  return {
    id: record.id as string,
    automationId: record.automationId as string,
    enrollmentId: record.enrollmentId as string,
    contactId: record.contactId as string,
    stepId: record.stepId as string,
    stepType: record.stepType as AutomationStepType,
    status: record.status as StepExecutionStatus,
    input: (record.input as Record<string, unknown>) || undefined,
    output: (record.output as Record<string, unknown>) || undefined,
    error: (record.error as string) || undefined,
    executedAt: new Date(record.executedAt as string),
    createdAt: new Date(record.created as string)
  }
}
