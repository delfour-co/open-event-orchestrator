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
import { getSmtpSettings, getStripeSettings } from '$lib/server/app-settings'
import { json } from '@sveltejs/kit'
import type PocketBase from 'pocketbase'
import type { RequestHandler } from './$types'

interface SponsorMetadata {
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
}

async function getEventName(pb: PocketBase, editionId: string): Promise<string> {
  const edition = await pb.collection('editions').getOne(editionId)
  let eventName = edition.name as string

  try {
    if (edition.eventId) {
      const event = await pb.collection('events').getOne(edition.eventId as string)
      eventName = event.name as string
    }
  } catch {
    // Use edition name as fallback
  }

  return eventName
}

async function createSponsorFromSession(
  pb: PocketBase,
  metadata: SponsorMetadata,
  origin: string
): Promise<void> {
  const edition = await pb.collection('editions').getOne(metadata.editionId)
  const organizationId = edition.organizationId as string
  const eventName = await getEventName(pb, metadata.editionId)

  const packageRepo = createPackageRepository(pb)
  const pkg = await packageRepo.findById(metadata.packageId)

  if (!pkg) {
    throw new Error(`Package not found: ${metadata.packageId}`)
  }

  const sponsorRepo = createSponsorRepository(pb)
  const editionSponsorRepo = createEditionSponsorRepository(pb)

  const sponsor = await sponsorRepo.create({
    organizationId,
    name: metadata.companyName,
    website: metadata.website || undefined,
    description: metadata.description || undefined,
    contactName: metadata.contactName,
    contactEmail: metadata.contactEmail,
    contactPhone: metadata.contactPhone || undefined
  })

  const editionSponsor = await editionSponsorRepo.create({
    editionId: metadata.editionId,
    sponsorId: sponsor.id,
    packageId: metadata.packageId,
    status: 'confirmed',
    confirmedAt: new Date(),
    paidAt: new Date(),
    amount: pkg.price
  })

  const tokenService = createSponsorTokenService(pb)
  const portalUrl = await tokenService.generatePortalLink(
    editionSponsor.id,
    metadata.editionSlug,
    origin
  )

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
      await sponsorEmailService.sendPortalInvitation(expandedEditionSponsor, portalUrl, eventName)
    }
  }

  console.log(`Sponsor created via webhook: ${sponsor.name} (${sponsor.id})`)
}

export const POST: RequestHandler = async ({ request, locals, url }) => {
  const stripeSettings = await getStripeSettings(locals.pb)

  if (!stripeSettings.isConfigured) {
    return json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(stripeSettings.stripeSecretKey)
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeSettings.stripeWebhookSecret
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const metadata = session.metadata as unknown as SponsorMetadata | undefined

      if (metadata?.type === 'sponsor_package') {
        await createSponsorFromSession(locals.pb, metadata, url.origin)
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      const metadata = session.metadata as unknown as SponsorMetadata | undefined

      if (metadata?.type === 'sponsor_package') {
        console.log('Sponsor checkout session expired:', session.id)
      }
    }

    return json({ received: true })
  } catch (err) {
    console.error('Sponsor webhook error:', err)
    return json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
