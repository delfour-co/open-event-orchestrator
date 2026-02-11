/**
 * Template Library Service
 *
 * Manages email templates with organization, cloning, and pre-built templates.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type CreateLibraryTemplate,
  type LibraryTemplate,
  type TemplateCategory,
  type TemplateSearchOptions,
  type UpdateLibraryTemplate,
  generateCloneName
} from '../domain/template-library'

export interface TemplateLibraryService {
  create(input: CreateLibraryTemplate): Promise<LibraryTemplate>
  update(id: string, updates: UpdateLibraryTemplate): Promise<LibraryTemplate>
  delete(id: string): Promise<void>
  getById(id: string): Promise<LibraryTemplate | null>
  getByEvent(eventId: string, options?: TemplateSearchOptions): Promise<LibraryTemplate[]>
  getGlobalTemplates(options?: TemplateSearchOptions): Promise<LibraryTemplate[]>
  search(eventId: string | null, options: TemplateSearchOptions): Promise<LibraryTemplate[]>
  clone(id: string, eventId?: string): Promise<LibraryTemplate>
  toggleFavorite(id: string): Promise<LibraryTemplate>
  togglePinned(id: string): Promise<LibraryTemplate>
  incrementUsage(id: string): Promise<void>
  getCategories(): TemplateCategory[]
  getAllTags(eventId?: string): Promise<string[]>
  cloneCampaign(campaignId: string): Promise<string>
}

export function createTemplateLibraryService(pb: PocketBase): TemplateLibraryService {
  return {
    async create(input: CreateLibraryTemplate): Promise<LibraryTemplate> {
      const record = await pb.collection('library_templates').create({
        eventId: input.eventId || '',
        name: input.name,
        description: input.description || '',
        category: input.category,
        subject: input.subject,
        htmlContent: input.htmlContent,
        textContent: input.textContent || '',
        tags: input.tags || [],
        isGlobal: input.isGlobal || false,
        isFavorite: false,
        isPinned: false,
        usageCount: 0,
        createdBy: input.createdBy || ''
      })

      return mapRecordToTemplate(record)
    },

    async update(id: string, updates: UpdateLibraryTemplate): Promise<LibraryTemplate> {
      const record = await pb.collection('library_templates').update(id, updates)
      return mapRecordToTemplate(record)
    },

    async delete(id: string): Promise<void> {
      await pb.collection('library_templates').delete(id)
    },

    async getById(id: string): Promise<LibraryTemplate | null> {
      try {
        const record = await pb.collection('library_templates').getOne(id)
        return mapRecordToTemplate(record)
      } catch {
        return null
      }
    },

    async getByEvent(
      eventId: string,
      options: TemplateSearchOptions = {}
    ): Promise<LibraryTemplate[]> {
      const filters = [safeFilter`eventId = ${eventId}`]
      addSearchFilters(filters, options)

      const records = await pb.collection('library_templates').getFullList({
        filter: filters.join(' && '),
        sort: '-isPinned,-isFavorite,-usageCount,created'
      })

      return records.map(mapRecordToTemplate)
    },

    async getGlobalTemplates(options: TemplateSearchOptions = {}): Promise<LibraryTemplate[]> {
      const filters = ['isGlobal = true']
      addSearchFilters(filters, options)

      const records = await pb.collection('library_templates').getFullList({
        filter: filters.join(' && '),
        sort: '-isPinned,-isFavorite,-usageCount,created'
      })

      return records.map(mapRecordToTemplate)
    },

    async search(
      eventId: string | null,
      options: TemplateSearchOptions
    ): Promise<LibraryTemplate[]> {
      const filters: string[] = []

      if (eventId) {
        filters.push(`(${safeFilter`eventId = ${eventId}`} || isGlobal = true)`)
      } else {
        filters.push('isGlobal = true')
      }

      addSearchFilters(filters, options)

      const records = await pb.collection('library_templates').getFullList({
        filter: filters.join(' && '),
        sort: '-isPinned,-isFavorite,-usageCount,created'
      })

      return records.map(mapRecordToTemplate)
    },

    async clone(id: string, eventId?: string): Promise<LibraryTemplate> {
      const original = await this.getById(id)
      if (!original) {
        throw new Error('Template not found')
      }

      const clonedTemplate = await this.create({
        eventId: eventId || original.eventId,
        name: generateCloneName(original.name),
        description: original.description,
        category: original.category,
        subject: original.subject,
        htmlContent: original.htmlContent,
        textContent: original.textContent,
        tags: [...original.tags],
        isGlobal: false
      })

      return clonedTemplate
    },

    async toggleFavorite(id: string): Promise<LibraryTemplate> {
      const template = await this.getById(id)
      if (!template) {
        throw new Error('Template not found')
      }

      return this.update(id, { isFavorite: !template.isFavorite })
    },

    async togglePinned(id: string): Promise<LibraryTemplate> {
      const template = await this.getById(id)
      if (!template) {
        throw new Error('Template not found')
      }

      return this.update(id, { isPinned: !template.isPinned })
    },

    async incrementUsage(id: string): Promise<void> {
      const template = await this.getById(id)
      if (!template) return

      await pb.collection('library_templates').update(id, {
        usageCount: template.usageCount + 1
      })
    },

    getCategories(): TemplateCategory[] {
      return [
        'invitation',
        'confirmation',
        'reminder',
        'thank_you',
        'newsletter',
        'cfp',
        'speaker',
        'sponsor',
        'custom'
      ]
    },

    async getAllTags(eventId?: string): Promise<string[]> {
      const filters: string[] = []
      if (eventId) {
        filters.push(`(${safeFilter`eventId = ${eventId}`} || isGlobal = true)`)
      }

      const records = await pb.collection('library_templates').getFullList({
        filter: filters.length > 0 ? filters.join(' && ') : undefined,
        fields: 'tags'
      })

      const allTags = records.flatMap((r) => (r.tags as string[]) || [])
      return [...new Set(allTags)].sort()
    },

    async cloneCampaign(campaignId: string): Promise<string> {
      const original = await pb.collection('email_campaigns').getOne(campaignId)

      const clonedCampaign = await pb.collection('email_campaigns').create({
        eventId: original.eventId,
        editionId: original.editionId,
        name: generateCloneName(original.name as string),
        subject: original.subject,
        htmlContent: original.htmlContent,
        textContent: original.textContent || '',
        segmentId: original.segmentId || '',
        status: 'draft',
        scheduledAt: null,
        sentAt: null,
        recipientCount: 0,
        deliveredCount: 0,
        openedCount: 0,
        clickedCount: 0,
        bouncedCount: 0,
        unsubscribedCount: 0
      })

      return clonedCampaign.id
    }
  }
}

function addSearchFilters(filters: string[], options: TemplateSearchOptions): void {
  if (options.query) {
    const query = options.query.replace(/'/g, "''")
    filters.push(`(name ~ '${query}' || description ~ '${query}' || tags ~ '${query}')`)
  }

  if (options.category) {
    filters.push(safeFilter`category = ${options.category}`)
  }

  if (options.isFavorite !== undefined) {
    filters.push(`isFavorite = ${options.isFavorite}`)
  }

  if (options.isPinned !== undefined) {
    filters.push(`isPinned = ${options.isPinned}`)
  }

  if (options.tags && options.tags.length > 0) {
    const tagFilters = options.tags.map((t) => `tags ~ '${t.replace(/'/g, "''")}'`)
    filters.push(`(${tagFilters.join(' && ')})`)
  }
}

function mapRecordToTemplate(record: Record<string, unknown>): LibraryTemplate {
  return {
    id: record.id as string,
    eventId: (record.eventId as string) || undefined,
    name: record.name as string,
    description: record.description as string | undefined,
    category: record.category as TemplateCategory,
    subject: record.subject as string,
    htmlContent: record.htmlContent as string,
    textContent: record.textContent as string | undefined,
    tags: (record.tags as string[]) || [],
    thumbnail: record.thumbnail as string | undefined,
    isGlobal: (record.isGlobal as boolean) || false,
    isFavorite: (record.isFavorite as boolean) || false,
    isPinned: (record.isPinned as boolean) || false,
    usageCount: (record.usageCount as number) || 0,
    createdBy: record.createdBy as string | undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}
