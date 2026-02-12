/**
 * Custom Field Service
 *
 * Manages custom field definitions and values for contacts.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type CreateCustomField,
  type CustomField,
  type CustomFieldOptions,
  type CustomFieldType,
  type UpdateCustomField,
  validateFieldValue
} from '../domain/custom-field'

export interface CustomFieldService {
  // Field definitions
  createField(input: CreateCustomField): Promise<CustomField>
  updateField(id: string, updates: UpdateCustomField): Promise<CustomField>
  deleteField(id: string): Promise<void>
  getField(id: string): Promise<CustomField | null>
  getFieldByKey(eventId: string, key: string): Promise<CustomField | null>
  getFieldsByEvent(eventId: string, includeInactive?: boolean): Promise<CustomField[]>

  // Field values
  getValue(contactId: string, fieldId: string): Promise<string | undefined>
  getValues(contactId: string): Promise<Map<string, string>>
  setValue(contactId: string, fieldId: string, value: string): Promise<void>
  setValues(contactId: string, values: Record<string, string>): Promise<void>
  deleteValues(contactId: string): Promise<void>

  // Bulk operations
  getValuesForContacts(
    contactIds: string[],
    fieldIds: string[]
  ): Promise<Map<string, Map<string, string>>>

  // Validation
  validateValues(
    eventId: string,
    values: Record<string, string>
  ): Promise<{ valid: boolean; errors: Record<string, string> }>
}

export function createCustomFieldService(pb: PocketBase): CustomFieldService {
  return {
    async createField(input: CreateCustomField): Promise<CustomField> {
      const record = await pb.collection('custom_fields').create({
        eventId: input.eventId,
        name: input.name,
        key: input.key,
        fieldType: input.fieldType,
        description: input.description || '',
        isRequired: input.isRequired || false,
        options: input.options || {},
        displayOrder: input.displayOrder || 0,
        isActive: true
      })

      return mapRecordToField(record)
    },

    async updateField(id: string, updates: UpdateCustomField): Promise<CustomField> {
      const record = await pb.collection('custom_fields').update(id, updates)
      return mapRecordToField(record)
    },

    async deleteField(id: string): Promise<void> {
      // Delete all values for this field first
      const values = await pb.collection('contact_custom_values').getFullList({
        filter: safeFilter`fieldId = ${id}`,
        fields: 'id'
      })

      for (const value of values) {
        await pb.collection('contact_custom_values').delete(value.id)
      }

      // Then delete the field
      await pb.collection('custom_fields').delete(id)
    },

    async getField(id: string): Promise<CustomField | null> {
      try {
        const record = await pb.collection('custom_fields').getOne(id)
        return mapRecordToField(record)
      } catch {
        return null
      }
    },

    async getFieldByKey(eventId: string, key: string): Promise<CustomField | null> {
      try {
        const records = await pb.collection('custom_fields').getList(1, 1, {
          filter: safeFilter`eventId = ${eventId} && key = ${key}`
        })
        if (records.items.length === 0) return null
        return mapRecordToField(records.items[0])
      } catch {
        return null
      }
    },

    async getFieldsByEvent(eventId: string, includeInactive = false): Promise<CustomField[]> {
      const filters = [safeFilter`eventId = ${eventId}`]
      if (!includeInactive) {
        filters.push('isActive = true')
      }

      const records = await pb.collection('custom_fields').getFullList({
        filter: filters.join(' && '),
        sort: 'displayOrder,created'
      })

      return records.map(mapRecordToField)
    },

    async getValue(contactId: string, fieldId: string): Promise<string | undefined> {
      try {
        const records = await pb.collection('contact_custom_values').getList(1, 1, {
          filter: safeFilter`contactId = ${contactId} && fieldId = ${fieldId}`
        })
        if (records.items.length === 0) return undefined
        return records.items[0].value as string
      } catch {
        return undefined
      }
    },

    async getValues(contactId: string): Promise<Map<string, string>> {
      const records = await pb.collection('contact_custom_values').getFullList({
        filter: safeFilter`contactId = ${contactId}`
      })

      const values = new Map<string, string>()
      for (const record of records) {
        values.set(record.fieldId as string, record.value as string)
      }
      return values
    },

    async setValue(contactId: string, fieldId: string, value: string): Promise<void> {
      // Check if value exists
      const records = await pb.collection('contact_custom_values').getList(1, 1, {
        filter: safeFilter`contactId = ${contactId} && fieldId = ${fieldId}`
      })

      if (records.items.length > 0) {
        await pb.collection('contact_custom_values').update(records.items[0].id, { value })
      } else {
        await pb.collection('contact_custom_values').create({
          contactId,
          fieldId,
          value
        })
      }
    },

    async setValues(contactId: string, values: Record<string, string>): Promise<void> {
      const existingRecords = await pb.collection('contact_custom_values').getFullList({
        filter: safeFilter`contactId = ${contactId}`
      })

      const recordsByFieldId = new Map(existingRecords.map((r) => [r.fieldId as string, r.id]))

      for (const [fieldId, value] of Object.entries(values)) {
        const existingId = recordsByFieldId.get(fieldId)
        if (existingId) {
          await pb.collection('contact_custom_values').update(existingId, { value })
        } else {
          await pb.collection('contact_custom_values').create({
            contactId,
            fieldId,
            value
          })
        }
      }
    },

    async deleteValues(contactId: string): Promise<void> {
      const records = await pb.collection('contact_custom_values').getFullList({
        filter: safeFilter`contactId = ${contactId}`,
        fields: 'id'
      })

      for (const record of records) {
        await pb.collection('contact_custom_values').delete(record.id)
      }
    },

    async getValuesForContacts(
      contactIds: string[],
      fieldIds: string[]
    ): Promise<Map<string, Map<string, string>>> {
      if (contactIds.length === 0 || fieldIds.length === 0) {
        return new Map()
      }

      const contactFilters = contactIds.map((id) => safeFilter`contactId = ${id}`)
      const fieldFilters = fieldIds.map((id) => safeFilter`fieldId = ${id}`)

      const records = await pb.collection('contact_custom_values').getFullList({
        filter: `(${contactFilters.join(' || ')}) && (${fieldFilters.join(' || ')})`
      })

      const result = new Map<string, Map<string, string>>()

      for (const record of records) {
        const contactId = record.contactId as string
        const fieldId = record.fieldId as string
        const value = record.value as string

        if (!result.has(contactId)) {
          result.set(contactId, new Map())
        }
        result.get(contactId)?.set(fieldId, value)
      }

      return result
    },

    async validateValues(
      eventId: string,
      values: Record<string, string>
    ): Promise<{ valid: boolean; errors: Record<string, string> }> {
      const fields = await this.getFieldsByEvent(eventId)
      const errors: Record<string, string> = {}

      for (const field of fields) {
        const value = values[field.id]
        const result = validateFieldValue(field, value)

        if (!result.valid && result.error) {
          errors[field.id] = result.error
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors
      }
    }
  }
}

function mapRecordToField(record: Record<string, unknown>): CustomField {
  return {
    id: record.id as string,
    eventId: record.eventId as string,
    name: record.name as string,
    key: record.key as string,
    fieldType: record.fieldType as CustomFieldType,
    description: record.description as string | undefined,
    isRequired: (record.isRequired as boolean) || false,
    options: record.options as CustomFieldOptions | undefined,
    displayOrder: (record.displayOrder as number) || 0,
    isActive: (record.isActive as boolean) ?? true,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
}
