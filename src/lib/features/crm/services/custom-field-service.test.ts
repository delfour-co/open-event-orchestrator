import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCustomFieldService } from './custom-field-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'new-id',
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    update: vi.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    delete: vi.fn().mockResolvedValue({})
  })

  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    }),
    _collections: collections
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase
  } as any
}

describe('CustomFieldService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createCustomFieldService>

  const now = new Date()

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createCustomFieldService(pb)
  })

  describe('createField', () => {
    it('should create a custom field', async () => {
      const result = await service.createField({
        eventId: 'evt-1',
        name: 'Company Size',
        key: 'company_size',
        fieldType: 'select',
        options: { choices: ['small', 'medium', 'large'] },
        isRequired: true
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('custom_fields').create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-1',
          name: 'Company Size',
          key: 'company_size',
          fieldType: 'select',
          isRequired: true,
          isActive: true
        })
      )
    })
  })

  describe('updateField', () => {
    it('should update a custom field', async () => {
      await service.updateField('field-1', {
        name: 'Updated Name',
        isRequired: false
      })

      expect(pb.collection('custom_fields').update).toHaveBeenCalledWith('field-1', {
        name: 'Updated Name',
        isRequired: false
      })
    })
  })

  describe('deleteField', () => {
    it('should delete field and its values', async () => {
      pb.collection('contact_custom_values').getFullList.mockResolvedValue([
        { id: 'val-1' },
        { id: 'val-2' }
      ])

      await service.deleteField('field-1')

      expect(pb.collection('contact_custom_values').delete).toHaveBeenCalledTimes(2)
      expect(pb.collection('custom_fields').delete).toHaveBeenCalledWith('field-1')
    })
  })

  describe('getField', () => {
    it('should return field by id', async () => {
      pb.collection('custom_fields').getOne.mockResolvedValue({
        id: 'field-1',
        eventId: 'evt-1',
        name: 'Test Field',
        key: 'test_field',
        fieldType: 'text',
        isActive: true,
        created: now.toISOString(),
        updated: now.toISOString()
      })

      const result = await service.getField('field-1')

      expect(result).not.toBeNull()
      expect(result?.name).toBe('Test Field')
    })

    it('should return null for non-existent field', async () => {
      pb.collection('custom_fields').getOne.mockRejectedValue(new Error('Not found'))

      const result = await service.getField('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getFieldsByEvent', () => {
    it('should return active fields by event', async () => {
      pb.collection('custom_fields').getFullList.mockResolvedValue([
        {
          id: 'f1',
          name: 'Field 1',
          key: 'field_1',
          fieldType: 'text',
          isActive: true,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getFieldsByEvent('evt-1')

      expect(result).toHaveLength(1)
      expect(pb.collection('custom_fields').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('isActive = true')
        })
      )
    })

    it('should include inactive fields when requested', async () => {
      await service.getFieldsByEvent('evt-1', true)

      expect(pb.collection('custom_fields').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.not.stringContaining('isActive')
        })
      )
    })
  })

  describe('getValue', () => {
    it('should return value for contact and field', async () => {
      pb.collection('contact_custom_values').getList.mockResolvedValue({
        items: [{ id: 'val-1', contactId: 'c1', fieldId: 'f1', value: 'test value' }]
      })

      const result = await service.getValue('c1', 'f1')

      expect(result).toBe('test value')
    })

    it('should return undefined for non-existent value', async () => {
      pb.collection('contact_custom_values').getList.mockResolvedValue({ items: [] })

      const result = await service.getValue('c1', 'f1')

      expect(result).toBeUndefined()
    })
  })

  describe('getValues', () => {
    it('should return all values for contact', async () => {
      pb.collection('contact_custom_values').getFullList.mockResolvedValue([
        { fieldId: 'f1', value: 'value1' },
        { fieldId: 'f2', value: 'value2' }
      ])

      const result = await service.getValues('c1')

      expect(result.get('f1')).toBe('value1')
      expect(result.get('f2')).toBe('value2')
    })
  })

  describe('setValue', () => {
    it('should update existing value', async () => {
      pb.collection('contact_custom_values').getList.mockResolvedValue({
        items: [{ id: 'val-1' }]
      })

      await service.setValue('c1', 'f1', 'new value')

      expect(pb.collection('contact_custom_values').update).toHaveBeenCalledWith('val-1', {
        value: 'new value'
      })
    })

    it('should create new value if not exists', async () => {
      pb.collection('contact_custom_values').getList.mockResolvedValue({ items: [] })

      await service.setValue('c1', 'f1', 'new value')

      expect(pb.collection('contact_custom_values').create).toHaveBeenCalledWith({
        contactId: 'c1',
        fieldId: 'f1',
        value: 'new value'
      })
    })
  })

  describe('getValuesForContacts', () => {
    it('should return values map for multiple contacts', async () => {
      pb.collection('contact_custom_values').getFullList.mockResolvedValue([
        { contactId: 'c1', fieldId: 'f1', value: 'v1' },
        { contactId: 'c1', fieldId: 'f2', value: 'v2' },
        { contactId: 'c2', fieldId: 'f1', value: 'v3' }
      ])

      const result = await service.getValuesForContacts(['c1', 'c2'], ['f1', 'f2'])

      expect(result.get('c1')?.get('f1')).toBe('v1')
      expect(result.get('c1')?.get('f2')).toBe('v2')
      expect(result.get('c2')?.get('f1')).toBe('v3')
    })

    it('should return empty map for empty inputs', async () => {
      const result = await service.getValuesForContacts([], ['f1'])

      expect(result.size).toBe(0)
      expect(pb.collection).not.toHaveBeenCalled()
    })
  })

  describe('validateValues', () => {
    it('should validate all required fields', async () => {
      pb.collection('custom_fields').getFullList.mockResolvedValue([
        {
          id: 'f1',
          name: 'Required Field',
          fieldType: 'text',
          isRequired: true,
          isActive: true,
          created: now.toISOString(),
          updated: now.toISOString()
        },
        {
          id: 'f2',
          name: 'Optional Field',
          fieldType: 'text',
          isRequired: false,
          isActive: true,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.validateValues('evt-1', { f2: 'value' })

      expect(result.valid).toBe(false)
      expect(result.errors.f1).toContain('required')
    })

    it('should pass validation for valid values', async () => {
      pb.collection('custom_fields').getFullList.mockResolvedValue([
        {
          id: 'f1',
          name: 'Text Field',
          fieldType: 'text',
          isRequired: true,
          isActive: true,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.validateValues('evt-1', { f1: 'valid value' })

      expect(result.valid).toBe(true)
      expect(Object.keys(result.errors)).toHaveLength(0)
    })
  })
})
