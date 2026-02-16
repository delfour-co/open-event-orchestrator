import {
  createEditionSponsorRepository,
  createPackageRepository
} from '$lib/features/sponsoring/infra'
import { getStripeSettings } from '$lib/server/app-settings'
import { error } from '@sveltejs/kit'
import type PocketBase from 'pocketbase'
import type { PageServerLoad } from './$types'

interface SponsorInfo {
  companyName: string
  packageName: string
  contactEmail: string
}

async function getSponsorInfoById(pb: PocketBase, sponsorId: string): Promise<SponsorInfo | null> {
  try {
    const editionSponsorRepo = createEditionSponsorRepository(pb)
    const editionSponsor = await editionSponsorRepo.findByIdWithExpand(sponsorId)

    if (editionSponsor?.sponsor) {
      return {
        companyName: editionSponsor.sponsor.name,
        packageName: editionSponsor.package?.name || 'Sponsorship Package',
        contactEmail: editionSponsor.sponsor.contactEmail || ''
      }
    }
  } catch (err) {
    console.error('Failed to get sponsor info:', err)
  }
  return null
}

async function getSponsorInfoFromSession(
  pb: PocketBase,
  sessionId: string,
  secretKey: string
): Promise<SponsorInfo | null> {
  try {
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.status !== 'complete' || !session.metadata) {
      return null
    }

    const info: SponsorInfo = {
      companyName: session.metadata.companyName || 'Your Company',
      packageName: 'Sponsorship Package',
      contactEmail: session.metadata.contactEmail || session.customer_email || ''
    }

    if (session.metadata.packageId) {
      const packageRepo = createPackageRepository(pb)
      const pkg = await packageRepo.findById(session.metadata.packageId)
      if (pkg) {
        info.packageName = pkg.name
      }
    }

    return info
  } catch (err) {
    console.error('Failed to retrieve Stripe session:', err)
    return null
  }
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const { editionSlug } = params
  const sessionId = url.searchParams.get('session_id')
  const sponsorId = url.searchParams.get('sponsor')

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const editionRecord = editions.items[0]

  let eventName = editionRecord.name as string
  try {
    if (editionRecord.eventId) {
      const event = await locals.pb.collection('events').getOne(editionRecord.eventId as string)
      eventName = event.name as string
    }
  } catch {
    // Use edition name as fallback
  }

  let sponsorInfo: SponsorInfo | null = null

  if (sponsorId) {
    sponsorInfo = await getSponsorInfoById(locals.pb, sponsorId)
  }

  if (sessionId && !sponsorInfo) {
    const stripeSettings = await getStripeSettings(locals.pb)
    if (stripeSettings.isConfigured) {
      sponsorInfo = await getSponsorInfoFromSession(
        locals.pb,
        sessionId,
        stripeSettings.stripeSecretKey
      )
    }
  }

  return {
    edition: {
      name: editionRecord.name as string,
      slug: editionRecord.slug as string
    },
    eventName,
    sponsorInfo
  }
}
