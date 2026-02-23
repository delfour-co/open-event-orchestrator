import { canAccessSettings } from '$lib/server/permissions'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
  const userRole = locals.user?.role as string | undefined
  if (!canAccessSettings(userRole)) {
    throw error(403, 'You do not have permission to access edition settings')
  }

  try {
    const edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${params.editionSlug}"`, {
        expand: 'eventId'
      })

    const eventRecord = edition.expand?.eventId as Record<string, unknown> | undefined
    const eventName = eventRecord ? (eventRecord.name as string) : 'Unknown Event'
    const organizationId = eventRecord ? (eventRecord.organizationId as string) : ''

    let organization = {
      name: '',
      legalName: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      website: '',
      siret: '',
      vatNumber: '',
      legalForm: '',
      rcsNumber: '',
      shareCapital: ''
    }

    if (organizationId) {
      try {
        const org = await locals.pb.collection('organizations').getOne(organizationId)
        organization = {
          name: (org.name as string) || '',
          legalName: (org.legalName as string) || '',
          address: (org.address as string) || '',
          city: (org.city as string) || '',
          postalCode: (org.postalCode as string) || '',
          country: (org.country as string) || '',
          website: (org.website as string) || '',
          siret: (org.siret as string) || '',
          vatNumber: (org.vatNumber as string) || '',
          legalForm: (org.legalForm as string) || '',
          rcsNumber: (org.rcsNumber as string) || '',
          shareCapital: (org.shareCapital as string) || ''
        }
      } catch {
        // Organization not found, keep defaults
      }
    }

    return {
      edition: {
        id: edition.id as string,
        name: edition.name as string,
        slug: edition.slug as string,
        startDate: new Date(edition.startDate as string),
        endDate: new Date(edition.endDate as string),
        venue: (edition.venue as string) || '',
        city: (edition.city as string) || '',
        eventName,
        termsOfSale: (edition.termsOfSale as string) || '',
        codeOfConduct: (edition.codeOfConduct as string) || '',
        privacyPolicy: (edition.privacyPolicy as string) || ''
      },
      organization
    }
  } catch {
    throw redirect(303, `/admin/editions/${params.editionSlug}/settings`)
  }
}

export const actions: Actions = {
  save: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify edition settings' })
    }

    const formData = await request.formData()
    const field = formData.get('field') as string
    const content = (formData.get('content') as string) || ''

    const validFields = ['termsOfSale', 'codeOfConduct', 'privacyPolicy']
    if (!validFields.includes(field)) {
      return fail(400, { error: 'Invalid field' })
    }

    try {
      const edition = await locals.pb
        .collection('editions')
        .getFirstListItem(`slug="${params.editionSlug}"`)

      await locals.pb.collection('editions').update(edition.id, {
        [field]: content || null
      })

      return { success: true, savedField: field }
    } catch (e) {
      console.error('Failed to update legal document:', e)
      return fail(500, { error: 'Failed to update legal document' })
    }
  }
}
