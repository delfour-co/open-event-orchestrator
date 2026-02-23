import { env } from '$env/dynamic/public'
import { getNextCreditNoteNumber } from '$lib/features/billing/services/invoice-number-service'
import { recordCreditNote } from '$lib/features/budget/services'
import { createSmtpEmailService } from '$lib/features/cfp/services'
import type { SponsorStatus } from '$lib/features/sponsoring/domain'
import {
  createEditionSponsorRepository,
  createPackageRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import {
  createSponsorEmailService,
  createSponsorTokenService
} from '$lib/features/sponsoring/services'
import { generateSponsorCreditNotePdf } from '$lib/features/sponsoring/services/sponsor-credit-note-service'
import { getPaymentProvider } from '$lib/features/billing/services/payment-providers/factory'
import { getSmtpSettings } from '$lib/server/app-settings'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Get organization for sponsor management
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)
  const organizationId = event.organizationId as string

  const sponsorRepo = createSponsorRepository(locals.pb)
  const packageRepo = createPackageRepository(locals.pb)
  const editionSponsorRepo = createEditionSponsorRepository(locals.pb)

  const [sponsors, packages, editionSponsors, stats] = await Promise.all([
    sponsorRepo.findByOrganization(organizationId),
    packageRepo.findByEdition(editionId),
    editionSponsorRepo.findByEditionWithExpand(editionId),
    editionSponsorRepo.getStats(editionId)
  ])

  // Build logo URLs for sponsors
  const sponsorsWithLogos = sponsors.map((s) => ({
    ...s,
    logoUrl: sponsorRepo.getLogoThumbUrl(s, '100x100')
  }))

  // Build logo URLs for edition sponsors
  const editionSponsorsWithLogos = editionSponsors.map((es) => ({
    ...es,
    sponsor: es.sponsor
      ? {
          ...es.sponsor,
          logoUrl: es.sponsor.logo ? sponsorRepo.getLogoThumbUrl(es.sponsor, '100x100') : null
        }
      : undefined
  }))

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    organizationId,
    sponsors: sponsorsWithLogos,
    packages,
    editionSponsors: editionSponsorsWithLogos,
    stats
  }
}

export const actions: Actions = {
  createSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const organizationId = formData.get('organizationId') as string
    const name = formData.get('name') as string
    const website = formData.get('website') as string
    const contactName = formData.get('contactName') as string
    const contactEmail = formData.get('contactEmail') as string
    const contactPhone = formData.get('contactPhone') as string
    const description = formData.get('description') as string
    const notes = formData.get('notes') as string
    const legalName = formData.get('legalName') as string
    const vatNumber = formData.get('vatNumber') as string
    const siret = formData.get('siret') as string
    const billingAddress = formData.get('billingAddress') as string
    const billingCity = formData.get('billingCity') as string
    const billingPostalCode = formData.get('billingPostalCode') as string
    const billingCountry = formData.get('billingCountry') as string

    if (!organizationId) {
      return fail(400, { error: 'Organization ID is required', action: 'createSponsor' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'createSponsor' })
    }

    try {
      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.create({
        organizationId,
        name: name.trim(),
        website: website?.trim() || undefined,
        contactName: contactName?.trim() || undefined,
        contactEmail: contactEmail?.trim() || undefined,
        contactPhone: contactPhone?.trim() || undefined,
        description: description?.trim() || undefined,
        notes: notes?.trim() || undefined,
        legalName: legalName?.trim() || undefined,
        vatNumber: vatNumber?.trim() || undefined,
        siret: siret?.trim() || undefined,
        billingAddress: billingAddress?.trim() || undefined,
        billingCity: billingCity?.trim() || undefined,
        billingPostalCode: billingPostalCode?.trim() || undefined,
        billingCountry: billingCountry?.trim() || undefined
      })

      return { success: true, action: 'createSponsor' }
    } catch (err) {
      console.error('Failed to create sponsor:', err)
      return fail(500, { error: 'Failed to create sponsor', action: 'createSponsor' })
    }
  },

  updateSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const website = formData.get('website') as string
    const contactName = formData.get('contactName') as string
    const contactEmail = formData.get('contactEmail') as string
    const contactPhone = formData.get('contactPhone') as string
    const description = formData.get('description') as string
    const notes = formData.get('notes') as string
    const legalName = formData.get('legalName') as string
    const vatNumber = formData.get('vatNumber') as string
    const siret = formData.get('siret') as string
    const billingAddress = formData.get('billingAddress') as string
    const billingCity = formData.get('billingCity') as string
    const billingPostalCode = formData.get('billingPostalCode') as string
    const billingCountry = formData.get('billingCountry') as string

    if (!id) {
      return fail(400, { error: 'Sponsor ID is required', action: 'updateSponsor' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'updateSponsor' })
    }

    try {
      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.update(id, {
        name: name.trim(),
        website: website?.trim() || undefined,
        contactName: contactName?.trim() || undefined,
        contactEmail: contactEmail?.trim() || undefined,
        contactPhone: contactPhone?.trim() || undefined,
        description: description?.trim() || undefined,
        notes: notes?.trim() || undefined,
        legalName: legalName?.trim() || undefined,
        vatNumber: vatNumber?.trim() || undefined,
        siret: siret?.trim() || undefined,
        billingAddress: billingAddress?.trim() || undefined,
        billingCity: billingCity?.trim() || undefined,
        billingPostalCode: billingPostalCode?.trim() || undefined,
        billingCountry: billingCountry?.trim() || undefined
      })

      return { success: true, action: 'updateSponsor' }
    } catch (err) {
      console.error('Failed to update sponsor:', err)
      return fail(500, { error: 'Failed to update sponsor', action: 'updateSponsor' })
    }
  },

  deleteSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Sponsor ID is required', action: 'deleteSponsor' })
    }

    try {
      // Check if sponsor has edition links
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      const links = await editionSponsorRepo.findBySponsor(id)

      if (links.length > 0) {
        return fail(400, {
          error: 'Cannot delete a sponsor that is linked to editions. Remove the links first.',
          action: 'deleteSponsor'
        })
      }

      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.delete(id)

      return { success: true, action: 'deleteSponsor' }
    } catch (err) {
      console.error('Failed to delete sponsor:', err)
      return fail(500, { error: 'Failed to delete sponsor', action: 'deleteSponsor' })
    }
  },

  addSponsorToEdition: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionId = formData.get('editionId') as string
    const sponsorId = formData.get('sponsorId') as string
    const packageId = formData.get('packageId') as string
    const status = (formData.get('status') as SponsorStatus) || 'prospect'
    const amount = formData.get('amount') as string
    const notes = formData.get('notes') as string

    if (!editionId || !sponsorId) {
      return fail(400, {
        error: 'Edition and sponsor IDs are required',
        action: 'addSponsorToEdition'
      })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)

      // Check if sponsor is already linked
      const existing = await editionSponsorRepo.findByEditionAndSponsor(editionId, sponsorId)
      if (existing) {
        return fail(400, {
          error: 'Sponsor is already added to this edition',
          action: 'addSponsorToEdition'
        })
      }

      await editionSponsorRepo.create({
        editionId,
        sponsorId,
        packageId: packageId || undefined,
        status,
        amount: amount ? Number(amount) : undefined,
        notes: notes?.trim() || undefined
      })

      return { success: true, action: 'addSponsorToEdition' }
    } catch (err) {
      console.error('Failed to add sponsor to edition:', err)
      return fail(500, { error: 'Failed to add sponsor to edition', action: 'addSponsorToEdition' })
    }
  },

  updateEditionSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const packageId = formData.get('packageId') as string
    const status = formData.get('status') as SponsorStatus
    const amount = formData.get('amount') as string
    const notes = formData.get('notes') as string
    const paidAt = formData.get('paidAt') as string

    if (!id) {
      return fail(400, { error: 'Edition sponsor ID is required', action: 'updateEditionSponsor' })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      await editionSponsorRepo.update(id, {
        packageId: packageId || undefined,
        status,
        amount: amount ? Number(amount) : undefined,
        notes: notes?.trim() || undefined,
        paidAt: paidAt ? new Date(paidAt) : undefined
      })

      return { success: true, action: 'updateEditionSponsor' }
    } catch (err) {
      console.error('Failed to update edition sponsor:', err)
      return fail(500, {
        error: 'Failed to update edition sponsor',
        action: 'updateEditionSponsor'
      })
    }
  },

  updateStatus: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const status = formData.get('status') as SponsorStatus

    if (!id || !status) {
      return fail(400, { error: 'ID and status are required', action: 'updateStatus' })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      await editionSponsorRepo.updateStatus(id, status)

      return { success: true, action: 'updateStatus' }
    } catch (err) {
      console.error('Failed to update status:', err)
      return fail(500, { error: 'Failed to update status', action: 'updateStatus' })
    }
  },

  removeFromEdition: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Edition sponsor ID is required', action: 'removeFromEdition' })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      await editionSponsorRepo.delete(id)

      return { success: true, action: 'removeFromEdition' }
    } catch (err) {
      console.error('Failed to remove sponsor from edition:', err)
      return fail(500, {
        error: 'Failed to remove sponsor from edition',
        action: 'removeFromEdition'
      })
    }
  },

  refundSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Edition sponsor ID is required', action: 'refundSponsor' })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      const editionSponsor = await editionSponsorRepo.findByIdWithExpand(id)

      if (!editionSponsor) {
        return fail(404, { error: 'Sponsor not found', action: 'refundSponsor' })
      }

      if (editionSponsor.status !== 'confirmed') {
        return fail(400, {
          error: 'Only confirmed sponsors can be refunded',
          action: 'refundSponsor'
        })
      }

      if (!editionSponsor.paidAt) {
        return fail(400, { error: 'Sponsor has not been paid yet', action: 'refundSponsor' })
      }

      // Refund via payment provider if payment reference exists
      if (editionSponsor.stripePaymentIntentId) {
        try {
          const provider = await getPaymentProvider(locals.pb)
          if (provider.type !== 'none') {
            await provider.createRefund(editionSponsor.stripePaymentIntentId)
            console.log(
              `[refund-sponsor] Refund created for: ${editionSponsor.stripePaymentIntentId}`
            )
          }
        } catch (refundErr) {
          console.error('[refund-sponsor] Payment provider refund failed:', refundErr)
        }
      }

      // Update status to refunded
      await editionSponsorRepo.update(id, { status: 'refunded' })
      console.log(`[refund-sponsor] Status updated to refunded for: ${id}`)

      // Get organization info for credit note
      const edition = await locals.pb.collection('editions').getOne(editionSponsor.editionId)
      const event = await locals.pb.collection('events').getOne(edition.eventId as string)
      const organizationId = event.organizationId as string
      const eventName = event.name as string
      const organization = await locals.pb.collection('organizations').getOne(organizationId)
      const vatRate = (organization.vatRate as number) ?? 20
      const seller = {
        name: organization.name as string,
        legalName: (organization.legalName as string) || undefined,
        legalForm: (organization.legalForm as string) || undefined,
        rcsNumber: (organization.rcsNumber as string) || undefined,
        shareCapital: (organization.shareCapital as string) || undefined,
        siret: (organization.siret as string) || undefined,
        vatNumber: (organization.vatNumber as string) || undefined,
        address: (organization.address as string) || undefined,
        city: (organization.city as string) || undefined,
        postalCode: (organization.postalCode as string) || undefined,
        country: (organization.country as string) || undefined,
        contactEmail: (organization.contactEmail as string) || undefined
      }

      // Generate credit note PDF
      const now = new Date()
      const creditNoteNumber = await getNextCreditNoteNumber(locals.pb, organizationId)

      const invoiceDate = editionSponsor.paidAt
        ? editionSponsor.paidAt.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'N/A'

      const pdfBytes = await generateSponsorCreditNotePdf({
        creditNoteNumber,
        creditNoteDate: now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        originalInvoiceNumber: editionSponsor.invoiceNumber || 'N/A',
        originalInvoiceDate: invoiceDate,
        eventName,
        sponsorName: editionSponsor.sponsor?.name || 'Sponsor',
        legalName: editionSponsor.sponsor?.legalName,
        vatNumber: editionSponsor.sponsor?.vatNumber,
        siret: editionSponsor.sponsor?.siret,
        billingAddress: editionSponsor.sponsor?.billingAddress,
        billingCity: editionSponsor.sponsor?.billingCity,
        billingPostalCode: editionSponsor.sponsor?.billingPostalCode,
        billingCountry: editionSponsor.sponsor?.billingCountry,
        packageName: editionSponsor.package?.name || 'Sponsorship',
        amount: editionSponsor.amount || 0,
        currency: editionSponsor.package?.currency || 'EUR',
        vatRate,
        seller
      })
      console.log(`[refund-sponsor] Credit note generated: ${creditNoteNumber}`)

      // Record credit note in budget
      await recordCreditNote({
        pb: locals.pb,
        editionId: editionSponsor.editionId,
        description: `Refund: ${editionSponsor.sponsor?.name || 'Sponsor'} - ${editionSponsor.package?.name || 'Sponsorship'}`,
        amount: editionSponsor.amount || 0,
        creditNoteNumber,
        pdfBytes,
        vendor: editionSponsor.sponsor?.name,
        source: 'sponsoring'
      }).catch((err) => console.error('[refund-sponsor] Budget integration failed:', err))

      // Send refund email
      const smtpSettings = await getSmtpSettings(locals.pb)
      if (smtpSettings.smtpEnabled) {
        const emailService = createSmtpEmailService({
          host: smtpSettings.smtpHost,
          port: smtpSettings.smtpPort,
          user: smtpSettings.smtpUser || undefined,
          pass: smtpSettings.smtpPass || undefined,
          from: smtpSettings.smtpFrom
        })
        const sponsorEmailService = createSponsorEmailService(emailService)
        const refundEmailResult = await sponsorEmailService.sendRefundEmail(
          editionSponsor,
          eventName,
          pdfBytes
        )
        console.log(
          `[refund-sponsor] Refund email: ${refundEmailResult.success ? 'sent' : `failed - ${refundEmailResult.error}`}`
        )
      }

      return { success: true, action: 'refundSponsor' }
    } catch (err) {
      console.error('Failed to refund sponsor:', err)
      return fail(500, { error: 'Failed to refund sponsor', action: 'refundSponsor' })
    }
  },

  generatePortalLink: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const editionSponsorId = formData.get('editionSponsorId') as string

    if (!editionSponsorId) {
      return fail(400, { error: 'Edition sponsor ID is required', action: 'generatePortalLink' })
    }

    try {
      const tokenService = createSponsorTokenService(locals.pb)
      const baseUrl =
        env.PUBLIC_POCKETBASE_URL?.replace(':8090', ':5173') || 'http://localhost:5173'
      const portalUrl = await tokenService.generatePortalLink(
        editionSponsorId,
        params.editionSlug,
        baseUrl
      )

      return { success: true, action: 'generatePortalLink', portalUrl }
    } catch (err) {
      console.error('Failed to generate portal link:', err)
      return fail(500, { error: 'Failed to generate portal link', action: 'generatePortalLink' })
    }
  }
}
