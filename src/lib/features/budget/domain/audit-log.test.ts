import { describe, expect, it } from 'vitest'
import {
  type AuditAction,
  type AuditEntityType,
  type FinancialAuditLog,
  auditActionSchema,
  auditEntityTypeSchema,
  auditLogFiltersSchema,
  buildAuditDescription,
  createAuditLogSchema,
  extractAmount,
  financialAuditLogSchema,
  getActionColor,
  getActionLabel,
  getEntityTypeLabel,
  sanitizeForAudit
} from './audit-log'

describe('auditActionSchema', () => {
  const validActions: AuditAction[] = [
    'create',
    'update',
    'delete',
    'status_change',
    'send',
    'accept',
    'reject',
    'convert',
    'submit',
    'approve',
    'mark_paid'
  ]

  it.each(validActions)('should accept valid action: %s', (action) => {
    expect(auditActionSchema.parse(action)).toBe(action)
  })

  it('should reject invalid action', () => {
    expect(() => auditActionSchema.parse('invalid')).toThrow()
  })
})

describe('auditEntityTypeSchema', () => {
  const validTypes: AuditEntityType[] = [
    'transaction',
    'quote',
    'invoice',
    'reimbursement',
    'category',
    'budget'
  ]

  it.each(validTypes)('should accept valid entity type: %s', (type) => {
    expect(auditEntityTypeSchema.parse(type)).toBe(type)
  })

  it('should reject invalid entity type', () => {
    expect(() => auditEntityTypeSchema.parse('invalid')).toThrow()
  })
})

describe('financialAuditLogSchema', () => {
  const validLog = {
    id: 'abc123',
    editionId: 'edition1',
    userId: 'user1',
    action: 'create',
    entityType: 'transaction',
    entityId: 'entity1',
    entityReference: 'TX-001',
    oldValue: { amount: 100 },
    newValue: { amount: 200 },
    metadata: { source: 'api' },
    created: new Date()
  }

  it('should accept valid audit log', () => {
    const result = financialAuditLogSchema.parse(validLog)
    expect(result.id).toBe('abc123')
    expect(result.action).toBe('create')
  })

  it('should accept audit log without optional fields', () => {
    const minimal = {
      id: 'abc123',
      editionId: 'edition1',
      action: 'create',
      entityType: 'transaction',
      entityId: 'entity1',
      created: new Date()
    }
    const result = financialAuditLogSchema.parse(minimal)
    expect(result.userId).toBeUndefined()
    expect(result.entityReference).toBeUndefined()
  })

  it('should reject audit log without required fields', () => {
    const invalid = {
      id: 'abc123',
      editionId: 'edition1'
      // missing action, entityType, entityId, created
    }
    expect(() => financialAuditLogSchema.parse(invalid)).toThrow()
  })
})

describe('createAuditLogSchema', () => {
  it('should omit id and created fields', () => {
    const data = {
      editionId: 'edition1',
      action: 'create',
      entityType: 'transaction',
      entityId: 'entity1'
    }
    const result = createAuditLogSchema.parse(data)
    expect(result).not.toHaveProperty('id')
    expect(result).not.toHaveProperty('created')
  })
})

describe('auditLogFiltersSchema', () => {
  it('should accept empty filters', () => {
    const result = auditLogFiltersSchema.parse({})
    expect(result).toEqual({})
  })

  it('should accept all filter fields', () => {
    const filters = {
      action: 'create',
      entityType: 'transaction',
      userId: 'user1',
      startDate: new Date(),
      endDate: new Date(),
      search: 'TX-001'
    }
    const result = auditLogFiltersSchema.parse(filters)
    expect(result.action).toBe('create')
    expect(result.search).toBe('TX-001')
  })
})

describe('getActionLabel', () => {
  it('should return correct label for create', () => {
    expect(getActionLabel('create')).toBe('Created')
  })

  it('should return correct label for update', () => {
    expect(getActionLabel('update')).toBe('Updated')
  })

  it('should return correct label for delete', () => {
    expect(getActionLabel('delete')).toBe('Deleted')
  })

  it('should return correct label for status_change', () => {
    expect(getActionLabel('status_change')).toBe('Status Changed')
  })

  it('should return correct label for send', () => {
    expect(getActionLabel('send')).toBe('Sent')
  })

  it('should return correct label for mark_paid', () => {
    expect(getActionLabel('mark_paid')).toBe('Marked Paid')
  })
})

describe('getActionColor', () => {
  it('should return green for create', () => {
    expect(getActionColor('create')).toBe('green')
  })

  it('should return blue for update', () => {
    expect(getActionColor('update')).toBe('blue')
  })

  it('should return red for delete', () => {
    expect(getActionColor('delete')).toBe('red')
  })

  it('should return purple for status_change', () => {
    expect(getActionColor('status_change')).toBe('purple')
  })

  it('should return green for approve', () => {
    expect(getActionColor('approve')).toBe('green')
  })

  it('should return red for reject', () => {
    expect(getActionColor('reject')).toBe('red')
  })
})

describe('getEntityTypeLabel', () => {
  it('should return correct label for transaction', () => {
    expect(getEntityTypeLabel('transaction')).toBe('Transaction')
  })

  it('should return correct label for quote', () => {
    expect(getEntityTypeLabel('quote')).toBe('Quote')
  })

  it('should return correct label for invoice', () => {
    expect(getEntityTypeLabel('invoice')).toBe('Invoice')
  })

  it('should return correct label for reimbursement', () => {
    expect(getEntityTypeLabel('reimbursement')).toBe('Reimbursement')
  })

  it('should return correct label for category', () => {
    expect(getEntityTypeLabel('category')).toBe('Category')
  })

  it('should return correct label for budget', () => {
    expect(getEntityTypeLabel('budget')).toBe('Budget')
  })
})

describe('extractAmount', () => {
  it('should extract amount from value', () => {
    expect(extractAmount({ amount: 100 })).toBe(100)
  })

  it('should extract totalAmount from value', () => {
    expect(extractAmount({ totalAmount: 250 })).toBe(250)
  })

  it('should extract total from value', () => {
    expect(extractAmount({ total: 500 })).toBe(500)
  })

  it('should return null for undefined value', () => {
    expect(extractAmount(undefined)).toBeNull()
  })

  it('should return null when no amount field exists', () => {
    expect(extractAmount({ name: 'test' })).toBeNull()
  })

  it('should prefer amount over totalAmount', () => {
    expect(extractAmount({ amount: 100, totalAmount: 200 })).toBe(100)
  })
})

describe('buildAuditDescription', () => {
  it('should build basic description', () => {
    const log: FinancialAuditLog = {
      id: '1',
      editionId: 'ed1',
      action: 'create',
      entityType: 'transaction',
      entityId: 't1',
      created: new Date()
    }
    expect(buildAuditDescription(log)).toBe('Created transaction')
  })

  it('should include entity reference', () => {
    const log: FinancialAuditLog = {
      id: '1',
      editionId: 'ed1',
      action: 'create',
      entityType: 'quote',
      entityId: 'q1',
      entityReference: 'QT-2025-001',
      created: new Date()
    }
    expect(buildAuditDescription(log)).toContain('QT-2025-001')
  })

  it('should show amount for create', () => {
    const log: FinancialAuditLog = {
      id: '1',
      editionId: 'ed1',
      action: 'create',
      entityType: 'transaction',
      entityId: 't1',
      newValue: { amount: 150 },
      created: new Date()
    }
    expect(buildAuditDescription(log)).toContain('150')
  })

  it('should show amount change for update', () => {
    const log: FinancialAuditLog = {
      id: '1',
      editionId: 'ed1',
      action: 'update',
      entityType: 'transaction',
      entityId: 't1',
      oldValue: { amount: 100 },
      newValue: { amount: 200 },
      created: new Date()
    }
    const description = buildAuditDescription(log)
    expect(description).toContain('100')
    expect(description).toContain('200')
    expect(description).toContain('→')
  })

  it('should show status change', () => {
    const log: FinancialAuditLog = {
      id: '1',
      editionId: 'ed1',
      action: 'status_change',
      entityType: 'transaction',
      entityId: 't1',
      oldValue: { status: 'pending' },
      newValue: { status: 'paid' },
      created: new Date()
    }
    const description = buildAuditDescription(log)
    expect(description).toContain('pending')
    expect(description).toContain('paid')
  })
})

describe('sanitizeForAudit', () => {
  it('should redact sensitive keys', () => {
    const data = {
      name: 'test',
      password: 'secret123',
      token: 'abc123',
      apiKey: 'key123'
    }
    const result = sanitizeForAudit(data)
    expect(result.name).toBe('test')
    expect(result.password).toBe('[REDACTED]')
    expect(result.token).toBe('[REDACTED]')
    expect(result.apiKey).toBe('[REDACTED]')
  })

  it('should truncate long strings', () => {
    const longString = 'a'.repeat(1500)
    const data = { description: longString }
    const result = sanitizeForAudit(data)
    expect((result.description as string).length).toBeLessThan(1500)
    expect((result.description as string).endsWith('...')).toBe(true)
  })

  it('should recursively sanitize nested objects', () => {
    const data = {
      user: {
        name: 'John',
        password: 'secret'
      }
    }
    const result = sanitizeForAudit(data)
    expect((result.user as Record<string, unknown>).name).toBe('John')
    expect((result.user as Record<string, unknown>).password).toBe('[REDACTED]')
  })

  it('should preserve non-sensitive data', () => {
    const data = {
      amount: 100,
      status: 'pending',
      items: ['a', 'b', 'c']
    }
    const result = sanitizeForAudit(data)
    expect(result.amount).toBe(100)
    expect(result.status).toBe('pending')
    expect(result.items).toEqual(['a', 'b', 'c'])
  })
})
