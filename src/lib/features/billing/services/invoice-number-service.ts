import type PocketBase from 'pocketbase'

const COLLECTION = 'invoice_counters'
const DEFAULT_PREFIX = 'F'
const CREDIT_NOTE_PREFIX = 'AV'

/**
 * Generates the next sequential number for an organization counter.
 * Creates the counter row on first use. The increment is atomic
 * because PocketBase serialises writes per record.
 */
async function getNextNumber(
  pb: PocketBase,
  organizationId: string,
  prefix: string
): Promise<string> {
  const year = new Date().getFullYear()
  const filterKey = `organizationId = "${organizationId}" && prefix = "${prefix}"`

  let counter: Record<string, unknown> | null = null

  try {
    counter = await pb.collection(COLLECTION).getFirstListItem(filterKey)
  } catch {
    // Counter doesn't exist yet
  }

  let nextNumber: number

  if (!counter) {
    nextNumber = 1
    await pb.collection(COLLECTION).create({
      organizationId,
      lastNumber: 1,
      prefix
    })
  } else {
    nextNumber = ((counter.lastNumber as number) || 0) + 1
    await pb.collection(COLLECTION).update(counter.id as string, {
      lastNumber: nextNumber
    })
  }

  const paddedNumber = String(nextNumber).padStart(6, '0')
  return `${prefix}-${year}-${paddedNumber}`
}

/**
 * Generates the next sequential invoice number for an organization.
 * Format: F-{YYYY}-{NNNNNN}  (e.g. F-2026-000001)
 */
export async function getNextInvoiceNumber(
  pb: PocketBase,
  organizationId: string
): Promise<string> {
  return getNextNumber(pb, organizationId, DEFAULT_PREFIX)
}

/**
 * Generates the next sequential credit note number for an organization.
 * Format: AV-{YYYY}-{NNNNNN}  (e.g. AV-2026-000001)
 */
export async function getNextCreditNoteNumber(
  pb: PocketBase,
  organizationId: string
): Promise<string> {
  return getNextNumber(pb, organizationId, CREDIT_NOTE_PREFIX)
}
