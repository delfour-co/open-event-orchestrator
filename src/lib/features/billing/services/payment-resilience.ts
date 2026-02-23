import type PocketBase from 'pocketbase'

const COLLECTION = 'processed_payment_events'

export async function isAlreadyProcessed(pb: PocketBase, eventId: string): Promise<boolean> {
  try {
    const records = await pb.collection(COLLECTION).getList(1, 1, {
      filter: `eventId = "${eventId}"`
    })
    return records.items.length > 0
  } catch {
    return false
  }
}

export async function markProcessed(
  pb: PocketBase,
  eventId: string,
  provider: string
): Promise<void> {
  try {
    await pb.collection(COLLECTION).create({
      eventId,
      provider,
      processedAt: new Date().toISOString()
    })
  } catch (err) {
    // Unique constraint violation means it was already processed — safe to ignore
    console.warn(`[payment-resilience] Could not mark event ${eventId} as processed:`, err)
  }
}
