import type PocketBase from 'pocketbase'

export interface ExportOptions {
  fields?: string[]
  segmentFilter?: string
}

const DEFAULT_FIELDS = [
  'email',
  'firstName',
  'lastName',
  'company',
  'jobTitle',
  'phone',
  'city',
  'country',
  'source',
  'tags'
]

export const createExportContactsUseCase = (pb: PocketBase) => {
  return async (eventId: string, options?: ExportOptions): Promise<string> => {
    const fields = options?.fields || DEFAULT_FIELDS

    let filter = `eventId = "${eventId}"`
    if (options?.segmentFilter) {
      filter += ` && (${options.segmentFilter})`
    }

    const contacts = await pb.collection('contacts').getFullList({
      filter,
      sort: 'lastName,firstName'
    })

    const header = fields.join(',')
    const rows = contacts.map((contact) => {
      return fields
        .map((field) => {
          const value = contact[field]
          if (value === null || value === undefined) return ''
          if (Array.isArray(value)) return `"${value.join(', ')}"`
          const str = String(value)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        })
        .join(',')
    })

    return [header, ...rows].join('\n')
  }
}
