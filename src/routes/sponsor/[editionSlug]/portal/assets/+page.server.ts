import type { SponsorAssetCategory, SponsorAssetWithUrl } from '$lib/features/sponsoring/domain'
import { createEditionSponsorRepository } from '$lib/features/sponsoring/infra'
import {
  createSponsorAssetService,
  createSponsorTokenService
} from '$lib/features/sponsoring/services'
import { getSponsorToken } from '$lib/server/token-cookies'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url, locals, cookies }) => {
  const { editionSlug } = params
  const token = getSponsorToken(cookies, url, editionSlug)

  if (!token) {
    throw error(400, 'Token is required')
  }

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  const tokenService = createSponsorTokenService(locals.pb)
  const result = await tokenService.validateToken(token)

  if (!result.valid || !result.editionSponsor) {
    throw error(403, result.error || 'Invalid or expired token')
  }

  const assetService = createSponsorAssetService(locals.pb)
  const assets = await assetService.getAssetsByEditionSponsor(result.editionSponsor.id)

  const assetsWithUrls: SponsorAssetWithUrl[] = assets.map((asset) => ({
    ...asset,
    fileUrl: assetService.getFileUrl(asset),
    thumbUrl:
      asset.mimeType.startsWith('image/') && asset.mimeType !== 'image/svg+xml'
        ? assetService.getThumbUrl(asset, '200x200')
        : undefined
  }))

  return {
    token,
    edition: {
      id: edition.id as string,
      name: edition.name as string,
      slug: edition.slug as string,
      year: edition.year as number
    },
    event: {
      name: event.name as string
    },
    editionSponsorId: result.editionSponsor.id,
    sponsorName: result.editionSponsor.sponsor?.name || 'Sponsor',
    assets: assetsWithUrls
  }
}

export const actions: Actions = {
  upload: async ({ request, url, locals, cookies, params }) => {
    const formData = await request.formData()
    const token =
      getSponsorToken(cookies, url, params.editionSlug) || (formData.get('token') as string)
    const category = formData.get('category') as SponsorAssetCategory
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const usage = formData.get('usage') as string
    const file = formData.get('file') as File

    if (!token) {
      return fail(400, { error: 'Token is required', action: 'upload' })
    }

    if (!file || file.size === 0) {
      return fail(400, { error: 'File is required', action: 'upload' })
    }

    if (!category) {
      return fail(400, { error: 'Category is required', action: 'upload' })
    }

    if (!name?.trim()) {
      return fail(400, { error: 'Name is required', action: 'upload' })
    }

    const tokenService = createSponsorTokenService(locals.pb)
    const result = await tokenService.validateToken(token)

    if (!result.valid || !result.editionSponsor) {
      return fail(403, { error: 'Invalid or expired token', action: 'upload' })
    }

    try {
      const assetService = createSponsorAssetService(locals.pb)

      const validation = assetService.validateFile(file)
      if (!validation.valid) {
        return fail(400, { error: validation.error, action: 'upload' })
      }

      await assetService.uploadAsset(
        {
          editionSponsorId: result.editionSponsor.id,
          category,
          name: name.trim(),
          description: description?.trim() || undefined,
          usage: usage?.trim() || undefined
        },
        file
      )

      return { success: true, action: 'upload' }
    } catch (err) {
      console.error('Failed to upload asset:', err)
      return fail(500, { error: 'Failed to upload asset', action: 'upload' })
    }
  },

  update: async ({ request, url, locals, cookies, params }) => {
    const formData = await request.formData()
    const token =
      getSponsorToken(cookies, url, params.editionSlug) || (formData.get('token') as string)
    const assetId = formData.get('assetId') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as SponsorAssetCategory
    const usage = formData.get('usage') as string

    if (!token) {
      return fail(400, { error: 'Token is required', action: 'update' })
    }

    if (!assetId) {
      return fail(400, { error: 'Asset ID is required', action: 'update' })
    }

    const tokenService = createSponsorTokenService(locals.pb)
    const result = await tokenService.validateToken(token)

    if (!result.valid || !result.editionSponsor) {
      return fail(403, { error: 'Invalid or expired token', action: 'update' })
    }

    try {
      const assetService = createSponsorAssetService(locals.pb)
      const asset = await assetService.getAssetById(assetId)

      if (!asset || asset.editionSponsorId !== result.editionSponsor.id) {
        return fail(404, { error: 'Asset not found', action: 'update' })
      }

      await assetService.updateAsset(assetId, {
        name: name?.trim() || undefined,
        description: description?.trim() || undefined,
        category: category || undefined,
        usage: usage?.trim() || undefined
      })

      return { success: true, action: 'update' }
    } catch (err) {
      console.error('Failed to update asset:', err)
      return fail(500, { error: 'Failed to update asset', action: 'update' })
    }
  },

  delete: async ({ request, url, locals, cookies, params }) => {
    const formData = await request.formData()
    const token =
      getSponsorToken(cookies, url, params.editionSlug) || (formData.get('token') as string)
    const assetId = formData.get('assetId') as string

    if (!token) {
      return fail(400, { error: 'Token is required', action: 'delete' })
    }

    if (!assetId) {
      return fail(400, { error: 'Asset ID is required', action: 'delete' })
    }

    const tokenService = createSponsorTokenService(locals.pb)
    const result = await tokenService.validateToken(token)

    if (!result.valid || !result.editionSponsor) {
      return fail(403, { error: 'Invalid or expired token', action: 'delete' })
    }

    try {
      const assetService = createSponsorAssetService(locals.pb)
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)

      const asset = await assetService.getAssetById(assetId)

      if (!asset) {
        return fail(404, { error: 'Asset not found', action: 'delete' })
      }

      const editionSponsor = await editionSponsorRepo.findById(asset.editionSponsorId)
      if (!editionSponsor || editionSponsor.id !== result.editionSponsor.id) {
        return fail(403, { error: 'Unauthorized', action: 'delete' })
      }

      await assetService.deleteAsset(assetId)

      return { success: true, action: 'delete' }
    } catch (err) {
      console.error('Failed to delete asset:', err)
      return fail(500, { error: 'Failed to delete asset', action: 'delete' })
    }
  }
}
