import { getNextInvoiceNumber } from '$lib/features/billing/services/invoice-number-service'
import type { SellerInfo } from '$lib/features/billing/services/pdf-shared'
import { recordIncome } from '$lib/features/budget/services'
import { createSmtpEmailService } from '$lib/features/cfp/services'
import {
  createEditionSponsorRepository,
  createPackageRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import {
  createSponsorEmailService,
  createSponsorTokenService
} from '$lib/features/sponsoring/services'
import { generateSponsorInvoicePdf } from '$lib/features/sponsoring/services/sponsor-invoice-service'
import { getSmtpSettings } from '$lib/server/app-settings'
import type PocketBase from 'pocketbase'

export interface SponsorCheckoutMetadata {
  type: string
  editionId: string
  editionSlug: string
  packageId: string
  companyName: string
  website: string
  description: string
  contactName: string
  contactEmail: string
  contactPhone: string
  legalName: string
  vatNumber: string
  siret: string
  billingAddress: string
  billingCity: string
  billingPostalCode: string
  billingCountry: string
}

function buildSellerFromOrg(org: Record<string, unknown>): SellerInfo {
  return {
    name: org.name as string,
    legalName: (org.legalName as string) || undefined,
    siret: (org.siret as string) || undefined,
    vatNumber: (org.vatNumber as string) || undefined,
    address: (org.address as string) || undefined,
    city: (org.city as string) || undefined,
    postalCode: (org.postalCode as string) || undefined,
    country: (org.country as string) || undefined,
    contactEmail: (org.contactEmail as string) || undefined
  }
}

async function resolveOrganization(
  pb: PocketBase,
  editionId: string
): Promise<{ organizationId: string; eventName: string; vatRate: number; seller: SellerInfo }> {
  const edition = await pb.collection('editions').getOne(editionId)
  let eventName = edition.name as string
  let organizationId = ''

  if (edition.eventId) {
    const event = await pb.collection('events').getOne(edition.eventId as string)
    eventName = event.name as string
    organizationId = event.organizationId as string
  }

  if (!organizationId) {
    throw new Error(`No organization found for edition ${editionId}`)
  }

  const organization = await pb.collection('organizations').getOne(organizationId)
  const vatRate = (organization.vatRate as number) ?? 20
  const seller = buildSellerFromOrg(organization)

  return { organizationId, eventName, vatRate, seller }
}

async function sendCheckoutEmails(
  pb: PocketBase,
  params: {
    editionSponsorId: string
    editionSlug: string
    origin: string
    eventName: string
    organizationId: string
    metadata: SponsorCheckoutMetadata
    pkgName: string
    pkgPrice: number
    pkgCurrency: string
    vatRate: number
    seller: SellerInfo
  }
): Promise<void> {
  const smtpSettings = await getSmtpSettings(pb)
  console.log(`[sponsor-checkout] SMTP enabled: ${smtpSettings.smtpEnabled}`)

  if (!smtpSettings.smtpEnabled) {
    console.log('[sponsor-checkout] SMTP not enabled, skipping emails')
    return
  }

  const editionSponsorRepo = createEditionSponsorRepository(pb)
  const tokenService = createSponsorTokenService(pb)
  const portalUrl = await tokenService.generatePortalLink(
    params.editionSponsorId,
    params.editionSlug,
    params.origin
  )

  const emailService = createSmtpEmailService({
    host: smtpSettings.smtpHost,
    port: smtpSettings.smtpPort,
    user: smtpSettings.smtpUser || undefined,
    pass: smtpSettings.smtpPass || undefined,
    from: smtpSettings.smtpFrom
  })
  const sponsorEmailService = createSponsorEmailService(emailService)
  const expandedEditionSponsor = await editionSponsorRepo.findByIdWithExpand(
    params.editionSponsorId
  )

  if (!expandedEditionSponsor) return

  const portalResult = await sponsorEmailService.sendPortalInvitation(
    expandedEditionSponsor,
    portalUrl,
    params.eventName
  )
  console.log(
    `[sponsor-checkout] Portal invitation email: ${portalResult.success ? 'sent' : `failed - ${portalResult.error}`}`
  )

  if (params.pkgPrice <= 0) return

  const now = new Date()
  const invoiceNumber = await getNextInvoiceNumber(pb, params.organizationId)
  const pdfBytes = await generateSponsorInvoicePdf({
    invoiceNumber,
    invoiceDate: now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    eventName: params.eventName,
    sponsorName: params.metadata.companyName,
    legalName: params.metadata.legalName || undefined,
    vatNumber: params.metadata.vatNumber || undefined,
    siret: params.metadata.siret || undefined,
    billingAddress: params.metadata.billingAddress || undefined,
    billingCity: params.metadata.billingCity || undefined,
    billingPostalCode: params.metadata.billingPostalCode || undefined,
    billingCountry: params.metadata.billingCountry || undefined,
    packageName: params.pkgName,
    amount: params.pkgPrice,
    currency: params.pkgCurrency,
    vatRate: params.vatRate,
    seller: params.seller
  })

  await editionSponsorRepo.update(params.editionSponsorId, { invoiceNumber })
  console.log(`[sponsor-checkout] Invoice number: ${invoiceNumber}`)

  const invoiceResult = await sponsorEmailService.sendInvoiceEmail(
    expandedEditionSponsor,
    params.eventName,
    pdfBytes,
    portalUrl
  )
  console.log(
    `[sponsor-checkout] Invoice email: ${invoiceResult.success ? 'sent' : `failed - ${invoiceResult.error}`}`
  )

  await recordIncome({
    pb,
    editionId: params.metadata.editionId,
    description: `Sponsor: ${params.metadata.companyName} - ${params.pkgName}`,
    amount: params.pkgPrice,
    invoiceNumber,
    pdfBytes,
    vendor: params.metadata.companyName,
    source: 'sponsoring'
  }).catch((err) => console.error('[sponsor-checkout] Budget integration failed:', err))
}

export async function handleSponsorCheckoutCompleted(
  pb: PocketBase,
  rawMetadata: Record<string, unknown>,
  origin: string,
  paymentIntentId?: string
): Promise<void> {
  const metadata = rawMetadata as unknown as SponsorCheckoutMetadata
  console.log(
    `[sponsor-checkout] Processing sponsor checkout for "${metadata.companyName}" (edition: ${metadata.editionId}, package: ${metadata.packageId})`
  )

  const { organizationId, eventName, vatRate, seller } = await resolveOrganization(
    pb,
    metadata.editionId
  )
  console.log(
    `[sponsor-checkout] Event: ${eventName}, Organization: ${organizationId}, VAT rate: ${vatRate}%`
  )

  const packageRepo = createPackageRepository(pb)
  const pkg = await packageRepo.findById(metadata.packageId)

  if (!pkg) {
    throw new Error(`Package not found: ${metadata.packageId}`)
  }
  console.log(`[sponsor-checkout] Package found: ${pkg.name} (${pkg.price} ${pkg.currency})`)

  const sponsorRepo = createSponsorRepository(pb)
  const editionSponsorRepo = createEditionSponsorRepository(pb)

  const sponsor = await sponsorRepo.create({
    organizationId,
    name: metadata.companyName,
    website: metadata.website || undefined,
    description: metadata.description || undefined,
    contactName: metadata.contactName,
    contactEmail: metadata.contactEmail,
    contactPhone: metadata.contactPhone || undefined,
    legalName: metadata.legalName || undefined,
    vatNumber: metadata.vatNumber || undefined,
    siret: metadata.siret || undefined,
    billingAddress: metadata.billingAddress || undefined,
    billingCity: metadata.billingCity || undefined,
    billingPostalCode: metadata.billingPostalCode || undefined,
    billingCountry: metadata.billingCountry || undefined
  })

  console.log(
    `[sponsor-checkout] Sponsor created: ${sponsor.name} (${sponsor.id}), legalName="${sponsor.legalName}", vatNumber="${sponsor.vatNumber}", billingAddress="${sponsor.billingAddress}"`
  )

  const editionSponsor = await editionSponsorRepo.create({
    editionId: metadata.editionId,
    sponsorId: sponsor.id,
    packageId: metadata.packageId,
    status: 'confirmed',
    confirmedAt: new Date(),
    paidAt: new Date(),
    amount: pkg.price
  })
  console.log(
    `[sponsor-checkout] Edition sponsor created: ${editionSponsor.id} (status: confirmed)`
  )

  if (paymentIntentId) {
    await editionSponsorRepo.update(editionSponsor.id, {
      stripePaymentIntentId: paymentIntentId
    })
    console.log(`[sponsor-checkout] Stored payment intent: ${paymentIntentId}`)
  }

  await sendCheckoutEmails(pb, {
    editionSponsorId: editionSponsor.id,
    editionSlug: metadata.editionSlug,
    origin,
    eventName,
    organizationId,
    metadata,
    pkgName: pkg.name,
    pkgPrice: pkg.price,
    pkgCurrency: pkg.currency,
    vatRate,
    seller
  })

  console.log(
    `[sponsor-checkout] Done! Sponsor "${sponsor.name}" (${sponsor.id}) created and confirmed`
  )
}

export function isSponsorCheckoutMetadata(
  metadata: Record<string, unknown> | undefined | null
): boolean {
  return metadata?.type === 'sponsor_package'
}
