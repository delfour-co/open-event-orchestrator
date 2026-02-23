import { getAvailableSlots, hasAvailableSlots } from '$lib/features/sponsoring/domain'
import type { SponsorPackage } from '$lib/features/sponsoring/domain'
import { createPackageRepository } from '$lib/features/sponsoring/infra'
import { getStripeSettings } from '$lib/server/app-settings'
import { error, fail, redirect } from '@sveltejs/kit'
import type PocketBase from 'pocketbase'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'

const checkoutSchema = z.object({
  packageId: z.string().min(1, 'Package is required'),
  companyName: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
  contactName: z.string().min(1, 'Contact name is required').max(200),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().max(50).optional(),
  legalName: z.string().min(1, 'Legal name is required').max(300),
  vatNumber: z.string().max(50).optional().or(z.literal('')),
  siret: z.string().max(20).optional().or(z.literal('')),
  billingAddress: z.string().min(1, 'Billing address is required').max(500),
  billingCity: z.string().min(1, 'City is required').max(100),
  billingPostalCode: z.string().min(1, 'Postal code is required').max(20),
  billingCountry: z.string().min(1, 'Country is required').max(100)
})

type CheckoutData = z.infer<typeof checkoutSchema>

interface EditionInfo {
  id: string
  name: string
  slug: string
  eventName: string
  organizationId: string
}

interface RawFormData {
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

async function getEditionInfo(pb: PocketBase, editionSlug: string): Promise<EditionInfo | null> {
  const editions = await pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) return null

  const record = editions.items[0]
  let eventName = record.name as string
  let organizationId = ''

  try {
    if (record.eventId) {
      const event = await pb.collection('events').getOne(record.eventId as string)
      eventName = event.name as string
      organizationId = event.organizationId as string
    }
  } catch {
    // Use edition name as fallback
  }

  if (!organizationId) return null

  return {
    id: record.id as string,
    name: record.name as string,
    slug: record.slug as string,
    eventName,
    organizationId
  }
}

async function createSponsorWithoutPayment(
  pb: PocketBase,
  edition: EditionInfo,
  data: CheckoutData,
  packageId: string,
  packagePrice: number,
  origin: string
): Promise<string> {
  const { createEditionSponsorRepository, createSponsorRepository } = await import(
    '$lib/features/sponsoring/infra'
  )
  const { createSponsorEmailService, createSponsorTokenService } = await import(
    '$lib/features/sponsoring/services'
  )
  const { createSmtpEmailService } = await import('$lib/features/cfp/services')
  const { getSmtpSettings } = await import('$lib/server/app-settings')

  const sponsorRepo = createSponsorRepository(pb)
  const editionSponsorRepo = createEditionSponsorRepository(pb)

  const sponsor = await sponsorRepo.create({
    organizationId: edition.organizationId,
    name: data.companyName,
    website: data.website || undefined,
    description: data.description || undefined,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone || undefined,
    legalName: data.legalName || undefined,
    vatNumber: data.vatNumber || undefined,
    siret: data.siret || undefined,
    billingAddress: data.billingAddress || undefined,
    billingCity: data.billingCity || undefined,
    billingPostalCode: data.billingPostalCode || undefined,
    billingCountry: data.billingCountry || undefined
  })

  const editionSponsor = await editionSponsorRepo.create({
    editionId: edition.id,
    sponsorId: sponsor.id,
    packageId,
    status: 'confirmed',
    confirmedAt: new Date(),
    paidAt: new Date(),
    amount: packagePrice
  })

  const tokenService = createSponsorTokenService(pb)
  const portalUrl = await tokenService.generatePortalLink(editionSponsor.id, edition.slug, origin)

  const smtpSettings = await getSmtpSettings(pb)
  if (smtpSettings.smtpEnabled) {
    const emailService = createSmtpEmailService({
      host: smtpSettings.smtpHost,
      port: smtpSettings.smtpPort,
      user: smtpSettings.smtpUser || undefined,
      pass: smtpSettings.smtpPass || undefined,
      from: smtpSettings.smtpFrom
    })
    const sponsorEmailService = createSponsorEmailService(emailService)
    const expandedEditionSponsor = await editionSponsorRepo.findByIdWithExpand(editionSponsor.id)
    if (expandedEditionSponsor) {
      await sponsorEmailService.sendPortalInvitation(
        expandedEditionSponsor,
        portalUrl,
        edition.eventName
      )

      if (packagePrice > 0) {
        const { generateSponsorInvoicePdf } = await import(
          '$lib/features/sponsoring/services/sponsor-invoice-service'
        )
        const { getNextInvoiceNumber } = await import(
          '$lib/features/billing/services/invoice-number-service'
        )
        let vatRate = 20
        try {
          const org = await pb.collection('organizations').getOne(edition.organizationId)
          vatRate = (org.vatRate as number) ?? 20
        } catch {
          // Use default
        }
        const now = new Date()
        const invoiceNumber = await getNextInvoiceNumber(pb, edition.organizationId)
        const pdfBytes = await generateSponsorInvoicePdf({
          invoiceNumber,
          invoiceDate: now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          eventName: edition.eventName,
          sponsorName: sponsor.name,
          legalName: data.legalName || undefined,
          vatNumber: data.vatNumber || undefined,
          siret: data.siret || undefined,
          billingAddress: data.billingAddress || undefined,
          billingCity: data.billingCity || undefined,
          billingPostalCode: data.billingPostalCode || undefined,
          billingCountry: data.billingCountry || undefined,
          packageName: expandedEditionSponsor.package?.name || 'Sponsorship',
          amount: packagePrice,
          currency: expandedEditionSponsor.package?.currency || 'EUR',
          vatRate
        })
        // Store invoice number on the edition sponsor
        await editionSponsorRepo.update(editionSponsor.id, { invoiceNumber })

        await sponsorEmailService.sendInvoiceEmail(
          expandedEditionSponsor,
          edition.eventName,
          pdfBytes,
          portalUrl
        )

        const { recordIncome } = await import('$lib/features/budget/services')
        await recordIncome({
          pb,
          editionId: edition.id,
          description: `Sponsor: ${data.companyName} - ${expandedEditionSponsor.package?.name || 'Sponsorship'}`,
          amount: packagePrice,
          invoiceNumber,
          pdfBytes,
          vendor: data.companyName,
          source: 'sponsoring'
        }).catch((err) => console.error('[sponsor-checkout] Budget integration failed:', err))
      }
    }
  }

  return editionSponsor.id
}

async function createStripeSession(
  stripeKey: string,
  edition: EditionInfo,
  data: CheckoutData,
  pkg: SponsorPackage,
  origin: string,
  apiBase?: string
): Promise<string> {
  const Stripe = (await import('stripe')).default
  const opts: Record<string, unknown> = {}
  if (apiBase) {
    const url = new URL(apiBase)
    opts.host = url.hostname
    opts.port = Number(url.port) || undefined
    opts.protocol = url.protocol.replace(':', '')
  }
  const stripeClient = new Stripe(stripeKey, opts)

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: data.contactEmail,
    line_items: [
      {
        price_data: {
          currency: pkg.currency.toLowerCase(),
          product_data: {
            name: `${edition.eventName} - ${pkg.name} Sponsorship`,
            description: pkg.description || `${pkg.name} sponsorship package`
          },
          unit_amount: pkg.price * 100
        },
        quantity: 1
      }
    ],
    metadata: {
      type: 'sponsor_package',
      editionId: edition.id,
      editionSlug: edition.slug,
      packageId: pkg.id,
      companyName: data.companyName,
      website: data.website || '',
      description: (data.description || '').slice(0, 500),
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone || '',
      legalName: data.legalName || '',
      vatNumber: data.vatNumber || '',
      siret: data.siret || '',
      billingAddress: data.billingAddress || '',
      billingCity: data.billingCity || '',
      billingPostalCode: data.billingPostalCode || '',
      billingCountry: data.billingCountry || ''
    },
    success_url: `${origin}/sponsor/${edition.slug}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/sponsor/${edition.slug}/packages`
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  return session.url
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const { editionSlug } = params
  const packageId = url.searchParams.get('package')

  if (!packageId) {
    throw redirect(302, `/sponsor/${editionSlug}/packages`)
  }

  const edition = await getEditionInfo(locals.pb, editionSlug)
  if (!edition) {
    throw error(404, 'Edition not found')
  }

  const packageRepo = createPackageRepository(locals.pb)
  const pkg = await packageRepo.findById(packageId)

  if (!pkg) throw error(404, 'Package not found')
  if (pkg.editionId !== edition.id) throw error(400, 'Package does not belong to this edition')
  if (!pkg.isActive) throw error(400, 'This package is no longer available')

  const currentCount = await packageRepo.countSponsorsByPackage(packageId)
  if (!hasAvailableSlots(pkg, currentCount)) {
    throw error(400, 'This package is sold out')
  }

  return {
    edition: { id: edition.id, name: edition.name, slug: edition.slug },
    eventName: edition.eventName,
    package: { ...pkg, availableSlots: getAvailableSlots(pkg, currentCount) }
  }
}

export const actions: Actions = {
  default: async ({ request, locals, url, params }) => {
    const formData = await request.formData()
    const rawData: RawFormData = {
      packageId: formData.get('packageId') as string,
      companyName: formData.get('companyName') as string,
      website: formData.get('website') as string,
      description: formData.get('description') as string,
      contactName: formData.get('contactName') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactPhone: formData.get('contactPhone') as string,
      legalName: formData.get('legalName') as string,
      vatNumber: formData.get('vatNumber') as string,
      siret: formData.get('siret') as string,
      billingAddress: formData.get('billingAddress') as string,
      billingCity: formData.get('billingCity') as string,
      billingPostalCode: formData.get('billingPostalCode') as string,
      billingCountry: formData.get('billingCountry') as string
    }

    const result = checkoutSchema.safeParse(rawData)
    if (!result.success) {
      return fail(400, { errors: result.error.flatten().fieldErrors, values: rawData })
    }

    const data = result.data
    const edition = await getEditionInfo(locals.pb, params.editionSlug)
    if (!edition) throw error(404, 'Edition not found')

    const packageRepo = createPackageRepository(locals.pb)
    const pkg = await packageRepo.findById(data.packageId)
    if (!pkg) return fail(400, { error: 'Package not found', values: rawData })

    const currentCount = await packageRepo.countSponsorsByPackage(data.packageId)
    if (!hasAvailableSlots(pkg, currentCount)) {
      return fail(400, { error: 'This package is now sold out', values: rawData })
    }

    const stripeSettings = await getStripeSettings(locals.pb)

    if (!stripeSettings.isConfigured) {
      return handleDevModeCheckout(locals.pb, edition, data, pkg, url.origin, rawData)
    }

    return handleStripeCheckout(
      stripeSettings.stripeSecretKey,
      edition,
      data,
      pkg,
      url.origin,
      rawData,
      stripeSettings.stripeApiBase || undefined
    )
  }
}

async function handleDevModeCheckout(
  pb: PocketBase,
  edition: EditionInfo,
  data: CheckoutData,
  pkg: SponsorPackage,
  origin: string,
  rawData: RawFormData
) {
  try {
    const sponsorId = await createSponsorWithoutPayment(
      pb,
      edition,
      data,
      pkg.id,
      pkg.price,
      origin
    )
    throw redirect(302, `/sponsor/${edition.slug}/success?sponsor=${sponsorId}`)
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err
    console.error('Failed to create sponsor:', err)
    return fail(500, { error: 'Failed to process registration', values: rawData })
  }
}

async function handleStripeCheckout(
  stripeKey: string,
  edition: EditionInfo,
  data: CheckoutData,
  pkg: SponsorPackage,
  origin: string,
  rawData: RawFormData,
  apiBase?: string
) {
  try {
    const sessionUrl = await createStripeSession(stripeKey, edition, data, pkg, origin, apiBase)
    throw redirect(302, sessionUrl)
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err
    console.error('Failed to create Stripe session:', err)
    return fail(500, { error: 'Failed to process payment', values: rawData })
  }
}
