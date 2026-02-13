import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { CreateTicketTemplate, TicketTemplate, UpdateTicketTemplate } from '../domain'

const COLLECTION = 'ticket_templates'

const appendIfDefined = (
  formData: FormData,
  key: string,
  value: string | boolean | undefined,
  transform: (v: string | boolean) => string = (v) => String(v)
): void => {
  if (value !== undefined) {
    formData.append(key, transform(value))
  }
}

export const createTicketTemplateRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<TicketTemplate | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToTicketTemplate(record, pb)
    } catch {
      return null
    }
  },

  async findByEdition(editionId: string): Promise<TicketTemplate | null> {
    try {
      const records = await pb.collection(COLLECTION).getList(1, 1, {
        filter: safeFilter`editionId = ${editionId}`
      })
      if (records.items.length === 0) return null
      return mapRecordToTicketTemplate(records.items[0], pb)
    } catch {
      return null
    }
  },

  async create(data: CreateTicketTemplate): Promise<TicketTemplate> {
    const record = await pb.collection(COLLECTION).create(data)
    return mapRecordToTicketTemplate(record, pb)
  },

  async update(id: string, data: UpdateTicketTemplate): Promise<TicketTemplate> {
    const record = await pb.collection(COLLECTION).update(id, data)
    return mapRecordToTicketTemplate(record, pb)
  },

  async updateWithLogo(
    id: string,
    data: UpdateTicketTemplate,
    logoFile: File
  ): Promise<TicketTemplate> {
    const formData = new FormData()

    appendIfDefined(formData, 'primaryColor', data.primaryColor)
    appendIfDefined(formData, 'backgroundColor', data.backgroundColor)
    appendIfDefined(formData, 'textColor', data.textColor)
    appendIfDefined(formData, 'accentColor', data.accentColor)
    appendIfDefined(formData, 'logoUrl', data.logoUrl)
    appendIfDefined(formData, 'showVenue', data.showVenue)
    appendIfDefined(formData, 'showDate', data.showDate)
    appendIfDefined(formData, 'showQrCode', data.showQrCode)
    appendIfDefined(formData, 'customFooterText', data.customFooterText)

    formData.append('logoFile', logoFile)

    const record = await pb.collection(COLLECTION).update(id, formData)
    return mapRecordToTicketTemplate(record, pb)
  },

  async createWithLogo(data: CreateTicketTemplate, logoFile: File): Promise<TicketTemplate> {
    const formData = new FormData()

    formData.append('editionId', data.editionId)
    formData.append('primaryColor', data.primaryColor || '#3B82F6')
    formData.append('backgroundColor', data.backgroundColor || '#FFFFFF')
    formData.append('textColor', data.textColor || '#1F2937')
    formData.append('accentColor', data.accentColor || '#10B981')
    if (data.logoUrl) formData.append('logoUrl', data.logoUrl)
    formData.append('showVenue', String(data.showVenue ?? true))
    formData.append('showDate', String(data.showDate ?? true))
    formData.append('showQrCode', String(data.showQrCode ?? true))
    if (data.customFooterText) formData.append('customFooterText', data.customFooterText)

    formData.append('logoFile', logoFile)

    const record = await pb.collection(COLLECTION).create(formData)
    return mapRecordToTicketTemplate(record, pb)
  },

  async removeLogo(id: string): Promise<TicketTemplate> {
    const record = await pb.collection(COLLECTION).update(id, {
      logoFile: null,
      logoUrl: null
    })
    return mapRecordToTicketTemplate(record, pb)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  getLogoUrl(template: TicketTemplate): string | undefined {
    if (template.logoUrl) {
      return template.logoUrl
    }
    if (template.logoFile) {
      return pb.files.getURL({ collectionId: COLLECTION, id: template.id }, template.logoFile, {
        thumb: '300x0'
      })
    }
    return undefined
  }
})

const mapRecordToTicketTemplate = (
  record: Record<string, unknown>,
  _pb: PocketBase
): TicketTemplate => {
  const template: TicketTemplate = {
    id: record.id as string,
    editionId: record.editionId as string,
    primaryColor: (record.primaryColor as string) || '#3B82F6',
    backgroundColor: (record.backgroundColor as string) || '#FFFFFF',
    textColor: (record.textColor as string) || '#1F2937',
    accentColor: (record.accentColor as string) || '#10B981',
    logoUrl: record.logoUrl as string | undefined,
    logoFile: record.logoFile as string | undefined,
    showVenue: record.showVenue !== false,
    showDate: record.showDate !== false,
    showQrCode: record.showQrCode !== false,
    customFooterText: record.customFooterText as string | undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
  return template
}

export type TicketTemplateRepository = ReturnType<typeof createTicketTemplateRepository>
