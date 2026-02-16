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
  contactPhone: z.string().max(50).optional()
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
}

async function getEditionInfo(pb: PocketBase, editionSlug: string): Promise<EditionInfo | null> {
  const editions = await pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) return null

  const record = editions.items[0]
  let eventName = record.name as string

  try {
    if (record.eventId) {
      const event = await pb.collection('events').getOne(record.eventId as string)
      eventName = event.name as string
    }
  } catch {
    // Use edition name as fallback
  }

  return {
    id: record.id as string,
    name: record.name as string,
    slug: record.slug as string,
    eventName,
    organizationId: record.organizationId as string
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
    contactPhone: data.contactPhone || undefined
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
    }
  }

  return editionSponsor.id
}

async function createStripeSession(
  stripeKey: string,
  edition: EditionInfo,
  data: CheckoutData,
  pkg: SponsorPackage,
  origin: string
): Promise<string> {
  const Stripe = (await import('stripe')).default
  const stripeClient = new Stripe(stripeKey)

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
      contactPhone: data.contactPhone || ''
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
      contactPhone: formData.get('contactPhone') as string
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
      rawData
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
  rawData: RawFormData
) {
  try {
    const sessionUrl = await createStripeSession(stripeKey, edition, data, pkg, origin)
    throw redirect(302, sessionUrl)
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) throw err
    console.error('Failed to create Stripe session:', err)
    return fail(500, { error: 'Failed to process payment', values: rawData })
  }
}
