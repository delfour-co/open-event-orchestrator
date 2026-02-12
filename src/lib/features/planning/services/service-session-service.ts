/**
 * Service Session Service
 *
 * Handles CRUD operations for service sessions (breaks, meals, etc.)
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type CreateServiceSession,
  type ServiceSession,
  type ServiceSessionType,
  type UpdateServiceSession,
  createFromTemplate,
  filterPublicSessions,
  filterSessionsByRoom,
  getServiceSessionTemplate,
  groupSessionsByDate,
  sortServiceSessions
} from '../domain/service-session'

export interface ServiceSessionService {
  /**
   * Create a new service session
   */
  create(input: CreateServiceSession): Promise<ServiceSession>

  /**
   * Create a service session from a template
   */
  createFromTemplate(
    editionId: string,
    type: ServiceSessionType,
    date: Date,
    startTime: string,
    overrides?: Partial<CreateServiceSession>
  ): Promise<ServiceSession>

  /**
   * Update a service session
   */
  update(id: string, input: UpdateServiceSession): Promise<ServiceSession>

  /**
   * Delete a service session
   */
  remove(id: string): Promise<void>

  /**
   * Get a service session by ID
   */
  getById(id: string): Promise<ServiceSession | null>

  /**
   * List all service sessions for an edition
   */
  listByEdition(editionId: string): Promise<ServiceSession[]>

  /**
   * List service sessions for a specific date
   */
  listByDate(editionId: string, date: Date): Promise<ServiceSession[]>

  /**
   * List service sessions visible for a specific room
   */
  listForRoom(editionId: string, roomId: string): Promise<ServiceSession[]>

  /**
   * List only public service sessions (for export)
   */
  listPublic(editionId: string): Promise<ServiceSession[]>

  /**
   * Duplicate a service session to another date
   */
  duplicate(id: string, newDate: Date): Promise<ServiceSession>

  /**
   * Bulk create service sessions for multiple dates
   */
  bulkCreateForDates(
    editionId: string,
    type: ServiceSessionType,
    dates: Date[],
    startTime: string,
    overrides?: Partial<CreateServiceSession>
  ): Promise<ServiceSession[]>

  /**
   * Get service sessions grouped by date
   */
  getGroupedByDate(editionId: string): Promise<Map<string, ServiceSession[]>>
}

export const createServiceSessionService = (pb: PocketBase): ServiceSessionService => {
  function mapRecordToServiceSession(record: Record<string, unknown>): ServiceSession {
    return {
      id: record.id as string,
      editionId: record.editionId as string,
      type: record.type as ServiceSessionType,
      title: record.title as string,
      description: record.description as string | undefined,
      icon: record.icon as ServiceSession['icon'],
      color: record.color as string | undefined,
      date: new Date(record.date as string),
      startTime: record.startTime as string,
      endTime: record.endTime as string,
      isGlobal: (record.isGlobal as boolean) ?? true,
      roomIds: record.roomIds as string[] | undefined,
      isPublic: (record.isPublic as boolean) ?? true,
      sortOrder: (record.sortOrder as number) ?? 0,
      createdAt: new Date(record.created as string),
      updatedAt: new Date(record.updated as string)
    }
  }

  return {
    async create(input: CreateServiceSession): Promise<ServiceSession> {
      const data = {
        editionId: input.editionId,
        type: input.type,
        title: input.title,
        description: input.description || null,
        icon: input.icon || null,
        color: input.color || null,
        date: input.date.toISOString(),
        startTime: input.startTime,
        endTime: input.endTime,
        isGlobal: input.isGlobal ?? true,
        roomIds: input.roomIds || null,
        isPublic: input.isPublic ?? true,
        sortOrder: input.sortOrder ?? 0
      }

      const record = await pb.collection('service_sessions').create(data)
      return mapRecordToServiceSession(record)
    },

    async createFromTemplate(
      editionId: string,
      type: ServiceSessionType,
      date: Date,
      startTime: string,
      overrides?: Partial<CreateServiceSession>
    ): Promise<ServiceSession> {
      const input = createFromTemplate(type, editionId, date, startTime, overrides)
      return this.create(input)
    },

    async update(id: string, input: UpdateServiceSession): Promise<ServiceSession> {
      const data: Record<string, unknown> = {}

      if (input.title !== undefined) data.title = input.title
      if (input.description !== undefined) data.description = input.description || null
      if (input.type !== undefined) data.type = input.type
      if (input.icon !== undefined) data.icon = input.icon || null
      if (input.color !== undefined) data.color = input.color || null
      if (input.date !== undefined) data.date = input.date.toISOString()
      if (input.startTime !== undefined) data.startTime = input.startTime
      if (input.endTime !== undefined) data.endTime = input.endTime
      if (input.isGlobal !== undefined) data.isGlobal = input.isGlobal
      if (input.roomIds !== undefined) data.roomIds = input.roomIds || null
      if (input.isPublic !== undefined) data.isPublic = input.isPublic
      if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder

      const record = await pb.collection('service_sessions').update(id, data)
      return mapRecordToServiceSession(record)
    },

    async remove(id: string): Promise<void> {
      await pb.collection('service_sessions').delete(id)
    },

    async getById(id: string): Promise<ServiceSession | null> {
      try {
        const record = await pb.collection('service_sessions').getOne(id)
        return mapRecordToServiceSession(record)
      } catch {
        return null
      }
    },

    async listByEdition(editionId: string): Promise<ServiceSession[]> {
      const records = await pb.collection('service_sessions').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        sort: 'date,startTime,sortOrder'
      })
      return records.map(mapRecordToServiceSession)
    },

    async listByDate(editionId: string, date: Date): Promise<ServiceSession[]> {
      const dateStr = date.toISOString().split('T')[0]
      const records = await pb.collection('service_sessions').getFullList({
        filter: safeFilter`editionId = ${editionId} && date ~ ${dateStr}`,
        sort: 'startTime,sortOrder'
      })
      return records.map(mapRecordToServiceSession)
    },

    async listForRoom(editionId: string, roomId: string): Promise<ServiceSession[]> {
      const allSessions = await this.listByEdition(editionId)
      return filterSessionsByRoom(allSessions, roomId)
    },

    async listPublic(editionId: string): Promise<ServiceSession[]> {
      const allSessions = await this.listByEdition(editionId)
      return sortServiceSessions(filterPublicSessions(allSessions))
    },

    async duplicate(id: string, newDate: Date): Promise<ServiceSession> {
      const original = await this.getById(id)
      if (!original) {
        throw new Error('Service session not found')
      }

      return this.create({
        editionId: original.editionId,
        type: original.type,
        title: original.title,
        description: original.description,
        icon: original.icon,
        color: original.color,
        date: newDate,
        startTime: original.startTime,
        endTime: original.endTime,
        isGlobal: original.isGlobal,
        roomIds: original.roomIds,
        isPublic: original.isPublic,
        sortOrder: original.sortOrder
      })
    },

    async bulkCreateForDates(
      editionId: string,
      type: ServiceSessionType,
      dates: Date[],
      startTime: string,
      overrides?: Partial<CreateServiceSession>
    ): Promise<ServiceSession[]> {
      const template = getServiceSessionTemplate(type)
      const created: ServiceSession[] = []

      for (const date of dates) {
        const session = await this.createFromTemplate(editionId, type, date, startTime, {
          ...overrides,
          title: overrides?.title || template.title
        })
        created.push(session)
      }

      return created
    },

    async getGroupedByDate(editionId: string): Promise<Map<string, ServiceSession[]>> {
      const sessions = await this.listByEdition(editionId)
      return groupSessionsByDate(sessions)
    }
  }
}

export type { ServiceSession, CreateServiceSession, UpdateServiceSession, ServiceSessionType }
