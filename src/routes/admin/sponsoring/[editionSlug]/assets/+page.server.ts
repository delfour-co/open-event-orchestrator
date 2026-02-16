import type { SponsorAssetCategory, SponsorAssetWithUrl } from '$lib/features/sponsoring/domain'
import {
  createEditionSponsorRepository,
  createSponsorAssetRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export interface SponsorAssets {
  editionSponsorId: string
  sponsorId: string
  sponsorName: string
  sponsorLogo: string | null
  packageName: string | null
  assets: SponsorAssetWithUrl[]
}

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

  const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
  const sponsorRepo = createSponsorRepository(locals.pb)
  const assetRepo = createSponsorAssetRepository(locals.pb)

  const editionSponsors = await editionSponsorRepo.findByEditionWithExpand(editionId)
  const confirmedSponsors = editionSponsors.filter((es) => es.status === 'confirmed')

  const sponsorAssets: SponsorAssets[] = []

  for (const editionSponsor of confirmedSponsors) {
    const assets = await assetRepo.findByEditionSponsor(editionSponsor.id)

    const assetsWithUrls: SponsorAssetWithUrl[] = assets.map((asset) => ({
      ...asset,
      fileUrl: assetRepo.getFileUrl(asset),
      thumbUrl:
        asset.mimeType.startsWith('image/') && asset.mimeType !== 'image/svg+xml'
          ? assetRepo.getThumbUrl(asset, '200x200')
          : undefined
    }))

    sponsorAssets.push({
      editionSponsorId: editionSponsor.id,
      sponsorId: editionSponsor.sponsorId,
      sponsorName: editionSponsor.sponsor?.name || 'Unknown Sponsor',
      sponsorLogo: editionSponsor.sponsor
        ? sponsorRepo.getLogoThumbUrl(editionSponsor.sponsor, '100x100')
        : null,
      packageName: editionSponsor.package?.name || null,
      assets: assetsWithUrls
    })
  }

  const sortedSponsorAssets = sponsorAssets.sort((a, b) =>
    a.sponsorName.localeCompare(b.sponsorName)
  )

  const totalAssets = sortedSponsorAssets.reduce((sum, sa) => sum + sa.assets.length, 0)

  const assetsByCategory: Record<SponsorAssetCategory, number> = {
    logo_color: 0,
    logo_mono: 0,
    logo_light: 0,
    logo_dark: 0,
    visual: 0,
    document: 0
  }

  for (const sa of sortedSponsorAssets) {
    for (const asset of sa.assets) {
      assetsByCategory[asset.category]++
    }
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    sponsorAssets: sortedSponsorAssets,
    totalAssets,
    assetsByCategory,
    sponsorCount: sortedSponsorAssets.length
  }
}
