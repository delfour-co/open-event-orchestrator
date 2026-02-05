import type PocketBase from 'pocketbase'
import type { CreateEmailTemplate, EmailTemplate } from '../domain'

const COLLECTION = 'email_templates'

export const createEmailTemplateRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<EmailTemplate | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToEmailTemplate(record)
    } catch {
      return null
    }
  },

  async findByOrganization(organizationId: string): Promise<EmailTemplate[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: `organizationId = "${organizationId}"`,
      sort: '-created'
    })
    return records.map(mapRecordToEmailTemplate)
  },

  async create(data: CreateEmailTemplate): Promise<EmailTemplate> {
    const record = await pb.collection(COLLECTION).create({
      ...data,
      variables: JSON.stringify(data.variables)
    })
    return mapRecordToEmailTemplate(record)
  },

  async update(id: string, data: Partial<CreateEmailTemplate>): Promise<EmailTemplate> {
    const updateData: Record<string, unknown> = { ...data }
    if (data.variables !== undefined) {
      updateData.variables = JSON.stringify(data.variables)
    }
    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToEmailTemplate(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  }
})

const parseVariables = (value: unknown): string[] => {
  if (Array.isArray(value)) return value as string[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const mapRecordToEmailTemplate = (record: Record<string, unknown>): EmailTemplate => ({
  id: record.id as string,
  organizationId: record.organizationId as string,
  name: record.name as string,
  subject: record.subject as string,
  bodyHtml: record.bodyHtml as string,
  bodyText: record.bodyText as string,
  variables: parseVariables(record.variables),
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type EmailTemplateRepository = ReturnType<typeof createEmailTemplateRepository>
