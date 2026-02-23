import type { SellerInfo } from '$lib/features/billing/services/pdf-shared'
import { createSponsorTokenService } from '$lib/features/sponsoring/services'
import { generateSponsorInvoicePdf } from '$lib/features/sponsoring/services/sponsor-invoice-service'
import { getSponsorToken } from '$lib/server/token-cookies'
import { error } from '@sveltejs/kit'
import type PocketBase from 'pocketbase'
import type { RequestHandler } from './$types'

interface EventContext {
  eventName: string
  vatRate: number
  seller?: SellerInfo
}

function buildSellerFromOrg(org: Record<string, unknown>): SellerInfo {
  return {
    name: org.name as string,
    legalName: (org.legalName as string) || undefined,
    legalForm: (org.legalForm as string) || undefined,
    rcsNumber: (org.rcsNumber as string) || undefined,
    shareCapital: (org.shareCapital as string) || undefined,
    siret: (org.siret as string) || undefined,
    vatNumber: (org.vatNumber as string) || undefined,
    address: (org.address as string) || undefined,
    city: (org.city as string) || undefined,
    postalCode: (org.postalCode as string) || undefined,
    country: (org.country as string) || undefined,
    contactEmail: (org.contactEmail as string) || undefined
  }
}

async function loadEventContext(pb: PocketBase, editionSlug: string): Promise<EventContext> {
  const editions = await pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    return { eventName: 'Event', vatRate: 20 }
  }

  const edition = editions.items[0]
  if (!edition.eventId) {
    return { eventName: edition.name as string, vatRate: 20 }
  }

  const event = await pb.collection('events').getOne(edition.eventId as string)
  const eventName = event.name as string

  if (!event.organizationId) {
    return { eventName, vatRate: 20 }
  }

  const org = await pb.collection('organizations').getOne(event.organizationId as string)
  return {
    eventName,
    vatRate: (org.vatRate as number) ?? 20,
    seller: buildSellerFromOrg(org)
  }
}

export const GET: RequestHandler = async ({ params, url, locals, cookies }) => {
  const { editionSlug } = params
  const token = getSponsorToken(cookies, url, editionSlug)

  if (!token) {
    throw error(400, 'Token is required')
  }

  const tokenService = createSponsorTokenService(locals.pb)
  const result = await tokenService.validateToken(token)

  if (!result.valid || !result.editionSponsor) {
    throw error(403, result.error || 'Invalid or expired token')
  }

  const es = result.editionSponsor
  if (es.status !== 'confirmed' || !es.amount || es.amount <= 0) {
    throw error(400, 'No invoice available')
  }

  if (!es.invoiceNumber) {
    throw error(400, 'No invoice number found')
  }

  let ctx: EventContext
  try {
    ctx = await loadEventContext(locals.pb, editionSlug)
  } catch {
    ctx = { eventName: 'Event', vatRate: 20 }
  }

  const paidDate = es.paidAt ? new Date(es.paidAt) : new Date(es.confirmedAt || es.createdAt)
  const invoiceDate = paidDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const pdfBytes = await generateSponsorInvoicePdf({
    invoiceNumber: es.invoiceNumber,
    invoiceDate,
    dueDate: invoiceDate,
    eventName: ctx.eventName,
    sponsorName: es.sponsor?.name || 'Sponsor',
    legalName: es.sponsor?.legalName,
    vatNumber: es.sponsor?.vatNumber,
    siret: es.sponsor?.siret,
    billingAddress: es.sponsor?.billingAddress,
    billingCity: es.sponsor?.billingCity,
    billingPostalCode: es.sponsor?.billingPostalCode,
    billingCountry: es.sponsor?.billingCountry,
    packageName: es.package?.name || 'Sponsorship',
    amount: es.amount,
    currency: es.package?.currency || 'EUR',
    vatRate: ctx.vatRate,
    seller: ctx.seller
  })

  const filename = `invoice-${es.sponsor?.name?.replace(/\s+/g, '-').toLowerCase() || 'sponsor'}.pdf`

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
